const mysql = require('mysql2/promise');

const config = {
  host: 'qlanka-dbserver.mysql.database.azure.com',
  port: 3306,
  user: 'qlankaadmin',
  password: 'Diabalo666',
  database: 'queue_db',
  multipleStatements: true,
  ssl: {
    rejectUnauthorized: false
  }
};

const sql = `
DROP PROCEDURE IF EXISTS sp_book_token;

DELIMITER $$

CREATE PROCEDURE sp_book_token(
    IN  p_center_id      INT,
    IN  p_user_id        INT,
    IN  p_date           DATE,
    IN  p_time           TIME,
    IN  p_token_number   VARCHAR(50),
    IN  p_capacity       INT,
    OUT p_appointment_id INT,
    OUT p_token_id       INT,
    OUT p_result_code    VARCHAR(50)
)
BEGIN
    DECLARE v_current_count INT DEFAULT 0;
    DECLARE v_has_conflict  INT DEFAULT 0;
    DECLARE v_has_duplicate INT DEFAULT 0;

    SET p_appointment_id = 0;
    SET p_token_id = 0;
    SET p_result_code = 'UNKNOWN_ERROR';

    START TRANSACTION;

    -- Duplicate booking check
    SELECT 1 INTO v_has_duplicate
    FROM tokens
    WHERE center_id = p_center_id
      AND user_id = p_user_id
      AND issued_date = p_date
      AND status != 'Cancelled'
    LIMIT 1
    FOR UPDATE;

    IF v_has_duplicate = 1 THEN
        SET p_result_code = 'DUPLICATE_BOOKING';
        ROLLBACK;
    ELSE
        -- Time-slot conflict check
        SELECT 1 INTO v_has_conflict
        FROM appointments
        WHERE center_id = p_center_id
          AND appointment_date = p_date
          AND appointment_time = p_time
          AND status != 'Cancelled'
        LIMIT 1
        FOR UPDATE;

        IF v_has_conflict = 1 THEN
            SET p_result_code = 'TIME_CONFLICT';
            ROLLBACK;
        ELSE
            -- Capacity check
            SELECT COUNT(*) INTO v_current_count
            FROM tokens
            WHERE center_id = p_center_id
              AND issued_date = p_date
              AND status != 'Cancelled'
            FOR UPDATE;

            IF p_capacity > 0 AND v_current_count >= p_capacity THEN
                SET p_result_code = 'CENTER_FULL';
                ROLLBACK;
            ELSE
                INSERT INTO appointments (center_id, user_id, appointment_date, appointment_time, status)
                VALUES (p_center_id, p_user_id, p_date, p_time, 'Scheduled');
                SET p_appointment_id = LAST_INSERT_ID();

                INSERT INTO tokens (center_id, user_id, appointment_id, token_number, issued_date, status, issued_time)
                VALUES (p_center_id, p_user_id, p_appointment_id, p_token_number, p_date, 'Waiting', UTC_TIMESTAMP());
                SET p_token_id = LAST_INSERT_ID();

                SET p_result_code = 'SUCCESS';
                COMMIT;
            END IF;
        END IF;
    END IF;
END$$

DELIMITER ;
`;

async function run() {
  const connection = await mysql.createConnection(config);
  console.log('Connected to Queue DB ✓');

  // mysql2 can't handle DELIMITER inside query. 
  // We strip them and run the CREATE PROCEDURE body as a "single" query.
  
  const procedureSql = sql
    .replace(/DELIMITER \$\$/g, '')
    .replace(/DELIMITER ;/g, '')
    .trim();

  // Split into DROP and CREATE
  const parts = procedureSql.split('DROP PROCEDURE IF EXISTS sp_book_token;');
  
  console.log('Dropping existing procedure...');
  await connection.query('DROP PROCEDURE IF EXISTS sp_book_token;');
  
  console.log('Creating fixed microservice procedure...');
  const createSql = parts[1].trim().replace(/\$\$$/, ''); // Strip the final $$
  await connection.query(createSql);

  console.log('✓ sp_book_token fixed!');
  await connection.end();
}

run().catch(err => {
  console.error('Fatal:', err.message);
  process.exit(1);
});

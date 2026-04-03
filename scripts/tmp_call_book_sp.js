const mysql = require('mysql2/promise');

async function main() {
  const conn = await mysql.createConnection({
    host: 'qlanka-dbserver.mysql.database.azure.com',
    port: 3306,
    user: 'qlankaadmin',
    password: 'Diabalo666',
    database: 'queue_db',
    ssl: { rejectUnauthorized: false },
    multipleStatements: true,
  });

  const date = process.env.BOOK_DATE || '2026-04-07';
  const time = process.env.BOOK_TIME || '09:00:00';

  const sql = `
SET @p_appointment_id = 0;
SET @p_token_id = 0;
SET @p_result_code = '';
CALL sp_book_token(1, 999999, ?, ?, 'TMP-DEBUG-0001', 120, @p_appointment_id, @p_token_id, @p_result_code);
SELECT @p_appointment_id AS appointmentId, @p_token_id AS tokenId, @p_result_code AS resultCode;
`;

  try {
    const [rows] = await conn.query(sql, [date, time]);
    console.log(JSON.stringify({ ok: true, rows }, null, 2));
  } catch (err) {
    console.log(JSON.stringify({ ok: false, message: err.message, code: err.code, errno: err.errno, sqlState: err.sqlState }, null, 2));
  } finally {
    await conn.end();
  }
}

main().catch((err) => {
  console.error(JSON.stringify({ fatal: err.message }, null, 2));
  process.exit(1);
});

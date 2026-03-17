-- QueueLanka Queue Service — Database Schema
-- Consolidated from monolith migrations: 004, 005, 006 (partial), 007, 010
--
-- NOTE: This service stores center_id and user_id as plain integers.
-- Cross-service FK enforcement is handled at application level via HTTP calls.

-- ── Appointments ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS appointments (
    appointment_id   INT           AUTO_INCREMENT PRIMARY KEY,
    center_id        INT           NOT NULL,
    user_id          INT           NOT NULL,
    appointment_date DATE          NOT NULL,
    appointment_time TIME          NOT NULL,
    status           ENUM('Scheduled', 'Completed', 'Cancelled', 'NoShow') NOT NULL DEFAULT 'Scheduled',
    created_at       DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at       DATETIME      NULL ON UPDATE CURRENT_TIMESTAMP,

    INDEX idx_center_date_time (center_id, appointment_date, appointment_time),
    INDEX idx_user_appointments (user_id, appointment_date)
);

-- ── Tokens ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS tokens (
    token_id                 INT           AUTO_INCREMENT PRIMARY KEY,
    center_id                INT           NOT NULL,
    user_id                  INT           NULL COMMENT 'Null for walk-ins without accounts',
    appointment_id           INT           NULL COMMENT 'Linked if generated from a booking',
    token_number             VARCHAR(50)   NOT NULL,
    issued_date              DATE          NOT NULL,
    status                   ENUM('Waiting', 'Serving', 'Completed', 'Skipped', 'Cancelled', 'NoShow') NOT NULL DEFAULT 'Waiting',
    issued_time              DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    estimated_service_time   DATETIME      NULL,
    served_time              DATETIME      NULL,
    completed_time           DATETIME      NULL,
    cancelled_at             DATETIME      NULL COMMENT 'Timestamp when the token was cancelled',
    queue_position           INT           NULL COMMENT 'Position when in Waiting status',
    created_at               DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at               DATETIME      NULL ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_token_appointment FOREIGN KEY (appointment_id) REFERENCES appointments(appointment_id) ON DELETE SET NULL,
    CONSTRAINT uk_token_center_date_num UNIQUE KEY (center_id, issued_date, token_number),

    INDEX idx_token_status (status),
    INDEX idx_token_issued_date (center_id, issued_date),
    INDEX idx_token_status_position (center_id, status, queue_position),
    INDEX idx_token_cancelled_at (center_id, issued_date, cancelled_at),
    INDEX idx_token_queue_shift (center_id, issued_date, status, queue_position)
);

-- ── Atomic Booking Stored Procedure ────────────────────────────
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
    DECLARE v_center_exists INT DEFAULT 0;
    DECLARE v_current_count INT DEFAULT 0;
    DECLARE v_has_conflict  INT DEFAULT 0;
    DECLARE v_has_duplicate INT DEFAULT 0;

    SET p_appointment_id = 0;
    SET p_token_id = 0;
    SET p_result_code = 'UNKNOWN_ERROR';

    START TRANSACTION;

    -- Validate center_id exists (via capacity param from ServiceCenter HTTP call)
    -- In microservice architecture, center validation is done via HTTP before calling this SP
    -- but we still check for duplicate bookings and conflicts locally

    -- Duplicate booking check: one active token per user per center per day
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

-- ── Cancel Token + Shift Queue Stored Procedure ────────────────
DROP PROCEDURE IF EXISTS sp_cancel_token_shift_queue;

DELIMITER $$

CREATE PROCEDURE sp_cancel_token_shift_queue(
    IN  p_token_id  INT,
    IN  p_user_id   INT,
    IN  p_is_admin  TINYINT,
    OUT p_success   TINYINT
)
BEGIN
    DECLARE v_center_id      INT;
    DECLARE v_issued_date    DATE;
    DECLARE v_queue_position INT;

    START TRANSACTION;

    SELECT center_id, issued_date, queue_position
    INTO   v_center_id, v_issued_date, v_queue_position
    FROM   tokens
    WHERE  token_id = p_token_id
      AND  (p_is_admin = 1 OR user_id = p_user_id)
      AND  status   = 'Waiting'
    FOR UPDATE;

    IF v_center_id IS NULL THEN
        SET p_success = 0;
        ROLLBACK;
    ELSE
        UPDATE tokens
        SET    status       = 'Cancelled',
               queue_position = NULL,
               cancelled_at = UTC_TIMESTAMP(),
               updated_at   = UTC_TIMESTAMP()
        WHERE  token_id = p_token_id;

        UPDATE tokens
        SET    queue_position = queue_position - 1,
               updated_at    = UTC_TIMESTAMP()
        WHERE  center_id     = v_center_id
          AND  issued_date   = v_issued_date
          AND  status        = 'Waiting'
          AND  queue_position > v_queue_position;

        SET p_success = 1;
        COMMIT;
    END IF;
END$$

DELIMITER ;

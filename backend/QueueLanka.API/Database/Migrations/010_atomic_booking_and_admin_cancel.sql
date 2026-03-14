-- QueueLanka Pro — Atomic Booking & Admin Cancel Override Migration
-- Sprint 3 | SCRUM-FIX

USE queuelanka;

-- ── 1. Atomic Booking Stored Procedure ──────────────────────────────────
-- We encapsulate the core conflict/capacity checks and the multi-table 
-- insert into a single explicit transaction to avoid race conditions.
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
    OUT p_result_code    VARCHAR(50) -- 'SUCCESS', 'CENTER_NOT_FOUND', 'CENTER_FULL', 'TIME_CONFLICT', 'DUPLICATE_BOOKING'
)
BEGIN
    DECLARE v_center_exists INT DEFAULT 0;
    DECLARE v_current_count INT DEFAULT 0;
    DECLARE v_has_conflict  INT DEFAULT 0;
    DECLARE v_has_duplicate INT DEFAULT 0;

    -- Initialize OUT params
    SET p_appointment_id = 0;
    SET p_token_id = 0;
    SET p_result_code = 'UNKNOWN_ERROR';

    -- Start explicit transaction
    START TRANSACTION;

    -- Check if center exists and is active, lock the row
    SELECT 1 INTO v_center_exists
    FROM centers
    WHERE center_id = p_center_id AND is_active = 1
    FOR SHARE; -- Shared lock is sufficient just to confirm existence

    IF v_center_exists = 0 THEN
        SET p_result_code = 'CENTER_NOT_FOUND';
        ROLLBACK;
    ELSE
        -- NEW RULE: Enforce one active token per user per center per day
        SELECT 1 INTO v_has_duplicate
        FROM tokens
        WHERE center_id = p_center_id 
          AND user_id = p_user_id 
          AND issued_date = p_date 
          AND status != 'Cancelled'
        LIMIT 1
        FOR UPDATE; -- Lock to prevent concurrent identical bookings

        IF v_has_duplicate = 1 THEN
            SET p_result_code = 'DUPLICATE_BOOKING';
            ROLLBACK;
        ELSE
            -- Check for exact time-slot conflict
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
                -- Capacity check: how many non-cancelled tokens for this center/day
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
                    -- All checks passed! Proceed with atomic inserts.
                    
                    -- Insert Appointment
                    INSERT INTO appointments (center_id, user_id, appointment_date, appointment_time, status)
                    VALUES (p_center_id, p_user_id, p_date, p_time, 'Scheduled');
                    
                    SET p_appointment_id = LAST_INSERT_ID();

                    -- Insert Token
                    INSERT INTO tokens (center_id, user_id, appointment_id, token_number, issued_date, status, issued_time)
                    VALUES (p_center_id, p_user_id, p_appointment_id, p_token_number, p_date, 'Waiting', UTC_TIMESTAMP());
                    
                    SET p_token_id = LAST_INSERT_ID();

                    SET p_result_code = 'SUCCESS';
                    COMMIT;
                END IF;
            END IF;
        END IF;
    END IF;
END$$

DELIMITER ;


-- ── 2. Admin Cancel Override Stored Procedure ───────────────────────────
-- Modify existing sp_cancel_token_shift_queue to accept p_is_admin.
-- If p_is_admin = 1, it bypasses the token ownership (user_id) check.
DROP PROCEDURE IF EXISTS sp_cancel_token_shift_queue;

DELIMITER $$

CREATE PROCEDURE sp_cancel_token_shift_queue(
    IN  p_token_id  INT,
    IN  p_user_id   INT,
    IN  p_is_admin  TINYINT,  -- NEW: 1 = admin (ignore p_user_id), 0 = normal citizen
    OUT p_success   TINYINT   -- 1 = cancelled, 0 = not eligible
)
BEGIN
    DECLARE v_center_id      INT;
    DECLARE v_issued_date    DATE;
    DECLARE v_queue_position INT;

    START TRANSACTION;

    -- Lock the row we intend to cancel.
    SELECT center_id, issued_date, queue_position
    INTO   v_center_id, v_issued_date, v_queue_position
    FROM   tokens
    WHERE  token_id = p_token_id
      AND  (p_is_admin = 1 OR user_id = p_user_id)  -- Bypasses ownership check if admin
      AND  status   = 'Waiting'
    FOR UPDATE;

    IF v_center_id IS NULL THEN
        SET p_success = 0;
        ROLLBACK;
    ELSE
        -- Mark the token as Cancelled
        UPDATE tokens
        SET    status       = 'Cancelled',
               queue_position = NULL,
               cancelled_at = UTC_TIMESTAMP(),
               updated_at   = UTC_TIMESTAMP()
        WHERE  token_id = p_token_id;

        -- Compact the queue
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

-- QueueLanka Pro — Token Status & Queue Management Schema Update
-- Sprint 3 | SCRUM-56

USE queuelanka;

-- ── 1. Extend Token Status ENUM ────────────────────────────────
-- Add 'NoShow' alongside the existing statuses for consistency with appointment statuses.
ALTER TABLE tokens
MODIFY COLUMN status ENUM('Waiting', 'Serving', 'Completed', 'Skipped', 'Cancelled', 'NoShow')
    NOT NULL DEFAULT 'Waiting';

-- ── 2. Add cancelled_at Timestamp ──────────────────────────────
-- Track the exact moment a token was cancelled.
-- This allows auditing and accurate ETA recalculation for remaining tokens.
ALTER TABLE tokens
ADD COLUMN cancelled_at DATETIME NULL COMMENT 'Timestamp when the token was cancelled or marked NoShow'
    AFTER completed_time;

-- Add an index to support lookups of recently cancelled tokens per center/date.
CREATE INDEX idx_token_cancelled_at ON tokens (center_id, issued_date, cancelled_at);

-- ── 3. Queue Position Shift Stored Procedure ───────────────────
-- Atomically cancel a token (by the owning user) and compact the queue:
-- every Waiting token behind the cancelled one is decremented by 1.
-- Using a stored procedure guarantees atomicity without application-level coordination.
DROP PROCEDURE IF EXISTS sp_cancel_token_shift_queue;

DELIMITER $$

CREATE PROCEDURE sp_cancel_token_shift_queue(
    IN  p_token_id  INT,
    IN  p_user_id   INT,
    OUT p_success   TINYINT   -- 1 = cancelled, 0 = not eligible (wrong owner / not Waiting)
)
BEGIN
    DECLARE v_center_id      INT;
    DECLARE v_issued_date    DATE;
    DECLARE v_queue_position INT;

    -- Start an explicit transaction so the cancel + shift are all-or-nothing.
    START TRANSACTION;

    -- Lock the row we intend to cancel.
    SELECT center_id, issued_date, queue_position
    INTO   v_center_id, v_issued_date, v_queue_position
    FROM   tokens
    WHERE  token_id = p_token_id
      AND  user_id  = p_user_id
      AND  status   = 'Waiting'
    FOR UPDATE;

    IF v_center_id IS NULL THEN
        -- Token did not match: wrong owner, already cancelled, or not Waiting.
        SET p_success = 0;
        ROLLBACK;
    ELSE
        -- Mark the token as Cancelled.
        UPDATE tokens
        SET    status       = 'Cancelled',
               queue_position = NULL,
               cancelled_at = UTC_TIMESTAMP(),
               updated_at   = UTC_TIMESTAMP()
        WHERE  token_id = p_token_id;

        -- Compact the queue: shift all Waiting tokens that were behind this one.
        -- Only shift tokens that had an explicit position assigned.
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

-- ── 4. Supporting Index Additions ──────────────────────────────
-- Ensure efficient range updates when shifting queue positions.
-- The existing idx_token_status_position index (center_id, status, queue_position)
-- already covers the UPDATE in the stored procedure.  Add a narrower one that also
-- filters on issued_date, which is always part of the WHERE clause in the shift UPDATE.
CREATE INDEX idx_token_queue_shift
    ON tokens (center_id, issued_date, status, queue_position);

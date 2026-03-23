-- QueueLanka Queue Service — Counter Schema
-- Migration: 002_counter_schema.sql
--
-- Adds the counters table for physical service windows/desks.
-- Adds called_at column to tokens to record when a token was called.
--
-- NOTE: center_id is stored as a plain integer (no cross-service FK).
--       Cross-service validation is handled at application level via HTTP calls.

-- ── Counters ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS counters (
    counter_id        INT           AUTO_INCREMENT PRIMARY KEY,
    center_id         INT           NOT NULL                      COMMENT 'References service_centers in ServiceCenter service',
    name              VARCHAR(100)  NOT NULL                      COMMENT 'Human-readable label, e.g. "Counter 1", "Window A"',
    status            ENUM('Open', 'Closed', 'Paused')
                                    NOT NULL DEFAULT 'Closed'     COMMENT 'Open = actively calling tokens; Closed = not in use',
    current_token_id  INT           NULL                          COMMENT 'FK to tokens.token_id — the token currently being served',
    created_at        DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at        DATETIME      NULL     ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_counter_current_token
        FOREIGN KEY (current_token_id) REFERENCES tokens(token_id) ON DELETE SET NULL,

    INDEX idx_counter_center   (center_id),
    INDEX idx_counter_status   (center_id, status)
);

-- ── Add called_at to tokens (idempotent) ────────────────────────
-- Records the UTC timestamp when an officer called this token at a counter.
-- This column may already exist if this migration was partially applied.

ALTER TABLE tokens
    ADD COLUMN called_at DATETIME NULL
        COMMENT 'UTC timestamp when the token was called by an officer'
        AFTER cancelled_at;

-- Index to support efficient queue-management queries (e.g. live-queue dashboards)
-- Use a safe CREATE INDEX pattern via a stored procedure for idempotency.
DROP PROCEDURE IF EXISTS sp_add_idx_token_called_at;

DELIMITER $$

CREATE PROCEDURE sp_add_idx_token_called_at()
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM   information_schema.statistics
        WHERE  table_schema = DATABASE()
          AND  table_name   = 'tokens'
          AND  index_name   = 'idx_token_called_at'
    ) THEN
        ALTER TABLE tokens
            ADD INDEX idx_token_called_at (center_id, issued_date, called_at);
    END IF;
END$$

DELIMITER ;

CALL sp_add_idx_token_called_at();
DROP PROCEDURE IF EXISTS sp_add_idx_token_called_at;

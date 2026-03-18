-- backend/QueueLanka.Queue/Database/Migrations/004_token_status_queue_management.sql
-- QueueLanka Queue Service — Token Status + Queue Management Schema
-- Migration: 004_token_status_queue_management.sql
--
-- Goals
-- -----
-- 1) Ensure schema can track Waiting/Called/Served/Skipped token lifecycle.
-- 2) Ensure counter linkage fields exist for queue orchestration.
-- 3) Add indexes for call-next and center-wide queue reads.
-- 4) Keep migration idempotent and safe to re-run.
--
-- NOTE: center_id remains a plain integer (no cross-service FK) by design.
--       Cross-service validation is handled at application level.

-- ── 1. Ensure counters table exists (baseline compatibility) ───────────────
CREATE TABLE IF NOT EXISTS counters (
    counter_id        INT           AUTO_INCREMENT PRIMARY KEY,
    center_id         INT           NOT NULL,
    name              VARCHAR(100)  NOT NULL,
    is_open           TINYINT(1)    NOT NULL DEFAULT 0,
    current_token_id  INT           NULL,
    status            ENUM('Open', 'Closed', 'Paused') NOT NULL DEFAULT 'Closed',
    created_at        DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at        DATETIME      NULL ON UPDATE CURRENT_TIMESTAMP,

    INDEX idx_counter_center   (center_id),
    INDEX idx_counter_status   (center_id, status)
);

-- ── 2. Ensure tokens table exists (baseline compatibility) ─────────────────
CREATE TABLE IF NOT EXISTS tokens (
    token_id               INT           AUTO_INCREMENT PRIMARY KEY,
    center_id              INT           NOT NULL,
    counter_id             INT           NULL,
    number                 INT           NOT NULL,
    status                 ENUM('Waiting', 'Called', 'Served', 'Skipped', 'Serving', 'Completed', 'Cancelled', 'NoShow')
                                     NOT NULL DEFAULT 'Waiting',
    appt_id                INT           NULL,
    issued_at              DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    called_at              DATETIME      NULL,
    served_at              DATETIME      NULL,
    skipped_at             DATETIME      NULL,
    queue_position         INT           NULL,

    user_id                INT           NULL,
    appointment_id         INT           NULL,
    token_number           VARCHAR(50)   NOT NULL,
    issued_date            DATE          NOT NULL,
    issued_time            DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    estimated_service_time DATETIME      NULL,
    served_time            DATETIME      NULL,
    completed_time         DATETIME      NULL,
    cancelled_at           DATETIME      NULL,
    created_at             DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at             DATETIME      NULL ON UPDATE CURRENT_TIMESTAMP,

    INDEX idx_token_status (status),
    INDEX idx_token_center_status (center_id, status)
);

-- ── 3. Ensure required columns exist on tokens (idempotent) ────────────────
ALTER TABLE tokens
    ADD COLUMN IF NOT EXISTS center_id INT NOT NULL,
    ADD COLUMN IF NOT EXISTS counter_id INT NULL AFTER center_id,
    ADD COLUMN IF NOT EXISTS number INT NOT NULL DEFAULT 0 AFTER token_number,
    ADD COLUMN IF NOT EXISTS appt_id INT NULL AFTER appointment_id,
    ADD COLUMN IF NOT EXISTS issued_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP AFTER issued_date,
    ADD COLUMN IF NOT EXISTS called_at DATETIME NULL AFTER cancelled_at,
    ADD COLUMN IF NOT EXISTS served_at DATETIME NULL AFTER called_at,
    ADD COLUMN IF NOT EXISTS skipped_at DATETIME NULL AFTER served_at,
    ADD COLUMN IF NOT EXISTS queue_position INT NULL;

-- Preserve existing query compatibility fields used by CounterRepository.
ALTER TABLE tokens
    ADD COLUMN IF NOT EXISTS token_number VARCHAR(50) NOT NULL DEFAULT '0',
    ADD COLUMN IF NOT EXISTS issued_date DATE NOT NULL DEFAULT (CURRENT_DATE),
    ADD COLUMN IF NOT EXISTS issued_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    ADD COLUMN IF NOT EXISTS served_time DATETIME NULL,
    ADD COLUMN IF NOT EXISTS updated_at DATETIME NULL ON UPDATE CURRENT_TIMESTAMP;

-- Extend status to include Served while keeping existing states non-destructively.
ALTER TABLE tokens
    MODIFY COLUMN status
        ENUM('Waiting', 'Called', 'Served', 'Skipped', 'Serving', 'Completed', 'Cancelled', 'NoShow')
        NOT NULL
        DEFAULT 'Waiting'
        COMMENT 'Primary queue states: Waiting→Called→Served|Skipped; legacy states retained for compatibility';

-- ── 4. Ensure required columns exist on counters (idempotent) ──────────────
ALTER TABLE counters
    ADD COLUMN IF NOT EXISTS center_id INT NOT NULL,
    ADD COLUMN IF NOT EXISTS name VARCHAR(100) NOT NULL DEFAULT 'Counter',
    ADD COLUMN IF NOT EXISTS is_open TINYINT(1) NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS current_token_id INT NULL,
    ADD COLUMN IF NOT EXISTS status ENUM('Open', 'Closed', 'Paused') NOT NULL DEFAULT 'Closed',
    ADD COLUMN IF NOT EXISTS updated_at DATETIME NULL ON UPDATE CURRENT_TIMESTAMP;

-- ── 5. Add FK constraints safely (idempotent guards) ───────────────────────
DROP PROCEDURE IF EXISTS sp_add_fk_token_counter;
DROP PROCEDURE IF EXISTS sp_add_fk_counter_current_token;

DELIMITER $$

CREATE PROCEDURE sp_add_fk_token_counter()
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM   information_schema.table_constraints
        WHERE  table_schema = DATABASE()
          AND  table_name   = 'tokens'
          AND  constraint_name = 'fk_token_counter'
          AND  constraint_type = 'FOREIGN KEY'
    ) THEN
        ALTER TABLE tokens
            ADD CONSTRAINT fk_token_counter
                FOREIGN KEY (counter_id) REFERENCES counters(counter_id) ON DELETE SET NULL;
    END IF;
END$$

CREATE PROCEDURE sp_add_fk_counter_current_token()
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM   information_schema.table_constraints
        WHERE  table_schema = DATABASE()
          AND  table_name   = 'counters'
          AND  constraint_name = 'fk_counter_current_token'
          AND  constraint_type = 'FOREIGN KEY'
    ) THEN
        ALTER TABLE counters
            ADD CONSTRAINT fk_counter_current_token
                FOREIGN KEY (current_token_id) REFERENCES tokens(token_id) ON DELETE SET NULL;
    END IF;
END$$

DELIMITER ;

CALL sp_add_fk_token_counter();
CALL sp_add_fk_counter_current_token();
DROP PROCEDURE IF EXISTS sp_add_fk_token_counter;
DROP PROCEDURE IF EXISTS sp_add_fk_counter_current_token;

-- ── 6. Add indexes safely (stored-procedure guard pattern) ─────────────────
DROP PROCEDURE IF EXISTS sp_add_idx_tokens_status_counter;
DROP PROCEDURE IF EXISTS sp_add_idx_tokens_counter_number;
DROP PROCEDURE IF EXISTS sp_add_idx_tokens_center_status;
DROP PROCEDURE IF EXISTS sp_add_idx_counters_center;

DELIMITER $$

CREATE PROCEDURE sp_add_idx_tokens_status_counter()
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM   information_schema.statistics
        WHERE  table_schema = DATABASE()
          AND  table_name   = 'tokens'
          AND  index_name   = 'idx_tokens_status_counter'
    ) THEN
        ALTER TABLE tokens
            ADD INDEX idx_tokens_status_counter (status, counter_id);
    END IF;
END$$

CREATE PROCEDURE sp_add_idx_tokens_counter_number()
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM   information_schema.statistics
        WHERE  table_schema = DATABASE()
          AND  table_name   = 'tokens'
          AND  index_name   = 'idx_tokens_counter_number'
    ) THEN
        ALTER TABLE tokens
            ADD INDEX idx_tokens_counter_number (counter_id, number);
    END IF;
END$$

CREATE PROCEDURE sp_add_idx_tokens_center_status()
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM   information_schema.statistics
        WHERE  table_schema = DATABASE()
          AND  table_name   = 'tokens'
          AND  index_name   = 'idx_tokens_center_status'
    ) THEN
        ALTER TABLE tokens
            ADD INDEX idx_tokens_center_status (center_id, status);
    END IF;
END$$

CREATE PROCEDURE sp_add_idx_counters_center()
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM   information_schema.statistics
        WHERE  table_schema = DATABASE()
          AND  table_name   = 'counters'
          AND  index_name   = 'idx_counters_center'
    ) THEN
        ALTER TABLE counters
            ADD INDEX idx_counters_center (center_id);
    END IF;
END$$

DELIMITER ;

CALL sp_add_idx_tokens_status_counter();
CALL sp_add_idx_tokens_counter_number();
CALL sp_add_idx_tokens_center_status();
CALL sp_add_idx_counters_center();

DROP PROCEDURE IF EXISTS sp_add_idx_tokens_status_counter;
DROP PROCEDURE IF EXISTS sp_add_idx_tokens_counter_number;
DROP PROCEDURE IF EXISTS sp_add_idx_tokens_center_status;
DROP PROCEDURE IF EXISTS sp_add_idx_counters_center;

-- ── 7. Optional queue-order maintenance trigger (preferred) ────────────────
-- Recalculates queue positions for remaining waiting tokens at the same center/date
-- after a token transitions from Called to Served/Skipped.
DROP TRIGGER IF EXISTS trg_tokens_recalc_queue_after_completion;

DELIMITER $$

CREATE TRIGGER trg_tokens_recalc_queue_after_completion
AFTER UPDATE ON tokens
FOR EACH ROW
BEGIN
    IF OLD.status = 'Called' AND (NEW.status = 'Served' OR NEW.status = 'Skipped') THEN
        UPDATE tokens t
        JOIN (
            SELECT x.token_id,
                   ROW_NUMBER() OVER (ORDER BY x.token_number ASC) AS new_queue_position
            FROM tokens x
            WHERE x.center_id   = NEW.center_id
              AND x.issued_date = NEW.issued_date
              AND x.status      = 'Waiting'
        ) q ON q.token_id = t.token_id
        SET t.queue_position = q.new_queue_position,
            t.updated_at     = UTC_TIMESTAMP();
    END IF;
END$$

DELIMITER ;

-- ════════════════════════════════════════════════════════════════
-- ROLLBACK (manual — do NOT run unless intentionally reverting)
-- ════════════════════════════════════════════════════════════════
--
-- -- Remove trigger
-- DROP TRIGGER IF EXISTS trg_tokens_recalc_queue_after_completion;
--
-- -- Remove indexes added by this migration
-- ALTER TABLE tokens   DROP INDEX IF EXISTS idx_tokens_status_counter;
-- ALTER TABLE tokens   DROP INDEX IF EXISTS idx_tokens_counter_number;
-- ALTER TABLE tokens   DROP INDEX IF EXISTS idx_tokens_center_status;
-- ALTER TABLE counters DROP INDEX IF EXISTS idx_counters_center;
--
-- -- Remove foreign keys added by this migration
-- ALTER TABLE counters DROP FOREIGN KEY fk_counter_current_token;
-- ALTER TABLE tokens   DROP FOREIGN KEY fk_token_counter;
--
-- -- Optional column rollback (only if safe for your data model)
-- -- ALTER TABLE tokens   DROP COLUMN IF EXISTS counter_id;
-- -- ALTER TABLE tokens   DROP COLUMN IF EXISTS number;
-- -- ALTER TABLE tokens   DROP COLUMN IF EXISTS appt_id;
-- -- ALTER TABLE tokens   DROP COLUMN IF EXISTS issued_at;
-- -- ALTER TABLE tokens   DROP COLUMN IF EXISTS skipped_at;
-- -- ALTER TABLE counters DROP COLUMN IF EXISTS is_open;
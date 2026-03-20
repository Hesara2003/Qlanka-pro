-- backend/QueueLanka.Queue/Database/Migrations/006_token_reassignment_audit_schema.sql
-- QueueLanka Queue Service — Token Reassignment + Audit Log Schema
-- Migration: 006_token_reassignment_audit_schema.sql
--
-- Goals
-- -----
-- 1) Ensure tokens schema supports reassignment metadata and queue-position lookups.
-- 2) Ensure audit_logs table supports reassignment auditing and reporting.
-- 3) Keep migration idempotent and safe to re-run.

-- ── 1. Token Reassignment Support ───────────────────────────────────────────
ALTER TABLE tokens
    ADD COLUMN IF NOT EXISTS reassigned_from_counter_id INT NULL AFTER counter_id,
    ADD COLUMN IF NOT EXISTS reassigned_at DATETIME NULL AFTER called_at,
    ADD COLUMN IF NOT EXISTS reassignment_reason VARCHAR(500) NULL AFTER reassigned_at,
    ADD COLUMN IF NOT EXISTS queue_position INT NULL;

-- Ensure counter_id foreign key exists on tokens.
DROP PROCEDURE IF EXISTS sp_ensure_fk_token_counter;

DELIMITER $$

CREATE PROCEDURE sp_ensure_fk_token_counter()
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM   information_schema.table_constraints
        WHERE  table_schema = DATABASE()
          AND  table_name = 'tokens'
          AND  constraint_name = 'fk_token_counter'
          AND  constraint_type = 'FOREIGN KEY'
    ) THEN
        ALTER TABLE tokens
            ADD CONSTRAINT fk_token_counter
                FOREIGN KEY (counter_id) REFERENCES counters(counter_id) ON DELETE SET NULL;
    END IF;
END$$

DELIMITER ;

CALL sp_ensure_fk_token_counter();
DROP PROCEDURE IF EXISTS sp_ensure_fk_token_counter;

-- Add token reassignment indexes safely (stored-procedure guard pattern).
DROP PROCEDURE IF EXISTS sp_add_idx_tokens_counter_queue_position;
DROP PROCEDURE IF EXISTS sp_add_idx_tokens_reassigned_at;

DELIMITER $$

CREATE PROCEDURE sp_add_idx_tokens_counter_queue_position()
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM   information_schema.statistics
        WHERE  table_schema = DATABASE()
          AND  table_name = 'tokens'
          AND  index_name = 'idx_tokens_counter_queue_position'
    ) THEN
        ALTER TABLE tokens
            ADD INDEX idx_tokens_counter_queue_position (counter_id, queue_position);
    END IF;
END$$

CREATE PROCEDURE sp_add_idx_tokens_reassigned_at()
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM   information_schema.statistics
        WHERE  table_schema = DATABASE()
          AND  table_name = 'tokens'
          AND  index_name = 'idx_tokens_reassigned_at'
    ) THEN
        ALTER TABLE tokens
            ADD INDEX idx_tokens_reassigned_at (reassigned_at);
    END IF;
END$$

DELIMITER ;

CALL sp_add_idx_tokens_counter_queue_position();
CALL sp_add_idx_tokens_reassigned_at();

DROP PROCEDURE IF EXISTS sp_add_idx_tokens_counter_queue_position;
DROP PROCEDURE IF EXISTS sp_add_idx_tokens_reassigned_at;

-- ── 2. Audit Logs Table ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS audit_logs (
    audit_log_id   INT           AUTO_INCREMENT PRIMARY KEY,
    action         VARCHAR(100)  NOT NULL,
    entity_type    VARCHAR(100)  NOT NULL,
    entity_id      INT           NOT NULL,
    performed_by   INT           NOT NULL,
    performed_at   DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    details        JSON          NULL,
    center_id      INT           NOT NULL
);

ALTER TABLE audit_logs
    ADD COLUMN IF NOT EXISTS action VARCHAR(100) NOT NULL,
    ADD COLUMN IF NOT EXISTS entity_type VARCHAR(100) NOT NULL,
    ADD COLUMN IF NOT EXISTS entity_id INT NOT NULL,
    ADD COLUMN IF NOT EXISTS performed_by INT NOT NULL,
    ADD COLUMN IF NOT EXISTS performed_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    ADD COLUMN IF NOT EXISTS details JSON NULL,
    ADD COLUMN IF NOT EXISTS center_id INT NOT NULL;

-- ── 3. Audit Logs Indexes ───────────────────────────────────────────────────
DROP PROCEDURE IF EXISTS sp_add_idx_audit_logs_center_performed;
DROP PROCEDURE IF EXISTS sp_add_idx_audit_logs_entity;
DROP PROCEDURE IF EXISTS sp_add_idx_audit_logs_performed_by;
DROP PROCEDURE IF EXISTS sp_add_idx_audit_logs_action_performed_at;

DELIMITER $$

CREATE PROCEDURE sp_add_idx_audit_logs_center_performed()
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM   information_schema.statistics
        WHERE  table_schema = DATABASE()
          AND  table_name = 'audit_logs'
          AND  index_name = 'idx_audit_logs_center_performed'
    ) THEN
        ALTER TABLE audit_logs
            ADD INDEX idx_audit_logs_center_performed (center_id, performed_at);
    END IF;
END$$

CREATE PROCEDURE sp_add_idx_audit_logs_entity()
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM   information_schema.statistics
        WHERE  table_schema = DATABASE()
          AND  table_name = 'audit_logs'
          AND  index_name = 'idx_audit_logs_entity'
    ) THEN
        ALTER TABLE audit_logs
            ADD INDEX idx_audit_logs_entity (entity_type, entity_id);
    END IF;
END$$

CREATE PROCEDURE sp_add_idx_audit_logs_performed_by()
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM   information_schema.statistics
        WHERE  table_schema = DATABASE()
          AND  table_name = 'audit_logs'
          AND  index_name = 'idx_audit_logs_performed_by'
    ) THEN
        ALTER TABLE audit_logs
            ADD INDEX idx_audit_logs_performed_by (performed_by);
    END IF;
END$$

CREATE PROCEDURE sp_add_idx_audit_logs_action_performed_at()
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM   information_schema.statistics
        WHERE  table_schema = DATABASE()
          AND  table_name = 'audit_logs'
          AND  index_name = 'idx_audit_logs_action_performed_at'
    ) THEN
        ALTER TABLE audit_logs
            ADD INDEX idx_audit_logs_action_performed_at (action, performed_at);
    END IF;
END$$

DELIMITER ;

CALL sp_add_idx_audit_logs_center_performed();
CALL sp_add_idx_audit_logs_entity();
CALL sp_add_idx_audit_logs_performed_by();
CALL sp_add_idx_audit_logs_action_performed_at();

DROP PROCEDURE IF EXISTS sp_add_idx_audit_logs_center_performed;
DROP PROCEDURE IF EXISTS sp_add_idx_audit_logs_entity;
DROP PROCEDURE IF EXISTS sp_add_idx_audit_logs_performed_by;
DROP PROCEDURE IF EXISTS sp_add_idx_audit_logs_action_performed_at;

-- ════════════════════════════════════════════════════════════════
-- 4. ROLLBACK (manual — do NOT run unless intentionally reverting)
-- ════════════════════════════════════════════════════════════════
--
-- -- Drop indexes added by this migration
-- ALTER TABLE tokens DROP INDEX IF EXISTS idx_tokens_counter_queue_position;
-- ALTER TABLE tokens DROP INDEX IF EXISTS idx_tokens_reassigned_at;
-- ALTER TABLE audit_logs DROP INDEX IF EXISTS idx_audit_logs_center_performed;
-- ALTER TABLE audit_logs DROP INDEX IF EXISTS idx_audit_logs_entity;
-- ALTER TABLE audit_logs DROP INDEX IF EXISTS idx_audit_logs_performed_by;
-- ALTER TABLE audit_logs DROP INDEX IF EXISTS idx_audit_logs_action_performed_at;
--
-- -- Drop token reassignment columns added by this migration
-- ALTER TABLE tokens DROP COLUMN IF EXISTS reassigned_from_counter_id;
-- ALTER TABLE tokens DROP COLUMN IF EXISTS reassigned_at;
-- ALTER TABLE tokens DROP COLUMN IF EXISTS reassignment_reason;
--
-- -- Drop audit_logs table
-- DROP TABLE IF EXISTS audit_logs;
--
-- -- Optional: remove fk_token_counter only if this migration created it
-- -- ALTER TABLE tokens DROP FOREIGN KEY fk_token_counter;
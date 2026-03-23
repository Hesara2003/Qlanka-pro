-- backend/QueueLanka.Queue/Database/Migrations/005_audit_logs.sql
-- QueueLanka Queue Service — Audit Logs Schema
-- Migration: 005_audit_logs.sql
--
-- Goals
-- -----
-- 1) Add audit_logs table for reassignment audit trails.
-- 2) Add indexes for center-level reporting and entity-level audit lookups.
-- 3) Keep migration idempotent and safe to re-run.

CREATE TABLE IF NOT EXISTS audit_logs (
    audit_log_id   INT           AUTO_INCREMENT PRIMARY KEY,
    action         VARCHAR(100)  NOT NULL,
    entity_type    VARCHAR(100)  NOT NULL,
    entity_id      INT           NOT NULL,
    performed_by   INT           NOT NULL,
    performed_at   DATETIME      NOT NULL DEFAULT UTC_TIMESTAMP(),
    details        JSON          NULL,
    center_id      INT           NOT NULL,
    created_at     DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE audit_logs
    ADD COLUMN IF NOT EXISTS action VARCHAR(100) NOT NULL,
    ADD COLUMN IF NOT EXISTS entity_type VARCHAR(100) NOT NULL,
    ADD COLUMN IF NOT EXISTS entity_id INT NOT NULL,
    ADD COLUMN IF NOT EXISTS performed_by INT NOT NULL,
    ADD COLUMN IF NOT EXISTS performed_at DATETIME NOT NULL DEFAULT UTC_TIMESTAMP(),
    ADD COLUMN IF NOT EXISTS details JSON NULL,
    ADD COLUMN IF NOT EXISTS center_id INT NOT NULL,
    ADD COLUMN IF NOT EXISTS created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP;

DROP PROCEDURE IF EXISTS sp_add_idx_audit_logs_center_performed;
DROP PROCEDURE IF EXISTS sp_add_idx_audit_logs_entity;

DELIMITER $$

CREATE PROCEDURE sp_add_idx_audit_logs_center_performed()
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.statistics
        WHERE table_schema = DATABASE()
          AND table_name = 'audit_logs'
          AND index_name = 'idx_audit_logs_center_performed'
    ) THEN
        ALTER TABLE audit_logs
            ADD INDEX idx_audit_logs_center_performed (center_id, performed_at);
    END IF;
END$$

CREATE PROCEDURE sp_add_idx_audit_logs_entity()
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.statistics
        WHERE table_schema = DATABASE()
          AND table_name = 'audit_logs'
          AND index_name = 'idx_audit_logs_entity'
    ) THEN
        ALTER TABLE audit_logs
            ADD INDEX idx_audit_logs_entity (entity_type, entity_id);
    END IF;
END$$

DELIMITER ;

CALL sp_add_idx_audit_logs_center_performed();
CALL sp_add_idx_audit_logs_entity();

DROP PROCEDURE IF EXISTS sp_add_idx_audit_logs_center_performed;
DROP PROCEDURE IF EXISTS sp_add_idx_audit_logs_entity;

-- ════════════════════════════════════════════════════════════════
-- ROLLBACK (manual — do NOT run unless intentionally reverting)
-- ════════════════════════════════════════════════════════════════
--
-- -- Remove indexes added by this migration
-- ALTER TABLE audit_logs DROP INDEX IF EXISTS idx_audit_logs_center_performed;
-- ALTER TABLE audit_logs DROP INDEX IF EXISTS idx_audit_logs_entity;
--
-- -- Remove table
-- DROP TABLE IF EXISTS audit_logs;
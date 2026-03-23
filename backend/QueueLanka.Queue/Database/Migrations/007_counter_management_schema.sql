-- backend/QueueLanka.Queue/Database/Migrations/007_counter_management_schema.sql
-- QueueLanka Queue Service — Counter Management Schema
-- Migration: 007_counter_management_schema.sql
--
-- Goals
-- -----
-- 1) Add officer assignment and closure metadata required for admin counter management.
-- 2) Ensure indexes exist for center-level and open/closed counter lookups.
-- 3) Keep migration idempotent and safe to re-run.

-- ── 1. Counter management columns ───────────────────────────────────────────
ALTER TABLE counters
    ADD COLUMN IF NOT EXISTS assigned_officer_user_id INT NULL AFTER current_token_id,
    ADD COLUMN IF NOT EXISTS created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    ADD COLUMN IF NOT EXISTS closed_reason VARCHAR(500) NULL AFTER status;

-- ── 2. Counter management indexes (guarded) ─────────────────────────────────
DROP PROCEDURE IF EXISTS sp_add_idx_counters_center_id;
DROP PROCEDURE IF EXISTS sp_add_idx_counters_is_open;

DELIMITER $$

CREATE PROCEDURE sp_add_idx_counters_center_id()
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM   information_schema.statistics
        WHERE  table_schema = DATABASE()
          AND  table_name = 'counters'
          AND  index_name = 'idx_counters_center_id'
    ) THEN
        ALTER TABLE counters
            ADD INDEX idx_counters_center_id (center_id);
    END IF;
END$$

CREATE PROCEDURE sp_add_idx_counters_is_open()
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM   information_schema.statistics
        WHERE  table_schema = DATABASE()
          AND  table_name = 'counters'
          AND  index_name = 'idx_counters_is_open'
    ) THEN
        ALTER TABLE counters
            ADD INDEX idx_counters_is_open (center_id, is_open);
    END IF;
END$$

DELIMITER ;

CALL sp_add_idx_counters_center_id();
CALL sp_add_idx_counters_is_open();

DROP PROCEDURE IF EXISTS sp_add_idx_counters_center_id;
DROP PROCEDURE IF EXISTS sp_add_idx_counters_is_open;

-- ════════════════════════════════════════════════════════════════
-- ROLLBACK (manual — do NOT run unless intentionally reverting)
-- ════════════════════════════════════════════════════════════════
--
-- ALTER TABLE counters DROP INDEX IF EXISTS idx_counters_center_id;
-- ALTER TABLE counters DROP INDEX IF EXISTS idx_counters_is_open;
-- ALTER TABLE counters DROP COLUMN IF EXISTS assigned_officer_user_id;
-- ALTER TABLE counters DROP COLUMN IF EXISTS closed_reason;
-- -- created_at is likely baseline column; drop only if safe in your environment
-- -- ALTER TABLE counters DROP COLUMN IF EXISTS created_at;

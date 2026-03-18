-- QueueLanka Queue Service — Token Called-Status Migration
-- Migration: 003_token_called_status.sql
--
-- Context
-- -------
-- Migration 001 created the tokens table with status ENUM:
--   ('Waiting', 'Serving', 'Completed', 'Skipped', 'Cancelled', 'NoShow')
-- Migration 002 added the counters table and the called_at column to tokens.
--
-- CounterRepository.CallNextTokenAsync() sets status = 'Called', but 'Called'
-- is absent from the ENUM definition, which causes a Data truncated error on
-- strict MySQL servers.  This migration patches the ENUM to include 'Called'
-- and adds the served_at convenience column used by future Serving-state logic.
--
-- NOTE: centre_id / user_id remain plain integers — no cross-service FKs.
--       Cross-service validation is handled at application level via HTTP calls.

-- ── 1. Extend tokens.status ENUM to include 'Called' ────────────
-- ALTER TABLE … MODIFY COLUMN rewrites the column definition in place.
-- All existing rows keep their current value; nothing is destroyed.
-- The new ENUM is a strict superset of the original.

ALTER TABLE tokens
    MODIFY COLUMN status
        ENUM('Waiting', 'Called', 'Serving', 'Completed', 'Skipped', 'Cancelled', 'NoShow')
        NOT NULL
        DEFAULT 'Waiting'
        COMMENT 'Waiting→Called (officer called)→Serving→Completed | alt: Skipped / Cancelled / NoShow';

-- ── 2. Add served_at column (idempotent) ────────────────────────
-- Tracks when an officer began actively serving the token (Serving state).
-- Placed immediately after called_at for chronological column ordering.

ALTER TABLE tokens
    ADD COLUMN IF NOT EXISTS served_at DATETIME NULL
        COMMENT 'UTC timestamp when the token transitioned to Serving'
        AFTER called_at;

-- ── 3. Add index for Called-status lookups (idempotent) ─────────
-- Supports efficient "list all Called tokens at a counter today" queries
-- used by live-queue dashboards.  Uses the stored-procedure guard pattern
-- established by migration 002 to keep the script re-runnable.

DROP PROCEDURE IF EXISTS sp_add_idx_token_called_status;

DELIMITER $$

CREATE PROCEDURE sp_add_idx_token_called_status()
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM   information_schema.statistics
        WHERE  table_schema = DATABASE()
          AND  table_name   = 'tokens'
          AND  index_name   = 'idx_token_called_status'
    ) THEN
        ALTER TABLE tokens
            ADD INDEX idx_token_called_status (center_id, issued_date, status, called_at);
    END IF;
END$$

DELIMITER ;

CALL sp_add_idx_token_called_status();
DROP PROCEDURE IF EXISTS sp_add_idx_token_called_status;

-- ════════════════════════════════════════════════════════════════
-- ROLLBACK (manual — do NOT run unless intentionally reverting)
-- ════════════════════════════════════════════════════════════════
--
-- -- Remove the new index
-- ALTER TABLE tokens DROP INDEX IF EXISTS idx_token_called_status;
--
-- -- Remove served_at column
-- ALTER TABLE tokens DROP COLUMN IF EXISTS served_at;
--
-- -- Revert status ENUM (removes 'Called'; any 'Called' rows MUST be
-- -- updated first or MySQL will reject the ALTER on strict mode):
-- -- UPDATE tokens SET status = 'Waiting' WHERE status = 'Called';
-- -- ALTER TABLE tokens
-- --     MODIFY COLUMN status
-- --         ENUM('Waiting', 'Serving', 'Completed', 'Skipped', 'Cancelled', 'NoShow')
-- --         NOT NULL DEFAULT 'Waiting';

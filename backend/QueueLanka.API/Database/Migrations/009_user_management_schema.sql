-- QueueLanka Pro — User Management Schema Updates
-- Sprint 5 | SCRUM-76
--
-- Goals
--   1. Soft-delete support  : deleted_at + deleted_by columns so users are never
--      hard-deleted; referential integrity to appointments/tokens is preserved.
--   2. Auditability         : updated_at, last_login_at, deleted_at/deleted_by on
--      users + a new user_audit_log table for full change history.
--   3. Efficient listing    : composite & single-column indexes for the most common
--      admin queries (filter by role, active status, center).

USE queuelanka;

-- ══════════════════════════════════════════════════════════════════════════════
-- 1. Extend the users table
-- ══════════════════════════════════════════════════════════════════════════════

-- Track the last time a row was modified (password change, role change, etc.)
ALTER TABLE users
    ADD COLUMN IF NOT EXISTS updated_at     DATETIME NULL DEFAULT NULL
                                            ON UPDATE CURRENT_TIMESTAMP
        AFTER created_at;

-- Record the moment a user was soft-deleted (NULL = not deleted)
ALTER TABLE users
    ADD COLUMN IF NOT EXISTS deleted_at     DATETIME NULL DEFAULT NULL
        AFTER updated_at;

-- Record which admin performed the soft-delete (NULL = system / self-service)
ALTER TABLE users
    ADD COLUMN IF NOT EXISTS deleted_by     INT      NULL DEFAULT NULL
        AFTER deleted_at;

-- Track last successful login for idle-user reporting and security policies
ALTER TABLE users
    ADD COLUMN IF NOT EXISTS last_login_at  DATETIME NULL DEFAULT NULL
        AFTER deleted_by;

-- Self-referencing FK: deleted_by → users(user_id)
-- ON DELETE SET NULL ensures the audit column survives if the admin account is later removed.
ALTER TABLE users
    ADD CONSTRAINT IF NOT EXISTS fk_user_deleted_by
        FOREIGN KEY (deleted_by) REFERENCES users(user_id)
        ON DELETE SET NULL;

-- ══════════════════════════════════════════════════════════════════════════════
-- 2. Performance indexes for user listing / admin queries
-- ══════════════════════════════════════════════════════════════════════════════

-- Most common single-column filter predicates
CREATE INDEX IF NOT EXISTS idx_users_role       ON users (role);
CREATE INDEX IF NOT EXISTS idx_users_is_active  ON users (is_active);
CREATE INDEX IF NOT EXISTS idx_users_deleted_at ON users (deleted_at);   -- IS NULL fast-path
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users (created_at);   -- sort / pagination

-- Composite: "list active users of a given role" — the dominant admin listing query
CREATE INDEX IF NOT EXISTS idx_users_active_role
    ON users (is_active, role);

-- Composite: "list active users assigned to a center" — officer management
CREATE INDEX IF NOT EXISTS idx_users_center_active
    ON users (center_id, is_active);

-- ══════════════════════════════════════════════════════════════════════════════
-- 3. User audit log
-- ══════════════════════════════════════════════════════════════════════════════

-- Full, immutable change-history for every significant event on a user account.
-- Rows are NEVER updated — only appended. Deletion follows the user (CASCADE).
CREATE TABLE IF NOT EXISTS user_audit_log (
    log_id        INT           AUTO_INCREMENT PRIMARY KEY,

    -- Subject: the user whose record changed
    user_id       INT           NOT NULL,

    -- Action that took place
    action        ENUM(
                      'CREATED',        -- new account registered
                      'UPDATED',        -- profile / password changed
                      'ROLE_CHANGED',   -- role promoted or demoted
                      'ACTIVATED',      -- is_active set back to TRUE
                      'DEACTIVATED',    -- is_active set to FALSE (non-delete disable)
                      'DELETED',        -- soft-deleted (deleted_at stamped)
                      'RESTORED',       -- soft-delete reversed
                      'LOGIN'           -- successful authentication
                  ) NOT NULL,

    -- Who triggered the event (NULL = triggered by the user themselves or the system)
    performed_by  INT           NULL,

    -- JSON snapshots for before/after comparisons (development & compliance)
    old_values    JSON          NULL,
    new_values    JSON          NULL,

    -- Free-text context (e.g. reason for deletion, IP address)
    notes         VARCHAR(500)  NULL,

    performed_at  DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,

    -- Referential integrity
    CONSTRAINT fk_audit_user
        FOREIGN KEY (user_id)      REFERENCES users(user_id) ON DELETE CASCADE,
    CONSTRAINT fk_audit_performed_by
        FOREIGN KEY (performed_by) REFERENCES users(user_id) ON DELETE SET NULL,

    -- Query patterns: all events for a user, recent events globally, events by action
    INDEX idx_audit_user_id      (user_id),
    INDEX idx_audit_performed_at (performed_at),
    INDEX idx_audit_action       (action),
    INDEX idx_audit_performed_by (performed_by)
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci
  COMMENT='Immutable audit trail for all user-account events — SCRUM-76';

-- ══════════════════════════════════════════════════════════════════════════════
-- 4. Back-fill updated_at for existing rows
-- ══════════════════════════════════════════════════════════════════════════════

-- Set updated_at = created_at for all pre-existing users so the column is never
-- NULL for real records (NULL will mean "never modified after migration").
UPDATE users
SET    updated_at = created_at
WHERE  updated_at IS NULL;

-- ══════════════════════════════════════════════════════════════════════════════
-- 5. Convenience view — v_active_users
-- ══════════════════════════════════════════════════════════════════════════════

-- Drop and recreate so re-running the migration is idempotent.
DROP VIEW IF EXISTS v_active_users;

CREATE VIEW v_active_users AS
    SELECT
        u.user_id,
        u.username,
        u.email,
        u.role,
        u.center_id,
        c.name          AS center_name,
        u.is_active,
        u.is_email_verified,
        u.last_login_at,
        u.created_at,
        u.updated_at
    FROM  users u
    LEFT JOIN centers c ON c.center_id = u.center_id
    WHERE u.deleted_at IS NULL      -- excludes soft-deleted accounts
      AND u.is_active  = TRUE;

-- ══════════════════════════════════════════════════════════════════════════════
-- Notes
-- ══════════════════════════════════════════════════════════════════════════════
--
-- Soft-delete contract (to be enforced at the application layer):
--   • "Delete user"  → SET deleted_at = UTC_TIMESTAMP(), deleted_by = <admin_id>,
--                           is_active = FALSE
--   • "Restore user" → SET deleted_at = NULL, deleted_by = NULL, is_active = TRUE
--
-- Existing FK behaviour is preserved:
--   • appointments.user_id  ON DELETE CASCADE  (still intact; soft-delete avoids trigger)
--   • tokens.user_id        ON DELETE SET NULL (still intact)
--   • email_verification_tokens.user_id ON DELETE CASCADE (still intact)

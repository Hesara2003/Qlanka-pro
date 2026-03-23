-- QueueLanka Identity Service — Database Schema
-- Consolidated from monolith migrations: 001, 002, 009

-- ── Users ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
    user_id           INT           AUTO_INCREMENT PRIMARY KEY,
    username          VARCHAR(50)   NOT NULL UNIQUE,
    email             VARCHAR(100)  NOT NULL UNIQUE,
    password_hash     VARCHAR(255)  NOT NULL,
    role              ENUM('citizen', 'officer', 'admin') NOT NULL,
    center_id         INT           NULL,
    is_active         BOOLEAN       NOT NULL DEFAULT TRUE,
    is_email_verified BOOLEAN       NOT NULL DEFAULT FALSE,
    created_at        DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at        DATETIME      NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
    deleted_at        DATETIME      NULL DEFAULT NULL,
    deleted_by        INT           NULL DEFAULT NULL,
    last_login_at     DATETIME      NULL DEFAULT NULL,

    CONSTRAINT fk_user_deleted_by
        FOREIGN KEY (deleted_by) REFERENCES users(user_id) ON DELETE SET NULL
);

-- Indexes for admin listing queries
CREATE INDEX idx_users_role        ON users (role);
CREATE INDEX idx_users_is_active   ON users (is_active);
CREATE INDEX idx_users_deleted_at  ON users (deleted_at);
CREATE INDEX idx_users_created_at  ON users (created_at);
CREATE INDEX idx_users_active_role ON users (is_active, role);
CREATE INDEX idx_users_center_active ON users (center_id, is_active);

-- ── Email Verification Tokens ──────────────────────────────────
CREATE TABLE IF NOT EXISTS email_verification_tokens (
    token_id   INT          AUTO_INCREMENT PRIMARY KEY,
    user_id    INT          NOT NULL,
    token      VARCHAR(128) NOT NULL UNIQUE,
    expires_at DATETIME     NOT NULL,
    used_at    DATETIME     NULL DEFAULT NULL,
    created_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_evtoken_user FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    INDEX idx_evtoken_token   (token),
    INDEX idx_evtoken_user_id (user_id)
);

-- ── User Audit Log ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS user_audit_log (
    log_id        INT           AUTO_INCREMENT PRIMARY KEY,
    user_id       INT           NOT NULL,
    action        ENUM(
                      'CREATED',
                      'UPDATED',
                      'ROLE_CHANGED',
                      'ACTIVATED',
                      'DEACTIVATED',
                      'DELETED',
                      'RESTORED',
                      'LOGIN'
                  ) NOT NULL,
    performed_by  INT           NULL,
    old_values    JSON          NULL,
    new_values    JSON          NULL,
    notes         VARCHAR(500)  NULL,
    performed_at  DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_audit_user
        FOREIGN KEY (user_id)      REFERENCES users(user_id) ON DELETE CASCADE,
    CONSTRAINT fk_audit_performed_by
        FOREIGN KEY (performed_by) REFERENCES users(user_id) ON DELETE SET NULL,

    INDEX idx_audit_user_id      (user_id),
    INDEX idx_audit_performed_at (performed_at),
    INDEX idx_audit_action       (action),
    INDEX idx_audit_performed_by (performed_by)
);

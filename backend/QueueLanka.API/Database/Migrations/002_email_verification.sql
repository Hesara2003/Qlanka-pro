-- QueueLanka Pro — Email Verification Migration
-- Sprint 1 | SCRUM-32

USE queuelanka;

-- ── Add email verification status to users ──────────────────────
ALTER TABLE users
    ADD COLUMN IF NOT EXISTS is_email_verified BOOLEAN NOT NULL DEFAULT FALSE
        AFTER is_active;

-- ── Email verification tokens ────────────────────────────────────
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

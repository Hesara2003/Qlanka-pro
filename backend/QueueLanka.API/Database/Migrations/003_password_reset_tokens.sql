-- QueueLanka Pro — Password Reset Tokens Migration
-- Sprint 1 | SCRUM-33

USE queuelanka;

CREATE TABLE IF NOT EXISTS password_reset_tokens (
    token_id   INT          AUTO_INCREMENT PRIMARY KEY,
    user_id    INT          NOT NULL,
    token      VARCHAR(128) NOT NULL UNIQUE,
    expires_at DATETIME     NOT NULL,
    used_at    DATETIME     NULL DEFAULT NULL,
    created_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_prtoken_user FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    INDEX idx_prtoken_token   (token),
    INDEX idx_prtoken_user_id (user_id)
);

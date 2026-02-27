-- QueueLanka Pro — Tokens Schema Migration
-- Sprint 2 | SCRUM-39

USE queuelanka;

-- ── 1. Modify Appointments (Decouple TokenNumber) ──────────────
-- Before doing this, we would ideally migrate existing string tokens. 
-- Since we are early in development, dropping the column is fine.
ALTER TABLE appointments 
DROP INDEX token_number,
DROP COLUMN token_number;

-- ── 2. Tokens ──────────────────────────────────────────────────
-- Store the real-time queue tokens generated for a center on a given day.
-- Tokens can either be linked to a pre-booked appointment or a walk-in user.
CREATE TABLE IF NOT EXISTS tokens (
    token_id                 INT           AUTO_INCREMENT PRIMARY KEY,
    center_id                INT           NOT NULL,
    user_id                  INT           NULL COMMENT 'Null for walk-ins without accounts',
    appointment_id           INT           NULL COMMENT 'Linked if generated from a booking',
    token_number             VARCHAR(50)   NOT NULL,
    issued_date              DATE          NOT NULL,
    status                   ENUM('Waiting', 'Serving', 'Completed', 'Skipped', 'Cancelled') NOT NULL DEFAULT 'Waiting',
    issued_time              DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    estimated_service_time   DATETIME      NULL,
    served_time              DATETIME      NULL,
    completed_time           DATETIME      NULL,
    created_at               DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at               DATETIME      NULL ON UPDATE CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_token_center      FOREIGN KEY (center_id)      REFERENCES centers(center_id) ON DELETE CASCADE,
    CONSTRAINT fk_token_user        FOREIGN KEY (user_id)        REFERENCES users(user_id) ON DELETE SET NULL,
    CONSTRAINT fk_token_appointment FOREIGN KEY (appointment_id) REFERENCES appointments(appointment_id) ON DELETE SET NULL,
    
    -- Ensure token_number string is uniquely identifiable per day per center.
    CONSTRAINT uk_token_center_date_num UNIQUE KEY (center_id, issued_date, token_number),
    
    INDEX idx_token_status (status),
    INDEX idx_token_issued_date (center_id, issued_date)
);

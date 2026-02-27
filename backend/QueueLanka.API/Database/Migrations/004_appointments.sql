-- QueueLanka Pro — Appointments Schema Migration
-- Sprint 2 | SCRUM-38

USE queuelanka;

-- ── Appointments ────────────────────────────────────────────────
-- Store token bookings and reservations with conflict resolution
CREATE TABLE IF NOT EXISTS appointments (
    appointment_id   INT           AUTO_INCREMENT PRIMARY KEY,
    center_id        INT           NOT NULL,
    user_id          INT           NOT NULL,
    token_number     VARCHAR(50)   NOT NULL UNIQUE,
    appointment_date DATE          NOT NULL,
    appointment_time TIME          NOT NULL,
    status           ENUM('Scheduled', 'Completed', 'Cancelled', 'NoShow') NOT NULL DEFAULT 'Scheduled',
    created_at       DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at       DATETIME      NULL ON UPDATE CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_appointment_center FOREIGN KEY (center_id) REFERENCES centers(center_id) ON DELETE CASCADE,
    CONSTRAINT fk_appointment_user   FOREIGN KEY (user_id)   REFERENCES users(user_id)     ON DELETE CASCADE,
    
    -- Crucial for quick conflict resolution lookups
    INDEX idx_center_date_time (center_id, appointment_date, appointment_time),
    INDEX idx_user_appointments (user_id, appointment_date)
);

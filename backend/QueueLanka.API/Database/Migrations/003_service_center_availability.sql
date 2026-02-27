-- QueueLanka Pro — Service Center Availability Schema
-- Sprint 2 | SCRUM-23

USE queuelanka;

-- ── Enhanced Service Center Details ────────────────────────────
-- Add additional fields to existing centers table
ALTER TABLE centers
    ADD COLUMN IF NOT EXISTS phone         VARCHAR(20)  NULL,
    ADD COLUMN IF NOT EXISTS email         VARCHAR(100) NULL,
    ADD COLUMN IF NOT EXISTS description   TEXT         NULL,
    ADD COLUMN IF NOT EXISTS opening_time  TIME         NOT NULL DEFAULT '08:00:00',
    ADD COLUMN IF NOT EXISTS closing_time  TIME         NOT NULL DEFAULT '17:00:00',
    ADD COLUMN IF NOT EXISTS updated_at    DATETIME     NULL ON UPDATE CURRENT_TIMESTAMP;

-- ── Service Center Availability ────────────────────────────────
-- Track daily availability and override schedules
CREATE TABLE IF NOT EXISTS center_availability (
    availability_id INT           AUTO_INCREMENT PRIMARY KEY,
    center_id       INT           NOT NULL,
    date            DATE          NOT NULL,
    is_available    BOOLEAN       NOT NULL DEFAULT TRUE,
    opening_time    TIME          NULL,
    closing_time    TIME          NULL,
    reason          VARCHAR(255)  NULL COMMENT 'Reason for closure or schedule change',
    created_at      DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME      NULL ON UPDATE CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_availability_center FOREIGN KEY (center_id) REFERENCES centers(center_id) ON DELETE CASCADE,
    CONSTRAINT uk_center_date UNIQUE KEY (center_id, date),
    INDEX idx_center_date (center_id, date)
);

-- ── Service Center Operating Days ──────────────────────────────
-- Define which days of the week each center operates
CREATE TABLE IF NOT EXISTS center_operating_days (
    operating_day_id INT                                              AUTO_INCREMENT PRIMARY KEY,
    center_id        INT                                              NOT NULL,
    day_of_week      ENUM('monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday') NOT NULL,
    is_open          BOOLEAN                                          NOT NULL DEFAULT TRUE,
    opening_time     TIME                                             NULL,
    closing_time     TIME                                             NULL,
    created_at       DATETIME                                         NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_operating_day_center FOREIGN KEY (center_id) REFERENCES centers(center_id) ON DELETE CASCADE,
    CONSTRAINT uk_center_day UNIQUE KEY (center_id, day_of_week),
    INDEX idx_center_operating (center_id, day_of_week)
);

-- ── Service Center Capacity Tracking ───────────────────────────
-- Track real-time capacity and queue information
CREATE TABLE IF NOT EXISTS center_capacity_log (
    log_id              INT           AUTO_INCREMENT PRIMARY KEY,
    center_id           INT           NOT NULL,
    current_capacity    INT           NOT NULL DEFAULT 0 COMMENT 'Current number of people being served',
    queue_length        INT           NOT NULL DEFAULT 0 COMMENT 'Number of people waiting',
    max_capacity        INT           NOT NULL COMMENT 'Maximum capacity for this center',
    timestamp           DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_capacity_center FOREIGN KEY (center_id) REFERENCES centers(center_id) ON DELETE CASCADE,
    INDEX idx_center_timestamp (center_id, timestamp)
);

-- ── Insert Default Operating Days (Monday-Friday) ──────────────
-- Populate default operating days for existing centers
INSERT INTO center_operating_days (center_id, day_of_week, is_open, opening_time, closing_time)
SELECT 
    center_id,
    day,
    TRUE,
    '08:00:00',
    '17:00:00'
FROM centers
CROSS JOIN (
    SELECT 'monday' AS day UNION ALL
    SELECT 'tuesday' UNION ALL
    SELECT 'wednesday' UNION ALL
    SELECT 'thursday' UNION ALL
    SELECT 'friday'
) AS weekdays
ON DUPLICATE KEY UPDATE operating_day_id = operating_day_id;

-- ── Create View for Current Availability ───────────────────────
-- Simplified view to check if a center is currently available
CREATE OR REPLACE VIEW v_center_current_availability AS
SELECT 
    c.center_id,
    c.name,
    c.address,
    c.capacity AS max_capacity,
    c.is_active,
    COALESCE(ca.is_available, TRUE) AS is_available_today,
    COALESCE(ca.opening_time, c.opening_time) AS today_opening_time,
    COALESCE(ca.closing_time, c.closing_time) AS today_closing_time,
    ca.reason AS unavailability_reason,
    CASE 
        WHEN c.is_active = FALSE THEN FALSE
        WHEN ca.is_available = FALSE THEN FALSE
        WHEN CURRENT_TIME() BETWEEN COALESCE(ca.opening_time, c.opening_time) AND COALESCE(ca.closing_time, c.closing_time) THEN TRUE
        ELSE FALSE
    END AS is_currently_open
FROM centers c
LEFT JOIN center_availability ca 
    ON c.center_id = ca.center_id 
    AND ca.date = CURDATE();

-- ── Indexes for Performance ────────────────────────────────────
CREATE INDEX idx_centers_active ON centers(is_active);
CREATE INDEX idx_availability_date ON center_availability(date);

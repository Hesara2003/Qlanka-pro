-- QueueLanka ServiceCenter Service — Database Schema
-- Consolidated from monolith migrations: 001 (centers), 003, 006 (partial), 008

-- ── Centers ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS centers (
    center_id                    INT           AUTO_INCREMENT PRIMARY KEY,
    name                         VARCHAR(100)  NOT NULL,
    address                      VARCHAR(255)  NOT NULL,
    timezone                     VARCHAR(50)   NOT NULL DEFAULT 'Asia/Colombo',
    capacity                     INT           NOT NULL DEFAULT 50,
    is_active                    BOOLEAN       NOT NULL DEFAULT TRUE,
    phone                        VARCHAR(20)   NULL,
    email                        VARCHAR(100)  NULL,
    description                  TEXT          NULL,
    opening_time                 TIME          NOT NULL DEFAULT '08:00:00',
    closing_time                 TIME          NOT NULL DEFAULT '17:00:00',
    average_service_time_minutes INT           NOT NULL DEFAULT 15,
    created_at                   DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at                   DATETIME      NULL ON UPDATE CURRENT_TIMESTAMP
);

CREATE INDEX idx_centers_active ON centers(is_active);

-- ── Service Center Availability ────────────────────────────────
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

CREATE INDEX idx_availability_date ON center_availability(date);

-- ── Service Center Operating Days ──────────────────────────────
CREATE TABLE IF NOT EXISTS center_operating_days (
    operating_day_id INT AUTO_INCREMENT PRIMARY KEY,
    center_id        INT NOT NULL,
    day_of_week      ENUM('monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday') NOT NULL,
    is_open          BOOLEAN  NOT NULL DEFAULT TRUE,
    opening_time     TIME     NULL,
    closing_time     TIME     NULL,
    created_at       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_operating_day_center FOREIGN KEY (center_id) REFERENCES centers(center_id) ON DELETE CASCADE,
    CONSTRAINT uk_center_day UNIQUE KEY (center_id, day_of_week),
    INDEX idx_center_operating (center_id, day_of_week)
);

-- ── Capacity Tracking ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS center_capacity_log (
    log_id           INT      AUTO_INCREMENT PRIMARY KEY,
    center_id        INT      NOT NULL,
    current_capacity INT      NOT NULL DEFAULT 0,
    queue_length     INT      NOT NULL DEFAULT 0,
    max_capacity     INT      NOT NULL,
    timestamp        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_capacity_center FOREIGN KEY (center_id) REFERENCES centers(center_id) ON DELETE CASCADE,
    INDEX idx_center_timestamp (center_id, timestamp)
);

-- ── Structured Location ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS center_locations (
    location_id    INT              NOT NULL AUTO_INCREMENT,
    center_id      INT              NOT NULL,
    street_address VARCHAR(255)     NULL,
    city           VARCHAR(100)     NULL,
    district       VARCHAR(100)     NULL,
    province       VARCHAR(100)     NULL,
    postal_code    VARCHAR(20)      NULL,
    country        VARCHAR(100)     NOT NULL DEFAULT 'Sri Lanka',
    latitude       DECIMAL(10, 8)   NULL,
    longitude      DECIMAL(11, 8)   NULL,
    google_maps_url VARCHAR(500)    NULL,
    landmark       VARCHAR(255)     NULL,
    created_at     DATETIME         NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at     DATETIME         NULL     ON UPDATE CURRENT_TIMESTAMP,

    PRIMARY KEY (location_id),
    CONSTRAINT uk_location_center UNIQUE KEY (center_id),
    CONSTRAINT fk_location_center
        FOREIGN KEY (center_id) REFERENCES centers(center_id)
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT chk_coordinates CHECK (
        (latitude IS NULL AND longitude IS NULL)
        OR (latitude IS NOT NULL AND longitude IS NOT NULL)
    )
);

CREATE INDEX idx_location_city        ON center_locations (city);
CREATE INDEX idx_location_district    ON center_locations (district);
CREATE INDEX idx_location_province    ON center_locations (province);
CREATE INDEX idx_location_coordinates ON center_locations (latitude, longitude);

-- ── Views ──────────────────────────────────────────────────────
CREATE OR REPLACE VIEW v_center_current_availability AS
SELECT
    c.center_id, c.name, c.address, c.capacity AS max_capacity, c.is_active,
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
LEFT JOIN center_availability ca ON c.center_id = ca.center_id AND ca.date = CURDATE();

CREATE OR REPLACE VIEW v_center_with_location AS
SELECT
    c.center_id, c.name, c.address AS full_address, c.phone, c.email, c.description,
    c.timezone, c.capacity, c.average_service_time_minutes,
    c.opening_time, c.closing_time, c.is_active, c.created_at, c.updated_at,
    cl.location_id, cl.street_address, cl.city, cl.district, cl.province, cl.postal_code,
    cl.country, cl.latitude, cl.longitude, cl.google_maps_url, cl.landmark
FROM centers c
LEFT JOIN center_locations cl ON c.center_id = cl.center_id;

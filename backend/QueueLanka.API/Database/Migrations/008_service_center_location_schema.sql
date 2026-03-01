-- QueueLanka Pro — Service Center Location Schema
-- Sprint 4 | SCRUM-72
--
-- Design goals
--   1. Efficient retrieval: indexed on city, district, province, and coordinates.
--   2. Accurate association: 1-to-1 FK from center_locations → centers (UNIQUE on center_id).
--   3. Non-destructive: existing `address` column on centers is kept for backwards compat;
--      structured location data lives in the new table.
--   4. Fixes missing columns that the ORM already expects but that were never migrated.

USE queuelanka;

-- ── Fix gap: average_service_time_minutes was used by the repository ──────────
-- (never added in 001 or 003; safe to add idempotently)
ALTER TABLE centers
    ADD COLUMN IF NOT EXISTS average_service_time_minutes INT NOT NULL DEFAULT 15
        COMMENT 'Estimated minutes to serve one customer; used for ETA calculations';

-- ── Structured location table ─────────────────────────────────────────────────
--
-- Relationship: one center_locations row per center (1 : 0..1)
--   centers.center_id  ←FK──  center_locations.center_id  (UNIQUE)
--
-- All address sub-fields are nullable so partial data is accepted gracefully.
-- Geocoordinates use DECIMAL precision recommended by the OpenGIS standard:
--   latitude  DECIMAL(10,8)  — full-circle range −90 … +90 with 8 decimal places (~1 mm precision)
--   longitude DECIMAL(11,8)  — full-circle range −180 … +180

CREATE TABLE IF NOT EXISTS center_locations (
    location_id    INT              NOT NULL AUTO_INCREMENT,
    center_id      INT              NOT NULL,

    -- ── Structured address ──────────────────────────────────────────────────
    street_address VARCHAR(255)     NULL     COMMENT 'Street number and name',
    city           VARCHAR(100)     NULL     COMMENT 'City or town',
    district       VARCHAR(100)     NULL     COMMENT 'Administrative district (e.g. Colombo)',
    province       VARCHAR(100)     NULL     COMMENT 'Province name (e.g. Western Province)',
    postal_code    VARCHAR(20)      NULL,
    country        VARCHAR(100)     NOT NULL DEFAULT 'Sri Lanka',

    -- ── Geocoordinates (optional) ───────────────────────────────────────────
    latitude       DECIMAL(10, 8)   NULL     COMMENT 'WGS-84 latitude  −90 to +90',
    longitude      DECIMAL(11, 8)   NULL     COMMENT 'WGS-84 longitude −180 to +180',
    google_maps_url VARCHAR(500)    NULL     COMMENT 'Deep link to Google Maps pin',

    -- ── Extra context ───────────────────────────────────────────────────────
    landmark       VARCHAR(255)     NULL     COMMENT 'Nearby landmark to aid navigation',

    -- ── Audit ───────────────────────────────────────────────────────────────
    created_at     DATETIME         NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at     DATETIME         NULL     ON UPDATE CURRENT_TIMESTAMP,

    -- ── Constraints ─────────────────────────────────────────────────────────
    PRIMARY KEY (location_id),

    -- Enforces the 1-to-1 relationship: one center owns at most one location row
    CONSTRAINT uk_location_center UNIQUE KEY (center_id),

    CONSTRAINT fk_location_center
        FOREIGN KEY (center_id) REFERENCES centers(center_id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    -- Coordinates must both be present or both absent
    CONSTRAINT chk_coordinates
        CHECK (
            (latitude IS NULL AND longitude IS NULL)
            OR
            (latitude IS NOT NULL AND longitude IS NOT NULL)
        )
);

-- ── Performance indexes ───────────────────────────────────────────────────────
-- Lookup by city, district, province — used for filtered listings / search
CREATE INDEX idx_location_city     ON center_locations (city);
CREATE INDEX idx_location_district ON center_locations (district);
CREATE INDEX idx_location_province ON center_locations (province);

-- Proximity / geo queries (e.g. "find centers within N km")
CREATE INDEX idx_location_coordinates ON center_locations (latitude, longitude);

-- ── Convenience view joining centers with their location row ──────────────────
-- Consumers can JOIN or SELECT directly without writing the JOIN themselves.
CREATE OR REPLACE VIEW v_center_with_location AS
SELECT
    -- Core center fields
    c.center_id,
    c.name,
    c.address                        AS full_address,     -- legacy flat address
    c.phone,
    c.email,
    c.description,
    c.timezone,
    c.capacity,
    c.average_service_time_minutes,
    c.opening_time,
    c.closing_time,
    c.is_active,
    c.created_at,
    c.updated_at,

    -- Structured location fields (NULL when no location row exists yet)
    cl.location_id,
    cl.street_address,
    cl.city,
    cl.district,
    cl.province,
    cl.postal_code,
    cl.country,
    cl.latitude,
    cl.longitude,
    cl.google_maps_url,
    cl.landmark
FROM
    centers c
    LEFT JOIN center_locations cl ON c.center_id = cl.center_id;

-- ── Back-fill location rows for any centers that already exist ────────────────
-- Parses the legacy flat `address` column into street_address; city/district are
-- left NULL until an admin fills them in through the UI.
INSERT INTO center_locations (center_id, street_address, country)
SELECT
    center_id,
    address,   -- flat string becomes the street_address placeholder
    'Sri Lanka'
FROM centers
ON DUPLICATE KEY UPDATE location_id = location_id;   -- idempotent re-run

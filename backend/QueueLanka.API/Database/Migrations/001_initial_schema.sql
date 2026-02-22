-- QueueLanka Pro — Initial Schema Migration
-- Sprint 1 | SCRUM-13

CREATE DATABASE IF NOT EXISTS queuelanka
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

USE queuelanka;

-- ── Centers ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS centers (
    center_id  INT           AUTO_INCREMENT PRIMARY KEY,
    name       VARCHAR(100)  NOT NULL,
    address    VARCHAR(255)  NOT NULL,
    timezone   VARCHAR(50)   NOT NULL DEFAULT 'Asia/Colombo',
    capacity   INT           NOT NULL DEFAULT 50,
    is_active  BOOLEAN       NOT NULL DEFAULT TRUE,
    created_at DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ── Users ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
    user_id       INT           AUTO_INCREMENT PRIMARY KEY,
    username      VARCHAR(50)   NOT NULL UNIQUE,
    email         VARCHAR(100)  NOT NULL UNIQUE,
    password_hash VARCHAR(255)  NOT NULL,
    role          ENUM('citizen', 'officer', 'admin') NOT NULL,
    center_id     INT           NULL,
    is_active     BOOLEAN       NOT NULL DEFAULT TRUE,
    created_at    DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_user_center FOREIGN KEY (center_id) REFERENCES centers(center_id)
);

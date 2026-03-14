-- QueueLanka Pro — Token Position and ETA Schema Update
-- Sprint 2 | SCRUM-48

USE queuelanka;

-- ── 1. Update Centers Table ──────────────────────────────────────
-- Add average_service_time_minutes to store explicit expected service duration
ALTER TABLE centers
ADD COLUMN average_service_time_minutes INT NOT NULL DEFAULT 15;

-- ── 2. Update Tokens Table ───────────────────────────────────────
-- Add queue_position to explicitly track token position if needed for efficient querying.
ALTER TABLE tokens
ADD COLUMN queue_position INT NULL COMMENT 'Explicit position when in Waiting status, NULL otherwise';

-- Add an index to efficiently query by queue_position and status
CREATE INDEX idx_token_status_position ON tokens (center_id, status, queue_position);

-- Migration: Add performance indexes for jobs and usage_logs tables
-- Date: 2025-11-09
-- Priority: P0 Critical
-- Estimated Time: 30 minutes

-- Add index for jobs table: user_id + created_at (for user's job history queries)
CREATE INDEX IF NOT EXISTS idx_jobs_user_created
ON jobs(user_id, created_at DESC);

-- Add index for jobs table: status (for filtering jobs by status)
CREATE INDEX IF NOT EXISTS idx_jobs_status
ON jobs(status);

-- Add index for usage_logs table: user_id + created_at (for user's usage history queries)
CREATE INDEX IF NOT EXISTS idx_usage_logs_user_created
ON usage_logs(user_id, created_at DESC);

-- Analyze tables to update statistics
ANALYZE jobs;
ANALYZE usage_logs;

-- Migration rollback script (if needed):
-- DROP INDEX IF EXISTS idx_jobs_user_created;
-- DROP INDEX IF EXISTS idx_jobs_status;
-- DROP INDEX IF EXISTS idx_usage_logs_user_created;

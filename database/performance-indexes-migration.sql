-- Performance Optimization Migration
-- Add indexes to improve query performance
-- Run this on existing databases to add missing indexes

-- Check if indexes exist before creating (safe for repeated runs)
-- Note: Use CREATE INDEX IF NOT EXISTS for PostgreSQL 9.5+

-- User table indexes
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_pupils_active ON pupils(active);
CREATE INDEX IF NOT EXISTS idx_pupils_school_active ON pupils(school_id, active);

-- Attendance indexes for date sorting
CREATE INDEX IF NOT EXISTS idx_attendance_date ON attendance(date DESC);
CREATE INDEX IF NOT EXISTS idx_attendance_date_pupil ON attendance(date DESC, pupil_id);

-- Marks indexes for sorting
CREATE INDEX IF NOT EXISTS idx_marks_recorded_at ON marks(recorded_at DESC);

-- Notifications indexes for sorting
CREATE INDEX IF NOT EXISTS idx_notifications_timestamp ON notifications(timestamp DESC);

-- Audit logs indexes
CREATE INDEX IF NOT EXISTS idx_audit_logs_actor ON audit_logs(actor_id);

-- Composite indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_pupils_school_class ON pupils(school_id, class_id);

-- Add comment for documentation
COMMENT ON INDEX idx_pupils_school_active IS 'Optimizes queries filtering active pupils by school';
COMMENT ON INDEX idx_attendance_date_pupil IS 'Optimizes attendance queries with date sorting';
COMMENT ON INDEX idx_marks_recorded_at IS 'Optimizes marks queries with timestamp sorting';
COMMENT ON INDEX idx_notifications_timestamp IS 'Optimizes notification queries with timestamp sorting';

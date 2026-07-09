-- ============================================================
-- Kindy Connect – Performance Indexes Migration
-- Run this once in your Supabase SQL Editor:
--   https://supabase.com/dashboard → your project → SQL Editor
-- ============================================================

-- Attendance table: queried heavily by pupil_id (attendance lookup per pupil)
-- and by date (today's attendance filter used on every dashboard load)
CREATE INDEX IF NOT EXISTS idx_attendance_pupil_id   ON attendance(pupil_id);
CREATE INDEX IF NOT EXISTS idx_attendance_date        ON attendance(date DESC);
-- Composite index for the common combined query (pupil_id AND date)
CREATE INDEX IF NOT EXISTS idx_attendance_pupil_date  ON attendance(pupil_id, date DESC);

-- Marks table: queried by pupil_id when loading a pupil's report card
CREATE INDEX IF NOT EXISTS idx_marks_pupil_id        ON marks(pupil_id);
CREATE INDEX IF NOT EXISTS idx_marks_recorded_at     ON marks(recorded_at DESC);

-- pupil_parents junction table: used in JOIN every time we load pupils
CREATE INDEX IF NOT EXISTS idx_pupil_parents_pupil_id  ON pupil_parents(pupil_id);
CREATE INDEX IF NOT EXISTS idx_pupil_parents_parent_id ON pupil_parents(parent_id);

-- Users table: filtered by school_id and role constantly
CREATE INDEX IF NOT EXISTS idx_users_school_id       ON users(school_id);
CREATE INDEX IF NOT EXISTS idx_users_role            ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_status          ON users(status);

-- Pupils table: filtered by school_id and class_id on every page
CREATE INDEX IF NOT EXISTS idx_pupils_school_id      ON pupils(school_id);
CREATE INDEX IF NOT EXISTS idx_pupils_class_id       ON pupils(class_id);
CREATE INDEX IF NOT EXISTS idx_pupils_active         ON pupils(active) WHERE active = true;

-- Classes table: filtered by school_id
CREATE INDEX IF NOT EXISTS idx_classes_school_id     ON classes(school_id);

-- Notifications table: ordered by timestamp on dashboard
CREATE INDEX IF NOT EXISTS idx_notifications_timestamp ON notifications(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_pupil_id  ON notifications(pupil_id);

-- Audit logs table: ordered by timestamp
CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp  ON audit_logs(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_actor_id   ON audit_logs(actor_id);

-- Parents table: filtered by school_id
CREATE INDEX IF NOT EXISTS idx_parents_school_id     ON parents(school_id);

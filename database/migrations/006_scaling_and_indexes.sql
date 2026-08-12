-- Migration 006: Database Scaling & Index Optimization for High-Performance Querying

-- Composite index for rapid pupil report card and mark filtering (by pupil, subject, term, year)
CREATE INDEX IF NOT EXISTS idx_marks_pupil_subject_term_year ON marks(pupil_id, subject, term, year);

-- Reverse foreign key index on pupil_parents join table for parent-to-pupil lookups
CREATE INDEX IF NOT EXISTS idx_pupil_parents_parent ON pupil_parents(parent_id);

-- Composite index on attendance ordered by date DESC and arrival for daily status queries
CREATE INDEX IF NOT EXISTS idx_attendance_date_arrival ON attendance(date DESC, arrival DESC);

-- Composite index for multi-tenant school users and role filtering
CREATE INDEX IF NOT EXISTS idx_users_school_role ON users(school_id, role);

-- Composite index for multi-tenant pupil roster queries by school and class
CREATE INDEX IF NOT EXISTS idx_pupils_school_class ON pupils(school_id, class_id);

-- Composite index on notifications by pupil and timestamp
CREATE INDEX IF NOT EXISTS idx_notifications_pupil_timestamp ON notifications(pupil_id, timestamp DESC);

-- Composite index on audit logs by actor and timestamp
CREATE INDEX IF NOT EXISTS idx_audit_logs_actor_timestamp ON audit_logs(actor_id, timestamp DESC);

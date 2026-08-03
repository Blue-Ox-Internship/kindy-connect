-- SQL Script to Clear All Mock Data from Kindy Connect Database
-- Keeps super_admin user accounts (KC001, KC002, KC003, admin) so system login remains accessible.

BEGIN;

-- 1. Truncate dependent transactional tables
TRUNCATE TABLE marks CASCADE;
TRUNCATE TABLE attendance CASCADE;
TRUNCATE TABLE notifications CASCADE;
TRUNCATE TABLE audit_logs CASCADE;
TRUNCATE TABLE pupil_parents CASCADE;

-- 2. Truncate pupils and parents
TRUNCATE TABLE pupils CASCADE;
TRUNCATE TABLE parents CASCADE;

-- 3. Clear classes
DELETE FROM classes;

-- 4. Delete non-superadmin users (keep super_admin accounts)
DELETE FROM users WHERE role != 'super_admin';

-- 5. Delete schools (since all mock schools s1, s2, s3 are mock test schools)
DELETE FROM schools;

COMMIT;

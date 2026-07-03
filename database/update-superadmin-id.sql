-- Quick fix to update existing superadmin user ID to KC001
-- Run this if you don't want to re-seed the entire database

UPDATE users SET id = 'KC001' WHERE role = 'super_admin' AND id = 'superadmin';

-- Update any references in audit logs
UPDATE audit_logs SET actor_id = 'KC001' WHERE actor_id = 'superadmin';

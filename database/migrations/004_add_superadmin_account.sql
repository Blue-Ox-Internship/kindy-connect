-- Migration 004: Add Super Admin Account (KC001)
-- This creates the system administrator account with access to all schools

-- Insert Super Admin account if it doesn't exist
INSERT INTO users (id, name, email, role, status, phone, registered_at, password, class_id, school_id) 
VALUES ('KC001', 'System Administrator', 'superadmin@kinder.app', 'super_admin', 'verified', '+254700000000', CURRENT_DATE, 'admin123', NULL, NULL)
ON CONFLICT (id) DO UPDATE 
SET 
  role = 'super_admin',
  status = 'verified',
  school_id = NULL,
  class_id = NULL;

-- Update any existing 'superadmin' user ID to 'KC001' (if exists)
UPDATE users SET id = 'KC001' 
WHERE role = 'super_admin' AND id = 'superadmin'
AND NOT EXISTS (SELECT 1 FROM users WHERE id = 'KC001');

-- Update audit log references
UPDATE audit_logs SET actor_id = 'KC001' WHERE actor_id = 'superadmin';

-- Verify the Super Admin account
SELECT id, name, email, role, status, school_id 
FROM users 
WHERE role = 'super_admin';

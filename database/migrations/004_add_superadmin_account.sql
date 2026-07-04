-- Migration 004: Add Super Admin Accounts (KC001, KC002, KC003)
-- This creates the system administrator accounts with access to all schools

-- Insert Super Admin account KC001 if it doesn't exist
INSERT INTO users (id, name, email, role, status, phone, registered_at, password, class_id, school_id) 
VALUES ('KC001', 'System Administrator', 'superadmin@kinder.app', 'super_admin', 'verified', '+254700000000', CURRENT_DATE, 'admin123', NULL, NULL)
ON CONFLICT (id) DO UPDATE 
SET 
  role = 'super_admin',
  status = 'verified',
  school_id = NULL,
  class_id = NULL;

-- Insert KC002 Super Admin account
INSERT INTO users (id, name, email, role, status, phone, registered_at, password, class_id, school_id) 
VALUES ('KC002', 'System Administrator 2', 'superadmin2@kinder.app', 'super_admin', 'verified', '+254700000001', CURRENT_DATE, 'admin123', NULL, NULL)
ON CONFLICT (id) DO UPDATE 
SET 
  role = 'super_admin',
  status = 'verified',
  school_id = NULL,
  class_id = NULL;

-- Insert KC003 Super Admin account
INSERT INTO users (id, name, email, role, status, phone, registered_at, password, class_id, school_id) 
VALUES ('KC003', 'System Administrator 3', 'superadmin3@kinder.app', 'super_admin', 'verified', '+254700000002', CURRENT_DATE, 'admin123', NULL, NULL)
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

-- Verify the Super Admin accounts
SELECT id, name, email, role, status, school_id 
FROM users 
WHERE role = 'super_admin';

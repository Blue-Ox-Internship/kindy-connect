-- Migration: Add quick superadmin user for easy login
-- Created: 2025-01-09
-- Description: Creates a superadmin user with simple login credentials

-- Delete any existing 'admin' user to avoid conflicts
DELETE FROM users WHERE id = 'admin';

-- Insert the superadmin user
INSERT INTO users (
    id, 
    name, 
    email, 
    role, 
    status, 
    phone, 
    registered_at, 
    password, 
    class_id, 
    school_id, 
    subjects
) VALUES (
    'admin',
    'Super Administrator',
    'admin@kindy.app',
    'super_admin',
    'verified',
    '+254700000000',
    CURRENT_DATE,
    'admin123',
    NULL,
    NULL,
    NULL
);

-- Log the action
DO $$
BEGIN
    RAISE NOTICE 'Superadmin user created successfully!';
    RAISE NOTICE '  Login ID: admin';
    RAISE NOTICE '  Password: admin123';
END $$;

-- Add a simple superadmin user for quick login
-- Login ID: admin
-- Password: admin123

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

-- Verify the user was added
SELECT id, name, email, role, status 
FROM users 
WHERE id = 'admin';

-- Show all superadmin users for reference
SELECT id, name, email, role, status 
FROM users 
WHERE role = 'super_admin' 
ORDER BY id;

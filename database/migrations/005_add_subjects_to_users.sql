-- Migration: Add subjects field to users table for teacher subject assignments
-- This allows restricting teachers to specific subjects they can teach

ALTER TABLE users ADD COLUMN IF NOT EXISTS subjects TEXT[];

-- Add comment
COMMENT ON COLUMN users.subjects IS 'Array of subjects a teacher is assigned to teach (e.g., {"Math", "Science", "Reading"})';

-- Update existing teachers to have access to all subjects by default
UPDATE users 
SET subjects = ARRAY['Reading', 'Math', 'Writing', 'Art', 'Music', 'Physical Education', 'Science']
WHERE role = 'teacher' AND subjects IS NULL;

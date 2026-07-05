-- Migration: Add subjects column to users table
-- Description: Adds subjects TEXT[] column to store teacher subject assignments
-- Date: 2025-07-05

-- Add the subjects column if it doesn't exist
ALTER TABLE users ADD COLUMN IF NOT EXISTS subjects TEXT[];

-- Verify the column was added
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'users' AND column_name = 'subjects';

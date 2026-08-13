-- Migration 008: Add subjects column to classes table
-- Allows assigning specific subjects that each class does

ALTER TABLE classes ADD COLUMN IF NOT EXISTS subjects TEXT[];

COMMENT ON COLUMN classes.subjects IS 'Array of subject names or IDs assigned to this class';

-- Migration: Add custom subjects table per school
-- Description: Allows school admins to create, edit, and delete customised subjects for their school.

CREATE TABLE IF NOT EXISTS subjects (
    id VARCHAR(50) PRIMARY KEY,
    school_id VARCHAR(50) NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    code VARCHAR(20),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unq_school_subject_name UNIQUE (school_id, name)
);

CREATE INDEX IF NOT EXISTS idx_subjects_school ON subjects(school_id);

-- RLS Policies for subjects
ALTER TABLE subjects ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "subjects_select_policy" ON subjects;
CREATE POLICY "subjects_select_policy" ON subjects
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM users 
        WHERE users.id = auth.uid()::text 
        AND users.status = 'verified'
        AND (
            users.role = 'super_admin'
            OR users.school_id = subjects.school_id
        )
    )
);

DROP POLICY IF EXISTS "subjects_insert_policy" ON subjects;
CREATE POLICY "subjects_insert_policy" ON subjects
FOR INSERT
TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1 FROM users 
        WHERE users.id = auth.uid()::text 
        AND users.status = 'verified'
        AND users.role IN ('super_admin', 'admin', 'deputy')
        AND (users.role = 'super_admin' OR users.school_id = subjects.school_id)
    )
);

DROP POLICY IF EXISTS "subjects_update_policy" ON subjects;
CREATE POLICY "subjects_update_policy" ON subjects
FOR UPDATE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM users 
        WHERE users.id = auth.uid()::text 
        AND users.status = 'verified'
        AND users.role IN ('super_admin', 'admin', 'deputy')
        AND (users.role = 'super_admin' OR users.school_id = subjects.school_id)
    )
);

DROP POLICY IF EXISTS "subjects_delete_policy" ON subjects;
CREATE POLICY "subjects_delete_policy" ON subjects
FOR DELETE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM users 
        WHERE users.id = auth.uid()::text 
        AND users.status = 'verified'
        AND users.role IN ('super_admin', 'admin', 'deputy')
        AND (users.role = 'super_admin' OR users.school_id = subjects.school_id)
    )
);

-- Seed default standard subjects for all existing schools
INSERT INTO subjects (id, school_id, name, code)
SELECT 
    'subj_' || s.id || '_' || lower(replace(sub.name, ' ', '_')) AS id,
    s.id AS school_id,
    sub.name,
    sub.code
FROM schools s
CROSS JOIN (
    VALUES 
        ('Reading', 'RDG'),
        ('Math', 'MTH'),
        ('Writing', 'WRT'),
        ('Art', 'ART'),
        ('Music', 'MUS'),
        ('Physical Education', 'PE'),
        ('Science', 'SCI')
) AS sub(name, code)
ON CONFLICT (school_id, name) DO NOTHING;

-- Seed Data: Add 10 Pupils to Nicreen Infant School
-- Date: 2026-07-06

-- First, let's get the school_id and a class_id for Nicreen Infant School
-- Assuming the school exists with name 'Nicreen Infant School'

-- Insert Parents
INSERT INTO parents (id, name, phone, email, relationship, school_id) VALUES
('p-nic-001', 'Mary Johnson', '+254701234001', 'mary.johnson@email.com', 'Mother', (SELECT id FROM schools WHERE name LIKE '%Nicreen%' LIMIT 1)),
('p-nic-002', 'James Smith', '+254701234002', 'james.smith@email.com', 'Father', (SELECT id FROM schools WHERE name LIKE '%Nicreen%' LIMIT 1)),
('p-nic-003', 'Sarah Williams', '+254701234003', 'sarah.williams@email.com', 'Mother', (SELECT id FROM schools WHERE name LIKE '%Nicreen%' LIMIT 1)),
('p-nic-004', 'David Brown', '+254701234004', 'david.brown@email.com', 'Father', (SELECT id FROM schools WHERE name LIKE '%Nicreen%' LIMIT 1)),
('p-nic-005', 'Emily Davis', '+254701234005', 'emily.davis@email.com', 'Mother', (SELECT id FROM schools WHERE name LIKE '%Nicreen%' LIMIT 1)),
('p-nic-006', 'Michael Wilson', '+254701234006', 'michael.wilson@email.com', 'Father', (SELECT id FROM schools WHERE name LIKE '%Nicreen%' LIMIT 1)),
('p-nic-007', 'Grace Taylor', '+254701234007', 'grace.taylor@email.com', 'Mother', (SELECT id FROM schools WHERE name LIKE '%Nicreen%' LIMIT 1)),
('p-nic-008', 'Peter Anderson', '+254701234008', 'peter.anderson@email.com', 'Father', (SELECT id FROM schools WHERE name LIKE '%Nicreen%' LIMIT 1)),
('p-nic-009', 'Linda Martinez', '+254701234009', 'linda.martinez@email.com', 'Mother', (SELECT id FROM schools WHERE name LIKE '%Nicreen%' LIMIT 1)),
('p-nic-010', 'Robert Garcia', '+254701234010', 'robert.garcia@email.com', 'Father', (SELECT id FROM schools WHERE name LIKE '%Nicreen%' LIMIT 1));

-- Insert Pupils
INSERT INTO pupils (id, admission_no, first_name, last_name, gender, dob, class_id, active, school_id) VALUES
('pupil-nic-001', 'NIS-001', 'Emma', 'Johnson', 'F', '2021-03-15', (SELECT id FROM classes WHERE school_id = (SELECT id FROM schools WHERE name LIKE '%Nicreen%' LIMIT 1) LIMIT 1), TRUE, (SELECT id FROM schools WHERE name LIKE '%Nicreen%' LIMIT 1)),
('pupil-nic-002', 'NIS-002', 'Oliver', 'Smith', 'M', '2021-05-20', (SELECT id FROM classes WHERE school_id = (SELECT id FROM schools WHERE name LIKE '%Nicreen%' LIMIT 1) LIMIT 1), TRUE, (SELECT id FROM schools WHERE name LIKE '%Nicreen%' LIMIT 1)),
('pupil-nic-003', 'NIS-003', 'Sophia', 'Williams', 'F', '2021-07-10', (SELECT id FROM classes WHERE school_id = (SELECT id FROM schools WHERE name LIKE '%Nicreen%' LIMIT 1) LIMIT 1), TRUE, (SELECT id FROM schools WHERE name LIKE '%Nicreen%' LIMIT 1)),
('pupil-nic-004', 'NIS-004', 'Liam', 'Brown', 'M', '2021-02-28', (SELECT id FROM classes WHERE school_id = (SELECT id FROM schools WHERE name LIKE '%Nicreen%' LIMIT 1) LIMIT 1), TRUE, (SELECT id FROM schools WHERE name LIKE '%Nicreen%' LIMIT 1)),
('pupil-nic-005', 'NIS-005', 'Ava', 'Davis', 'F', '2021-06-12', (SELECT id FROM classes WHERE school_id = (SELECT id FROM schools WHERE name LIKE '%Nicreen%' LIMIT 1) LIMIT 1), TRUE, (SELECT id FROM schools WHERE name LIKE '%Nicreen%' LIMIT 1)),
('pupil-nic-006', 'NIS-006', 'Noah', 'Wilson', 'M', '2021-04-18', (SELECT id FROM classes WHERE school_id = (SELECT id FROM schools WHERE name LIKE '%Nicreen%' LIMIT 1) LIMIT 1), TRUE, (SELECT id FROM schools WHERE name LIKE '%Nicreen%' LIMIT 1)),
('pupil-nic-007', 'NIS-007', 'Isabella', 'Taylor', 'F', '2021-08-22', (SELECT id FROM classes WHERE school_id = (SELECT id FROM schools WHERE name LIKE '%Nicreen%' LIMIT 1) LIMIT 1), TRUE, (SELECT id FROM schools WHERE name LIKE '%Nicreen%' LIMIT 1)),
('pupil-nic-008', 'NIS-008', 'Ethan', 'Anderson', 'M', '2021-01-30', (SELECT id FROM classes WHERE school_id = (SELECT id FROM schools WHERE name LIKE '%Nicreen%' LIMIT 1) LIMIT 1), TRUE, (SELECT id FROM schools WHERE name LIKE '%Nicreen%' LIMIT 1)),
('pupil-nic-009', 'NIS-009', 'Mia', 'Martinez', 'F', '2021-09-05', (SELECT id FROM classes WHERE school_id = (SELECT id FROM schools WHERE name LIKE '%Nicreen%' LIMIT 1) LIMIT 1), TRUE, (SELECT id FROM schools WHERE name LIKE '%Nicreen%' LIMIT 1)),
('pupil-nic-010', 'NIS-010', 'Lucas', 'Garcia', 'M', '2021-11-14', (SELECT id FROM classes WHERE school_id = (SELECT id FROM schools WHERE name LIKE '%Nicreen%' LIMIT 1) LIMIT 1), TRUE, (SELECT id FROM schools WHERE name LIKE '%Nicreen%' LIMIT 1));

-- Link Pupils to Parents
INSERT INTO pupil_parents (pupil_id, parent_id) VALUES
('pupil-nic-001', 'p-nic-001'),
('pupil-nic-002', 'p-nic-002'),
('pupil-nic-003', 'p-nic-003'),
('pupil-nic-004', 'p-nic-004'),
('pupil-nic-005', 'p-nic-005'),
('pupil-nic-006', 'p-nic-006'),
('pupil-nic-007', 'p-nic-007'),
('pupil-nic-008', 'p-nic-008'),
('pupil-nic-009', 'p-nic-009'),
('pupil-nic-010', 'p-nic-010');

-- Insert Audit Log Entry
INSERT INTO audit_logs (id, actor_id, actor_name, action, target, timestamp) VALUES
('audit-nic-seed', 'system', 'System', 'Seeded 10 pupils', 'Nicreen Infant School', CURRENT_TIMESTAMP);

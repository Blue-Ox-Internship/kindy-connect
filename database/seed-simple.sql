-- Simple Kindy Connect Seed Data (with Schools & Super Admin)

-- 1. Insert Schools
INSERT INTO schools (id, name, address, phone, email, registered_at) VALUES
('s1', 'Little Stars Kindergarten', '123 Sunshine Blvd, Nairobi', '+254711111111', 'littlestars@kinder.app', '2025-01-01');

-- 2. Insert Classes
INSERT INTO classes (id, name, teacher_id, school_id) VALUES
('c1', 'Sunflower', NULL, 's1');

-- 3. Insert Users (including Super Admin, Admin, Deputy, Teacher)
INSERT INTO users (id, name, email, role, status, phone, registered_at, password, class_id, school_id) VALUES
('superadmin', 'System Administrator', 'superadmin@kinder.app', 'super_admin', 'verified', '+254700000000', '2025-01-01', 'admin123', NULL, NULL),
('u1', 'Amina Okello', 'admin@kinder.app', 'admin', 'verified', '+254700000001', '2025-01-10', 'admin123', NULL, 's1'),
('u2', 'Brian Mwangi', 'deputy@kinder.app', 'deputy', 'verified', '+254700000002', '2025-01-12', 'deputy123', NULL, 's1'),
('u3', 'Grace Wanjiku', 'grace@kinder.app', 'teacher', 'verified', '+254700000003', '2025-02-01', 'grace123', 'c1', 's1');

-- 4. Update Classes to map teacher
UPDATE classes SET teacher_id = 'u3' WHERE id = 'c1';

-- 5. Insert Parents
INSERT INTO parents (id, name, phone, email, relationship, school_id) VALUES
('p1', 'Mary Atieno', '+254712000001', 'mary@example.com', 'Mother', 's1'),
('p2', 'John Kamau', '+254712000002', 'john@example.com', 'Father', 's1');

-- 6. Insert Pupils (3 pupils in Sunflower class)
INSERT INTO pupils (id, admission_no, first_name, last_name, gender, dob, class_id, photo, active, school_id) VALUES
('k1', 'KG-001', 'Liam', 'Atieno', 'M', '2020-05-12', 'c1', NULL, TRUE, 's1'),
('k2', 'KG-002', 'Zuri', 'Kamau', 'F', '2020-08-22', 'c1', NULL, TRUE, 's1'),
('k3', 'KG-003', 'Maya', 'Atieno', 'F', '2020-07-14', 'c1', NULL, TRUE, 's1');

-- 7. Link Pupils to Parents
INSERT INTO pupil_parents (pupil_id, parent_id) VALUES
('k1', 'p1'),
('k2', 'p2'),
('k3', 'p1');

-- 8. Insert Today's Attendance
INSERT INTO attendance (
    id, pupil_id, date, arrival, departure, 
    arrival_transport, arrival_vehicle_reg, arrival_person_name, arrival_person_relation, arrival_phone
) VALUES
('a1', 'k1', CURRENT_DATE, '07:55', NULL, 'Car', 'KAA 123B', 'Mary Atieno', 'Mother', '+254712000001'),
('a2', 'k2', CURRENT_DATE, '08:02', NULL, 'School Bus', 'KBZ 456C', 'John Kariuki', 'Driver', '+254700000004');

-- 9. Insert Notifications
INSERT INTO notifications (id, pupil_id, parent_id, channel, type, status, message, timestamp, phone_number) VALUES
('n1', 'k1', 'p1', 'sms', 'arrival', 'sent', 'Dear Mary Atieno, your child Liam Atieno has arrived safely at school today at 07:55.', CURRENT_TIMESTAMP - INTERVAL '2 hours', '+254712000001'),
('n2', 'k2', 'p2', 'sms', 'arrival', 'sent', 'Dear John Kamau, your child Zuri Kamau has arrived safely at school today at 08:02.', CURRENT_TIMESTAMP - INTERVAL '1 hour', '+254712000002');

-- 10. Insert Audit Logs
INSERT INTO audit_logs (id, actor_id, actor_name, action, target, timestamp) VALUES
('l1', 'u1', 'Amina Okello', 'Created pupil', 'Liam Atieno (KG-001)', CURRENT_TIMESTAMP - INTERVAL '5 days'),
('l2', 'u3', 'Grace Wanjiku', 'Marked arrival', 'Liam Atieno', CURRENT_TIMESTAMP - INTERVAL '2 hours');

-- 11. Insert Marks
INSERT INTO marks (id, pupil_id, subject, term, year, score, max_score, grade, teacher_comment, recorded_by, recorded_at) VALUES
('m1', 'k1', 'Reading', 'Term 1', '2025', 85, 100, 'A', 'Excellent progress!', 'u3', '2025-03-15 10:30:00+03'),
('m2', 'k2', 'Math', 'Term 1', '2025', 92, 100, 'A', 'Outstanding!', 'u3', '2025-03-15 10:35:00+03');

-- Kindy Connect Database Seed Data (Supabase/PostgreSQL Compatible)

-- 1. Insert Classes (leaving teacher_id NULL temporarily to avoid circular reference)
INSERT INTO classes (id, name, teacher_id) VALUES
('c1', 'Baby', NULL),
('c2', 'Middle', NULL),
('c3', 'Top', NULL),
('c4', 'P1', NULL);

-- 2. Insert Users
INSERT INTO users (id, name, email, role, status, phone, registered_at, password, class_id) VALUES
('u1', 'Amina Okello', 'admin@kinder.app', 'admin', 'verified', '+254700000001', '2025-01-10', 'admin123', NULL),
('u2', 'Brian Mwangi', 'deputy@kinder.app', 'deputy', 'verified', '+254700000002', '2025-01-12', 'deputy123', NULL),
('u3', 'Grace Wanjiku', 'grace@kinder.app', 'teacher', 'verified', '+254700000003', '2025-02-01', 'grace123', 'c1'),
('u4', 'Peter Otieno', 'peter@kinder.app', 'teacher', 'verified', '+254700000004', '2025-02-03', 'peter123', 'c2'),
('u5', 'Lucy Achieng', 'lucy@kinder.app', 'teacher', 'pending', '+254700000005', '2025-06-15', 'lucy123', NULL),
('u6', 'James Kariuki', 'james@kinder.app', 'teacher', 'pending', '+254700000006', '2025-06-16', 'james123', NULL);

-- 3. Update Classes to map teacher_ids
UPDATE classes SET teacher_id = 'u3' WHERE id = 'c1';
UPDATE classes SET teacher_id = 'u4' WHERE id = 'c2';

-- 4. Insert Parents
INSERT INTO parents (id, name, phone, email, relationship) VALUES
('p1', 'Mary Atieno', '+254712000001', 'mary@example.com', 'Mother'),
('p2', 'John Kamau', '+254712000002', 'john@example.com', 'Father'),
('p3', 'Sarah Njeri', '+254712000003', 'sarah@example.com', 'Mother'),
('p4', 'David Mutua', '+254712000004', 'david@example.com', 'Father'),
('p5', 'Esther Wambui', '+254712000005', 'esther@example.com', 'Guardian');

-- 5. Insert Pupils
INSERT INTO pupils (id, admission_no, first_name, last_name, gender, dob, class_id, photo, active) VALUES
('k1', 'KG-001', 'Liam', 'Atieno', 'M', '2020-05-12', 'c1', NULL, TRUE),
('k2', 'KG-002', 'Zuri', 'Kamau', 'F', '2020-08-22', 'c1', NULL, TRUE),
('k3', 'KG-003', 'Noah', 'Njeri', 'M', '2019-11-03', 'c2', NULL, TRUE),
('k4', 'KG-004', 'Ava', 'Mutua', 'F', '2020-02-19', 'c2', NULL, TRUE),
('k5', 'KG-005', 'Eli', 'Wambui', 'M', '2019-09-30', 'c3', NULL, TRUE),
('k6', 'KG-006', 'Maya', 'Atieno', 'F', '2020-07-14', 'c1', NULL, TRUE);

-- 6. Insert Pupil-Parents Join Relationships (Many-to-Many mapping)
INSERT INTO pupil_parents (pupil_id, parent_id) VALUES
('k1', 'p1'),
('k2', 'p2'),
('k3', 'p3'),
('k4', 'p4'),
('k5', 'p5'),
('k6', 'p1');

-- 7. Insert Attendance Records
INSERT INTO attendance (
    id, pupil_id, date, arrival, departure, 
    arrival_transport, arrival_vehicle_reg, arrival_person_name, arrival_person_relation, arrival_phone,
    departure_transport, departure_vehicle_reg, departure_person_name, departure_person_relation, departure_phone
) VALUES
('a1', 'k1', CURRENT_DATE, '07:55', NULL, 'Car', 'KAA 123B', 'Mary Atieno', 'Mother', '+254712000001', NULL, NULL, NULL, NULL, NULL),
('a2', 'k2', CURRENT_DATE, '08:02', NULL, 'School Bus', 'KBZ 456C', 'John Kariuki', 'Driver', '+254700000004', NULL, NULL, NULL, NULL, NULL),
('a3', 'k3', CURRENT_DATE, '07:48', '16:30', 'Motorcycle', 'KMCA 789D', 'David Mutua', 'Father', '+254712000004', 'Car', 'KAB 321E', 'Sarah Njeri', 'Mother', '+254712000003');

-- 8. Insert Notification Records
INSERT INTO notifications (id, pupil_id, parent_id, channel, type, status, message, timestamp, phone_number) VALUES
('n1', 'k1', 'p1', 'sms', 'arrival', 'sent', 'Liam arrived at 07:55', CURRENT_TIMESTAMP - INTERVAL '2 hours', '+254712000001'),
('n2', 'k1', 'p1', 'email', 'arrival', 'sent', 'Liam arrived at 07:55', CURRENT_TIMESTAMP - INTERVAL '2 hours', '+254712000001'),
('n3', 'k2', 'p2', 'sms', 'arrival', 'sent', 'Zuri arrived at 08:02', CURRENT_TIMESTAMP - INTERVAL '1 hour', '+254712000002'),
('n4', 'k3', 'p3', 'sms', 'departure', 'failed', 'Departure SMS failed', CURRENT_TIMESTAMP, '+254712000003');

-- 9. Insert Audit Logs
INSERT INTO audit_logs (id, actor_id, actor_name, action, target, timestamp) VALUES
('l1', 'u1', 'Amina Okello', 'Created pupil', 'Liam Atieno (KG-001)', CURRENT_TIMESTAMP - INTERVAL '1 day'),
('l2', 'u2', 'Brian Mwangi', 'Approved teacher', 'Grace Wanjiku', CURRENT_TIMESTAMP - INTERVAL '12 hours'),
('l3', 'u3', 'Grace Wanjiku', 'Marked arrival', 'Liam Atieno', CURRENT_TIMESTAMP - INTERVAL '2 hours');

-- 10. Insert Marks
INSERT INTO marks (id, pupil_id, subject, term, year, score, max_score, grade, teacher_comment, recorded_by, recorded_at) VALUES
('m1', 'k1', 'Reading', 'Term 1', '2025', 85, 100, 'A', 'Excellent progress!', 'u3', '2025-03-15 10:30:00+03'),
('m2', 'k1', 'Math', 'Term 1', '2025', 78, 100, 'B', 'Good work', 'u3', '2025-03-15 10:35:00+03'),
('m3', 'k2', 'Reading', 'Term 1', '2025', 92, 100, 'A', 'Outstanding!', 'u3', '2025-03-15 10:40:00+03');

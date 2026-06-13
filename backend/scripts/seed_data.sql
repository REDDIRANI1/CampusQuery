-- Clear existing data
TRUNCATE TABLE student_preferences CASCADE;
TRUNCATE TABLE students CASCADE;
TRUNCATE TABLE courses CASCADE;
TRUNCATE TABLE system_state CASCADE;

-- System State
INSERT INTO system_state (id, is_allocation_locked) VALUES (1, FALSE);

-- Courses
-- Using deterministic UUIDs for easier mapping
INSERT INTO courses (id, name, general_seats, obc_seats, sc_seats, st_seats, total_seats, rejection_count, created_at) VALUES
('11111111-1111-1111-1111-111111111111', 'Computer Science', 2, 1, 1, 1, 5, 0, NOW()),
('22222222-2222-2222-2222-222222222222', 'Electrical Engineering', 3, 2, 1, 1, 7, 0, NOW()),
('33333333-3333-3333-3333-333333333333', 'Mechanical Engineering', 2, 1, 1, 1, 5, 0, NOW()),
('44444444-4444-4444-4444-444444444444', 'Civil Engineering', 2, 1, 1, 1, 5, 0, NOW());

-- Students
INSERT INTO students (id, student_id_str, name, marks, category, application_date, created_at) VALUES
-- High scorers for Computer Science
('00000000-0000-0000-0000-000000000001', 'STU001', 'Alice (Gen 99)', 99.0, 'General', NOW(), NOW()),
('00000000-0000-0000-0000-000000000002', 'STU002', 'Bob (Gen 98)', 98.0, 'General', NOW(), NOW()),
('00000000-0000-0000-0000-000000000003', 'STU003', 'Charlie (OBC 97)', 97.0, 'OBC', NOW(), NOW()),
('00000000-0000-0000-0000-000000000004', 'STU004', 'Diana (SC 96)', 96.0, 'SC', NOW(), NOW()),
('00000000-0000-0000-0000-000000000005', 'STU005', 'Eve (ST 95)', 95.0, 'ST', NOW(), NOW()),
-- Mid scorers who might fallback to 2nd preference or use category quotas
('00000000-0000-0000-0000-000000000006', 'STU006', 'Frank (Gen 94)', 94.0, 'General', NOW(), NOW()),
('00000000-0000-0000-0000-000000000007', 'STU007', 'Grace (OBC 93)', 93.0, 'OBC', NOW(), NOW()),
('00000000-0000-0000-0000-000000000008', 'STU008', 'Heidi (SC 92)', 92.0, 'SC', NOW(), NOW()),
('00000000-0000-0000-0000-000000000009', 'STU009', 'Ivan (ST 91)', 91.0, 'ST', NOW(), NOW()),
-- Lower scorers to test rejections or lower preference allocations
('00000000-0000-0000-0000-000000000010', 'STU010', 'Judy (Gen 85)', 85.0, 'General', NOW(), NOW()),
('00000000-0000-0000-0000-000000000011', 'STU011', 'Mallory (OBC 84)', 84.0, 'OBC', NOW(), NOW()),
('00000000-0000-0000-0000-000000000012', 'STU012', 'Niaj (SC 83)', 83.0, 'SC', NOW(), NOW()),
('00000000-0000-0000-0000-000000000013', 'STU013', 'Oscar (ST 82)', 82.0, 'ST', NOW(), NOW()),
-- Borderline cases
('00000000-0000-0000-0000-000000000014', 'STU014', 'Peggy (Gen 70)', 70.0, 'General', NOW(), NOW()),
('00000000-0000-0000-0000-000000000015', 'STU015', 'Trent (OBC 69)', 69.0, 'OBC', NOW(), NOW());

-- Preferences
INSERT INTO student_preferences (id, student_id, course_id, priority) VALUES
-- Alice and Bob only want CS (General seats should be filled by them)
(gen_random_uuid(), '00000000-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 1),
(gen_random_uuid(), '00000000-0000-0000-0000-000000000002', '11111111-1111-1111-1111-111111111111', 1),

-- Charlie (OBC 97) - wants CS, should get General seat? (Depending on allocation logic, often open category is filled first)
-- Actually Gen seats are filled by Alice & Bob (99, 98), so Charlie gets OBC seat for CS.
(gen_random_uuid(), '00000000-0000-0000-0000-000000000003', '11111111-1111-1111-1111-111111111111', 1),

-- Diana (SC 96) gets SC seat in CS
(gen_random_uuid(), '00000000-0000-0000-0000-000000000004', '11111111-1111-1111-1111-111111111111', 1),

-- Eve (ST 95) gets ST seat in CS
(gen_random_uuid(), '00000000-0000-0000-0000-000000000005', '11111111-1111-1111-1111-111111111111', 1),

-- Frank (Gen 94) wants CS (full), EE (open). Should get EE Gen.
(gen_random_uuid(), '00000000-0000-0000-0000-000000000006', '11111111-1111-1111-1111-111111111111', 1),
(gen_random_uuid(), '00000000-0000-0000-0000-000000000006', '22222222-2222-2222-2222-222222222222', 2),

-- Grace (OBC 93) wants CS (OBC full), EE (open). Should get EE Gen.
(gen_random_uuid(), '00000000-0000-0000-0000-000000000007', '11111111-1111-1111-1111-111111111111', 1),
(gen_random_uuid(), '00000000-0000-0000-0000-000000000007', '22222222-2222-2222-2222-222222222222', 2),

-- Heidi (SC 92) wants CS (SC full). Has no other preference, should be REJECTED.
(gen_random_uuid(), '00000000-0000-0000-0000-000000000008', '11111111-1111-1111-1111-111111111111', 1),

-- Ivan (ST 91) wants ME 1st, EE 2nd. Gets ME Gen.
(gen_random_uuid(), '00000000-0000-0000-0000-000000000009', '33333333-3333-3333-3333-333333333333', 1),
(gen_random_uuid(), '00000000-0000-0000-0000-000000000009', '22222222-2222-2222-2222-222222222222', 2),

-- Judy (Gen 85) wants ME 1st. Gets ME Gen.
(gen_random_uuid(), '00000000-0000-0000-0000-000000000010', '33333333-3333-3333-3333-333333333333', 1),

-- Mallory (OBC 84) wants EE 1st. Gets EE OBC.
(gen_random_uuid(), '00000000-0000-0000-0000-000000000011', '22222222-2222-2222-2222-222222222222', 1),

-- Niaj (SC 83) wants CE 1st. Gets CE Gen.
(gen_random_uuid(), '00000000-0000-0000-0000-000000000012', '44444444-4444-4444-4444-444444444444', 1),

-- Oscar (ST 82) wants CE 1st. Gets CE Gen.
(gen_random_uuid(), '00000000-0000-0000-0000-000000000013', '44444444-4444-4444-4444-444444444444', 1),

-- Peggy (Gen 70) wants CE 1st. Gets CE Gen.
(gen_random_uuid(), '00000000-0000-0000-0000-000000000014', '44444444-4444-4444-4444-444444444444', 1),

-- Trent (OBC 69) wants CS, EE, ME, CE. Tests multi-fallback.
(gen_random_uuid(), '00000000-0000-0000-0000-000000000015', '11111111-1111-1111-1111-111111111111', 1),
(gen_random_uuid(), '00000000-0000-0000-0000-000000000015', '22222222-2222-2222-2222-222222222222', 2),
(gen_random_uuid(), '00000000-0000-0000-0000-000000000015', '33333333-3333-3333-3333-333333333333', 3),
(gen_random_uuid(), '00000000-0000-0000-0000-000000000015', '44444444-4444-4444-4444-444444444444', 4);

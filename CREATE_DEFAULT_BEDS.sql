-- Create default beds for IPD functionality
-- Run this script in your Supabase SQL editor

INSERT INTO beds (bed_number, room_type, daily_rate, status, department, hospital_id) VALUES
-- General Ward Beds
('G-001', 'GENERAL', 1500.00, 'AVAILABLE', 'General Medicine', '550e8400-e29b-41d4-a716-446655440000'),
('G-002', 'GENERAL', 1500.00, 'AVAILABLE', 'General Medicine', '550e8400-e29b-41d4-a716-446655440000'),
('G-003', 'GENERAL', 1500.00, 'AVAILABLE', 'General Medicine', '550e8400-e29b-41d4-a716-446655440000'),
('G-004', 'GENERAL', 1500.00, 'AVAILABLE', 'General Medicine', '550e8400-e29b-41d4-a716-446655440000'),
('G-005', 'GENERAL', 1500.00, 'AVAILABLE', 'General Medicine', '550e8400-e29b-41d4-a716-446655440000'),

-- Private Rooms
('P-001', 'PRIVATE', 3000.00, 'AVAILABLE', 'VIP', '550e8400-e29b-41d4-a716-446655440000'),
('P-002', 'PRIVATE', 3000.00, 'AVAILABLE', 'VIP', '550e8400-e29b-41d4-a716-446655440000'),
('P-003', 'PRIVATE', 3000.00, 'AVAILABLE', 'VIP', '550e8400-e29b-41d4-a716-446655440000'),
('P-004', 'PRIVATE', 2800.00, 'AVAILABLE', 'Private Ward', '550e8400-e29b-41d4-a716-446655440000'),
('P-005', 'PRIVATE', 2800.00, 'AVAILABLE', 'Private Ward', '550e8400-e29b-41d4-a716-446655440000'),

-- ICU Beds
('ICU-001', 'ICU', 5000.00, 'AVAILABLE', 'Intensive Care', '550e8400-e29b-41d4-a716-446655440000'),
('ICU-002', 'ICU', 5000.00, 'AVAILABLE', 'Intensive Care', '550e8400-e29b-41d4-a716-446655440000'),
('ICU-003', 'ICU', 5000.00, 'AVAILABLE', 'Intensive Care', '550e8400-e29b-41d4-a716-446655440000'),
('ICU-004', 'ICU', 5000.00, 'AVAILABLE', 'Intensive Care', '550e8400-e29b-41d4-a716-446655440000'),

-- Emergency Beds
('E-001', 'EMERGENCY', 2000.00, 'AVAILABLE', 'Emergency', '550e8400-e29b-41d4-a716-446655440000'),
('E-002', 'EMERGENCY', 2000.00, 'AVAILABLE', 'Emergency', '550e8400-e29b-41d4-a716-446655440000'),
('E-003', 'EMERGENCY', 2000.00, 'AVAILABLE', 'Emergency', '550e8400-e29b-41d4-a716-446655440000');

-- Verify beds were created
SELECT 
    bed_number, 
    room_type, 
    daily_rate, 
    status, 
    department,
    created_at
FROM beds 
ORDER BY bed_number;
-- FIXED SUPABASE IPD SCRIPT - Matches Your Actual Schema
-- Run this entire script in Supabase Dashboard → SQL Editor

-- Step 1: Fix the room_type constraint to allow only uppercase values
ALTER TABLE patient_admissions DROP CONSTRAINT IF EXISTS patient_admissions_room_type_check;
ALTER TABLE patient_admissions ADD CONSTRAINT patient_admissions_room_type_check 
CHECK (room_type IN ('GENERAL', 'PRIVATE', 'ICU', 'EMERGENCY'));

-- Step 2: Update all beds to use valid uppercase room_type values
UPDATE beds SET room_type = UPPER(TRIM(room_type));
UPDATE beds SET room_type = 'GENERAL' WHERE room_type NOT IN ('GENERAL', 'PRIVATE', 'ICU', 'EMERGENCY');

-- Step 3: Create test patient WITHOUT is_active column (doesn't exist in your schema)
INSERT INTO patients (
    id, 
    patient_id,
    first_name,
    last_name,
    date_of_birth,
    age,
    gender,
    phone,
    hospital_id,
    created_at,
    updated_at
) VALUES (
    '00000000-0000-0000-0000-000000000001',
    'P0001',
    'Test',
    'Patient',
    '1990-01-01',
    34,
    'M',
    '1234567890',
    '550e8400-e29b-41d4-a716-446655440000',
    NOW(),
    NOW()
) ON CONFLICT (id) DO UPDATE SET
    first_name = 'Test',
    last_name = 'Patient',
    updated_at = NOW();

-- Step 4: Ensure we have test beds with correct room_type values
INSERT INTO beds (
    id,
    bed_number,
    room_type,
    department,
    status,
    daily_rate,
    hospital_id,
    created_at
) VALUES 
(
    'bed00000-0000-0000-0000-000000000001',
    'BED-001',
    'GENERAL',
    'GENERAL',
    'AVAILABLE',
    1000,
    '550e8400-e29b-41d4-a716-446655440000',
    NOW()
),
(
    'bed00000-0000-0000-0000-000000000002',
    'BED-002', 
    'PRIVATE',
    'GENERAL',
    'AVAILABLE',
    2000,
    '550e8400-e29b-41d4-a716-446655440000',
    NOW()
),
(
    'bed00000-0000-0000-0000-000000000003',
    'BED-003',
    'ICU',
    'ICU',
    'AVAILABLE',
    5000,
    '550e8400-e29b-41d4-a716-446655440000',
    NOW()
)
ON CONFLICT (bed_number) DO UPDATE SET
    room_type = EXCLUDED.room_type,
    status = 'AVAILABLE',
    updated_at = NOW();

-- Step 5: Test IPD admission with valid data
DO $$
DECLARE
    test_patient_id UUID := '00000000-0000-0000-0000-000000000001';
    test_admission_id UUID;
BEGIN
    -- Test admission
    INSERT INTO patient_admissions (
        patient_id,
        bed_number,
        room_type,
        department,
        daily_rate,
        admission_date,
        status,
        services,
        total_amount,
        amount_paid,
        balance_amount,
        hospital_id,
        created_at,
        updated_at
    ) VALUES (
        test_patient_id,
        'BED-TEST',
        'GENERAL',
        'GENERAL',
        1000,
        NOW(),
        'ACTIVE',
        '{}',
        0,
        0,
        0,
        '550e8400-e29b-41d4-a716-446655440000',
        NOW(),
        NOW()
    ) RETURNING id INTO test_admission_id;
    
    -- Clean up test
    DELETE FROM patient_admissions WHERE id = test_admission_id;
    
    RAISE NOTICE '✅ SUCCESS: IPD admission test completed successfully!';
    RAISE NOTICE '✅ Patient created with ID: %', test_patient_id;
    RAISE NOTICE '✅ Room types fixed: GENERAL, PRIVATE, ICU, EMERGENCY';
    RAISE NOTICE '✅ Test beds created: BED-001, BED-002, BED-003';
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE '❌ FAILED: %', SQLERRM;
        RAISE NOTICE '❌ Error Code: %', SQLSTATE;
END $$;

-- Step 6: Show current data status
SELECT 'PATIENTS' as table_name, count(*) as count FROM patients
UNION ALL
SELECT 'BEDS' as table_name, count(*) as count FROM beds  
UNION ALL
SELECT 'ADMISSIONS' as table_name, count(*) as count FROM patient_admissions;

-- Step 7: Show bed room types
SELECT 'BED ROOM TYPES' as info, room_type, count(*) as bed_count 
FROM beds 
GROUP BY room_type 
ORDER BY room_type;

-- Step 8: Show the created test patient
SELECT 'TEST PATIENT' as info, patient_id, first_name, last_name
FROM patients 
WHERE id = '00000000-0000-0000-0000-000000000001';

SELECT '✅ IPD FIX COMPLETE!' as status;
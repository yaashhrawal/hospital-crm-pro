-- SUPABASE IPD CONSTRAINT FIX
-- Run this in Supabase Dashboard → SQL Editor

-- Step 1: Drop the problematic room_type constraint
ALTER TABLE patient_admissions DROP CONSTRAINT IF EXISTS patient_admissions_room_type_check;

-- Step 2: Add new constraint with proper room_type values
ALTER TABLE patient_admissions ADD CONSTRAINT patient_admissions_room_type_check 
CHECK (room_type IN ('GENERAL', 'PRIVATE', 'ICU', 'EMERGENCY', 'SEMI_PRIVATE', 'DELUXE', 'VIP', 'STANDARD'));

-- Step 3: Update beds table to use valid room_type values
UPDATE beds SET room_type = 'GENERAL' WHERE room_type IS NULL OR room_type = '';
UPDATE beds SET room_type = 'GENERAL' WHERE UPPER(room_type) = 'GENERAL';
UPDATE beds SET room_type = 'PRIVATE' WHERE UPPER(room_type) IN ('PRIVATE', 'SEMI_PRIVATE', 'DELUXE', 'VIP');
UPDATE beds SET room_type = 'ICU' WHERE UPPER(room_type) = 'ICU';
UPDATE beds SET room_type = 'EMERGENCY' WHERE UPPER(room_type) = 'EMERGENCY';

-- Step 4: Verify the constraint is working
SELECT conname, pg_get_constraintdef(oid) 
FROM pg_constraint 
WHERE conname = 'patient_admissions_room_type_check';

-- Step 5: Test with a sample admission (will auto-delete)
DO $$
DECLARE
    test_admission_id UUID;
BEGIN
    -- Insert test admission
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
        hospital_id
    ) VALUES (
        '00000000-0000-0000-0000-000000000001',
        'TEST-001',
        'GENERAL',
        'GENERAL',
        1000,
        NOW(),
        'ACTIVE',
        '{}',
        0,
        0,
        0,
        '550e8400-e29b-41d4-a716-446655440000'
    ) RETURNING id INTO test_admission_id;
    
    -- If successful, delete test data
    DELETE FROM patient_admissions WHERE id = test_admission_id;
    
    RAISE NOTICE 'SUCCESS: IPD admission constraint is working correctly!';
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'FAILED: %', SQLERRM;
END $$;

-- Step 6: Show current bed room_types after update
SELECT 
    room_type, 
    COUNT(*) as bed_count 
FROM beds 
GROUP BY room_type 
ORDER BY room_type;
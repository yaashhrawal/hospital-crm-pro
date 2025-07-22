-- FIND THE EXACT CONSTRAINT CAUSING IPD FAILURES
-- Run this in Supabase Dashboard → SQL Editor

-- Step 1: Show ALL constraints on patient_admissions table
SELECT 
    'CONSTRAINT INFO' as type,
    conname as constraint_name,
    contype as constraint_type,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'patient_admissions'::regclass
ORDER BY conname;

-- Step 2: Show ALL columns in patient_admissions table
SELECT 
    'COLUMN INFO' as type,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'patient_admissions'
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Step 3: Test with MINIMAL data to find the failing field
DO $$
DECLARE
    test_patient_id UUID;
    minimal_data RECORD;
    error_message TEXT;
BEGIN
    -- Get any existing patient
    SELECT id INTO test_patient_id FROM patients LIMIT 1;
    
    IF test_patient_id IS NULL THEN
        RAISE NOTICE '❌ No patients found in database';
        RETURN;
    END IF;
    
    RAISE NOTICE '✅ Using patient ID: %', test_patient_id;
    
    -- Test with absolutely minimal required fields only
    BEGIN
        INSERT INTO patient_admissions (
            patient_id,
            bed_number,
            room_type,
            admission_date,
            status,
            hospital_id
        ) VALUES (
            test_patient_id,
            'MINIMAL-TEST',
            'GENERAL',
            NOW(),
            'ACTIVE',
            '550e8400-e29b-41d4-a716-446655440000'
        );
        
        -- Clean up immediately
        DELETE FROM patient_admissions WHERE bed_number = 'MINIMAL-TEST';
        RAISE NOTICE '✅ SUCCESS: Minimal insertion worked!';
        
    EXCEPTION WHEN OTHERS THEN
        error_message := SQLERRM;
        RAISE NOTICE '❌ MINIMAL TEST FAILED: %', error_message;
        RAISE NOTICE '❌ ERROR CODE: %', SQLSTATE;
        
        -- Try even more minimal (without hospital_id)
        BEGIN
            INSERT INTO patient_admissions (
                patient_id,
                bed_number,
                room_type,
                admission_date,
                status
            ) VALUES (
                test_patient_id,
                'ULTRA-MINIMAL',
                'GENERAL',
                NOW(),
                'ACTIVE'
            );
            
            DELETE FROM patient_admissions WHERE bed_number = 'ULTRA-MINIMAL';
            RAISE NOTICE '✅ SUCCESS: Ultra-minimal worked (hospital_id was the issue)';
            
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE '❌ ULTRA-MINIMAL FAILED: %', SQLERRM;
            
            -- Try without status
            BEGIN
                INSERT INTO patient_admissions (
                    patient_id,
                    bed_number,
                    room_type,
                    admission_date
                ) VALUES (
                    test_patient_id,
                    'SUPER-MINIMAL',
                    'GENERAL',
                    NOW()
                );
                
                DELETE FROM patient_admissions WHERE bed_number = 'SUPER-MINIMAL';
                RAISE NOTICE '✅ SUCCESS: Super-minimal worked (status was the issue)';
                
            EXCEPTION WHEN OTHERS THEN
                RAISE NOTICE '❌ SUPER-MINIMAL FAILED: %', SQLERRM;
                RAISE NOTICE '❌ The issue is with basic required fields';
            END;
        END;
    END;
END $$;

-- Step 4: Check if the hospital_id exists in hospitals table
SELECT 
    'HOSPITAL CHECK' as type,
    CASE 
        WHEN EXISTS (SELECT 1 FROM hospitals WHERE id = '550e8400-e29b-41d4-a716-446655440000') 
        THEN '✅ Hospital ID exists'
        ELSE '❌ Hospital ID does NOT exist - THIS COULD BE THE ISSUE!'
    END as result;

-- Step 5: Show what hospitals actually exist
SELECT 'EXISTING HOSPITALS' as type, id, name FROM hospitals LIMIT 5;

-- Step 6: Check patients table
SELECT 'PATIENT COUNT' as type, count(*)::text as count FROM patients;
SELECT 'SAMPLE PATIENTS' as type, id, patient_id, first_name, last_name FROM patients LIMIT 3;

-- Step 7: Final diagnosis
SELECT 
    '🎯 DIAGNOSIS' as info,
    'Check the error messages above to see which constraint is actually failing' as instruction;
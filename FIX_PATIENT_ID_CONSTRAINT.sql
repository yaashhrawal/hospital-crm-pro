-- FIX PATIENT ID NULL CONSTRAINT VIOLATION
-- This adds proper UUID default generation for all tables

-- Step 1: Check current default values for id columns
SELECT 
    'CURRENT ID COLUMN DEFAULTS' as info,
    table_name,
    column_name,
    column_default,
    is_nullable
FROM information_schema.columns 
WHERE table_name IN ('patients', 'patient_transactions', 'doctors', 'departments', 'patient_admissions', 'beds')
AND column_name = 'id'
ORDER BY table_name;

-- Step 2: Add proper UUID default generation to all tables
-- For patients table
ALTER TABLE patients ALTER COLUMN id SET DEFAULT gen_random_uuid();

-- For patient_transactions table  
ALTER TABLE patient_transactions ALTER COLUMN id SET DEFAULT gen_random_uuid();

-- For doctors table
ALTER TABLE doctors ALTER COLUMN id SET DEFAULT gen_random_uuid();

-- For departments table
ALTER TABLE departments ALTER COLUMN id SET DEFAULT gen_random_uuid();

-- For patient_admissions table
ALTER TABLE patient_admissions ALTER COLUMN id SET DEFAULT gen_random_uuid();

-- For beds table
ALTER TABLE beds ALTER COLUMN id SET DEFAULT gen_random_uuid();

-- Step 3: Ensure all id columns are NOT NULL
ALTER TABLE patients ALTER COLUMN id SET NOT NULL;
ALTER TABLE patient_transactions ALTER COLUMN id SET NOT NULL;
ALTER TABLE doctors ALTER COLUMN id SET NOT NULL;
ALTER TABLE departments ALTER COLUMN id SET NOT NULL;
ALTER TABLE patient_admissions ALTER COLUMN id SET NOT NULL;
ALTER TABLE beds ALTER COLUMN id SET NOT NULL;

-- Step 4: Verify the changes
SELECT 
    'UPDATED ID COLUMN DEFAULTS' as info,
    table_name,
    column_name,
    column_default,
    is_nullable
FROM information_schema.columns 
WHERE table_name IN ('patients', 'patient_transactions', 'doctors', 'departments', 'patient_admissions', 'beds')
AND column_name = 'id'
ORDER BY table_name;

-- Step 5: Test patient creation with proper UUID generation
-- This simulates what happens when a patient is created
INSERT INTO patients (
    patient_id, 
    first_name, 
    last_name, 
    gender, 
    phone, 
    address, 
    emergency_contact_name, 
    emergency_contact_phone,
    hospital_id,
    is_active
) VALUES (
    'TEST001',
    'Test',
    'Patient', 
    'MALE',
    '1234567890',
    'Test Address',
    'Test Contact',
    '0987654321',
    '550e8400-e29b-41d4-a716-446655440000',
    true
) RETURNING id, patient_id, first_name, last_name;

-- Step 6: Clean up test record
DELETE FROM patients WHERE patient_id = 'TEST001';

-- Step 7: Show sample of existing patients to verify structure
SELECT 
    'EXISTING PATIENTS SAMPLE' as info,
    id,
    patient_id,
    first_name,
    last_name,
    created_at
FROM patients 
WHERE id IS NOT NULL 
ORDER BY created_at DESC 
LIMIT 3;
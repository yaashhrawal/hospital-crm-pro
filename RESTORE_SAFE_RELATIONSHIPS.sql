-- RESTORE SAFE RELATIONSHIPS AFTER EMERGENCY FIX
-- This safely adds back the essential relationships

-- Step 1: Verify current data state
SELECT 'CURRENT DATA STATE' as info;
SELECT 'patients' as table_name, COUNT(*) as count FROM patients WHERE hospital_id = '550e8400-e29b-41d4-a716-446655440000';
SELECT 'patient_transactions' as table_name, COUNT(*) as count FROM patient_transactions WHERE hospital_id = '550e8400-e29b-41d4-a716-446655440000';

-- Step 2: Check for data integrity before adding constraints
SELECT 'DATA INTEGRITY CHECK' as info;

-- Check if all patient_transactions have valid patient_id references
SELECT 
    'orphaned_transactions' as check_type,
    COUNT(*) as count
FROM patient_transactions pt
WHERE pt.patient_id IS NOT NULL 
  AND pt.patient_id NOT IN (SELECT id FROM patients WHERE id IS NOT NULL);

-- Show sample of patient_id values to verify format
SELECT 'patient_ids_sample' as check_type, patient_id, COUNT(*) as count
FROM patient_transactions 
WHERE patient_id IS NOT NULL
GROUP BY patient_id
LIMIT 5;

-- Step 3: Clean up any orphaned transactions before adding constraints
DELETE FROM patient_transactions 
WHERE patient_id IS NOT NULL 
  AND patient_id NOT IN (SELECT id FROM patients WHERE id IS NOT NULL);

-- Step 4: Add primary keys first (required for foreign keys)
ALTER TABLE patients ADD CONSTRAINT patients_pkey PRIMARY KEY (id);
ALTER TABLE patient_transactions ADD CONSTRAINT patient_transactions_pkey PRIMARY KEY (id);
ALTER TABLE doctors ADD CONSTRAINT doctors_pkey PRIMARY KEY (id);
ALTER TABLE departments ADD CONSTRAINT departments_pkey PRIMARY KEY (id);

-- Step 5: Add the essential foreign key relationship
ALTER TABLE patient_transactions 
ADD CONSTRAINT fk_patient_transactions_patient_id 
FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE;

-- Step 6: Add department relationship for doctors (if data is valid)
DO $$
BEGIN
    -- Only add if all doctor department_id values are valid
    IF NOT EXISTS (
        SELECT 1 FROM doctors d 
        WHERE d.department_id IS NOT NULL 
          AND d.department_id NOT IN (SELECT id FROM departments WHERE id IS NOT NULL)
    ) THEN
        ALTER TABLE doctors 
        ADD CONSTRAINT fk_doctors_department_id 
        FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE SET NULL;
    END IF;
END $$;

-- Step 7: Verify relationships were created
SELECT 
    'FOREIGN KEY VERIFICATION' as info,
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS references_table,
    ccu.column_name AS references_column
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_name IN ('patient_transactions', 'doctors')
ORDER BY tc.table_name;

-- Step 8: Test the relationship with a simple query
SELECT 
    'RELATIONSHIP TEST' as test,
    p.patient_id,
    p.first_name,
    p.last_name,
    COUNT(pt.id) as transaction_count
FROM patients p
LEFT JOIN patient_transactions pt ON p.id = pt.patient_id
WHERE p.hospital_id = '550e8400-e29b-41d4-a716-446655440000'
GROUP BY p.id, p.patient_id, p.first_name, p.last_name
ORDER BY p.created_at DESC
LIMIT 5;

-- Step 9: Final success message
SELECT 'RELATIONSHIP RESTORATION' as status, 'COMPLETED' as result;
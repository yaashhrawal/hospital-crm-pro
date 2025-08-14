-- FIX NULL ID VALUES AND ADD RELATIONSHIPS SAFELY
-- This handles the NULL id values before creating primary keys

-- Step 1: Check which tables have NULL id values
SELECT 
    'patients' as table_name,
    COUNT(*) as total_records,
    COUNT(id) as non_null_ids,
    COUNT(*) - COUNT(id) as null_ids
FROM patients

UNION ALL

SELECT 
    'patient_transactions' as table_name,
    COUNT(*) as total_records,
    COUNT(id) as non_null_ids,
    COUNT(*) - COUNT(id) as null_ids
FROM patient_transactions

UNION ALL

SELECT 
    'doctors' as table_name,
    COUNT(*) as total_records,
    COUNT(id) as non_null_ids,
    COUNT(*) - COUNT(id) as null_ids
FROM doctors

UNION ALL

SELECT 
    'departments' as table_name,
    COUNT(*) as total_records,
    COUNT(id) as non_null_ids,
    COUNT(*) - COUNT(id) as null_ids
FROM departments;

-- Step 2: Show sample records with NULL ids
SELECT 'NULL IDs in patients:' as info, patient_id, first_name, last_name, id
FROM patients 
WHERE id IS NULL 
LIMIT 3;

-- Step 3: Fix NULL id values by generating UUIDs
-- For patients table
UPDATE patients 
SET id = gen_random_uuid() 
WHERE id IS NULL;

-- For patient_transactions table
UPDATE patient_transactions 
SET id = gen_random_uuid() 
WHERE id IS NULL;

-- For doctors table  
UPDATE doctors 
SET id = gen_random_uuid() 
WHERE id IS NULL;

-- For departments table
UPDATE departments 
SET id = gen_random_uuid() 
WHERE id IS NULL;

-- Step 4: Make id columns NOT NULL
ALTER TABLE patients ALTER COLUMN id SET NOT NULL;
ALTER TABLE patient_transactions ALTER COLUMN id SET NOT NULL;
ALTER TABLE doctors ALTER COLUMN id SET NOT NULL;
ALTER TABLE departments ALTER COLUMN id SET NOT NULL;

-- Step 5: Drop existing constraints if they exist
ALTER TABLE patient_transactions DROP CONSTRAINT IF EXISTS patient_transactions_pkey CASCADE;
ALTER TABLE patients DROP CONSTRAINT IF EXISTS patients_pkey CASCADE;
ALTER TABLE doctors DROP CONSTRAINT IF EXISTS doctors_pkey CASCADE;
ALTER TABLE departments DROP CONSTRAINT IF EXISTS departments_pkey CASCADE;

-- Step 6: Add primary key constraints (now that all ids are non-null)
ALTER TABLE patients ADD CONSTRAINT patients_pkey PRIMARY KEY (id);
ALTER TABLE patient_transactions ADD CONSTRAINT patient_transactions_pkey PRIMARY KEY (id);
ALTER TABLE doctors ADD CONSTRAINT doctors_pkey PRIMARY KEY (id);
ALTER TABLE departments ADD CONSTRAINT departments_pkey PRIMARY KEY (id);

-- Step 7: Fix any NULL foreign key references
-- Check patient_transactions.patient_id references
SELECT 'Orphaned transactions:' as info, COUNT(*) as count
FROM patient_transactions pt
LEFT JOIN patients p ON pt.patient_id = p.id
WHERE p.id IS NULL AND pt.patient_id IS NOT NULL;

-- Check doctors.department_id references  
SELECT 'Orphaned doctors:' as info, COUNT(*) as count
FROM doctors d
LEFT JOIN departments dept ON d.department_id = dept.id
WHERE dept.id IS NULL AND d.department_id IS NOT NULL;

-- Step 8: Clean up orphaned foreign key references
-- Delete transactions that reference non-existent patients
DELETE FROM patient_transactions 
WHERE patient_id IS NOT NULL 
AND patient_id NOT IN (SELECT id FROM patients WHERE id IS NOT NULL);

-- Set department_id to NULL for doctors referencing non-existent departments
UPDATE doctors 
SET department_id = NULL 
WHERE department_id IS NOT NULL 
AND department_id NOT IN (SELECT id FROM departments WHERE id IS NOT NULL);

-- Step 9: Add foreign key constraints
ALTER TABLE patient_transactions 
ADD CONSTRAINT fk_patient_transactions_patient_id 
FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE;

ALTER TABLE doctors 
ADD CONSTRAINT fk_doctors_department_id 
FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE SET NULL;

-- Step 10: Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_patient_transactions_patient_id ON patient_transactions(patient_id);
CREATE INDEX IF NOT EXISTS idx_doctors_department_id ON doctors(department_id);
CREATE INDEX IF NOT EXISTS idx_patients_hospital_id ON patients(hospital_id);
CREATE INDEX IF NOT EXISTS idx_patients_patient_id ON patients(patient_id);

-- Step 11: Verify everything worked
SELECT 
    'VERIFICATION - PRIMARY KEYS' as info,
    tc.table_name,
    kcu.column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
WHERE tc.constraint_type = 'PRIMARY KEY'
  AND tc.table_name IN ('patients', 'patient_transactions', 'doctors', 'departments')
ORDER BY tc.table_name;

-- Verify foreign keys
SELECT 
    'VERIFICATION - FOREIGN KEYS' as info,
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
  AND tc.table_name IN ('patients', 'patient_transactions', 'doctors', 'departments')
ORDER BY tc.table_name;

-- Test the relationships
SELECT 
    'RELATIONSHIP TEST' as info,
    p.patient_id,
    p.first_name,
    p.last_name,
    COUNT(pt.id) as transaction_count
FROM patients p
LEFT JOIN patient_transactions pt ON p.id = pt.patient_id
GROUP BY p.id, p.patient_id, p.first_name, p.last_name
LIMIT 5;
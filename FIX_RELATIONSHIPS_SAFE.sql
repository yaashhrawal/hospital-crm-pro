-- SAFE FIX FOR TABLE RELATIONSHIPS IN MADHUBAN
-- This handles the patient_id type mismatch issue

-- First, check current column types
SELECT 
    table_name, 
    column_name, 
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name IN ('patients', 'patient_transactions') 
AND column_name IN ('id', 'patient_id')
ORDER BY table_name, column_name;

-- Check sample data to understand the mismatch
SELECT 'patients' as table_name, id, patient_id FROM patients LIMIT 3
UNION ALL
SELECT 'patient_transactions' as table_name, patient_id, id FROM patient_transactions LIMIT 3;

-- The issue: patients.id is UUID, but patient_transactions.patient_id is also UUID
-- BUT they might not match. Let's see if we can create the relationship

-- Step 1: Add primary keys if missing
ALTER TABLE patients ADD CONSTRAINT patients_pkey PRIMARY KEY (id) ON CONFLICT DO NOTHING;
ALTER TABLE patient_transactions ADD CONSTRAINT patient_transactions_pkey PRIMARY KEY (id) ON CONFLICT DO NOTHING;
ALTER TABLE doctors ADD CONSTRAINT doctors_pkey PRIMARY KEY (id) ON CONFLICT DO NOTHING;
ALTER TABLE departments ADD CONSTRAINT departments_pkey PRIMARY KEY (id) ON CONFLICT DO NOTHING;

-- Step 2: Try to add the foreign key relationship
-- If this fails, it means the data doesn't match between tables
ALTER TABLE patient_transactions 
ADD CONSTRAINT fk_patient_transactions_patient_id 
FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE;

-- Step 3: Add other relationships
ALTER TABLE doctors 
ADD CONSTRAINT fk_doctors_department_id 
FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE SET NULL;

-- Step 4: Add useful indexes
CREATE INDEX IF NOT EXISTS idx_patient_transactions_patient_id ON patient_transactions(patient_id);
CREATE INDEX IF NOT EXISTS idx_doctors_department_id ON doctors(department_id);

-- Step 5: Verify relationships were created
SELECT 
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
AND tc.table_name IN ('patients', 'patient_transactions', 'doctors', 'departments');
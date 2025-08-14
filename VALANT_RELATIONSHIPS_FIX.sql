-- VALANT DATABASE RELATIONSHIP REPLICATION FOR MADHUBAN
-- Based on actual Valant database structure

-- Step 1: Add primary key constraints (correct syntax)
ALTER TABLE patients ADD CONSTRAINT patients_pkey PRIMARY KEY (id);
ALTER TABLE patient_transactions ADD CONSTRAINT patient_transactions_pkey PRIMARY KEY (id);
ALTER TABLE doctors ADD CONSTRAINT doctors_pkey PRIMARY KEY (id);
ALTER TABLE departments ADD CONSTRAINT departments_pkey PRIMARY KEY (id);

-- Step 2: Add foreign key relationships found in Valant
ALTER TABLE patient_transactions 
ADD CONSTRAINT fk_patient_transactions_patient_id 
FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE;

ALTER TABLE doctors 
ADD CONSTRAINT fk_doctors_department_id 
FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE SET NULL;

-- Step 3: Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_patient_transactions_patient_id ON patient_transactions(patient_id);
CREATE INDEX IF NOT EXISTS idx_doctors_department_id ON doctors(department_id);

-- Step 4: Verify relationships
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
ORDER BY tc.table_name;

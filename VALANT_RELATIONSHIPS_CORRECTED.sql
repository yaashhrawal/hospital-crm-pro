-- EXACT VALANT DATABASE RELATIONSHIPS FOR MADHUBAN (CORRECTED SYNTAX)
-- Based on actual Valant database analysis
-- Fixes PostgreSQL syntax errors

-- Step 1: Drop existing constraints if they exist
ALTER TABLE patient_transactions DROP CONSTRAINT IF EXISTS patient_transactions_pkey CASCADE;
ALTER TABLE patients DROP CONSTRAINT IF EXISTS patients_pkey CASCADE;
ALTER TABLE doctors DROP CONSTRAINT IF EXISTS doctors_pkey CASCADE;
ALTER TABLE departments DROP CONSTRAINT IF EXISTS departments_pkey CASCADE;

-- Step 2: Add primary key constraints (CORRECT PostgreSQL syntax)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                   WHERE table_name = 'patients' AND constraint_type = 'PRIMARY KEY') THEN
        ALTER TABLE patients ADD CONSTRAINT patients_pkey PRIMARY KEY (id);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                   WHERE table_name = 'patient_transactions' AND constraint_type = 'PRIMARY KEY') THEN
        ALTER TABLE patient_transactions ADD CONSTRAINT patient_transactions_pkey PRIMARY KEY (id);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                   WHERE table_name = 'doctors' AND constraint_type = 'PRIMARY KEY') THEN
        ALTER TABLE doctors ADD CONSTRAINT doctors_pkey PRIMARY KEY (id);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                   WHERE table_name = 'departments' AND constraint_type = 'PRIMARY KEY') THEN
        ALTER TABLE departments ADD CONSTRAINT departments_pkey PRIMARY KEY (id);
    END IF;
END $$;

-- Step 3: Drop existing foreign key constraints if they exist
ALTER TABLE patient_transactions DROP CONSTRAINT IF EXISTS fk_patient_transactions_patient_id;
ALTER TABLE doctors DROP CONSTRAINT IF EXISTS fk_doctors_department_id;

-- Step 4: Add foreign key relationships (matching Valant exactly)
-- Relationship 1: patient_transactions.patient_id -> patients.id
ALTER TABLE patient_transactions 
ADD CONSTRAINT fk_patient_transactions_patient_id 
FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE;

-- Relationship 2: doctors.department_id -> departments.id  
ALTER TABLE doctors 
ADD CONSTRAINT fk_doctors_department_id 
FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE SET NULL;

-- Step 5: Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_patient_transactions_patient_id ON patient_transactions(patient_id);
CREATE INDEX IF NOT EXISTS idx_doctors_department_id ON doctors(department_id);

-- Step 6: Create additional useful indexes
CREATE INDEX IF NOT EXISTS idx_patients_hospital_id ON patients(hospital_id);
CREATE INDEX IF NOT EXISTS idx_patients_patient_id ON patients(patient_id);
CREATE INDEX IF NOT EXISTS idx_patient_transactions_created_at ON patient_transactions(created_at);

-- Step 7: Verify all relationships were created successfully
SELECT 
    'FOREIGN KEY RELATIONSHIPS' as info,
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS references_table,
    ccu.column_name AS references_column
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_name IN ('patients', 'patient_transactions', 'doctors', 'departments')
ORDER BY tc.table_name;

-- Step 8: Verify primary keys
SELECT 
    'PRIMARY KEY CONSTRAINTS' as info,
    tc.table_name,
    kcu.column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
WHERE tc.constraint_type = 'PRIMARY KEY'
  AND tc.table_name IN ('patients', 'patient_transactions', 'doctors', 'departments')
ORDER BY tc.table_name;

-- Step 9: Test the relationships work
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
-- ADD PROPER FOREIGN KEY RELATIONSHIPS FOR MADHUBAN DATABASE
-- This fixes the "Could not find a relationship" error

-- First, let's check what we have
SELECT table_name, column_name, data_type 
FROM information_schema.columns 
WHERE table_name IN ('patients', 'patient_transactions', 'doctors', 'departments')
AND column_name LIKE '%_id'
ORDER BY table_name, column_name;

-- Add primary key constraints if missing
ALTER TABLE patients ADD CONSTRAINT patients_pkey PRIMARY KEY (id);
ALTER TABLE patient_transactions ADD CONSTRAINT patient_transactions_pkey PRIMARY KEY (id);
ALTER TABLE doctors ADD CONSTRAINT doctors_pkey PRIMARY KEY (id);
ALTER TABLE departments ADD CONSTRAINT departments_pkey PRIMARY KEY (id);

-- Fix patient_transactions.patient_id to be UUID to match patients.id
-- First check what type it currently is
SELECT data_type FROM information_schema.columns 
WHERE table_name = 'patient_transactions' AND column_name = 'patient_id';

-- If it's not UUID, we need to convert it
-- But first, let's see what data we have
SELECT DISTINCT patient_id FROM patient_transactions LIMIT 10;

-- Create the foreign key relationship between patient_transactions and patients
-- This assumes patient_transactions.patient_id references patients.id
ALTER TABLE patient_transactions 
ADD CONSTRAINT fk_patient_transactions_patient_id 
FOREIGN KEY (patient_id) REFERENCES patients(id);

-- Add relationship between doctors and departments
-- This assumes doctors.department_id references departments.id
ALTER TABLE doctors 
ADD CONSTRAINT fk_doctors_department_id 
FOREIGN KEY (department_id) REFERENCES departments(id);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_patient_transactions_patient_id ON patient_transactions(patient_id);
CREATE INDEX IF NOT EXISTS idx_doctors_department_id ON doctors(department_id);
CREATE INDEX IF NOT EXISTS idx_patient_transactions_doctor_id ON patient_transactions(doctor_id);

-- Verify the relationships were created
SELECT 
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
AND tc.table_name IN ('patients', 'patient_transactions', 'doctors', 'departments');
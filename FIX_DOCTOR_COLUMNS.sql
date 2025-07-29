-- Add doctor_id and doctor_name columns to patient_admissions table
-- Run this in your Supabase SQL Editor

-- Add doctor_id column (optional reference to doctors table)
ALTER TABLE patient_admissions 
ADD COLUMN IF NOT EXISTS doctor_id UUID;

-- Add doctor_name column (text field for manual entry)
ALTER TABLE patient_admissions 
ADD COLUMN IF NOT EXISTS doctor_name TEXT;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_patient_admissions_doctor_id ON patient_admissions(doctor_id);
CREATE INDEX IF NOT EXISTS idx_patient_admissions_doctor_name ON patient_admissions(doctor_name);

-- Verify the columns were added
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'patient_admissions' 
AND column_name IN ('doctor_id', 'doctor_name')
ORDER BY column_name;

-- Check the current structure of patient_admissions table
\d patient_admissions;
-- IMPORTANT: Run this SQL in your Supabase SQL Editor NOW
-- This adds doctor fields to patient_admissions table

-- Add doctor_id column to link to doctors table
ALTER TABLE patient_admissions 
ADD COLUMN IF NOT EXISTS doctor_id UUID REFERENCES doctors(id) ON DELETE SET NULL;

-- Add doctor_name column for quick reference
ALTER TABLE patient_admissions 
ADD COLUMN IF NOT EXISTS doctor_name TEXT;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_patient_admissions_doctor_id ON patient_admissions(doctor_id);
CREATE INDEX IF NOT EXISTS idx_patient_admissions_doctor_name ON patient_admissions(doctor_name);

-- Verify the columns were added
SELECT 
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'patient_admissions' 
AND column_name IN ('doctor_id', 'doctor_name')
ORDER BY column_name;
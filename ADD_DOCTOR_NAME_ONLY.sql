-- Add only doctor_name column to patient_admissions table
-- Run this in your Supabase SQL Editor

ALTER TABLE patient_admissions 
ADD COLUMN IF NOT EXISTS doctor_name TEXT;

-- Verify the column was added
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'patient_admissions' 
AND column_name = 'doctor_name';
-- Add missing columns to Madhuban patients table
-- Run this in Supabase SQL Editor for the Madhuban database

-- Add assigned_doctors column
ALTER TABLE patients ADD COLUMN IF NOT EXISTS assigned_doctors TEXT[];

-- Add any other potentially missing columns that might be needed
ALTER TABLE patients ADD COLUMN IF NOT EXISTS assigned_doctor_ids UUID[];
ALTER TABLE patients ADD COLUMN IF NOT EXISTS consultation_notes TEXT;
ALTER TABLE patients ADD COLUMN IF NOT EXISTS treatment_status TEXT;
ALTER TABLE patients ADD COLUMN IF NOT EXISTS last_visit_date DATE;

-- Update existing patients to have empty arrays for new columns
UPDATE patients SET assigned_doctors = '{}' WHERE assigned_doctors IS NULL;
UPDATE patients SET assigned_doctor_ids = '{}' WHERE assigned_doctor_ids IS NULL;

-- Verify the column was added
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'patients' 
AND column_name IN ('assigned_doctors', 'assigned_doctor_ids')
ORDER BY column_name;
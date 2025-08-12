-- Add patient_tag column to patients table if it doesn't exist
-- Run this in Supabase Dashboard → SQL Editor

-- Add patient_tag column to patients table
ALTER TABLE patients ADD COLUMN IF NOT EXISTS patient_tag VARCHAR(100);

-- Add comment to describe the column
COMMENT ON COLUMN patients.patient_tag IS 'Patient tag for categorization (Community, Camp, VIP, etc.)';

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_patients_patient_tag ON patients(patient_tag);

-- Verify the column was added
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'patients' 
AND column_name = 'patient_tag';

-- Show success message
SELECT 'patient_tag column added successfully!' as result;
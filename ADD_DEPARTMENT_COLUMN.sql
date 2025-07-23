-- Add assigned_department column to patients table
-- This migration adds the missing assigned_department column that's needed for prescription templates

-- Add the assigned_department column to the patients table
ALTER TABLE patients 
ADD COLUMN IF NOT EXISTS assigned_department VARCHAR(100);

-- Add a comment to describe the column
COMMENT ON COLUMN patients.assigned_department IS 'Department assigned to the patient (e.g., ORTHOPEDIC, GASTRO, GENERAL PHYSICIAN)';

-- Optional: Add an index for better query performance
CREATE INDEX IF NOT EXISTS idx_patients_assigned_department ON patients(assigned_department);

-- Update existing patients to have GENERAL PHYSICIAN as default department if they don't have one
UPDATE patients 
SET assigned_department = 'GENERAL PHYSICIAN' 
WHERE assigned_department IS NULL;

-- Verify the column was added successfully
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'patients' 
AND column_name = 'assigned_department';
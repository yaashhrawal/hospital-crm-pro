-- Add doctor fields to patient_admissions table
-- This will allow tracking which doctor is handling each IPD admission

-- Add doctor_id column to link to doctors table
ALTER TABLE patient_admissions 
ADD COLUMN IF NOT EXISTS doctor_id UUID REFERENCES doctors(id) ON DELETE SET NULL;

-- Add doctor_name column for quick reference and fallback
ALTER TABLE patient_admissions 
ADD COLUMN IF NOT EXISTS doctor_name TEXT;

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_patient_admissions_doctor_id ON patient_admissions(doctor_id);
CREATE INDEX IF NOT EXISTS idx_patient_admissions_doctor_name ON patient_admissions(doctor_name);

-- Update existing admissions to have NULL doctor fields (safe migration)
-- No update needed as new columns will default to NULL

COMMENT ON COLUMN patient_admissions.doctor_id IS 'Reference to the attending doctor from doctors table';
COMMENT ON COLUMN patient_admissions.doctor_name IS 'Name of the attending doctor (denormalized for quick access)';

-- Verify the changes
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'patient_admissions' 
AND column_name IN ('doctor_id', 'doctor_name')
ORDER BY column_name;
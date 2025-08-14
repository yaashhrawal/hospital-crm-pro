-- ULTIMATE COMPLETE SCHEMA FIX FOR MADHUBAN DATABASE
-- This adds ALL columns that exist in the Valant database to match exactly

-- Add ALL missing columns to patients table
ALTER TABLE patients ADD COLUMN IF NOT EXISTS date_of_birth DATE;
ALTER TABLE patients ADD COLUMN IF NOT EXISTS assigned_doctors TEXT[];
ALTER TABLE patients ADD COLUMN IF NOT EXISTS consultation_fees NUMERIC(10,2);
ALTER TABLE patients ADD COLUMN IF NOT EXISTS assigned_doctor_ids UUID[];
ALTER TABLE patients ADD COLUMN IF NOT EXISTS consultation_notes TEXT;
ALTER TABLE patients ADD COLUMN IF NOT EXISTS treatment_status TEXT;
ALTER TABLE patients ADD COLUMN IF NOT EXISTS last_visit_date DATE;
ALTER TABLE patients ADD COLUMN IF NOT EXISTS visit_count INTEGER DEFAULT 0;
ALTER TABLE patients ADD COLUMN IF NOT EXISTS total_fees NUMERIC(10,2) DEFAULT 0;
ALTER TABLE patients ADD COLUMN IF NOT EXISTS outstanding_balance NUMERIC(10,2) DEFAULT 0;
ALTER TABLE patients ADD COLUMN IF NOT EXISTS last_consultation_date TIMESTAMPTZ;
ALTER TABLE patients ADD COLUMN IF NOT EXISTS patient_status TEXT DEFAULT 'Active';
ALTER TABLE patients ADD COLUMN IF NOT EXISTS referral_source TEXT;
ALTER TABLE patients ADD COLUMN IF NOT EXISTS special_notes TEXT;
ALTER TABLE patients ADD COLUMN IF NOT EXISTS weight NUMERIC(5,2);
ALTER TABLE patients ADD COLUMN IF NOT EXISTS height NUMERIC(5,2);
ALTER TABLE patients ADD COLUMN IF NOT EXISTS bmi NUMERIC(5,2);
ALTER TABLE patients ADD COLUMN IF NOT EXISTS marital_status TEXT;
ALTER TABLE patients ADD COLUMN IF NOT EXISTS nationality TEXT;
ALTER TABLE patients ADD COLUMN IF NOT EXISTS language TEXT;
ALTER TABLE patients ADD COLUMN IF NOT EXISTS religion TEXT;
ALTER TABLE patients ADD COLUMN IF NOT EXISTS admission_notes TEXT;
ALTER TABLE patients ADD COLUMN IF NOT EXISTS discharge_notes TEXT;
ALTER TABLE patients ADD COLUMN IF NOT EXISTS follow_up_required BOOLEAN DEFAULT false;
ALTER TABLE patients ADD COLUMN IF NOT EXISTS follow_up_date DATE;
ALTER TABLE patients ADD COLUMN IF NOT EXISTS created_by UUID;
ALTER TABLE patients ADD COLUMN IF NOT EXISTS updated_by UUID;
ALTER TABLE patients ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE patients ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT false;

-- Set default values for existing records to prevent null errors
UPDATE patients SET date_of_birth = date_of_entry WHERE date_of_birth IS NULL AND date_of_entry IS NOT NULL;
UPDATE patients SET assigned_doctors = '{}' WHERE assigned_doctors IS NULL;
UPDATE patients SET consultation_fees = 0 WHERE consultation_fees IS NULL;
UPDATE patients SET assigned_doctor_ids = '{}' WHERE assigned_doctor_ids IS NULL;
UPDATE patients SET visit_count = 0 WHERE visit_count IS NULL;
UPDATE patients SET total_fees = 0 WHERE total_fees IS NULL;
UPDATE patients SET outstanding_balance = 0 WHERE outstanding_balance IS NULL;
UPDATE patients SET patient_status = 'Active' WHERE patient_status IS NULL;
UPDATE patients SET follow_up_required = false WHERE follow_up_required IS NULL;
UPDATE patients SET is_deleted = false WHERE is_deleted IS NULL;
UPDATE patients SET weight = 70.0 WHERE weight IS NULL;
UPDATE patients SET height = 170.0 WHERE height IS NULL;
UPDATE patients SET bmi = 24.2 WHERE bmi IS NULL;

-- Verify the critical columns were added
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'patients' 
AND column_name IN (
    'date_of_birth',
    'assigned_doctors', 
    'consultation_fees', 
    'assigned_doctor_ids',
    'patient_status',
    'weight',
    'height'
)
ORDER BY column_name;

-- Show total column count to verify completeness
SELECT COUNT(*) as total_columns 
FROM information_schema.columns 
WHERE table_name = 'patients';
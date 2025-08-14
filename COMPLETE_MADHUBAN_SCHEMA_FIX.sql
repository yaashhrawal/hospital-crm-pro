-- COMPLETE SCHEMA FIX FOR MADHUBAN DATABASE
-- Copy and paste this entire SQL into Supabase SQL Editor for Madhuban project

-- Add all potentially missing columns to patients table
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

-- Set default values for existing records
UPDATE patients SET assigned_doctors = '{}' WHERE assigned_doctors IS NULL;
UPDATE patients SET consultation_fees = 0 WHERE consultation_fees IS NULL;
UPDATE patients SET assigned_doctor_ids = '{}' WHERE assigned_doctor_ids IS NULL;
UPDATE patients SET visit_count = 0 WHERE visit_count IS NULL;
UPDATE patients SET total_fees = 0 WHERE total_fees IS NULL;
UPDATE patients SET outstanding_balance = 0 WHERE outstanding_balance IS NULL;
UPDATE patients SET patient_status = 'Active' WHERE patient_status IS NULL;

-- Verify all columns were added successfully
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'patients' 
AND column_name IN (
    'assigned_doctors', 
    'consultation_fees', 
    'assigned_doctor_ids',
    'consultation_notes',
    'treatment_status',
    'visit_count',
    'total_fees',
    'outstanding_balance'
)
ORDER BY column_name;
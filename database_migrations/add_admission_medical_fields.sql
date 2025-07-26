-- Migration: Add medical fields to patient admissions
-- Purpose: Add Procedure, History of Present Illness (HPI), and Past History fields to IPD admission form

-- Add new medical fields to patient_admissions table
ALTER TABLE patient_admissions 
ADD COLUMN IF NOT EXISTS procedure_planned TEXT,
ADD COLUMN IF NOT EXISTS history_present_illness TEXT,
ADD COLUMN IF NOT EXISTS past_medical_history TEXT;

-- Add comments to explain the fields
COMMENT ON COLUMN patient_admissions.procedure_planned IS 'Planned procedure or intervention for this admission';
COMMENT ON COLUMN patient_admissions.history_present_illness IS 'History of Present Illness (HPI) - Chief complaint and timeline';
COMMENT ON COLUMN patient_admissions.past_medical_history IS 'Past Medical History - Previous medical conditions and surgeries';

-- Create index for better search performance
CREATE INDEX IF NOT EXISTS idx_patient_admissions_procedure ON patient_admissions(procedure_planned);
CREATE INDEX IF NOT EXISTS idx_patient_admissions_hpi ON patient_admissions USING gin(to_tsvector('english', history_present_illness));
CREATE INDEX IF NOT EXISTS idx_patient_admissions_pmh ON patient_admissions USING gin(to_tsvector('english', past_medical_history));
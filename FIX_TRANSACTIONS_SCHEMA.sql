-- ALTER TABLE statements to add ALL missing columns to patient_transactions in Madhuban

ALTER TABLE patient_transactions ADD COLUMN IF NOT EXISTS id UUID;
ALTER TABLE patient_transactions ADD COLUMN IF NOT EXISTS patient_id UUID;
ALTER TABLE patient_transactions ADD COLUMN IF NOT EXISTS admission_id UUID;
ALTER TABLE patient_transactions ADD COLUMN IF NOT EXISTS transaction_type TEXT;
ALTER TABLE patient_transactions ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE patient_transactions ADD COLUMN IF NOT EXISTS amount NUMERIC(10,2);
ALTER TABLE patient_transactions ADD COLUMN IF NOT EXISTS payment_mode TEXT;
ALTER TABLE patient_transactions ADD COLUMN IF NOT EXISTS doctor_id UUID;
ALTER TABLE patient_transactions ADD COLUMN IF NOT EXISTS department TEXT;
ALTER TABLE patient_transactions ADD COLUMN IF NOT EXISTS status TEXT;
ALTER TABLE patient_transactions ADD COLUMN IF NOT EXISTS transaction_reference TEXT;
ALTER TABLE patient_transactions ADD COLUMN IF NOT EXISTS receipt_number TEXT;
ALTER TABLE patient_transactions ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE patient_transactions ADD COLUMN IF NOT EXISTS hospital_id UUID;
ALTER TABLE patient_transactions ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ;
ALTER TABLE patient_transactions ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ;
ALTER TABLE patient_transactions ADD COLUMN IF NOT EXISTS doctor_name TEXT;

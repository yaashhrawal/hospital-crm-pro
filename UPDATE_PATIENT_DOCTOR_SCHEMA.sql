-- Database Schema Update for Patient-Doctor Assignment
-- Run this SQL in your Supabase SQL Editor

-- 1. Add reference fields to patients table (if not already added)
ALTER TABLE patients ADD COLUMN IF NOT EXISTS has_reference BOOLEAN DEFAULT FALSE;
ALTER TABLE patients ADD COLUMN IF NOT EXISTS reference_details TEXT;

-- 2. Add doctor and department fields to patients table for assignment tracking
ALTER TABLE patients ADD COLUMN IF NOT EXISTS assigned_doctor TEXT;
ALTER TABLE patients ADD COLUMN IF NOT EXISTS assigned_department TEXT;

-- 3. Update patient_transactions table to support doctor names (not just IDs)
ALTER TABLE patient_transactions ALTER COLUMN doctor_id TYPE TEXT;
ALTER TABLE patient_transactions ADD COLUMN IF NOT EXISTS doctor_name TEXT;

-- 4. Insert the doctors data into the doctors table (if it doesn't exist)
INSERT INTO doctors (name, department, specialization, fee, is_active) VALUES
('DR. HEMANT KHAJJA', 'ORTHOPEDIC', 'Orthopedic Surgeon', 800.00, true),
('DR. LALITA SUWALKA', 'DIETICIAN', 'Clinical Dietician', 500.00, true),
('DR. MILIND KIRIT AKHANI', 'GASTRO', 'Gastroenterologist', 1000.00, true),
('DR MEETU BABLE', 'GYN.', 'Gynecologist', 900.00, true),
('DR. AMIT PATANVADIYA', 'NEUROLOGY', 'Neurologist', 1200.00, true),
('DR. KISHAN PATEL', 'UROLOGY', 'Urologist', 1000.00, true),
('DR. PARTH SHAH', 'SURGICAL ONCOLOGY', 'Surgical Oncologist', 1500.00, true),
('DR.RAJEEDP GUPTA', 'MEDICAL ONCOLOGY', 'Medical Oncologist', 1500.00, true),
('DR. KULDDEP VALA', 'NEUROSURGERY', 'Neurosurgeon', 2000.00, true),
('DR. KURNAL PATEL', 'UROLOGY', 'Urologist', 1000.00, true),
('DR. SAURABH GUPTA', 'ENDOCRINOLOGY', 'Endocrinologist', 800.00, true),
('DR. BATUL PEEPAWALA', 'GENERAL PHYSICIAN', 'General Physician', 600.00, true)
ON CONFLICT (name) DO UPDATE SET 
  department = EXCLUDED.department,
  specialization = EXCLUDED.specialization,
  fee = EXCLUDED.fee,
  is_active = EXCLUDED.is_active;

-- 5. Insert departments data into departments table (if it doesn't exist)
INSERT INTO departments (name, description, is_active) VALUES
('ORTHOPEDIC', 'Orthopedic Surgery and Bone Care', true),
('DIETICIAN', 'Nutrition and Diet Planning', true),
('GASTRO', 'Gastroenterology and Digestive System', true),
('GYN.', 'Gynecology and Women Health', true),
('NEUROLOGY', 'Neurology and Nervous System', true),
('UROLOGY', 'Urology and Urinary System', true),
('SURGICAL ONCOLOGY', 'Surgical Cancer Treatment', true),
('MEDICAL ONCOLOGY', 'Medical Cancer Treatment', true),
('NEUROSURGERY', 'Brain and Spine Surgery', true),
('ENDOCRINOLOGY', 'Hormones and Metabolism', true),
('GENERAL PHYSICIAN', 'General Medicine and Primary Care', true)
ON CONFLICT (name) DO UPDATE SET 
  description = EXCLUDED.description,
  is_active = EXCLUDED.is_active;

-- 6. Update patient_transactions table to support new transaction types
ALTER TABLE patient_transactions DROP CONSTRAINT IF EXISTS patient_transactions_transaction_type_check;
ALTER TABLE patient_transactions ADD CONSTRAINT patient_transactions_transaction_type_check 
  CHECK (transaction_type IN ('ENTRY_FEE', 'CONSULTATION', 'LAB_TEST', 'XRAY', 'MEDICINE', 'PROCEDURE', 'ADMISSION_FEE', 'DAILY_CHARGE', 'SERVICE', 'REFUND', 'entry_fee', 'consultation', 'service', 'admission', 'medicine', 'discount', 'refund'));

-- 7. Update payment_mode constraints to support new payment methods
ALTER TABLE patient_transactions DROP CONSTRAINT IF EXISTS patient_transactions_payment_mode_check;
ALTER TABLE patient_transactions ADD CONSTRAINT patient_transactions_payment_mode_check 
  CHECK (payment_mode IN ('CASH', 'CARD', 'UPI', 'ONLINE', 'BANK_TRANSFER', 'INSURANCE', 'cash', 'online', 'card', 'upi', 'insurance', 'adjustment'));

-- 8. Create index for better performance on doctor and department queries
CREATE INDEX IF NOT EXISTS idx_patients_assigned_doctor ON patients(assigned_doctor);
CREATE INDEX IF NOT EXISTS idx_patients_assigned_department ON patients(assigned_department);
CREATE INDEX IF NOT EXISTS idx_transactions_doctor_name ON patient_transactions(doctor_name);
CREATE INDEX IF NOT EXISTS idx_transactions_department ON patient_transactions(department);

-- 9. Add trigger to auto-generate patient_id if not provided
CREATE OR REPLACE FUNCTION generate_patient_id()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.patient_id IS NULL OR NEW.patient_id = '' THEN
        -- Get the next sequence number
        SELECT COALESCE(MAX(CAST(SUBSTRING(patient_id FROM 2) AS INTEGER)), 0) + 1
        INTO NEW.patient_id
        FROM patients 
        WHERE patient_id ~ '^P[0-9]+$';
        
        -- Format as P0001, P0002, etc.
        NEW.patient_id := 'P' || LPAD(NEW.patient_id::TEXT, 4, '0');
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_generate_patient_id ON patients;
CREATE TRIGGER trigger_generate_patient_id
    BEFORE INSERT ON patients
    FOR EACH ROW
    EXECUTE FUNCTION generate_patient_id();

-- Summary of changes:
-- ✅ Added reference tracking fields to patients table
-- ✅ Added doctor/department assignment fields to patients table  
-- ✅ Updated transaction table to support doctor names
-- ✅ Inserted all 12 doctors with their departments and fees
-- ✅ Inserted all departments with descriptions
-- ✅ Updated constraints to support new transaction and payment types
-- ✅ Added performance indexes
-- ✅ Added auto-generation of patient IDs

COMMENT ON COLUMN patients.has_reference IS 'Whether patient was referred by someone';
COMMENT ON COLUMN patients.reference_details IS 'Details about the reference/referral';
COMMENT ON COLUMN patients.assigned_doctor IS 'Name of the assigned doctor';
COMMENT ON COLUMN patients.assigned_department IS 'Department where patient is assigned';
COMMENT ON COLUMN patient_transactions.doctor_name IS 'Name of the doctor for this transaction';
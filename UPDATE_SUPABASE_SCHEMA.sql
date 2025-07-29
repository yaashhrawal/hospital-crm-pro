-- Update Supabase Schema for Hospital CRM Pro
-- Run this in your Supabase SQL Editor to update your database schema

-- 1. First, let's check if we need to update the patient_admissions table structure
-- This script will update the existing schema to match what the application expects

-- 2. Update patient_admissions table to match the application's expectations
-- Add missing columns if they don't exist
ALTER TABLE patient_admissions 
ADD COLUMN IF NOT EXISTS bed_id UUID,
ADD COLUMN IF NOT EXISTS expected_discharge_date DATE,
ADD COLUMN IF NOT EXISTS actual_discharge_date DATE,
ADD COLUMN IF NOT EXISTS admission_notes TEXT,
ADD COLUMN IF NOT EXISTS discharge_notes TEXT,
ADD COLUMN IF NOT EXISTS services JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS amount_paid NUMERIC(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS balance NUMERIC(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS admitted_by UUID,
ADD COLUMN IF NOT EXISTS discharged_by UUID,
ADD COLUMN IF NOT EXISTS hospital_id UUID DEFAULT '550e8400-e29b-41d4-a716-446655440000';

-- 3. Update the status field to use uppercase values that match the TypeScript interface
-- First, update existing data
UPDATE patient_admissions SET status = 'ACTIVE' WHERE status = 'active';
UPDATE patient_admissions SET status = 'DISCHARGED' WHERE status = 'discharged';

-- Then update the constraint
ALTER TABLE patient_admissions DROP CONSTRAINT IF EXISTS patient_admissions_status_check;
ALTER TABLE patient_admissions ADD CONSTRAINT patient_admissions_status_check 
    CHECK (status IN ('ACTIVE', 'DISCHARGED', 'TRANSFERRED'));

-- 4. Update patients table to support the new flexible name structure and other fields
ALTER TABLE patients 
ALTER COLUMN last_name DROP NOT NULL,
ADD COLUMN IF NOT EXISTS prefix TEXT DEFAULT 'Mr',
ADD COLUMN IF NOT EXISTS date_of_birth DATE,
ADD COLUMN IF NOT EXISTS insurance_provider TEXT,
ADD COLUMN IF NOT EXISTS insurance_number TEXT,
ADD COLUMN IF NOT EXISTS has_reference BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS reference_details TEXT,
ADD COLUMN IF NOT EXISTS assigned_doctor TEXT,
ADD COLUMN IF NOT EXISTS assigned_department TEXT,
ADD COLUMN IF NOT EXISTS assigned_doctors JSONB DEFAULT '[]',
ADD COLUMN IF NOT EXISTS consultation_fees JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS hospital_id UUID DEFAULT '550e8400-e29b-41d4-a716-446655440000';

-- 5. Update the age column to support string values (as the app expects)
ALTER TABLE patients ALTER COLUMN age TYPE TEXT USING age::TEXT;
ALTER TABLE patients ALTER COLUMN age DROP NOT NULL;

-- 6. Create beds table if it doesn't exist (referenced by patient_admissions)
CREATE TABLE IF NOT EXISTS beds (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bed_number TEXT NOT NULL,
    room_type TEXT NOT NULL CHECK (room_type IN ('GENERAL', 'PRIVATE', 'ICU', 'EMERGENCY')),
    department_id UUID,
    daily_rate NUMERIC(10,2) NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'AVAILABLE' CHECK (status IN ('AVAILABLE', 'OCCUPIED', 'MAINTENANCE', 'RESERVED')),
    hospital_id UUID DEFAULT '550e8400-e29b-41d4-a716-446655440000',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. Create hospitals table if it doesn't exist
CREATE TABLE IF NOT EXISTS hospitals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    address TEXT NOT NULL,
    phone TEXT NOT NULL,
    email TEXT NOT NULL,
    registration_number TEXT,
    gst_number TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. Insert default hospital if it doesn't exist
INSERT INTO hospitals (id, name, address, phone, email, registration_number, gst_number)
VALUES (
    '550e8400-e29b-41d4-a716-446655440000',
    'City General Hospital',
    '123 Healthcare Street, Medical City',
    '+1-555-HOSPITAL',
    'info@citygeneral.com',
    'HCR2024001',
    'GST123456789'
) ON CONFLICT (id) DO NOTHING;

-- 9. Update users table to support the enhanced schema
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS auth_id UUID,
ADD COLUMN IF NOT EXISTS phone TEXT,
ADD COLUMN IF NOT EXISTS specialization TEXT,
ADD COLUMN IF NOT EXISTS consultation_fee NUMERIC(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS department TEXT,
ADD COLUMN IF NOT EXISTS hospital_id UUID DEFAULT '550e8400-e29b-41d4-a716-446655440000';

-- 10. Update patient_transactions to match the expected schema
ALTER TABLE patient_transactions 
ADD COLUMN IF NOT EXISTS admission_id UUID,
ADD COLUMN IF NOT EXISTS receipt_number TEXT,
ADD COLUMN IF NOT EXISTS notes TEXT,
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'COMPLETED' CHECK (status IN ('PENDING', 'COMPLETED', 'CANCELLED')),
ADD COLUMN IF NOT EXISTS hospital_id UUID DEFAULT '550e8400-e29b-41d4-a716-446655440000',
ADD COLUMN IF NOT EXISTS created_by UUID;

-- Update transaction_type constraint to match what the app expects
ALTER TABLE patient_transactions DROP CONSTRAINT IF EXISTS patient_transactions_transaction_type_check;
ALTER TABLE patient_transactions ADD CONSTRAINT patient_transactions_transaction_type_check 
    CHECK (transaction_type IN ('ENTRY_FEE', 'CONSULTATION', 'LAB_TEST', 'XRAY', 'MEDICINE', 'PROCEDURE', 'ADMISSION_FEE', 'DAILY_CHARGE', 'SERVICE', 'REFUND'));

-- Update payment_mode constraint to match what the app expects
ALTER TABLE patient_transactions DROP CONSTRAINT IF EXISTS patient_transactions_payment_mode_check;
ALTER TABLE patient_transactions ADD CONSTRAINT patient_transactions_payment_mode_check 
    CHECK (payment_mode IN ('CASH', 'CARD', 'UPI', 'ONLINE', 'BANK_TRANSFER', 'INSURANCE'));

-- 11. Create future_appointments table if it doesn't exist
CREATE TABLE IF NOT EXISTS future_appointments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    doctor_id UUID REFERENCES users(id),
    appointment_date DATE NOT NULL,
    appointment_time TIME NOT NULL,
    duration_minutes INTEGER DEFAULT 30,
    appointment_type TEXT NOT NULL DEFAULT 'CONSULTATION' CHECK (appointment_type IN ('CONSULTATION', 'FOLLOW_UP', 'EMERGENCY', 'PROCEDURE', 'CHECKUP')),
    reason TEXT,
    status TEXT NOT NULL DEFAULT 'SCHEDULED' CHECK (status IN ('SCHEDULED', 'CONFIRMED', 'CANCELLED', 'COMPLETED', 'NO_SHOW')),
    estimated_cost NUMERIC(10,2) DEFAULT 0,
    notes TEXT,
    reminder_sent BOOLEAN DEFAULT FALSE,
    hospital_id UUID DEFAULT '550e8400-e29b-41d4-a716-446655440000',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES users(id)
);

-- 12. Enable RLS on new tables
ALTER TABLE beds ENABLE ROW LEVEL SECURITY;
ALTER TABLE hospitals ENABLE ROW LEVEL SECURITY;
ALTER TABLE future_appointments ENABLE ROW LEVEL SECURITY;

-- 13. Create RLS policies for new tables
CREATE POLICY "Authenticated users can read beds" ON beds FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can insert beds" ON beds FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can update beds" ON beds FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can read hospitals" ON hospitals FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can read appointments" ON future_appointments FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can insert appointments" ON future_appointments FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can update appointments" ON future_appointments FOR UPDATE USING (auth.role() = 'authenticated');

-- 14. Add some sample beds
INSERT INTO beds (bed_number, room_type, daily_rate, status) VALUES
('G001', 'GENERAL', 500.00, 'AVAILABLE'),
('G002', 'GENERAL', 500.00, 'AVAILABLE'),
('P001', 'PRIVATE', 1200.00, 'AVAILABLE'),
('P002', 'PRIVATE', 1200.00, 'AVAILABLE'),
('ICU01', 'ICU', 2500.00, 'AVAILABLE'),
('ICU02', 'ICU', 2500.00, 'AVAILABLE')
ON CONFLICT DO NOTHING;

-- 15. Add updated_at triggers for new tables
CREATE TRIGGER update_beds_updated_at BEFORE UPDATE ON beds FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_hospitals_updated_at BEFORE UPDATE ON hospitals FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 16. Create indexes for better performance on new columns
CREATE INDEX IF NOT EXISTS idx_patient_admissions_hospital_id ON patient_admissions(hospital_id);
CREATE INDEX IF NOT EXISTS idx_patient_admissions_bed_id ON patient_admissions(bed_id);
CREATE INDEX IF NOT EXISTS idx_patients_hospital_id ON patients(hospital_id);
CREATE INDEX IF NOT EXISTS idx_users_hospital_id ON users(hospital_id);
CREATE INDEX IF NOT EXISTS idx_future_appointments_patient_id ON future_appointments(patient_id);
CREATE INDEX IF NOT EXISTS idx_future_appointments_doctor_id ON future_appointments(doctor_id);
CREATE INDEX IF NOT EXISTS idx_future_appointments_date ON future_appointments(appointment_date);

-- Verification
SELECT 'Database schema updated successfully!' as status;
SELECT 'patient_admissions' as table_name, COUNT(*) as row_count FROM patient_admissions
UNION ALL
SELECT 'patients' as table_name, COUNT(*) as row_count FROM patients
UNION ALL
SELECT 'beds' as table_name, COUNT(*) as row_count FROM beds
UNION ALL
SELECT 'hospitals' as table_name, COUNT(*) as row_count FROM hospitals;
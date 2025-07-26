-- Hospital CRM Complete Database Schema for Supabase
-- Run this in your Supabase SQL Editor to create all required tables

-- 1. Users table (extends auth.users)
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'STAFF' CHECK (role IN ('ADMIN', 'DOCTOR', 'NURSE', 'STAFF')),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Departments table
CREATE TABLE IF NOT EXISTS departments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT UNIQUE NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Doctors table
CREATE TABLE IF NOT EXISTS doctors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    department TEXT NOT NULL,
    specialization TEXT NOT NULL,
    fee NUMERIC(10,2) NOT NULL DEFAULT 500.00,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Patients table
CREATE TABLE IF NOT EXISTS patients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id TEXT UNIQUE NOT NULL,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    age INTEGER NOT NULL CHECK (age >= 0 AND age <= 150),
    gender TEXT NOT NULL CHECK (gender IN ('MALE', 'FEMALE', 'OTHER')),
    phone TEXT NOT NULL,
    email TEXT,
    address TEXT NOT NULL,
    emergency_contact_name TEXT NOT NULL,
    emergency_contact_phone TEXT NOT NULL,
    medical_history TEXT,
    allergies TEXT,
    current_medications TEXT,
    blood_group TEXT,
    notes TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES users(id)
);

-- 5. Patient Transactions table
CREATE TABLE IF NOT EXISTS patient_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    transaction_type TEXT NOT NULL CHECK (transaction_type IN ('entry_fee', 'consultation', 'service', 'admission', 'medicine', 'discount', 'refund')),
    amount NUMERIC(10,2) NOT NULL,
    payment_mode TEXT NOT NULL CHECK (payment_mode IN ('cash', 'online', 'card', 'upi', 'insurance', 'adjustment')),
    doctor_id TEXT,
    doctor_name TEXT,
    department TEXT NOT NULL,
    description TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Patient Admissions table
CREATE TABLE IF NOT EXISTS patient_admissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    bed_number TEXT NOT NULL,
    room_type TEXT NOT NULL CHECK (room_type IN ('general', 'private', 'icu')),
    department TEXT NOT NULL,
    daily_rate NUMERIC(10,2) NOT NULL,
    admission_date DATE NOT NULL,
    discharge_date DATE,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'discharged')),
    total_amount NUMERIC(10,2) NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    history_present_illness TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. Daily Expenses table
CREATE TABLE IF NOT EXISTS daily_expenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    expense_category TEXT NOT NULL,
    description TEXT NOT NULL,
    amount NUMERIC(10,2) NOT NULL,
    payment_mode TEXT NOT NULL CHECK (payment_mode IN ('cash', 'online', 'card', 'upi')),
    date DATE NOT NULL,
    approved_by TEXT NOT NULL DEFAULT 'system',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default data
INSERT INTO departments (name, description) VALUES
    ('General', 'General Medicine'),
    ('Cardiology', 'Heart and Blood Vessels'),
    ('Pediatrics', 'Child Care'),
    ('Emergency', 'Emergency Medicine'),
    ('Orthopedics', 'Bone and Joint Care')
ON CONFLICT (name) DO NOTHING;

INSERT INTO doctors (name, department, specialization, fee) VALUES
    ('Dr. Rajesh Kumar', 'General', 'General Medicine', 500.00),
    ('Dr. Priya Sharma', 'Cardiology', 'Cardiology', 1200.00),
    ('Dr. Amit Singh', 'Pediatrics', 'Child Care', 800.00),
    ('Dr. Neha Gupta', 'Emergency', 'Emergency Medicine', 1000.00),
    ('Dr. Suresh Patel', 'Orthopedics', 'Bone & Joint', 900.00)
ON CONFLICT DO NOTHING;

-- Enable Row Level Security (RLS) on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE doctors ENABLE ROW LEVEL SECURITY;
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE patient_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE patient_admissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_expenses ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (allow authenticated users to access all data for hospital operations)
-- Users
CREATE POLICY "Authenticated users can read users" ON users FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Users can read own profile" ON users FOR SELECT USING (auth.uid() = id);

-- Departments
CREATE POLICY "Authenticated users can read departments" ON departments FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can insert departments" ON departments FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can update departments" ON departments FOR UPDATE USING (auth.role() = 'authenticated');

-- Doctors
CREATE POLICY "Authenticated users can read doctors" ON doctors FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can insert doctors" ON doctors FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can update doctors" ON doctors FOR UPDATE USING (auth.role() = 'authenticated');

-- Patients
CREATE POLICY "Authenticated users can read patients" ON patients FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can insert patients" ON patients FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can update patients" ON patients FOR UPDATE USING (auth.role() = 'authenticated');

-- Patient Transactions
CREATE POLICY "Authenticated users can read transactions" ON patient_transactions FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can insert transactions" ON patient_transactions FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can update transactions" ON patient_transactions FOR UPDATE USING (auth.role() = 'authenticated');

-- Patient Admissions
CREATE POLICY "Authenticated users can read admissions" ON patient_admissions FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can insert admissions" ON patient_admissions FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can update admissions" ON patient_admissions FOR UPDATE USING (auth.role() = 'authenticated');

-- Daily Expenses
CREATE POLICY "Authenticated users can read expenses" ON daily_expenses FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can insert expenses" ON daily_expenses FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can update expenses" ON daily_expenses FOR UPDATE USING (auth.role() = 'authenticated');

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_patients_patient_id ON patients(patient_id);
CREATE INDEX IF NOT EXISTS idx_patients_phone ON patients(phone);
CREATE INDEX IF NOT EXISTS idx_patient_transactions_patient_id ON patient_transactions(patient_id);
CREATE INDEX IF NOT EXISTS idx_patient_transactions_created_at ON patient_transactions(created_at);
CREATE INDEX IF NOT EXISTS idx_patient_transactions_type ON patient_transactions(transaction_type);
CREATE INDEX IF NOT EXISTS idx_patient_admissions_patient_id ON patient_admissions(patient_id);
CREATE INDEX IF NOT EXISTS idx_patient_admissions_status ON patient_admissions(status);
CREATE INDEX IF NOT EXISTS idx_daily_expenses_date ON daily_expenses(date);
CREATE INDEX IF NOT EXISTS idx_daily_expenses_category ON daily_expenses(expense_category);

-- Create admin user if it doesn't exist
-- First, create the auth user (you'll need to do this manually via Supabase Auth)
-- Then create the profile:
INSERT INTO users (id, email, first_name, last_name, role, is_active)
SELECT 
    id, 
    'admin@hospital.com', 
    'Admin', 
    'User', 
    'ADMIN', 
    TRUE
FROM auth.users 
WHERE email = 'admin@hospital.com'
ON CONFLICT (id) DO UPDATE SET
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    role = EXCLUDED.role,
    is_active = EXCLUDED.is_active;

-- Add updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_departments_updated_at BEFORE UPDATE ON departments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_doctors_updated_at BEFORE UPDATE ON doctors FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_patients_updated_at BEFORE UPDATE ON patients FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_admissions_updated_at BEFORE UPDATE ON patient_admissions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Verification queries
SELECT 'Schema created successfully!' as status;
SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name IN ('users', 'departments', 'doctors', 'patients', 'patient_transactions', 'patient_admissions', 'daily_expenses');
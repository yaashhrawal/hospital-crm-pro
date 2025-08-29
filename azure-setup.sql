-- Azure PostgreSQL Setup Script for Hospital CRM
-- Run this script in your Azure PostgreSQL database

-- Create database if not exists
-- Note: Run this command separately if needed: CREATE DATABASE hospital_crm;

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. Users table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'STAFF' CHECK (role IN ('ADMIN', 'DOCTOR', 'NURSE', 'STAFF', 'FRONTDESK')),
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
    phone TEXT,
    email TEXT,
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
    date_of_entry DATE,
    patient_tag TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES users(id)
);

-- 5. Patient Transactions table
CREATE TABLE IF NOT EXISTS patient_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    transaction_type TEXT NOT NULL CHECK (transaction_type IN ('entry_fee', 'consultation', 'service', 'admission', 'medicine', 'discount', 'refund', 'procedure', 'lab_test', 'imaging')),
    amount NUMERIC(10,2) NOT NULL,
    payment_mode TEXT NOT NULL CHECK (payment_mode IN ('cash', 'online', 'card', 'upi', 'insurance', 'adjustment')),
    doctor_id UUID REFERENCES doctors(id),
    doctor_name TEXT,
    department TEXT NOT NULL,
    description TEXT NOT NULL,
    transaction_date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES users(id)
);

-- 6. Patient Admissions table
CREATE TABLE IF NOT EXISTS patient_admissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    bed_number TEXT NOT NULL,
    room_type TEXT NOT NULL CHECK (room_type IN ('general', 'private', 'semi-private', 'icu', 'nicu', 'emergency')),
    department TEXT NOT NULL,
    daily_rate NUMERIC(10,2) NOT NULL,
    admission_date DATE NOT NULL,
    discharge_date DATE,
    treating_doctor UUID REFERENCES doctors(id),
    assigned_doctors TEXT[],
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'discharged', 'transferred')),
    total_amount NUMERIC(10,2) NOT NULL DEFAULT 0,
    history_present_illness TEXT,
    diagnosis TEXT,
    treatment_plan TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES users(id)
);

-- 7. Beds table
CREATE TABLE IF NOT EXISTS beds (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bed_number TEXT UNIQUE NOT NULL,
    department TEXT NOT NULL,
    room_type TEXT NOT NULL CHECK (room_type IN ('general', 'private', 'semi-private', 'icu', 'nicu', 'emergency')),
    floor INTEGER NOT NULL,
    status TEXT NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'occupied', 'maintenance', 'reserved')),
    patient_id UUID REFERENCES patients(id),
    daily_rate NUMERIC(10,2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. Daily Expenses table
CREATE TABLE IF NOT EXISTS daily_expenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    expense_category TEXT NOT NULL,
    description TEXT NOT NULL,
    amount NUMERIC(10,2) NOT NULL,
    payment_mode TEXT NOT NULL CHECK (payment_mode IN ('cash', 'online', 'card', 'upi', 'cheque', 'bank_transfer')),
    expense_date DATE NOT NULL DEFAULT CURRENT_DATE,
    receipt_number TEXT,
    vendor_name TEXT,
    approved_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES users(id)
);

-- 9. Appointments table
CREATE TABLE IF NOT EXISTS appointments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
    doctor_id UUID REFERENCES doctors(id),
    appointment_date DATE NOT NULL,
    appointment_time TIME NOT NULL,
    department TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'confirmed', 'cancelled', 'completed', 'no-show')),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES users(id)
);

-- 10. Medicines table
CREATE TABLE IF NOT EXISTS medicines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    generic_name TEXT,
    category TEXT NOT NULL,
    manufacturer TEXT,
    unit_price NUMERIC(10,2) NOT NULL,
    stock_quantity INTEGER NOT NULL DEFAULT 0,
    reorder_level INTEGER NOT NULL DEFAULT 10,
    expiry_date DATE,
    batch_number TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 11. Patient Visits table
CREATE TABLE IF NOT EXISTS patient_visits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    visit_date DATE NOT NULL DEFAULT CURRENT_DATE,
    visit_type TEXT NOT NULL CHECK (visit_type IN ('OPD', 'IPD', 'Emergency', 'Follow-up')),
    doctor_id UUID REFERENCES doctors(id),
    department TEXT NOT NULL,
    chief_complaint TEXT,
    diagnosis TEXT,
    treatment TEXT,
    prescription TEXT,
    follow_up_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES users(id)
);

-- 12. Discharge Summary table
CREATE TABLE IF NOT EXISTS discharge_summary (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admission_id UUID NOT NULL REFERENCES patient_admissions(id),
    patient_id UUID NOT NULL REFERENCES patients(id),
    discharge_date DATE NOT NULL,
    discharge_type TEXT NOT NULL CHECK (discharge_type IN ('Regular', 'Against Medical Advice', 'Referred', 'Death', 'Absconded')),
    final_diagnosis TEXT NOT NULL,
    treatment_summary TEXT,
    discharge_instructions TEXT,
    follow_up_instructions TEXT,
    medications_on_discharge TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES users(id)
);

-- Create indexes for better performance
CREATE INDEX idx_patients_patient_id ON patients(patient_id);
CREATE INDEX idx_patients_phone ON patients(phone);
CREATE INDEX idx_patients_created_at ON patients(created_at);
CREATE INDEX idx_transactions_patient_id ON patient_transactions(patient_id);
CREATE INDEX idx_transactions_created_at ON patient_transactions(created_at);
CREATE INDEX idx_transactions_date ON patient_transactions(transaction_date);
CREATE INDEX idx_admissions_patient_id ON patient_admissions(patient_id);
CREATE INDEX idx_admissions_status ON patient_admissions(status);
CREATE INDEX idx_appointments_date ON appointments(appointment_date);
CREATE INDEX idx_appointments_patient_id ON appointments(patient_id);
CREATE INDEX idx_appointments_doctor_id ON appointments(doctor_id);
CREATE INDEX idx_beds_status ON beds(status);
CREATE INDEX idx_visits_patient_id ON patient_visits(patient_id);
CREATE INDEX idx_visits_date ON patient_visits(visit_date);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at trigger to relevant tables
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_departments_updated_at BEFORE UPDATE ON departments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_doctors_updated_at BEFORE UPDATE ON doctors
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_patients_updated_at BEFORE UPDATE ON patients
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_admissions_updated_at BEFORE UPDATE ON patient_admissions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_beds_updated_at BEFORE UPDATE ON beds
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_appointments_updated_at BEFORE UPDATE ON appointments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_medicines_updated_at BEFORE UPDATE ON medicines
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default departments
INSERT INTO departments (name, description) VALUES
    ('Emergency', 'Emergency and Trauma Care'),
    ('General Medicine', 'Internal Medicine Department'),
    ('Surgery', 'General Surgery Department'),
    ('Pediatrics', 'Children and Infant Care'),
    ('Orthopedics', 'Bone and Joint Care'),
    ('Cardiology', 'Heart and Vascular Care'),
    ('Neurology', 'Brain and Nervous System'),
    ('Obstetrics & Gynecology', 'Women Health and Maternity'),
    ('ICU', 'Intensive Care Unit'),
    ('Radiology', 'Imaging and Diagnostics')
ON CONFLICT (name) DO NOTHING;

-- Create default admin user (password: admin123)
INSERT INTO users (email, password_hash, first_name, last_name, role) VALUES
    ('admin@hospital.com', crypt('admin123', gen_salt('bf')), 'Admin', 'User', 'ADMIN')
ON CONFLICT (email) DO NOTHING;

GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO divyansh04;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO divyansh04;
GRANT ALL PRIVILEGES ON ALL FUNCTIONS IN SCHEMA public TO divyansh04;
-- Madhuban Hospital Database Schema
-- Exported from Valant Hospital Database Structure
-- This schema creates all necessary tables with proper relationships

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'doctor', 'receptionist', 'accountant')),
  hospital_id UUID NOT NULL DEFAULT '550e8400-e29b-41d4-a716-446655440000',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create hospitals table
CREATE TABLE IF NOT EXISTS hospitals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL DEFAULT 'Madhuban Hospital',
  address TEXT,
  phone TEXT,
  email TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default hospital
INSERT INTO hospitals (id, name, address, phone, email)
VALUES ('550e8400-e29b-41d4-a716-446655440000', 'Madhuban Hospital', 'Madhuban', '1234567890', 'info@madhubanhospital.com')
ON CONFLICT (id) DO NOTHING;

-- Create departments table
CREATE TABLE IF NOT EXISTS departments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  hospital_id UUID NOT NULL DEFAULT '550e8400-e29b-41d4-a716-446655440000',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create doctors table
CREATE TABLE IF NOT EXISTS doctors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  specialization TEXT,
  qualification TEXT,
  experience_years INTEGER,
  consultation_fee NUMERIC(10,2),
  department_id UUID REFERENCES departments(id),
  hospital_id UUID NOT NULL DEFAULT '550e8400-e29b-41d4-a716-446655440000',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create patients table
CREATE TABLE IF NOT EXISTS patients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id TEXT UNIQUE NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT,
  age TEXT NOT NULL,
  gender TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  address TEXT,
  blood_group TEXT,
  emergency_contact_name TEXT,
  emergency_contact_phone TEXT,
  medical_history TEXT,
  allergies TEXT,
  occupation TEXT,
  insurance_info TEXT,
  hospital_id UUID NOT NULL DEFAULT '550e8400-e29b-41d4-a716-446655440000',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  prefix TEXT,
  tag TEXT,
  daily_rate NUMERIC(10,2),
  advance_payment NUMERIC(10,2),
  hospital_experience TEXT,
  is_active BOOLEAN DEFAULT true,
  date_of_entry TIMESTAMPTZ DEFAULT NOW(),
  has_reference BOOLEAN DEFAULT false,
  reference_doctor TEXT,
  referred_by TEXT,
  assigned_department TEXT,
  assigned_doctor TEXT,
  ipd_status TEXT DEFAULT 'OPD'
);

-- Create beds table
CREATE TABLE IF NOT EXISTS beds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bed_number TEXT NOT NULL,
  ward_type TEXT NOT NULL,
  floor TEXT,
  room_number TEXT,
  is_occupied BOOLEAN DEFAULT false,
  patient_id UUID REFERENCES patients(id),
  daily_rate NUMERIC(10,2),
  hospital_id UUID NOT NULL DEFAULT '550e8400-e29b-41d4-a716-446655440000',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create patient_admissions table
CREATE TABLE IF NOT EXISTS patient_admissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES patients(id),
  bed_id UUID REFERENCES beds(id),
  admission_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  discharge_date TIMESTAMPTZ,
  admission_type TEXT NOT NULL CHECK (admission_type IN ('IPD', 'OPD', 'Emergency')),
  status TEXT NOT NULL DEFAULT 'Active' CHECK (status IN ('Active', 'Discharged', 'Transferred')),
  reason_for_admission TEXT,
  admitting_doctor_id UUID REFERENCES doctors(id),
  referring_doctor TEXT,
  diagnosis TEXT,
  treatment_plan TEXT,
  notes TEXT,
  hospital_id UUID NOT NULL DEFAULT '550e8400-e29b-41d4-a716-446655440000',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  advance_payment NUMERIC(10,2),
  daily_rate NUMERIC(10,2),
  patient_type TEXT,
  payment_mode TEXT,
  guardian_name TEXT,
  relation_to_patient TEXT,
  insurance_applicable BOOLEAN DEFAULT false,
  assigned_doctor_ids UUID[],
  department_id UUID REFERENCES departments(id)
);

-- Create patient_transactions table
CREATE TABLE IF NOT EXISTS patient_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id TEXT UNIQUE NOT NULL,
  patient_id UUID NOT NULL REFERENCES patients(id),
  amount NUMERIC(10,2) NOT NULL,
  transaction_type TEXT NOT NULL,
  payment_mode TEXT NOT NULL,
  description TEXT,
  reference_number TEXT,
  status TEXT DEFAULT 'Completed',
  created_by UUID REFERENCES users(id),
  hospital_id UUID NOT NULL DEFAULT '550e8400-e29b-41d4-a716-446655440000',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  discount_amount NUMERIC(10,2) DEFAULT 0,
  discount_type TEXT,
  is_refund BOOLEAN DEFAULT false,
  service_details JSONB
);

-- Create appointments table
CREATE TABLE IF NOT EXISTS appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES patients(id),
  doctor_id UUID NOT NULL REFERENCES doctors(id),
  appointment_date DATE NOT NULL,
  appointment_time TIME NOT NULL,
  status TEXT NOT NULL DEFAULT 'Scheduled' CHECK (status IN ('Scheduled', 'Completed', 'Cancelled', 'No Show')),
  reason TEXT,
  notes TEXT,
  hospital_id UUID NOT NULL DEFAULT '550e8400-e29b-41d4-a716-446655440000',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create bills table
CREATE TABLE IF NOT EXISTS bills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bill_number TEXT UNIQUE NOT NULL,
  patient_id UUID NOT NULL REFERENCES patients(id),
  admission_id UUID REFERENCES patient_admissions(id),
  total_amount NUMERIC(10,2) NOT NULL,
  paid_amount NUMERIC(10,2) DEFAULT 0,
  discount_amount NUMERIC(10,2) DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending', 'Partial', 'Paid', 'Cancelled')),
  bill_date DATE NOT NULL DEFAULT CURRENT_DATE,
  due_date DATE,
  notes TEXT,
  hospital_id UUID NOT NULL DEFAULT '550e8400-e29b-41d4-a716-446655440000',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create discharge_summaries table
CREATE TABLE IF NOT EXISTS discharge_summaries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES patients(id),
  admission_id UUID NOT NULL REFERENCES patient_admissions(id),
  discharge_date TIMESTAMPTZ NOT NULL,
  discharge_type TEXT NOT NULL,
  final_diagnosis TEXT,
  treatment_summary TEXT,
  discharge_instructions TEXT,
  follow_up_date DATE,
  medications_on_discharge TEXT,
  condition_on_discharge TEXT,
  discharged_by UUID REFERENCES doctors(id),
  hospital_id UUID NOT NULL DEFAULT '550e8400-e29b-41d4-a716-446655440000',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_patients_hospital ON patients(hospital_id);
CREATE INDEX idx_patients_patient_id ON patients(patient_id);
CREATE INDEX idx_admissions_patient ON patient_admissions(patient_id);
CREATE INDEX idx_transactions_patient ON patient_transactions(patient_id);
CREATE INDEX idx_appointments_patient ON appointments(patient_id);
CREATE INDEX idx_appointments_doctor ON appointments(doctor_id);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE hospitals ENABLE ROW LEVEL SECURITY;
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE doctors ENABLE ROW LEVEL SECURITY;
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE beds ENABLE ROW LEVEL SECURITY;
ALTER TABLE patient_admissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE patient_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE bills ENABLE ROW LEVEL SECURITY;
ALTER TABLE discharge_summaries ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (allow all for now, can be restricted later)
CREATE POLICY "Allow all for users" ON users FOR ALL USING (true);
CREATE POLICY "Allow all for hospitals" ON hospitals FOR ALL USING (true);
CREATE POLICY "Allow all for departments" ON departments FOR ALL USING (true);
CREATE POLICY "Allow all for doctors" ON doctors FOR ALL USING (true);
CREATE POLICY "Allow all for patients" ON patients FOR ALL USING (true);
CREATE POLICY "Allow all for beds" ON beds FOR ALL USING (true);
CREATE POLICY "Allow all for admissions" ON patient_admissions FOR ALL USING (true);
CREATE POLICY "Allow all for transactions" ON patient_transactions FOR ALL USING (true);
CREATE POLICY "Allow all for appointments" ON appointments FOR ALL USING (true);
CREATE POLICY "Allow all for bills" ON bills FOR ALL USING (true);
CREATE POLICY "Allow all for discharge" ON discharge_summaries FOR ALL USING (true);
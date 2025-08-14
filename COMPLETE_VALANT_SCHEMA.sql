-- COMPLETE VALANT TO MADHUBAN DATABASE MIGRATION
-- Generated on: 2025-08-01T08:09:04.669Z

-- Table: patients
DROP TABLE IF EXISTS patients CASCADE;
CREATE TABLE patients (
  id UUID,
  patient_id UUID,
  first_name TEXT,
  last_name TEXT,
  date_of_birth TIMESTAMPTZ,
  age INTEGER,
  gender TEXT,
  phone TEXT,
  email TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  pincode TEXT,
  emergency_contact_name TEXT,
  emergency_contact_phone TEXT,
  blood_group TEXT,
  medical_history TEXT,
  allergies TEXT,
  insurance_provider TEXT,
  insurance_number TEXT,
  hospital_id UUID,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  has_reference TEXT,
  reference_details TEXT,
  assigned_department TEXT,
  assigned_doctor TEXT,
  current_medications TEXT,
  notes TEXT,
  assigned_doctors TEXT,
  consultation_fees NUMERIC(10,2),
  prefix TEXT,
  patient_tag TEXT,
  is_active BOOLEAN,
  date_of_entry TIMESTAMPTZ,
  ipd_status TEXT,
  ipd_bed_number TEXT
);

-- Table: patient_transactions
DROP TABLE IF EXISTS patient_transactions CASCADE;
CREATE TABLE patient_transactions (
  id UUID,
  patient_id UUID,
  admission_id UUID,
  transaction_type TEXT,
  description TEXT,
  amount NUMERIC(10,2),
  payment_mode TEXT,
  doctor_id UUID,
  department TEXT,
  status TEXT,
  transaction_reference TEXT,
  receipt_number TEXT,
  notes TEXT,
  hospital_id UUID,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  doctor_name TEXT
);

-- Table: doctors
DROP TABLE IF EXISTS doctors CASCADE;
CREATE TABLE doctors (
  id UUID,
  first_name TEXT,
  last_name TEXT,
  email TEXT,
  department_id UUID,
  is_active BOOLEAN,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  specialty TEXT,
  hospital_experience TEXT
);

-- Table: departments
DROP TABLE IF EXISTS departments CASCADE;
CREATE TABLE departments (
  id UUID,
  name TEXT,
  description TEXT,
  head_doctor_id UUID,
  hospital_id UUID,
  is_active BOOLEAN,
  created_at TIMESTAMPTZ,
  specialty TEXT,
  hospital_experience TEXT
);


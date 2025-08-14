-- COMPLETE RELATIONSHIP FIX FOR ALL MADHUBAN TABLES
-- This fixes all foreign key relationships and constraints

-- First, let's see what we currently have
SELECT 
    table_name, 
    column_name, 
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name IN ('patients', 'patient_transactions', 'doctors', 'departments', 'insurance_providers', 'admissions', 'prescriptions', 'lab_tests', 'appointments', 'bills', 'payments')
ORDER BY table_name, ordinal_position;

-- Check if we have any existing foreign keys
SELECT 
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY';

-- STEP 1: Add primary key constraints for all tables
ALTER TABLE patients ADD CONSTRAINT patients_pkey PRIMARY KEY (id) ON CONFLICT DO NOTHING;
ALTER TABLE patient_transactions ADD CONSTRAINT patient_transactions_pkey PRIMARY KEY (id) ON CONFLICT DO NOTHING;
ALTER TABLE doctors ADD CONSTRAINT doctors_pkey PRIMARY KEY (id) ON CONFLICT DO NOTHING;
ALTER TABLE departments ADD CONSTRAINT departments_pkey PRIMARY KEY (id) ON CONFLICT DO NOTHING;

-- Create empty tables if they don't exist (for proper relationships)
CREATE TABLE IF NOT EXISTS insurance_providers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    contact_info TEXT,
    coverage_details JSONB,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS admissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL,
    admission_date TIMESTAMPTZ NOT NULL,
    discharge_date TIMESTAMPTZ,
    room_number TEXT,
    admission_type TEXT,
    status TEXT DEFAULT 'ACTIVE',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS appointments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL,
    doctor_id UUID,
    appointment_date TIMESTAMPTZ NOT NULL,
    status TEXT DEFAULT 'SCHEDULED',
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS prescriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL,
    doctor_id UUID,
    prescription_date TIMESTAMPTZ NOT NULL,
    medications JSONB,
    instructions TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS lab_tests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL,
    doctor_id UUID,
    test_name TEXT NOT NULL,
    test_date TIMESTAMPTZ NOT NULL,
    results JSONB,
    status TEXT DEFAULT 'PENDING',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS bills (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL,
    admission_id UUID,
    total_amount NUMERIC(10,2) NOT NULL,
    paid_amount NUMERIC(10,2) DEFAULT 0,
    status TEXT DEFAULT 'PENDING',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL,
    bill_id UUID,
    amount NUMERIC(10,2) NOT NULL,
    payment_method TEXT,
    payment_date TIMESTAMPTZ DEFAULT now(),
    status TEXT DEFAULT 'COMPLETED',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- STEP 2: Fix data types for foreign keys to ensure UUID compatibility
-- Check if patient_transactions.patient_id matches patients.id format
SELECT 
    'patients.id samples' as type,
    id as sample_value,
    length(id::text) as length
FROM patients 
WHERE id IS NOT NULL 
LIMIT 3

UNION ALL

SELECT 
    'patient_transactions.patient_id samples' as type,
    patient_id as sample_value,
    length(patient_id::text) as length
FROM patient_transactions 
WHERE patient_id IS NOT NULL 
LIMIT 3;

-- STEP 3: Drop existing foreign key constraints if they exist (to recreate them properly)
ALTER TABLE patient_transactions DROP CONSTRAINT IF EXISTS fk_patient_transactions_patient_id;
ALTER TABLE doctors DROP CONSTRAINT IF EXISTS fk_doctors_department_id;
ALTER TABLE admissions DROP CONSTRAINT IF EXISTS fk_admissions_patient_id;
ALTER TABLE appointments DROP CONSTRAINT IF EXISTS fk_appointments_patient_id;
ALTER TABLE appointments DROP CONSTRAINT IF EXISTS fk_appointments_doctor_id;
ALTER TABLE prescriptions DROP CONSTRAINT IF EXISTS fk_prescriptions_patient_id;
ALTER TABLE prescriptions DROP CONSTRAINT IF EXISTS fk_prescriptions_doctor_id;
ALTER TABLE lab_tests DROP CONSTRAINT IF EXISTS fk_lab_tests_patient_id;
ALTER TABLE lab_tests DROP CONSTRAINT IF EXISTS fk_lab_tests_doctor_id;
ALTER TABLE bills DROP CONSTRAINT IF EXISTS fk_bills_patient_id;
ALTER TABLE bills DROP CONSTRAINT IF EXISTS fk_bills_admission_id;
ALTER TABLE payments DROP CONSTRAINT IF EXISTS fk_payments_patient_id;
ALTER TABLE payments DROP CONSTRAINT IF EXISTS fk_payments_bill_id;

-- STEP 4: Create all foreign key relationships
-- Core relationships
ALTER TABLE patient_transactions 
ADD CONSTRAINT fk_patient_transactions_patient_id 
FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE;

ALTER TABLE doctors 
ADD CONSTRAINT fk_doctors_department_id 
FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE SET NULL;

-- Admission relationships
ALTER TABLE admissions 
ADD CONSTRAINT fk_admissions_patient_id 
FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE;

-- Appointment relationships
ALTER TABLE appointments 
ADD CONSTRAINT fk_appointments_patient_id 
FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE;

ALTER TABLE appointments 
ADD CONSTRAINT fk_appointments_doctor_id 
FOREIGN KEY (doctor_id) REFERENCES doctors(id) ON DELETE SET NULL;

-- Prescription relationships
ALTER TABLE prescriptions 
ADD CONSTRAINT fk_prescriptions_patient_id 
FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE;

ALTER TABLE prescriptions 
ADD CONSTRAINT fk_prescriptions_doctor_id 
FOREIGN KEY (doctor_id) REFERENCES doctors(id) ON DELETE SET NULL;

-- Lab test relationships
ALTER TABLE lab_tests 
ADD CONSTRAINT fk_lab_tests_patient_id 
FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE;

ALTER TABLE lab_tests 
ADD CONSTRAINT fk_lab_tests_doctor_id 
FOREIGN KEY (doctor_id) REFERENCES doctors(id) ON DELETE SET NULL;

-- Billing relationships
ALTER TABLE bills 
ADD CONSTRAINT fk_bills_patient_id 
FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE;

ALTER TABLE bills 
ADD CONSTRAINT fk_bills_admission_id 
FOREIGN KEY (admission_id) REFERENCES admissions(id) ON DELETE SET NULL;

-- Payment relationships
ALTER TABLE payments 
ADD CONSTRAINT fk_payments_patient_id 
FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE;

ALTER TABLE payments 
ADD CONSTRAINT fk_payments_bill_id 
FOREIGN KEY (bill_id) REFERENCES bills(id) ON DELETE SET NULL;

-- STEP 5: Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_patient_transactions_patient_id ON patient_transactions(patient_id);
CREATE INDEX IF NOT EXISTS idx_doctors_department_id ON doctors(department_id);
CREATE INDEX IF NOT EXISTS idx_admissions_patient_id ON admissions(patient_id);
CREATE INDEX IF NOT EXISTS idx_appointments_patient_id ON appointments(patient_id);
CREATE INDEX IF NOT EXISTS idx_appointments_doctor_id ON appointments(doctor_id);
CREATE INDEX IF NOT EXISTS idx_prescriptions_patient_id ON prescriptions(patient_id);
CREATE INDEX IF NOT EXISTS idx_prescriptions_doctor_id ON prescriptions(doctor_id);
CREATE INDEX IF NOT EXISTS idx_lab_tests_patient_id ON lab_tests(patient_id);
CREATE INDEX IF NOT EXISTS idx_lab_tests_doctor_id ON lab_tests(doctor_id);
CREATE INDEX IF NOT EXISTS idx_bills_patient_id ON bills(patient_id);
CREATE INDEX IF NOT EXISTS idx_payments_patient_id ON payments(patient_id);
CREATE INDEX IF NOT EXISTS idx_payments_bill_id ON payments(bill_id);

-- STEP 6: Enable Row Level Security (RLS) if needed
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE patient_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE doctors ENABLE ROW LEVEL SECURITY;
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE insurance_providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE admissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE prescriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE lab_tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE bills ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- Create basic RLS policies for access
CREATE POLICY "Enable all access for authenticated users" ON patients FOR ALL USING (true);
CREATE POLICY "Enable all access for authenticated users" ON patient_transactions FOR ALL USING (true);
CREATE POLICY "Enable all access for authenticated users" ON doctors FOR ALL USING (true);
CREATE POLICY "Enable all access for authenticated users" ON departments FOR ALL USING (true);
CREATE POLICY "Enable all access for authenticated users" ON insurance_providers FOR ALL USING (true);
CREATE POLICY "Enable all access for authenticated users" ON admissions FOR ALL USING (true);
CREATE POLICY "Enable all access for authenticated users" ON appointments FOR ALL USING (true);
CREATE POLICY "Enable all access for authenticated users" ON prescriptions FOR ALL USING (true);
CREATE POLICY "Enable all access for authenticated users" ON lab_tests FOR ALL USING (true);
CREATE POLICY "Enable all access for authenticated users" ON bills FOR ALL USING (true);
CREATE POLICY "Enable all access for authenticated users" ON payments FOR ALL USING (true);

-- STEP 7: Verify all relationships were created successfully
SELECT 
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS references_table,
    ccu.column_name AS references_column,
    rc.delete_rule
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
JOIN information_schema.referential_constraints AS rc
    ON tc.constraint_name = rc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY' 
ORDER BY tc.table_name, kcu.column_name;

-- Show final table structure
SELECT 
    table_name,
    COUNT(*) as column_count
FROM information_schema.columns 
WHERE table_name IN ('patients', 'patient_transactions', 'doctors', 'departments', 'insurance_providers', 'admissions', 'appointments', 'prescriptions', 'lab_tests', 'bills', 'payments')
GROUP BY table_name
ORDER BY table_name;
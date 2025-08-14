-- CREATE MISSING PATIENT_ADMISSIONS TABLE AND RELATIONSHIPS
-- Based on PatientAdmission interface in supabaseNew.ts

-- Step 1: Create the patient_admissions table (matching the interface exactly)
CREATE TABLE IF NOT EXISTS patient_admissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL,
    bed_id UUID,
    admission_date TIMESTAMPTZ NOT NULL,
    expected_discharge_date TIMESTAMPTZ,
    actual_discharge_date TIMESTAMPTZ,
    admission_notes TEXT,
    discharge_notes TEXT,
    services JSONB DEFAULT '[]'::jsonb,
    total_amount NUMERIC(10,2) NOT NULL DEFAULT 0,
    amount_paid NUMERIC(10,2) DEFAULT 0,
    balance NUMERIC(10,2) DEFAULT 0,
    status TEXT DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'DISCHARGED', 'TRANSFERRED')),
    admitted_by UUID,
    discharged_by UUID,
    hospital_id UUID,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Step 2: Create the beds table (referenced by patient_admissions)
CREATE TABLE IF NOT EXISTS beds (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bed_number TEXT NOT NULL,
    room_type TEXT DEFAULT 'GENERAL' CHECK (room_type IN ('GENERAL', 'PRIVATE', 'ICU', 'EMERGENCY')),
    department_id UUID,
    daily_rate NUMERIC(10,2) NOT NULL DEFAULT 0,
    status TEXT DEFAULT 'AVAILABLE' CHECK (status IN ('AVAILABLE', 'OCCUPIED', 'MAINTENANCE', 'RESERVED')),
    hospital_id UUID,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Step 3: Add foreign key relationships
ALTER TABLE patient_admissions 
ADD CONSTRAINT fk_patient_admissions_patient_id 
FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE;

ALTER TABLE patient_admissions 
ADD CONSTRAINT fk_patient_admissions_bed_id 
FOREIGN KEY (bed_id) REFERENCES beds(id) ON DELETE SET NULL;

ALTER TABLE beds 
ADD CONSTRAINT fk_beds_department_id 
FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE SET NULL;

-- Step 4: Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_patient_admissions_patient_id ON patient_admissions(patient_id);
CREATE INDEX IF NOT EXISTS idx_patient_admissions_bed_id ON patient_admissions(bed_id);
CREATE INDEX IF NOT EXISTS idx_patient_admissions_status ON patient_admissions(status);
CREATE INDEX IF NOT EXISTS idx_patient_admissions_admission_date ON patient_admissions(admission_date);
CREATE INDEX IF NOT EXISTS idx_beds_department_id ON beds(department_id);
CREATE INDEX IF NOT EXISTS idx_beds_status ON beds(status);

-- Step 5: Enable Row Level Security
ALTER TABLE patient_admissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE beds ENABLE ROW LEVEL SECURITY;

-- Step 6: Create basic RLS policies
CREATE POLICY "Enable all access for authenticated users" ON patient_admissions FOR ALL USING (true);
CREATE POLICY "Enable all access for authenticated users" ON beds FOR ALL USING (true);

-- Step 7: Insert some sample beds to make the system functional
INSERT INTO beds (bed_number, room_type, daily_rate, status, hospital_id) VALUES
('G001', 'GENERAL', 500.00, 'AVAILABLE', '550e8400-e29b-41d4-a716-446655440000'),
('G002', 'GENERAL', 500.00, 'AVAILABLE', '550e8400-e29b-41d4-a716-446655440000'),
('P001', 'PRIVATE', 1000.00, 'AVAILABLE', '550e8400-e29b-41d4-a716-446655440000'),
('P002', 'PRIVATE', 1000.00, 'AVAILABLE', '550e8400-e29b-41d4-a716-446655440000'),
('ICU001', 'ICU', 2000.00, 'AVAILABLE', '550e8400-e29b-41d4-a716-446655440000'),
('ICU002', 'ICU', 2000.00, 'AVAILABLE', '550e8400-e29b-41d4-a716-446655440000'),
('E001', 'EMERGENCY', 800.00, 'AVAILABLE', '550e8400-e29b-41d4-a716-446655440000'),
('E002', 'EMERGENCY', 800.00, 'AVAILABLE', '550e8400-e29b-41d4-a716-446655440000')
ON CONFLICT (id) DO NOTHING;

-- Step 8: Verify the tables and relationships were created
SELECT 
    'TABLES CREATED' as info,
    table_name,
    (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as column_count
FROM information_schema.tables t
WHERE t.table_name IN ('patient_admissions', 'beds')
ORDER BY table_name;

-- Verify foreign key relationships
SELECT 
    'FOREIGN KEY RELATIONSHIPS' as info,
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS references_table,
    ccu.column_name AS references_column
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_name IN ('patient_admissions', 'beds')
ORDER BY tc.table_name;

-- Test that the relationship cache should now work
SELECT 
    'RELATIONSHIP TEST' as info,
    p.patient_id,
    p.first_name,
    p.last_name,
    COUNT(pa.id) as admissions_count,
    COUNT(pt.id) as transaction_count
FROM patients p
LEFT JOIN patient_admissions pa ON p.id = pa.patient_id
LEFT JOIN patient_transactions pt ON p.id = pt.patient_id
GROUP BY p.id, p.patient_id, p.first_name, p.last_name
LIMIT 5;
-- FIX BEDS DEPARTMENT FOREIGN KEY CONSTRAINT ERROR
-- Check what columns exist and fix the constraint

-- Step 1: Check what columns exist in departments table
SELECT 
    'DEPARTMENTS TABLE COLUMNS' as info,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'departments'
ORDER BY ordinal_position;

-- Step 2: Check if departments table has any primary key
SELECT 
    'DEPARTMENTS PRIMARY KEY' as info,
    tc.table_name,
    kcu.column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
WHERE tc.constraint_type = 'PRIMARY KEY'
  AND tc.table_name = 'departments';

-- Step 3: Create patient_admissions table without the problematic beds constraint first
DROP TABLE IF EXISTS patient_admissions CASCADE;
DROP TABLE IF EXISTS beds CASCADE;

-- Create beds table without department foreign key first
CREATE TABLE beds (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bed_number TEXT NOT NULL,
    room_type TEXT DEFAULT 'GENERAL' CHECK (room_type IN ('GENERAL', 'PRIVATE', 'ICU', 'EMERGENCY')),
    department_id UUID,  -- Keep the column but don't add constraint yet
    daily_rate NUMERIC(10,2) NOT NULL DEFAULT 0,
    status TEXT DEFAULT 'AVAILABLE' CHECK (status IN ('AVAILABLE', 'OCCUPIED', 'MAINTENANCE', 'RESERVED')),
    hospital_id UUID,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create patient_admissions table
CREATE TABLE patient_admissions (
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

-- Step 4: Add the safe foreign key relationships
ALTER TABLE patient_admissions 
ADD CONSTRAINT fk_patient_admissions_patient_id 
FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE;

ALTER TABLE patient_admissions 
ADD CONSTRAINT fk_patient_admissions_bed_id 
FOREIGN KEY (bed_id) REFERENCES beds(id) ON DELETE SET NULL;

-- Step 5: Try to add beds department constraint only if departments has proper primary key
DO $$
BEGIN
    -- Check if departments table has id column and it's a primary key
    IF EXISTS (
        SELECT 1 
        FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
        WHERE tc.table_name = 'departments' 
        AND tc.constraint_type = 'PRIMARY KEY' 
        AND kcu.column_name = 'id'
    ) THEN
        -- Add the foreign key constraint
        ALTER TABLE beds 
        ADD CONSTRAINT fk_beds_department_id 
        FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE SET NULL;
        
        RAISE NOTICE 'Added beds -> departments foreign key constraint';
    ELSE
        RAISE NOTICE 'Skipped beds -> departments constraint (departments.id primary key not found)';
    END IF;
END $$;

-- Step 6: Create indexes
CREATE INDEX IF NOT EXISTS idx_patient_admissions_patient_id ON patient_admissions(patient_id);
CREATE INDEX IF NOT EXISTS idx_patient_admissions_bed_id ON patient_admissions(bed_id);
CREATE INDEX IF NOT EXISTS idx_patient_admissions_status ON patient_admissions(status);
CREATE INDEX IF NOT EXISTS idx_patient_admissions_admission_date ON patient_admissions(admission_date);
CREATE INDEX IF NOT EXISTS idx_beds_department_id ON beds(department_id);
CREATE INDEX IF NOT EXISTS idx_beds_status ON beds(status);

-- Step 7: Enable Row Level Security
ALTER TABLE patient_admissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE beds ENABLE ROW LEVEL SECURITY;

-- Step 8: Create RLS policies
CREATE POLICY "Enable all access for authenticated users" ON patient_admissions FOR ALL USING (true);
CREATE POLICY "Enable all access for authenticated users" ON beds FOR ALL USING (true);

-- Step 9: Insert sample beds
INSERT INTO beds (bed_number, room_type, daily_rate, status, hospital_id, department_id) VALUES
('G001', 'GENERAL', 500.00, 'AVAILABLE', '550e8400-e29b-41d4-a716-446655440000', NULL),
('G002', 'GENERAL', 500.00, 'AVAILABLE', '550e8400-e29b-41d4-a716-446655440000', NULL),
('P001', 'PRIVATE', 1000.00, 'AVAILABLE', '550e8400-e29b-41d4-a716-446655440000', NULL),
('P002', 'PRIVATE', 1000.00, 'AVAILABLE', '550e8400-e29b-41d4-a716-446655440000', NULL),
('ICU001', 'ICU', 2000.00, 'AVAILABLE', '550e8400-e29b-41d4-a716-446655440000', NULL),
('ICU002', 'ICU', 2000.00, 'AVAILABLE', '550e8400-e29b-41d4-a716-446655440000', NULL),
('E001', 'EMERGENCY', 800.00, 'AVAILABLE', '550e8400-e29b-41d4-a716-446655440000', NULL),
('E002', 'EMERGENCY', 800.00, 'AVAILABLE', '550e8400-e29b-41d4-a716-446655440000', NULL)
ON CONFLICT (id) DO NOTHING;

-- Step 10: Verify everything was created successfully
SELECT 
    'TABLES VERIFICATION' as info,
    table_name,
    (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as column_count
FROM information_schema.tables t
WHERE t.table_name IN ('patient_admissions', 'beds', 'patients', 'departments')
AND t.table_schema = 'public'
ORDER BY table_name;

-- Verify foreign key relationships
SELECT 
    'FOREIGN KEY VERIFICATION' as info,
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

-- Test the patient_admissions relationship
SELECT 
    'RELATIONSHIP TEST' as info,
    COUNT(*) as patient_count,
    COUNT(DISTINCT p.id) as unique_patients
FROM patients p
WHERE p.id IS NOT NULL
LIMIT 1;
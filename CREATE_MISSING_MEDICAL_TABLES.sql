-- CREATE MISSING MEDICAL TABLES TO FIX 406 ERRORS
-- These are the 3 missing tables causing the 406 errors in your Complete Patient Record

-- ============================================================================
-- 1. MEDICAL CONSENT DATA TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS medical_consent_data (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    patient_id TEXT NOT NULL,
    consent_type TEXT NOT NULL,
    consent_data JSONB DEFAULT '{}',
    submitted_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- 2. MEDICAL MEDICATION DATA TABLE  
-- ============================================================================
CREATE TABLE IF NOT EXISTS medical_medication_data (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    patient_id TEXT NOT NULL,
    medication_name TEXT NOT NULL,
    dosage TEXT,
    frequency TEXT,
    prescribed_by TEXT,
    start_date DATE,
    end_date DATE,
    notes TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- 3. MEDICAL VITAL SIGNS DATA TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS medical_vital_signs_data (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    patient_id TEXT NOT NULL,
    blood_pressure TEXT,
    heart_rate INTEGER,
    temperature DECIMAL(4,2),
    oxygen_saturation INTEGER,
    respiratory_rate INTEGER,
    weight DECIMAL(5,2),
    height DECIMAL(5,2),
    recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    recorded_by TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- CREATE INDEXES FOR PERFORMANCE
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_medical_consent_data_patient_id ON medical_consent_data(patient_id);
CREATE INDEX IF NOT EXISTS idx_medical_medication_data_patient_id ON medical_medication_data(patient_id);
CREATE INDEX IF NOT EXISTS idx_medical_vital_signs_data_patient_id ON medical_vital_signs_data(patient_id);

-- ============================================================================
-- ENABLE ROW LEVEL SECURITY
-- ============================================================================
ALTER TABLE medical_consent_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE medical_medication_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE medical_vital_signs_data ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- CREATE RLS POLICIES FOR AUTHENTICATED USERS
-- ============================================================================
CREATE POLICY IF NOT EXISTS "Allow authenticated users to manage consent data" ON medical_consent_data
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY IF NOT EXISTS "Allow authenticated users to manage medication data" ON medical_medication_data
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY IF NOT EXISTS "Allow authenticated users to manage vital signs data" ON medical_vital_signs_data
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ============================================================================
-- CREATE UPDATED_AT TRIGGERS
-- ============================================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER IF NOT EXISTS update_medical_consent_data_updated_at 
    BEFORE UPDATE ON medical_consent_data 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER IF NOT EXISTS update_medical_medication_data_updated_at 
    BEFORE UPDATE ON medical_medication_data 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER IF NOT EXISTS update_medical_vital_signs_data_updated_at 
    BEFORE UPDATE ON medical_vital_signs_data 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- VERIFICATION
-- ============================================================================
SELECT 'Missing medical tables created successfully!' as status;

SELECT table_name, table_type 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN (
    'medical_consent_data',
    'medical_medication_data', 
    'medical_vital_signs_data'
  )
ORDER BY table_name;
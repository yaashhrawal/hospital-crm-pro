-- CREATE STANDALONE PATIENT RECORD TABLES
-- These tables match exactly what completePatientRecordService.ts expects
-- Run this script to fix the database integration issue

-- ============================================================================
-- 1. PATIENT HIGH RISK TABLE (singular name)
-- ============================================================================
CREATE TABLE IF NOT EXISTS patient_high_risk (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    risk_factors TEXT[], -- Array of risk factors
    allergy_drug TEXT,
    allergy_food TEXT,
    current_medications TEXT,
    surgical_history TEXT,
    family_history TEXT,
    social_history TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- 2. PATIENT CHIEF COMPLAINTS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS patient_chief_complaints (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    complaint TEXT NOT NULL,
    duration TEXT,
    period TEXT,
    severity TEXT,
    associated_symptoms TEXT,
    performing_doctor TEXT,
    complaint_date DATE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- 3. PATIENT EXAMINATION TABLE (singular name)
-- ============================================================================
CREATE TABLE IF NOT EXISTS patient_examination (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    general_appearance TEXT,
    vital_signs TEXT,
    systemic_examination TEXT,
    local_examination TEXT,
    neurological_examination TEXT,
    cardiovascular_examination TEXT,
    respiratory_examination TEXT,
    abdominal_examination TEXT,
    musculoskeletal_examination TEXT,
    examination_date DATE,
    examined_by TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- 4. PATIENT INVESTIGATION TABLE (singular name)
-- ============================================================================
CREATE TABLE IF NOT EXISTS patient_investigation (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    laboratory_tests TEXT,
    imaging_studies TEXT,
    special_tests TEXT,
    biopsy_results TEXT,
    pathology_reports TEXT,
    investigation_date DATE,
    requested_by TEXT,
    results TEXT,
    interpretation TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- 5. PATIENT DIAGNOSIS TABLE (singular name)
-- ============================================================================
CREATE TABLE IF NOT EXISTS patient_diagnosis (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    primary_diagnosis TEXT NOT NULL,
    secondary_diagnosis TEXT,
    differential_diagnosis TEXT,
    icd_codes TEXT,
    diagnosis_date DATE,
    diagnosed_by TEXT,
    confidence_level TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- 6. PATIENT ENHANCED PRESCRIPTION TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS patient_enhanced_prescription (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    medications JSONB NOT NULL DEFAULT '[]', -- Array of medication objects
    dosage_instructions TEXT,
    duration TEXT,
    special_instructions TEXT,
    follow_up_date DATE,
    prescribed_by TEXT,
    prescription_date DATE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- 7. PATIENT RECORD SUMMARY TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS patient_record_summary (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    record_date DATE,
    summary TEXT,
    created_by TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- 8. CUSTOM COMPLAINTS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS custom_complaints (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    complaint_text TEXT NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- 9. CUSTOM DOCTORS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS custom_doctors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    doctor_name TEXT NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- CREATE INDEXES FOR BETTER PERFORMANCE
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_patient_high_risk_patient_id ON patient_high_risk(patient_id);
CREATE INDEX IF NOT EXISTS idx_patient_chief_complaints_patient_id ON patient_chief_complaints(patient_id);
CREATE INDEX IF NOT EXISTS idx_patient_examination_patient_id ON patient_examination(patient_id);
CREATE INDEX IF NOT EXISTS idx_patient_investigation_patient_id ON patient_investigation(patient_id);
CREATE INDEX IF NOT EXISTS idx_patient_diagnosis_patient_id ON patient_diagnosis(patient_id);
CREATE INDEX IF NOT EXISTS idx_patient_enhanced_prescription_patient_id ON patient_enhanced_prescription(patient_id);
CREATE INDEX IF NOT EXISTS idx_patient_record_summary_patient_id ON patient_record_summary(patient_id);

CREATE INDEX IF NOT EXISTS idx_patient_chief_complaints_date ON patient_chief_complaints(complaint_date);
CREATE INDEX IF NOT EXISTS idx_patient_examination_date ON patient_examination(examination_date);
CREATE INDEX IF NOT EXISTS idx_patient_investigation_date ON patient_investigation(investigation_date);
CREATE INDEX IF NOT EXISTS idx_patient_diagnosis_date ON patient_diagnosis(diagnosis_date);
CREATE INDEX IF NOT EXISTS idx_patient_prescription_date ON patient_enhanced_prescription(prescription_date);

-- ============================================================================
-- ENABLE ROW LEVEL SECURITY (RLS) ON ALL TABLES
-- ============================================================================
ALTER TABLE patient_high_risk ENABLE ROW LEVEL SECURITY;
ALTER TABLE patient_chief_complaints ENABLE ROW LEVEL SECURITY;
ALTER TABLE patient_examination ENABLE ROW LEVEL SECURITY;
ALTER TABLE patient_investigation ENABLE ROW LEVEL SECURITY;
ALTER TABLE patient_diagnosis ENABLE ROW LEVEL SECURITY;
ALTER TABLE patient_enhanced_prescription ENABLE ROW LEVEL SECURITY;
ALTER TABLE patient_record_summary ENABLE ROW LEVEL SECURITY;
ALTER TABLE custom_complaints ENABLE ROW LEVEL SECURITY;
ALTER TABLE custom_doctors ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- CREATE RLS POLICIES FOR AUTHENTICATED USERS
-- ============================================================================

-- Patient High Risk
CREATE POLICY IF NOT EXISTS "Allow authenticated users to manage patient high risk" ON patient_high_risk
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Patient Chief Complaints
CREATE POLICY IF NOT EXISTS "Allow authenticated users to manage chief complaints" ON patient_chief_complaints
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Patient Examination
CREATE POLICY IF NOT EXISTS "Allow authenticated users to manage examinations" ON patient_examination
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Patient Investigation
CREATE POLICY IF NOT EXISTS "Allow authenticated users to manage investigations" ON patient_investigation
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Patient Diagnosis
CREATE POLICY IF NOT EXISTS "Allow authenticated users to manage diagnoses" ON patient_diagnosis
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Patient Enhanced Prescription
CREATE POLICY IF NOT EXISTS "Allow authenticated users to manage prescriptions" ON patient_enhanced_prescription
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Patient Record Summary
CREATE POLICY IF NOT EXISTS "Allow authenticated users to manage record summaries" ON patient_record_summary
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Custom Complaints
CREATE POLICY IF NOT EXISTS "Allow authenticated users to manage custom complaints" ON custom_complaints
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Custom Doctors
CREATE POLICY IF NOT EXISTS "Allow authenticated users to manage custom doctors" ON custom_doctors
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ============================================================================
-- CREATE UPDATED_AT TRIGGERS
-- ============================================================================

-- Create or replace the update function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add triggers for updated_at columns
CREATE TRIGGER IF NOT EXISTS update_patient_high_risk_updated_at 
    BEFORE UPDATE ON patient_high_risk 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER IF NOT EXISTS update_patient_chief_complaints_updated_at 
    BEFORE UPDATE ON patient_chief_complaints 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER IF NOT EXISTS update_patient_examination_updated_at 
    BEFORE UPDATE ON patient_examination 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER IF NOT EXISTS update_patient_investigation_updated_at 
    BEFORE UPDATE ON patient_investigation 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER IF NOT EXISTS update_patient_diagnosis_updated_at 
    BEFORE UPDATE ON patient_diagnosis 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER IF NOT EXISTS update_patient_enhanced_prescription_updated_at 
    BEFORE UPDATE ON patient_enhanced_prescription 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER IF NOT EXISTS update_patient_record_summary_updated_at 
    BEFORE UPDATE ON patient_record_summary 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================
SELECT 'All Complete Patient Record tables created successfully!' as status;

SELECT table_name, table_type 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN (
    'patient_high_risk',
    'patient_chief_complaints', 
    'patient_examination',
    'patient_investigation',
    'patient_diagnosis',
    'patient_enhanced_prescription',
    'patient_record_summary',
    'custom_complaints',
    'custom_doctors'
  )
ORDER BY table_name;
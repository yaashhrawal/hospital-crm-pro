-- COMPLETE PATIENT MEDICAL RECORDS SCHEMA FOR SUPABASE
-- Production-ready schema with proper indexing, triggers, RLS policies, and views
-- This schema is designed to work with the existing hospital CRM system

-- ============================================================================
-- 1. MAIN PATIENT MEDICAL RECORDS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS patient_medical_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    visit_id UUID, -- Can link to patient_visits table if exists
    record_date DATE NOT NULL DEFAULT CURRENT_DATE,
    record_time TIME NOT NULL DEFAULT CURRENT_TIME,
    
    -- Doctor and Department Information
    attending_doctor_id UUID REFERENCES doctors(id),
    department VARCHAR(100) NOT NULL,
    visit_type VARCHAR(50) NOT NULL DEFAULT 'OPD' 
        CHECK (visit_type IN ('OPD', 'IPD', 'Emergency', 'Follow-up', 'Consultation')),
    
    -- Vital Signs (stored as structured data for better querying)
    temperature DECIMAL(4,2), -- in Celsius
    blood_pressure_systolic INTEGER CHECK (blood_pressure_systolic BETWEEN 50 AND 300),
    blood_pressure_diastolic INTEGER CHECK (blood_pressure_diastolic BETWEEN 30 AND 200),
    heart_rate INTEGER CHECK (heart_rate BETWEEN 30 AND 250),
    respiratory_rate INTEGER CHECK (respiratory_rate BETWEEN 8 AND 60),
    oxygen_saturation DECIMAL(5,2) CHECK (oxygen_saturation BETWEEN 0 AND 100),
    weight DECIMAL(5,2), -- in kg
    height DECIMAL(5,2), -- in cm
    bmi DECIMAL(5,2) GENERATED ALWAYS AS (
        CASE 
            WHEN height > 0 AND weight > 0 
            THEN ROUND((weight / POWER(height/100, 2))::NUMERIC, 2)
            ELSE NULL 
        END
    ) STORED,
    
    -- Pain Assessment
    pain_scale INTEGER CHECK (pain_scale BETWEEN 0 AND 10),
    
    -- Record Status and Metadata
    record_status VARCHAR(20) NOT NULL DEFAULT 'active' 
        CHECK (record_status IN ('active', 'amended', 'cancelled', 'archived')),
    is_confidential BOOLEAN DEFAULT FALSE,
    
    -- Timestamps and Audit
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id),
    
    -- Constraints
    CONSTRAINT valid_bp_combination CHECK (
        (blood_pressure_systolic IS NULL AND blood_pressure_diastolic IS NULL) OR
        (blood_pressure_systolic IS NOT NULL AND blood_pressure_diastolic IS NOT NULL)
    )
);

-- ============================================================================
-- 2. PATIENT HIGH RISKS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS patient_high_risks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    medical_record_id UUID NOT NULL REFERENCES patient_medical_records(id) ON DELETE CASCADE,
    
    -- Risk Categories
    risk_type VARCHAR(50) NOT NULL CHECK (risk_type IN (
        'Allergy', 'Drug_Interaction', 'Fall_Risk', 'Bleeding_Risk', 'Infection_Risk',
        'Cardiac_Risk', 'Respiratory_Risk', 'Diabetes_Risk', 'Hypertension_Risk',
        'Mental_Health_Risk', 'Other'
    )),
    risk_level VARCHAR(20) NOT NULL DEFAULT 'Medium' 
        CHECK (risk_level IN ('Low', 'Medium', 'High', 'Critical')),
    
    -- Risk Details
    risk_description TEXT NOT NULL,
    risk_factors TEXT[], -- Array of contributing factors
    preventive_measures TEXT,
    
    -- Status and Monitoring
    is_active BOOLEAN DEFAULT TRUE,
    first_identified_date DATE NOT NULL DEFAULT CURRENT_DATE,
    last_assessed_date DATE DEFAULT CURRENT_DATE,
    next_review_date DATE,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES users(id)
);

-- ============================================================================
-- 3. PATIENT CHIEF COMPLAINTS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS patient_chief_complaints (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    medical_record_id UUID NOT NULL REFERENCES patient_medical_records(id) ON DELETE CASCADE,
    
    -- Complaint Details
    complaint_text TEXT NOT NULL,
    complaint_category VARCHAR(100), -- e.g., 'Respiratory', 'Cardiovascular', etc.
    severity_level INTEGER CHECK (severity_level BETWEEN 1 AND 10),
    duration_value INTEGER CHECK (duration_value > 0),
    duration_unit VARCHAR(20) CHECK (duration_unit IN ('minutes', 'hours', 'days', 'weeks', 'months', 'years')),
    
    -- Associated Symptoms
    associated_symptoms TEXT[],
    aggravating_factors TEXT[],
    relieving_factors TEXT[],
    
    -- Location and Quality
    location_description TEXT,
    pain_quality VARCHAR(50), -- e.g., 'Sharp', 'Dull', 'Burning', 'Cramping'
    
    -- Sequence and Priority
    complaint_sequence INTEGER DEFAULT 1, -- 1 for primary, 2+ for secondary
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- 4. PATIENT EXAMINATIONS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS patient_examinations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    medical_record_id UUID NOT NULL REFERENCES patient_medical_records(id) ON DELETE CASCADE,
    
    -- Examination Type and System
    examination_type VARCHAR(50) NOT NULL CHECK (examination_type IN (
        'General', 'Cardiovascular', 'Respiratory', 'Abdominal', 'Neurological',
        'Musculoskeletal', 'Dermatological', 'ENT', 'Ophthalmological', 'Psychiatric'
    )),
    
    -- Physical Examination Findings
    general_appearance TEXT,
    consciousness_level VARCHAR(50) DEFAULT 'Alert and Oriented',
    examination_findings JSONB, -- Flexible structure for different examination types
    normal_abnormal VARCHAR(20) CHECK (normal_abnormal IN ('Normal', 'Abnormal', 'Not_Examined')),
    
    -- Specific System Findings (commonly used fields)
    cardiovascular_findings TEXT,
    respiratory_findings TEXT,
    abdominal_findings TEXT,
    neurological_findings TEXT,
    
    -- Clinical Notes
    clinical_impression TEXT,
    examination_notes TEXT,
    
    -- Examination Metadata
    examined_by UUID REFERENCES users(id),
    examination_date DATE DEFAULT CURRENT_DATE,
    examination_time TIME DEFAULT CURRENT_TIME,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- 5. PATIENT INVESTIGATIONS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS patient_investigations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    medical_record_id UUID NOT NULL REFERENCES patient_medical_records(id) ON DELETE CASCADE,
    
    -- Investigation Details
    investigation_type VARCHAR(50) NOT NULL CHECK (investigation_type IN (
        'Laboratory', 'Radiology', 'Cardiology', 'Pathology', 'Endoscopy', 'Other'
    )),
    investigation_name VARCHAR(200) NOT NULL,
    investigation_code VARCHAR(50), -- Standard medical codes (CPT, LOINC, etc.)
    
    -- Request Information
    request_date DATE NOT NULL DEFAULT CURRENT_DATE,
    requested_by UUID REFERENCES users(id),
    clinical_indication TEXT NOT NULL,
    urgency_level VARCHAR(20) DEFAULT 'Routine' 
        CHECK (urgency_level IN ('Stat', 'Urgent', 'Routine')),
    
    -- Results Information
    result_date DATE,
    result_value TEXT,
    result_unit VARCHAR(50),
    reference_range TEXT,
    result_status VARCHAR(20) DEFAULT 'Pending' 
        CHECK (result_status IN ('Pending', 'Resulted', 'Amended', 'Cancelled')),
    result_interpretation VARCHAR(50) 
        CHECK (result_interpretation IN ('Normal', 'Abnormal', 'Critical', 'Indeterminate')),
    
    -- Result Details
    result_comment TEXT,
    result_attachments TEXT[], -- File paths or URLs to result documents
    
    -- Quality Control
    performed_by VARCHAR(200), -- Lab technician or facility name
    verified_by UUID REFERENCES users(id), -- Doctor who verified results
    
    -- Cost Information
    estimated_cost DECIMAL(10,2),
    actual_cost DECIMAL(10,2),
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- 6. PATIENT DIAGNOSES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS patient_diagnoses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    medical_record_id UUID NOT NULL REFERENCES patient_medical_records(id) ON DELETE CASCADE,
    
    -- Diagnosis Information
    diagnosis_type VARCHAR(20) NOT NULL DEFAULT 'Primary' 
        CHECK (diagnosis_type IN ('Primary', 'Secondary', 'Differential', 'Provisional', 'Final')),
    diagnosis_description TEXT NOT NULL,
    
    -- Medical Coding
    icd_10_code VARCHAR(20), -- ICD-10 diagnosis codes
    icd_10_description TEXT,
    snomed_code VARCHAR(50), -- SNOMED CT codes if available
    
    -- Clinical Context
    diagnosis_certainty VARCHAR(20) DEFAULT 'Confirmed' 
        CHECK (diagnosis_certainty IN ('Suspected', 'Probable', 'Confirmed', 'Rule_Out')),
    onset_date DATE,
    severity VARCHAR(20) CHECK (severity IN ('Mild', 'Moderate', 'Severe', 'Life_Threatening')),
    
    -- Status and Management
    diagnosis_status VARCHAR(20) DEFAULT 'Active' 
        CHECK (diagnosis_status IN ('Active', 'Resolved', 'Chronic', 'In_Remission', 'Recurrent')),
    
    -- Clinical Decision Support
    diagnosis_sequence INTEGER DEFAULT 1, -- 1 for primary diagnosis
    is_chronic BOOLEAN DEFAULT FALSE,
    requires_followup BOOLEAN DEFAULT FALSE,
    followup_interval_days INTEGER,
    
    -- Provider Information
    diagnosed_by UUID REFERENCES users(id),
    diagnosis_date DATE DEFAULT CURRENT_DATE,
    
    -- Additional Notes
    clinical_notes TEXT,
    treatment_plan TEXT,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- 7. PATIENT PRESCRIPTIONS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS patient_prescriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    medical_record_id UUID NOT NULL REFERENCES patient_medical_records(id) ON DELETE CASCADE,
    
    -- Medication Information
    medication_name VARCHAR(200) NOT NULL,
    generic_name VARCHAR(200),
    brand_name VARCHAR(200),
    drug_code VARCHAR(50), -- NDC or other standard drug codes
    
    -- Prescription Details
    strength VARCHAR(50), -- e.g., '500mg', '5ml'
    dosage_form VARCHAR(50) CHECK (dosage_form IN (
        'Tablet', 'Capsule', 'Syrup', 'Injection', 'Cream', 'Ointment', 
        'Drops', 'Inhaler', 'Patch', 'Suppository', 'Other'
    )),
    
    -- Dosage Instructions
    dosage_amount VARCHAR(50), -- e.g., '1 tablet', '5ml'
    frequency VARCHAR(100), -- e.g., 'Once daily', 'Twice daily', 'Every 6 hours'
    route VARCHAR(50) DEFAULT 'Oral' CHECK (route IN (
        'Oral', 'IV', 'IM', 'Subcutaneous', 'Topical', 'Inhalation', 
        'Rectal', 'Vaginal', 'Sublingual', 'Other'
    )),
    
    -- Duration and Quantity
    duration_days INTEGER CHECK (duration_days > 0),
    quantity_prescribed INTEGER CHECK (quantity_prescribed > 0),
    quantity_unit VARCHAR(50) DEFAULT 'Units',
    refills_allowed INTEGER DEFAULT 0 CHECK (refills_allowed >= 0),
    
    -- Clinical Information
    indication TEXT, -- Why this medication was prescribed
    special_instructions TEXT,
    precautions TEXT,
    side_effects_warning TEXT,
    
    -- Prescription Status
    prescription_status VARCHAR(20) DEFAULT 'Active' 
        CHECK (prescription_status IN ('Active', 'Completed', 'Discontinued', 'On_Hold')),
    
    -- Dates
    start_date DATE DEFAULT CURRENT_DATE,
    end_date DATE,
    prescribed_date DATE DEFAULT CURRENT_DATE,
    
    -- Provider Information
    prescribed_by UUID REFERENCES users(id),
    pharmacy_instructions TEXT,
    
    -- Drug Interaction and Safety
    is_controlled_substance BOOLEAN DEFAULT FALSE,
    requires_monitoring BOOLEAN DEFAULT FALSE,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- INDEXES FOR PERFORMANCE OPTIMIZATION
-- ============================================================================

-- Patient Medical Records Indexes
CREATE INDEX IF NOT EXISTS idx_patient_medical_records_patient_id 
    ON patient_medical_records(patient_id);
CREATE INDEX IF NOT EXISTS idx_patient_medical_records_date 
    ON patient_medical_records(record_date);
CREATE INDEX IF NOT EXISTS idx_patient_medical_records_doctor 
    ON patient_medical_records(attending_doctor_id);
CREATE INDEX IF NOT EXISTS idx_patient_medical_records_department 
    ON patient_medical_records(department);
CREATE INDEX IF NOT EXISTS idx_patient_medical_records_visit_type 
    ON patient_medical_records(visit_type);
CREATE INDEX IF NOT EXISTS idx_patient_medical_records_status 
    ON patient_medical_records(record_status);

-- High Risks Indexes
CREATE INDEX IF NOT EXISTS idx_patient_high_risks_record_id 
    ON patient_high_risks(medical_record_id);
CREATE INDEX IF NOT EXISTS idx_patient_high_risks_type 
    ON patient_high_risks(risk_type);
CREATE INDEX IF NOT EXISTS idx_patient_high_risks_level 
    ON patient_high_risks(risk_level);
CREATE INDEX IF NOT EXISTS idx_patient_high_risks_active 
    ON patient_high_risks(is_active);

-- Chief Complaints Indexes
CREATE INDEX IF NOT EXISTS idx_patient_chief_complaints_record_id 
    ON patient_chief_complaints(medical_record_id);
CREATE INDEX IF NOT EXISTS idx_patient_chief_complaints_category 
    ON patient_chief_complaints(complaint_category);
CREATE INDEX IF NOT EXISTS idx_patient_chief_complaints_severity 
    ON patient_chief_complaints(severity_level);

-- Examinations Indexes
CREATE INDEX IF NOT EXISTS idx_patient_examinations_record_id 
    ON patient_examinations(medical_record_id);
CREATE INDEX IF NOT EXISTS idx_patient_examinations_type 
    ON patient_examinations(examination_type);
CREATE INDEX IF NOT EXISTS idx_patient_examinations_date 
    ON patient_examinations(examination_date);

-- Investigations Indexes
CREATE INDEX IF NOT EXISTS idx_patient_investigations_record_id 
    ON patient_investigations(medical_record_id);
CREATE INDEX IF NOT EXISTS idx_patient_investigations_type 
    ON patient_investigations(investigation_type);
CREATE INDEX IF NOT EXISTS idx_patient_investigations_status 
    ON patient_investigations(result_status);
CREATE INDEX IF NOT EXISTS idx_patient_investigations_request_date 
    ON patient_investigations(request_date);
CREATE INDEX IF NOT EXISTS idx_patient_investigations_result_date 
    ON patient_investigations(result_date);

-- Diagnoses Indexes
CREATE INDEX IF NOT EXISTS idx_patient_diagnoses_record_id 
    ON patient_diagnoses(medical_record_id);
CREATE INDEX IF NOT EXISTS idx_patient_diagnoses_type 
    ON patient_diagnoses(diagnosis_type);
CREATE INDEX IF NOT EXISTS idx_patient_diagnoses_icd10 
    ON patient_diagnoses(icd_10_code);
CREATE INDEX IF NOT EXISTS idx_patient_diagnoses_status 
    ON patient_diagnoses(diagnosis_status);

-- Prescriptions Indexes
CREATE INDEX IF NOT EXISTS idx_patient_prescriptions_record_id 
    ON patient_prescriptions(medical_record_id);
CREATE INDEX IF NOT EXISTS idx_patient_prescriptions_medication 
    ON patient_prescriptions(medication_name);
CREATE INDEX IF NOT EXISTS idx_patient_prescriptions_status 
    ON patient_prescriptions(prescription_status);
CREATE INDEX IF NOT EXISTS idx_patient_prescriptions_prescribed_by 
    ON patient_prescriptions(prescribed_by);
CREATE INDEX IF NOT EXISTS idx_patient_prescriptions_dates 
    ON patient_prescriptions(start_date, end_date);

-- Composite Indexes for Common Query Patterns
CREATE INDEX IF NOT EXISTS idx_medical_records_patient_date 
    ON patient_medical_records(patient_id, record_date DESC);
CREATE INDEX IF NOT EXISTS idx_investigations_patient_status 
    ON patient_investigations(medical_record_id, result_status);
CREATE INDEX IF NOT EXISTS idx_prescriptions_active_by_patient 
    ON patient_prescriptions(medical_record_id, prescription_status) 
    WHERE prescription_status = 'Active';

-- ============================================================================
-- TRIGGERS FOR AUTOMATION
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE 'plpgsql';

-- Apply updated_at triggers to all tables
CREATE TRIGGER update_medical_records_updated_at 
    BEFORE UPDATE ON patient_medical_records 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_high_risks_updated_at 
    BEFORE UPDATE ON patient_high_risks 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_chief_complaints_updated_at 
    BEFORE UPDATE ON patient_chief_complaints 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_examinations_updated_at 
    BEFORE UPDATE ON patient_examinations 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_investigations_updated_at 
    BEFORE UPDATE ON patient_investigations 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_diagnoses_updated_at 
    BEFORE UPDATE ON patient_diagnoses 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_prescriptions_updated_at 
    BEFORE UPDATE ON patient_prescriptions 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to validate prescription dates
CREATE OR REPLACE FUNCTION validate_prescription_dates()
RETURNS TRIGGER AS $$
BEGIN
    -- Ensure start_date is not in the future
    IF NEW.start_date > CURRENT_DATE THEN
        RAISE EXCEPTION 'Start date cannot be in the future';
    END IF;
    
    -- Ensure end_date is after start_date if provided
    IF NEW.end_date IS NOT NULL AND NEW.end_date <= NEW.start_date THEN
        RAISE EXCEPTION 'End date must be after start date';
    END IF;
    
    -- Calculate end_date if duration_days is provided but end_date is not
    IF NEW.duration_days IS NOT NULL AND NEW.end_date IS NULL THEN
        NEW.end_date = NEW.start_date + NEW.duration_days;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE 'plpgsql';

CREATE TRIGGER validate_prescription_dates_trigger 
    BEFORE INSERT OR UPDATE ON patient_prescriptions 
    FOR EACH ROW EXECUTE FUNCTION validate_prescription_dates();

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE patient_medical_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE patient_high_risks ENABLE ROW LEVEL SECURITY;
ALTER TABLE patient_chief_complaints ENABLE ROW LEVEL SECURITY;
ALTER TABLE patient_examinations ENABLE ROW LEVEL SECURITY;
ALTER TABLE patient_investigations ENABLE ROW LEVEL SECURITY;
ALTER TABLE patient_diagnoses ENABLE ROW LEVEL SECURITY;
ALTER TABLE patient_prescriptions ENABLE ROW LEVEL SECURITY;

-- Medical Records Policies
CREATE POLICY "Authenticated users can read medical records" 
    ON patient_medical_records FOR SELECT 
    USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert medical records" 
    ON patient_medical_records FOR INSERT 
    WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update medical records" 
    ON patient_medical_records FOR UPDATE 
    USING (auth.role() = 'authenticated');

-- High Risks Policies
CREATE POLICY "Authenticated users can manage high risks" 
    ON patient_high_risks FOR ALL 
    USING (auth.role() = 'authenticated') 
    WITH CHECK (auth.role() = 'authenticated');

-- Chief Complaints Policies
CREATE POLICY "Authenticated users can manage chief complaints" 
    ON patient_chief_complaints FOR ALL 
    USING (auth.role() = 'authenticated') 
    WITH CHECK (auth.role() = 'authenticated');

-- Examinations Policies
CREATE POLICY "Authenticated users can manage examinations" 
    ON patient_examinations FOR ALL 
    USING (auth.role() = 'authenticated') 
    WITH CHECK (auth.role() = 'authenticated');

-- Investigations Policies
CREATE POLICY "Authenticated users can manage investigations" 
    ON patient_investigations FOR ALL 
    USING (auth.role() = 'authenticated') 
    WITH CHECK (auth.role() = 'authenticated');

-- Diagnoses Policies
CREATE POLICY "Authenticated users can manage diagnoses" 
    ON patient_diagnoses FOR ALL 
    USING (auth.role() = 'authenticated') 
    WITH CHECK (auth.role() = 'authenticated');

-- Prescriptions Policies
CREATE POLICY "Authenticated users can manage prescriptions" 
    ON patient_prescriptions FOR ALL 
    USING (auth.role() = 'authenticated') 
    WITH CHECK (auth.role() = 'authenticated');

-- ============================================================================
-- USEFUL VIEWS FOR REPORTING AND QUERIES
-- ============================================================================

-- Complete Patient Record View (combines all related data)
CREATE OR REPLACE VIEW patient_complete_records AS
SELECT 
    pmr.id as record_id,
    pmr.patient_id,
    p.first_name || ' ' || p.last_name as patient_name,
    pmr.record_date,
    pmr.visit_type,
    pmr.department,
    d.name as attending_doctor,
    
    -- Vital Signs
    pmr.temperature,
    pmr.blood_pressure_systolic || '/' || pmr.blood_pressure_diastolic as blood_pressure,
    pmr.heart_rate,
    pmr.weight,
    pmr.height,
    pmr.bmi,
    
    -- Aggregated Data
    COALESCE(
        (SELECT array_agg(complaint_text ORDER BY complaint_sequence) 
         FROM patient_chief_complaints pcc WHERE pcc.medical_record_id = pmr.id), 
        '{}'
    ) as chief_complaints,
    
    COALESCE(
        (SELECT array_agg(diagnosis_description ORDER BY diagnosis_sequence) 
         FROM patient_diagnoses pd WHERE pd.medical_record_id = pmr.id), 
        '{}'
    ) as diagnoses,
    
    COALESCE(
        (SELECT array_agg(medication_name || ' - ' || dosage_amount || ' ' || frequency) 
         FROM patient_prescriptions pp WHERE pp.medical_record_id = pmr.id), 
        '{}'
    ) as prescriptions,
    
    pmr.created_at
FROM patient_medical_records pmr
LEFT JOIN patients p ON pmr.patient_id = p.id
LEFT JOIN doctors d ON pmr.attending_doctor_id = d.id
WHERE pmr.record_status = 'active';

-- Active High Risk Patients View
CREATE OR REPLACE VIEW high_risk_patients AS
SELECT DISTINCT
    p.id as patient_id,
    p.first_name || ' ' || p.last_name as patient_name,
    p.phone,
    p.age,
    p.gender,
    array_agg(DISTINCT phr.risk_type) as risk_types,
    array_agg(DISTINCT phr.risk_level) as risk_levels,
    MAX(phr.last_assessed_date) as last_risk_assessment
FROM patients p
JOIN patient_medical_records pmr ON p.id = pmr.patient_id
JOIN patient_high_risks phr ON pmr.id = phr.medical_record_id
WHERE phr.is_active = true
GROUP BY p.id, p.first_name, p.last_name, p.phone, p.age, p.gender;

-- Pending Investigations View
CREATE OR REPLACE VIEW pending_investigations AS
SELECT 
    pi.id,
    p.first_name || ' ' || p.last_name as patient_name,
    p.phone,
    pi.investigation_name,
    pi.investigation_type,
    pi.request_date,
    pi.urgency_level,
    CASE 
        WHEN pi.urgency_level = 'Stat' THEN 1
        WHEN pi.urgency_level = 'Urgent' THEN 2
        ELSE 3
    END as priority_order,
    u.first_name || ' ' || u.last_name as requested_by_name
FROM patient_investigations pi
JOIN patient_medical_records pmr ON pi.medical_record_id = pmr.id
JOIN patients p ON pmr.patient_id = p.id
LEFT JOIN users u ON pi.requested_by = u.id
WHERE pi.result_status = 'Pending'
ORDER BY priority_order, pi.request_date;

-- ============================================================================
-- DATA VALIDATION AND UTILITY FUNCTIONS
-- ============================================================================

-- Function to get patient's latest medical record
CREATE OR REPLACE FUNCTION get_latest_medical_record(patient_uuid UUID)
RETURNS UUID AS $$
DECLARE
    latest_record_id UUID;
BEGIN
    SELECT id INTO latest_record_id
    FROM patient_medical_records
    WHERE patient_id = patient_uuid AND record_status = 'active'
    ORDER BY record_date DESC, created_at DESC
    LIMIT 1;
    
    RETURN latest_record_id;
END;
$$ LANGUAGE 'plpgsql';

-- Function to check for drug interactions (basic implementation)
CREATE OR REPLACE FUNCTION check_drug_interactions(record_uuid UUID, new_medication VARCHAR)
RETURNS TEXT[] AS $$
DECLARE
    interactions TEXT[] := '{}';
    existing_meds VARCHAR[];
BEGIN
    -- Get currently active medications for this record
    SELECT array_agg(medication_name) INTO existing_meds
    FROM patient_prescriptions
    WHERE medical_record_id = record_uuid 
    AND prescription_status = 'Active'
    AND medication_name != new_medication;
    
    -- This is a basic implementation - in production, you would have a proper
    -- drug interaction database or API integration
    IF array_length(existing_meds, 1) > 0 THEN
        interactions := array_append(interactions, 
            'Please verify drug interactions with existing medications: ' || 
            array_to_string(existing_meds, ', ')
        );
    END IF;
    
    RETURN interactions;
END;
$$ LANGUAGE 'plpgsql';

-- ============================================================================
-- SAMPLE DATA FOR TESTING (OPTIONAL)
-- ============================================================================

-- You can uncomment and modify this section to insert sample data for testing

/*
-- Insert sample medical record
INSERT INTO patient_medical_records (
    patient_id, department, visit_type, temperature, blood_pressure_systolic, 
    blood_pressure_diastolic, heart_rate, weight, height, created_by
) 
SELECT 
    p.id, 'General', 'OPD', 98.6, 120, 80, 72, 70.5, 175.0,
    (SELECT id FROM users LIMIT 1)
FROM patients p 
LIMIT 1;

-- Get the record ID for additional sample data
-- You would replace this with actual UUIDs in practice
*/

-- ============================================================================
-- SCHEMA VALIDATION AND VERIFICATION
-- ============================================================================

-- Verify all tables were created successfully
SELECT 
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN (
    'patient_medical_records',
    'patient_high_risks',
    'patient_chief_complaints',
    'patient_examinations',
    'patient_investigations',
    'patient_diagnoses',
    'patient_prescriptions'
)
ORDER BY table_name;

-- Check indexes
SELECT 
    tablename,
    indexname,
    indexdef
FROM pg_indexes 
WHERE schemaname = 'public' 
AND tablename LIKE 'patient_%'
ORDER BY tablename, indexname;

-- Verify RLS is enabled
SELECT 
    tablename,
    rowsecurity
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename LIKE 'patient_%';

-- Check constraints
SELECT 
    table_name,
    constraint_name,
    constraint_type
FROM information_schema.table_constraints 
WHERE table_schema = 'public' 
AND table_name LIKE 'patient_%'
ORDER BY table_name, constraint_type;

SELECT 'Medical Records Schema Installation Complete!' as status;
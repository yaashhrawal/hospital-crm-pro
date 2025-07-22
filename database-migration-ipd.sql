-- Database Migration for IPD Patient Admissions
-- Run this in your Supabase SQL Editor to add missing columns

-- 1. Add missing columns to patient_admissions table
ALTER TABLE patient_admissions 
ADD COLUMN IF NOT EXISTS expected_discharge DATE,
ADD COLUMN IF NOT EXISTS admitted_by UUID REFERENCES users(id),
ADD COLUMN IF NOT EXISTS admission_notes TEXT;

-- 2. Update room_type constraint to include 'emergency'
ALTER TABLE patient_admissions 
DROP CONSTRAINT IF EXISTS patient_admissions_room_type_check;

ALTER TABLE patient_admissions 
ADD CONSTRAINT patient_admissions_room_type_check 
CHECK (room_type IN ('general', 'private', 'icu', 'emergency'));

-- 3. Create ipd_services table if it doesn't exist
CREATE TABLE IF NOT EXISTS ipd_services (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admission_id UUID NOT NULL REFERENCES patient_admissions(id) ON DELETE CASCADE,
    service_name TEXT NOT NULL,
    service_type TEXT NOT NULL CHECK (service_type IN ('NURSING', 'MEDICATION', 'PROCEDURE', 'CONSULTATION', 'DIAGNOSTIC', 'OTHER')),
    amount NUMERIC(10,2) NOT NULL,
    service_date DATE NOT NULL,
    notes TEXT,
    provided_by TEXT,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Enable RLS on new table
ALTER TABLE ipd_services ENABLE ROW LEVEL SECURITY;

-- 5. Create RLS policies for ipd_services
CREATE POLICY "Allow authenticated users to read ipd_services" ON ipd_services
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to insert ipd_services" ON ipd_services
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to update ipd_services" ON ipd_services
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to delete ipd_services" ON ipd_services
    FOR DELETE USING (auth.role() = 'authenticated');

-- 6. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_patient_admissions_patient_id ON patient_admissions(patient_id);
CREATE INDEX IF NOT EXISTS idx_patient_admissions_status ON patient_admissions(status);
CREATE INDEX IF NOT EXISTS idx_patient_admissions_bed_number ON patient_admissions(bed_number);
CREATE INDEX IF NOT EXISTS idx_ipd_services_admission_id ON ipd_services(admission_id);
CREATE INDEX IF NOT EXISTS idx_ipd_services_service_date ON ipd_services(service_date);

-- 7. Add trigger for updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_patient_admissions_updated_at BEFORE UPDATE ON patient_admissions 
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
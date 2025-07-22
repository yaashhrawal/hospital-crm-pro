-- Create comprehensive discharge management tables
-- Run this script in your Supabase SQL editor

-- 1. Create discharge_summaries table for medical documentation
CREATE TABLE IF NOT EXISTS discharge_summaries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admission_id UUID REFERENCES patient_admissions(id) ON DELETE CASCADE,
    patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
    
    -- Medical Summary
    final_diagnosis TEXT NOT NULL,
    treatment_summary TEXT NOT NULL,
    discharge_condition TEXT DEFAULT 'STABLE' CHECK (discharge_condition IN ('STABLE', 'IMPROVED', 'CRITICAL', 'REFERRED')),
    follow_up_instructions TEXT,
    medicines_prescribed TEXT,
    dietary_instructions TEXT,
    activity_restrictions TEXT,
    next_appointment_date DATE,
    doctor_name TEXT,
    
    -- Legal/Administrative
    attendant_name TEXT NOT NULL,
    attendant_relationship TEXT DEFAULT 'FAMILY_MEMBER' CHECK (attendant_relationship IN ('SELF', 'FAMILY_MEMBER', 'SPOUSE', 'PARENT', 'CHILD', 'FRIEND', 'GUARDIAN')),
    attendant_contact TEXT,
    documents_handed_over BOOLEAN DEFAULT FALSE,
    discharge_notes TEXT,
    
    -- System fields
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    hospital_id UUID DEFAULT '550e8400-e29b-41d4-a716-446655440000'::uuid,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create discharge_bills table for comprehensive billing
CREATE TABLE IF NOT EXISTS discharge_bills (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admission_id UUID REFERENCES patient_admissions(id) ON DELETE CASCADE,
    patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
    discharge_summary_id UUID REFERENCES discharge_summaries(id) ON DELETE CASCADE,
    
    -- Billing breakdown
    doctor_fees DECIMAL(10,2) DEFAULT 0.00,
    nursing_charges DECIMAL(10,2) DEFAULT 0.00,
    medicine_charges DECIMAL(10,2) DEFAULT 0.00,
    diagnostic_charges DECIMAL(10,2) DEFAULT 0.00,
    operation_charges DECIMAL(10,2) DEFAULT 0.00,
    other_charges DECIMAL(10,2) DEFAULT 0.00,
    total_charges DECIMAL(10,2) NOT NULL,
    
    -- Deductions
    discount_amount DECIMAL(10,2) DEFAULT 0.00,
    insurance_covered DECIMAL(10,2) DEFAULT 0.00,
    net_amount DECIMAL(10,2) NOT NULL,
    
    -- Payment details
    payment_mode TEXT DEFAULT 'CASH' CHECK (payment_mode IN ('CASH', 'ONLINE', 'INSURANCE')),
    amount_paid DECIMAL(10,2) DEFAULT 0.00,
    payment_status TEXT DEFAULT 'COMPLETED' CHECK (payment_status IN ('PENDING', 'COMPLETED', 'PARTIAL')),
    
    -- Additional info
    stay_duration INTEGER NOT NULL,
    bill_generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- System fields
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    hospital_id UUID DEFAULT '550e8400-e29b-41d4-a716-446655440000'::uuid,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_discharge_summaries_admission_id ON discharge_summaries(admission_id);
CREATE INDEX IF NOT EXISTS idx_discharge_summaries_patient_id ON discharge_summaries(patient_id);
CREATE INDEX IF NOT EXISTS idx_discharge_summaries_created_at ON discharge_summaries(created_at);

CREATE INDEX IF NOT EXISTS idx_discharge_bills_admission_id ON discharge_bills(admission_id);
CREATE INDEX IF NOT EXISTS idx_discharge_bills_patient_id ON discharge_bills(patient_id);
CREATE INDEX IF NOT EXISTS idx_discharge_bills_discharge_summary_id ON discharge_bills(discharge_summary_id);
CREATE INDEX IF NOT EXISTS idx_discharge_bills_created_at ON discharge_bills(created_at);

-- Enable RLS (Row Level Security)
ALTER TABLE discharge_summaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE discharge_bills ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY IF NOT EXISTS "Enable all operations for authenticated users on discharge_summaries"
ON discharge_summaries FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY IF NOT EXISTS "Enable all operations for authenticated users on discharge_bills"
ON discharge_bills FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Create updated_at trigger functions
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
DROP TRIGGER IF EXISTS update_discharge_summaries_updated_at ON discharge_summaries;
CREATE TRIGGER update_discharge_summaries_updated_at
    BEFORE UPDATE ON discharge_summaries
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_discharge_bills_updated_at ON discharge_bills;
CREATE TRIGGER update_discharge_bills_updated_at
    BEFORE UPDATE ON discharge_bills
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Verify tables were created
SELECT 'discharge_summaries' as table_name, COUNT(*) as record_count FROM discharge_summaries
UNION ALL
SELECT 'discharge_bills' as table_name, COUNT(*) as record_count FROM discharge_bills;
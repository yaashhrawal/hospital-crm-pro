-- =======================================================
-- SAFE ADD DISCHARGE-SPECIFIC TABLES FOR IPD FUNCTIONALITY
-- This version handles existing triggers and policies safely
-- Copy and paste this ENTIRE script into Supabase SQL Editor
-- =======================================================

-- 1. DISCHARGE_SUMMARIES TABLE
CREATE TABLE IF NOT EXISTS discharge_summaries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admission_id UUID NOT NULL REFERENCES patient_admissions(id) ON DELETE CASCADE,
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    
    -- Medical Information
    final_diagnosis TEXT NOT NULL,
    treatment_summary TEXT NOT NULL,
    discharge_condition TEXT NOT NULL DEFAULT 'STABLE' CHECK (discharge_condition IN ('STABLE', 'IMPROVED', 'CRITICAL', 'REFERRED')),
    follow_up_instructions TEXT,
    medicines_prescribed TEXT,
    dietary_instructions TEXT,
    activity_restrictions TEXT,
    next_appointment_date DATE,
    doctor_name TEXT,
    
    -- Administrative Information
    attendant_name TEXT NOT NULL,
    attendant_relationship TEXT NOT NULL DEFAULT 'FAMILY_MEMBER' CHECK (attendant_relationship IN ('SELF', 'FAMILY_MEMBER', 'SPOUSE', 'PARENT', 'CHILD', 'FRIEND', 'GUARDIAN')),
    attendant_contact TEXT,
    documents_handed_over BOOLEAN DEFAULT FALSE,
    discharge_notes TEXT,
    
    -- System fields
    hospital_id UUID DEFAULT '550e8400-e29b-41d4-a716-446655440000'::uuid,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. DISCHARGE_BILLS TABLE
CREATE TABLE IF NOT EXISTS discharge_bills (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admission_id UUID NOT NULL REFERENCES patient_admissions(id) ON DELETE CASCADE,
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    discharge_summary_id UUID REFERENCES discharge_summaries(id) ON DELETE SET NULL,
    
    -- Charge breakdown
    doctor_fees DECIMAL(10,2) DEFAULT 0.00,
    nursing_charges DECIMAL(10,2) DEFAULT 0.00,
    medicine_charges DECIMAL(10,2) DEFAULT 0.00,
    diagnostic_charges DECIMAL(10,2) DEFAULT 0.00,
    operation_charges DECIMAL(10,2) DEFAULT 0.00,
    other_charges DECIMAL(10,2) DEFAULT 0.00,
    
    -- Totals and deductions
    total_charges DECIMAL(10,2) NOT NULL,
    discount_amount DECIMAL(10,2) DEFAULT 0.00,
    insurance_covered DECIMAL(10,2) DEFAULT 0.00,
    net_amount DECIMAL(10,2) NOT NULL,
    
    -- Payment information
    payment_mode TEXT NOT NULL CHECK (payment_mode IN ('CASH', 'ONLINE', 'INSURANCE')),
    amount_paid DECIMAL(10,2) NOT NULL,
    stay_duration INTEGER NOT NULL,
    
    -- System fields
    hospital_id UUID DEFAULT '550e8400-e29b-41d4-a716-446655440000'::uuid,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =======================================================
-- INDEXES FOR PERFORMANCE (Only create if they don't exist)
-- =======================================================

-- Discharge summaries indexes
CREATE INDEX IF NOT EXISTS idx_discharge_summaries_admission_id ON discharge_summaries(admission_id);
CREATE INDEX IF NOT EXISTS idx_discharge_summaries_patient_id ON discharge_summaries(patient_id);
CREATE INDEX IF NOT EXISTS idx_discharge_summaries_created_at ON discharge_summaries(created_at);

-- Discharge bills indexes
CREATE INDEX IF NOT EXISTS idx_discharge_bills_admission_id ON discharge_bills(admission_id);
CREATE INDEX IF NOT EXISTS idx_discharge_bills_patient_id ON discharge_bills(patient_id);
CREATE INDEX IF NOT EXISTS idx_discharge_bills_discharge_summary_id ON discharge_bills(discharge_summary_id);

-- =======================================================
-- ROW LEVEL SECURITY (RLS) - Safe handling
-- =======================================================

-- Enable RLS only if tables exist
DO $$
BEGIN
    -- Check if tables exist and enable RLS
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'discharge_summaries') THEN
        ALTER TABLE discharge_summaries ENABLE ROW LEVEL SECURITY;
    END IF;
    
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'discharge_bills') THEN
        ALTER TABLE discharge_bills ENABLE ROW LEVEL SECURITY;
    END IF;
END $$;

-- =======================================================
-- RLS POLICIES (Safe handling)
-- =======================================================

-- Drop and recreate policies safely
DO $$ 
BEGIN
    -- Handle discharge_summaries policies
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'discharge_summaries') THEN
        DROP POLICY IF EXISTS "Enable all operations for authenticated users on discharge_summaries" ON discharge_summaries;
        CREATE POLICY "Enable all operations for authenticated users on discharge_summaries"
        ON discharge_summaries FOR ALL TO authenticated USING (true) WITH CHECK (true);
    END IF;
    
    -- Handle discharge_bills policies
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'discharge_bills') THEN
        DROP POLICY IF EXISTS "Enable all operations for authenticated users on discharge_bills" ON discharge_bills;
        CREATE POLICY "Enable all operations for authenticated users on discharge_bills"
        ON discharge_bills FOR ALL TO authenticated USING (true) WITH CHECK (true);
    END IF;
    
EXCEPTION 
    WHEN undefined_table THEN 
        RAISE NOTICE 'Some tables do not exist yet, skipping policy creation';
    WHEN undefined_object THEN 
        RAISE NOTICE 'Some policies do not exist, continuing';
END $$;

-- =======================================================
-- ENSURE UPDATE FUNCTION EXISTS
-- =======================================================

-- Create the update function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =======================================================
-- UPDATED_AT TRIGGERS (Safe handling)
-- =======================================================

-- Safely handle triggers - drop and recreate
DO $$
BEGIN
    -- Handle discharge_summaries trigger
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'discharge_summaries') THEN
        DROP TRIGGER IF EXISTS update_discharge_summaries_updated_at ON discharge_summaries;
        CREATE TRIGGER update_discharge_summaries_updated_at
            BEFORE UPDATE ON discharge_summaries FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
        RAISE NOTICE 'Created/Updated discharge_summaries trigger';
    END IF;
    
    -- Handle discharge_bills trigger
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'discharge_bills') THEN
        DROP TRIGGER IF EXISTS update_discharge_bills_updated_at ON discharge_bills;
        CREATE TRIGGER update_discharge_bills_updated_at
            BEFORE UPDATE ON discharge_bills FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
        RAISE NOTICE 'Created/Updated discharge_bills trigger';
    END IF;
    
EXCEPTION 
    WHEN undefined_table THEN 
        RAISE NOTICE 'Tables do not exist, skipping trigger creation';
END $$;

-- =======================================================
-- VERIFICATION
-- =======================================================

-- Check that tables were created and show their status
SELECT 
    table_name,
    CASE 
        WHEN EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND information_schema.tables.table_name = t.table_name) 
        THEN '✅ EXISTS'
        ELSE '❌ MISSING'
    END as table_status,
    CASE 
        WHEN table_name = 'discharge_summaries' AND EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'discharge_summaries') 
        THEN (SELECT COUNT(*) FROM discharge_summaries)::text
        WHEN table_name = 'discharge_bills' AND EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'discharge_bills')
        THEN (SELECT COUNT(*) FROM discharge_bills)::text
        ELSE '0'
    END as record_count
FROM (
    VALUES 
        ('discharge_summaries'),
        ('discharge_bills')
) AS t(table_name);

-- Check triggers
SELECT 
    trigger_name,
    event_object_table,
    'Trigger exists and is active' as status
FROM information_schema.triggers 
WHERE trigger_schema = 'public' 
AND trigger_name IN ('update_discharge_summaries_updated_at', 'update_discharge_bills_updated_at');

-- Success message
SELECT '🎉 SUCCESS: Discharge tables setup completed safely!' as status,
       'IPD discharge functionality should now work properly!' as message;
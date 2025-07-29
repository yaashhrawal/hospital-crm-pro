-- SQL queries to create discharge-related tables in Supabase
-- Run these queries in your Supabase SQL Editor

-- 1. Create discharge_summaries table
CREATE TABLE IF NOT EXISTS public.discharge_summaries (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    admission_id UUID NOT NULL REFERENCES public.patient_admissions(id) ON DELETE CASCADE,
    patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
    
    -- Medical Summary Fields
    final_diagnosis TEXT NOT NULL,
    primary_consultant TEXT NOT NULL,
    chief_complaints TEXT,
    hopi TEXT, -- History of Present Illness
    past_history TEXT,
    investigations TEXT,
    course_of_stay TEXT,
    treatment_during_hospitalization TEXT,
    discharge_medication TEXT,
    follow_up_on TEXT,
    
    -- Administrative Fields
    attendant_name TEXT NOT NULL,
    attendant_relationship TEXT DEFAULT 'FAMILY_MEMBER',
    attendant_contact TEXT,
    documents_handed_over BOOLEAN DEFAULT false,
    discharge_notes TEXT,
    
    -- Metadata
    created_by UUID REFERENCES auth.users(id),
    hospital_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create discharge_bills table
CREATE TABLE IF NOT EXISTS public.discharge_bills (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    admission_id UUID NOT NULL REFERENCES public.patient_admissions(id) ON DELETE CASCADE,
    patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
    discharge_summary_id UUID REFERENCES public.discharge_summaries(id) ON DELETE CASCADE,
    
    -- Billing Fields
    doctor_fees DECIMAL(10,2) DEFAULT 0,
    nursing_charges DECIMAL(10,2) DEFAULT 0,
    medicine_charges DECIMAL(10,2) DEFAULT 0,
    diagnostic_charges DECIMAL(10,2) DEFAULT 0,
    operation_charges DECIMAL(10,2) DEFAULT 0,
    other_charges DECIMAL(10,2) DEFAULT 0,
    existing_services DECIMAL(10,2) DEFAULT 0,
    total_charges DECIMAL(10,2) DEFAULT 0,
    discount_amount DECIMAL(10,2) DEFAULT 0,
    insurance_covered DECIMAL(10,2) DEFAULT 0,
    net_amount DECIMAL(10,2) DEFAULT 0,
    previous_payments DECIMAL(10,2) DEFAULT 0,
    final_payment DECIMAL(10,2) DEFAULT 0,
    total_paid DECIMAL(10,2) DEFAULT 0,
    balance_amount DECIMAL(10,2) DEFAULT 0,
    
    -- Payment Details
    payment_mode TEXT DEFAULT 'CASH' CHECK (payment_mode IN ('CASH', 'CARD', 'UPI', 'BANK_TRANSFER', 'INSURANCE')),
    stay_duration INTEGER DEFAULT 0,
    
    -- Metadata
    created_by UUID REFERENCES auth.users(id),
    hospital_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Add discharge_date column to patient_admissions if it doesn't exist
ALTER TABLE public.patient_admissions 
ADD COLUMN IF NOT EXISTS discharge_date TIMESTAMP WITH TIME ZONE;

-- 4. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_discharge_summaries_admission_id ON public.discharge_summaries(admission_id);
CREATE INDEX IF NOT EXISTS idx_discharge_summaries_patient_id ON public.discharge_summaries(patient_id);
CREATE INDEX IF NOT EXISTS idx_discharge_bills_admission_id ON public.discharge_bills(admission_id);
CREATE INDEX IF NOT EXISTS idx_discharge_bills_patient_id ON public.discharge_bills(patient_id);
CREATE INDEX IF NOT EXISTS idx_patient_admissions_discharge_date ON public.patient_admissions(discharge_date);

-- 5. Enable Row Level Security (RLS)
ALTER TABLE public.discharge_summaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.discharge_bills ENABLE ROW LEVEL SECURITY;

-- 6. Create RLS policies (adjust according to your authentication setup)
-- Allow authenticated users to read discharge summaries
CREATE POLICY "Allow authenticated users to read discharge summaries" ON public.discharge_summaries
    FOR SELECT USING (auth.role() = 'authenticated');

-- Allow authenticated users to insert discharge summaries
CREATE POLICY "Allow authenticated users to insert discharge summaries" ON public.discharge_summaries
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Allow authenticated users to update their own discharge summaries
CREATE POLICY "Allow authenticated users to update discharge summaries" ON public.discharge_summaries
    FOR UPDATE USING (auth.uid() = created_by);

-- Allow authenticated users to read discharge bills
CREATE POLICY "Allow authenticated users to read discharge bills" ON public.discharge_bills
    FOR SELECT USING (auth.role() = 'authenticated');

-- Allow authenticated users to insert discharge bills
CREATE POLICY "Allow authenticated users to insert discharge bills" ON public.discharge_bills
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Allow authenticated users to update their own discharge bills
CREATE POLICY "Allow authenticated users to update discharge bills" ON public.discharge_bills
    FOR UPDATE USING (auth.uid() = created_by);

-- 7. Create triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_discharge_summaries_updated_at 
    BEFORE UPDATE ON public.discharge_summaries 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_discharge_bills_updated_at 
    BEFORE UPDATE ON public.discharge_bills 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- 8. Grant necessary permissions
GRANT ALL ON public.discharge_summaries TO authenticated;
GRANT ALL ON public.discharge_bills TO authenticated;
GRANT USAGE ON SEQUENCE discharge_summaries_id_seq TO authenticated;
GRANT USAGE ON SEQUENCE discharge_bills_id_seq TO authenticated;
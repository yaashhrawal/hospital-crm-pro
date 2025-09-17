-- Add missing patient_refunds table
-- Run this in your Supabase SQL Editor

CREATE TABLE IF NOT EXISTS patient_refunds (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    hospital_id UUID,
    refund_amount NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    refund_reason TEXT,
    payment_mode TEXT CHECK (payment_mode IN ('CASH', 'CARD', 'UPI', 'BANK_TRANSFER', 'CHEQUE')) DEFAULT 'CASH',
    original_transaction_id UUID,
    processed_by TEXT,
    status TEXT DEFAULT 'PROCESSED' CHECK (status IN ('PENDING', 'PROCESSED', 'CANCELLED')),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE patient_refunds ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Authenticated users can read refunds" ON patient_refunds FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can insert refunds" ON patient_refunds FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can update refunds" ON patient_refunds FOR UPDATE USING (auth.role() = 'authenticated');

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_patient_refunds_patient_id ON patient_refunds(patient_id);
CREATE INDEX IF NOT EXISTS idx_patient_refunds_hospital_id ON patient_refunds(hospital_id);
CREATE INDEX IF NOT EXISTS idx_patient_refunds_created_at ON patient_refunds(created_at);
CREATE INDEX IF NOT EXISTS idx_patient_refunds_status ON patient_refunds(status);

-- Verification
SELECT 'patient_refunds table created successfully!' as status;
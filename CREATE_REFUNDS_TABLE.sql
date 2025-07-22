-- Create patient_refunds table if it doesn't exist
-- Run this script in your Supabase SQL editor if the refunds table is missing

CREATE TABLE IF NOT EXISTS patient_refunds (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
    original_transaction_id UUID REFERENCES patient_transactions(id) ON DELETE SET NULL,
    amount DECIMAL(10,2) NOT NULL CHECK (amount > 0),
    reason TEXT NOT NULL,
    refund_method TEXT DEFAULT 'CASH' CHECK (refund_method IN ('CASH', 'ONLINE', 'BANK_TRANSFER')),
    payment_mode TEXT DEFAULT 'CASH' CHECK (payment_mode IN ('CASH', 'ONLINE')),
    status TEXT DEFAULT 'COMPLETED' CHECK (status IN ('PENDING', 'COMPLETED', 'CANCELLED')),
    processed_by UUID REFERENCES users(id) ON DELETE SET NULL,
    hospital_id UUID DEFAULT '550e8400-e29b-41d4-a716-446655440000'::uuid,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_patient_refunds_patient_id ON patient_refunds(patient_id);
CREATE INDEX IF NOT EXISTS idx_patient_refunds_status ON patient_refunds(status);
CREATE INDEX IF NOT EXISTS idx_patient_refunds_created_at ON patient_refunds(created_at);

-- Enable RLS
ALTER TABLE patient_refunds ENABLE ROW LEVEL SECURITY;

-- Create RLS policy
CREATE POLICY IF NOT EXISTS "Enable all operations for authenticated users"
ON patient_refunds FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Verify table was created
SELECT COUNT(*) as refund_count FROM patient_refunds;
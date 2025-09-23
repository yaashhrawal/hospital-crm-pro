-- Create IPD Summaries Table
CREATE TABLE IF NOT EXISTS ipd_summaries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    summary_reference VARCHAR(50) UNIQUE NOT NULL, -- IPD-{timestamp}
    services JSONB NOT NULL, -- Array of services with details
    total_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
    payment_mode VARCHAR(20) NOT NULL DEFAULT 'CASH',
    notes TEXT,
    hospital_id UUID NOT NULL DEFAULT '550e8400-e29b-41d4-a716-446655440000',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by VARCHAR(100) DEFAULT 'system'
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_ipd_summaries_patient_id ON ipd_summaries(patient_id);
CREATE INDEX IF NOT EXISTS idx_ipd_summaries_hospital_id ON ipd_summaries(hospital_id);
CREATE INDEX IF NOT EXISTS idx_ipd_summaries_created_at ON ipd_summaries(created_at);
CREATE INDEX IF NOT EXISTS idx_ipd_summaries_payment_mode ON ipd_summaries(payment_mode);
CREATE INDEX IF NOT EXISTS idx_ipd_summaries_reference ON ipd_summaries(summary_reference);

-- Add RLS (Row Level Security) policies if needed
ALTER TABLE ipd_summaries ENABLE ROW LEVEL SECURITY;

-- Allow read access
CREATE POLICY "Allow read access to ipd_summaries" ON ipd_summaries
    FOR SELECT USING (true);

-- Allow insert access
CREATE POLICY "Allow insert access to ipd_summaries" ON ipd_summaries
    FOR INSERT WITH CHECK (true);

-- Allow update access
CREATE POLICY "Allow update access to ipd_summaries" ON ipd_summaries
    FOR UPDATE USING (true);

-- Allow delete access
CREATE POLICY "Allow delete access to ipd_summaries" ON ipd_summaries
    FOR DELETE USING (true);

-- Create function to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_ipd_summaries_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for auto-updating updated_at
CREATE TRIGGER update_ipd_summaries_updated_at
    BEFORE UPDATE ON ipd_summaries
    FOR EACH ROW
    EXECUTE FUNCTION update_ipd_summaries_updated_at();

-- Add comments for documentation
COMMENT ON TABLE ipd_summaries IS 'Table to store IPD patient summaries with services and payment details';
COMMENT ON COLUMN ipd_summaries.summary_reference IS 'Unique reference number for the summary (e.g., IPD-1234567890)';
COMMENT ON COLUMN ipd_summaries.services IS 'JSON array containing service details: [{id, service, qty, amount}]';
COMMENT ON COLUMN ipd_summaries.payment_mode IS 'Payment method: CASH, UPI, CARD, BANK_TRANSFER, INSURANCE, SUMMARY';
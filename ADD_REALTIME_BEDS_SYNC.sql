-- Add real-time synchronization support to beds table for multi-PC access
-- This fixes the issue where changes made on one PC are not visible on others

-- 1. Add columns needed for IPD bed management with real-time sync
ALTER TABLE beds 
ADD COLUMN IF NOT EXISTS patient_id UUID REFERENCES patients(id),
ADD COLUMN IF NOT EXISTS ipd_number TEXT,
ADD COLUMN IF NOT EXISTS admission_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS admission_id UUID,
ADD COLUMN IF NOT EXISTS tat_start_time BIGINT,
ADD COLUMN IF NOT EXISTS tat_status TEXT DEFAULT 'idle' CHECK (tat_status IN ('idle', 'running', 'completed', 'expired')),
ADD COLUMN IF NOT EXISTS tat_remaining_seconds INTEGER DEFAULT 1800, -- 30 minutes
ADD COLUMN IF NOT EXISTS consent_form_data JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS consent_form_submitted BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS clinical_record_data JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS clinical_record_submitted BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS progress_sheet_data JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS progress_sheet_submitted BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS nurses_orders_data JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS nurses_orders_submitted BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS ipd_consents_data JSONB DEFAULT '{}';

-- 2. Update status values to match the application expectations
ALTER TABLE beds DROP CONSTRAINT IF EXISTS beds_status_check;
ALTER TABLE beds ADD CONSTRAINT beds_status_check 
CHECK (status IN ('AVAILABLE', 'OCCUPIED', 'MAINTENANCE', 'RESERVED', 'occupied', 'vacant'));

-- 3. Create IPD counter table for centralized counter management
CREATE TABLE IF NOT EXISTS ipd_counters (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    date_key TEXT NOT NULL UNIQUE, -- Format: YYYYMMDD
    counter INTEGER NOT NULL DEFAULT 0,
    hospital_id UUID DEFAULT '550e8400-e29b-41d4-a716-446655440000',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Create function to get next IPD number (thread-safe)
CREATE OR REPLACE FUNCTION get_next_ipd_number()
RETURNS TEXT AS $$
DECLARE
    date_key TEXT;
    next_counter INTEGER;
    ipd_number TEXT;
BEGIN
    -- Generate date key (YYYYMMDD)
    date_key := TO_CHAR(CURRENT_DATE, 'YYYYMMDD');
    
    -- Increment counter atomically
    INSERT INTO ipd_counters (date_key, counter)
    VALUES (date_key, 1)
    ON CONFLICT (date_key) 
    DO UPDATE SET 
        counter = ipd_counters.counter + 1,
        updated_at = NOW()
    RETURNING counter INTO next_counter;
    
    -- Generate IPD number: IPD-YYYYMMDD-XXX
    ipd_number := 'IPD-' || date_key || '-' || LPAD(next_counter::TEXT, 3, '0');
    
    RETURN ipd_number;
END;
$$ LANGUAGE plpgsql;

-- 5. Enable real-time for beds table
ALTER PUBLICATION supabase_realtime ADD TABLE beds;

-- 6. Enable real-time for ipd_counters table
ALTER PUBLICATION supabase_realtime ADD TABLE ipd_counters;

-- 7. Create Row Level Security policies for beds
ALTER TABLE beds ENABLE ROW LEVEL SECURITY;

-- Policy: Everyone can read beds
CREATE POLICY IF NOT EXISTS "Everyone can view beds" ON beds
    FOR SELECT USING (true);

-- Policy: Everyone can insert beds
CREATE POLICY IF NOT EXISTS "Everyone can insert beds" ON beds
    FOR INSERT WITH CHECK (true);

-- Policy: Everyone can update beds
CREATE POLICY IF NOT EXISTS "Everyone can update beds" ON beds
    FOR UPDATE USING (true);

-- Policy: Everyone can delete beds
CREATE POLICY IF NOT EXISTS "Everyone can delete beds" ON beds
    FOR DELETE USING (true);

-- 8. Create RLS policies for ipd_counters
ALTER TABLE ipd_counters ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "Everyone can view ipd_counters" ON ipd_counters
    FOR SELECT USING (true);

CREATE POLICY IF NOT EXISTS "Everyone can insert ipd_counters" ON ipd_counters
    FOR INSERT WITH CHECK (true);

CREATE POLICY IF NOT EXISTS "Everyone can update ipd_counters" ON ipd_counters
    FOR UPDATE USING (true);

-- 9. Insert default beds (1-40) if table is empty
INSERT INTO beds (bed_number, room_type, status, hospital_id)
SELECT 
    i::TEXT,
    CASE 
        WHEN i <= 10 THEN 'GENERAL'
        WHEN i <= 20 THEN 'PRIVATE' 
        WHEN i <= 30 THEN 'ICU'
        ELSE 'EMERGENCY'
    END,
    'vacant',
    '550e8400-e29b-41d4-a716-446655440000'
FROM generate_series(1, 40) AS i
WHERE NOT EXISTS (SELECT 1 FROM beds WHERE bed_number = i::TEXT);

-- 10. Create updated_at trigger for beds
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_beds_updated_at ON beds;
CREATE TRIGGER update_beds_updated_at
    BEFORE UPDATE ON beds
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 11. Create updated_at trigger for ipd_counters  
DROP TRIGGER IF EXISTS update_ipd_counters_updated_at ON ipd_counters;
CREATE TRIGGER update_ipd_counters_updated_at
    BEFORE UPDATE ON ipd_counters
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Success message
SELECT 
    'SUCCESS: Beds table updated for real-time synchronization across multiple PCs' as message,
    'All bed changes will now sync automatically between computers' as details;
-- =======================================================
-- FIXED IPD RECEIPT PRINTING - DATABASE RELATIONSHIP ISSUE
-- This script fixes the schema mismatch and handles missing columns properly
-- Copy and paste this ENTIRE script into Supabase SQL Editor
-- =======================================================

-- =======================================================
-- STEP 1: CREATE BEDS TABLE IF IT DOESN'T EXIST
-- =======================================================

CREATE TABLE IF NOT EXISTS beds (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bed_number TEXT NOT NULL UNIQUE,
    room_type TEXT NOT NULL CHECK (room_type IN ('GENERAL', 'PRIVATE', 'ICU', 'EMERGENCY')),
    daily_rate DECIMAL(10,2) NOT NULL DEFAULT 1000.00,
    status TEXT NOT NULL DEFAULT 'AVAILABLE' CHECK (status IN ('AVAILABLE', 'OCCUPIED', 'MAINTENANCE', 'RESERVED')),
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    hospital_id UUID DEFAULT '550e8400-e29b-41d4-a716-446655440000'::uuid,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =======================================================
-- STEP 2: INSERT SAMPLE BEDS DATA (Only if table is empty)
-- =======================================================

DO $$
DECLARE
    bed_count integer;
BEGIN
    SELECT COUNT(*) INTO bed_count FROM beds;
    
    IF bed_count = 0 THEN
        INSERT INTO beds (bed_number, room_type, daily_rate, status) VALUES
        ('B001', 'GENERAL', 1000.00, 'AVAILABLE'),
        ('B002', 'GENERAL', 1000.00, 'AVAILABLE'),
        ('B003', 'GENERAL', 1000.00, 'AVAILABLE'),
        ('B004', 'GENERAL', 1000.00, 'AVAILABLE'),
        ('B005', 'GENERAL', 1000.00, 'AVAILABLE'),
        ('P001', 'PRIVATE', 2500.00, 'AVAILABLE'),
        ('P002', 'PRIVATE', 2500.00, 'AVAILABLE'),
        ('P003', 'PRIVATE', 2500.00, 'AVAILABLE'),
        ('I001', 'ICU', 5000.00, 'AVAILABLE'),
        ('I002', 'ICU', 5000.00, 'AVAILABLE'),
        ('E001', 'EMERGENCY', 1500.00, 'AVAILABLE'),
        ('E002', 'EMERGENCY', 1500.00, 'AVAILABLE')
        ON CONFLICT (bed_number) DO NOTHING;
        
        RAISE NOTICE 'Inserted % sample bed records', (SELECT COUNT(*) FROM beds);
    ELSE
        RAISE NOTICE 'Beds table already has % records, skipping sample insert', bed_count;
    END IF;
END $$;

-- =======================================================
-- STEP 3: ADD BED_ID COLUMN TO PATIENT_ADMISSIONS
-- =======================================================

-- Add bed_id column if it doesn't exist
DO $$
BEGIN
    -- Check if bed_id column exists
    IF NOT EXISTS (
        SELECT FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'patient_admissions'
        AND column_name = 'bed_id'
    ) THEN
        -- Add the column
        ALTER TABLE patient_admissions ADD COLUMN bed_id UUID REFERENCES beds(id) ON DELETE SET NULL;
        RAISE NOTICE 'Added bed_id column to patient_admissions table';
    ELSE
        RAISE NOTICE 'bed_id column already exists in patient_admissions table';
    END IF;
END $$;

-- =======================================================
-- STEP 4: MIGRATE EXISTING DATA FROM BED_NUMBER TO BED_ID (FIXED)
-- =======================================================

DO $$
DECLARE
    admission_record RECORD;
    bed_record_id UUID;
    updated_count INTEGER := 0;
BEGIN
    -- Update existing patient_admissions records to link with beds table
    FOR admission_record IN 
        SELECT id, bed_number, room_type, daily_rate 
        FROM patient_admissions 
        WHERE bed_id IS NULL AND bed_number IS NOT NULL
    LOOP
        -- Try to find matching bed by bed_number
        SELECT id INTO bed_record_id FROM beds WHERE bed_number = admission_record.bed_number LIMIT 1;
        
        IF bed_record_id IS NOT NULL THEN
            -- Update with existing bed
            UPDATE patient_admissions 
            SET bed_id = bed_record_id 
            WHERE id = admission_record.id;
            updated_count := updated_count + 1;
        ELSE
            -- Create new bed record if it doesn't exist (without ward_name)
            INSERT INTO beds (bed_number, room_type, daily_rate, status, description)
            VALUES (
                admission_record.bed_number,
                UPPER(admission_record.room_type),
                admission_record.daily_rate,
                'OCCUPIED',
                'Auto-created for admission'
            ) RETURNING id INTO bed_record_id;
            
            -- Update admission with new bed_id
            UPDATE patient_admissions 
            SET bed_id = bed_record_id 
            WHERE id = admission_record.id;
            updated_count := updated_count + 1;
            
            RAISE NOTICE 'Created new bed % for admission %', admission_record.bed_number, admission_record.id;
        END IF;
    END LOOP;
    
    RAISE NOTICE 'Updated % patient admission records with bed_id references', updated_count;
END $$;

-- =======================================================
-- STEP 5: UPDATE BED STATUS FOR ACTIVE ADMISSIONS
-- =======================================================

-- Mark beds as occupied for active admissions
UPDATE beds 
SET status = 'OCCUPIED' 
WHERE id IN (
    SELECT bed_id 
    FROM patient_admissions 
    WHERE status IN ('active', 'ACTIVE') 
    AND bed_id IS NOT NULL
);

-- Mark beds as available for discharged admissions
UPDATE beds 
SET status = 'AVAILABLE' 
WHERE id IN (
    SELECT bed_id 
    FROM patient_admissions 
    WHERE status IN ('discharged', 'DISCHARGED') 
    AND bed_id IS NOT NULL
);

-- =======================================================
-- STEP 6: CREATE INDEXES AND ENABLE RLS
-- =======================================================

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_beds_bed_number ON beds(bed_number);
CREATE INDEX IF NOT EXISTS idx_beds_status ON beds(status);
CREATE INDEX IF NOT EXISTS idx_beds_room_type ON beds(room_type);
CREATE INDEX IF NOT EXISTS idx_patient_admissions_bed_id ON patient_admissions(bed_id);

-- Enable RLS
ALTER TABLE beds ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
DO $$ 
BEGIN
    DROP POLICY IF EXISTS "Enable all operations for authenticated users on beds" ON beds;
    CREATE POLICY "Enable all operations for authenticated users on beds"
    ON beds FOR ALL TO authenticated USING (true) WITH CHECK (true);
EXCEPTION 
    WHEN undefined_object THEN NULL;
END $$;

-- Create update function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop and recreate trigger
DROP TRIGGER IF EXISTS update_beds_updated_at ON beds;
CREATE TRIGGER update_beds_updated_at
    BEFORE UPDATE ON beds FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =======================================================
-- STEP 7: VERIFICATION AND TESTING
-- =======================================================

-- Show beds table summary
SELECT 
    'Beds Table Summary' as info,
    COUNT(*) as total_beds,
    COUNT(CASE WHEN status = 'AVAILABLE' THEN 1 END) as available_beds,
    COUNT(CASE WHEN status = 'OCCUPIED' THEN 1 END) as occupied_beds
FROM beds;

-- Show patient_admissions with bed relationships
SELECT 
    'Patient Admissions with Bed Links' as info,
    COUNT(*) as total_admissions,
    COUNT(CASE WHEN bed_id IS NOT NULL THEN 1 END) as admissions_with_bed_id,
    COUNT(CASE WHEN bed_id IS NULL THEN 1 END) as admissions_without_bed_id
FROM patient_admissions;

-- Test the relationship query (this is what the receipt printing uses)
SELECT 
    pa.id as admission_id,
    pa.status,
    p.first_name || ' ' || p.last_name as patient_name,
    b.bed_number,
    b.room_type,
    b.daily_rate,
    b.status as bed_status
FROM patient_admissions pa
LEFT JOIN patients p ON pa.patient_id = p.id
LEFT JOIN beds b ON pa.bed_id = b.id
WHERE pa.status IN ('active', 'ACTIVE')
LIMIT 5;

-- Show the actual columns that exist in beds table
SELECT 
    'Beds Table Columns' as info,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'beds'
ORDER BY ordinal_position;

-- Final success message
SELECT 
    '🎉 SUCCESS: Database relationships fixed!' as status,
    'IPD receipt printing should now work properly!' as message,
    'Beds table created with proper foreign key relationships' as details;
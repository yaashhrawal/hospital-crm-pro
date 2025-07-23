-- =======================================================
-- MINIMAL IPD RECEIPT PRINTING FIX - Only Essential Columns
-- This script uses only the basic columns that exist in beds table
-- Copy and paste this ENTIRE script into Supabase SQL Editor
-- =======================================================

-- =======================================================
-- STEP 1: CREATE MINIMAL BEDS TABLE IF IT DOESN'T EXIST
-- =======================================================

CREATE TABLE IF NOT EXISTS beds (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bed_number TEXT NOT NULL UNIQUE,
    room_type TEXT NOT NULL CHECK (room_type IN ('GENERAL', 'PRIVATE', 'ICU', 'EMERGENCY')),
    daily_rate DECIMAL(10,2) NOT NULL DEFAULT 1000.00,
    status TEXT NOT NULL DEFAULT 'AVAILABLE' CHECK (status IN ('AVAILABLE', 'OCCUPIED', 'MAINTENANCE', 'RESERVED')),
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

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'patient_admissions'
        AND column_name = 'bed_id'
    ) THEN
        ALTER TABLE patient_admissions ADD COLUMN bed_id UUID REFERENCES beds(id) ON DELETE SET NULL;
        RAISE NOTICE 'Added bed_id column to patient_admissions table';
    ELSE
        RAISE NOTICE 'bed_id column already exists in patient_admissions table';
    END IF;
END $$;

-- =======================================================
-- STEP 4: MIGRATE DATA - ONLY ESSENTIAL COLUMNS
-- =======================================================

DO $$
DECLARE
    admission_record RECORD;
    bed_record_id UUID;
    updated_count INTEGER := 0;
BEGIN
    FOR admission_record IN 
        SELECT id, bed_number, room_type, daily_rate 
        FROM patient_admissions 
        WHERE bed_id IS NULL AND bed_number IS NOT NULL
    LOOP
        -- Try to find existing bed
        SELECT id INTO bed_record_id FROM beds WHERE bed_number = admission_record.bed_number LIMIT 1;
        
        IF bed_record_id IS NOT NULL THEN
            -- Use existing bed
            UPDATE patient_admissions 
            SET bed_id = bed_record_id 
            WHERE id = admission_record.id;
            updated_count := updated_count + 1;
        ELSE
            -- Create new bed with only essential columns
            INSERT INTO beds (bed_number, room_type, daily_rate, status)
            VALUES (
                admission_record.bed_number,
                UPPER(admission_record.room_type),
                admission_record.daily_rate,
                'OCCUPIED'
            ) RETURNING id INTO bed_record_id;
            
            -- Link admission to new bed
            UPDATE patient_admissions 
            SET bed_id = bed_record_id 
            WHERE id = admission_record.id;
            updated_count := updated_count + 1;
            
            RAISE NOTICE 'Created bed % for admission %', admission_record.bed_number, admission_record.id;
        END IF;
    END LOOP;
    
    RAISE NOTICE 'Updated % patient admission records with bed_id', updated_count;
END $$;

-- =======================================================
-- STEP 5: UPDATE BED STATUS
-- =======================================================

-- Occupied beds for active admissions
UPDATE beds 
SET status = 'OCCUPIED' 
WHERE id IN (
    SELECT bed_id 
    FROM patient_admissions 
    WHERE status IN ('active', 'ACTIVE') 
    AND bed_id IS NOT NULL
);

-- Available beds for discharged admissions
UPDATE beds 
SET status = 'AVAILABLE' 
WHERE id IN (
    SELECT bed_id 
    FROM patient_admissions 
    WHERE status IN ('discharged', 'DISCHARGED') 
    AND bed_id IS NOT NULL
);

-- =======================================================
-- STEP 6: CREATE INDEXES AND RLS
-- =======================================================

CREATE INDEX IF NOT EXISTS idx_beds_bed_number ON beds(bed_number);
CREATE INDEX IF NOT EXISTS idx_beds_status ON beds(status);
CREATE INDEX IF NOT EXISTS idx_patient_admissions_bed_id ON patient_admissions(bed_id);

ALTER TABLE beds ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
    DROP POLICY IF EXISTS "Enable all operations for authenticated users on beds" ON beds;
    CREATE POLICY "Enable all operations for authenticated users on beds"
    ON beds FOR ALL TO authenticated USING (true) WITH CHECK (true);
EXCEPTION 
    WHEN undefined_object THEN NULL;
END $$;

-- =======================================================
-- STEP 7: VERIFICATION
-- =======================================================

-- Show actual beds table structure
SELECT 
    'Current Beds Table Structure' as info,
    column_name,
    data_type
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'beds'
ORDER BY ordinal_position;

-- Show beds summary
SELECT 
    'Beds Summary' as info,
    COUNT(*) as total_beds,
    COUNT(CASE WHEN status = 'AVAILABLE' THEN 1 END) as available,
    COUNT(CASE WHEN status = 'OCCUPIED' THEN 1 END) as occupied
FROM beds;

-- Show admission links
SELECT 
    'Admission Links' as info,
    COUNT(*) as total_admissions,
    COUNT(CASE WHEN bed_id IS NOT NULL THEN 1 END) as with_bed_id,
    COUNT(CASE WHEN bed_id IS NULL THEN 1 END) as without_bed_id
FROM patient_admissions;

-- Test the relationship (what receipt printing uses)
SELECT 
    'Test Query Results' as info,
    pa.id as admission_id,
    p.first_name || ' ' || p.last_name as patient_name,
    b.bed_number,
    b.room_type,
    b.daily_rate
FROM patient_admissions pa
LEFT JOIN patients p ON pa.patient_id = p.id
LEFT JOIN beds b ON pa.bed_id = b.id
WHERE pa.status IN ('active', 'ACTIVE')
LIMIT 3;

SELECT '🎉 MINIMAL FIX COMPLETE!' as status;
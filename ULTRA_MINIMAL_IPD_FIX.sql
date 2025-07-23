-- =======================================================
-- ULTRA MINIMAL IPD RECEIPT FIX - No Triggers, Core Columns Only
-- This script uses absolute minimum columns and no update triggers
-- Copy and paste this ENTIRE script into Supabase SQL Editor
-- =======================================================

-- =======================================================
-- STEP 1: CHECK WHAT COLUMNS ACTUALLY EXIST IN BEDS TABLE
-- =======================================================

SELECT 
    'EXISTING BEDS TABLE STRUCTURE' as info,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'beds'
ORDER BY ordinal_position;

-- =======================================================
-- STEP 2: CREATE BEDS TABLE IF IT DOESN'T EXIST (MINIMAL)
-- =======================================================

CREATE TABLE IF NOT EXISTS beds (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bed_number TEXT NOT NULL UNIQUE,
    room_type TEXT NOT NULL DEFAULT 'GENERAL',
    daily_rate DECIMAL(10,2) NOT NULL DEFAULT 1000.00,
    status TEXT NOT NULL DEFAULT 'AVAILABLE'
);

-- =======================================================
-- STEP 3: INSERT SAMPLE BEDS (ONLY IF EMPTY)
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
        ('P001', 'PRIVATE', 2500.00, 'AVAILABLE'),
        ('P002', 'PRIVATE', 2500.00, 'AVAILABLE'),
        ('I001', 'ICU', 5000.00, 'AVAILABLE'),
        ('I002', 'ICU', 5000.00, 'AVAILABLE'),
        ('E001', 'EMERGENCY', 1500.00, 'AVAILABLE')
        ON CONFLICT (bed_number) DO NOTHING;
        
        RAISE NOTICE 'Inserted sample beds';
    ELSE
        RAISE NOTICE 'Beds table has % records', bed_count;
    END IF;
END $$;

-- =======================================================
-- STEP 4: ADD BED_ID TO PATIENT_ADMISSIONS
-- =======================================================

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'patient_admissions'
        AND column_name = 'bed_id'
    ) THEN
        ALTER TABLE patient_admissions ADD COLUMN bed_id UUID;
        RAISE NOTICE 'Added bed_id column';
    ELSE
        RAISE NOTICE 'bed_id column exists';
    END IF;
END $$;

-- =======================================================
-- STEP 5: MIGRATE DATA (ULTRA SIMPLE)
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
        -- Find existing bed
        SELECT id INTO bed_record_id FROM beds WHERE bed_number = admission_record.bed_number LIMIT 1;
        
        IF bed_record_id IS NOT NULL THEN
            -- Use existing bed
            UPDATE patient_admissions SET bed_id = bed_record_id WHERE id = admission_record.id;
            updated_count := updated_count + 1;
        ELSE
            -- Create new bed (minimal columns only)
            INSERT INTO beds (bed_number, room_type, daily_rate, status)
            VALUES (
                admission_record.bed_number,
                CASE 
                    WHEN UPPER(admission_record.room_type) IN ('GENERAL', 'PRIVATE', 'ICU', 'EMERGENCY') 
                    THEN UPPER(admission_record.room_type)
                    ELSE 'GENERAL'
                END,
                COALESCE(admission_record.daily_rate, 1000.00),
                'OCCUPIED'
            ) RETURNING id INTO bed_record_id;
            
            -- Link admission
            UPDATE patient_admissions SET bed_id = bed_record_id WHERE id = admission_record.id;
            updated_count := updated_count + 1;
            
            RAISE NOTICE 'Created bed %', admission_record.bed_number;
        END IF;
    END LOOP;
    
    RAISE NOTICE 'Linked % admissions to beds', updated_count;
END $$;

-- =======================================================
-- STEP 6: UPDATE BED STATUS
-- =======================================================

-- Mark beds occupied for active admissions
UPDATE beds 
SET status = 'OCCUPIED' 
WHERE id IN (
    SELECT DISTINCT bed_id 
    FROM patient_admissions 
    WHERE status IN ('active', 'ACTIVE') 
    AND bed_id IS NOT NULL
);

-- Mark beds available for discharged admissions  
UPDATE beds 
SET status = 'AVAILABLE' 
WHERE id IN (
    SELECT DISTINCT bed_id 
    FROM patient_admissions 
    WHERE status IN ('discharged', 'DISCHARGED') 
    AND bed_id IS NOT NULL
) AND id NOT IN (
    SELECT DISTINCT bed_id 
    FROM patient_admissions 
    WHERE status IN ('active', 'ACTIVE') 
    AND bed_id IS NOT NULL
);

-- =======================================================
-- STEP 7: ENABLE RLS (NO TRIGGERS)
-- =======================================================

ALTER TABLE beds ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
    DROP POLICY IF EXISTS "beds_policy" ON beds;
    CREATE POLICY "beds_policy" ON beds FOR ALL TO authenticated USING (true) WITH CHECK (true);
EXCEPTION 
    WHEN undefined_object THEN NULL;
END $$;

-- =======================================================
-- STEP 8: VERIFICATION
-- =======================================================

-- Final beds table structure
SELECT 
    'FINAL BEDS TABLE STRUCTURE' as info,
    column_name,
    data_type
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'beds'
ORDER BY ordinal_position;

-- Beds count
SELECT 
    'BEDS COUNT' as info,
    COUNT(*) as total,
    COUNT(CASE WHEN status = 'AVAILABLE' THEN 1 END) as available,
    COUNT(CASE WHEN status = 'OCCUPIED' THEN 1 END) as occupied
FROM beds;

-- Admission links
SELECT 
    'ADMISSION LINKS' as info,
    COUNT(*) as total_admissions,
    COUNT(bed_id) as linked_to_beds
FROM patient_admissions;

-- Test the relationship query
SELECT 
    'RELATIONSHIP TEST' as info,
    pa.id,
    COALESCE(p.first_name || ' ' || p.last_name, 'Unknown') as patient,
    b.bed_number,
    b.room_type,
    b.daily_rate
FROM patient_admissions pa
LEFT JOIN patients p ON pa.patient_id = p.id
LEFT JOIN beds b ON pa.bed_id = b.id
WHERE pa.status IN ('active', 'ACTIVE')
LIMIT 3;

SELECT '🎉 ULTRA MINIMAL FIX COMPLETE - NO TRIGGERS!' as status;
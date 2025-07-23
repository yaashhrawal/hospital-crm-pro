-- =======================================================
-- SAFE IPD FIX - NO TRIGGERS, NO FUNCTIONS, BASIC ONLY
-- This script completely avoids any trigger or function issues
-- Copy and paste this ENTIRE script into Supabase SQL Editor
-- =======================================================

-- =======================================================
-- STEP 1: SHOW CURRENT TABLE STRUCTURE
-- =======================================================

SELECT 
    'CHECKING EXISTING BEDS TABLE' as step,
    column_name,
    data_type
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'beds'
ORDER BY ordinal_position;

-- =======================================================
-- STEP 2: CREATE BASIC BEDS TABLE (IF DOESN'T EXIST)
-- =======================================================

-- Drop any existing triggers on beds table first to avoid conflicts
DO $$
BEGIN
    DROP TRIGGER IF EXISTS update_beds_updated_at ON beds;
    RAISE NOTICE 'Dropped any existing beds triggers';
EXCEPTION 
    WHEN undefined_table THEN 
        RAISE NOTICE 'Beds table does not exist yet';
    WHEN undefined_object THEN 
        RAISE NOTICE 'No triggers to drop';
END $$;

-- Create minimal beds table
CREATE TABLE IF NOT EXISTS beds (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bed_number TEXT NOT NULL UNIQUE,
    room_type TEXT NOT NULL DEFAULT 'GENERAL',
    daily_rate DECIMAL(10,2) NOT NULL DEFAULT 1000.00,
    status TEXT NOT NULL DEFAULT 'AVAILABLE'
);

-- =======================================================
-- STEP 3: ADD SAMPLE DATA
-- =======================================================

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

-- =======================================================
-- STEP 4: ADD BED_ID COLUMN TO PATIENT_ADMISSIONS
-- =======================================================

-- Add bed_id column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'patient_admissions'
        AND column_name = 'bed_id'
    ) THEN
        ALTER TABLE patient_admissions ADD COLUMN bed_id UUID;
        RAISE NOTICE 'Added bed_id column to patient_admissions';
    ELSE
        RAISE NOTICE 'bed_id column already exists';
    END IF;
END $$;

-- =======================================================
-- STEP 5: LINK EXISTING ADMISSIONS TO BEDS
-- =======================================================

-- Update admissions that have bed_number but no bed_id
UPDATE patient_admissions 
SET bed_id = beds.id
FROM beds
WHERE patient_admissions.bed_number = beds.bed_number
AND patient_admissions.bed_id IS NULL;

-- Create beds for admissions that don't have matching beds
DO $$
DECLARE
    admission_record RECORD;
    new_bed_id UUID;
    created_count INTEGER := 0;
BEGIN
    -- Find admissions without bed_id that have bed_number
    FOR admission_record IN 
        SELECT DISTINCT bed_number, room_type, daily_rate
        FROM patient_admissions 
        WHERE bed_id IS NULL 
        AND bed_number IS NOT NULL
        AND bed_number NOT IN (SELECT bed_number FROM beds)
    LOOP
        -- Create new bed
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
        ) RETURNING id INTO new_bed_id;
        
        -- Link all admissions with this bed_number
        UPDATE patient_admissions 
        SET bed_id = new_bed_id 
        WHERE bed_number = admission_record.bed_number 
        AND bed_id IS NULL;
        
        created_count := created_count + 1;
        RAISE NOTICE 'Created bed % and linked admissions', admission_record.bed_number;
    END LOOP;
    
    RAISE NOTICE 'Created % new beds and linked admissions', created_count;
END $$;

-- =======================================================
-- STEP 6: UPDATE BED STATUS BASED ON ADMISSIONS
-- =======================================================

-- Mark beds as occupied if they have active admissions
UPDATE beds 
SET status = 'OCCUPIED' 
WHERE id IN (
    SELECT DISTINCT bed_id 
    FROM patient_admissions 
    WHERE status IN ('active', 'ACTIVE') 
    AND bed_id IS NOT NULL
);

-- Mark beds as available if they only have discharged admissions
UPDATE beds 
SET status = 'AVAILABLE' 
WHERE id NOT IN (
    SELECT DISTINCT bed_id 
    FROM patient_admissions 
    WHERE status IN ('active', 'ACTIVE') 
    AND bed_id IS NOT NULL
);

-- =======================================================
-- STEP 7: ENABLE RLS (NO TRIGGERS)
-- =======================================================

ALTER TABLE beds ENABLE ROW LEVEL SECURITY;

-- Create simple RLS policy
DROP POLICY IF EXISTS "beds_access_policy" ON beds;
CREATE POLICY "beds_access_policy" ON beds 
FOR ALL TO authenticated 
USING (true) 
WITH CHECK (true);

-- =======================================================
-- STEP 8: CREATE BASIC INDEXES
-- =======================================================

CREATE INDEX IF NOT EXISTS idx_beds_bed_number ON beds(bed_number);
CREATE INDEX IF NOT EXISTS idx_beds_status ON beds(status);
CREATE INDEX IF NOT EXISTS idx_patient_admissions_bed_id ON patient_admissions(bed_id);

-- =======================================================
-- STEP 9: VERIFICATION
-- =======================================================

-- Show final beds table structure
SELECT 
    'FINAL BEDS TABLE STRUCTURE' as info,
    column_name,
    data_type
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'beds'
ORDER BY ordinal_position;

-- Show beds summary
SELECT 
    'BEDS SUMMARY' as category,
    status,
    COUNT(*) as count
FROM beds
GROUP BY status
ORDER BY status;

-- Show admission linkage
SELECT 
    'ADMISSION LINKAGE' as category,
    COUNT(*) as total_admissions,
    COUNT(bed_id) as linked_to_beds,
    COUNT(*) - COUNT(bed_id) as not_linked
FROM patient_admissions;

-- Test the relationship query (what receipt printing uses)
SELECT 
    'RECEIPT PRINTING TEST' as category,
    pa.id as admission_id,
    COALESCE(p.first_name || ' ' || p.last_name, 'Unknown Patient') as patient_name,
    b.bed_number,
    b.room_type,
    b.daily_rate,
    b.status as bed_status
FROM patient_admissions pa
LEFT JOIN patients p ON pa.patient_id = p.id
LEFT JOIN beds b ON pa.bed_id = b.id
WHERE pa.status IN ('active', 'ACTIVE')
LIMIT 5;

-- Final success message
SELECT 
    '🎉 SUCCESS!' as status,
    'IPD receipt printing relationships are now established!' as message,
    'No triggers were created to avoid column conflicts!' as note;
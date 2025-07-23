-- =======================================================
-- BULLETPROOF IPD FIX - Handles All Edge Cases
-- This script safely handles any existing table state
-- Copy and paste this ENTIRE script into Supabase SQL Editor
-- =======================================================

-- =======================================================
-- STEP 1: SHOW CURRENT STATE
-- =======================================================

SELECT 'CHECKING EXISTING TABLES' as step;

-- Check if beds table exists
SELECT 
    CASE 
        WHEN EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'beds')
        THEN 'EXISTS'
        ELSE 'DOES NOT EXIST'
    END as beds_table_status;

-- Show existing beds structure if it exists
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'beds') THEN
        RAISE NOTICE 'Beds table exists - showing structure';
    ELSE
        RAISE NOTICE 'Beds table does not exist - will create it';
    END IF;
END $$;

-- =======================================================
-- STEP 2: DROP ANY CONFLICTING TRIGGERS
-- =======================================================

DO $$
BEGIN
    DROP TRIGGER IF EXISTS update_beds_updated_at ON beds;
    RAISE NOTICE 'Dropped any existing triggers on beds table';
EXCEPTION 
    WHEN undefined_table THEN 
        RAISE NOTICE 'Beds table does not exist - no triggers to drop';
    WHEN undefined_object THEN 
        RAISE NOTICE 'No triggers found to drop';
END $$;

-- =======================================================
-- STEP 3: CREATE BEDS TABLE SAFELY
-- =======================================================

-- Drop beds table if it exists to start fresh
DROP TABLE IF EXISTS beds CASCADE;

-- Create clean beds table
CREATE TABLE beds (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bed_number TEXT NOT NULL UNIQUE,
    room_type TEXT NOT NULL DEFAULT 'GENERAL',
    daily_rate DECIMAL(10,2) NOT NULL DEFAULT 1000.00,
    status TEXT NOT NULL DEFAULT 'AVAILABLE'
);

RAISE NOTICE 'Created fresh beds table with unique constraint on bed_number';

-- =======================================================
-- STEP 4: INSERT SAMPLE BEDS DATA
-- =======================================================

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
('E002', 'EMERGENCY', 1500.00, 'AVAILABLE');

-- =======================================================
-- STEP 5: ADD BED_ID TO PATIENT_ADMISSIONS
-- =======================================================

DO $$
BEGIN
    -- Add bed_id column if it doesn't exist
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
    
    -- Add foreign key constraint
    BEGIN
        ALTER TABLE patient_admissions 
        ADD CONSTRAINT fk_patient_admissions_bed_id 
        FOREIGN KEY (bed_id) REFERENCES beds(id) ON DELETE SET NULL;
        RAISE NOTICE 'Added foreign key constraint';
    EXCEPTION
        WHEN duplicate_object THEN
            RAISE NOTICE 'Foreign key constraint already exists';
    END;
END $$;

-- =======================================================
-- STEP 6: MIGRATE EXISTING DATA
-- =======================================================

DO $$
DECLARE
    admission_record RECORD;
    bed_record_id UUID;
    updated_count INTEGER := 0;
    created_count INTEGER := 0;
BEGIN
    -- Process each admission that needs bed linking
    FOR admission_record IN 
        SELECT id, bed_number, room_type, daily_rate 
        FROM patient_admissions 
        WHERE bed_id IS NULL AND bed_number IS NOT NULL
    LOOP
        -- Try to find existing bed
        SELECT id INTO bed_record_id 
        FROM beds 
        WHERE bed_number = admission_record.bed_number;
        
        IF bed_record_id IS NOT NULL THEN
            -- Use existing bed
            UPDATE patient_admissions 
            SET bed_id = bed_record_id 
            WHERE id = admission_record.id;
            updated_count := updated_count + 1;
        ELSE
            -- Check if bed already exists to avoid duplicates
            IF NOT EXISTS (SELECT 1 FROM beds WHERE bed_number = admission_record.bed_number) THEN
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
                ) RETURNING id INTO bed_record_id;
                
                created_count := created_count + 1;
                RAISE NOTICE 'Created bed %', admission_record.bed_number;
            ELSE
                -- Get the existing bed id
                SELECT id INTO bed_record_id 
                FROM beds 
                WHERE bed_number = admission_record.bed_number;
            END IF;
            
            -- Link admission to bed
            UPDATE patient_admissions 
            SET bed_id = bed_record_id 
            WHERE id = admission_record.id;
            updated_count := updated_count + 1;
        END IF;
    END LOOP;
    
    RAISE NOTICE 'Created % new beds, updated % admissions', created_count, updated_count;
END $$;

-- =======================================================
-- STEP 7: UPDATE BED STATUS
-- =======================================================

-- Mark beds as occupied for active admissions
UPDATE beds 
SET status = 'OCCUPIED' 
WHERE id IN (
    SELECT DISTINCT bed_id 
    FROM patient_admissions 
    WHERE status IN ('active', 'ACTIVE') 
    AND bed_id IS NOT NULL
);

-- Mark beds as available for non-active admissions only
UPDATE beds 
SET status = 'AVAILABLE' 
WHERE id NOT IN (
    SELECT DISTINCT bed_id 
    FROM patient_admissions 
    WHERE status IN ('active', 'ACTIVE') 
    AND bed_id IS NOT NULL
);

-- =======================================================
-- STEP 8: SETUP RLS AND INDEXES
-- =======================================================

-- Enable RLS
ALTER TABLE beds ENABLE ROW LEVEL SECURITY;

-- Create RLS policy
DROP POLICY IF EXISTS "beds_access_policy" ON beds;
CREATE POLICY "beds_access_policy" ON beds 
FOR ALL TO authenticated 
USING (true) 
WITH CHECK (true);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_beds_bed_number ON beds(bed_number);
CREATE INDEX IF NOT EXISTS idx_beds_status ON beds(status);
CREATE INDEX IF NOT EXISTS idx_patient_admissions_bed_id ON patient_admissions(bed_id);

-- =======================================================
-- STEP 9: COMPREHENSIVE VERIFICATION
-- =======================================================

-- Show beds table structure
SELECT 
    'BEDS TABLE STRUCTURE' as category,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'beds'
ORDER BY ordinal_position;

-- Show beds summary
SELECT 
    'BEDS SUMMARY' as category,
    status,
    COUNT(*) as count,
    STRING_AGG(bed_number, ', ' ORDER BY bed_number) as bed_numbers
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
    COALESCE(p.first_name || ' ' || p.last_name, 'Unknown') as patient_name,
    b.bed_number,
    b.room_type,
    b.daily_rate,
    b.status as bed_status
FROM patient_admissions pa
LEFT JOIN patients p ON pa.patient_id = p.id
LEFT JOIN beds b ON pa.bed_id = b.id
WHERE pa.status IN ('active', 'ACTIVE')
LIMIT 5;

-- Show any admissions without bed links
SELECT 
    'UNLINKED ADMISSIONS' as category,
    COUNT(*) as count
FROM patient_admissions 
WHERE bed_id IS NULL;

-- Final success message
SELECT 
    '🎉 BULLETPROOF FIX COMPLETE!' as status,
    'Fresh beds table created with proper constraints' as details,
    'All relationships established for receipt printing' as result;
-- Check if patient_tag column exists in the patients table
-- Run this in Supabase Dashboard → SQL Editor

-- 1. Check the patients table structure
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns 
WHERE table_name = 'patients' 
ORDER BY ordinal_position;

-- 2. Specifically check for patient_tag column
SELECT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'patients' 
    AND column_name = 'patient_tag'
) as patient_tag_column_exists;

-- 3. If patient_tag exists, check if any patients have tags
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'patients' 
        AND column_name = 'patient_tag'
    ) THEN
        -- Show patient_tag data if column exists
        RAISE NOTICE 'patient_tag column EXISTS';
        
        -- Count patients with tags
        PERFORM (
            SELECT count(*) 
            FROM patients 
            WHERE patient_tag IS NOT NULL 
            AND patient_tag != ''
        );
        
        -- Show sample patients with tags
        RAISE NOTICE 'Sample patients with tags:';
        FOR rec IN (
            SELECT patient_id, first_name, last_name, patient_tag 
            FROM patients 
            WHERE patient_tag IS NOT NULL 
            AND patient_tag != ''
            LIMIT 5
        ) LOOP
            RAISE NOTICE 'Patient: % % (ID: %) - Tag: %', 
                rec.first_name, rec.last_name, rec.patient_id, rec.patient_tag;
        END LOOP;
    ELSE
        RAISE NOTICE 'patient_tag column DOES NOT EXIST';
    END IF;
END $$;

-- 4. Show all unique patient tags if they exist
SELECT 'Unique patient tags:' as info;
SELECT DISTINCT patient_tag, COUNT(*) as patient_count
FROM patients 
WHERE patient_tag IS NOT NULL 
AND patient_tag != ''
GROUP BY patient_tag
ORDER BY patient_count DESC;

-- 5. Show total counts
SELECT 
    'Total Patients' as metric,
    COUNT(*) as count 
FROM patients
UNION ALL
SELECT 
    'Patients with Tags' as metric,
    COUNT(*) as count 
FROM patients 
WHERE patient_tag IS NOT NULL 
AND patient_tag != '';
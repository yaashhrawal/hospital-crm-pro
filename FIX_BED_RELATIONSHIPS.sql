-- Fix bed relationships in patient_admissions table
-- Run this script in your Supabase SQL editor

-- First, let's check the current structure
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'patient_admissions' 
ORDER BY ordinal_position;

-- Check if foreign key constraint exists
SELECT
    tc.table_name, 
    tc.constraint_name, 
    tc.constraint_type, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM 
    information_schema.table_constraints AS tc 
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
  AND tc.table_name = 'patient_admissions';

-- Add foreign key constraint if it doesn't exist
-- This establishes the proper relationship for Supabase queries
DO $$ 
BEGIN
    -- Check if the constraint already exists
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_patient_admissions_bed_id'
          AND table_name = 'patient_admissions'
          AND constraint_type = 'FOREIGN KEY'
    ) THEN
        -- Add foreign key constraint
        ALTER TABLE patient_admissions 
        ADD CONSTRAINT fk_patient_admissions_bed_id 
        FOREIGN KEY (bed_id) REFERENCES beds(id) ON DELETE SET NULL;
        
        RAISE NOTICE 'Added foreign key constraint fk_patient_admissions_bed_id';
    ELSE
        RAISE NOTICE 'Foreign key constraint already exists';
    END IF;
END $$;

-- Verify the constraint was added
SELECT
    tc.table_name, 
    tc.constraint_name, 
    tc.constraint_type, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM 
    information_schema.table_constraints AS tc 
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
  AND tc.table_name = 'patient_admissions'
  AND tc.constraint_name = 'fk_patient_admissions_bed_id';

-- Test the relationship with a sample query
SELECT 
  pa.id,
  pa.patient_id,
  pa.bed_id,
  pa.status,
  b.bed_number,
  b.room_type,
  b.daily_rate
FROM patient_admissions pa
LEFT JOIN beds b ON pa.bed_id = b.id
LIMIT 5;

-- Refresh the schema cache (this helps with the relationship error)
NOTIFY pgrst, 'reload schema';
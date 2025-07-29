-- Add discharge_date column to patient_admissions table if it doesn't exist
-- Run this in your Supabase SQL Editor

ALTER TABLE patient_admissions 
ADD COLUMN IF NOT EXISTS discharge_date TIMESTAMP WITH TIME ZONE;

-- Also add discharge_notes column for basic notes
ALTER TABLE patient_admissions 
ADD COLUMN IF NOT EXISTS discharge_notes TEXT;

-- Verify the columns were added
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'patient_admissions' 
AND column_name IN ('discharge_date', 'discharge_notes');
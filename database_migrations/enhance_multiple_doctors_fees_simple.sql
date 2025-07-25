-- Simple Database Migration: Add Multiple Doctors Fee Support
-- This migration adds the essential consultation_fees column safely

-- Step 1: Add consultation_fees column to store individual doctor fees
-- This is a JSONB column that will store fee information for each doctor
ALTER TABLE patients 
ADD COLUMN IF NOT EXISTS consultation_fees JSONB DEFAULT NULL;

-- Step 2: Create index for better performance on consultation_fees queries
CREATE INDEX IF NOT EXISTS idx_patients_consultation_fees 
ON patients USING GIN (consultation_fees);

-- Step 3: Add column comment for documentation
COMMENT ON COLUMN patients.consultation_fees IS 'JSONB array storing individual doctor consultation fees for multiple doctor consultations. Format: [{"doctorName": "Dr. Smith", "department": "Cardiology", "fee": 500, "isPrimary": true}]';

-- Success message
DO $$
BEGIN
    RAISE NOTICE '✅ Database migration completed successfully!';
    RAISE NOTICE '📊 Added consultation_fees JSONB column with GIN index';
    RAISE NOTICE '🔄 All existing data remains functional and unchanged';
    RAISE NOTICE '🚀 Multiple doctor fee functionality is now enabled';
END $$;
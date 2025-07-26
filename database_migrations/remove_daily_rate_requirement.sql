-- Migration: Remove daily rate requirement from IPD system
-- Purpose: Transition from daily bed charges to service-based charging

-- Make daily_rate optional in beds table
ALTER TABLE beds 
ALTER COLUMN daily_rate DROP NOT NULL;

-- Make daily_rate optional in patient_admissions table
ALTER TABLE patient_admissions 
ALTER COLUMN daily_rate DROP NOT NULL;

-- Add comment to explain the change
COMMENT ON COLUMN beds.daily_rate IS 'Legacy field - now optional. Use service-based charging instead.';
COMMENT ON COLUMN patient_admissions.daily_rate IS 'Legacy field - now optional. Use service-based charging instead.';

-- Update any existing records with NULL daily_rate to 0 for backwards compatibility
UPDATE beds SET daily_rate = 0 WHERE daily_rate IS NULL;
UPDATE patient_admissions SET daily_rate = 0 WHERE daily_rate IS NULL;
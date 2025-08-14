-- Fix transaction_id NOT NULL constraint in patient_transactions table
-- This removes the NOT NULL constraint to match Valant's schema

-- First check the current constraint
SELECT column_name, is_nullable, column_default, data_type
FROM information_schema.columns 
WHERE table_name = 'patient_transactions' 
AND column_name = 'transaction_id';

-- Remove NOT NULL constraint from transaction_id
ALTER TABLE patient_transactions ALTER COLUMN transaction_id DROP NOT NULL;

-- Add default UUID generation if needed
ALTER TABLE patient_transactions ALTER COLUMN transaction_id SET DEFAULT gen_random_uuid();

-- Verify the change
SELECT column_name, is_nullable, column_default, data_type
FROM information_schema.columns 
WHERE table_name = 'patient_transactions' 
AND column_name = 'transaction_id';
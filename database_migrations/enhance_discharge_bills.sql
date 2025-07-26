-- Migration: Enhance discharge bills for service-based IPD system
-- Purpose: Add fields to support comprehensive billing with partial payments

-- Add new columns to discharge_bills table for comprehensive billing
ALTER TABLE discharge_bills 
ADD COLUMN IF NOT EXISTS existing_services DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS previous_payments DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS final_payment DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_paid DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS balance_amount DECIMAL(10,2) DEFAULT 0;

-- Add comments for new fields
COMMENT ON COLUMN discharge_bills.existing_services IS 'Total value of services rendered during IPD stay';
COMMENT ON COLUMN discharge_bills.previous_payments IS 'Sum of all partial payments made during stay';
COMMENT ON COLUMN discharge_bills.final_payment IS 'Final payment made at discharge';
COMMENT ON COLUMN discharge_bills.total_paid IS 'Total amount paid (previous + final)';
COMMENT ON COLUMN discharge_bills.balance_amount IS 'Outstanding balance (can be positive for dues or negative for refunds)';

-- Update existing records to have consistent data
UPDATE discharge_bills 
SET 
  existing_services = COALESCE(total_charges, 0),
  previous_payments = 0,
  final_payment = COALESCE(amount_paid, 0),
  total_paid = COALESCE(amount_paid, 0),
  balance_amount = COALESCE(net_amount, 0) - COALESCE(amount_paid, 0)
WHERE existing_services IS NULL;

-- Create index for better performance on bill queries
CREATE INDEX IF NOT EXISTS idx_discharge_bills_admission_patient 
ON discharge_bills(admission_id, patient_id);

CREATE INDEX IF NOT EXISTS idx_discharge_bills_balance 
ON discharge_bills(balance_amount) 
WHERE balance_amount != 0;
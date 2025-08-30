-- Add discount_percentage column to patient_transactions table
-- This column is needed for the discount functionality in EditPatientModal and NewFlexiblePatientEntry

-- Check if column already exists to avoid errors
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'patient_transactions' 
        AND column_name = 'discount_percentage'
    ) THEN
        -- Add discount_percentage column
        ALTER TABLE patient_transactions 
        ADD COLUMN discount_percentage NUMERIC(5,2) DEFAULT 0 CHECK (discount_percentage >= 0 AND discount_percentage <= 100);
        
        RAISE NOTICE 'Added discount_percentage column to patient_transactions table';
    ELSE
        RAISE NOTICE 'discount_percentage column already exists in patient_transactions table';
    END IF;
    
    -- Also add discount_reason column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'patient_transactions' 
        AND column_name = 'discount_reason'
    ) THEN
        ALTER TABLE patient_transactions 
        ADD COLUMN discount_reason TEXT;
        
        RAISE NOTICE 'Added discount_reason column to patient_transactions table';
    ELSE
        RAISE NOTICE 'discount_reason column already exists in patient_transactions table';
    END IF;
    
    -- Add transaction_date column if it doesn't exist (this is used in many places)
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'patient_transactions' 
        AND column_name = 'transaction_date'
    ) THEN
        ALTER TABLE patient_transactions 
        ADD COLUMN transaction_date DATE DEFAULT CURRENT_DATE;
        
        RAISE NOTICE 'Added transaction_date column to patient_transactions table';
    ELSE
        RAISE NOTICE 'transaction_date column already exists in patient_transactions table';
    END IF;
END $$;

-- Update existing records to have transaction_date from created_at if null
UPDATE patient_transactions 
SET transaction_date = DATE(created_at) 
WHERE transaction_date IS NULL AND created_at IS NOT NULL;

-- Add comments to document the columns
COMMENT ON COLUMN patient_transactions.discount_percentage IS 'Discount percentage applied to transaction (0-100)';
COMMENT ON COLUMN patient_transactions.discount_reason IS 'Reason for discount application';
COMMENT ON COLUMN patient_transactions.transaction_date IS 'Date when transaction occurred (separate from created_at timestamp)';
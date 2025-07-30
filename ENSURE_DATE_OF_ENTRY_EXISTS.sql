-- Comprehensive fix to ensure date_of_entry column exists and works properly

-- Step 1: Add the column if it doesn't exist
DO $$ 
BEGIN
    -- Check if the column exists
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'patients' 
        AND column_name = 'date_of_entry'
        AND table_schema = 'public'
    ) THEN
        -- Add the column
        ALTER TABLE patients ADD COLUMN date_of_entry DATE;
        RAISE NOTICE 'Added date_of_entry column to patients table';
        
        -- Update existing records to use created_at date as date_of_entry
        UPDATE patients 
        SET date_of_entry = DATE(created_at) 
        WHERE date_of_entry IS NULL;
        
        RAISE NOTICE 'Updated existing patients with date_of_entry from created_at';
    ELSE
        RAISE NOTICE 'date_of_entry column already exists';
    END IF;
END $$;

-- Step 2: Verify the column exists and show some sample data
SELECT 
    'Column exists' as status,
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'patients' 
AND column_name = 'date_of_entry'
AND table_schema = 'public';

-- Step 3: Show sample patient data
SELECT 
    patient_id,
    first_name,
    last_name,
    date_of_entry,
    DATE(created_at) as created_date,
    created_at
FROM patients 
ORDER BY created_at DESC 
LIMIT 5;
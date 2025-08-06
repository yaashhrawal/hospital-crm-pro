-- Add missing updated_at column to beds table

-- Add updated_at column if it doesn't exist
ALTER TABLE beds 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Add created_at column if it doesn't exist  
ALTER TABLE beds 
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Update existing rows to have timestamps
UPDATE beds 
SET 
    created_at = COALESCE(created_at, NOW()),
    updated_at = COALESCE(updated_at, NOW())
WHERE created_at IS NULL OR updated_at IS NULL;

-- Verify the columns exist
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'beds' 
AND column_name IN ('created_at', 'updated_at');

-- Test update to make sure it works
UPDATE beds SET updated_at = NOW() WHERE bed_number = '1';

SELECT 'SUCCESS: updated_at column added to beds table!' as status;
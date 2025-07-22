# EMERGENCY FIX: Patient Data Insertion Issue

## IMMEDIATE SOLUTION - Run in Supabase SQL Editor

Go to your Supabase Dashboard → SQL Editor and run these commands:

```sql
-- 1. First, check if RLS is enabled and causing issues
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'patients';

-- 2. Disable RLS temporarily to test (ONLY FOR TESTING)
ALTER TABLE patients DISABLE ROW LEVEL SECURITY;

-- 3. Test insert with minimal data
INSERT INTO patients (first_name, phone, gender, is_active) 
VALUES ('Test', '1234567890', 'MALE', true);

-- 4. If that works, re-enable RLS and add proper policies
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;

-- 5. Create proper RLS policies
DROP POLICY IF EXISTS "Allow authenticated reads on patients" ON patients;
DROP POLICY IF EXISTS "Allow authenticated inserts on patients" ON patients;
DROP POLICY IF EXISTS "Allow authenticated updates on patients" ON patients;

CREATE POLICY "Allow authenticated reads on patients" ON patients
    FOR SELECT USING (true);

CREATE POLICY "Allow authenticated inserts on patients" ON patients
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow authenticated updates on patients" ON patients
    FOR UPDATE USING (true);
```

## ALTERNATIVE: Quick Database Reset

If policies don't work, create a new table:

```sql
-- Create new patients table with proper structure
CREATE TABLE patients_new (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    first_name text NOT NULL,
    last_name text,
    phone text,
    address text,
    gender text DEFAULT 'MALE',
    date_of_birth date,
    emergency_contact_name text,
    emergency_contact_phone text,
    email text,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Disable RLS on new table
ALTER TABLE patients_new DISABLE ROW LEVEL SECURITY;

-- Copy data from old table (if any)
INSERT INTO patients_new SELECT * FROM patients;

-- Rename tables
ALTER TABLE patients RENAME TO patients_backup;
ALTER TABLE patients_new RENAME TO patients;
```

## FASTEST FIX: Use the Data Troubleshooting Tab

1. Go to Hospital CRM
2. Click "🔧 Data Troubleshooting" tab
3. Click "Test Table Access" first
4. Then click "Test Patient Creation"
5. If it fails, click "Fix RLS Policies"

The troubleshooting tab will show you the exact error message!
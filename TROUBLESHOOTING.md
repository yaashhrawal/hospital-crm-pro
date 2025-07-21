# Supabase Data Retrieval Troubleshooting Guide

## Current Issue: Cannot retrieve data from Supabase

### Potential Causes:

1. **Row Level Security (RLS) Policies**
   - Tables may have RLS enabled without proper policies
   - Authenticated users cannot read data without explicit policies

2. **Authentication Issues**
   - User not properly authenticated
   - Wrong user context for data access

3. **Environment Variables**
   - Incorrect Supabase URL or API keys
   - Missing environment variables

### Steps to Fix:

#### 1. Check RLS Policies in Supabase Dashboard

Go to your Supabase dashboard and check each table:

- **patients** table: RLS policies for SELECT
- **patient_transactions** table: RLS policies for SELECT  
- **daily_expenses** table: RLS policies for SELECT
- **users** table: RLS policies for SELECT
- **doctors** table: RLS policies for SELECT
- **departments** table: RLS policies for SELECT

#### 2. Required SQL Commands to Fix RLS:

Run these in your Supabase SQL Editor:

```sql
-- Enable RLS on tables (if not already enabled)
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE patient_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE doctors ENABLE ROW LEVEL SECURITY;
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;

-- Create policies to allow authenticated users to read all data
CREATE POLICY "Allow authenticated users to read patients" ON patients
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to read transactions" ON patient_transactions
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to read expenses" ON daily_expenses
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to read users" ON users
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to read doctors" ON doctors
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to read departments" ON departments
    FOR SELECT USING (auth.role() = 'authenticated');

-- Create policies to allow authenticated users to insert data
CREATE POLICY "Allow authenticated users to insert patients" ON patients
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to insert transactions" ON patient_transactions
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to insert expenses" ON daily_expenses
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Create policies to allow authenticated users to update data
CREATE POLICY "Allow authenticated users to update patients" ON patients
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to update transactions" ON patient_transactions
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to update expenses" ON daily_expenses
    FOR UPDATE USING (auth.role() = 'authenticated');
```

#### 3. Alternative: Temporarily Disable RLS (NOT RECOMMENDED FOR PRODUCTION)

If you want to quickly test without RLS:

```sql
-- DISABLE RLS (ONLY FOR TESTING)
ALTER TABLE patients DISABLE ROW LEVEL SECURITY;
ALTER TABLE patient_transactions DISABLE ROW LEVEL SECURITY;
ALTER TABLE daily_expenses DISABLE ROW LEVEL SECURITY;
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE doctors DISABLE ROW LEVEL SECURITY;
ALTER TABLE departments DISABLE ROW LEVEL SECURITY;
```

#### 4. Check Your Current Environment Variables

Make sure these are correctly set in your `.env` file:

```
VITE_SUPABASE_URL=https://sohvcmaxeimhvugawgfh.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNvaHZjbWF4ZWltaHZ1Z2F3Z2ZoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzc0NzEwMzIsImV4cCI6MjA1MzA0NzAzMn0.JHzQdHSs_9vBozBUOAPDtCMXFt8BcNGS9aCePcYKIQI
```

### Testing Steps:

1. **Open the Hospital CRM app** at http://localhost:3000
2. **Login** with admin@hospital.com / admin123
3. **Click "🧪 Database Test" tab**
4. **Check the test results** in the console
5. **Look for specific error messages** about RLS or permissions

### Most Likely Solution:

The issue is probably **Row Level Security policies**. You need to:

1. Go to your Supabase dashboard
2. Navigate to Authentication > Policies
3. Add the SELECT policies shown above for each table
4. Test the Database Test tab again

### Contact Claude if:

- RLS policies are correctly set but still can't read data
- Authentication is working but queries still fail
- You see specific error messages in the Database Test tab

---

## Quick Fix Commands

Copy and paste these in Supabase SQL Editor:

```sql
-- Quick fix for all tables
CREATE POLICY "Allow all authenticated reads on patients" ON patients FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Allow all authenticated reads on transactions" ON patient_transactions FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Allow all authenticated reads on expenses" ON daily_expenses FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Allow all authenticated reads on users" ON users FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Allow all authenticated reads on doctors" ON doctors FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Allow all authenticated reads on departments" ON departments FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow all authenticated inserts on patients" ON patients FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Allow all authenticated inserts on transactions" ON patient_transactions FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Allow all authenticated inserts on expenses" ON daily_expenses FOR INSERT WITH CHECK (auth.role() = 'authenticated');
```
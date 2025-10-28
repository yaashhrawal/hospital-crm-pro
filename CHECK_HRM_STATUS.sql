-- =====================================================
-- CHECK HRM MODULE STATUS
-- Run this to diagnose the issue
-- =====================================================

-- 1. Check if HRM tables exist
SELECT
  table_name,
  'EXISTS' as status
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN (
    'employees',
    'employee_departments',
    'employee_roles',
    'employee_attendance',
    'leave_types',
    'employee_leaves'
  )
ORDER BY table_name;

-- 2. Check hospitals table
SELECT
  'Hospital ID' as info,
  id,
  name
FROM hospitals
LIMIT 1;

-- 3. Count employees (if table exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'employees') THEN
    RAISE NOTICE 'Employees table exists';
    PERFORM pg_sleep(0.1);
  ELSE
    RAISE NOTICE 'Employees table DOES NOT exist - You need to run SETUP_HRM_TABLES_SIMPLE.sql';
  END IF;
END $$;

-- 4. Show all employees (if any)
SELECT
  'All Employees' as report,
  employee_id,
  first_name || ' ' || last_name as name,
  email,
  phone,
  is_active,
  hospital_id,
  created_at
FROM employees
ORDER BY created_at DESC;

-- 5. Check employee count by hospital
SELECT
  'Employee Count by Hospital' as report,
  hospital_id,
  COUNT(*) as employee_count
FROM employees
GROUP BY hospital_id;

-- 6. Check if the expected hospital ID exists
SELECT
  CASE
    WHEN EXISTS (SELECT 1 FROM employees WHERE hospital_id = '550e8400-e29b-41d4-a716-446655440000') THEN
      'Employees found for hospital 550e8400-e29b-41d4-a716-446655440000'
    ELSE
      'NO employees found for hospital 550e8400-e29b-41d4-a716-446655440000'
  END as status;

-- =====================================================
-- SIMPLE HRM SETUP - Essential Tables Only
-- Run this in your Supabase SQL Editor
-- =====================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Get the hospital ID
DO $$
DECLARE
  v_hospital_id UUID;
BEGIN
  -- Get first hospital ID or use the default
  SELECT id INTO v_hospital_id FROM hospitals LIMIT 1;

  IF v_hospital_id IS NULL THEN
    v_hospital_id := '550e8400-e29b-41d4-a716-446655440000';
  END IF;

  RAISE NOTICE 'Using Hospital ID: %', v_hospital_id;
END $$;

-- =====================================================
-- 1. EMPLOYEE DEPARTMENTS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS employee_departments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  hospital_id UUID NOT NULL,
  department_name VARCHAR(100) NOT NULL,
  department_code VARCHAR(20) UNIQUE NOT NULL,
  description TEXT,
  head_employee_id UUID,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 2. EMPLOYEE ROLES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS employee_roles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  hospital_id UUID NOT NULL,
  role_name VARCHAR(100) NOT NULL,
  role_code VARCHAR(20) UNIQUE NOT NULL,
  description TEXT,
  permissions JSONB DEFAULT '[]'::jsonb,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 3. EMPLOYEES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS employees (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  hospital_id UUID NOT NULL,
  employee_id VARCHAR(50) UNIQUE NOT NULL,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(20),
  alternate_phone VARCHAR(20),
  date_of_birth DATE,
  gender VARCHAR(20),
  blood_group VARCHAR(10),
  address TEXT,
  city VARCHAR(100),
  state VARCHAR(100),
  pincode VARCHAR(10),
  emergency_contact_name VARCHAR(200),
  emergency_contact_phone VARCHAR(20),
  emergency_contact_relation VARCHAR(50),

  -- Employment Details
  department_id UUID REFERENCES employee_departments(id),
  role_id UUID REFERENCES employee_roles(id),
  designation VARCHAR(100),
  joining_date DATE NOT NULL,
  resignation_date DATE,
  employment_type VARCHAR(50) DEFAULT 'Full-Time',
  work_location VARCHAR(100),
  reporting_manager_id UUID REFERENCES employees(id),

  -- Salary Details
  basic_salary DECIMAL(10, 2) DEFAULT 0,
  hra DECIMAL(10, 2) DEFAULT 0,
  allowances DECIMAL(10, 2) DEFAULT 0,
  bank_name VARCHAR(100),
  account_number VARCHAR(50),
  ifsc_code VARCHAR(20),
  pan_number VARCHAR(20),

  -- Status
  is_active BOOLEAN DEFAULT true,
  termination_reason TEXT,
  notes TEXT,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID,
  updated_by UUID
);

-- =====================================================
-- 4. EMPLOYEE ATTENDANCE TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS employee_attendance (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  hospital_id UUID NOT NULL,
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  attendance_date DATE NOT NULL,
  check_in_time TIMESTAMP WITH TIME ZONE,
  check_out_time TIMESTAMP WITH TIME ZONE,
  total_hours DECIMAL(4, 2),
  status VARCHAR(20) DEFAULT 'Present',
  is_late BOOLEAN DEFAULT false,
  late_by_minutes INTEGER DEFAULT 0,
  notes TEXT,
  marked_by UUID,
  location VARCHAR(100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  UNIQUE(employee_id, attendance_date)
);

-- =====================================================
-- 5. LEAVE TYPES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS leave_types (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  hospital_id UUID NOT NULL,
  leave_name VARCHAR(100) NOT NULL,
  leave_code VARCHAR(20) UNIQUE NOT NULL,
  description TEXT,
  max_days_per_year INTEGER DEFAULT 0,
  is_paid BOOLEAN DEFAULT true,
  requires_approval BOOLEAN DEFAULT true,
  color VARCHAR(20) DEFAULT '#3b82f6',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 6. EMPLOYEE LEAVES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS employee_leaves (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  hospital_id UUID NOT NULL,
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  leave_type_id UUID NOT NULL REFERENCES leave_types(id),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  total_days INTEGER NOT NULL,
  reason TEXT NOT NULL,
  status VARCHAR(20) DEFAULT 'Pending',
  approved_by UUID REFERENCES employees(id),
  approved_at TIMESTAMP WITH TIME ZONE,
  rejection_reason TEXT,
  notes TEXT,
  emergency_contact VARCHAR(200),
  attachments JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- CREATE INDEXES
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_employees_hospital ON employees(hospital_id);
CREATE INDEX IF NOT EXISTS idx_employees_active ON employees(is_active);
CREATE INDEX IF NOT EXISTS idx_attendance_employee ON employee_attendance(employee_id);
CREATE INDEX IF NOT EXISTS idx_attendance_date ON employee_attendance(attendance_date);

-- =====================================================
-- INSERT DEFAULT DATA
-- =====================================================

-- Default Departments
INSERT INTO employee_departments (hospital_id, department_name, department_code, description)
SELECT
  (SELECT id FROM hospitals LIMIT 1),
  'Medical',
  'MED',
  'Medical staff including doctors and specialists'
WHERE NOT EXISTS (SELECT 1 FROM employee_departments WHERE department_code = 'MED');

INSERT INTO employee_departments (hospital_id, department_name, department_code, description)
SELECT
  (SELECT id FROM hospitals LIMIT 1),
  'Nursing',
  'NUR',
  'Nursing staff and care assistants'
WHERE NOT EXISTS (SELECT 1 FROM employee_departments WHERE department_code = 'NUR');

INSERT INTO employee_departments (hospital_id, department_name, department_code, description)
SELECT
  (SELECT id FROM hospitals LIMIT 1),
  'Administration',
  'ADM',
  'Administrative and management staff'
WHERE NOT EXISTS (SELECT 1 FROM employee_departments WHERE department_code = 'ADM');

-- Default Roles
INSERT INTO employee_roles (hospital_id, role_name, role_code, description, permissions)
SELECT
  (SELECT id FROM hospitals LIMIT 1),
  'Doctor',
  'DOC',
  'Medical doctors and specialists',
  '["view_patients", "manage_prescriptions"]'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM employee_roles WHERE role_code = 'DOC');

INSERT INTO employee_roles (hospital_id, role_name, role_code, description, permissions)
SELECT
  (SELECT id FROM hospitals LIMIT 1),
  'Nurse',
  'NUR',
  'Registered nurses and care staff',
  '["view_patients", "update_vitals"]'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM employee_roles WHERE role_code = 'NUR');

INSERT INTO employee_roles (hospital_id, role_name, role_code, description, permissions)
SELECT
  (SELECT id FROM hospitals LIMIT 1),
  'Administrator',
  'ADM',
  'Hospital administrators',
  '["full_access"]'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM employee_roles WHERE role_code = 'ADM');

-- Default Leave Types
INSERT INTO leave_types (hospital_id, leave_name, leave_code, description, max_days_per_year, is_paid, color)
SELECT
  (SELECT id FROM hospitals LIMIT 1),
  'Casual Leave',
  'CL',
  'Casual/Sick leave for personal matters',
  12,
  true,
  '#3b82f6'
WHERE NOT EXISTS (SELECT 1 FROM leave_types WHERE leave_code = 'CL');

INSERT INTO leave_types (hospital_id, leave_name, leave_code, description, max_days_per_year, is_paid, color)
SELECT
  (SELECT id FROM hospitals LIMIT 1),
  'Sick Leave',
  'SL',
  'Medical leave with certificate',
  10,
  true,
  '#ef4444'
WHERE NOT EXISTS (SELECT 1 FROM leave_types WHERE leave_code = 'SL');

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- Check if tables were created
SELECT
  'Tables Created' as status,
  COUNT(*) as table_count
FROM information_schema.tables
WHERE table_name IN ('employees', 'employee_departments', 'employee_roles', 'employee_attendance', 'leave_types', 'employee_leaves');

-- Check employee count
SELECT 'Employee Count' as status, COUNT(*) as count FROM employees;

-- Check department count
SELECT 'Department Count' as status, COUNT(*) as count FROM employee_departments;

-- Check role count
SELECT 'Role Count' as status, COUNT(*) as count FROM employee_roles;

-- Show any existing employees
SELECT
  employee_id,
  first_name,
  last_name,
  email,
  is_active,
  created_at
FROM employees
ORDER BY created_at DESC
LIMIT 10;

-- =====================================================
-- HRM MODULE DATABASE SCHEMA
-- Hospital CRM Pro - Human Resource Management
-- =====================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- 1. EMPLOYEE DEPARTMENTS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS employee_departments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  hospital_id UUID NOT NULL,
  department_name VARCHAR(100) NOT NULL,
  department_code VARCHAR(20) UNIQUE NOT NULL,
  description TEXT,
  head_employee_id UUID, -- References employees table
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
  permissions JSONB DEFAULT '[]'::jsonb, -- Array of permission strings
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
  employee_id VARCHAR(50) UNIQUE NOT NULL, -- Custom employee ID (e.g., EMP001)
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  email VARCHAR(255) UNIQUE,
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
  employment_type VARCHAR(50) DEFAULT 'Full-Time', -- Full-Time, Part-Time, Contract, Intern
  work_location VARCHAR(100),
  reporting_manager_id UUID REFERENCES employees(id),

  -- Salary Details
  basic_salary DECIMAL(10, 2) DEFAULT 0,
  hra DECIMAL(10, 2) DEFAULT 0,
  allowances DECIMAL(10, 2) DEFAULT 0,
  gross_salary DECIMAL(10, 2) GENERATED ALWAYS AS (basic_salary + hra + allowances) STORED,
  bank_name VARCHAR(100),
  account_number VARCHAR(50),
  ifsc_code VARCHAR(20),
  pan_number VARCHAR(20),

  -- Documents
  photo_url TEXT,
  resume_url TEXT,
  id_proof_url TEXT,
  address_proof_url TEXT,
  documents JSONB DEFAULT '[]'::jsonb, -- Array of document objects

  -- Status
  is_active BOOLEAN DEFAULT true,
  termination_reason TEXT,
  notes TEXT,

  -- Integration with existing system
  linked_doctor_id UUID, -- If employee is a doctor, link to doctors table
  user_id UUID, -- Link to auth users if they have system access

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
  total_hours DECIMAL(4, 2), -- Calculated working hours
  status VARCHAR(20) DEFAULT 'Present', -- Present, Absent, Half-Day, Leave, Holiday
  is_late BOOLEAN DEFAULT false,
  late_by_minutes INTEGER DEFAULT 0,
  notes TEXT,
  marked_by UUID, -- Employee ID who marked the attendance
  location VARCHAR(100), -- Work location for the day
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
  color VARCHAR(20) DEFAULT '#3b82f6', -- For calendar display
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
  status VARCHAR(20) DEFAULT 'Pending', -- Pending, Approved, Rejected, Cancelled
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
-- 7. EMPLOYEE LEAVE BALANCE TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS employee_leave_balance (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  hospital_id UUID NOT NULL,
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  leave_type_id UUID NOT NULL REFERENCES leave_types(id),
  year INTEGER NOT NULL,
  total_allocated INTEGER DEFAULT 0,
  used INTEGER DEFAULT 0,
  balance INTEGER GENERATED ALWAYS AS (total_allocated - used) STORED,
  carried_forward INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  UNIQUE(employee_id, leave_type_id, year)
);

-- =====================================================
-- 8. EMPLOYEE PAYROLL TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS employee_payroll (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  hospital_id UUID NOT NULL,
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  month INTEGER NOT NULL CHECK (month >= 1 AND month <= 12),
  year INTEGER NOT NULL,

  -- Earnings
  basic_salary DECIMAL(10, 2) DEFAULT 0,
  hra DECIMAL(10, 2) DEFAULT 0,
  allowances DECIMAL(10, 2) DEFAULT 0,
  bonus DECIMAL(10, 2) DEFAULT 0,
  overtime_pay DECIMAL(10, 2) DEFAULT 0,
  other_earnings DECIMAL(10, 2) DEFAULT 0,
  gross_salary DECIMAL(10, 2) GENERATED ALWAYS AS (
    basic_salary + hra + allowances + bonus + overtime_pay + other_earnings
  ) STORED,

  -- Deductions
  pf_deduction DECIMAL(10, 2) DEFAULT 0,
  esi_deduction DECIMAL(10, 2) DEFAULT 0,
  tax_deduction DECIMAL(10, 2) DEFAULT 0,
  loan_deduction DECIMAL(10, 2) DEFAULT 0,
  other_deductions DECIMAL(10, 2) DEFAULT 0,
  total_deductions DECIMAL(10, 2) GENERATED ALWAYS AS (
    pf_deduction + esi_deduction + tax_deduction + loan_deduction + other_deductions
  ) STORED,

  -- Net Salary
  net_salary DECIMAL(10, 2) GENERATED ALWAYS AS (
    basic_salary + hra + allowances + bonus + overtime_pay + other_earnings -
    (pf_deduction + esi_deduction + tax_deduction + loan_deduction + other_deductions)
  ) STORED,

  -- Payment Details
  payment_date DATE,
  payment_mode VARCHAR(50), -- Bank Transfer, Cash, Cheque
  payment_reference VARCHAR(100),
  status VARCHAR(20) DEFAULT 'Pending', -- Pending, Processed, Paid

  -- Metadata
  working_days INTEGER DEFAULT 0,
  present_days INTEGER DEFAULT 0,
  leave_days INTEGER DEFAULT 0,
  overtime_hours DECIMAL(6, 2) DEFAULT 0,
  notes TEXT,
  payslip_url TEXT,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  processed_by UUID,

  UNIQUE(employee_id, month, year)
);

-- =====================================================
-- 9. EMPLOYEE PERFORMANCE REVIEWS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS employee_performance (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  hospital_id UUID NOT NULL,
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  review_period_start DATE NOT NULL,
  review_period_end DATE NOT NULL,
  reviewer_id UUID NOT NULL REFERENCES employees(id),

  -- Ratings (1-5 scale)
  technical_skills_rating INTEGER CHECK (technical_skills_rating >= 1 AND technical_skills_rating <= 5),
  communication_rating INTEGER CHECK (communication_rating >= 1 AND communication_rating <= 5),
  teamwork_rating INTEGER CHECK (teamwork_rating >= 1 AND teamwork_rating <= 5),
  punctuality_rating INTEGER CHECK (punctuality_rating >= 1 AND punctuality_rating <= 5),
  initiative_rating INTEGER CHECK (initiative_rating >= 1 AND initiative_rating <= 5),
  overall_rating INTEGER CHECK (overall_rating >= 1 AND overall_rating <= 5),

  -- Comments
  strengths TEXT,
  areas_for_improvement TEXT,
  achievements TEXT,
  goals_for_next_period TEXT,
  reviewer_comments TEXT,
  employee_comments TEXT,

  -- Status
  status VARCHAR(20) DEFAULT 'Draft', -- Draft, Submitted, Acknowledged
  acknowledged_at TIMESTAMP WITH TIME ZONE,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 10. EMPLOYEE SCHEDULES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS employee_schedules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  hospital_id UUID NOT NULL,
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  schedule_date DATE NOT NULL,
  shift_start_time TIME NOT NULL,
  shift_end_time TIME NOT NULL,
  shift_type VARCHAR(50), -- Morning, Evening, Night, Rotating
  location VARCHAR(100),
  notes TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID,

  UNIQUE(employee_id, schedule_date)
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

-- Employees
CREATE INDEX IF NOT EXISTS idx_employees_hospital ON employees(hospital_id);
CREATE INDEX IF NOT EXISTS idx_employees_department ON employees(department_id);
CREATE INDEX IF NOT EXISTS idx_employees_role ON employees(role_id);
CREATE INDEX IF NOT EXISTS idx_employees_active ON employees(is_active);
CREATE INDEX IF NOT EXISTS idx_employees_email ON employees(email);

-- Attendance
CREATE INDEX IF NOT EXISTS idx_attendance_employee ON employee_attendance(employee_id);
CREATE INDEX IF NOT EXISTS idx_attendance_date ON employee_attendance(attendance_date);
CREATE INDEX IF NOT EXISTS idx_attendance_hospital ON employee_attendance(hospital_id);

-- Leaves
CREATE INDEX IF NOT EXISTS idx_leaves_employee ON employee_leaves(employee_id);
CREATE INDEX IF NOT EXISTS idx_leaves_status ON employee_leaves(status);
CREATE INDEX IF NOT EXISTS idx_leaves_dates ON employee_leaves(start_date, end_date);

-- Payroll
CREATE INDEX IF NOT EXISTS idx_payroll_employee ON employee_payroll(employee_id);
CREATE INDEX IF NOT EXISTS idx_payroll_month_year ON employee_payroll(month, year);
CREATE INDEX IF NOT EXISTS idx_payroll_status ON employee_payroll(status);

-- =====================================================
-- INSERT DEFAULT DATA
-- =====================================================

-- Default Leave Types
INSERT INTO leave_types (hospital_id, leave_name, leave_code, description, max_days_per_year, is_paid, color)
VALUES
  ((SELECT id FROM hospitals LIMIT 1), 'Casual Leave', 'CL', 'Casual/Sick leave for personal matters', 12, true, '#3b82f6'),
  ((SELECT id FROM hospitals LIMIT 1), 'Sick Leave', 'SL', 'Medical leave with certificate', 10, true, '#ef4444'),
  ((SELECT id FROM hospitals LIMIT 1), 'Earned Leave', 'EL', 'Earned/Privileged leave', 15, true, '#10b981'),
  ((SELECT id FROM hospitals LIMIT 1), 'Maternity Leave', 'ML', 'Maternity leave for female employees', 180, true, '#f59e0b'),
  ((SELECT id FROM hospitals LIMIT 1), 'Paternity Leave', 'PL', 'Paternity leave for male employees', 7, true, '#8b5cf6'),
  ((SELECT id FROM hospitals LIMIT 1), 'Unpaid Leave', 'UL', 'Leave without pay', 30, false, '#6b7280')
ON CONFLICT (leave_code) DO NOTHING;

-- Default Departments
INSERT INTO employee_departments (hospital_id, department_name, department_code, description)
VALUES
  ((SELECT id FROM hospitals LIMIT 1), 'Medical', 'MED', 'Medical staff including doctors and specialists'),
  ((SELECT id FROM hospitals LIMIT 1), 'Nursing', 'NUR', 'Nursing staff and care assistants'),
  ((SELECT id FROM hospitals LIMIT 1), 'Administration', 'ADM', 'Administrative and management staff'),
  ((SELECT id FROM hospitals LIMIT 1), 'Support', 'SUP', 'Support staff including housekeeping and maintenance'),
  ((SELECT id FROM hospitals LIMIT 1), 'Pharmacy', 'PHR', 'Pharmacy department'),
  ((SELECT id FROM hospitals LIMIT 1), 'Laboratory', 'LAB', 'Laboratory and diagnostic services'),
  ((SELECT id FROM hospitals LIMIT 1), 'Reception', 'REC', 'Front desk and reception staff')
ON CONFLICT (department_code) DO NOTHING;

-- Default Roles
INSERT INTO employee_roles (hospital_id, role_name, role_code, description, permissions)
VALUES
  ((SELECT id FROM hospitals LIMIT 1), 'Doctor', 'DOC', 'Medical doctors and specialists', '["view_patients", "manage_prescriptions", "view_reports"]'::jsonb),
  ((SELECT id FROM hospitals LIMIT 1), 'Nurse', 'NUR', 'Registered nurses and care staff', '["view_patients", "update_vitals", "view_schedules"]'::jsonb),
  ((SELECT id FROM hospitals LIMIT 1), 'Administrator', 'ADM', 'Hospital administrators', '["full_access"]'::jsonb),
  ((SELECT id FROM hospitals LIMIT 1), 'Receptionist', 'REC', 'Front desk staff', '["patient_registration", "appointments", "billing"]'::jsonb),
  ((SELECT id FROM hospitals LIMIT 1), 'Pharmacist', 'PHR', 'Pharmacy staff', '["manage_medicines", "dispense_prescriptions"]'::jsonb),
  ((SELECT id FROM hospitals LIMIT 1), 'Lab Technician', 'LAB', 'Laboratory technicians', '["manage_tests", "upload_results"]'::jsonb)
ON CONFLICT (role_code) DO NOTHING;

-- =====================================================
-- TRIGGERS FOR AUTO-UPDATE TIMESTAMPS
-- =====================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply triggers
CREATE TRIGGER update_employees_updated_at BEFORE UPDATE ON employees
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_attendance_updated_at BEFORE UPDATE ON employee_attendance
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_leaves_updated_at BEFORE UPDATE ON employee_leaves
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payroll_updated_at BEFORE UPDATE ON employee_payroll
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_departments_updated_at BEFORE UPDATE ON employee_departments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_roles_updated_at BEFORE UPDATE ON employee_roles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- COMMENTS FOR DOCUMENTATION
-- =====================================================

COMMENT ON TABLE employees IS 'Core employee information and employment details';
COMMENT ON TABLE employee_attendance IS 'Daily attendance tracking for all employees';
COMMENT ON TABLE employee_leaves IS 'Leave applications and approvals';
COMMENT ON TABLE employee_payroll IS 'Monthly payroll processing and salary disbursement';
COMMENT ON TABLE employee_performance IS 'Performance reviews and ratings';
COMMENT ON TABLE employee_schedules IS 'Employee work schedules and shifts';

-- =====================================================
-- END OF HRM SCHEMA
-- =====================================================

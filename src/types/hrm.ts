// =====================================================
// HRM MODULE TYPE DEFINITIONS
// Hospital CRM Pro - Human Resource Management
// =====================================================

export interface Employee {
  id: string;
  hospital_id: string;
  employee_id: string; // Custom employee ID (e.g., EMP001)
  first_name: string;
  last_name: string;
  email?: string;
  phone?: string;
  alternate_phone?: string;
  date_of_birth?: string;
  gender?: 'Male' | 'Female' | 'Other';
  blood_group?: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  emergency_contact_relation?: string;

  // Employment Details
  department_id?: string;
  role_id?: string;
  designation?: string;
  joining_date: string;
  resignation_date?: string;
  employment_type?: 'Full-Time' | 'Part-Time' | 'Contract' | 'Intern';
  work_location?: string;
  reporting_manager_id?: string;

  // Salary Details
  basic_salary?: number;
  hra?: number;
  allowances?: number;
  gross_salary?: number;
  bank_name?: string;
  account_number?: string;
  ifsc_code?: string;
  pan_number?: string;

  // Documents
  photo_url?: string;
  resume_url?: string;
  id_proof_url?: string;
  address_proof_url?: string;
  documents?: DocumentInfo[];

  // Status
  is_active: boolean;
  termination_reason?: string;
  notes?: string;

  // Integration
  linked_doctor_id?: string;
  user_id?: string;

  // Metadata
  created_at: string;
  updated_at: string;
  created_by?: string;
  updated_by?: string;

  // Joined data (populated via queries)
  department?: EmployeeDepartment;
  role?: EmployeeRole;
  reporting_manager?: Employee;
}

export interface EmployeeDepartment {
  id: string;
  hospital_id: string;
  department_name: string;
  department_code: string;
  description?: string;
  head_employee_id?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface EmployeeRole {
  id: string;
  hospital_id: string;
  role_name: string;
  role_code: string;
  description?: string;
  permissions: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface EmployeeAttendance {
  id: string;
  hospital_id: string;
  employee_id: string;
  attendance_date: string;
  check_in_time?: string;
  check_out_time?: string;
  total_hours?: number;
  status: 'Present' | 'Absent' | 'Half-Day' | 'Leave' | 'Holiday';
  is_late: boolean;
  late_by_minutes: number;
  notes?: string;
  marked_by?: string;
  location?: string;
  created_at: string;
  updated_at: string;

  // Joined data
  employee?: Employee;
}

export interface LeaveType {
  id: string;
  hospital_id: string;
  leave_name: string;
  leave_code: string;
  description?: string;
  max_days_per_year: number;
  is_paid: boolean;
  requires_approval: boolean;
  color: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface EmployeeLeave {
  id: string;
  hospital_id: string;
  employee_id: string;
  leave_type_id: string;
  start_date: string;
  end_date: string;
  total_days: number;
  reason: string;
  status: 'Pending' | 'Approved' | 'Rejected' | 'Cancelled';
  approved_by?: string;
  approved_at?: string;
  rejection_reason?: string;
  notes?: string;
  emergency_contact?: string;
  attachments?: DocumentInfo[];
  created_at: string;
  updated_at: string;

  // Joined data
  employee?: Employee;
  leave_type?: LeaveType;
  approver?: Employee;
}

export interface EmployeeLeaveBalance {
  id: string;
  hospital_id: string;
  employee_id: string;
  leave_type_id: string;
  year: number;
  total_allocated: number;
  used: number;
  balance: number;
  carried_forward: number;
  created_at: string;
  updated_at: string;

  // Joined data
  leave_type?: LeaveType;
}

export interface EmployeePayroll {
  id: string;
  hospital_id: string;
  employee_id: string;
  month: number;
  year: number;

  // Earnings
  basic_salary: number;
  hra: number;
  allowances: number;
  bonus: number;
  overtime_pay: number;
  other_earnings: number;
  gross_salary: number;

  // Deductions
  pf_deduction: number;
  esi_deduction: number;
  tax_deduction: number;
  loan_deduction: number;
  other_deductions: number;
  total_deductions: number;

  // Net Salary
  net_salary: number;

  // Payment Details
  payment_date?: string;
  payment_mode?: 'Bank Transfer' | 'Cash' | 'Cheque';
  payment_reference?: string;
  status: 'Pending' | 'Processed' | 'Paid';

  // Metadata
  working_days: number;
  present_days: number;
  leave_days: number;
  overtime_hours: number;
  notes?: string;
  payslip_url?: string;

  created_at: string;
  updated_at: string;
  processed_by?: string;

  // Joined data
  employee?: Employee;
}

export interface EmployeePerformance {
  id: string;
  hospital_id: string;
  employee_id: string;
  review_period_start: string;
  review_period_end: string;
  reviewer_id: string;

  // Ratings (1-5)
  technical_skills_rating?: number;
  communication_rating?: number;
  teamwork_rating?: number;
  punctuality_rating?: number;
  initiative_rating?: number;
  overall_rating?: number;

  // Comments
  strengths?: string;
  areas_for_improvement?: string;
  achievements?: string;
  goals_for_next_period?: string;
  reviewer_comments?: string;
  employee_comments?: string;

  // Status
  status: 'Draft' | 'Submitted' | 'Acknowledged';
  acknowledged_at?: string;

  created_at: string;
  updated_at: string;

  // Joined data
  employee?: Employee;
  reviewer?: Employee;
}

export interface EmployeeSchedule {
  id: string;
  hospital_id: string;
  employee_id: string;
  schedule_date: string;
  shift_start_time: string;
  shift_end_time: string;
  shift_type?: 'Morning' | 'Evening' | 'Night' | 'Rotating';
  location?: string;
  notes?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  created_by?: string;

  // Joined data
  employee?: Employee;
}

export interface DocumentInfo {
  name: string;
  url: string;
  type: string;
  uploaded_at: string;
}

// =====================================================
// FORM TYPES FOR DATA INPUT
// =====================================================

export interface EmployeeFormData {
  employee_id: string;
  first_name: string;
  last_name: string;
  email?: string;
  phone?: string;
  alternate_phone?: string;
  date_of_birth?: string;
  gender?: string;
  blood_group?: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  emergency_contact_relation?: string;
  department_id?: string;
  role_id?: string;
  designation?: string;
  joining_date: string;
  employment_type?: string;
  work_location?: string;
  reporting_manager_id?: string;
  basic_salary?: number;
  hra?: number;
  allowances?: number;
  bank_name?: string;
  account_number?: string;
  ifsc_code?: string;
  pan_number?: string;
  notes?: string;
}

export interface AttendanceFormData {
  employee_id: string;
  attendance_date: string;
  check_in_time?: string;
  check_out_time?: string;
  status: string;
  notes?: string;
  location?: string;
}

export interface LeaveFormData {
  employee_id: string;
  leave_type_id: string;
  start_date: string;
  end_date: string;
  reason: string;
  emergency_contact?: string;
}

export interface PayrollFormData {
  employee_id: string;
  month: number;
  year: number;
  bonus?: number;
  overtime_pay?: number;
  other_earnings?: number;
  pf_deduction?: number;
  esi_deduction?: number;
  tax_deduction?: number;
  loan_deduction?: number;
  other_deductions?: number;
  payment_date?: string;
  payment_mode?: string;
  payment_reference?: string;
  notes?: string;
}

// =====================================================
// STATISTICS AND DASHBOARD TYPES
// =====================================================

export interface HRMDashboardStats {
  total_employees: number;
  active_employees: number;
  present_today: number;
  absent_today: number;
  on_leave_today: number;
  pending_leave_requests: number;
  departments_count: number;
  new_joinings_this_month: number;
  resignations_this_month: number;
}

export interface AttendanceSummary {
  date: string;
  total_employees: number;
  present: number;
  absent: number;
  on_leave: number;
  half_day: number;
  attendance_percentage: number;
}

export interface DepartmentStats {
  department_id: string;
  department_name: string;
  total_employees: number;
  active_employees: number;
  average_salary: number;
}

export interface LeaveStats {
  leave_type: string;
  total_requests: number;
  approved: number;
  pending: number;
  rejected: number;
}

// =====================================================
// FILTER AND SEARCH TYPES
// =====================================================

export interface EmployeeFilters {
  department_id?: string;
  role_id?: string;
  employment_type?: string;
  is_active?: boolean;
  search?: string;
}

export interface AttendanceFilters {
  employee_id?: string;
  department_id?: string;
  start_date?: string;
  end_date?: string;
  status?: string;
}

export interface LeaveFilters {
  employee_id?: string;
  leave_type_id?: string;
  status?: string;
  start_date?: string;
  end_date?: string;
}

export interface PayrollFilters {
  employee_id?: string;
  department_id?: string;
  month?: number;
  year?: number;
  status?: string;
}

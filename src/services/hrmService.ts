// =====================================================
// HRM SERVICE LAYER
// Hospital CRM Pro - Human Resource Management
// =====================================================

import { supabase, HOSPITAL_ID } from '../config/supabaseNew';
import type {
  Employee,
  EmployeeFormData,
  EmployeeDepartment,
  EmployeeRole,
  EmployeeAttendance,
  AttendanceFormData,
  EmployeeLeave,
  LeaveFormData,
  LeaveType,
  EmployeeLeaveBalance,
  EmployeePayroll,
  PayrollFormData,
  EmployeePerformance,
  EmployeeSchedule,
  HRMDashboardStats,
  AttendanceSummary,
  EmployeeFilters,
  AttendanceFilters,
  LeaveFilters,
  PayrollFilters,
} from '../types/hrm';

class HRMService {
  // =====================================================
  // EMPLOYEE MANAGEMENT
  // =====================================================

  /**
   * Get all employees with optional filtering
   */
  async getEmployees(filters?: EmployeeFilters): Promise<Employee[]> {
    try {
      console.log('🔍 HRM: Fetching employees with filters:', filters);
      console.log('🔍 HRM: Hospital ID:', HOSPITAL_ID);

      // First, try to fetch basic employee data without joins
      let query = supabase
        .from('employees')
        .select('*')
        .eq('hospital_id', HOSPITAL_ID)
        .order('created_at', { ascending: false });

      // Apply filters
      if (filters?.department_id) {
        query = query.eq('department_id', filters.department_id);
      }
      if (filters?.role_id) {
        query = query.eq('role_id', filters.role_id);
      }
      if (filters?.employment_type) {
        query = query.eq('employment_type', filters.employment_type);
      }
      if (filters?.is_active !== undefined) {
        query = query.eq('is_active', filters.is_active);
      }
      if (filters?.search) {
        query = query.or(`first_name.ilike.%${filters.search}%,last_name.ilike.%${filters.search}%,employee_id.ilike.%${filters.search}%,email.ilike.%${filters.search}%`);
      }

      const { data, error } = await query;

      if (error) {
        console.error('❌ HRM: Error fetching employees:', error);
        throw error;
      }

      console.log('✅ HRM: Fetched employees:', data?.length || 0, 'employees');
      console.log('📊 HRM: Employee data:', data);
      return data as Employee[];
    } catch (error) {
      console.error('❌ HRM: Exception fetching employees:', error);
      throw error;
    }
  }

  /**
   * Get a single employee by ID
   */
  async getEmployeeById(id: string): Promise<Employee | null> {
    try {
      const { data, error } = await supabase
        .from('employees')
        .select(`
          *,
          department:employee_departments(id, department_name, department_code, description),
          role:employee_roles(id, role_name, role_code, description, permissions),
          reporting_manager:employees!employees_reporting_manager_id_fkey(id, first_name, last_name, employee_id, designation)
        `)
        .eq('id', id)
        .eq('hospital_id', HOSPITAL_ID)
        .single();

      if (error) throw error;
      return data as Employee;
    } catch (error) {
      console.error('Error fetching employee:', error);
      throw error;
    }
  }

  /**
   * Create a new employee
   */
  async createEmployee(employeeData: EmployeeFormData): Promise<Employee> {
    try {
      // Clean up empty strings to prevent UUID errors
      const cleanedData: any = { ...employeeData };

      // Convert empty strings to null for UUID fields
      const uuidFields = ['department_id', 'role_id', 'reporting_manager_id'];
      uuidFields.forEach(field => {
        if (cleanedData[field] === '') {
          cleanedData[field] = null;
        }
      });

      const { data, error } = await supabase
        .from('employees')
        .insert({
          ...cleanedData,
          hospital_id: HOSPITAL_ID,
          is_active: true,
        })
        .select()
        .single();

      if (error) throw error;
      return data as Employee;
    } catch (error) {
      console.error('Error creating employee:', error);
      throw error;
    }
  }

  /**
   * Update an employee
   */
  async updateEmployee(id: string, employeeData: Partial<EmployeeFormData>): Promise<Employee> {
    try {
      // Clean up empty strings to prevent UUID errors
      const cleanedData: any = { ...employeeData };

      // Convert empty strings to null for UUID fields
      const uuidFields = ['department_id', 'role_id', 'reporting_manager_id'];
      uuidFields.forEach(field => {
        if (cleanedData[field] === '') {
          cleanedData[field] = null;
        }
      });

      const { data, error } = await supabase
        .from('employees')
        .update(cleanedData)
        .eq('id', id)
        .eq('hospital_id', HOSPITAL_ID)
        .select()
        .single();

      if (error) throw error;
      return data as Employee;
    } catch (error) {
      console.error('Error updating employee:', error);
      throw error;
    }
  }

  /**
   * Deactivate an employee (soft delete)
   */
  async deactivateEmployee(id: string, reason?: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('employees')
        .update({
          is_active: false,
          resignation_date: new Date().toISOString().split('T')[0],
          termination_reason: reason,
        })
        .eq('id', id)
        .eq('hospital_id', HOSPITAL_ID);

      if (error) throw error;
    } catch (error) {
      console.error('Error deactivating employee:', error);
      throw error;
    }
  }

  /**
   * Generate next employee ID
   */
  async generateEmployeeId(): Promise<string> {
    try {
      const { data, error } = await supabase
        .from('employees')
        .select('employee_id')
        .eq('hospital_id', HOSPITAL_ID)
        .order('employee_id', { ascending: false })
        .limit(1);

      if (error) throw error;

      if (data && data.length > 0) {
        const lastId = data[0].employee_id;
        const numericPart = parseInt(lastId.replace(/\D/g, ''));
        return `EMP${String(numericPart + 1).padStart(4, '0')}`;
      }

      return 'EMP0001';
    } catch (error) {
      console.error('Error generating employee ID:', error);
      return 'EMP0001';
    }
  }

  // =====================================================
  // DEPARTMENT MANAGEMENT
  // =====================================================

  async getDepartments(): Promise<EmployeeDepartment[]> {
    try {
      const { data, error } = await supabase
        .from('employee_departments')
        .select('*')
        .eq('hospital_id', HOSPITAL_ID)
        .eq('is_active', true)
        .order('department_name');

      if (error) throw error;
      return data as EmployeeDepartment[];
    } catch (error) {
      console.error('Error fetching departments:', error);
      throw error;
    }
  }

  async createDepartment(department: Omit<EmployeeDepartment, 'id' | 'created_at' | 'updated_at' | 'hospital_id'>): Promise<EmployeeDepartment> {
    try {
      const { data, error } = await supabase
        .from('employee_departments')
        .insert({
          ...department,
          hospital_id: HOSPITAL_ID,
        })
        .select()
        .single();

      if (error) throw error;
      return data as EmployeeDepartment;
    } catch (error) {
      console.error('Error creating department:', error);
      throw error;
    }
  }

  // =====================================================
  // ROLE MANAGEMENT
  // =====================================================

  async getRoles(): Promise<EmployeeRole[]> {
    try {
      const { data, error } = await supabase
        .from('employee_roles')
        .select('*')
        .eq('hospital_id', HOSPITAL_ID)
        .eq('is_active', true)
        .order('role_name');

      if (error) throw error;
      return data as EmployeeRole[];
    } catch (error) {
      console.error('Error fetching roles:', error);
      throw error;
    }
  }

  async createRole(role: Omit<EmployeeRole, 'id' | 'created_at' | 'updated_at' | 'hospital_id'>): Promise<EmployeeRole> {
    try {
      const { data, error } = await supabase
        .from('employee_roles')
        .insert({
          ...role,
          hospital_id: HOSPITAL_ID,
        })
        .select()
        .single();

      if (error) throw error;
      return data as EmployeeRole;
    } catch (error) {
      console.error('Error creating role:', error);
      throw error;
    }
  }

  // =====================================================
  // ATTENDANCE MANAGEMENT
  // =====================================================

  /**
   * Get attendance records with filtering
   */
  async getAttendance(filters?: AttendanceFilters): Promise<EmployeeAttendance[]> {
    try {
      let query = supabase
        .from('employee_attendance')
        .select(`
          *,
          employee:employees(id, employee_id, first_name, last_name, department:employee_departments(department_name))
        `)
        .eq('hospital_id', HOSPITAL_ID)
        .order('attendance_date', { ascending: false });

      if (filters?.employee_id) {
        query = query.eq('employee_id', filters.employee_id);
      }
      if (filters?.start_date) {
        query = query.gte('attendance_date', filters.start_date);
      }
      if (filters?.end_date) {
        query = query.lte('attendance_date', filters.end_date);
      }
      if (filters?.status) {
        query = query.eq('status', filters.status);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as EmployeeAttendance[];
    } catch (error) {
      console.error('Error fetching attendance:', error);
      throw error;
    }
  }

  /**
   * Mark attendance for an employee
   */
  async markAttendance(attendanceData: AttendanceFormData): Promise<EmployeeAttendance> {
    try {
      // Validate employee_id is not empty
      if (!attendanceData.employee_id || attendanceData.employee_id.trim() === '') {
        throw new Error('Employee ID is required');
      }

      // Calculate total hours if both check-in and check-out are provided
      let totalHours;
      if (attendanceData.check_in_time && attendanceData.check_out_time) {
        const checkIn = new Date(attendanceData.check_in_time);
        const checkOut = new Date(attendanceData.check_out_time);
        totalHours = (checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60);
      }

      const { data, error} = await supabase
        .from('employee_attendance')
        .upsert({
          ...attendanceData,
          hospital_id: HOSPITAL_ID,
          total_hours: totalHours,
        }, {
          onConflict: 'employee_id,attendance_date'
        })
        .select()
        .single();

      if (error) throw error;
      return data as EmployeeAttendance;
    } catch (error) {
      console.error('Error marking attendance:', error);
      throw error;
    }
  }

  /**
   * Get attendance summary for a date range
   */
  async getAttendanceSummary(startDate: string, endDate: string): Promise<AttendanceSummary[]> {
    try {
      const { data, error } = await supabase
        .from('employee_attendance')
        .select('attendance_date, status')
        .eq('hospital_id', HOSPITAL_ID)
        .gte('attendance_date', startDate)
        .lte('attendance_date', endDate);

      if (error) throw error;

      // Get total employees count
      const { count: totalEmployees } = await supabase
        .from('employees')
        .select('*', { count: 'exact', head: true })
        .eq('hospital_id', HOSPITAL_ID)
        .eq('is_active', true);

      // Group by date and calculate stats
      const summaryMap = new Map<string, AttendanceSummary>();

      data?.forEach((record: any) => {
        const date = record.attendance_date;
        if (!summaryMap.has(date)) {
          summaryMap.set(date, {
            date,
            total_employees: totalEmployees || 0,
            present: 0,
            absent: 0,
            on_leave: 0,
            half_day: 0,
            attendance_percentage: 0,
          });
        }

        const summary = summaryMap.get(date)!;
        switch (record.status) {
          case 'Present':
            summary.present++;
            break;
          case 'Absent':
            summary.absent++;
            break;
          case 'Leave':
            summary.on_leave++;
            break;
          case 'Half-Day':
            summary.half_day++;
            break;
        }

        summary.attendance_percentage = totalEmployees
          ? Math.round((summary.present / totalEmployees) * 100)
          : 0;
      });

      return Array.from(summaryMap.values());
    } catch (error) {
      console.error('Error fetching attendance summary:', error);
      throw error;
    }
  }

  // =====================================================
  // LEAVE MANAGEMENT
  // =====================================================

  /**
   * Get leave types
   */
  async getLeaveTypes(): Promise<LeaveType[]> {
    try {
      const { data, error } = await supabase
        .from('leave_types')
        .select('*')
        .eq('hospital_id', HOSPITAL_ID)
        .eq('is_active', true)
        .order('leave_name');

      if (error) throw error;
      return data as LeaveType[];
    } catch (error) {
      console.error('Error fetching leave types:', error);
      throw error;
    }
  }

  /**
   * Get leave requests with filtering
   */
  async getLeaves(filters?: LeaveFilters): Promise<EmployeeLeave[]> {
    try {
      let query = supabase
        .from('employee_leaves')
        .select(`
          *,
          employee:employees(id, employee_id, first_name, last_name, email),
          leave_type:leave_types(id, leave_name, leave_code, color),
          approver:employees!employee_leaves_approved_by_fkey(id, first_name, last_name)
        `)
        .eq('hospital_id', HOSPITAL_ID)
        .order('created_at', { ascending: false });

      if (filters?.employee_id) {
        query = query.eq('employee_id', filters.employee_id);
      }
      if (filters?.leave_type_id) {
        query = query.eq('leave_type_id', filters.leave_type_id);
      }
      if (filters?.status) {
        query = query.eq('status', filters.status);
      }
      if (filters?.start_date) {
        query = query.gte('start_date', filters.start_date);
      }
      if (filters?.end_date) {
        query = query.lte('end_date', filters.end_date);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as EmployeeLeave[];
    } catch (error) {
      console.error('Error fetching leaves:', error);
      throw error;
    }
  }

  /**
   * Apply for leave
   */
  async applyLeave(leaveData: LeaveFormData): Promise<EmployeeLeave> {
    try {
      // Validate required fields
      if (!leaveData.employee_id || leaveData.employee_id.trim() === '') {
        throw new Error('Employee ID is required');
      }
      if (!leaveData.leave_type_id || leaveData.leave_type_id.trim() === '') {
        throw new Error('Leave type is required');
      }

      // Calculate total days
      const start = new Date(leaveData.start_date);
      const end = new Date(leaveData.end_date);
      const totalDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;

      const { data, error } = await supabase
        .from('employee_leaves')
        .insert({
          ...leaveData,
          hospital_id: HOSPITAL_ID,
          total_days: totalDays,
          status: 'Pending',
        })
        .select()
        .single();

      if (error) throw error;
      return data as EmployeeLeave;
    } catch (error) {
      console.error('Error applying leave:', error);
      throw error;
    }
  }

  /**
   * Approve or reject leave
   */
  async updateLeaveStatus(
    leaveId: string,
    status: 'Approved' | 'Rejected',
    approverId: string,
    rejectionReason?: string
  ): Promise<EmployeeLeave> {
    try {
      const updateData: any = {
        status,
        approved_by: approverId,
        approved_at: new Date().toISOString(),
      };

      if (status === 'Rejected' && rejectionReason) {
        updateData.rejection_reason = rejectionReason;
      }

      const { data, error } = await supabase
        .from('employee_leaves')
        .update(updateData)
        .eq('id', leaveId)
        .eq('hospital_id', HOSPITAL_ID)
        .select()
        .single();

      if (error) throw error;

      // Update leave balance if approved
      if (status === 'Approved') {
        const leave = data as EmployeeLeave;
        await this.updateLeaveBalance(leave.employee_id, leave.leave_type_id, leave.total_days);
      }

      return data as EmployeeLeave;
    } catch (error) {
      console.error('Error updating leave status:', error);
      throw error;
    }
  }

  /**
   * Get leave balance for an employee
   */
  async getLeaveBalance(employeeId: string, year?: number): Promise<EmployeeLeaveBalance[]> {
    try {
      const currentYear = year || new Date().getFullYear();

      const { data, error } = await supabase
        .from('employee_leave_balance')
        .select(`
          *,
          leave_type:leave_types(id, leave_name, leave_code, color, max_days_per_year)
        `)
        .eq('employee_id', employeeId)
        .eq('year', currentYear);

      if (error) throw error;
      return data as EmployeeLeaveBalance[];
    } catch (error) {
      console.error('Error fetching leave balance:', error);
      throw error;
    }
  }

  /**
   * Update leave balance after leave approval
   */
  private async updateLeaveBalance(employeeId: string, leaveTypeId: string, days: number): Promise<void> {
    try {
      const currentYear = new Date().getFullYear();

      // Get current balance
      const { data: existing } = await supabase
        .from('employee_leave_balance')
        .select('*')
        .eq('employee_id', employeeId)
        .eq('leave_type_id', leaveTypeId)
        .eq('year', currentYear)
        .single();

      if (existing) {
        // Update existing balance
        await supabase
          .from('employee_leave_balance')
          .update({
            used: existing.used + days,
          })
          .eq('id', existing.id);
      }
    } catch (error) {
      console.error('Error updating leave balance:', error);
    }
  }

  // =====================================================
  // PAYROLL MANAGEMENT
  // =====================================================

  /**
   * Get payroll records with filtering
   */
  async getPayroll(filters?: PayrollFilters): Promise<EmployeePayroll[]> {
    try {
      let query = supabase
        .from('employee_payroll')
        .select(`
          *,
          employee:employees(
            id,
            employee_id,
            first_name,
            last_name,
            designation,
            department:employee_departments(department_name)
          )
        `)
        .eq('hospital_id', HOSPITAL_ID)
        .order('year', { ascending: false })
        .order('month', { ascending: false });

      if (filters?.employee_id) {
        query = query.eq('employee_id', filters.employee_id);
      }
      if (filters?.month) {
        query = query.eq('month', filters.month);
      }
      if (filters?.year) {
        query = query.eq('year', filters.year);
      }
      if (filters?.status) {
        query = query.eq('status', filters.status);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as EmployeePayroll[];
    } catch (error) {
      console.error('Error fetching payroll:', error);
      throw error;
    }
  }

  /**
   * Generate payroll for an employee
   */
  async generatePayroll(payrollData: PayrollFormData): Promise<EmployeePayroll> {
    try {
      // Get employee details for salary calculation
      const employee = await this.getEmployeeById(payrollData.employee_id);
      if (!employee) throw new Error('Employee not found');

      // Get attendance data for the month
      const startDate = `${payrollData.year}-${String(payrollData.month).padStart(2, '0')}-01`;
      const endDate = new Date(payrollData.year, payrollData.month, 0).toISOString().split('T')[0];

      const attendance = await this.getAttendance({
        employee_id: payrollData.employee_id,
        start_date: startDate,
        end_date: endDate,
      });

      const presentDays = attendance.filter(a => a.status === 'Present' || a.status === 'Half-Day').length;
      const leaveDays = attendance.filter(a => a.status === 'Leave').length;
      const workingDays = new Date(payrollData.year, payrollData.month, 0).getDate();

      const { data, error } = await supabase
        .from('employee_payroll')
        .insert({
          ...payrollData,
          hospital_id: HOSPITAL_ID,
          basic_salary: employee.basic_salary || 0,
          hra: employee.hra || 0,
          allowances: employee.allowances || 0,
          working_days: workingDays,
          present_days: presentDays,
          leave_days: leaveDays,
          status: 'Pending',
        })
        .select()
        .single();

      if (error) throw error;
      return data as EmployeePayroll;
    } catch (error) {
      console.error('Error generating payroll:', error);
      throw error;
    }
  }

  /**
   * Update payroll status
   */
  async updatePayrollStatus(payrollId: string, status: 'Processed' | 'Paid', processedBy: string): Promise<EmployeePayroll> {
    try {
      const { data, error } = await supabase
        .from('employee_payroll')
        .update({
          status,
          processed_by: processedBy,
          ...(status === 'Paid' && { payment_date: new Date().toISOString().split('T')[0] }),
        })
        .eq('id', payrollId)
        .eq('hospital_id', HOSPITAL_ID)
        .select()
        .single();

      if (error) throw error;
      return data as EmployeePayroll;
    } catch (error) {
      console.error('Error updating payroll status:', error);
      throw error;
    }
  }

  // =====================================================
  // DASHBOARD STATISTICS
  // =====================================================

  async getDashboardStats(): Promise<HRMDashboardStats> {
    try {
      const today = new Date().toISOString().split('T')[0];
      const currentMonth = new Date().getMonth() + 1;
      const currentYear = new Date().getFullYear();

      // Get total and active employees
      const { count: totalEmployees } = await supabase
        .from('employees')
        .select('*', { count: 'exact', head: true })
        .eq('hospital_id', HOSPITAL_ID);

      const { count: activeEmployees } = await supabase
        .from('employees')
        .select('*', { count: 'exact', head: true })
        .eq('hospital_id', HOSPITAL_ID)
        .eq('is_active', true);

      // Get today's attendance
      const { data: todayAttendance } = await supabase
        .from('employee_attendance')
        .select('status')
        .eq('hospital_id', HOSPITAL_ID)
        .eq('attendance_date', today);

      const presentToday = todayAttendance?.filter(a => a.status === 'Present').length || 0;
      const absentToday = todayAttendance?.filter(a => a.status === 'Absent').length || 0;
      const onLeaveToday = todayAttendance?.filter(a => a.status === 'Leave').length || 0;

      // Get pending leave requests
      const { count: pendingLeaves } = await supabase
        .from('employee_leaves')
        .select('*', { count: 'exact', head: true })
        .eq('hospital_id', HOSPITAL_ID)
        .eq('status', 'Pending');

      // Get departments count
      const { count: departmentsCount } = await supabase
        .from('employee_departments')
        .select('*', { count: 'exact', head: true })
        .eq('hospital_id', HOSPITAL_ID)
        .eq('is_active', true);

      // Get new joinings this month
      const firstDayOfMonth = `${currentYear}-${String(currentMonth).padStart(2, '0')}-01`;
      const { count: newJoinings } = await supabase
        .from('employees')
        .select('*', { count: 'exact', head: true })
        .eq('hospital_id', HOSPITAL_ID)
        .gte('joining_date', firstDayOfMonth);

      // Get resignations this month
      const { count: resignations } = await supabase
        .from('employees')
        .select('*', { count: 'exact', head: true })
        .eq('hospital_id', HOSPITAL_ID)
        .gte('resignation_date', firstDayOfMonth);

      return {
        total_employees: totalEmployees || 0,
        active_employees: activeEmployees || 0,
        present_today: presentToday,
        absent_today: absentToday,
        on_leave_today: onLeaveToday,
        pending_leave_requests: pendingLeaves || 0,
        departments_count: departmentsCount || 0,
        new_joinings_this_month: newJoinings || 0,
        resignations_this_month: resignations || 0,
      };
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      throw error;
    }
  }
}

export const hrmService = new HRMService();
export default hrmService;

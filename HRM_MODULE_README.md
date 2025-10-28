# HRM (Human Resource Management) Module

## Overview

The HRM Module is a comprehensive employee management system integrated into the Hospital CRM Pro application. It provides complete functionality for managing hospital staff, tracking attendance, managing leaves, and processing payroll.

## Features

### 1. **Employee Management**
- Add, edit, and view employee records
- Comprehensive employee profiles with:
  - Personal information (name, contact, address, emergency contacts)
  - Employment details (department, role, designation, joining date)
  - Salary information (basic salary, HRA, allowances)
  - Banking details for payroll
- Auto-generated employee IDs (EMP0001, EMP0002, etc.)
- Employee status management (Active/Inactive)
- Department and role assignment
- Reporting manager hierarchy
- Advanced search and filtering
- Export employee list to CSV

### 2. **Attendance Tracking**
- Daily attendance marking (Present, Absent, Half-Day, Leave)
- Check-in and check-out time tracking
- Monthly calendar view with color-coded status indicators
- Bulk attendance marking for all employees
- Attendance summary with real-time statistics
- Late arrival tracking
- Export attendance reports to CSV
- Department-wise attendance filtering

### 3. **Leave Management**
- Leave application submission
- Multiple leave types:
  - Casual Leave (CL)
  - Sick Leave (SL)
  - Earned Leave (EL)
  - Maternity Leave (ML)
  - Paternity Leave (PL)
  - Unpaid Leave (UL)
- Leave approval workflow
- Leave balance tracking per employee
- Leave calendar with color-coded types
- Rejection with reason
- Leave history and status tracking
- Export leave records to CSV

### 4. **Dashboard & Analytics**
- Total employees count
- Active employees tracking
- Today's attendance summary (Present, Absent, On Leave)
- Pending leave requests notifications
- Department count
- New joinings and resignations this month
- Quick action buttons for common tasks

## Database Schema

### Tables Created

1. **employees** - Core employee information
2. **employee_departments** - Department hierarchy
3. **employee_roles** - Role definitions and permissions
4. **employee_attendance** - Daily attendance records
5. **leave_types** - Leave type configurations
6. **employee_leaves** - Leave applications and approvals
7. **employee_leave_balance** - Leave balance tracking
8. **employee_payroll** - Salary and payroll processing
9. **employee_performance** - Performance reviews
10. **employee_schedules** - Work shift scheduling

## Installation & Setup

### Step 1: Run Database Schema

Execute the SQL schema to create all necessary tables:

```bash
psql -h your-database-host -U your-username -d your-database -f CREATE_HRM_SCHEMA.sql
```

Or run it directly in your Supabase SQL editor.

### Step 2: Verify Installation

The schema includes:
- ✅ 10 database tables with proper relationships
- ✅ Indexes for performance optimization
- ✅ Default leave types pre-populated
- ✅ Default departments (Medical, Nursing, Administration, etc.)
- ✅ Default roles (Doctor, Nurse, Administrator, etc.)
- ✅ Auto-update timestamps via triggers

### Step 3: Configure Permissions

The HRM module uses the permission `access_hrm`. Ensure your user roles have this permission enabled.

## Usage Guide

### Adding an Employee

1. Navigate to **HR Management** tab
2. Click **Add Employee** button
3. Fill in the employee form (3 tabs):
   - **Personal Info**: Name, contact, address, emergency contact
   - **Employment**: Department, role, designation, joining date
   - **Salary & Banking**: Salary components, bank details
4. Click **Add Employee** to save

### Marking Attendance

**Individual Attendance:**
1. Go to **Attendance** tab
2. Click **Mark Attendance**
3. Select employee, date, and status
4. Set check-in/check-out times (for Present/Half-Day)
5. Click **Mark Attendance**

**Bulk Attendance:**
1. Select a date from the date picker
2. Click **Mark All Present for Selected Date**
3. Confirm the action

### Managing Leaves

**Apply for Leave:**
1. Go to **Leaves** tab
2. Click **Apply Leave**
3. Select employee, leave type, dates, and reason
4. Click **Submit Application**

**Approve/Reject Leave:**
1. Click on a pending leave request
2. Review the details
3. Click **Approve** or **Reject**
4. If rejecting, provide a reason

## Component Structure

```
src/
├── components/
│   ├── HRMManagement.tsx          # Main HRM dashboard and navigation
│   └── hrm/
│       ├── EmployeeList.tsx       # Employee list with search/filter
│       ├── EmployeeForm.tsx       # Add/Edit employee form
│       ├── AttendanceTracker.tsx  # Attendance management
│       └── LeaveManagement.tsx    # Leave applications and approvals
├── services/
│   └── hrmService.ts              # HRM API service layer
└── types/
    └── hrm.ts                     # TypeScript interfaces
```

## API Service Methods

The `hrmService.ts` provides:

### Employee Operations
- `getEmployees(filters?)` - Get all employees with optional filtering
- `getEmployeeById(id)` - Get single employee details
- `createEmployee(data)` - Add new employee
- `updateEmployee(id, data)` - Update employee information
- `deactivateEmployee(id, reason)` - Deactivate employee
- `generateEmployeeId()` - Auto-generate next employee ID

### Department & Role Operations
- `getDepartments()` - Get all departments
- `createDepartment(data)` - Add new department
- `getRoles()` - Get all roles
- `createRole(data)` - Add new role

### Attendance Operations
- `getAttendance(filters?)` - Get attendance records
- `markAttendance(data)` - Mark employee attendance
- `getAttendanceSummary(startDate, endDate)` - Get attendance statistics

### Leave Operations
- `getLeaveTypes()` - Get all leave types
- `getLeaves(filters?)` - Get leave requests
- `applyLeave(data)` - Submit leave application
- `updateLeaveStatus(id, status, approverId, reason?)` - Approve/reject leave
- `getLeaveBalance(employeeId, year?)` - Get employee leave balance

### Payroll Operations
- `getPayroll(filters?)` - Get payroll records
- `generatePayroll(data)` - Generate employee payroll
- `updatePayrollStatus(id, status, processedBy)` - Update payroll status

### Dashboard
- `getDashboardStats()` - Get HRM dashboard statistics

## Design Patterns

### UI/UX Consistency
- Matches existing Hospital CRM design patterns
- Uses Tailwind CSS with primary blue color scheme (#0056B3)
- Lucide React icons for visual consistency
- Responsive design for all screen sizes
- Toast notifications for user feedback

### Data Flow
- React Query for data fetching and caching
- Optimistic updates where appropriate
- Real-time refresh after mutations
- Error handling with user-friendly messages

## Security Considerations

- **Permission-based access**: Only users with `access_hrm` permission can access the module
- **Row Level Security (RLS)**: Ensure RLS policies are configured in Supabase
- **Sensitive data protection**: Salary and banking information requires additional permissions
- **Audit trail**: All changes tracked with timestamps and user IDs

## Future Enhancements

### Phase 2 (Planned)
- Payroll generation and payslip download
- Advanced reporting and analytics
- Performance review system
- Bulk employee import/export
- Document management (upload IDs, certificates)
- Employee self-service portal
- Shift scheduling and rostering
- Overtime tracking and compensation
- Training and certification tracking

## Troubleshooting

### Common Issues

**1. HRM Tab Not Showing**
- Ensure user has `access_hrm` permission
- Check if HRMManagement component is properly imported in App.tsx

**2. Database Connection Errors**
- Verify Supabase connection settings
- Ensure HOSPITAL_ID is correctly configured
- Check if all tables are created successfully

**3. Permission Errors**
- Configure RLS policies in Supabase
- Grant appropriate permissions to authenticated users

**4. Attendance Not Saving**
- Check if employee_id and attendance_date are valid
- Verify unique constraint (employee_id, attendance_date)

## Support

For issues or feature requests:
1. Check the main Hospital CRM documentation
2. Review the TypeScript types in `src/types/hrm.ts`
3. Examine the service layer in `src/services/hrmService.ts`
4. Contact the development team

## Version History

- **v1.0.0** (Current) - Initial HRM module release
  - Employee management
  - Attendance tracking
  - Leave management
  - Dashboard with statistics
  - Full integration with Hospital CRM Pro

---

**Built for Hospital CRM Pro v3.1.0**


# HRM Module - Quick Start Guide

## 🚀 Get Started in 5 Minutes

### Step 1: Run Database Schema (2 minutes)

Open your Supabase SQL Editor and run:

```bash
# Copy the contents of CREATE_HRM_SCHEMA.sql and execute in Supabase
```

Or use command line:
```bash
psql -h your-supabase-host.supabase.co -U postgres -d postgres -f CREATE_HRM_SCHEMA.sql
```

**What this does:**
- Creates 10 tables for HRM
- Adds default leave types (CL, SL, EL, ML, PL, UL)
- Adds default departments (Medical, Nursing, Admin, etc.)
- Adds default roles (Doctor, Nurse, Admin, etc.)

### Step 2: Configure Permissions (1 minute)

Add the `access_hrm` permission to admin users:

**Option A - Update User Role in Supabase:**
```sql
-- Grant HRM access to admin users
UPDATE auth.users
SET raw_app_meta_data =
  jsonb_set(
    COALESCE(raw_app_meta_data, '{}'::jsonb),
    '{permissions}',
    (COALESCE(raw_app_meta_data->'permissions', '[]'::jsonb) || '["access_hrm"]'::jsonb)
  )
WHERE email = 'admin@valant.com'; -- Replace with your admin email
```

**Option B - Temporary Access (for testing):**
Modify `src/App.tsx` line 940 to remove permission requirement:
```typescript
// Remove this line:
permission: 'access_hrm'

// Or make it optional for all users during testing
```

### Step 3: Build & Run (1 minute)

```bash
# Install dependencies (if not already done)
npm install

# Run development server
npm run dev
```

### Step 4: Access HRM Module (1 minute)

1. Open your browser: `http://localhost:5173`
2. Login with your credentials
3. Look for **👥 HR Management** tab in the navigation
4. Click to access the HRM dashboard

## 🎯 First Tasks

### Add Your First Employee

1. Click **Add Employee** button
2. Fill in the form:
   - **Employee ID**: Auto-generated (EMP0001)
   - **Name**: John Doe
   - **Department**: Medical
   - **Role**: Doctor
   - **Joining Date**: Today's date
3. Click **Add Employee**

### Mark Today's Attendance

1. Go to **Attendance** tab
2. Click **Mark All Present for Selected Date**
3. Confirm the action
4. View the attendance calendar

### Create a Leave Request

1. Go to **Leaves** tab
2. Click **Apply Leave**
3. Fill in:
   - **Employee**: Select your employee
   - **Leave Type**: Casual Leave
   - **Dates**: Select start and end dates
   - **Reason**: "Testing HRM module"
4. Click **Submit Application**
5. Approve the leave by clicking on it

## 🔍 Quick Tour

### Dashboard View
- **Statistics Cards**: Total employees, present today, on leave, departments
- **Quick Actions**: Fast access to common tasks
- **Alerts**: Pending leave requests notification

### Employee List
- **Search Bar**: Search by name, ID, email, phone
- **Filters**: Filter by department, role, type, status
- **Actions**: View, edit, or deactivate employees
- **Export**: Download employee list as CSV

### Attendance Calendar
- **Monthly Grid**: See all employees' attendance at a glance
- **Color Codes**:
  - 🟢 Green = Present
  - 🔴 Red = Absent
  - 🟡 Yellow = Half-Day
  - 🔵 Blue = Leave
  - ⚪ Gray = Not Marked
- **Bulk Actions**: Mark all present with one click

### Leave Management
- **Statistics**: See pending, approved, rejected counts
- **Status Filters**: Filter by leave status
- **Approval Flow**: Approve or reject with reasons
- **Leave Types**: Pre-configured leave types with colors

## 📱 Mobile/Tablet Access

The HRM module is fully responsive:
- **Mobile**: Vertical stack layout, touch-friendly buttons
- **Tablet**: 2-column grid where appropriate
- **Desktop**: Full multi-column layout

## 🎨 UI Elements

### Color Scheme
- **Primary**: Blue (#0056B3) - Matches Hospital CRM
- **Success**: Green - Approved, Present, Active
- **Warning**: Yellow - Pending, Half-Day
- **Error**: Red - Rejected, Absent, Inactive
- **Info**: Blue - Leave, Information

### Icons
All icons from Lucide React library:
- 👥 Users - Employees
- 📅 Calendar - Attendance
- 🗓️ CalendarDays - Leaves
- 💰 DollarSign - Payroll
- 📊 TrendingUp - Dashboard

## 🐛 Troubleshooting

### "HR Management tab not visible"
**Solution**: Check user permissions. Temporarily remove `permission: 'access_hrm'` from `src/App.tsx` line 940.

### "Database connection error"
**Solution**: Verify Supabase credentials in `.env` file and ensure schema is created.

### "Employee ID not generating"
**Solution**: Check if `employees` table exists and has proper structure.

### "Cannot mark attendance"
**Solution**: Ensure employee exists and date is valid. Check unique constraint on (employee_id, attendance_date).

## 💡 Pro Tips

1. **Bulk Import**: Use CSV import feature (coming in Phase 2) or insert directly into database
2. **Reports**: Export data to Excel for advanced analytics
3. **Shortcuts**: Use search to quickly find employees by ID
4. **Mobile**: Mark attendance on-the-go using mobile browser
5. **Filters**: Combine multiple filters for precise data views

## 📚 Learn More

- **Full Documentation**: See `HRM_MODULE_README.md`
- **Implementation Details**: See `HRM_IMPLEMENTATION_SUMMARY.md`
- **Database Schema**: See `CREATE_HRM_SCHEMA.sql`
- **API Reference**: See `src/services/hrmService.ts`

## ✅ Checklist

- [ ] Database schema created in Supabase
- [ ] Permissions configured for admin users
- [ ] Application running (`npm run dev`)
- [ ] HRM tab visible in navigation
- [ ] First employee added successfully
- [ ] Attendance marked for today
- [ ] Leave request created and approved

## 🎉 You're Ready!

Your HRM module is now fully operational. Start managing your hospital staff efficiently!

---

**Need Help?** Check the troubleshooting section or review the comprehensive documentation in `HRM_MODULE_README.md`.


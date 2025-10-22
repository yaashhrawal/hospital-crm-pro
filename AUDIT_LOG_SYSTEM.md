# Admin Audit Log System - Complete Documentation

## Overview
The Admin Audit Log System provides comprehensive tracking of all user modifications and activities in the Hospital CRM. This system is designed to give administrators full visibility into what changes frontdesk and other users make, when they make them, and what the changes were.

## Features

### ✅ Complete Tracking
- **All Data Modifications**: Tracks edits to patients, billing, services, transactions, and all other records
- **Field-by-Field Comparison**: Shows exact before/after values for every changed field
- **Full History**: Permanently stores all audit logs (never deleted)
- **Admin-Only Access**: Only administrators can view audit logs

### ✅ Advanced Filtering
- Filter by User (see edits from specific frontdesk users)
- Filter by Date Range (view activity within specific timeframe)
- Filter by Section (Patient List, Billing, Services, etc.)
- Filter by Action Type (CREATE, UPDATE, DELETE)
- Search by description or record ID

### ✅ Export Capabilities
- Export to CSV/Excel format
- Filtered exports (only export what you're viewing)
- Dynamic filenames based on filters applied
- Complete audit trail for compliance

## Database Setup

### Step 1: Run SQL Schema
Run the `CREATE_AUDIT_LOGS_TABLE.sql` file in your Supabase SQL Editor.

This creates:
- `audit_logs` table
- Performance indexes
- RLS policies (admin-only access)
- Helper functions for field comparison
- Permissions

```sql
-- Already provided in CREATE_AUDIT_LOGS_TABLE.sql
```

### Step 2: Verify Table Creation
Check that the table exists:
```sql
SELECT * FROM audit_logs LIMIT 1;
```

## How to Access

### For Admin Users
1. Log in with admin credentials (admin@valant.com or meenal@valant.com)
2. Click on the **"🔍 Audit Log"** tab in the main navigation
3. The audit log page will load with all recorded activities

### For Frontdesk Users
- Frontdesk users **cannot** access the audit log
- The tab will not appear in their navigation
- All their edits are automatically tracked without their knowledge

## Using the Audit Log

### Viewing Audit Logs
The main table shows:
- **Date & Time**: When the action occurred
- **User**: Email and role of the user who made the change
- **Action**: CREATE, UPDATE, or DELETE
- **Section**: Which part of the system was modified
- **Record ID**: Unique identifier of the modified record
- **Description**: Human-readable description of the change

### Viewing Detailed Changes
Click the **down arrow (▼)** on any row to expand and see:
- Field-by-field comparison
- Old values vs New values
- Additional metadata (IP address, user agent, etc.)

### Filtering Audit Logs
1. Use the filter dropdowns at the top:
   - **User**: Select a specific frontdesk user
   - **Section**: Filter by Patient List, Billing, etc.
   - **Action**: Show only CREATE, UPDATE, or DELETE actions
   - **Date Range**: Set FROM and TO dates

2. Use the search box to find specific records
3. Click **"Clear Filters"** to reset all filters

### Exporting Audit Logs
1. Apply any filters you want (optional)
2. Click the **"📊 Export CSV"** button
3. A CSV file will download with the current view
4. Filename includes filters for easy identification

Example filename: `Audit_Log_2025-01-23_frontdesk@hospital.com_Patient_List.csv`

## Integration Guide

### For Developers: Adding Audit Logging

#### Method 1: Using Helper Functions (Recommended)
```typescript
import { useAuth } from '../contexts/AuthContext';
import { getAuditContext, logPatientEdit } from '../utils/auditHelper';

const MyComponent = () => {
  const { user } = useAuth();

  const handlePatientUpdate = async (patientId, oldData, newData) => {
    // Your update logic here
    await updatePatient(patientId, newData);

    // Log the audit trail
    const auditContext = getAuditContext(user);
    await logPatientEdit(
      auditContext,
      patientId,
      oldData,
      newData,
      'Patient information updated via Edit Modal'
    );
  };
};
```

#### Method 2: Using Audit Service Directly
```typescript
import { auditService } from '../services/auditService';
import { useAuth } from '../contexts/AuthContext';

const MyComponent = () => {
  const { user } = useAuth();

  const handleUpdate = async () => {
    // Your logic

    await auditService.createAuditLog({
      user_id: user?.id || null,
      user_email: user?.email || 'unknown',
      user_role: user?.role || 'unknown',
      user_name: user?.firstName && user?.lastName
        ? `${user.firstName} ${user.lastName}`
        : undefined,
      action_type: 'UPDATE',
      table_name: 'patients',
      record_id: patientId,
      section_name: 'Patient List',
      old_values: oldData,
      new_values: newData,
      description: 'Custom description',
    });
  };
};
```

### Available Helper Functions
- `logPatientEdit()` - For patient record updates
- `logServiceEdit()` - For service/transaction updates
- `logBillingEdit()` - For billing modifications
- `logRefund()` - For refund actions
- `logExpense()` - For expense entries
- `logAuditAction()` - Generic function for any action

## Data Structure

### Audit Log Entry
```typescript
{
  id: "uuid",
  user_id: "uuid",
  user_email: "frontdesk@hospital.com",
  user_role: "frontdesk",
  user_name: "John Doe",
  action_type: "UPDATE",
  table_name: "patients",
  record_id: "patient-uuid",
  section_name: "Patient List",
  field_changes: {
    phone: { old: "1234567890", new: "0987654321" },
    address: { old: "Old Address", new: "New Address" }
  },
  old_values: { /* complete old record */ },
  new_values: { /* complete new record */ },
  description: "Patient contact information updated",
  ip_address: "192.168.1.1",
  user_agent: "Mozilla/5.0...",
  created_at: "2025-01-23T10:30:00Z"
}
```

## Security & Privacy

### Access Control
- **RLS Policies**: Database-level security ensures only admins can query audit logs
- **UI Protection**: Audit Log tab only visible to admin users
- **Permission-Based**: Uses `admin_access` permission check

### Data Retention
- **Permanent Storage**: Audit logs are never automatically deleted
- **Immutable**: Once created, audit logs cannot be modified or deleted
- **Complete History**: Full audit trail maintained indefinitely

### What is Tracked?
- ✅ Patient record edits (name, age, contact, etc.)
- ✅ Service additions and removals
- ✅ Billing modifications
- ✅ Refund processing
- ✅ Expense entries
- ✅ IPD admissions/discharges
- ✅ All database modifications

### What is NOT Tracked?
- ❌ Read-only operations (viewing records)
- ❌ Login/logout events (handled by auth system)
- ❌ Failed operations (only successful changes logged)

## Troubleshooting

### Audit Logs Not Appearing
1. **Check Database**: Verify `audit_logs` table exists
2. **Check Permissions**: Ensure you're logged in as admin
3. **Check RLS Policies**: Verify policies are enabled
4. **Check Filters**: Clear all filters to see all logs

### No Logs for Recent Edits
1. **Verify Integration**: Check if audit logging is implemented in the component
2. **Check Console**: Look for audit service errors
3. **Check User Context**: Ensure user object is properly passed

### Export Not Working
1. **Check Data**: Ensure there are logs to export
2. **Check Browser**: Some browsers block downloads
3. **Check Filters**: Verify filters aren't excluding all data

## Performance Considerations

### Database Indexes
The system includes optimized indexes for:
- User filtering (user_id, user_email)
- Date range queries (created_at)
- Section filtering (section_name)
- Table filtering (table_name)
- Composite queries (combinations of above)

### Pagination
- Default: 50 entries per page
- Adjustable in code if needed
- Efficient querying with offset/limit

### Large Datasets
The system is designed to handle millions of audit logs efficiently:
- Indexed queries are fast
- Pagination prevents memory issues
- Filters reduce result sets

## Future Enhancements

### Planned Features
1. Real-time notifications for critical changes
2. Audit log dashboard widget
3. Advanced analytics and reporting
4. Automated compliance reports
5. Change reversal capabilities (undo edits)
6. Email notifications for suspicious activity

### Integration Opportunities
1. Auto-log all Supabase operations
2. Integrate with existing transaction system
3. Add audit logging to more components
4. Create audit summary reports

## Support

### For Issues or Questions
1. Check this documentation
2. Review the code comments in audit service files
3. Test in development environment first
4. Contact system administrator

### Files Reference
- **Database**: `CREATE_AUDIT_LOGS_TABLE.sql`
- **Types**: `src/types/audit.ts`
- **Service**: `src/services/auditService.ts`
- **Helper**: `src/utils/auditHelper.ts`
- **Component**: `src/components/AdminAuditLog.tsx`
- **Integration**: `src/App.tsx`

---

## Quick Start Checklist

- [x] Run SQL schema in Supabase
- [x] Verify table creation
- [x] Log in as admin
- [x] Navigate to Audit Log tab
- [x] Test filtering and search
- [x] Test export functionality
- [ ] Integrate audit logging into your components
- [ ] Test with frontdesk user account
- [ ] Verify logs appear correctly

**The Admin Audit Log System is now fully operational!** 🎉

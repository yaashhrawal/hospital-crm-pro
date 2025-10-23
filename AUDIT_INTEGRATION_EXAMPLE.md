# Audit Log Integration Examples

## How to Add Audit Logging to Your Components

This guide shows you exactly how to integrate audit logging into existing components with minimal code changes.

---

## Example 1: Patient Edit Modal

### Before (Without Audit Logging)
```typescript
import { useState } from 'react';
import { hospitalService } from '../services/hospitalService';

const EditPatientModal = ({ patient, onClose, onSave }) => {
  const handleSave = async (formData) => {
    // Update the patient
    const result = await hospitalService.updatePatient(patient.id, formData);

    if (result.success) {
      toast.success('Patient updated successfully!');
      onSave();
    }
  };

  return (
    // ... your form JSX
  );
};
```

### After (With Audit Logging)
```typescript
import { useState } from 'react';
import { hospitalService } from '../services/hospitalService';
import { useAuth } from '../contexts/AuthContext';
import { getAuditContext, logPatientEdit } from '../utils/auditHelper';

const EditPatientModal = ({ patient, onClose, onSave }) => {
  const { user } = useAuth();  // ADD THIS

  const handleSave = async (formData) => {
    // Store old data before update
    const oldData = { ...patient };  // ADD THIS

    // Update the patient
    const result = await hospitalService.updatePatient(patient.id, formData);

    if (result.success) {
      // Log the audit trail - ADD THIS BLOCK
      const auditContext = getAuditContext(user);
      await logPatientEdit(
        auditContext,
        patient.id,
        oldData,
        formData,
        'Patient information updated via Edit Modal'
      );

      toast.success('Patient updated successfully!');
      onSave();
    }
  };

  return (
    // ... your form JSX (no changes needed)
  );
};
```

**That's it!** Just 3 lines of code to add complete audit logging.

---

## Example 2: Service Manager (Adding Services)

### Integration
```typescript
import { useAuth } from '../contexts/AuthContext';
import { getAuditContext, logServiceEdit } from '../utils/auditHelper';

const PatientServiceManager = ({ patient }) => {
  const { user } = useAuth();

  const handleAddService = async (serviceData) => {
    // Add the service
    const result = await hospitalService.addService(patient.id, serviceData);

    if (result.success && result.data) {
      // Log audit trail
      const auditContext = getAuditContext(user);
      await logServiceEdit(
        auditContext,
        result.data.id,
        null, // No old data for new service
        serviceData,
        `Service "${serviceData.service_name}" added to patient`
      );

      toast.success('Service added successfully!');
    }
  };

  const handleRemoveService = async (serviceId, oldServiceData) => {
    // Remove the service
    const result = await hospitalService.removeService(serviceId);

    if (result.success) {
      // Log audit trail
      const auditContext = getAuditContext(user);
      await logServiceEdit(
        auditContext,
        serviceId,
        oldServiceData,
        null, // No new data for removed service
        `Service "${oldServiceData.service_name}" removed from patient`
      );

      toast.success('Service removed successfully!');
    }
  };
};
```

---

## Example 3: Refund Processing

### Integration
```typescript
import { useAuth } from '../contexts/AuthContext';
import { getAuditContext, logRefund } from '../utils/auditHelper';

const RefundTab = () => {
  const { user } = useAuth();

  const handleRefund = async (refundData) => {
    // Process the refund
    const result = await hospitalService.processRefund(refundData);

    if (result.success && result.data) {
      // Log audit trail
      const auditContext = getAuditContext(user);
      await logRefund(
        auditContext,
        result.data.id,
        refundData,
        `Refund of ₹${refundData.amount} processed for patient ${refundData.patient_name}`
      );

      toast.success('Refund processed successfully!');
    }
  };
};
```

---

## Example 4: Billing Modifications

### Integration
```typescript
import { useAuth } from '../contexts/AuthContext';
import { getAuditContext, logBillingEdit } from '../utils/auditHelper';

const BillingSection = () => {
  const { user } = useAuth();

  const handleUpdateBill = async (billId, oldBillData, newBillData) => {
    // Update the bill
    const result = await hospitalService.updateBill(billId, newBillData);

    if (result.success) {
      // Log audit trail
      const auditContext = getAuditContext(user);
      await logBillingEdit(
        auditContext,
        billId,
        oldBillData,
        newBillData,
        `Bill #${billId} modified - Amount changed from ₹${oldBillData.total} to ₹${newBillData.total}`
      );

      toast.success('Bill updated successfully!');
    }
  };
};
```

---

## Example 5: Custom Action (Using Generic Function)

### Integration
```typescript
import { useAuth } from '../contexts/AuthContext';
import { getAuditContext, logAuditAction } from '../utils/auditHelper';

const MyCustomComponent = () => {
  const { user } = useAuth();

  const handleCustomAction = async (recordId, data) => {
    // Your custom logic
    const result = await myCustomService.doSomething(recordId, data);

    if (result.success) {
      // Log audit trail with custom parameters
      const auditContext = getAuditContext(user);
      await logAuditAction(auditContext, {
        action_type: 'UPDATE',
        table_name: 'patients', // or any other table
        record_id: recordId,
        section_name: 'IPD Management', // or any section
        old_values: null,
        new_values: data,
        description: 'Custom action performed',
      });

      toast.success('Action completed!');
    }
  };
};
```

---

## Best Practices

### 1. Always Get User Context
```typescript
const { user } = useAuth();
const auditContext = getAuditContext(user);
```

### 2. Store Old Data Before Updates
```typescript
const oldData = { ...existingRecord };
// Then do your update
await updateRecord(newData);
// Then log audit
await logAuditAction(...);
```

### 3. Use Descriptive Messages
```typescript
// ❌ Bad
description: 'Updated'

// ✅ Good
description: 'Patient contact information updated via Edit Modal'
description: `Service "X-Ray" added to patient ${patientName}`
description: `Refund of ₹${amount} processed for cancelled appointment`
```

### 4. Log After Success Only
```typescript
const result = await doSomething();

if (result.success) {
  // Only log if the operation succeeded
  await logAuditAction(...);
}
```

### 5. Don't Block User Experience
```typescript
// Log audit in background - don't await if not critical
logAuditAction(...); // Fire and forget

// Or handle errors gracefully
try {
  await logAuditAction(...);
} catch (error) {
  console.error('Audit logging failed:', error);
  // Continue with user flow - don't block on audit failure
}
```

---

## Quick Reference

### Import Statements
```typescript
import { useAuth } from '../contexts/AuthContext';
import {
  getAuditContext,
  logPatientEdit,
  logServiceEdit,
  logBillingEdit,
  logRefund,
  logExpense,
  logAuditAction
} from '../utils/auditHelper';
```

### Helper Functions
- `logPatientEdit(context, patientId, oldData, newData, description?)`
- `logServiceEdit(context, serviceId, oldData, newData, description?)`
- `logBillingEdit(context, billId, oldData, newData, description?)`
- `logRefund(context, refundId, refundData, description?)`
- `logExpense(context, expenseId, expenseData, description?)`
- `logAuditAction(context, { ...params })`

### Action Types
- `'CREATE'` - New record created
- `'UPDATE'` - Existing record modified
- `'DELETE'` - Record deleted

### Section Names
- `'Patient List'`
- `'Patient Entry'`
- `'Billing'`
- `'Services'`
- `'Refunds'`
- `'Daily Expenses'`
- `'IPD Management'`
- `'Bed Management'`
- `'Discharge'`
- `'Settings'`

---

## Testing Your Integration

### 1. Make a Change
Log in as frontdesk user and edit a patient record

### 2. Check Audit Log
Log in as admin and go to Audit Log tab

### 3. Verify Entry
Confirm the audit log shows:
- ✅ Correct user email
- ✅ Correct timestamp
- ✅ Correct section name
- ✅ Field changes visible
- ✅ Before/after values correct

### 4. Test Filtering
- Filter by the frontdesk user
- Filter by section
- Filter by date
- Verify all filters work

### 5. Test Export
- Export filtered logs
- Verify CSV contains correct data
- Check filename includes filters

---

**Happy Auditing!** 🔍📊

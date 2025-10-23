// =============================================================================
// AUDIT HELPER UTILITY
// =============================================================================
// Simple wrapper functions to make audit logging easy to integrate anywhere
// =============================================================================

import { auditService } from '../services/auditService';
import type { AuditActionType, AuditSectionName, AuditTableName } from '../types/audit';

interface AuditContext {
  userId: string | null;
  userEmail: string;
  userRole: string;
  userName?: string;
}

/**
 * Log a patient edit action
 */
export const logPatientEdit = async (
  context: AuditContext,
  patientId: string,
  oldData: any,
  newData: any,
  description?: string
): Promise<{ success: boolean; error?: string; id?: string }> => {
  console.log('🔍 logPatientEdit called with:', {
    context,
    patientId,
    oldData,
    newData,
    description,
  });

  const result = await auditService.createAuditLog({
    user_id: context.userId,
    user_email: context.userEmail,
    user_role: context.userRole,
    user_name: context.userName,
    action_type: 'UPDATE',
    table_name: 'patients',
    record_id: patientId,
    section_name: 'Patient List',
    old_values: oldData,
    new_values: newData,
    description: description || 'Patient record updated',
  });

  console.log('🔍 logPatientEdit result:', result);
  return result;
};

/**
 * Log a service/transaction modification
 */
export const logServiceEdit = async (
  context: AuditContext,
  serviceId: string,
  oldData: any,
  newData: any,
  description?: string
) => {
  return auditService.createAuditLog({
    user_id: context.userId,
    user_email: context.userEmail,
    user_role: context.userRole,
    user_name: context.userName,
    action_type: 'UPDATE',
    table_name: 'patient_transactions',
    record_id: serviceId,
    section_name: 'Services',
    old_values: oldData,
    new_values: newData,
    description: description || 'Service record updated',
  });
};

/**
 * Log a billing modification
 */
export const logBillingEdit = async (
  context: AuditContext,
  billId: string,
  oldData: any,
  newData: any,
  description?: string
) => {
  return auditService.createAuditLog({
    user_id: context.userId,
    user_email: context.userEmail,
    user_role: context.userRole,
    user_name: context.userName,
    action_type: 'UPDATE',
    table_name: 'patient_transactions',
    record_id: billId,
    section_name: 'Billing',
    old_values: oldData,
    new_values: newData,
    description: description || 'Billing record updated',
  });
};

/**
 * Log a refund action
 */
export const logRefund = async (
  context: AuditContext,
  refundId: string,
  refundData: any,
  description?: string
) => {
  return auditService.createAuditLog({
    user_id: context.userId,
    user_email: context.userEmail,
    user_role: context.userRole,
    user_name: context.userName,
    action_type: 'CREATE',
    table_name: 'patient_refunds',
    record_id: refundId,
    section_name: 'Refunds',
    new_values: refundData,
    description: description || 'Refund processed',
  });
};

/**
 * Log an expense entry
 */
export const logExpense = async (
  context: AuditContext,
  expenseId: string,
  expenseData: any,
  description?: string
) => {
  return auditService.createAuditLog({
    user_id: context.userId,
    user_email: context.userEmail,
    user_role: context.userRole,
    user_name: context.userName,
    action_type: 'CREATE',
    table_name: 'daily_expenses',
    record_id: expenseId,
    section_name: 'Daily Expenses',
    new_values: expenseData,
    description: description || 'Expense recorded',
  });
};

/**
 * Generic audit log function for any action
 */
export const logAuditAction = async (
  context: AuditContext,
  params: {
    action_type: AuditActionType;
    table_name: AuditTableName;
    record_id: string;
    section_name: AuditSectionName;
    old_values?: any;
    new_values?: any;
    description?: string;
  }
) => {
  return auditService.createAuditLog({
    user_id: context.userId,
    user_email: context.userEmail,
    user_role: context.userRole,
    user_name: context.userName,
    ...params,
  });
};

/**
 * Get audit context from user object
 */
export const getAuditContext = (user: any): AuditContext => {
  return {
    userId: user?.id || null,
    userEmail: user?.email || 'unknown@hospital.com',
    userRole: user?.role || 'unknown',
    userName: user?.firstName && user?.lastName
      ? `${user.firstName} ${user.lastName}`
      : undefined,
  };
};

// =============================================================================
// AUDIT LOG TYPE DEFINITIONS
// =============================================================================

export type AuditActionType = 'CREATE' | 'UPDATE' | 'DELETE';

export type AuditTableName =
  | 'patients'
  | 'patient_transactions'
  | 'patient_services'
  | 'daily_expenses'
  | 'patient_refunds'
  | 'patient_admissions'
  | 'beds'
  | 'doctors'
  | 'departments';

export type AuditSectionName =
  | 'Patient List'
  | 'Patient Entry'
  | 'Billing'
  | 'Services'
  | 'Refunds'
  | 'Daily Expenses'
  | 'IPD Management'
  | 'Bed Management'
  | 'Discharge'
  | 'Settings';

export interface FieldChange {
  old: any;
  new: any;
}

export interface FieldChanges {
  [fieldName: string]: FieldChange;
}

export interface AuditLog {
  id: string;

  // User information
  user_id: string | null;
  user_email: string;
  user_role: string;
  user_name: string | null;

  // Action details
  action_type: AuditActionType;
  table_name: AuditTableName;
  record_id: string;
  section_name: AuditSectionName;

  // Change tracking
  field_changes: FieldChanges | null;
  old_values: Record<string, any> | null;
  new_values: Record<string, any> | null;

  // Additional context
  description: string | null;
  ip_address: string | null;
  user_agent: string | null;

  // Multi-hospital support
  hospital_id: string;

  // Timestamps
  created_at: string;
}

export interface AuditLogFilters {
  user_email?: string;
  user_role?: string;
  action_type?: AuditActionType;
  table_name?: AuditTableName;
  section_name?: AuditSectionName;
  date_from?: string;
  date_to?: string;
  search?: string; // Search in description or record_id
}

export interface AuditLogStats {
  total_edits: number;
  edits_today: number;
  edits_this_week: number;
  edits_this_month: number;
  by_user: Array<{ user_email: string; count: number }>;
  by_section: Array<{ section_name: string; count: number }>;
  by_action: Array<{ action_type: string; count: number }>;
}

export interface CreateAuditLogParams {
  user_id: string | null;
  user_email: string;
  user_role: string;
  user_name?: string;
  action_type: AuditActionType;
  table_name: AuditTableName;
  record_id: string;
  section_name: AuditSectionName;
  old_values?: Record<string, any> | null;
  new_values?: Record<string, any> | null;
  description?: string;
  ip_address?: string;
  user_agent?: string;
}

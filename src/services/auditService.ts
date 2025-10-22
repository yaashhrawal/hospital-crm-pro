// =============================================================================
// AUDIT SERVICE - Logging and Retrieval
// =============================================================================

import { supabase } from '../config/supabaseNew';
import type {
  AuditLog,
  AuditLogFilters,
  AuditLogStats,
  CreateAuditLogParams,
} from '../types/audit';

class AuditService {
  /**
   * Calculate field-by-field changes between old and new data
   */
  private calculateFieldChanges(oldData: any, newData: any): Record<string, { old: any; new: any }> | null {
    if (!oldData || !newData) {
      return null;
    }

    const changes: Record<string, { old: any; new: any }> = {};

    // Get all unique keys from both objects
    const allKeys = new Set([...Object.keys(oldData), ...Object.keys(newData)]);

    allKeys.forEach((key) => {
      const oldValue = oldData[key];
      const newValue = newData[key];

      // Check if values are different
      if (JSON.stringify(oldValue) !== JSON.stringify(newValue)) {
        changes[key] = {
          old: oldValue,
          new: newValue,
        };
      }
    });

    return Object.keys(changes).length > 0 ? changes : null;
  }

  /**
   * Create an audit log entry using direct INSERT (RLS policy allows it)
   */
  async createAuditLog(params: CreateAuditLogParams): Promise<{ success: boolean; error?: string; id?: string }> {
    try {
      // Calculate field changes
      const field_changes = this.calculateFieldChanges(params.old_values, params.new_values);

      console.log('📊 Audit log - Field changes calculated:', field_changes);
      console.log('📊 Audit log - Params:', {
        user_email: params.user_email,
        user_role: params.user_role,
        action_type: params.action_type,
        table_name: params.table_name,
        record_id: params.record_id,
        section_name: params.section_name,
      });

      // Direct INSERT (RLS policy now allows this)
      const { data, error } = await supabase
        .from('audit_logs')
        .insert({
          user_id: params.user_id,
          user_email: params.user_email,
          user_role: params.user_role,
          user_name: params.user_name || null,
          action_type: params.action_type,
          table_name: params.table_name,
          record_id: params.record_id,
          section_name: params.section_name,
          field_changes: field_changes,
          old_values: params.old_values || null,
          new_values: params.new_values || null,
          description: params.description || null,
          ip_address: params.ip_address || null,
          user_agent: params.user_agent || null,
        })
        .select('id')
        .single();

      if (error) {
        console.error('❌ Audit log creation failed:', error);
        console.error('❌ Supabase error details:', JSON.stringify(error, null, 2));
        return { success: false, error: error.message };
      }

      console.log('✅ Audit log created successfully with ID:', data.id);
      return { success: true, id: data.id };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create audit log';
      console.error('❌ Audit log exception:', error);
      console.error('❌ Exception details:', JSON.stringify(error, null, 2));
      return { success: false, error: errorMessage };
    }
  }

  /**
   * Get audit logs with optional filters
   */
  async getAuditLogs(
    filters?: AuditLogFilters,
    limit: number = 100,
    offset: number = 0
  ): Promise<{ logs: AuditLog[]; total: number; error?: string }> {
    try {
      let query = supabase
        .from('audit_logs')
        .select('*', { count: 'exact' });

      // Apply filters
      if (filters?.user_email) {
        query = query.eq('user_email', filters.user_email);
      }

      if (filters?.user_role) {
        query = query.eq('user_role', filters.user_role);
      }

      if (filters?.action_type) {
        query = query.eq('action_type', filters.action_type);
      }

      if (filters?.table_name) {
        query = query.eq('table_name', filters.table_name);
      }

      if (filters?.section_name) {
        query = query.eq('section_name', filters.section_name);
      }

      if (filters?.date_from) {
        query = query.gte('created_at', filters.date_from);
      }

      if (filters?.date_to) {
        // Add 1 day to include the entire end date
        const endDate = new Date(filters.date_to);
        endDate.setDate(endDate.getDate() + 1);
        query = query.lt('created_at', endDate.toISOString());
      }

      if (filters?.search) {
        query = query.or(
          `description.ilike.%${filters.search}%,record_id.ilike.%${filters.search}%`
        );
      }

      // Order by most recent first
      query = query.order('created_at', { ascending: false });

      // Apply pagination
      query = query.range(offset, offset + limit - 1);

      const { data, error, count } = await query;

      if (error) {
        console.error('❌ Failed to fetch audit logs:', error);
        return { logs: [], total: 0, error: error.message };
      }

      return {
        logs: data as AuditLog[],
        total: count || 0,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch audit logs';
      console.error('❌ Audit logs exception:', error);
      return { logs: [], total: 0, error: errorMessage };
    }
  }

  /**
   * Get a single audit log by ID
   */
  async getAuditLogById(id: string): Promise<{ log: AuditLog | null; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('audit_logs')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        console.error('❌ Failed to fetch audit log:', error);
        return { log: null, error: error.message };
      }

      return { log: data as AuditLog };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch audit log';
      console.error('❌ Audit log exception:', error);
      return { log: null, error: errorMessage };
    }
  }

  /**
   * Get audit log statistics
   */
  async getAuditStats(): Promise<{ stats: AuditLogStats | null; error?: string }> {
    try {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
      const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();

      // Get total count
      const { count: total_edits } = await supabase
        .from('audit_logs')
        .select('*', { count: 'exact', head: true });

      // Get today's count
      const { count: edits_today } = await supabase
        .from('audit_logs')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', today);

      // Get this week's count
      const { count: edits_this_week } = await supabase
        .from('audit_logs')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', weekAgo);

      // Get this month's count
      const { count: edits_this_month } = await supabase
        .from('audit_logs')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', monthAgo);

      // Get breakdown by user
      const { data: byUserData } = await supabase
        .from('audit_logs')
        .select('user_email');

      const by_user = Object.entries(
        (byUserData || []).reduce((acc: Record<string, number>, log: any) => {
          acc[log.user_email] = (acc[log.user_email] || 0) + 1;
          return acc;
        }, {})
      ).map(([user_email, count]) => ({ user_email, count: count as number }))
        .sort((a, b) => b.count - a.count);

      // Get breakdown by section
      const { data: bySectionData } = await supabase
        .from('audit_logs')
        .select('section_name');

      const by_section = Object.entries(
        (bySectionData || []).reduce((acc: Record<string, number>, log: any) => {
          acc[log.section_name] = (acc[log.section_name] || 0) + 1;
          return acc;
        }, {})
      ).map(([section_name, count]) => ({ section_name, count: count as number }))
        .sort((a, b) => b.count - a.count);

      // Get breakdown by action
      const { data: byActionData } = await supabase
        .from('audit_logs')
        .select('action_type');

      const by_action = Object.entries(
        (byActionData || []).reduce((acc: Record<string, number>, log: any) => {
          acc[log.action_type] = (acc[log.action_type] || 0) + 1;
          return acc;
        }, {})
      ).map(([action_type, count]) => ({ action_type, count: count as number }))
        .sort((a, b) => b.count - a.count);

      const stats: AuditLogStats = {
        total_edits: total_edits || 0,
        edits_today: edits_today || 0,
        edits_this_week: edits_this_week || 0,
        edits_this_month: edits_this_month || 0,
        by_user,
        by_section,
        by_action,
      };

      return { stats };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch audit stats';
      console.error('❌ Audit stats exception:', error);
      return { stats: null, error: errorMessage };
    }
  }

  /**
   * Get all unique users who have made edits
   */
  async getAuditUsers(): Promise<{ users: string[]; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('audit_logs')
        .select('user_email')
        .order('user_email');

      if (error) {
        console.error('❌ Failed to fetch audit users:', error);
        return { users: [], error: error.message };
      }

      const uniqueUsers = [...new Set(data.map((log: any) => log.user_email))];
      return { users: uniqueUsers };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch audit users';
      console.error('❌ Audit users exception:', error);
      return { users: [], error: errorMessage };
    }
  }

  /**
   * Export audit logs to CSV format
   */
  exportToCSV(logs: AuditLog[]): string {
    const headers = [
      'Date/Time',
      'User Email',
      'User Role',
      'Action',
      'Section',
      'Table',
      'Record ID',
      'Description',
      'Changes'
    ];

    const rows = logs.map(log => [
      new Date(log.created_at).toLocaleString(),
      log.user_email,
      log.user_role,
      log.action_type,
      log.section_name,
      log.table_name,
      log.record_id,
      log.description || '',
      log.field_changes ? Object.keys(log.field_changes).join(', ') : ''
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    return csvContent;
  }

  /**
   * Download audit logs as CSV file
   */
  downloadAsCSV(logs: AuditLog[], filename: string = 'audit_logs.csv') {
    const csvContent = this.exportToCSV(logs);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}

export const auditService = new AuditService();
export default auditService;

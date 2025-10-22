import React, { useState, useEffect } from 'react';
import { Search, Download, RefreshCw, ChevronDown, ChevronUp, Filter } from 'lucide-react';
import toast from 'react-hot-toast';
import { auditService } from '../services/auditService';
import { useAuth } from '../contexts/AuthContext';
import type { AuditLog, AuditLogFilters, AuditActionType, AuditSectionName } from '../types/audit';

const AdminAuditLog: React.FC = () => {
  const { isAdmin } = useAuth();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(50);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [showFilters, setShowFilters] = useState(true);

  // Filter states
  const [filters, setFilters] = useState<AuditLogFilters>({});
  const [availableUsers, setAvailableUsers] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  // Check admin access
  useEffect(() => {
    if (!isAdmin()) {
      toast.error('Access denied. Admin privileges required.');
    }
  }, [isAdmin]);

  // Load available users for filter
  useEffect(() => {
    loadAvailableUsers();
  }, []);

  // Load audit logs
  useEffect(() => {
    loadAuditLogs();
  }, [filters, currentPage]);

  const loadAvailableUsers = async () => {
    const { users, error } = await auditService.getAuditUsers();
    if (error) {
      console.error('Failed to load users:', error);
    } else {
      setAvailableUsers(users);
    }
  };

  const loadAuditLogs = async () => {
    setLoading(true);
    try {
      const offset = (currentPage - 1) * itemsPerPage;
      const { logs: fetchedLogs, total: totalCount, error } = await auditService.getAuditLogs(
        filters,
        itemsPerPage,
        offset
      );

      if (error) {
        toast.error(`Failed to load audit logs: ${error}`);
      } else {
        setLogs(fetchedLogs);
        setTotal(totalCount);
      }
    } catch (error) {
      console.error('Error loading audit logs:', error);
      toast.error('Failed to load audit logs');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    const today = new Date().toISOString().split('T')[0];
    let filename = `Audit_Log_${today}`;

    if (filters.user_email) filename += `_${filters.user_email.replace('@', '_')}`;
    if (filters.section_name) filename += `_${filters.section_name.replace(/\s+/g, '_')}`;
    if (filters.date_from) filename += `_from_${filters.date_from}`;
    if (filters.date_to) filename += `_to_${filters.date_to}`;

    filename += '.csv';

    auditService.downloadAsCSV(logs, filename);
    toast.success('Audit logs exported successfully!');
  };

  const toggleRow = (id: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedRows(newExpanded);
  };

  const getActionColor = (action: AuditActionType) => {
    switch (action) {
      case 'CREATE':
        return 'bg-green-100 text-green-800';
      case 'UPDATE':
        return 'bg-yellow-100 text-yellow-800';
      case 'DELETE':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const renderFieldChanges = (log: AuditLog) => {
    if (!log.field_changes) return <p className="text-gray-500 text-sm">No field changes recorded</p>;

    const changes = Object.entries(log.field_changes);
    if (changes.length === 0) return <p className="text-gray-500 text-sm">No changes detected</p>;

    return (
      <div className="space-y-2">
        <h4 className="font-semibold text-sm text-gray-700 mb-2">Field Changes:</h4>
        {changes.map(([fieldName, change]) => (
          <div key={fieldName} className="bg-gray-50 p-2 rounded border-l-4 border-blue-500">
            <p className="font-medium text-sm text-gray-700">{fieldName.replace(/_/g, ' ').toUpperCase()}</p>
            <div className="grid grid-cols-2 gap-2 mt-1">
              <div>
                <span className="text-xs text-gray-500">Old Value:</span>
                <p className="text-sm text-red-600">{JSON.stringify(change.old)}</p>
              </div>
              <div>
                <span className="text-xs text-gray-500">New Value:</span>
                <p className="text-sm text-green-600">{JSON.stringify(change.new)}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  const totalPages = Math.ceil(total / itemsPerPage);

  if (!isAdmin()) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600">You don't have permission to view audit logs.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="bg-white p-4 rounded-lg shadow-sm border mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Admin Audit Log</h1>
            <p className="text-sm text-gray-600 mt-1">
              Complete tracking of all user modifications and activities
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors flex items-center space-x-2"
            >
              <Filter className="w-4 h-4" />
              <span>{showFilters ? 'Hide' : 'Show'} Filters</span>
            </button>
            <button
              onClick={loadAuditLogs}
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center space-x-2"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
            <button
              onClick={handleExport}
              disabled={logs.length === 0}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center space-x-2"
            >
              <Download className="w-4 h-4" />
              <span>Export CSV</span>
            </button>
          </div>
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="bg-white p-4 rounded-lg shadow-sm border mb-6">
          <h3 className="font-semibold text-gray-700 mb-3">Filters</h3>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">User</label>
              <select
                value={filters.user_email || ''}
                onChange={(e) => setFilters({ ...filters, user_email: e.target.value || undefined })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Users</option>
                {availableUsers.map((user) => (
                  <option key={user} value={user}>
                    {user}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Section</label>
              <select
                value={filters.section_name || ''}
                onChange={(e) =>
                  setFilters({ ...filters, section_name: e.target.value as AuditSectionName || undefined })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Sections</option>
                <option value="Patient List">Patient List</option>
                <option value="Patient Entry">Patient Entry</option>
                <option value="Billing">Billing</option>
                <option value="Services">Services</option>
                <option value="Refunds">Refunds</option>
                <option value="Daily Expenses">Daily Expenses</option>
                <option value="IPD Management">IPD Management</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Action</label>
              <select
                value={filters.action_type || ''}
                onChange={(e) =>
                  setFilters({ ...filters, action_type: e.target.value as AuditActionType || undefined })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Actions</option>
                <option value="CREATE">Create</option>
                <option value="UPDATE">Update</option>
                <option value="DELETE">Delete</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">From Date</label>
              <input
                type="date"
                value={filters.date_from || ''}
                onChange={(e) => setFilters({ ...filters, date_from: e.target.value || undefined })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">To Date</label>
              <input
                type="date"
                value={filters.date_to || ''}
                onChange={(e) => setFilters({ ...filters, date_to: e.target.value || undefined })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="mt-4 flex items-center space-x-2">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      setFilters({ ...filters, search: searchTerm || undefined });
                    }
                  }}
                  placeholder="Search by description or record ID... (Press Enter)"
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <button
              onClick={() => {
                setFilters({});
                setSearchTerm('');
                setCurrentPage(1);
              }}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
            >
              Clear Filters
            </button>
          </div>
        </div>
      )}

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="bg-blue-50 p-4 rounded-lg border-2 border-blue-200">
          <h3 className="text-sm font-medium text-blue-700">Total Entries</h3>
          <p className="text-2xl font-bold text-blue-900 mt-1">{total}</p>
        </div>
        <div className="bg-green-50 p-4 rounded-lg border-2 border-green-200">
          <h3 className="text-sm font-medium text-green-700">Showing</h3>
          <p className="text-2xl font-bold text-green-900 mt-1">{logs.length}</p>
        </div>
      </div>

      {/* Audit Logs Table */}
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : logs.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">No audit logs found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date & Time
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Action
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Section
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Record ID
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Description
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Details
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {logs.map((log) => (
                  <React.Fragment key={log.id}>
                    <tr className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm text-gray-900">{formatDate(log.created_at)}</td>
                      <td className="px-4 py-3 text-sm">
                        <div>
                          <p className="font-medium text-gray-900">{log.user_email}</p>
                          <p className="text-xs text-gray-500">{log.user_role}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-semibold ${getActionColor(log.action_type)}`}
                        >
                          {log.action_type}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">{log.section_name}</td>
                      <td className="px-4 py-3 text-sm font-mono text-gray-600 truncate max-w-xs">
                        {log.record_id}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">{log.description || '-'}</td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => toggleRow(log.id)}
                          className="text-blue-600 hover:text-blue-800 transition-colors"
                        >
                          {expandedRows.has(log.id) ? (
                            <ChevronUp className="w-5 h-5 inline" />
                          ) : (
                            <ChevronDown className="w-5 h-5 inline" />
                          )}
                        </button>
                      </td>
                    </tr>
                    {expandedRows.has(log.id) && (
                      <tr>
                        <td colSpan={7} className="px-4 py-4 bg-gray-50">
                          <div className="space-y-4">
                            {renderFieldChanges(log)}
                            <div className="grid grid-cols-2 gap-4 mt-4">
                              <div>
                                <h4 className="font-semibold text-sm text-gray-700 mb-2">Additional Info:</h4>
                                <div className="text-sm space-y-1">
                                  <p>
                                    <span className="font-medium">Table:</span> {log.table_name}
                                  </p>
                                  <p>
                                    <span className="font-medium">User Name:</span> {log.user_name || 'N/A'}
                                  </p>
                                  <p>
                                    <span className="font-medium">IP Address:</span> {log.ip_address || 'N/A'}
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="bg-gray-50 px-4 py-3 flex items-center justify-between border-t">
            <div className="text-sm text-gray-700">
              Showing {(currentPage - 1) * itemsPerPage + 1} to{' '}
              {Math.min(currentPage * itemsPerPage, total)} of {total} entries
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <span className="px-3 py-1 text-sm font-medium text-gray-700">
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-1 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminAuditLog;

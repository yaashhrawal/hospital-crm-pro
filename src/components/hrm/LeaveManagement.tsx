import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import {
  Calendar,
  Plus,
  Check,
  X,
  Clock,
  Filter,
  Download,
  AlertCircle,
  CalendarDays,
  User,
  FileText,
} from 'lucide-react';
import { Button } from '../ui/Button';
import hrmService from '../../services/hrmService';
import type { EmployeeLeave, LeaveFormData } from '../../types/hrm';
import { format, differenceInDays } from 'date-fns';
import { useAuth } from '../../contexts/AuthContext';

const LeaveManagement: React.FC = () => {
  const { user } = useAuth();
  const [showApplyLeave, setShowApplyLeave] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [selectedLeave, setSelectedLeave] = useState<EmployeeLeave | null>(null);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');

  const [leaveFormData, setLeaveFormData] = useState<LeaveFormData>({
    employee_id: '',
    leave_type_id: '',
    start_date: '',
    end_date: '',
    reason: '',
    emergency_contact: '',
  });

  // Fetch leaves
  const { data: leaves, refetch: refetchLeaves } = useQuery({
    queryKey: ['leaves', filterStatus],
    queryFn: () =>
      hrmService.getLeaves(filterStatus ? { status: filterStatus as any } : undefined),
  });

  // Fetch employees
  const { data: employees } = useQuery({
    queryKey: ['active-employees'],
    queryFn: () => hrmService.getEmployees({ is_active: true }),
  });

  // Fetch leave types
  const { data: leaveTypes } = useQuery({
    queryKey: ['leave-types'],
    queryFn: () => hrmService.getLeaveTypes(),
  });

  const handleApplyLeave = async () => {
    if (!leaveFormData.employee_id || !leaveFormData.leave_type_id || !leaveFormData.start_date || !leaveFormData.end_date || !leaveFormData.reason) {
      toast.error('Please fill all required fields');
      return;
    }

    try {
      await hrmService.applyLeave(leaveFormData);
      toast.success('Leave application submitted successfully');
      refetchLeaves();
      setShowApplyLeave(false);
      setLeaveFormData({
        employee_id: '',
        leave_type_id: '',
        start_date: '',
        end_date: '',
        reason: '',
        emergency_contact: '',
      });
    } catch (error) {
      console.error('Error applying leave:', error);
      toast.error('Failed to apply leave');
    }
  };

  const handleApproveLeave = async (leaveId: string) => {
    if (!user?.id) {
      toast.error('User not authenticated');
      return;
    }

    try {
      await hrmService.updateLeaveStatus(leaveId, 'Approved', user.id);
      toast.success('Leave approved successfully');
      refetchLeaves();
      setShowApprovalModal(false);
      setSelectedLeave(null);
    } catch (error) {
      console.error('Error approving leave:', error);
      toast.error('Failed to approve leave');
    }
  };

  const handleRejectLeave = async (leaveId: string) => {
    if (!user?.id) {
      toast.error('User not authenticated');
      return;
    }

    if (!rejectionReason.trim()) {
      toast.error('Please provide a reason for rejection');
      return;
    }

    try {
      await hrmService.updateLeaveStatus(leaveId, 'Rejected', user.id, rejectionReason);
      toast.success('Leave rejected');
      refetchLeaves();
      setShowApprovalModal(false);
      setSelectedLeave(null);
      setRejectionReason('');
    } catch (error) {
      console.error('Error rejecting leave:', error);
      toast.error('Failed to reject leave');
    }
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      Pending: 'bg-yellow-100 text-yellow-800',
      Approved: 'bg-green-100 text-green-800',
      Rejected: 'bg-red-100 text-red-800',
      Cancelled: 'bg-gray-100 text-gray-800',
    };
    return styles[status as keyof typeof styles] || 'bg-gray-100 text-gray-800';
  };

  const exportLeaves = () => {
    if (!leaves || leaves.length === 0) {
      toast.error('No leave records to export');
      return;
    }

    const headers = [
      'Employee ID',
      'Employee Name',
      'Leave Type',
      'Start Date',
      'End Date',
      'Total Days',
      'Reason',
      'Status',
      'Approved By',
    ];

    const csvData = leaves.map((leave) => [
      leave.employee?.employee_id || '',
      leave.employee ? `${leave.employee.first_name} ${leave.employee.last_name}` : '',
      leave.leave_type?.leave_name || '',
      leave.start_date,
      leave.end_date,
      leave.total_days,
      leave.reason,
      leave.status,
      leave.approver ? `${leave.approver.first_name} ${leave.approver.last_name}` : '',
    ]);

    const csv = [headers, ...csvData].map((row) => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `leaves_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();

    toast.success('Leaves exported successfully');
  };

  const pendingLeaves = leaves?.filter((l) => l.status === 'Pending') || [];
  const approvedLeaves = leaves?.filter((l) => l.status === 'Approved') || [];
  const rejectedLeaves = leaves?.filter((l) => l.status === 'Rejected') || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Leave Management</h2>
          <p className="text-gray-600 mt-1">Manage employee leave requests and approvals</p>
        </div>
        <div className="flex gap-3">
          <Button
            onClick={exportLeaves}
            variant="outline"
            className="border-gray-300 text-gray-700"
          >
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
          <Button
            onClick={() => setShowApplyLeave(true)}
            className="bg-primary-600 hover:bg-primary-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            Apply Leave
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Requests</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{leaves?.length || 0}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Calendar className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Pending</p>
              <p className="text-3xl font-bold text-yellow-600 mt-2">{pendingLeaves.length}</p>
            </div>
            <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
              <Clock className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Approved</p>
              <p className="text-3xl font-bold text-green-600 mt-2">{approvedLeaves.length}</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <Check className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Rejected</p>
              <p className="text-3xl font-bold text-red-600 mt-2">{rejectedLeaves.length}</p>
            </div>
            <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
              <X className="w-6 h-6 text-red-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex items-center gap-4">
          <Filter className="w-5 h-5 text-gray-400" />
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
          >
            <option value="">All Status</option>
            <option value="Pending">Pending</option>
            <option value="Approved">Approved</option>
            <option value="Rejected">Rejected</option>
          </select>
        </div>
      </div>

      {/* Leave Requests List */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {leaves && leaves.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Employee
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Leave Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Duration
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Days
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Reason
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {leaves.map((leave) => (
                  <tr key={leave.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 bg-primary-100 rounded-full flex items-center justify-center">
                          <User className="w-5 h-5 text-primary-700" />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {leave.employee?.first_name} {leave.employee?.last_name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {leave.employee?.employee_id}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div
                          className="w-3 h-3 rounded-full mr-2"
                          style={{ backgroundColor: leave.leave_type?.color }}
                        />
                        <span className="text-sm text-gray-900">
                          {leave.leave_type?.leave_name}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {format(new Date(leave.start_date), 'MMM dd, yyyy')}
                      </div>
                      <div className="text-sm text-gray-500">
                        to {format(new Date(leave.end_date), 'MMM dd, yyyy')}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-semibold text-gray-900">
                        {leave.total_days} {leave.total_days === 1 ? 'day' : 'days'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 max-w-xs truncate" title={leave.reason}>
                        {leave.reason}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadge(
                          leave.status
                        )}`}
                      >
                        {leave.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      {leave.status === 'Pending' ? (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              setSelectedLeave(leave);
                              setShowApprovalModal(true);
                            }}
                            className="text-green-600 hover:text-green-900"
                            title="Approve/Reject"
                          >
                            <Check className="w-5 h-5" />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => {
                            setSelectedLeave(leave);
                            setShowApprovalModal(true);
                          }}
                          className="text-blue-600 hover:text-blue-900"
                          title="View Details"
                        >
                          <FileText className="w-5 h-5" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-8 text-center">
            <CalendarDays className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No leave requests</h3>
            <p className="text-gray-600 mb-4">
              {filterStatus
                ? `No ${filterStatus.toLowerCase()} leave requests found`
                : 'No leave requests submitted yet'}
            </p>
          </div>
        )}
      </div>

      {/* Apply Leave Modal */}
      {showApplyLeave && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-lg w-full">
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-bold text-gray-900">Apply for Leave</h3>
                <button
                  onClick={() => setShowApplyLeave(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <span className="text-2xl">&times;</span>
                </button>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Employee *
                </label>
                <select
                  value={leaveFormData.employee_id}
                  onChange={(e) =>
                    setLeaveFormData({ ...leaveFormData, employee_id: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                >
                  <option value="">Select Employee</option>
                  {employees?.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.first_name} {emp.last_name} ({emp.employee_id})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Leave Type *
                </label>
                <select
                  value={leaveFormData.leave_type_id}
                  onChange={(e) =>
                    setLeaveFormData({ ...leaveFormData, leave_type_id: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                >
                  <option value="">Select Leave Type</option>
                  {leaveTypes?.map((type) => (
                    <option key={type.id} value={type.id}>
                      {type.leave_name} ({type.leave_code})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Start Date *
                  </label>
                  <input
                    type="date"
                    value={leaveFormData.start_date}
                    onChange={(e) =>
                      setLeaveFormData({ ...leaveFormData, start_date: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    End Date *
                  </label>
                  <input
                    type="date"
                    value={leaveFormData.end_date}
                    onChange={(e) =>
                      setLeaveFormData({ ...leaveFormData, end_date: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              </div>

              {leaveFormData.start_date && leaveFormData.end_date && (
                <div className="bg-blue-50 rounded-lg p-3">
                  <p className="text-sm text-blue-800">
                    Total Days:{' '}
                    <span className="font-semibold">
                      {differenceInDays(
                        new Date(leaveFormData.end_date),
                        new Date(leaveFormData.start_date)
                      ) + 1}
                    </span>
                  </p>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Reason *
                </label>
                <textarea
                  value={leaveFormData.reason}
                  onChange={(e) =>
                    setLeaveFormData({ ...leaveFormData, reason: e.target.value })
                  }
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  placeholder="Provide reason for leave"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Emergency Contact
                </label>
                <input
                  type="text"
                  value={leaveFormData.emergency_contact}
                  onChange={(e) =>
                    setLeaveFormData({ ...leaveFormData, emergency_contact: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  placeholder="Contact during leave"
                />
              </div>
            </div>
            <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
              <Button
                onClick={() => setShowApplyLeave(false)}
                variant="outline"
                className="border-gray-300"
              >
                Cancel
              </Button>
              <Button onClick={handleApplyLeave} className="bg-primary-600 hover:bg-primary-700">
                <Check className="w-4 h-4 mr-2" />
                Submit Application
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Approval/Details Modal */}
      {showApprovalModal && selectedLeave && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Leave Request Details</h3>
                  <span
                    className={`mt-2 px-3 py-1 inline-flex text-sm leading-5 font-semibold rounded-full ${getStatusBadge(
                      selectedLeave.status
                    )}`}
                  >
                    {selectedLeave.status}
                  </span>
                </div>
                <button
                  onClick={() => {
                    setShowApprovalModal(false);
                    setSelectedLeave(null);
                    setRejectionReason('');
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <span className="text-2xl">&times;</span>
                </button>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Employee</label>
                  <p className="text-gray-900 mt-1">
                    {selectedLeave.employee?.first_name} {selectedLeave.employee?.last_name}
                  </p>
                  <p className="text-sm text-gray-500">{selectedLeave.employee?.employee_id}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Leave Type</label>
                  <p className="text-gray-900 mt-1">{selectedLeave.leave_type?.leave_name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Start Date</label>
                  <p className="text-gray-900 mt-1">
                    {format(new Date(selectedLeave.start_date), 'MMM dd, yyyy')}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">End Date</label>
                  <p className="text-gray-900 mt-1">
                    {format(new Date(selectedLeave.end_date), 'MMM dd, yyyy')}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Total Days</label>
                  <p className="text-gray-900 mt-1 font-semibold">{selectedLeave.total_days}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Applied On</label>
                  <p className="text-gray-900 mt-1">
                    {format(new Date(selectedLeave.created_at), 'MMM dd, yyyy')}
                  </p>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-500">Reason</label>
                <p className="text-gray-900 mt-1">{selectedLeave.reason}</p>
              </div>

              {selectedLeave.emergency_contact && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Emergency Contact</label>
                  <p className="text-gray-900 mt-1">{selectedLeave.emergency_contact}</p>
                </div>
              )}

              {selectedLeave.status === 'Approved' && selectedLeave.approver && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Approved By</label>
                  <p className="text-gray-900 mt-1">
                    {selectedLeave.approver.first_name} {selectedLeave.approver.last_name}
                  </p>
                  <p className="text-sm text-gray-500">
                    on {format(new Date(selectedLeave.approved_at!), 'MMM dd, yyyy')}
                  </p>
                </div>
              )}

              {selectedLeave.status === 'Rejected' && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Rejection Reason</label>
                  <p className="text-gray-900 mt-1">{selectedLeave.rejection_reason}</p>
                </div>
              )}

              {selectedLeave.status === 'Pending' && (
                <div className="border-t border-gray-200 pt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Rejection Reason (if rejecting)
                  </label>
                  <textarea
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    placeholder="Provide reason for rejection..."
                  />
                </div>
              )}
            </div>
            <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
              <Button
                onClick={() => {
                  setShowApprovalModal(false);
                  setSelectedLeave(null);
                  setRejectionReason('');
                }}
                variant="outline"
                className="border-gray-300"
              >
                Close
              </Button>
              {selectedLeave.status === 'Pending' && (
                <>
                  <Button
                    onClick={() => handleRejectLeave(selectedLeave.id)}
                    variant="outline"
                    className="border-red-300 text-red-700 hover:bg-red-50"
                  >
                    <X className="w-4 h-4 mr-2" />
                    Reject
                  </Button>
                  <Button
                    onClick={() => handleApproveLeave(selectedLeave.id)}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <Check className="w-4 h-4 mr-2" />
                    Approve
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LeaveManagement;

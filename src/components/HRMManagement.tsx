import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import {
  Users,
  UserPlus,
  Calendar,
  ClipboardList,
  DollarSign,
  TrendingUp,
  Clock,
  UserCheck,
  UserX,
  AlertCircle,
  Briefcase,
  CalendarDays,
} from 'lucide-react';
import { Button } from './ui/Button';
import hrmService from '../services/hrmService';
import EmployeeList from './hrm/EmployeeList';
import EmployeeForm from './hrm/EmployeeForm';
import AttendanceTracker from './hrm/AttendanceTracker';
import LeaveManagement from './hrm/LeaveManagement';

interface Props {
  onNavigate?: (tab: string) => void;
}

type HRMView = 'dashboard' | 'employees' | 'attendance' | 'leaves' | 'payroll' | 'performance';

const HRMManagement: React.FC<Props> = ({ onNavigate }) => {
  const [currentView, setCurrentView] = useState<HRMView>('dashboard');
  const [showEmployeeForm, setShowEmployeeForm] = useState(false);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(null);

  // Fetch dashboard stats
  const { data: stats, isLoading: statsLoading, refetch: refetchStats } = useQuery({
    queryKey: ['hrm-dashboard-stats'],
    queryFn: () => hrmService.getDashboardStats(),
  });

  const handleAddEmployee = () => {
    setSelectedEmployeeId(null);
    setShowEmployeeForm(true);
  };

  const handleEditEmployee = (employeeId: string) => {
    setSelectedEmployeeId(employeeId);
    setShowEmployeeForm(true);
  };

  const handleCloseEmployeeForm = () => {
    setShowEmployeeForm(false);
    setSelectedEmployeeId(null);
  };

  const renderDashboard = () => (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">HR Dashboard</h2>
          <p className="text-gray-600 mt-1">Manage your hospital staff and HR operations</p>
        </div>
        <Button onClick={handleAddEmployee} className="bg-primary-600 hover:bg-primary-700">
          <UserPlus className="w-4 h-4 mr-2" />
          Add Employee
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Employees */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Employees</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {statsLoading ? '...' : stats?.total_employees || 0}
              </p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <span className="text-gray-600">Active: </span>
            <span className="font-semibold text-green-600 ml-1">
              {stats?.active_employees || 0}
            </span>
          </div>
        </div>

        {/* Present Today */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Present Today</p>
              <p className="text-3xl font-bold text-green-600 mt-2">
                {statsLoading ? '...' : stats?.present_today || 0}
              </p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <UserCheck className="w-6 h-6 text-green-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <span className="text-gray-600">Absent: </span>
            <span className="font-semibold text-red-600 ml-1">
              {stats?.absent_today || 0}
            </span>
          </div>
        </div>

        {/* On Leave */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">On Leave Today</p>
              <p className="text-3xl font-bold text-orange-600 mt-2">
                {statsLoading ? '...' : stats?.on_leave_today || 0}
              </p>
            </div>
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <Calendar className="w-6 h-6 text-orange-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <span className="text-gray-600">Pending Requests: </span>
            <span className="font-semibold text-orange-600 ml-1">
              {stats?.pending_leave_requests || 0}
            </span>
          </div>
        </div>

        {/* Departments */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Departments</p>
              <p className="text-3xl font-bold text-purple-600 mt-2">
                {statsLoading ? '...' : stats?.departments_count || 0}
              </p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <Briefcase className="w-6 h-6 text-purple-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <span className="text-gray-600">New Joinings: </span>
            <span className="font-semibold text-green-600 ml-1">
              {stats?.new_joinings_this_month || 0}
            </span>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <button
            onClick={() => setCurrentView('employees')}
            className="flex items-center p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
          >
            <Users className="w-8 h-8 text-blue-600 mr-3" />
            <div className="text-left">
              <p className="font-semibold text-gray-900">Manage Employees</p>
              <p className="text-sm text-gray-600">View and edit staff</p>
            </div>
          </button>

          <button
            onClick={() => setCurrentView('attendance')}
            className="flex items-center p-4 bg-green-50 rounded-lg hover:bg-green-100 transition-colors"
          >
            <Clock className="w-8 h-8 text-green-600 mr-3" />
            <div className="text-left">
              <p className="font-semibold text-gray-900">Mark Attendance</p>
              <p className="text-sm text-gray-600">Track daily attendance</p>
            </div>
          </button>

          <button
            onClick={() => setCurrentView('leaves')}
            className="flex items-center p-4 bg-orange-50 rounded-lg hover:bg-orange-100 transition-colors"
          >
            <CalendarDays className="w-8 h-8 text-orange-600 mr-3" />
            <div className="text-left">
              <p className="font-semibold text-gray-900">Leave Requests</p>
              <p className="text-sm text-gray-600">Approve/manage leaves</p>
            </div>
          </button>

          <button
            onClick={() => setCurrentView('payroll')}
            className="flex items-center p-4 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors"
          >
            <DollarSign className="w-8 h-8 text-purple-600 mr-3" />
            <div className="text-left">
              <p className="font-semibold text-gray-900">Payroll</p>
              <p className="text-sm text-gray-600">Manage salaries</p>
            </div>
          </button>
        </div>
      </div>

      {/* Recent Activity / Alerts */}
      {stats && stats.pending_leave_requests > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-start">
          <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5 mr-3" />
          <div>
            <h4 className="font-semibold text-yellow-900">Pending Actions</h4>
            <p className="text-sm text-yellow-800 mt-1">
              You have {stats.pending_leave_requests} pending leave request{stats.pending_leave_requests > 1 ? 's' : ''} waiting for approval.
            </p>
            <button
              onClick={() => setCurrentView('leaves')}
              className="text-sm font-medium text-yellow-700 hover:text-yellow-900 mt-2 underline"
            >
              View Requests
            </button>
          </div>
        </div>
      )}
    </div>
  );

  const renderContent = () => {
    if (showEmployeeForm) {
      return (
        <EmployeeForm
          employeeId={selectedEmployeeId}
          onClose={handleCloseEmployeeForm}
          onSuccess={() => {
            handleCloseEmployeeForm();
            refetchStats();
            toast.success(selectedEmployeeId ? 'Employee updated successfully' : 'Employee added successfully');
          }}
        />
      );
    }

    switch (currentView) {
      case 'dashboard':
        return renderDashboard();
      case 'employees':
        return (
          <EmployeeList
            onAddEmployee={handleAddEmployee}
            onEditEmployee={handleEditEmployee}
          />
        );
      case 'attendance':
        return <AttendanceTracker />;
      case 'leaves':
        return <LeaveManagement />;
      case 'payroll':
        return (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
            <DollarSign className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Payroll Module</h3>
            <p className="text-gray-600">Coming soon - Payroll management features</p>
          </div>
        );
      case 'performance':
        return (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
            <TrendingUp className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Performance Reviews</h3>
            <p className="text-gray-600">Coming soon - Performance management features</p>
          </div>
        );
      default:
        return renderDashboard();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Navigation Tabs */}
      {!showEmployeeForm && (
        <div className="mb-6 bg-white rounded-lg shadow-sm border border-gray-200 p-2">
          <div className="flex space-x-2 overflow-x-auto">
            <button
              onClick={() => setCurrentView('dashboard')}
              className={`px-4 py-2 rounded-md font-medium transition-colors whitespace-nowrap ${
                currentView === 'dashboard'
                  ? 'bg-primary-600 text-white'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <span className="flex items-center">
                <TrendingUp className="w-4 h-4 mr-2" />
                Dashboard
              </span>
            </button>
            <button
              onClick={() => setCurrentView('employees')}
              className={`px-4 py-2 rounded-md font-medium transition-colors whitespace-nowrap ${
                currentView === 'employees'
                  ? 'bg-primary-600 text-white'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <span className="flex items-center">
                <Users className="w-4 h-4 mr-2" />
                Employees
              </span>
            </button>
            <button
              onClick={() => setCurrentView('attendance')}
              className={`px-4 py-2 rounded-md font-medium transition-colors whitespace-nowrap ${
                currentView === 'attendance'
                  ? 'bg-primary-600 text-white'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <span className="flex items-center">
                <Clock className="w-4 h-4 mr-2" />
                Attendance
              </span>
            </button>
            <button
              onClick={() => setCurrentView('leaves')}
              className={`px-4 py-2 rounded-md font-medium transition-colors whitespace-nowrap ${
                currentView === 'leaves'
                  ? 'bg-primary-600 text-white'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <span className="flex items-center">
                <CalendarDays className="w-4 h-4 mr-2" />
                Leaves
                {stats && stats.pending_leave_requests > 0 && (
                  <span className="ml-2 px-2 py-0.5 text-xs font-semibold bg-red-500 text-white rounded-full">
                    {stats.pending_leave_requests}
                  </span>
                )}
              </span>
            </button>
            <button
              onClick={() => setCurrentView('payroll')}
              className={`px-4 py-2 rounded-md font-medium transition-colors whitespace-nowrap ${
                currentView === 'payroll'
                  ? 'bg-primary-600 text-white'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <span className="flex items-center">
                <DollarSign className="w-4 h-4 mr-2" />
                Payroll
              </span>
            </button>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="transition-all duration-300">
        {renderContent()}
      </div>
    </div>
  );
};

export default HRMManagement;

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import {
  Calendar,
  Clock,
  UserCheck,
  UserX,
  Download,
  Filter,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  XCircle,
  MinusCircle,
} from 'lucide-react';
import { Button } from '../ui/Button';
import hrmService from '../../services/hrmService';
import type { Employee, EmployeeAttendance } from '../../types/hrm';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, addMonths, subMonths } from 'date-fns';

const AttendanceTracker: React.FC = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [showMarkAttendance, setShowMarkAttendance] = useState(false);
  const [attendanceStatus, setAttendanceStatus] = useState<'Present' | 'Absent' | 'Half-Day' | 'Leave'>('Present');
  const [checkInTime, setCheckInTime] = useState('09:00');
  const [checkOutTime, setCheckOutTime] = useState('18:00');
  const [notes, setNotes] = useState('');

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Fetch employees
  const { data: employees } = useQuery({
    queryKey: ['active-employees'],
    queryFn: () => hrmService.getEmployees({ is_active: true }),
  });

  // Fetch attendance for current month
  const { data: attendanceRecords, refetch: refetchAttendance } = useQuery({
    queryKey: ['attendance', format(monthStart, 'yyyy-MM-dd'), format(monthEnd, 'yyyy-MM-dd')],
    queryFn: () =>
      hrmService.getAttendance({
        start_date: format(monthStart, 'yyyy-MM-dd'),
        end_date: format(monthEnd, 'yyyy-MM-dd'),
      }),
  });

  // Fetch today's attendance summary
  const { data: todayAttendance } = useQuery({
    queryKey: ['today-attendance', format(selectedDate, 'yyyy-MM-dd')],
    queryFn: () =>
      hrmService.getAttendance({
        start_date: format(selectedDate, 'yyyy-MM-dd'),
        end_date: format(selectedDate, 'yyyy-MM-dd'),
      }),
  });

  const getAttendanceForEmployeeAndDate = (employeeId: string, date: Date): EmployeeAttendance | undefined => {
    return attendanceRecords?.find(
      (record) =>
        record.employee_id === employeeId &&
        isSameDay(new Date(record.attendance_date), date)
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Present':
        return 'bg-green-500';
      case 'Absent':
        return 'bg-red-500';
      case 'Half-Day':
        return 'bg-yellow-500';
      case 'Leave':
        return 'bg-blue-500';
      default:
        return 'bg-gray-300';
    }
  };

  const handleMarkAttendance = async () => {
    if (!selectedEmployee) {
      toast.error('Please select an employee');
      return;
    }

    try {
      const attendanceDate = format(selectedDate, 'yyyy-MM-dd');
      const checkIn = attendanceStatus === 'Present' || attendanceStatus === 'Half-Day'
        ? `${attendanceDate}T${checkInTime}:00`
        : undefined;
      const checkOut = attendanceStatus === 'Present' || attendanceStatus === 'Half-Day'
        ? `${attendanceDate}T${checkOutTime}:00`
        : undefined;

      await hrmService.markAttendance({
        employee_id: selectedEmployee.id,
        attendance_date: attendanceDate,
        check_in_time: checkIn,
        check_out_time: checkOut,
        status: attendanceStatus,
        notes,
      });

      toast.success('Attendance marked successfully');
      refetchAttendance();
      setShowMarkAttendance(false);
      setNotes('');
    } catch (error) {
      console.error('Error marking attendance:', error);
      toast.error('Failed to mark attendance');
    }
  };

  const handleBulkMarkPresent = async () => {
    if (!employees) return;

    if (!confirm(`Mark all ${employees.length} employees as present for ${format(selectedDate, 'dd MMM yyyy')}?`)) {
      return;
    }

    try {
      const attendanceDate = format(selectedDate, 'yyyy-MM-dd');
      const promises = employees.map((employee) =>
        hrmService.markAttendance({
          employee_id: employee.id,
          attendance_date: attendanceDate,
          check_in_time: `${attendanceDate}T09:00:00`,
          check_out_time: `${attendanceDate}T18:00:00`,
          status: 'Present',
        })
      );

      await Promise.all(promises);
      toast.success('Bulk attendance marked successfully');
      refetchAttendance();
    } catch (error) {
      console.error('Error marking bulk attendance:', error);
      toast.error('Failed to mark bulk attendance');
    }
  };

  const exportAttendance = () => {
    if (!attendanceRecords || attendanceRecords.length === 0) {
      toast.error('No attendance records to export');
      return;
    }

    const headers = ['Date', 'Employee ID', 'Employee Name', 'Status', 'Check In', 'Check Out', 'Total Hours', 'Notes'];

    const csvData = attendanceRecords.map((record) => [
      format(new Date(record.attendance_date), 'yyyy-MM-dd'),
      record.employee?.employee_id || '',
      record.employee ? `${record.employee.first_name} ${record.employee.last_name}` : '',
      record.status,
      record.check_in_time ? format(new Date(record.check_in_time), 'HH:mm') : '',
      record.check_out_time ? format(new Date(record.check_out_time), 'HH:mm') : '',
      record.total_hours?.toFixed(2) || '',
      record.notes || '',
    ]);

    const csv = [headers, ...csvData].map((row) => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `attendance_${format(monthStart, 'MMM_yyyy')}.csv`;
    a.click();

    toast.success('Attendance exported successfully');
  };

  const todayStats = {
    present: todayAttendance?.filter((a) => a.status === 'Present').length || 0,
    absent: todayAttendance?.filter((a) => a.status === 'Absent').length || 0,
    halfDay: todayAttendance?.filter((a) => a.status === 'Half-Day').length || 0,
    leave: todayAttendance?.filter((a) => a.status === 'Leave').length || 0,
    total: employees?.length || 0,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Attendance Tracker</h2>
          <p className="text-gray-600 mt-1">
            Track and manage employee attendance
          </p>
        </div>
        <div className="flex gap-3">
          <Button
            onClick={exportAttendance}
            variant="outline"
            className="border-gray-300 text-gray-700"
          >
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
          <Button
            onClick={() => setShowMarkAttendance(true)}
            className="bg-primary-600 hover:bg-primary-700"
          >
            <UserCheck className="w-4 h-4 mr-2" />
            Mark Attendance
          </Button>
        </div>
      </div>

      {/* Today's Summary */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{todayStats.total}</p>
            </div>
            <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
              <UserCheck className="w-5 h-5 text-gray-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Present</p>
              <p className="text-2xl font-bold text-green-600 mt-1">{todayStats.present}</p>
            </div>
            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Absent</p>
              <p className="text-2xl font-bold text-red-600 mt-1">{todayStats.absent}</p>
            </div>
            <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
              <XCircle className="w-5 h-5 text-red-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Half-Day</p>
              <p className="text-2xl font-bold text-yellow-600 mt-1">{todayStats.halfDay}</p>
            </div>
            <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
              <MinusCircle className="w-5 h-5 text-yellow-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">On Leave</p>
              <p className="text-2xl font-bold text-blue-600 mt-1">{todayStats.leave}</p>
            </div>
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <Calendar className="w-5 h-5 text-blue-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Calendar View */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        {/* Month Navigation */}
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-semibold text-gray-900">
            {format(currentDate, 'MMMM yyyy')}
          </h3>
          <div className="flex gap-2">
            <button
              onClick={() => setCurrentDate(subMonths(currentDate, 1))}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={() => setCurrentDate(new Date())}
              className="px-4 py-2 text-sm font-medium bg-gray-100 hover:bg-gray-200 rounded-lg"
            >
              Today
            </button>
            <button
              onClick={() => setCurrentDate(addMonths(currentDate, 1))}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Date Selector */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Date for Marking Attendance
          </label>
          <input
            type="date"
            value={format(selectedDate, 'yyyy-MM-dd')}
            onChange={(e) => setSelectedDate(new Date(e.target.value))}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
          />
          <Button
            onClick={handleBulkMarkPresent}
            variant="outline"
            className="ml-3 border-green-300 text-green-700 hover:bg-green-50"
          >
            <CheckCircle className="w-4 h-4 mr-2" />
            Mark All Present for Selected Date
          </Button>
        </div>

        {/* Attendance Grid */}
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="px-4 py-2 text-left text-sm font-medium text-gray-700 sticky left-0 bg-white">
                  Employee
                </th>
                {daysInMonth.map((day) => (
                  <th
                    key={day.toISOString()}
                    className={`px-2 py-2 text-center text-xs font-medium ${
                      isSameDay(day, new Date()) ? 'text-primary-600' : 'text-gray-700'
                    }`}
                  >
                    <div>{format(day, 'd')}</div>
                    <div className="text-xs text-gray-500">{format(day, 'EEE')}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {employees?.map((employee) => (
                <tr key={employee.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 sticky left-0 bg-white">
                    <div className="text-sm font-medium text-gray-900">
                      {employee.first_name} {employee.last_name}
                    </div>
                    <div className="text-xs text-gray-500">{employee.employee_id}</div>
                  </td>
                  {daysInMonth.map((day) => {
                    const attendance = getAttendanceForEmployeeAndDate(employee.id, day);
                    return (
                      <td key={day.toISOString()} className="px-2 py-3 text-center">
                        {attendance ? (
                          <div
                            className={`w-6 h-6 rounded-full ${getStatusColor(attendance.status)} mx-auto`}
                            title={`${attendance.status}${attendance.total_hours ? ` - ${attendance.total_hours}h` : ''}`}
                          />
                        ) : (
                          <div className="w-6 h-6 rounded-full bg-gray-200 mx-auto" title="Not marked" />
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Legend */}
        <div className="mt-6 flex items-center gap-6 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-green-500" />
            <span>Present</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-red-500" />
            <span>Absent</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-yellow-500" />
            <span>Half-Day</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-blue-500" />
            <span>Leave</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-gray-200" />
            <span>Not Marked</span>
          </div>
        </div>
      </div>

      {/* Mark Attendance Modal */}
      {showMarkAttendance && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-bold text-gray-900">Mark Attendance</h3>
                <button
                  onClick={() => setShowMarkAttendance(false)}
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
                  value={selectedEmployee?.id || ''}
                  onChange={(e) => {
                    const emp = employees?.find((emp) => emp.id === e.target.value);
                    setSelectedEmployee(emp || null);
                  }}
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
                  Date *
                </label>
                <input
                  type="date"
                  value={format(selectedDate, 'yyyy-MM-dd')}
                  onChange={(e) => setSelectedDate(new Date(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status *
                </label>
                <select
                  value={attendanceStatus}
                  onChange={(e) => setAttendanceStatus(e.target.value as any)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                >
                  <option value="Present">Present</option>
                  <option value="Absent">Absent</option>
                  <option value="Half-Day">Half-Day</option>
                  <option value="Leave">Leave</option>
                </select>
              </div>

              {(attendanceStatus === 'Present' || attendanceStatus === 'Half-Day') && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Check In
                    </label>
                    <input
                      type="time"
                      value={checkInTime}
                      onChange={(e) => setCheckInTime(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Check Out
                    </label>
                    <input
                      type="time"
                      value={checkOutTime}
                      onChange={(e) => setCheckOutTime(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notes
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  placeholder="Optional notes"
                />
              </div>
            </div>
            <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
              <Button
                onClick={() => setShowMarkAttendance(false)}
                variant="outline"
                className="border-gray-300"
              >
                Cancel
              </Button>
              <Button
                onClick={handleMarkAttendance}
                className="bg-primary-600 hover:bg-primary-700"
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Mark Attendance
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AttendanceTracker;

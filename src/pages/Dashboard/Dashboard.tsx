import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  Users, 
  Calendar, 
  Bed,
  IndianRupee,
  TrendingDown,
  RefreshCw,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { formatCurrency } from '@/utils';
import { dashboardService } from '../../services/dashboardService';
import { useAppointments } from '../../hooks/useAppointments';
import { queryKeys } from '../../config/reactQuery';

export const Dashboard: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [localStorageUpdate, setLocalStorageUpdate] = useState(0);

  // Fetch dashboard data
  const { data: dashboardStats, isLoading: statsLoading, refetch: refetchStats } = useQuery({
    queryKey: queryKeys.dashboardStats,
    queryFn: () => dashboardService.getDashboardStats(),
    refetchInterval: 5 * 60 * 1000,
  });

  // Fetch appointments data  
  const { data: appointmentsData, isLoading: appointmentsLoading } = useAppointments({
    filters: {
      dateRange: {
        start: new Date().toISOString(),
        end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // Next 30 days
      },
    },
    limit: 100,
    sortBy: 'scheduled_at',
    sortOrder: 'asc',
  });

  // Listen for localStorage changes
  useEffect(() => {
    const handleStorageChange = () => {
      setLocalStorageUpdate(prev => prev + 1);
    };

    // Listen for storage events from other tabs/windows
    window.addEventListener('storage', handleStorageChange);
    
    // Also listen for custom event for same-tab updates
    window.addEventListener('appointmentUpdated', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('appointmentUpdated', handleStorageChange);
    };
  }, []);

  // Handle refresh data
  const handleRefreshData = async () => {
    await refetchStats();
  };

  // Calendar navigation
  const navigateMonth = (direction: 'prev' | 'next') => {
    const newMonth = new Date(currentMonth);
    if (direction === 'prev') {
      newMonth.setMonth(newMonth.getMonth() - 1);
    } else {
      newMonth.setMonth(newMonth.getMonth() + 1);
    }
    setCurrentMonth(newMonth);
  };

  // Generate calendar days
  const generateCalendarDays = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());
    
    const days = [];
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 41); // 6 weeks
    
    for (let date = new Date(startDate); date < endDate; date.setDate(date.getDate() + 1)) {
      days.push(new Date(date));
    }
    
    return days;
  };

  // Filter appointments for selected date and next 7 days
  const getUpcomingAppointments = () => {
    // Combine appointments from both sources
    const supabaseAppointments = appointmentsData?.data || [];
    
    // Get appointments from localStorage
    let localAppointments = [];
    try {
      const storedAppointments = localStorage.getItem('hospital_appointments');
      if (storedAppointments) {
        const parsed = JSON.parse(storedAppointments);
        // Transform localStorage appointments to match the expected format
        localAppointments = parsed.map((apt: any) => ({
          id: apt.id,
          scheduled_at: `${apt.appointment_date}T${apt.appointment_time}:00`,
          patient: {
            first_name: apt.patient_name?.split(' ')[0] || '',
            last_name: apt.patient_name?.split(' ').slice(1).join(' ') || '',
          },
          department: {
            name: apt.department || 'General',
          },
          status: apt.status,
          appointment_type: apt.appointment_type,
        }));
      }
    } catch (error) {
      console.error('Error loading localStorage appointments:', error);
    }
    
    // Combine both sources
    const allAppointments = [...supabaseAppointments, ...localAppointments];
    
    const startDate = new Date(selectedDate);
    startDate.setHours(0, 0, 0, 0);
    const endDate = new Date(selectedDate);
    endDate.setDate(endDate.getDate() + 7);
    endDate.setHours(23, 59, 59, 999);
    
    return allAppointments.filter((appointment: any) => {
      const appointmentDate = new Date(appointment.scheduled_at);
      return appointmentDate >= startDate && appointmentDate <= endDate;
    }).slice(0, 10); // Show maximum 10 appointments
  };

  const formatSelectedDateRange = () => {
    const endDate = new Date(selectedDate);
    endDate.setDate(endDate.getDate() + 7);
    return `${selectedDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
  };




  if (statsLoading) {
    return (
      <div className="min-h-screen bg-[#F5F5F5] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#007bff]"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F5F5]" style={{ fontFamily: 'Arial, Helvetica, sans-serif' }}>
      {/* Header */}
      <div className="bg-[#F5F5F5] px-6 py-4">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-[#333333]">Hospital Dashboard</h1>
          <Button 
            onClick={handleRefreshData}
            className="bg-[#007bff] hover:bg-[#0056b3] text-white px-4 py-2 rounded-lg flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh Data
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="px-6 pb-6">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
          {/* Total Patients Card */}
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-[#999999]">Total Patients</h3>
              <Users className="h-5 w-5 text-[#007bff]" />
            </div>
            <div className="text-3xl font-bold text-[#333333] mb-1">
              {dashboardStats?.totalPatients?.toLocaleString() || '0'}
            </div>
            <p className="text-xs text-[#999999]">Updated just now</p>
          </div>

          {/* Admissions Card */}
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-[#999999]">Admissions</h3>
              <Calendar className="h-5 w-5 text-[#007bff]" />
            </div>
            <div className="text-3xl font-bold text-[#333333] mb-1">
              {dashboardStats?.todayAppointments?.toString() || '0'}
            </div>
            <p className="text-xs text-[#999999]">Updated just now</p>
          </div>

          {/* Available Beds Card */}
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-[#999999]">Available Beds</h3>
              <Bed className="h-5 w-5 text-[#007bff]" />
            </div>
            <div className="text-3xl font-bold text-[#333333] mb-1">
              {dashboardStats?.availableBeds?.toString() || '0'}
            </div>
            <p className="text-xs text-[#999999]">Updated just now</p>
          </div>

          {/* Revenue Card */}
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-[#999999]">Revenue</h3>
              <IndianRupee className="h-5 w-5 text-[#007bff]" />
            </div>
            <div className="text-3xl font-bold text-[#333333] mb-1">
              {formatCurrency(dashboardStats?.monthlyRevenue || 0)}
            </div>
            <p className="text-xs text-[#999999]">Updated just now</p>
          </div>

          {/* Expenses Card */}
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-[#999999]">Expenses</h3>
              <TrendingDown className="h-5 w-5 text-[#007bff]" />
            </div>
            <div className="text-3xl font-bold text-[#333333] mb-1">
              {formatCurrency(dashboardStats?.todayExpenses || 0)}
            </div>
            <p className="text-xs text-[#999999]">Updated just now</p>
          </div>
        </div>

        {/* Bottom Row - Calendar and Appointments */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Appointments Calendar */}
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-[#333333] mb-1">Appointments Calendar</h3>
            <p className="text-sm text-[#999999] mb-4">Select a date to view scheduled appointments</p>
            
            {/* Calendar Header */}
            <div className="flex items-center justify-between mb-4">
              <button
                onClick={() => navigateMonth('prev')}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <ChevronLeft className="h-5 w-5 text-[#333333]" />
              </button>
              <h4 className="text-lg font-semibold text-[#333333]">
                {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </h4>
              <button
                onClick={() => navigateMonth('next')}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <ChevronRight className="h-5 w-5 text-[#333333]" />
              </button>
            </div>
            
            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-1 mb-2">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <div key={day} className="p-2 text-center text-sm font-medium text-[#999999]">
                  {day}
                </div>
              ))}
            </div>
            
            <div className="grid grid-cols-7 gap-1">
              {generateCalendarDays().map((date, index) => {
                const isCurrentMonth = date.getMonth() === currentMonth.getMonth();
                const isToday = date.toDateString() === new Date().toDateString();
                const isSelected = date.toDateString() === selectedDate.toDateString();
                
                return (
                  <button
                    key={index}
                    onClick={() => setSelectedDate(date)}
                    className={`
                      p-2 text-sm rounded-lg transition-colors
                      ${
                        isCurrentMonth
                          ? isToday
                            ? 'bg-[#007bff] text-white font-bold'
                            : isSelected
                            ? 'bg-[#007bff] text-white'
                            : 'text-[#333333] hover:bg-gray-100'
                          : 'text-[#999999] hover:bg-gray-50'
                      }
                    `}
                  >
                    {date.getDate()}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Upcoming Appointments */}
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-[#333333] mb-1">Upcoming Appointments</h3>
            <p className="text-sm text-[#999999] mb-4">
              Showing appointments for {formatSelectedDateRange()}
            </p>
            
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {appointmentsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#007bff]"></div>
                </div>
              ) : (
                (() => {
                  const upcomingAppointments = getUpcomingAppointments();
                  
                  if (upcomingAppointments.length === 0) {
                    return (
                      <div className="text-center py-8 text-[#999999]">
                        <Calendar className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p>No appointments for this date range.</p>
                      </div>
                    );
                  }
                  
                  return upcomingAppointments.map((appointment: any) => (
                    <div key={appointment.id} className="border-l-4 border-[#007bff] pl-4 py-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium text-[#333333]">
                            {appointment.patient?.first_name} {appointment.patient?.last_name}
                          </p>
                          <p className="text-sm text-[#999999]">
                            {appointment.department?.name || 'General'}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium text-[#333333]">
                            {new Date(appointment.scheduled_at).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric'
                            })}
                          </p>
                          <p className="text-sm text-[#999999]">
                            {new Date(appointment.scheduled_at).toLocaleTimeString('en-US', {
                              hour: '2-digit',
                              minute: '2-digit',
                              hour12: true
                            })}
                          </p>
                        </div>
                      </div>
                    </div>
                  ));
                })()
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

};
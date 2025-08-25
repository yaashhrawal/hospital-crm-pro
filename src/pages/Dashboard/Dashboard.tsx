import { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { 
  Users, 
  Calendar, 
  Bed,
  IndianRupee,
  TrendingDown,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  CalendarIcon
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { formatCurrency } from '@/utils';
import HospitalService from '../../services/hospitalService';
import { useAppointments } from '../../hooks/useAppointments';
import { queryKeys } from '../../config/reactQuery';

export const Dashboard: React.FC = () => {
  const queryClient = useQueryClient();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [localStorageUpdate, setLocalStorageUpdate] = useState(0);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastRefreshTime, setLastRefreshTime] = useState(new Date());
  const [dateFilter, setDateFilter] = useState<{ start: Date | null; end: Date | null }>({
    start: new Date(),
    end: new Date()
  });
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [expandedCard, setExpandedCard] = useState<string | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState<'today' | 'thisWeek' | 'thisMonth' | null>('today');

  // Fetch dashboard data with date filter
  const { data: dashboardStats, isLoading: statsLoading, refetch: refetchStats } = useQuery({
    queryKey: [...queryKeys.dashboardStats, dateFilter, Date.now()], // Add timestamp for cache busting
    queryFn: async () => {
      console.log('🔄 Fetching dashboard data...', new Date().toLocaleTimeString());
      console.log('📅 Dashboard dateFilter:', { start: dateFilter.start, end: dateFilter.end });
      console.log('📊 Dashboard State Debug:', {
        hasDateFilter: !!(dateFilter.start && dateFilter.end),
        isTodayFilter: dateFilter.start && dateFilter.end && 
          dateFilter.start.toDateString() === dateFilter.end.toDateString() &&
          dateFilter.start.toDateString() === new Date().toDateString(),
        startDate: dateFilter.start?.toISOString(),
        endDate: dateFilter.end?.toISOString()
      });
      
      // If date filter is applied, fetch filtered data
      if (dateFilter.start && dateFilter.end) {
        console.log('📊 Using filtered dashboard stats for date range');
        // Handle same-day date ranges properly
        const startDate = new Date(dateFilter.start);
        const endDate = new Date(dateFilter.end);
        
        // For same-day ranges, set end time to end of day
        if (startDate.toDateString() === endDate.toDateString()) {
          endDate.setHours(23, 59, 59, 999);
        }
        
        return await HospitalService.getDashboardStatsWithDateRange(
          startDate.toISOString(),
          endDate.toISOString()
        );
      }
      
      console.log('📊 Using default dashboard stats (no date filter)');
      const stats = await HospitalService.getDashboardStats();
      return stats;
    },
    refetchInterval: autoRefresh ? 10 * 1000 : false, // Refresh every 10 seconds for immediate updates
    staleTime: 0, // Always consider data stale
    cacheTime: 0, // Don't cache data
    onSuccess: (data) => {
      setLastRefreshTime(new Date());
      console.log('✅ Dashboard data refreshed:', {
        todayRevenue: data?.todayRevenue,
        totalPatients: data?.totalPatients,
        timestamp: new Date().toLocaleTimeString()
      });
    },
  });

  // Fetch appointments data  
  const { data: appointmentsData, isLoading: appointmentsLoading, refetch: refetchAppointments } = useAppointments({
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

  // Manual refresh function
  const handleManualRefresh = async () => {
    console.log('🔄 Manual refresh triggered...');
    try {
      // Force immediate refresh by invalidating queries
      await queryClient.invalidateQueries({ queryKey: queryKeys.dashboardStats });
      await queryClient.refetchQueries({ queryKey: queryKeys.dashboardStats });
      
      // Also refetch appointments
      if (refetchStats && refetchAppointments) {
        await Promise.all([refetchStats(), refetchAppointments()]);
      }
      
      setLastRefreshTime(new Date());
      console.log('✅ Manual refresh completed');
    } catch (error) {
      console.error('❌ Refresh failed:', error);
    }
  };

  // Format last refresh time
  const formatLastRefresh = (time: Date) => {
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - time.getTime()) / 1000);
    
    if (diffInSeconds < 60) return `${diffInSeconds}s ago`;
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    return time.toLocaleTimeString();
  };

  // Force immediate refresh on mount and listen for updates
  useEffect(() => {
    // Immediate refresh on mount
    console.log('🚀 Dashboard mounted, forcing immediate refresh...');
    queryClient.invalidateQueries({ queryKey: queryKeys.dashboardStats });
    
    const handleStorageChange = () => {
      setLocalStorageUpdate(prev => prev + 1);
    };
    
    const handleTransactionUpdate = () => {
      console.log('📊 Transaction updated, refreshing dashboard stats...');
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboardStats });
      refetchStats();
      setLastRefreshTime(new Date());
    };

    // Listen for storage events from other tabs/windows
    window.addEventListener('storage', handleStorageChange);
    
    // Also listen for custom event for same-tab updates
    window.addEventListener('appointmentUpdated', handleStorageChange);
    
    // Listen for transaction updates
    window.addEventListener('transactionUpdated', handleTransactionUpdate);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('appointmentUpdated', handleStorageChange);
      window.removeEventListener('transactionUpdated', handleTransactionUpdate);
    };
  }, [queryClient, refetchStats]);

  // Update the "time ago" display every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      // Force re-render to update the "formatLastRefresh" display
      setLocalStorageUpdate(prev => prev + 1);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  // Handle refresh data (updated to use the new manual refresh function)
  const handleRefreshData = handleManualRefresh;

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
    // Debug: Log the appointments data structure
    console.log('Appointments Data from API:', appointmentsData);
    console.log('Appointments Data type:', typeof appointmentsData);
    console.log('Has data property?:', appointmentsData?.data);
    
    // Combine appointments from both sources
    const supabaseAppointments = appointmentsData?.data || [];
    
    // Get appointments from localStorage
    let localAppointments = [];
    try {
      const storedAppointments = localStorage.getItem('hospital_appointments');
      if (storedAppointments) {
        const parsed = JSON.parse(storedAppointments);
        console.log('LocalStorage appointments:', parsed);
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
    console.log('Combined appointments:', allAppointments);
    
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
          <div>
            <h1 className="text-2xl font-bold text-[#333333]">Hospital Dashboard</h1>
            <p className="text-sm text-[#666666] mt-1">
              {autoRefresh ? '🟢 Auto-refresh: ON (30s)' : '🔴 Auto-refresh: OFF'} • Last updated: {formatLastRefresh(lastRefreshTime)}
              {dateFilter.start && dateFilter.end && (
                <span className="ml-2 text-[#007bff]">
                  • Filtered: {dateFilter.start.toLocaleDateString()} - {dateFilter.end.toLocaleDateString()}
                </span>
              )}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <label className="text-sm text-[#333333] font-medium">Auto Refresh:</label>
              <button
                onClick={() => setAutoRefresh(!autoRefresh)}
                className={`px-3 py-1 text-xs rounded-full font-medium transition-colors ${
                  autoRefresh 
                    ? 'bg-green-100 text-green-700 hover:bg-green-200' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {autoRefresh ? 'ON' : 'OFF'}
              </button>
            </div>
            
            {/* Date Filter Button */}
            <div className="relative">
              <Button
                onClick={() => setShowDatePicker(!showDatePicker)}
                className="bg-white border border-gray-300 text-[#333333] px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-gray-50"
              >
                <CalendarIcon className="h-4 w-4" />
                {dateFilter.start && dateFilter.end ? 'Filtered' : 'Date Filter'}
              </Button>
              
              {showDatePicker && (
                <div className="absolute right-0 top-12 bg-white border rounded-lg shadow-lg p-4 z-50 w-72">
                  <h3 className="text-sm font-semibold text-[#333333] mb-3">Select Date Range</h3>
                  
                  <div className="space-y-3">
                    <div>
                      <label className="text-xs text-[#666666]">From Date</label>
                      <input
                        type="date"
                        className="w-full px-3 py-2 border rounded-md text-sm"
                        value={dateFilter.start ? dateFilter.start.toISOString().split('T')[0] : ''}
                        onChange={(e) => {
                          const date = e.target.value ? new Date(e.target.value) : null;
                          setDateFilter(prev => ({ ...prev, start: date }));
                        }}
                      />
                    </div>
                    
                    <div>
                      <label className="text-xs text-[#666666]">To Date</label>
                      <input
                        type="date"
                        className="w-full px-3 py-2 border rounded-md text-sm"
                        value={dateFilter.end ? dateFilter.end.toISOString().split('T')[0] : ''}
                        onChange={(e) => {
                          const date = e.target.value ? new Date(e.target.value) : null;
                          setDateFilter(prev => ({ ...prev, end: date }));
                        }}
                      />
                    </div>
                    
                    <div className="flex gap-2 pt-2">
                      <button
                        onClick={() => {
                          refetchStats();
                          setShowDatePicker(false);
                        }}
                        className="flex-1 px-3 py-2 bg-[#007bff] text-white text-sm rounded-md hover:bg-[#0056b3]"
                        disabled={!dateFilter.start || !dateFilter.end}
                      >
                        Apply Filter
                      </button>
                      
                      <button
                        onClick={() => {
                          setDateFilter({ start: null, end: null });
                          refetchStats();
                          setShowDatePicker(false);
                        }}
                        className="flex-1 px-3 py-2 bg-gray-100 text-[#333333] text-sm rounded-md hover:bg-gray-200"
                      >
                        Clear Filter
                      </button>
                    </div>
                    
                    {/* Quick Filters */}
                    <div className="border-t pt-3 mt-3">
                      <p className="text-xs text-[#666666] mb-2">Quick Filters</p>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={() => {
                            const today = new Date();
                            setDateFilter({ start: today, end: today });
                            refetchStats();
                            setShowDatePicker(false);
                          }}
                          className="px-2 py-1 text-xs bg-gray-50 rounded hover:bg-gray-100"
                        >
                          Today
                        </button>
                        <button
                          onClick={() => {
                            const end = new Date();
                            const start = new Date();
                            start.setDate(start.getDate() - 7);
                            setDateFilter({ start, end });
                            refetchStats();
                            setShowDatePicker(false);
                          }}
                          className="px-2 py-1 text-xs bg-gray-50 rounded hover:bg-gray-100"
                        >
                          Last 7 Days
                        </button>
                        <button
                          onClick={() => {
                            const end = new Date();
                            const start = new Date();
                            start.setDate(start.getDate() - 30);
                            setDateFilter({ start, end });
                            refetchStats();
                            setShowDatePicker(false);
                          }}
                          className="px-2 py-1 text-xs bg-gray-50 rounded hover:bg-gray-100"
                        >
                          Last 30 Days
                        </button>
                        <button
                          onClick={() => {
                            const now = new Date();
                            const start = new Date(now.getFullYear(), now.getMonth(), 1);
                            const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
                            setDateFilter({ start, end });
                            refetchStats();
                            setShowDatePicker(false);
                          }}
                          className="px-2 py-1 text-xs bg-gray-50 rounded hover:bg-gray-100"
                        >
                          This Month
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            <Button 
              onClick={() => {
                console.log('🔄 DASHBOARD REFRESH BUTTON CLICKED - Simple refresh: reloading page...');
                console.log('📊 Dashboard state before refresh:', {
                  dateFilter,
                  selectedPeriod,
                  autoRefresh,
                  lastRefreshTime
                });
                window.location.reload();
              }}
              className="bg-[#007bff] hover:bg-[#0056b3] text-white px-4 py-2 rounded-lg flex items-center gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh Data
            </Button>
            
            <Button 
              onClick={() => {
                console.log('🔥 FORCE CACHE CLEAR BUTTON CLICKED');
                queryClient.clear(); // Clear all cache
                window.location.reload(); // Force full page reload
              }}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
            >
              🔥 Clear Cache
            </Button>
          </div>
        </div>
      </div>


      {/* Summary Cards */}
      <div className="px-6 pb-6">
        {/* Show detailed view if date filter is active */}
        {dateFilter.start && dateFilter.end && dashboardStats?.details && (
          <div className="mb-6 bg-white rounded-lg p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-[#333333] mb-4">
              Detailed Analytics for {dateFilter.start.toLocaleDateString()} - {dateFilter.end.toLocaleDateString()}
            </h2>
            
            {/* Revenue Breakdown */}
            <div className="mb-6">
              <h3 className="text-md font-semibold text-[#007bff] mb-3">Revenue Breakdown</h3>
              
              {/* Debug info - Check data structure */}
              {(() => {
                if (dashboardStats?.details?.revenue) {
                  console.log('=== DEBUGGING PERIOD BREAKDOWN ===');
                  console.log('Full dashboardStats:', dashboardStats);
                  console.log('Revenue details:', dashboardStats.details.revenue);
                  console.log('Period breakdown exists?', !!dashboardStats.details.revenue.periodBreakdown);
                  console.log('Period breakdown data:', dashboardStats.details.revenue.periodBreakdown);
                  console.log('Today data:', dashboardStats.details.revenue.periodBreakdown?.today);
                  console.log('This Week data:', dashboardStats.details.revenue.periodBreakdown?.thisWeek);
                  console.log('This Month data:', dashboardStats.details.revenue.periodBreakdown?.thisMonth);
                  console.log('==============================');
                }
                return null;
              })()}
              
              {/* Period Cards */}
              {dashboardStats?.details?.revenue?.periodBreakdown ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  {/* Today Card */}
                  <button 
                    className={`p-4 rounded-lg cursor-pointer transition-all hover:shadow-lg text-left w-full ${
                      selectedPeriod === 'today' ? 'bg-blue-50 border-2 border-blue-200 shadow-md' : 'bg-[#F5F5F5] hover:bg-gray-100'
                    }`}
                    onClick={() => {
                      setSelectedPeriod(selectedPeriod === 'today' ? null : 'today');
                    }}
                    type="button"
                  >
                    <p className="text-sm text-[#666666] mb-2">Today <span className="text-xs text-blue-500">(click for details)</span></p>
                    <p className="text-2xl font-bold text-green-600">
                      {formatCurrency(dashboardStats.details.revenue.periodBreakdown.today?.revenue || 0)}
                    </p>
                    <p className="text-xs text-[#666666]">
                      {dashboardStats.details.revenue.periodBreakdown.today?.count || 0} records
                    </p>
                  </button>
                  
                  {/* This Week Card */}
                  <button 
                    className={`p-4 rounded-lg cursor-pointer transition-all hover:shadow-lg text-left w-full ${
                      selectedPeriod === 'thisWeek' ? 'bg-blue-50 border-2 border-blue-200 shadow-md' : 'bg-[#F5F5F5] hover:bg-gray-100'
                    }`}
                    onClick={() => {
                      setSelectedPeriod(selectedPeriod === 'thisWeek' ? null : 'thisWeek');
                    }}
                    type="button"
                  >
                    <p className="text-sm text-[#666666] mb-2">This Week <span className="text-xs text-blue-500">(click for details)</span></p>
                    <p className="text-2xl font-bold text-green-600">
                      {formatCurrency(dashboardStats.details.revenue.periodBreakdown.thisWeek?.revenue || 0)}
                    </p>
                    <p className="text-xs text-[#666666]">
                      {dashboardStats.details.revenue.periodBreakdown.thisWeek?.count || 0} records
                    </p>
                  </button>
                  
                  {/* This Month Card */}
                  <button 
                    className={`p-4 rounded-lg cursor-pointer transition-all hover:shadow-lg text-left w-full ${
                      selectedPeriod === 'thisMonth' ? 'bg-blue-50 border-2 border-blue-200 shadow-md' : 'bg-[#F5F5F5] hover:bg-gray-100'
                    }`}
                    onClick={() => {
                      setSelectedPeriod(selectedPeriod === 'thisMonth' ? null : 'thisMonth');
                    }}
                    type="button"
                  >
                    <p className="text-sm text-[#666666] mb-2">This Month <span className="text-xs text-blue-500">(click for details)</span></p>
                    <p className="text-2xl font-bold text-purple-600">
                      {formatCurrency(dashboardStats.details.revenue.periodBreakdown.thisMonth?.revenue || 0)}
                    </p>
                    <p className="text-xs text-[#666666]">
                      {dashboardStats.details.revenue.periodBreakdown.thisMonth?.count || 0} records
                    </p>
                  </button>
                </div>
              ) : (
                <div className="text-center py-8 text-[#666666]">
                  <p>❌ No period breakdown data available. Apply a date filter to see revenue periods.</p>
                  <p className="text-xs mt-2">Debug: {JSON.stringify({
                    hasStats: !!dashboardStats,
                    hasDetails: !!dashboardStats?.details,
                    hasRevenue: !!dashboardStats?.details?.revenue,
                    hasPeriodBreakdown: !!dashboardStats?.details?.revenue?.periodBreakdown
                  })}</p>
                </div>
              )}
              
              {/* Detailed breakdown for selected period */}
              {selectedPeriod && dashboardStats.details.revenue.periodBreakdown && (
                <div className="mb-6 bg-white border-2 border-blue-100 rounded-lg p-4">
                  <h4 className="text-lg font-semibold text-[#333333] mb-4">
                    {selectedPeriod === 'today' && 'Today\'s Revenue Details'}
                    {selectedPeriod === 'thisWeek' && 'This Week\'s Revenue Details'}
                    {selectedPeriod === 'thisMonth' && 'This Month\'s Revenue Details'}
                  </h4>
                  
                  <div className="mb-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium text-[#333333]">Total Revenue:</span>
                      <span className="text-lg font-bold text-green-600">
                        {formatCurrency(dashboardStats.details.revenue.periodBreakdown[selectedPeriod].revenue)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-[#666666]">Total Transactions:</span>
                      <span className="text-sm font-medium text-[#333333]">
                        {dashboardStats.details.revenue.periodBreakdown[selectedPeriod].count}
                      </span>
                    </div>
                  </div>
                  
                  {/* Recent transactions for the selected period */}
                  {dashboardStats.details.revenue.periodBreakdown[selectedPeriod].transactions.length > 0 && (
                    <div>
                      <h5 className="text-md font-medium text-[#333333] mb-3">Recent Transactions</h5>
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-3 py-2 text-left">Patient</th>
                              <th className="px-3 py-2 text-left">Type</th>
                              <th className="px-3 py-2 text-left">Payment</th>
                              <th className="px-3 py-2 text-right">Amount</th>
                              <th className="px-3 py-2 text-left">Date</th>
                            </tr>
                          </thead>
                          <tbody>
                            {dashboardStats.details.revenue.periodBreakdown[selectedPeriod].transactions.slice(0, 10).map((trans: any, index: number) => (
                              <tr key={index} className="border-b hover:bg-gray-50">
                                <td className="px-3 py-2">{trans.patientName || 'N/A'}</td>
                                <td className="px-3 py-2">{trans.transaction_type?.replace(/_/g, ' ')}</td>
                                <td className="px-3 py-2">{trans.payment_mode}</td>
                                <td className="px-3 py-2 text-right font-medium">{formatCurrency(trans.amount)}</td>
                                <td className="px-3 py-2">{(() => {
                                  // Use same logic as ComprehensivePatientList - transaction_date as priority
                                  let displayDate = null;
                                  if (trans.transaction_date) {
                                    displayDate = trans.transaction_date;
                                  } else {
                                    displayDate = trans.created_at;
                                  }
                                  return new Date(displayDate).toLocaleDateString();
                                })()}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              )}
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div className="bg-[#F5F5F5] p-4 rounded-lg">
                  <p className="text-sm text-[#666666]">By Transaction Type</p>
                  {Object.entries(dashboardStats.details.revenue.byType || {}).map(([type, amount]) => (
                    <div key={type} className="flex justify-between mt-2">
                      <span className="text-sm">{type.replace(/_/g, ' ')}</span>
                      <span className="text-sm font-medium">{formatCurrency(amount as number)}</span>
                    </div>
                  ))}
                </div>
                
                <div className="bg-[#F5F5F5] p-4 rounded-lg">
                  <p className="text-sm text-[#666666]">By Payment Mode</p>
                  {Object.entries(dashboardStats.details.revenue.byPaymentMode || {}).map(([mode, amount]) => (
                    <div key={mode} className="flex justify-between mt-2">
                      <span className="text-sm">{mode}</span>
                      <span className="text-sm font-medium">{formatCurrency(amount as number)}</span>
                    </div>
                  ))}
                </div>
                
                <div className="bg-[#F5F5F5] p-4 rounded-lg">
                  <p className="text-sm text-[#666666]">By Department</p>
                  {Object.entries(dashboardStats.details.revenue.byDepartment || {}).map(([dept, amount]) => (
                    <div key={dept} className="flex justify-between mt-2">
                      <span className="text-sm">{dept}</span>
                      <span className="text-sm font-medium">{formatCurrency(amount as number)}</span>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Top Transactions */}
              {dashboardStats.details.revenue.topTransactions?.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-[#333333] mb-2">Recent Transactions</p>
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                      <thead className="bg-[#F5F5F5]">
                        <tr>
                          <th className="px-4 py-2 text-left">Patient</th>
                          <th className="px-4 py-2 text-left">Type</th>
                          <th className="px-4 py-2 text-left">Payment Mode</th>
                          <th className="px-4 py-2 text-right">Amount</th>
                          <th className="px-4 py-2 text-left">Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {dashboardStats.details.revenue.topTransactions.slice(0, 5).map((trans: any) => (
                          <tr key={trans.id} className="border-b">
                            <td className="px-4 py-2">{trans.patientName || 'N/A'}</td>
                            <td className="px-4 py-2">{trans.transaction_type?.replace(/_/g, ' ')}</td>
                            <td className="px-4 py-2">{trans.payment_mode}</td>
                            <td className="px-4 py-2 text-right">{formatCurrency(trans.amount)}</td>
                            <td className="px-4 py-2">{(() => {
                              // Use same logic as ComprehensivePatientList - transaction_date as priority
                              let displayDate = null;
                              if (trans.transaction_date) {
                                displayDate = trans.transaction_date;
                              } else {
                                displayDate = trans.created_at;
                              }
                              return new Date(displayDate).toLocaleDateString();
                            })()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
            
            {/* Expenses Breakdown */}
            <div className="mb-6">
              <h3 className="text-md font-semibold text-[#007bff] mb-3">Expenses Breakdown</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-[#F5F5F5] p-4 rounded-lg">
                  <p className="text-sm text-[#666666]">By Category</p>
                  {Object.entries(dashboardStats.details.expenses.byCategory || {}).map(([category, amount]) => (
                    <div key={category} className="flex justify-between mt-2">
                      <span className="text-sm">{category.replace(/_/g, ' ')}</span>
                      <span className="text-sm font-medium">{formatCurrency(amount as number)}</span>
                    </div>
                  ))}
                </div>
                
                {dashboardStats.details.expenses.topExpenses?.length > 0 && (
                  <div className="bg-[#F5F5F5] p-4 rounded-lg">
                    <p className="text-sm text-[#666666]">Recent Expenses</p>
                    {dashboardStats.details.expenses.topExpenses.slice(0, 5).map((expense: any) => (
                      <div key={expense.id} className="mt-2">
                        <div className="flex justify-between">
                          <span className="text-sm">{expense.description}</span>
                          <span className="text-sm font-medium">{formatCurrency(expense.amount)}</span>
                        </div>
                        <span className="text-xs text-[#999999]">{expense.expense_category} - {new Date(expense.expense_date).toLocaleDateString()}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            
            {/* Patients Summary */}
            {dashboardStats.details.patients.recentPatients?.length > 0 && (
              <div className="mb-6">
                <h3 className="text-md font-semibold text-[#007bff] mb-3">New Patients ({dashboardStats.details.patients.total})</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {dashboardStats.details.patients.recentPatients.slice(0, 6).map((patient: any) => (
                    <div key={patient.id} className="bg-[#F5F5F5] p-3 rounded-lg">
                      <p className="text-sm font-medium">{patient.first_name} {patient.last_name}</p>
                      <p className="text-xs text-[#666666]">ID: {patient.patient_id}</p>
                      <p className="text-xs text-[#666666]">Phone: {patient.phone}</p>
                      <p className="text-xs text-[#999999]">Registered: {new Date(patient.created_at).toLocaleDateString()}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* Appointments Summary */}
            {dashboardStats.details.appointments.recentAppointments?.length > 0 && (
              <div className="mb-6">
                <h3 className="text-md font-semibold text-[#007bff] mb-3">Appointments ({dashboardStats.details.appointments.total})</h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead className="bg-[#F5F5F5]">
                      <tr>
                        <th className="px-4 py-2 text-left">Patient</th>
                        <th className="px-4 py-2 text-left">Doctor</th>
                        <th className="px-4 py-2 text-left">Date</th>
                        <th className="px-4 py-2 text-left">Time</th>
                        <th className="px-4 py-2 text-left">Type</th>
                        <th className="px-4 py-2 text-left">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dashboardStats.details.appointments.recentAppointments.slice(0, 5).map((apt: any) => (
                        <tr key={apt.id} className="border-b">
                          <td className="px-4 py-2">{apt.patient?.first_name} {apt.patient?.last_name}</td>
                          <td className="px-4 py-2">{apt.doctor?.first_name} {apt.doctor?.last_name}</td>
                          <td className="px-4 py-2">{new Date(apt.appointment_date).toLocaleDateString()}</td>
                          <td className="px-4 py-2">{apt.appointment_time}</td>
                          <td className="px-4 py-2">{apt.appointment_type}</td>
                          <td className="px-4 py-2">
                            <span className={`px-2 py-1 text-xs rounded-full ${
                              apt.status === 'COMPLETED' ? 'bg-green-100 text-green-700' :
                              apt.status === 'CANCELLED' ? 'bg-red-100 text-red-700' :
                              'bg-yellow-100 text-yellow-700'
                            }`}>
                              {apt.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
            
            {/* Beds Status */}
            <div>
              <h3 className="text-md font-semibold text-[#007bff] mb-3">Bed Status</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="bg-green-50 p-3 rounded-lg">
                  <p className="text-2xl font-bold text-green-700">{dashboardStats.details.beds.available}</p>
                  <p className="text-sm text-green-600">Available</p>
                </div>
                <div className="bg-red-50 p-3 rounded-lg">
                  <p className="text-2xl font-bold text-red-700">{dashboardStats.details.beds.occupied}</p>
                  <p className="text-sm text-red-600">Occupied</p>
                </div>
                <div className="bg-blue-50 p-3 rounded-lg">
                  <p className="text-2xl font-bold text-blue-700">{dashboardStats.details.beds.total}</p>
                  <p className="text-sm text-blue-600">Total Beds</p>
                </div>
                <div className="bg-purple-50 p-3 rounded-lg">
                  <p className="text-2xl font-bold text-purple-700">
                    {dashboardStats.details.beds.total > 0 
                      ? Math.round((dashboardStats.details.beds.occupied / dashboardStats.details.beds.total) * 100) 
                      : 0}%
                  </p>
                  <p className="text-sm text-purple-600">Occupancy Rate</p>
                </div>
              </div>
            </div>
          </div>
        )}
        
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
          {/* Total Patients Card */}
          <div 
            className={`bg-white rounded-lg p-6 shadow-sm cursor-pointer transition-all hover:shadow-md ${
              expandedCard === 'patients' ? 'ring-2 ring-[#007bff]' : ''
            }`}
            onClick={() => setExpandedCard(expandedCard === 'patients' ? null : 'patients')}
          >
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-[#999999]">
                {dateFilter.start && dateFilter.end ? 'New Patients' : 'Total Patients'}
              </h3>
              <Users className="h-5 w-5 text-[#007bff]" />
            </div>
            <div className="text-3xl font-bold text-[#333333] mb-1">
              {dashboardStats?.totalPatients?.toLocaleString() || '0'}
            </div>
            <p className="text-xs text-[#999999]">
              {dateFilter.start && dateFilter.end 
                ? `Created in selected period` 
                : 'Updated just now'
              }
            </p>
            
            {/* Expanded details */}
            {expandedCard === 'patients' && dashboardStats?.details?.patients && (
              <div className="mt-4 pt-4 border-t">
                <p className="text-sm font-medium text-[#333333] mb-2">Recent Patients</p>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {dashboardStats.details.patients.recentPatients?.slice(0, 3).map((patient: any) => (
                    <div key={patient.id} className="text-xs">
                      <p className="font-medium">{patient.first_name} {patient.last_name}</p>
                      <p className="text-[#666666]">ID: {patient.patient_id} • {patient.phone}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Admissions Card */}
          <div 
            className={`bg-white rounded-lg p-6 shadow-sm cursor-pointer transition-all hover:shadow-md ${
              expandedCard === 'appointments' ? 'ring-2 ring-[#007bff]' : ''
            }`}
            onClick={() => setExpandedCard(expandedCard === 'appointments' ? null : 'appointments')}
          >
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-[#999999]">Appointments</h3>
              <Calendar className="h-5 w-5 text-[#007bff]" />
            </div>
            <div className="text-3xl font-bold text-[#333333] mb-1">
              {dashboardStats?.todayAppointments?.toString() || '0'}
            </div>
            <p className="text-xs text-[#999999]">
              {dateFilter.start && dateFilter.end 
                ? `In selected period` 
                : 'Updated just now'
              }
            </p>
            
            {/* Expanded details */}
            {expandedCard === 'appointments' && dashboardStats?.details?.appointments && (
              <div className="mt-4 pt-4 border-t">
                <p className="text-sm font-medium text-[#333333] mb-2">Recent Appointments</p>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {dashboardStats.details.appointments.recentAppointments?.slice(0, 3).map((apt: any) => (
                    <div key={apt.id} className="text-xs">
                      <p className="font-medium">{apt.patient?.first_name} {apt.patient?.last_name}</p>
                      <p className="text-[#666666]">{new Date(apt.appointment_date).toLocaleDateString()} • {apt.appointment_time}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Available Beds Card */}
          <div 
            className={`bg-white rounded-lg p-6 shadow-sm cursor-pointer transition-all hover:shadow-md ${
              expandedCard === 'beds' ? 'ring-2 ring-[#007bff]' : ''
            }`}
            onClick={() => setExpandedCard(expandedCard === 'beds' ? null : 'beds')}
          >
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-[#999999]">Available Beds</h3>
              <Bed className="h-5 w-5 text-[#007bff]" />
            </div>
            <div className="text-3xl font-bold text-[#333333] mb-1">
              {dashboardStats?.availableBeds?.toString() || '0'}
            </div>
            <p className="text-xs text-[#999999]">Updated just now</p>
            
            {/* Expanded details */}
            {expandedCard === 'beds' && dashboardStats?.details?.beds && (
              <div className="mt-4 pt-4 border-t">
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="text-center">
                    <p className="text-lg font-bold text-green-600">{dashboardStats.details.beds.available}</p>
                    <p className="text-[#666666]">Available</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-bold text-red-600">{dashboardStats.details.beds.occupied}</p>
                    <p className="text-[#666666]">Occupied</p>
                  </div>
                </div>
                <div className="mt-2 text-center">
                  <p className="text-xs text-[#666666]">
                    Occupancy: {dashboardStats.details.beds.total > 0 
                      ? Math.round((dashboardStats.details.beds.occupied / dashboardStats.details.beds.total) * 100) 
                      : 0}%
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Revenue Card */}
          <div 
            className={`bg-white rounded-lg p-6 shadow-sm cursor-pointer transition-all hover:shadow-md ${
              expandedCard === 'revenue' ? 'ring-2 ring-[#007bff]' : ''
            }`}
            onClick={(e) => {
              // Don't toggle if clicking on period cards
              if ((e.target as HTMLElement).closest('.period-card-button')) {
                return;
              }
              setExpandedCard(expandedCard === 'revenue' ? null : 'revenue');
            }}
          >
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-[#999999]">Revenue</h3>
              <IndianRupee className="h-5 w-5 text-[#007bff]" />
            </div>
            <div className="text-3xl font-bold text-[#333333] mb-1">
              {formatCurrency(dashboardStats?.monthlyRevenue || 0)}
            </div>
            <p className="text-xs text-[#999999]">
              {dateFilter.start && dateFilter.end 
                ? `For selected period` 
                : 'Updated just now'
              }
            </p>
            
            {/* Expanded details */}
            {expandedCard === 'revenue' && dashboardStats?.details?.revenue && (
              <div className="mt-4 pt-4 border-t">
                <p className="text-sm font-medium text-[#333333] mb-3">Revenue Breakdown</p>
                
                
                {/* Period Cards inside Revenue Card */}
                {!dashboardStats?.details?.revenue?.periodBreakdown && (
                  <div className="mb-4 p-4 bg-blue-50 rounded-lg">
                    <p className="text-sm text-blue-800">
                      💡 <strong>To see detailed period breakdown:</strong><br/>
                      1. Click "Date Filter" button above<br/>
                      2. Select a date range (e.g., today to today, or this week)<br/>
                      3. Click "Apply Filter"<br/>
                      4. Then click on this Revenue card again
                    </p>
                  </div>
                )}
                
                {dashboardStats?.details?.revenue?.periodBreakdown && (
                  <div className="mb-4">
                    <div className="grid grid-cols-3 gap-2 mb-3">
                      {/* Today Card */}
                      <div className="p-3 rounded-lg text-left bg-gray-50">
                        <p className="text-xs text-gray-600 mb-1">Today</p>
                        <p className="text-sm font-bold text-green-600">
                          {formatCurrency(dashboardStats.details.revenue.periodBreakdown.today?.revenue || 0)}
                        </p>
                        <p className="text-xs text-gray-500">
                          {dashboardStats.details.revenue.periodBreakdown.today?.count || 0} records
                        </p>
                      </div>
                      
                      {/* This Week Card */}
                      <div className="p-3 rounded-lg text-left bg-gray-50">
                        <p className="text-xs text-gray-600 mb-1">This Week</p>
                        <p className="text-sm font-bold text-green-600">
                          {formatCurrency(dashboardStats.details.revenue.periodBreakdown.thisWeek?.revenue || 0)}
                        </p>
                        <p className="text-xs text-gray-500">
                          {dashboardStats.details.revenue.periodBreakdown.thisWeek?.count || 0} records
                        </p>
                      </div>
                      
                      {/* This Month Card */}
                      <div className="p-3 rounded-lg text-left bg-gray-50">
                        <p className="text-xs text-gray-600 mb-1">This Month</p>
                        <p className="text-sm font-bold text-purple-600">
                          {formatCurrency(dashboardStats.details.revenue.periodBreakdown.thisMonth?.revenue || 0)}
                        </p>
                        <p className="text-xs text-gray-500">
                          {dashboardStats.details.revenue.periodBreakdown.thisMonth?.count || 0} records
                        </p>
                      </div>
                    </div>
                  </div>
                )}
                
                <div className="space-y-1 text-xs max-h-40 overflow-y-auto">
                  {Object.entries(dashboardStats.details.revenue.byType || {}).slice(0, 4).map(([type, amount]) => (
                    <div key={type} className="flex justify-between">
                      <span className="text-[#666666]">{type.replace(/_/g, ' ')}</span>
                      <span className="font-medium">{formatCurrency(amount as number)}</span>
                    </div>
                  ))}
                </div>
                {dashboardStats.details.revenue.topTransactions?.length > 0 && (
                  <div className="mt-2">
                    <p className="text-xs text-[#666666]">Recent: {dashboardStats.details.revenue.topTransactions.length} transactions</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Expenses Card */}
          <div 
            className={`bg-white rounded-lg p-6 shadow-sm cursor-pointer transition-all hover:shadow-md ${
              expandedCard === 'expenses' ? 'ring-2 ring-[#007bff]' : ''
            }`}
            onClick={() => setExpandedCard(expandedCard === 'expenses' ? null : 'expenses')}
          >
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-[#999999]">Expenses</h3>
              <TrendingDown className="h-5 w-5 text-[#007bff]" />
            </div>
            <div className="text-3xl font-bold text-[#333333] mb-1">
              {formatCurrency(dashboardStats?.todayExpenses || 0)}
            </div>
            <p className="text-xs text-[#999999]">
              {dateFilter.start && dateFilter.end 
                ? `For selected period` 
                : 'Updated just now'
              }
            </p>
            
            {/* Expanded details */}
            {expandedCard === 'expenses' && dashboardStats?.details?.expenses && (
              <div className="mt-4 pt-4 border-t">
                <p className="text-sm font-medium text-[#333333] mb-2">Expense Categories</p>
                <div className="space-y-1 text-xs max-h-40 overflow-y-auto">
                  {Object.entries(dashboardStats.details.expenses.byCategory || {}).slice(0, 4).map(([category, amount]) => (
                    <div key={category} className="flex justify-between">
                      <span className="text-[#666666]">{category.replace(/_/g, ' ')}</span>
                      <span className="font-medium">{formatCurrency(amount as number)}</span>
                    </div>
                  ))}
                </div>
                {dashboardStats.details.expenses.topExpenses?.length > 0 && (
                  <div className="mt-2">
                    <p className="text-xs text-[#666666]">Recent: {dashboardStats.details.expenses.topExpenses.length} expenses</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Detailed Breakdowns */}
        <div className="space-y-6 mb-6">
          {/* Revenue Details */}
          {expandedCard === 'revenue' && (
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-[#333333] mb-4">Revenue Breakdown</h3>
              {dashboardStats?.details?.revenue ? (
                <div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* By Transaction Type */}
                  <div>
                    <h4 className="text-sm font-medium text-[#999999] mb-3">By Transaction Type</h4>
                    <div className="space-y-2">
                      {Object.entries(dashboardStats.details.revenue.byType || {}).map(([type, amount]) => (
                        <div key={type} className="flex justify-between">
                          <span className="text-sm text-[#666666]">{type.replace(/_/g, ' ')}</span>
                          <span className="text-sm font-medium text-[#333333]">{formatCurrency(amount as number)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  {/* By Payment Mode */}
                  <div>
                    <h4 className="text-sm font-medium text-[#999999] mb-3">By Payment Mode</h4>
                    <div className="space-y-2">
                      {Object.entries(dashboardStats.details.revenue.byPaymentMode || {}).map(([mode, amount]) => (
                        <div key={mode} className="flex justify-between">
                          <span className="text-sm text-[#666666]">{mode}</span>
                          <span className="text-sm font-medium text-[#333333]">{formatCurrency(amount as number)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  {/* Top Transactions */}
                  <div>
                    <h4 className="text-sm font-medium text-[#999999] mb-3">Recent Transactions</h4>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {dashboardStats.details.revenue.topTransactions?.slice(0, 5).map((transaction: any, index: number) => (
                        <div key={index} className="text-xs border-b pb-2">
                          <div className="font-medium text-[#333333]">{transaction.patientName}</div>
                          <div className="text-[#666666]">{transaction.transaction_type} - {formatCurrency(transaction.amount)}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                </div>
              ) : (
                <div className="text-center py-8 text-[#666666]">
                  <p className="mb-2">📊 No detailed revenue data available</p>
                  <p className="text-sm">Apply a date filter to see detailed revenue breakdown with transaction types, payment modes, and recent transactions.</p>
                  <p className="text-xs mt-2 text-[#999999]">Current data shows: Monthly Revenue ₹{formatCurrency(dashboardStats?.monthlyRevenue || 0)}</p>
                </div>
              )}
            </div>
          )}

          {/* Patients Details */}
            {expandedCard === 'patients' && dashboardStats?.details?.patients && (
              <div className="bg-white rounded-lg p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-[#333333] mb-4">Patients Breakdown</h3>
                <div className="space-y-4">
                  <p className="text-sm text-[#666666]">
                    Total new patients in selected period: <span className="font-medium text-[#333333]">{dashboardStats.details.patients.total}</span>
                  </p>
                  <div>
                    <h4 className="text-sm font-medium text-[#999999] mb-3">Recent Patients</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {dashboardStats.details.patients.recentPatients?.slice(0, 8).map((patient: any, index: number) => (
                        <div key={index} className="border rounded-lg p-3">
                          <div className="font-medium text-[#333333]">
                            {patient.first_name} {patient.last_name}
                          </div>
                          <div className="text-sm text-[#666666]">
                            {patient.gender} • {patient.age} years
                          </div>
                          <div className="text-xs text-[#999999]">
                            {new Date(patient.created_at).toLocaleDateString()}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Appointments Details */}
            {expandedCard === 'appointments' && dashboardStats?.details?.appointments && (
              <div className="bg-white rounded-lg p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-[#333333] mb-4">Appointments Breakdown</h3>
                <div className="space-y-4">
                  <p className="text-sm text-[#666666]">
                    Total appointments in selected period: <span className="font-medium text-[#333333]">{dashboardStats.details.appointments.total}</span>
                  </p>
                  <div>
                    <h4 className="text-sm font-medium text-[#999999] mb-3">Recent Appointments</h4>
                    <div className="space-y-3">
                      {dashboardStats.details.appointments.recentAppointments?.slice(0, 5).map((appointment: any, index: number) => (
                        <div key={index} className="border rounded-lg p-3">
                          <div className="flex justify-between items-start">
                            <div>
                              <div className="font-medium text-[#333333]">
                                {appointment.patient?.first_name} {appointment.patient?.last_name}
                              </div>
                              <div className="text-sm text-[#666666]">
                                Dr. {appointment.doctor?.first_name} {appointment.doctor?.last_name}
                              </div>
                              <div className="text-xs text-[#999999]">
                                {appointment.appointment_type}
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-sm font-medium text-[#333333]">
                                {new Date(appointment.appointment_date).toLocaleDateString()}
                              </div>
                              <div className="text-xs text-[#666666]">
                                {appointment.appointment_time}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Expenses Details */}
            {expandedCard === 'expenses' && (
              <div className="bg-white rounded-lg p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-[#333333] mb-4">Expenses Breakdown</h3>
                {dashboardStats?.details?.expenses ? (
                  <div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* By Category */}
                  <div>
                    <h4 className="text-sm font-medium text-[#999999] mb-3">By Category</h4>
                    <div className="space-y-2">
                      {Object.entries(dashboardStats.details.expenses.byCategory || {}).map(([category, amount]) => (
                        <div key={category} className="flex justify-between">
                          <span className="text-sm text-[#666666]">{category.replace(/_/g, ' ')}</span>
                          <span className="text-sm font-medium text-[#333333]">{formatCurrency(amount as number)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  {/* Recent Expenses */}
                  <div>
                    <h4 className="text-sm font-medium text-[#999999] mb-3">Recent Expenses</h4>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {dashboardStats.details.expenses.topExpenses?.slice(0, 5).map((expense: any, index: number) => (
                        <div key={index} className="text-xs border-b pb-2">
                          <div className="font-medium text-[#333333]">{expense.description}</div>
                          <div className="text-[#666666]">{expense.expense_category} - {formatCurrency(expense.amount)}</div>
                          <div className="text-[#999999]">{new Date(expense.expense_date).toLocaleDateString()}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-[#666666]">
                    <p className="mb-2">💰 No detailed expense data available</p>
                    <p className="text-sm">Apply a date filter to see detailed expense breakdown by categories and recent expenses.</p>
                    <p className="text-xs mt-2 text-[#999999]">Current data shows: Today Expenses ₹{formatCurrency(dashboardStats?.todayExpenses || 0)}</p>
                  </div>
                )}
              </div>
            )}

            {/* Beds Details */}
            {expandedCard === 'beds' && dashboardStats?.details?.beds && (
              <div className="bg-white rounded-lg p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-[#333333] mb-4">Beds Status</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{dashboardStats.details.beds.available}</div>
                    <div className="text-sm text-[#666666]">Available</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-600">{dashboardStats.details.beds.occupied}</div>
                    <div className="text-sm text-[#666666]">Occupied</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-[#333333]">{dashboardStats.details.beds.total}</div>
                    <div className="text-sm text-[#666666]">Total Beds</div>
                  </div>
                </div>
                <div className="mt-4">
                  <h4 className="text-sm font-medium text-[#999999] mb-3">Bed Details</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {dashboardStats.details.beds.bedsList?.slice(0, 12).map((bed: any, index: number) => (
                      <div key={index} className={`border rounded-lg p-3 ${
                        bed.status === 'AVAILABLE' ? 'bg-green-50 border-green-200' : 
                        bed.status === 'OCCUPIED' ? 'bg-red-50 border-red-200' : 
                        'bg-gray-50 border-gray-200'
                      }`}>
                        <div className="font-medium text-[#333333]">Bed {bed.bed_number}</div>
                        <div className="text-sm text-[#666666]">{bed.room_type}</div>
                        <div className={`text-xs font-medium ${
                          bed.status === 'AVAILABLE' ? 'text-green-600' : 
                          bed.status === 'OCCUPIED' ? 'text-red-600' : 
                          'text-gray-600'
                        }`}>
                          {bed.status}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

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
            
              <button 
                onClick={() => {
                  // Create test appointments
                  const today = new Date();
                  const tomorrow = new Date(today);
                  tomorrow.setDate(tomorrow.getDate() + 1);
                  
                  const testAppointments = [
                    {
                      id: 'test-' + Date.now(),
                      patient_id: 'patient-1',
                      patient_name: 'John Doe',
                      doctor_name: 'Dr. Smith',
                      department: 'Cardiology',
                      appointment_date: today.toISOString().split('T')[0],
                      appointment_time: '10:00',
                      appointment_type: 'consultation',
                      status: 'scheduled',
                      estimated_duration: 30,
                      estimated_cost: 500,
                      notes: 'Regular checkup',
                      created_at: new Date().toISOString()
                    },
                    {
                      id: 'test-' + (Date.now() + 1),
                      patient_id: 'patient-2',
                      patient_name: 'Jane Smith',
                      doctor_name: 'Dr. Johnson',
                      department: 'Orthopedics',
                      appointment_date: tomorrow.toISOString().split('T')[0],
                      appointment_time: '14:30',
                      appointment_type: 'follow-up',
                      status: 'confirmed',
                      estimated_duration: 45,
                      estimated_cost: 350,
                      notes: 'Post-surgery follow-up',
                      created_at: new Date().toISOString()
                    }
                  ];
                  
                  localStorage.setItem('hospital_appointments', JSON.stringify(testAppointments));
                  window.location.reload();
                }}
                className="mt-2 px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                Create Test Appointments & Reload
              </button>
            </div>
            
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {appointmentsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#007bff]"></div>
                </div>
              ) : (
                (() => {
                  const upcomingAppointments = getUpcomingAppointments();
                  
                  console.log('=== APPOINTMENTS DISPLAY DEBUG ===');
                  console.log('Upcoming appointments count:', upcomingAppointments.length);
                  console.log('Upcoming appointments:', upcomingAppointments);
                  
                  if (upcomingAppointments.length === 0) {
                    return (
                      <div className="text-center py-8 text-[#999999]">
                        <Calendar className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p>No appointments for this date range.</p>
                        <p className="text-xs mt-2">Check console for debug info</p>
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
import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { supabase } from '../config/supabaseNew';
import type { DashboardStats, PatientAdmissionWithRelations, TransactionWithRelations } from '../config/supabaseNew';
import useReceiptPrinting from '../hooks/useReceiptPrinting';
import { Input } from './ui/Input';

interface Props {
  onNavigate?: (tab: string) => void;
}

const EnhancedDashboard: React.FC<Props> = ({ onNavigate }) => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentAdmissions, setRecentAdmissions] = useState<PatientAdmissionWithRelations[]>([]);
  const [recentTransactions, setRecentTransactions] = useState<TransactionWithRelations[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [dateRange, setDateRange] = useState<'today' | 'week' | 'month' | 'custom'>('today');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const { printDailySummary } = useReceiptPrinting();

  useEffect(() => {
    loadDashboardData();
    
    // Set up real-time refresh every 30 seconds
    const interval = setInterval(loadDashboardData, 30000);
    return () => clearInterval(interval);
  }, [selectedDate, dateRange, startDate, endDate]);

  useEffect(() => {
    // Update date range when dateRange changes
    const today = new Date();
    switch (dateRange) {
      case 'today':
        setSelectedDate(today.toISOString().split('T')[0]);
        setStartDate(today.toISOString().split('T')[0]);
        setEndDate(today.toISOString().split('T')[0]);
        break;
      case 'week':
        const weekStart = new Date(today);
        weekStart.setDate(today.getDate() - today.getDay());
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);
        setStartDate(weekStart.toISOString().split('T')[0]);
        setEndDate(weekEnd.toISOString().split('T')[0]);
        break;
      case 'month':
        const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
        const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);
        setStartDate(monthStart.toISOString().split('T')[0]);
        setEndDate(monthEnd.toISOString().split('T')[0]);
        break;
    }
  }, [dateRange]);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadStats(),
        loadRecentAdmissions(),
        loadRecentTransactions()
      ]);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const { data, error } = await supabase.rpc('get_dashboard_stats');
      if (error) throw error;
      setStats(data);
    } catch (error: any) {
      console.error('Error loading stats:', error);
      // Fallback: calculate manually if function doesn't exist
      await loadStatsManually();
    }
  };

  const loadStatsManually = async () => {
    try {
      // Use consistent YYYY-MM-DD format like patient entry forms
      const currentStartDate = dateRange === 'custom' ? startDate : (dateRange === 'today' ? selectedDate : startDate);
      const currentEndDate = dateRange === 'custom' ? endDate : (dateRange === 'today' ? selectedDate : endDate);
      
      console.log('📅 Dashboard date filter:', {
        dateRange,
        selectedDate,
        startDate,
        endDate,
        currentStartDate,
        currentEndDate,
        format: 'YYYY-MM-DD (ISO standard like patient entry)'
      });
      
      // Get basic counts filtered by date range
      const [patientsRes, revenueRes, allTransactionsRes, expensesRes, appointmentsRes] = await Promise.all([
        supabase.from('patients').select('id', { count: 'exact' }).eq('is_active', true).gte('created_at', `${currentStartDate}T00:00:00`).lte('created_at', `${currentEndDate}T23:59:59`),
        supabase.from('patient_transactions').select('amount, created_at, status').gte('created_at', `${currentStartDate}T00:00:00`).lte('created_at', `${currentEndDate}T23:59:59`).neq('status', 'CANCELLED'),
        supabase.from('patient_transactions').select('amount, created_at, status').gte('created_at', `${currentStartDate}T00:00:00`).lte('created_at', `${currentEndDate}T23:59:59`),
        supabase.from('daily_expenses').select('amount').gte('expense_date', currentStartDate).lte('expense_date', currentEndDate),
        supabase.from('future_appointments').select('id', { count: 'exact' }).gte('appointment_date', currentStartDate).lte('appointment_date', currentEndDate)
      ]);

      // Calculate bed statistics from localStorage (beds are managed locally)
      const totalBeds = 50; // Fixed total beds (as per your IPD bed management)
      let occupiedBeds = 0;
      
      try {
        const savedBeds = localStorage.getItem('hospital-ipd-beds');
        if (savedBeds) {
          const beds = JSON.parse(savedBeds);
          occupiedBeds = beds.filter((bed: any) => bed.status === 'occupied').length;
        }
      } catch (error) {
        console.error('Error reading bed data from localStorage:', error);
        occupiedBeds = 0;
      }
      
      const availableBeds = totalBeds - occupiedBeds;

      const periodPatients = patientsRes.count || 0; // Patients registered in selected period
      const activeAdmissions = occupiedBeds; // Active admissions = occupied beds
      
      // Debug revenue calculation
      console.log('💰 Revenue Debug:', {
        dateRange: `${currentStartDate} to ${currentEndDate}`,
        filteredTransactionCount: revenueRes.data?.length || 0,
        allTransactionCount: allTransactionsRes.data?.length || 0,
        expenseCount: expensesRes.data?.length || 0,
        filteredTransactions: revenueRes.data?.slice(0, 3).map(t => ({ amount: t.amount, status: t.status, created_at: t.created_at })) || [],
        allTransactions: allTransactionsRes.data?.slice(0, 3).map(t => ({ amount: t.amount, status: t.status, created_at: t.created_at })) || [],
        expenses: expensesRes.data?.slice(0, 3).map(e => ({ amount: e.amount })) || [],
        filteredRevenue: revenueRes.data?.reduce((sum, t) => sum + (t.amount || 0), 0) || 0,
        allRevenue: allTransactionsRes.data?.reduce((sum, t) => sum + (t.amount || 0), 0) || 0,
        rawExpenses: expensesRes.data?.reduce((sum, e) => sum + (e.amount || 0), 0) || 0
      });
      
      const periodRevenue = revenueRes.data?.reduce((sum, t) => sum + (t.amount || 0), 0) || 0;
      const periodExpenses = expensesRes.data?.reduce((sum, e) => sum + (e.amount || 0), 0) || 0;
      const periodAppointments = appointmentsRes.count || 0;

      const occupancyRate = totalBeds > 0 ? (occupiedBeds / totalBeds) * 100 : 0;

      console.log('📊 Setting stats:', {
        periodRevenue,
        periodExpenses,
        netRevenue: periodRevenue - periodExpenses
      });

      setStats({
        total_patients: periodPatients,
        active_admissions: activeAdmissions,
        available_beds: availableBeds,
        total_beds: totalBeds,
        today_revenue: periodRevenue,
        today_expenses: periodExpenses,
        net_revenue: periodRevenue - periodExpenses,
        pending_appointments: 0, // Would need additional query
        todays_appointments: periodAppointments,
        occupancy_rate: occupancyRate
      });
    } catch (error: any) {
      console.error('Error calculating stats manually:', error);
    }
  };

  const loadRecentAdmissions = async () => {
    try {
      const currentStartDate = dateRange === 'custom' ? startDate : (dateRange === 'today' ? selectedDate : startDate);
      const currentEndDate = dateRange === 'custom' ? endDate : (dateRange === 'today' ? selectedDate : endDate);
      
      const { data, error } = await supabase
        .from('patient_admissions')
        .select(`
          *,
          patient:patients(patient_id, first_name, last_name, age, blood_group),
          bed:beds(bed_number, room_type, daily_rate),
          admitted_by_user:users!patient_admissions_admitted_by_fkey(first_name, last_name)
        `)
        .eq('status', 'ACTIVE')
        .gte('admission_date', currentStartDate)
        .lte('admission_date', currentEndDate)
        .order('admission_date', { ascending: false })
        .limit(5);

      if (error) throw error;
      setRecentAdmissions(data || []);
    } catch (error: any) {
      console.error('Error loading recent admissions:', error);
    }
  };

  const loadRecentTransactions = async () => {
    try {
      const currentStartDate = dateRange === 'custom' ? startDate : (dateRange === 'today' ? selectedDate : startDate);
      const currentEndDate = dateRange === 'custom' ? endDate : (dateRange === 'today' ? selectedDate : endDate);
      
      const { data, error } = await supabase
        .from('patient_transactions')
        .select(`
          *,
          patient:patients(patient_id, first_name, last_name),
          doctor:users!patient_transactions_doctor_id_fkey(first_name, last_name)
        `)
        .gte('created_at', `${currentStartDate}T00:00:00`)
        .lte('created_at', `${currentEndDate}T23:59:59`)
        .neq('status', 'CANCELLED')
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      setRecentTransactions(data || []);
    } catch (error: any) {
      console.error('Error loading recent transactions:', error);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', { 
      style: 'currency', 
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED': return 'text-green-600 bg-green-100';
      case 'PENDING': return 'text-yellow-600 bg-yellow-100';
      case 'CANCELLED': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  if (loading && !stats) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">🏥 Hospital Dashboard</h1>
            <p className="text-gray-600">Real-time overview of hospital operations</p>
            <div className="text-xs text-gray-500 mt-1">
              Last updated: {new Date().toLocaleTimeString()} • Auto-refresh: 30s
            </div>
          </div>

          {/* Date Filter Controls */}
          <div className="mt-4 lg:mt-0">
            <div className="bg-white p-4 rounded-lg shadow-sm border">
              <div className="flex flex-col sm:flex-row gap-4 items-center">
                <div className="flex items-center gap-2">
                  <label className="text-sm font-medium text-gray-700">View:</label>
                  <select
                    value={dateRange}
                    onChange={(e) => setDateRange(e.target.value as any)}
                    className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="today">Today</option>
                    <option value="week">This Week</option>
                    <option value="month">This Month</option>
                    <option value="custom">Custom Date</option>
                  </select>
                </div>

                {dateRange === 'custom' && (
                  <div className="min-w-[200px]">
                    <Input
                      type="date"
                      label="Select Date"
                      value={startDate}
                      onChange={(e) => {
                        setStartDate(e.target.value);
                        setEndDate(e.target.value); // Always keep start and end date the same
                      }}
                    />
                  </div>
                )}

                {dateRange === 'today' && (
                  <div className="min-w-[200px]">
                    <Input
                      type="date"
                      label="Select Date"
                      value={selectedDate}
                      onChange={(e) => setSelectedDate(e.target.value)}
                    />
                  </div>
                )}

                <div className="text-sm text-gray-600">
                  {dateRange === 'today' ? `Data for ${new Date(selectedDate).toLocaleDateString()}` :
                   dateRange === 'custom' ? `Data for ${new Date(startDate).toLocaleDateString()}` :
                   dateRange === 'week' ? `This week (${new Date(startDate).toLocaleDateString()} - ${new Date(endDate).toLocaleDateString()})` :
                   `This month (${new Date(startDate).toLocaleDateString()} - ${new Date(endDate).toLocaleDateString()})`}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Statistics Grid */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-6 rounded-xl text-white shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100">
                  {dateRange === 'today' ? "Today's Patients" : 
                   dateRange === 'week' ? "Week's Patients" : 
                   dateRange === 'month' ? "Month's Patients" : 
                   "Period Patients"}
                </p>
                <p className="text-3xl font-bold">{stats.total_patients}</p>
              </div>
              <div className="text-4xl opacity-80">👥</div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-green-500 to-green-600 p-6 rounded-xl text-white shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100">Active Admissions</p>
                <p className="text-3xl font-bold">{stats.active_admissions}</p>
              </div>
              <div className="text-4xl opacity-80">🛏️</div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-purple-500 to-purple-600 p-6 rounded-xl text-white shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100">Available Beds</p>
                <p className="text-3xl font-bold">{stats.available_beds}</p>
                <p className="text-xs text-purple-200">of {stats.total_beds} total</p>
              </div>
              <div className="text-4xl opacity-80">🏨</div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-orange-500 to-orange-600 p-6 rounded-xl text-white shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-100">
                  {dateRange === 'today' ? "Today's Revenue" : 
                   dateRange === 'week' ? "Week's Revenue" : 
                   dateRange === 'month' ? "Month's Revenue" : 
                   "Period Revenue"}
                </p>
                <p className="text-3xl font-bold">{formatCurrency(stats.today_revenue)}</p>
              </div>
              <div className="text-4xl opacity-80">💰</div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-red-500 to-red-600 p-6 rounded-xl text-white shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-red-100">Net Revenue</p>
                <p className="text-3xl font-bold">{formatCurrency(stats.net_revenue)}</p>
                <p className="text-xs text-red-200">Revenue - Expenses</p>
              </div>
              <div className="text-4xl opacity-80">📊</div>
            </div>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-6 gap-4 mb-8">
        <button
          onClick={() => onNavigate?.('patient-entry')}
          className="bg-white p-6 rounded-lg shadow-sm border hover:shadow-md transition-shadow"
        >
          <div className="text-2xl mb-2">👤</div>
          <div className="font-medium">Register Patient</div>
          <div className="text-sm text-gray-600">Add new patient</div>
        </button>

        <button
          onClick={() => onNavigate?.('ipd')}
          className="bg-white p-6 rounded-lg shadow-sm border hover:shadow-md transition-shadow"
        >
          <div className="text-2xl mb-2">🛏️</div>
          <div className="font-medium">IPD Management</div>
          <div className="text-sm text-gray-600">Manage admissions</div>
        </button>

        <button
          onClick={() => onNavigate?.('appointments')}
          className="bg-white p-6 rounded-lg shadow-sm border hover:shadow-md transition-shadow"
        >
          <div className="text-2xl mb-2">📅</div>
          <div className="font-medium">Appointments</div>
          <div className="text-sm text-gray-600">Schedule & manage</div>
        </button>

        <button
          onClick={() => onNavigate?.('expenses')}
          className="bg-white p-6 rounded-lg shadow-sm border hover:shadow-md transition-shadow"
        >
          <div className="text-2xl mb-2">💸</div>
          <div className="font-medium">Expenses</div>
          <div className="text-sm text-gray-600">Track daily expenses</div>
        </button>

        <button
          onClick={() => {
            if (stats) {
              printDailySummary({
                date: dateRange === 'today' ? selectedDate : `${startDate} to ${endDate}`,
                stats: {
                  totalPatients: stats.total_patients,
                  totalRevenue: stats.today_revenue,
                  totalExpenses: stats.today_expenses || 0,
                  netRevenue: stats.net_revenue,
                  activeAdmissions: stats.active_admissions,
                  availableBeds: stats.available_beds
                }
              });
            }
          }}
          className="bg-white p-6 rounded-lg shadow-sm border hover:shadow-md transition-shadow"
        >
          <div className="text-2xl mb-2">🖨️</div>
          <div className="font-medium">Print Report</div>
          <div className="text-sm text-gray-600">Daily summary</div>
        </button>

      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Admissions */}
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="p-6 border-b">
            <h2 className="text-lg font-semibold">
              {dateRange === 'today' ? "Today's Admissions" : 
               dateRange === 'week' ? "This Week's Admissions" : 
               dateRange === 'month' ? "This Month's Admissions" : 
               "Period Admissions"}
            </h2>
          </div>
          <div className="p-6">
            {recentAdmissions.length > 0 ? (
              <div className="space-y-4">
                {recentAdmissions.map((admission) => (
                  <div key={admission.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <div className="font-medium">
                        {admission.patient?.first_name} {admission.patient?.last_name}
                      </div>
                      <div className="text-sm text-gray-600">
                        Bed {admission.bed?.bed_number} • {admission.bed?.room_type}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium">
                        {formatCurrency(admission.bed?.daily_rate || 0)}/day
                      </div>
                      <div className="text-xs text-gray-500">
                        {new Date(admission.admission_date).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">No recent admissions</p>
            )}
          </div>
        </div>

        {/* Recent Transactions */}
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="p-6 border-b">
            <h2 className="text-lg font-semibold">
              {dateRange === 'today' ? "Today's Transactions" : 
               dateRange === 'week' ? "This Week's Transactions" : 
               dateRange === 'month' ? "This Month's Transactions" : 
               "Period Transactions"}
            </h2>
          </div>
          <div className="p-6">
            {recentTransactions.length > 0 ? (
              <div className="space-y-4">
                {recentTransactions.slice(0, 5).map((transaction) => (
                  <div key={transaction.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <div className="font-medium">{transaction.description}</div>
                      <div className="text-sm text-gray-600">
                        {transaction.patient?.first_name} {transaction.patient?.last_name}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">
                        {formatCurrency(transaction.amount)}
                      </div>
                      <div className={`text-xs px-2 py-1 rounded ${getStatusColor(transaction.status)}`}>
                        {transaction.status}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">No recent transactions</p>
            )}
          </div>
        </div>
      </div>

      {/* Refresh Button */}
      <div className="mt-8 text-center">
        <button
          onClick={loadDashboardData}
          disabled={loading}
          className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? '⟳ Refreshing...' : '🔄 Refresh Data'}
        </button>
      </div>
    </div>
  );
};

export default EnhancedDashboard;
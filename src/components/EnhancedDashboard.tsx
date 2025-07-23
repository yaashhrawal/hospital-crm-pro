import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { supabase } from '../config/supabaseNew';
import type { DashboardStats, PatientAdmissionWithRelations, TransactionWithRelations } from '../config/supabaseNew';
import useReceiptPrinting from '../hooks/useReceiptPrinting';

interface Props {
  onNavigate?: (tab: string) => void;
}

const EnhancedDashboard: React.FC<Props> = ({ onNavigate }) => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentAdmissions, setRecentAdmissions] = useState<PatientAdmissionWithRelations[]>([]);
  const [recentTransactions, setRecentTransactions] = useState<TransactionWithRelations[]>([]);
  const [loading, setLoading] = useState(false);
  const { printDailySummary } = useReceiptPrinting();

  useEffect(() => {
    loadDashboardData();
    
    // Set up real-time refresh every 30 seconds
    const interval = setInterval(loadDashboardData, 30000);
    return () => clearInterval(interval);
  }, []);

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
      const today = new Date().toISOString().split('T')[0];
      
      // Get basic counts
      const [patientsRes, admissionsRes, bedsRes, revenueRes, expensesRes, appointmentsRes] = await Promise.all([
        supabase.from('patients').select('id', { count: 'exact' }).eq('is_active', true),
        supabase.from('patient_admissions').select('id', { count: 'exact' }).eq('status', 'ACTIVE'),
        supabase.from('beds').select('id, status', { count: 'exact' }),
        supabase.from('patient_transactions').select('amount').gte('created_at', `${today}T00:00:00`).lt('created_at', `${today}T23:59:59`).eq('status', 'COMPLETED'),
        supabase.from('daily_expenses').select('amount').eq('expense_date', today).eq('approval_status', 'APPROVED'),
        supabase.from('future_appointments').select('id', { count: 'exact' }).eq('appointment_date', today)
      ]);

      const totalPatients = patientsRes.count || 0;
      const activeAdmissions = admissionsRes.count || 0;
      const totalBeds = bedsRes.count || 0;
      const availableBeds = bedsRes.data?.filter(bed => bed.status === 'AVAILABLE').length || 0;
      const todayRevenue = revenueRes.data?.reduce((sum, t) => sum + t.amount, 0) || 0;
      const todayExpenses = expensesRes.data?.reduce((sum, e) => sum + e.amount, 0) || 0;
      const todaysAppointments = appointmentsRes.count || 0;

      const occupancyRate = totalBeds > 0 ? ((totalBeds - availableBeds) / totalBeds) * 100 : 0;

      setStats({
        total_patients: totalPatients,
        active_admissions: activeAdmissions,
        available_beds: availableBeds,
        total_beds: totalBeds,
        today_revenue: todayRevenue,
        today_expenses: todayExpenses,
        net_revenue: todayRevenue - todayExpenses,
        pending_appointments: 0, // Would need additional query
        todays_appointments: todaysAppointments,
        occupancy_rate: occupancyRate
      });
    } catch (error: any) {
      console.error('Error calculating stats manually:', error);
    }
  };

  const loadRecentAdmissions = async () => {
    try {
      const { data, error } = await supabase
        .from('patient_admissions')
        .select(`
          *,
          patient:patients(patient_id, first_name, last_name, age, blood_group),
          bed:beds(bed_number, room_type, daily_rate),
          admitted_by_user:users!patient_admissions_admitted_by_fkey(first_name, last_name)
        `)
        .eq('status', 'ACTIVE')
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
      const { data, error } = await supabase
        .from('patient_transactions')
        .select(`
          *,
          patient:patients(patient_id, first_name, last_name),
          doctor:users!patient_transactions_doctor_id_fkey(first_name, last_name)
        `)
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
        <h1 className="text-3xl font-bold text-gray-900">🏥 Hospital Dashboard</h1>
        <p className="text-gray-600">Real-time overview of hospital operations</p>
        <div className="text-xs text-gray-500 mt-1">
          Last updated: {new Date().toLocaleTimeString()} • Auto-refresh: 30s
        </div>
      </div>

      {/* Statistics Grid */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-6 rounded-xl text-white shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100">Total Patients</p>
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
                <p className="text-orange-100">Today's Revenue</p>
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
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
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

      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Admissions */}
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="p-6 border-b">
            <h2 className="text-lg font-semibold">Recent Admissions</h2>
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
            <h2 className="text-lg font-semibold">Recent Transactions</h2>
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
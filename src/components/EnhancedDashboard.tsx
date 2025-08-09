import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { supabase } from '../config/supabaseNew';
import type { DashboardStats, PatientAdmissionWithRelations, TransactionWithRelations } from '../config/supabaseNew';
import useReceiptPrinting from '../hooks/useReceiptPrinting';
import MonthCalendar from './calendar/MonthCalendar';

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
        supabase.from('patients').select('id', { count: 'exact' }).eq('is_active', true), // DISABLED: patient_admissions table removed
        supabase.from('beds').select('id, status', { count: 'exact' }),
        supabase.from('patient_transactions').select('amount').gte('created_at', `${today}T00:00:00`).lt('created_at', `${today}T23:59:59`).eq('status', 'COMPLETED'),
        supabase.from('daily_expenses').select('amount').eq('expense_date', today).eq('approval_status', 'APPROVED'),
        supabase.from('future_appointments').select('id', { count: 'exact' }).eq('appointment_date', today)
      ]);

      const totalPatients = patientsRes.count || 0;
      const activeAdmissions = 0; // DISABLED: patient_admissions table removed
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
      console.log('📡 Loading recent admissions - DISABLED (patient_admissions table removed)');
      // DISABLED: patient_admissions table was removed during emergency rollback
      setRecentAdmissions([]);
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
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
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
          onClick={() => onNavigate?.('expenses')}
          className="bg-white p-6 rounded-lg shadow-sm border hover:shadow-md transition-shadow"
        >
          <div className="text-2xl mb-2">💸</div>
          <div className="font-medium">Expenses</div>
          <div className="text-sm text-gray-600">Track daily expenses</div>
        </button>

      </div>

      {/* Full Month Calendar */}
      <MonthCalendar />

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
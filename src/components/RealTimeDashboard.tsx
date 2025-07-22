import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import HospitalService from '../services/hospitalService';
import QuickReportsModal from './QuickReportsModal';
import { supabase } from '../config/supabaseNew';
import type { DashboardStats, PatientWithRelations, FutureAppointment } from '../config/supabaseNew';

interface StatCardProps {
  title: string;
  value: string | number;
  change?: number;
  icon: string;
  color: string;
  bgColor: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, change, icon, color, bgColor }) => (
  <div className={`${bgColor} p-6 rounded-lg border-2 ${color.replace('text-', 'border-')}`}>
    <div className="flex items-center justify-between">
      <div>
        <p className={`text-sm ${color} font-medium`}>{title}</p>
        <p className={`text-3xl font-bold ${color} mt-1`}>
          {typeof value === 'number' ? value.toLocaleString() : value}
        </p>
        {change !== undefined && (
          <div className="flex items-center mt-2">
            <span className={`text-xs ${change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {change >= 0 ? '↗' : '↘'} {Math.abs(change)}%
            </span>
            <span className="text-xs text-gray-500 ml-1">vs last month</span>
          </div>
        )}
      </div>
      <div className="text-4xl">{icon}</div>
    </div>
  </div>
);

interface QuickActionProps {
  title: string;
  description: string;
  icon: string;
  color: string;
  onClick: () => void;
}

const QuickAction: React.FC<QuickActionProps> = ({ title, description, icon, color, onClick }) => (
  <button
    onClick={onClick}
    className={`${color} text-white p-4 rounded-lg hover:opacity-90 transition-opacity text-left w-full hover:shadow-lg transform hover:scale-105`}
  >
    <div className="flex items-center">
      <div className="text-2xl mr-3">{icon}</div>
      <div>
        <div className="font-semibold">{title}</div>
        <div className="text-sm opacity-90">{description}</div>
      </div>
    </div>
  </button>
);

interface RecentActivityProps {
  patients: PatientWithRelations[];
  appointments: FutureAppointment[];
}

const RecentActivity: React.FC<RecentActivityProps> = ({ patients, appointments }) => {
  const recentPatients = patients.slice(0, 5);
  const todayAppointments = appointments
    .filter(a => a.appointment_date === new Date().toISOString().split('T')[0])
    .slice(0, 3);

  return (
    <div className="bg-white rounded-lg shadow-sm border p-6">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">🕒 Recent Activity</h3>
      
      <div className="space-y-4">
        {/* Recent Patients */}
        <div>
          <h4 className="text-sm font-medium text-gray-600 mb-2">Latest Patients</h4>
          {recentPatients.length > 0 ? (
            <div className="space-y-2">
              {recentPatients.map(patient => (
                <div key={patient.id} className="flex items-center p-2 bg-gray-50 rounded">
                  <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-medium mr-3">
                    {patient.first_name[0]}
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-medium">{patient.first_name} {patient.last_name}</div>
                    <div className="text-xs text-gray-500">
                      Registered {new Date(patient.created_at).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium text-green-600">
                      ₹{(patient.totalSpent || 0).toLocaleString()}
                    </div>
                    <div className="text-xs text-gray-500">{patient.visitCount || 0} visits</div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500">No recent patients</p>
          )}
        </div>

        {/* Today's Appointments */}
        <div>
          <h4 className="text-sm font-medium text-gray-600 mb-2">Today's Appointments</h4>
          {todayAppointments.length > 0 ? (
            <div className="space-y-2">
              {todayAppointments.map(appointment => (
                <div key={appointment.id} className="flex items-center p-2 bg-gray-50 rounded">
                  <div className="text-2xl mr-3">📅</div>
                  <div className="flex-1">
                    <div className="text-sm font-medium">
                      {(appointment as any).patient?.first_name} {(appointment as any).patient?.last_name}
                    </div>
                    <div className="text-xs text-gray-500">{appointment.reason}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium">{appointment.appointment_time}</div>
                    <div className={`text-xs px-2 py-1 rounded ${
                      appointment.status === 'CONFIRMED' ? 'bg-green-100 text-green-700' :
                      appointment.status === 'SCHEDULED' ? 'bg-blue-100 text-blue-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {appointment.status}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500">No appointments today</p>
          )}
        </div>
      </div>
    </div>
  );
};

interface RevenueChartProps {
  dailyRevenue: number;
  weeklyRevenue: number;
  monthlyRevenue: number;
}

const RevenueChart: React.FC<RevenueChartProps> = ({ dailyRevenue, weeklyRevenue, monthlyRevenue }) => {
  const maxRevenue = Math.max(dailyRevenue, weeklyRevenue, monthlyRevenue);
  
  return (
    <div className="bg-white rounded-lg shadow-sm border p-6">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">💰 Revenue Overview</h3>
      
      <div className="space-y-4">
        <div>
          <div className="flex justify-between items-center mb-1">
            <span className="text-sm text-gray-600">Today</span>
            <span className="text-sm font-medium">₹{dailyRevenue.toLocaleString()}</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-500"
              style={{ width: `${maxRevenue > 0 ? (dailyRevenue / maxRevenue) * 100 : 0}%` }}
            />
          </div>
        </div>
        
        <div>
          <div className="flex justify-between items-center mb-1">
            <span className="text-sm text-gray-600">This Week</span>
            <span className="text-sm font-medium">₹{weeklyRevenue.toLocaleString()}</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-green-600 h-2 rounded-full transition-all duration-500"
              style={{ width: `${maxRevenue > 0 ? (weeklyRevenue / maxRevenue) * 100 : 0}%` }}
            />
          </div>
        </div>
        
        <div>
          <div className="flex justify-between items-center mb-1">
            <span className="text-sm text-gray-600">This Month</span>
            <span className="text-sm font-medium">₹{monthlyRevenue.toLocaleString()}</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-purple-600 h-2 rounded-full transition-all duration-500"
              style={{ width: `100%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

interface RealTimeDashboardProps {
  onNavigate?: (tab: string) => void;
}

const RealTimeDashboard: React.FC<RealTimeDashboardProps> = ({ onNavigate }) => {
  const [stats, setStats] = useState<DashboardStats>({
    totalPatients: 0,
    totalDoctors: 0,
    totalBeds: 0,
    occupiedBeds: 0,
    todayRevenue: 0,
    monthlyRevenue: 0,
    todayAppointments: 0,
    pendingAdmissions: 0,
    patientGrowthRate: 0,
    revenueGrowthRate: 0
  });
  
  const [patients, setPatients] = useState<PatientWithRelations[]>([]);
  const [appointments, setAppointments] = useState<FutureAppointment[]>([]);
  const [dailyExpenses, setDailyExpenses] = useState<any[]>([]);
  const [dailyRefunds, setDailyRefunds] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [showReportsModal, setShowReportsModal] = useState(false);

  useEffect(() => {
    loadDashboardData();
    
    // Set up auto-refresh every 30 seconds
    const interval = setInterval(() => {
      refreshData();
    }, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const today = new Date().toISOString().split('T')[0];
      
      const [
        statsData, 
        patientsData, 
        appointmentsData,
        expensesData,
        refundsData
      ] = await Promise.all([
        HospitalService.getDashboardStats(),
        HospitalService.getPatients(50),
        HospitalService.getAppointments(100),
        // Load today's expenses
        supabase
          .from('daily_expenses')
          .select('*')
          .eq('expense_date', today),
        // Load today's refunds (negative PROCEDURE amounts)
        supabase
          .from('patient_transactions')
          .select('*')
          .eq('transaction_type', 'PROCEDURE')
          .lt('amount', 0) // Only negative amounts (refunds)
          .gte('created_at', `${today}T00:00:00.000Z`)
          .lt('created_at', `${today}T23:59:59.999Z`)
      ]);
      
      setStats(statsData);
      setPatients(patientsData);
      setAppointments(appointmentsData);
      setDailyExpenses(expensesData.data || []);
      setDailyRefunds(refundsData.data || []);
      setLastUpdate(new Date());
      
    } catch (error: any) {
      console.error('Dashboard load error:', error);
      toast.error(`Failed to load dashboard: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const refreshData = async () => {
    try {
      setRefreshing(true);
      await loadDashboardData();
      toast.success('Dashboard updated', { duration: 2000 });
    } catch (error) {
      // Silently fail for auto-refresh
      console.warn('Auto-refresh failed:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const calculateWeeklyRevenue = () => {
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    
    return patients.reduce((sum, patient) => {
      const patientWeeklyRevenue = (patient.transactions || [])
        .filter(t => new Date(t.created_at) >= weekAgo)
        .reduce((tSum, t) => tSum + (t.amount || 0), 0);
      return sum + patientWeeklyRevenue;
    }, 0);
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  const weeklyRevenue = calculateWeeklyRevenue();

  // Calculate financial metrics
  const todayExpenses = dailyExpenses.reduce((sum, expense) => sum + expense.amount, 0);
  const todayRefunds = Math.abs(dailyRefunds.reduce((sum, refund) => sum + refund.amount, 0));
  const netDailyValue = stats.todayRevenue - todayExpenses - todayRefunds;

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">📊 Real-Time Dashboard</h1>
          <p className="text-gray-600">
            Hospital overview and key metrics • Last updated: {lastUpdate.toLocaleTimeString()}
          </p>
        </div>
        <button
          onClick={refreshData}
          disabled={refreshing}
          className={`px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 ${
            refreshing ? 'animate-pulse' : ''
          }`}
        >
          {refreshing ? '⟳ Updating...' : '🔄 Refresh'}
        </button>
      </div>

      {/* Finance Summary */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">💰 Daily Finance Summary</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-green-50 p-4 rounded-lg border-2 border-green-200">
            <div className="text-2xl font-bold text-green-700">₹{stats.todayRevenue.toLocaleString()}</div>
            <div className="text-green-600 text-sm">Revenue (+)</div>
          </div>
          <div className="bg-red-50 p-4 rounded-lg border-2 border-red-200">
            <div className="text-2xl font-bold text-red-700">₹{todayExpenses.toLocaleString()}</div>
            <div className="text-red-600 text-sm">Expenses (-)</div>
          </div>
          <div className="bg-orange-50 p-4 rounded-lg border-2 border-orange-200">
            <div className="text-2xl font-bold text-orange-700">₹{todayRefunds.toLocaleString()}</div>
            <div className="text-orange-600 text-sm">Refunds (-)</div>
          </div>
          <div className={`p-4 rounded-lg border-2 ${
            netDailyValue >= 0 
              ? 'bg-blue-50 border-blue-200' 
              : 'bg-red-50 border-red-200'
          }`}>
            <div className={`text-2xl font-bold ${
              netDailyValue >= 0 ? 'text-blue-700' : 'text-red-700'
            }`}>
              ₹{netDailyValue.toLocaleString()}
            </div>
            <div className={`text-sm ${
              netDailyValue >= 0 ? 'text-blue-600' : 'text-red-600'
            }`}>
              Net Daily Value {netDailyValue >= 0 ? '(+)' : '(-)'}
            </div>
          </div>
        </div>
      </div>

      {/* Key Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Total Patients"
          value={stats.totalPatients}
          change={stats.patientGrowthRate}
          icon="👥"
          color="text-blue-700"
          bgColor="bg-blue-50"
        />
        <StatCard
          title="Today's Revenue"
          value={`₹${stats.todayRevenue.toLocaleString()}`}
          change={stats.revenueGrowthRate}
          icon="💰"
          color="text-green-700"
          bgColor="bg-green-50"
        />
        <StatCard
          title="Today's Appointments"
          value={stats.todayAppointments}
          icon="📅"
          color="text-purple-700"
          bgColor="bg-purple-50"
        />
        <StatCard
          title="Available Beds"
          value={`${stats.totalBeds - stats.occupiedBeds}/${stats.totalBeds}`}
          icon="🏥"
          color="text-orange-700"
          bgColor="bg-orange-50"
        />
      </div>

      {/* Secondary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Monthly Revenue"
          value={`₹${stats.monthlyRevenue.toLocaleString()}`}
          icon="📈"
          color="text-indigo-700"
          bgColor="bg-indigo-50"
        />
        <StatCard
          title="Active Doctors"
          value={stats.totalDoctors}
          icon="👨‍⚕️"
          color="text-teal-700"
          bgColor="bg-teal-50"
        />
        <StatCard
          title="Pending Admissions"
          value={stats.pendingAdmissions}
          icon="🏨"
          color="text-red-700"
          bgColor="bg-red-50"
        />
        <StatCard
          title="Bed Occupancy"
          value={`${stats.totalBeds > 0 ? Math.round((stats.occupiedBeds / stats.totalBeds) * 100) : 0}%`}
          icon="🛏️"
          color="text-yellow-700"
          bgColor="bg-yellow-50"
        />
      </div>

      {/* Quick Actions */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">⚡ Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <QuickAction
            title="New Patient"
            description="Register new patient"
            icon="👤"
            color="bg-blue-600"
            onClick={() => {
              if (onNavigate) {
                onNavigate('patient-entry');
                toast.success('Opening patient registration...');
              }
            }}
          />
          <QuickAction
            title="Schedule Appointment"
            description="Book new appointment"
            icon="📅"
            color="bg-green-600"
            onClick={() => {
              if (onNavigate) {
                onNavigate('appointments');
                toast.success('Opening appointment scheduling...');
              }
            }}
          />
          <QuickAction
            title="Patient List"
            description="View all patients"
            icon="📋"
            color="bg-purple-600"
            onClick={() => {
              if (onNavigate) {
                onNavigate('patient-list');
                toast.success('Opening patient list...');
              }
            }}
          />
          <QuickAction
            title="Reports"
            description="Generate reports"
            icon="📊"
            color="bg-orange-600"
            onClick={() => {
              setShowReportsModal(true);
              toast.success('Opening quick reports...');
            }}
          />
        </div>
      </div>

      {/* Charts and Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RevenueChart
          dailyRevenue={stats.todayRevenue}
          weeklyRevenue={weeklyRevenue}
          monthlyRevenue={stats.monthlyRevenue}
        />
        <RecentActivity patients={patients} appointments={appointments} />
      </div>

      {/* System Status */}
      <div className="mt-8 bg-gray-50 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className="w-3 h-3 bg-green-500 rounded-full mr-2 animate-pulse"></div>
            <span className="text-sm text-gray-600">System Status: Online</span>
          </div>
          <div className="flex items-center space-x-4 text-sm text-gray-500">
            <span>🟢 Database: Connected</span>
            <span>🟢 Authentication: Active</span>
            <span>🟢 Real-time: Synced</span>
          </div>
        </div>
      </div>

      {/* Reports Modal */}
      <QuickReportsModal
        isOpen={showReportsModal}
        onClose={() => setShowReportsModal(false)}
      />
    </div>
  );
};

export default RealTimeDashboard;
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { 
  Users, 
  Calendar, 
  Receipt, 
  TrendingUp, 
  Plus,
  UserPlus,
  CalendarPlus,
  FileText,
  Activity,
  Heart,
  Clock,
  DollarSign
} from 'lucide-react';
import { MetricCard } from '@/components/ui/MetricCard';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { RealtimeIndicator } from '@/components/ui/RealtimeIndicator';
import { LineChart } from '@/components/charts/LineChart';
// import { BarChart } from '@/components/charts/BarChart';
import { formatCurrency } from '@/utils';
// import LiveCalendar from '../../components/calendar/LiveCalendar';
// import TestCalendar from '../../components/calendar/TestCalendar';
// import SimpleCalendar from '../../components/calendar/SimpleCalendar';
import DebugCalendar from '../../components/DebugCalendar';
import { dashboardService } from '../../services/dashboardService';
import { useTodayAppointments, useAppointmentsRealtime } from '../../hooks/useAppointments';
import { useRecentPatients, usePatientsRealtime } from '../../hooks/usePatients';
import { useAuth } from '../../contexts/AuthContext';
import { queryKeys } from '../../config/reactQuery';

export const Dashboard: React.FC = () => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const { user } = useAuth();

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch dashboard data
  const { data: dashboardStats, isLoading: statsLoading } = useQuery({
    queryKey: queryKeys.dashboardStats,
    queryFn: () => dashboardService.getDashboardStats(),
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
  });

  const { data: chartData, isLoading: chartLoading } = useQuery({
    queryKey: queryKeys.chartData,
    queryFn: () => dashboardService.getChartData(),
    staleTime: 10 * 60 * 1000, // 10 minutes
  });

  const { data: todayAppointments, isLoading: appointmentsLoading } = useTodayAppointments();
  const { data: recentPatients, isLoading: patientsLoading } = useRecentPatients(5);

  // Enable real-time subscriptions for live data updates
  useAppointmentsRealtime();
  usePatientsRealtime();

  // Create metrics from real data
  const metrics = dashboardStats ? [
    {
      title: 'Total Patients',
      value: dashboardStats.totalPatients.toLocaleString(),
      change: { 
        value: `${dashboardStats.patientGrowthRate > 0 ? '+' : ''}${dashboardStats.patientGrowthRate}%`, 
        type: dashboardStats.patientGrowthRate >= 0 ? 'positive' as const : 'negative' as const 
      },
      icon: Users,
      gradient: { from: '#667eea', to: '#764ba2' },
    },
    {
      title: "Today's Appointments",
      value: dashboardStats.todayAppointments.toString(),
      change: { 
        value: `${dashboardStats.appointmentCompletionRate.toFixed(1)}% completion`, 
        type: 'positive' as const 
      },
      icon: Calendar,
      gradient: { from: '#f093fb', to: '#f5576c' },
    },
    {
      title: 'Pending Bills',
      value: dashboardStats.pendingBills.toString(),
      change: { value: 'Awaiting payment', type: 'neutral' as const },
      icon: Receipt,
      gradient: { from: '#4facfe', to: '#00f2fe' },
    },
    {
      title: 'Monthly Revenue',
      value: formatCurrency(dashboardStats.monthlyRevenue),
      change: { 
        value: `${dashboardStats.revenueGrowthRate > 0 ? '+' : ''}${dashboardStats.revenueGrowthRate.toFixed(1)}%`, 
        type: dashboardStats.revenueGrowthRate >= 0 ? 'positive' as const : 'negative' as const 
      },
      icon: TrendingUp,
      gradient: { from: '#43e97b', to: '#38f9d7' },
    },
  ] : [];

  const quickActions = [
    {
      label: 'Add Patient',
      icon: UserPlus,
      color: 'bg-blue-500 hover:bg-blue-600',
      action: () => console.log('Add patient'),
    },
    {
      label: 'Schedule Appointment',
      icon: CalendarPlus,
      color: 'bg-green-500 hover:bg-green-600',
      action: () => console.log('Schedule appointment'),
    },
    {
      label: 'Generate Bill',
      icon: FileText,
      color: 'bg-purple-500 hover:bg-purple-600',
      action: () => console.log('Generate bill'),
    },
    {
      label: 'View Reports',
      icon: Activity,
      color: 'bg-orange-500 hover:bg-orange-600',
      action: () => console.log('View reports'),
    },
  ];

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'confirmed':
        return <Badge variant="success">Confirmed</Badge>;
      case 'in_progress':
        return <Badge variant="info">In Progress</Badge>;
      case 'scheduled':
        return <Badge variant="warning">Scheduled</Badge>;
      case 'completed':
        return <Badge variant="success">Completed</Badge>;
      case 'cancelled':
        return <Badge variant="error">Cancelled</Badge>;
      default:
        return <Badge variant="neutral">{status}</Badge>;
    }
  };

  const formatAppointmentTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  };

  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) {
      const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
      return `${diffInMinutes} minutes ago`;
    } else if (diffInHours < 24) {
      return `${diffInHours} hours ago`;
    } else {
      const diffInDays = Math.floor(diffInHours / 24);
      return `${diffInDays} days ago`;
    }
  };

  if (statsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-1">
            Welcome back{user ? `, ${user.firstName}` : ''}! Here's what's happening at your hospital today.
          </p>
          <div className="flex items-center mt-2 text-sm text-gray-500">
            <Clock className="h-4 w-4 mr-1" />
            {currentTime.toLocaleString('en-IN', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </div>
        </div>
        
        <div className="mt-4 sm:mt-0 flex items-center space-x-3">
          <RealtimeIndicator />
          <Button variant="primary" leftIcon={<Plus className="h-4 w-4" />}>
            Quick Add
          </Button>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {metrics.map((metric, index) => (
          <motion.div
            key={metric.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
          >
            <MetricCard {...metric} />
          </motion.div>
        ))}
      </div>

      {/* Quick Actions */}
      <Card>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {quickActions.map((action, index) => (
            <motion.button
              key={action.label}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={action.action}
              className={`${action.color} text-white p-4 rounded-lg transition-colors duration-200 flex flex-col items-center space-y-2`}
            >
              <action.icon className="h-6 w-6" />
              <span className="text-sm font-medium">{action.label}</span>
            </motion.button>
          ))}
        </div>
      </Card>

      {/* Live Calendar Section */}
      <DebugCalendar />

      {/* Charts Section */}
      {chartData && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Revenue Trends */}
          <Card>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Revenue Trends</h3>
              <div className="flex items-center space-x-2">
                <DollarSign className="h-4 w-4 text-green-500" />
                <span className="text-sm text-gray-500">Last 6 months</span>
              </div>
            </div>
            {chartLoading ? (
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              </div>
            ) : (
              <LineChart
                data={chartData.revenueByMonth}
                xDataKey="month"
                lines={[
                  { dataKey: 'revenue', name: 'Revenue (₹)', color: '#3b82f6' },
                  { dataKey: 'count', name: 'Bills', color: '#10b981' },
                ]}
                height={300}
              />
            )}
          </Card>

          {/* Appointment Analytics */}
          <Card>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Appointment Status</h3>
              <div className="flex items-center space-x-2">
                <Calendar className="h-4 w-4 text-blue-500" />
                <span className="text-sm text-gray-500">Overview</span>
              </div>
            </div>
            {chartLoading ? (
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              </div>
            ) : (
              <div className="space-y-4">
                {Object.entries(chartData.appointmentsByStatus).map(([status, count]) => (
                  <div key={status} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      {getStatusBadge(status)}
                      <span className="text-sm font-medium text-gray-900 capitalize">
                        {status.replace('_', ' ').toLowerCase()}
                      </span>
                    </div>
                    <span className="text-lg font-semibold text-gray-900">{count}</span>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      )}

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Appointments */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Today's Appointments</h3>
            <Button variant="secondary" size="sm">
              View All
            </Button>
          </div>
          <div className="space-y-4">
            {appointmentsLoading ? (
              <div className="flex items-center justify-center h-32">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              </div>
            ) : todayAppointments && todayAppointments.length > 0 ? (
              todayAppointments.slice(0, 5).map((appointment, index) => (
                <motion.div
                  key={appointment.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                  className="flex items-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors duration-150"
                >
                  <Avatar
                    fallback={appointment.patient?.first_name?.charAt(0) || 'P'}
                    size="md"
                    className="bg-primary-100 text-primary-700"
                  />
                  <div className="ml-3 flex-1">
                    <p className="text-sm font-medium text-gray-900">
                      {appointment.patient?.first_name} {appointment.patient?.last_name}
                    </p>
                    <p className="text-sm text-gray-500">
                      {formatAppointmentTime(appointment.scheduled_at)} - 
                      Dr. {appointment.doctor?.first_name} {appointment.doctor?.last_name}
                    </p>
                    <p className="text-xs text-gray-400">{appointment.appointment_type}</p>
                  </div>
                  <div className="flex-shrink-0">
                    {getStatusBadge(appointment.status)}
                  </div>
                </motion.div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Calendar className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No appointments scheduled for today</p>
              </div>
            )}
          </div>
        </Card>

        {/* Recent Patients */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">New Patients</h3>
            <Button variant="secondary" size="sm">
              View All
            </Button>
          </div>
          <div className="space-y-4">
            {patientsLoading ? (
              <div className="flex items-center justify-center h-32">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              </div>
            ) : recentPatients && Array.isArray(recentPatients) && recentPatients.length > 0 ? (
              recentPatients.map((patient: any, index: number) => (
                <motion.div
                  key={patient.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                  className="flex items-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors duration-150"
                >
                  <Avatar
                    fallback={patient.first_name.charAt(0)}
                    size="md"
                    className="bg-green-100 text-green-700"
                  />
                  <div className="ml-3 flex-1">
                    <p className="text-sm font-medium text-gray-900">
                      {patient.first_name} {patient.last_name}
                    </p>
                    <p className="text-sm text-gray-500">
                      {patient.gender} - {patient.blood_group || 'Blood group not specified'}
                    </p>
                    <p className="text-xs text-gray-400">
                      {formatRelativeTime(patient.created_at)}
                    </p>
                  </div>
                  <div className="flex-shrink-0">
                    <Heart className="h-4 w-4 text-red-500" />
                  </div>
                </motion.div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No new patients registered</p>
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};
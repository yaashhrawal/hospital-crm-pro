import { supabase } from '../config/supabase';
import type { DashboardStats, ChartData } from '../config/supabase';
import type { HospitalStats, RevenueBreakdown, DashboardMetrics, PaymentModeBreakdown, TransactionBreakdown } from '../types/api';

export interface KPIMetrics {
  patientGrowthRate: number;
  appointmentCompletionRate: number;
  averageWaitTime: number;
  revenueGrowthRate: number;
  patientSatisfactionScore: number;
  doctorUtilizationRate: number;
  billCollectionRate: number;
  averageConsultationTime: number;
}

export interface TopPerformers {
  topDoctors: Array<{
    id: string;
    name: string;
    appointmentsCompleted: number;
    revenue: number;
  }>;
  topDepartments: Array<{
    id: string;
    name: string;
    revenue: number;
    appointmentCount: number;
  }>;
}

class DashboardService {
  /**
   * Get dashboard statistics
   */
  async getDashboardStats(): Promise<HospitalStats> {
    try {
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      // const twoMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 2, 1); // Unused
      
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const endOfDay = new Date(today);
      endOfDay.setHours(23, 59, 59, 999);

      // Get basic counts
      const [
        { count: totalPatients },
        { count: totalDoctors },
        { count: todayAppointments },
        { count: pendingBills },
        { count: currentMonthPatients },
        { count: lastMonthPatients },
        { count: totalAppointments },
        { count: completedAppointments },
        monthlyRevenueResult,
        lastMonthRevenueResult,
      ] = await Promise.all([
        // Total patients
        supabase.from('patients').select('id', { count: 'exact', head: true }).eq('is_active', true),
        
        // Total doctors
        supabase.from('users').select('id', { count: 'exact', head: true }).eq('role', 'DOCTOR').eq('is_active', true),
        
        // Today's appointments
        supabase.from('appointments').select('id', { count: 'exact', head: true })
          .gte('scheduled_at', today.toISOString())
          .lte('scheduled_at', endOfDay.toISOString()),
        
        // Pending bills
        supabase.from('bills').select('id', { count: 'exact', head: true }).eq('status', 'PENDING'),
        
        // Current month patients
        supabase.from('patients').select('id', { count: 'exact', head: true })
          .gte('created_at', startOfMonth.toISOString()),
        
        // Last month patients
        supabase.from('patients').select('id', { count: 'exact', head: true })
          .gte('created_at', lastMonth.toISOString())
          .lt('created_at', startOfMonth.toISOString()),
        
        // Total appointments
        supabase.from('appointments').select('id', { count: 'exact', head: true })
          .gte('scheduled_at', startOfMonth.toISOString()),
        
        // Completed appointments
        supabase.from('appointments').select('id', { count: 'exact', head: true })
          .eq('status', 'COMPLETED')
          .gte('scheduled_at', startOfMonth.toISOString()),
        
        // Monthly revenue
        supabase.from('bills').select('paid_amount')
          .eq('status', 'PAID')
          .gte('payment_date', startOfMonth.toISOString()),
        
        // Last month revenue
        supabase.from('bills').select('paid_amount')
          .eq('status', 'PAID')
          .gte('payment_date', lastMonth.toISOString())
          .lt('payment_date', startOfMonth.toISOString()),
      ]);

      // Calculate monthly revenue
      const monthlyRevenue = monthlyRevenueResult.data?.reduce((sum, bill) => sum + (bill.paid_amount || 0), 0) || 0;
      const lastMonthRevenue = lastMonthRevenueResult.data?.reduce((sum, bill) => sum + (bill.paid_amount || 0), 0) || 0;

      // Calculate growth rates
      const patientGrowthRate = (lastMonthPatients && currentMonthPatients) 
        ? ((currentMonthPatients - lastMonthPatients) / lastMonthPatients) * 100 
        : 0;

      const appointmentCompletionRate = (totalAppointments && completedAppointments) 
        ? (completedAppointments / totalAppointments) * 100 
        : 0;

      const revenueGrowthRate = lastMonthRevenue 
        ? ((monthlyRevenue - lastMonthRevenue) / lastMonthRevenue) * 100 
        : 0;

      // Calculate average wait time (simplified calculation)
      const { data: waitTimeData } = await supabase
        .from('appointments')
        .select('scheduled_at, actual_start_time')
        .eq('status', 'COMPLETED')
        .not('actual_start_time', 'is', null)
        .gte('scheduled_at', startOfMonth.toISOString());

      let totalWaitTime = 0;
      let waitTimeCount = 0;

      waitTimeData?.forEach((appointment) => {
        if (appointment.actual_start_time && appointment.scheduled_at) {
          const waitTime = new Date(appointment.actual_start_time).getTime() - new Date(appointment.scheduled_at).getTime();
          totalWaitTime += waitTime;
          waitTimeCount++;
        }
      });

      const averageWaitTime = waitTimeCount > 0 ? totalWaitTime / waitTimeCount / (1000 * 60) : 0; // Convert to minutes

      return {
        totalPatients: totalPatients || 0,
        totalDoctors: totalDoctors || 0,
        todayAppointments: todayAppointments || 0,
        pendingBills: pendingBills || 0,
        monthlyRevenue,
        todayRevenue: monthlyRevenue,
        todayExpenses: 0,
        netRevenue: monthlyRevenue,
        revenue: monthlyRevenue,
        count: totalPatients || 0,
        patientGrowthRate: Math.round(patientGrowthRate * 100) / 100,
        appointmentCompletionRate: Math.round(appointmentCompletionRate * 100) / 100,
        averageWaitTime: Math.round(averageWaitTime * 100) / 100,
        revenueGrowthRate: Math.round(revenueGrowthRate * 100) / 100,
      } as HospitalStats;
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      throw error;
    }
  }

  /**
   * Get chart data for dashboard
   */
  async getChartData(): Promise<ChartData> {
    try {
      // Get revenue by month (last 6 months)
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

      const { data: revenueData } = await supabase
        .from('bills')
        .select('payment_date, paid_amount')
        .eq('status', 'PAID')
        .gte('payment_date', sixMonthsAgo.toISOString())
        .order('payment_date', { ascending: true });

      // Get patients by month (last 6 months)
      const { data: patientData } = await supabase
        .from('patients')
        .select('created_at')
        .eq('is_active', true)
        .gte('created_at', sixMonthsAgo.toISOString())
        .order('created_at', { ascending: true });

      // Get appointments by status
      const { data: appointmentStatusData } = await supabase
        .from('appointments')
        .select('status');

      // Get appointments by type
      const { data: appointmentTypeData } = await supabase
        .from('appointments')
        .select('appointment_type');

      // Get revenue by payment method
      const { data: paymentMethodData } = await supabase
        .from('bills')
        .select('payment_method, paid_amount')
        .eq('status', 'PAID')
        .not('payment_method', 'is', null);

      // Process revenue by month
      const revenueByMonth = this.groupByMonth(revenueData || [], 'payment_date', 'paid_amount');

      // Process patients by month
      const patientsByMonth = this.groupByMonth(patientData || [], 'created_at');

      // Process appointment status distribution
      const appointmentsByStatus: Record<string, number> = {};
      appointmentStatusData?.forEach((appointment) => {
        appointmentsByStatus[appointment.status] = (appointmentsByStatus[appointment.status] || 0) + 1;
      });

      // Process appointment type distribution
      const appointmentsByType: Record<string, number> = {};
      appointmentTypeData?.forEach((appointment) => {
        appointmentsByType[appointment.appointment_type] = (appointmentsByType[appointment.appointment_type] || 0) + 1;
      });

      // Process revenue by payment method
      const revenueByPaymentMethod: Record<string, number> = {};
      paymentMethodData?.forEach((bill) => {
        if (bill.payment_method) {
          revenueByPaymentMethod[bill.payment_method] = (revenueByPaymentMethod[bill.payment_method] || 0) + (bill.paid_amount || 0);
        }
      });

      return {
        revenueByMonth,
        patientsByMonth,
        appointmentsByStatus,
        appointmentsByType,
        revenueByPaymentMethod,
      } as any;
    } catch (error) {
      console.error('Error fetching chart data:', error);
      throw error;
    }
  }

  /**
   * Get KPI metrics
   */
  async getKPIMetrics(): Promise<KPIMetrics> {
    try {
      const stats = await this.getDashboardStats();

      // Calculate additional KPIs
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      // Get consultation time data
      const { data: consultationData } = await supabase
        .from('appointments')
        .select('actual_start_time, actual_end_time')
        .eq('status', 'COMPLETED')
        .not('actual_start_time', 'is', null)
        .not('actual_end_time', 'is', null)
        .gte('scheduled_at', startOfMonth.toISOString());

      let totalConsultationTime = 0;
      let consultationCount = 0;

      consultationData?.forEach((appointment) => {
        if (appointment.actual_start_time && appointment.actual_end_time) {
          const duration = new Date(appointment.actual_end_time).getTime() - new Date(appointment.actual_start_time).getTime();
          totalConsultationTime += duration;
          consultationCount++;
        }
      });

      const averageConsultationTime = consultationCount > 0 ? totalConsultationTime / consultationCount / (1000 * 60) : 0;

      // Get bill collection data
      const [
        { data: totalBillsData },
        { data: paidBillsData },
      ] = await Promise.all([
        supabase.from('bills').select('total_amount').gte('created_at', startOfMonth.toISOString()),
        supabase.from('bills').select('paid_amount').eq('status', 'PAID').gte('created_at', startOfMonth.toISOString()),
      ]);

      const totalBillAmount = totalBillsData?.reduce((sum, bill) => sum + bill.total_amount, 0) || 0;
      const totalPaidAmount = paidBillsData?.reduce((sum, bill) => sum + (bill.paid_amount || 0), 0) || 0;
      const billCollectionRate = totalBillAmount > 0 ? (totalPaidAmount / totalBillAmount) * 100 : 0;

      // Calculate doctor utilization (simplified)
      const workingHoursPerDay = 8;
      const workingDaysInMonth = 22;
      const totalDoctorHours = stats.totalDoctors * workingHoursPerDay * workingDaysInMonth;
      const totalConsultationHours = totalConsultationTime / (1000 * 60 * 60);
      const doctorUtilizationRate = totalDoctorHours > 0 ? (totalConsultationHours / totalDoctorHours) * 100 : 0;

      return {
        patientGrowthRate: stats.patientGrowthRate,
        appointmentCompletionRate: stats.appointmentCompletionRate,
        averageWaitTime: stats.averageWaitTime,
        revenueGrowthRate: stats.revenueGrowthRate,
        patientSatisfactionScore: 4.2, // This would come from a feedback system
        doctorUtilizationRate: Math.round(doctorUtilizationRate * 100) / 100,
        billCollectionRate: Math.round(billCollectionRate * 100) / 100,
        averageConsultationTime: Math.round(averageConsultationTime * 100) / 100,
      };
    } catch (error) {
      console.error('Error fetching KPI metrics:', error);
      throw error;
    }
  }

  /**
   * Get top performers
   */
  async getTopPerformers(): Promise<TopPerformers> {
    try {
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      // Get top doctors by appointments completed
      const { data: doctorAppointments } = await supabase
        .from('appointments')
        .select(`
          doctor_id,
          doctor:users!appointments_doctor_id_fkey(
            id,
            first_name,
            last_name
          )
        `)
        .eq('status', 'COMPLETED')
        .gte('scheduled_at', startOfMonth.toISOString());

      // Group by doctor and count appointments
      const doctorStats: Record<string, { name: string; count: number }> = {};
      doctorAppointments?.forEach((appointment) => {
        const doctor = appointment.doctor;
        if (doctor) {
          const key = doctor.id;
          if (!doctorStats[key]) {
            doctorStats[key] = {
              name: `${doctor.first_name} ${doctor.last_name}`,
              count: 0,
            };
          }
          doctorStats[key].count++;
        }
      });

      // Get revenue by doctor
      const { data: doctorRevenue } = await supabase
        .from('bills')
        .select(`
          paid_amount,
          appointment:appointments(
            doctor_id,
            doctor:users!appointments_doctor_id_fkey(
              id,
              first_name,
              last_name
            )
          )
        `)
        .eq('status', 'PAID')
        .gte('payment_date', startOfMonth.toISOString());

      const doctorRevenueStats: Record<string, number> = {};
      doctorRevenue?.forEach((bill) => {
        const doctor = bill.appointment?.doctor;
        if (doctor) {
          const key = doctor.id;
          doctorRevenueStats[key] = (doctorRevenueStats[key] || 0) + (bill.paid_amount || 0);
        }
      });

      // Combine and sort top doctors
      const topDoctors = Object.entries(doctorStats)
        .map(([id, stats]) => ({
          id,
          name: stats.name,
          appointmentsCompleted: stats.count,
          revenue: doctorRevenueStats[id] || 0,
        }))
        .sort((a, b) => b.appointmentsCompleted - a.appointmentsCompleted)
        .slice(0, 5);

      // Get top departments by revenue
      const { data: departmentRevenue } = await supabase
        .from('bills')
        .select(`
          paid_amount,
          appointment:appointments(
            department_id,
            department:departments(
              id,
              name
            )
          )
        `)
        .eq('status', 'PAID')
        .gte('payment_date', startOfMonth.toISOString());

      const departmentStats: Record<string, { name: string; revenue: number; appointmentCount: number }> = {};
      departmentRevenue?.forEach((bill) => {
        const department = bill.appointment?.department;
        if (department) {
          const key = department.id;
          if (!departmentStats[key]) {
            departmentStats[key] = {
              name: department.name,
              revenue: 0,
              appointmentCount: 0,
            };
          }
          departmentStats[key].revenue += bill.paid_amount || 0;
          departmentStats[key].appointmentCount++;
        }
      });

      const topDepartments = Object.entries(departmentStats)
        .map(([id, stats]) => ({
          id,
          name: stats.name,
          revenue: stats.revenue,
          appointmentCount: stats.appointmentCount,
        }))
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 5);

      return {
        topDoctors,
        topDepartments,
      };
    } catch (error) {
      console.error('Error fetching top performers:', error);
      throw error;
    }
  }

  /**
   * Group data by month
   */
  private groupByMonth(
    data: any[], 
    dateField: string, 
    valueField?: string
  ): Array<{ month: string; revenue: number; count: number; [key: string]: any }> {
    const groupedData: Record<string, any> = {};

    data.forEach((item) => {
      const date = new Date(item[dateField]);
      const monthKey = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
      
      if (!groupedData[monthKey]) {
        groupedData[monthKey] = {
          month: date.toLocaleString('default', { month: 'short', year: 'numeric' }),
          count: 0,
          revenue: 0,
        };
      }

      groupedData[monthKey].count++;
      if (valueField && item[valueField]) {
        groupedData[monthKey].revenue += item[valueField];
      }
    });

    return Object.values(groupedData).sort((a, b) => 
      new Date(a.month).getTime() - new Date(b.month).getTime()
    );
  }

  /**
   * Subscribe to real-time dashboard updates
   */
  subscribeToUpdates(callback: () => void) {
    const channels = [
      supabase
        .channel('dashboard_patients')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'patients' }, callback),
      
      supabase
        .channel('dashboard_appointments')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'appointments' }, callback),
      
      supabase
        .channel('dashboard_bills')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'bills' }, callback),
    ];

    channels.forEach(channel => channel.subscribe());

    return () => {
      channels.forEach(channel => channel.unsubscribe());
    };
  }
}

export const dashboardService = new DashboardService();
export default dashboardService;
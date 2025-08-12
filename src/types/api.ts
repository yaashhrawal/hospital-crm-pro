// Additional API and Database Types for Hospital CRM
export interface HospitalStats {
  revenue: number;
  count: number;
  totalPatients: number;
  todayRevenue: number;
  todayExpenses: number;
  netRevenue: number;
  totalDoctors: number;
  todayAppointments: number;
  pendingBills: number;
  monthlyRevenue: number;
  totalBeds: number;
  availableBeds: number;
  occupiedBeds: number;
  patientGrowthRate: number;
  appointmentCompletionRate: number;
  averageWaitTime: number;
  revenueGrowthRate: number;
  [key: string]: any;
}

export interface ChartDataPoint {
  name: string;
  value: number;
  revenue?: number;
  count?: number;
  [key: string]: any;
}

export interface RevenueBreakdown {
  key: string;
  revenue: number;
  count: number;
  percentage: number;
  [key: string]: any;
}

export interface DepartmentRevenue {
  department: string;
  revenue: number;
  count: number;
  [key: string]: any;
}

export interface DoctorRevenue {
  doctor: string;
  revenue: number;
  count: number;
  [key: string]: any;
}

export interface DatabaseUser {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  role?: string;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
  [key: string]: any;
}

export interface AuthUser {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: 'admin' | 'doctor' | 'staff';
  is_active: boolean;
  [key: string]: any;
}

export interface SupabaseResponse<T> {
  data: T | null;
  error: any;
}

export interface DatabaseRecord {
  id: string;
  created_at?: string;
  updated_at?: string;
  [key: string]: any;
}

// Fix for dashboard service return types
export interface DashboardMetrics {
  [key: string]: {
    revenue: number;
    count: number;
  };
}

export interface PaymentModeBreakdown {
  [mode: string]: {
    revenue: number;
    count: number;
  };
}

export interface TransactionBreakdown {
  [type: string]: {
    revenue: number;
    count: number;
  };
}
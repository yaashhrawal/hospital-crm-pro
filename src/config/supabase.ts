import { createClient } from '@supabase/supabase-js';

// Supabase configuration
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

// Create Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});

// Database Types (matching Supabase schema)
export interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: 'ADMIN' | 'DOCTOR' | 'NURSE' | 'STAFF';
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Patient {
  id: string;
  patient_id: string;
  first_name: string;
  last_name: string;
  date_of_birth: string;
  gender: 'MALE' | 'FEMALE' | 'OTHER';
  phone: string;
  email?: string;
  address: string;
  emergency_contact_name: string;
  emergency_contact_phone: string;
  medical_history?: string;
  allergies?: string;
  current_medications?: string;
  blood_group?: string;
  notes?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  created_by: string;
}

export interface Department {
  id: string;
  name: string;
  description?: string;
  head_doctor_id?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Appointment {
  id: string;
  appointment_id: string;
  patient_id: string;
  doctor_id: string;
  department_id: string;
  scheduled_at: string;
  duration: number;
  status: 'SCHEDULED' | 'CONFIRMED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW';
  reason: string;
  appointment_type: string;
  actual_start_time?: string;
  actual_end_time?: string;
  diagnosis?: string;
  prescription?: string;
  follow_up_date?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface Bill {
  id: string;
  bill_number: string;
  patient_id: string;
  appointment_id: string;
  items: any; // JSON
  consultation_fee: number;
  subtotal: number;
  discount: number;
  cgst: number;
  sgst: number;
  igst: number;
  total_tax: number;
  total_amount: number;
  paid_amount?: number;
  status: 'PENDING' | 'PAID' | 'PARTIALLY_PAID' | 'OVERDUE' | 'CANCELLED' | 'REFUNDED';
  payment_method?: 'CASH' | 'CARD' | 'UPI' | 'BANK_TRANSFER' | 'CHEQUE' | 'INSURANCE';
  payment_date?: string;
  payment_reference?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  created_by: string;
}

// Extended types with relations
export interface PatientWithRelations extends Patient {
  created_by_user?: User;
  appointments?: AppointmentWithRelations[];
  bills?: BillWithRelations[];
}

export interface AppointmentWithRelations extends Appointment {
  patient?: Patient;
  doctor?: User;
  department?: Department;
  bills?: Bill[];
}

export interface BillWithRelations extends Bill {
  patient?: Patient;
  appointment?: AppointmentWithRelations;
  created_by_user?: User;
}

// API Response types
export interface ApiResponse<T> {
  data: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  count: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Form types
export interface CreatePatientData {
  first_name: string;
  last_name: string;
  date_of_birth: string;
  gender: 'MALE' | 'FEMALE' | 'OTHER';
  phone: string;
  email?: string;
  address: string;
  emergency_contact_name: string;
  emergency_contact_phone: string;
  medical_history?: string;
  allergies?: string;
  current_medications?: string;
  blood_group?: string;
  notes?: string;
}

export interface CreateAppointmentData {
  patient_id: string;
  doctor_id: string;
  department_id: string;
  scheduled_at: string;
  duration?: number;
  reason: string;
  appointment_type?: string;
  notes?: string;
}

export interface CreateBillData {
  appointment_id: string;
  patient_id: string;
  items: any[];
  consultation_fee: number;
  discount?: number;
  notes?: string;
}

// Dashboard types
export interface DashboardStats {
  totalPatients: number;
  totalDoctors: number;
  todayAppointments: number;
  pendingBills: number;
  monthlyRevenue: number;
  patientGrowthRate: number;
  appointmentCompletionRate: number;
  averageWaitTime: number;
  revenueGrowthRate: number;
}

export interface ChartData {
  revenueByMonth: { month: string; revenue: number }[];
  patientsByMonth: { month: string; count: number }[];
  appointmentsByStatus: Record<string, number>;
  appointmentsByType: Record<string, number>;
  revenueByPaymentMethod: Record<string, number>;
}

// Auth types
export interface AuthUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  isActive: boolean;
}

// Utility type for Supabase queries
export type SupabaseQuery<T> = {
  data: T[] | null;
  error: any;
  count?: number | null;
};

// Export configured client as default
export default supabase;
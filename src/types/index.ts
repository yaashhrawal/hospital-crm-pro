// Core types
export type Gender = 'M' | 'F' | 'OTHER';
export type UserRole = 'ADMIN' | 'DOCTOR' | 'NURSE' | 'STAFF' | 'admin' | 'doctor' | 'staff';
export type PaymentMode = 'cash' | 'online' | 'card' | 'upi' | 'insurance' | 'adjustment';
export type TransactionType = 'entry_fee' | 'consultation' | 'service' | 'admission' | 'medicine' | 'discount' | 'refund';

export interface Patient {
  id: string;
  firstName?: string;
  lastName?: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  phone: string;
  address: string;
  age: number;
  gender: Gender;
  bloodGroup?: string;
  emergencyContact?: {
    name: string;
    phone: string;
    relationship: string;
  };
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  medicalHistory?: string[];
  allergies?: string[];
  is_active?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
  created_at?: string;
  updated_at?: string;
  created_by?: string;
  [key: string]: any;
}

export interface Appointment {
  id: string;
  patientId: string;
  doctorId: string;
  date: Date;
  time: string;
  type: 'consultation' | 'follow-up' | 'emergency' | 'surgery';
  status: 'scheduled' | 'confirmed' | 'in-progress' | 'completed' | 'cancelled';
  reason: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Doctor {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  specialization: string;
  qualification: string;
  experience: number;
  consultationFee: number;
  availability: {
    [key: string]: {
      start: string;
      end: string;
      slots: number;
    };
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface Bill {
  id: string;
  patientId: string;
  appointmentId?: string;
  items: BillItem[];
  subtotal: number;
  gst: number;
  discount?: number;
  total: number;
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
  paymentMethod?: 'cash' | 'card' | 'upi' | 'bank-transfer';
  createdAt: Date;
  updatedAt: Date;
}

export interface BillItem {
  id: string;
  description: string;
  quantity: number;
  rate: number;
  amount: number;
  gstRate: number;
}

export interface User {
  id: string;
  email: string;
  password?: string;
  firstName?: string;
  lastName?: string;
  first_name?: string;
  last_name?: string;
  role: UserRole;
  isActive?: boolean;
  is_active?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
  created_at?: string;
  updated_at?: string;
  [key: string]: any;
}

export interface DashboardStats {
  totalPatients: number;
  totalDoctors: number;
  todayAppointments: number;
  pendingBills: number;
  monthlyRevenue: number;
  todayRevenue: number;
  todayExpenses: number;
  netRevenue: number;
  revenue: number;
  count: number;
  patientGrowthRate?: number;
  appointmentCompletionRate?: number;
  averageWaitTime?: number;
  revenueGrowthRate?: number;
  appointmentsByStatus: {
    scheduled: number;
    completed: number;
    cancelled: number;
  };
  revenueByMonth: Array<{
    month: string;
    revenue: number;
    count?: number;
  }>;
  [key: string]: any;
}

export interface ApiResponse<T> {
  success?: boolean;
  data: T | null;
  error?: any;
  message?: string;
  errors?: string[];
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface LoadingState {
  isLoading: boolean;
  error: string | null;
}

export interface FormFieldProps {
  label: string;
  error?: string;
  required?: boolean;
  className?: string;
}

export interface TableColumn<T> {
  key: keyof T;
  header: string;
  sortable?: boolean;
  render?: (value: any, row: T) => React.ReactNode;
}

// Additional interfaces for fixing TypeScript errors
export interface PatientTransaction {
  id: string;
  patient_id: string;
  transaction_type: TransactionType;
  amount: number;
  payment_mode: PaymentMode;
  doctor_id?: string;
  department: string;
  description: string;
  transaction_date?: string;
  created_at?: string;
  [key: string]: any;
}

export interface DailyExpense {
  id: string;
  expense_category: string;
  custom_category?: string;
  description: string;
  amount: number;
  payment_mode: PaymentMode;
  date: string;
  approved_by?: string; // Made optional
  [key: string]: any;
}

export interface Doctor {
  id: string;
  name: string;
  first_name?: string;
  last_name?: string;
  department: string;
  specialization: string;
  fee: number;
  is_active: boolean;
  [key: string]: any;
}

export interface Department {
  id: string;
  name: string;
  description?: string;
  is_active: boolean;
  [key: string]: any;
}

export interface PatientWithRelations {
  id: string;
  [key: string]: any;
}

export interface AppointmentWithRelations {
  id: string;
  patient?: Patient;
  doctor?: Doctor;
  [key: string]: any;
}

export interface CreateAppointmentData {
  patient_id: string;
  doctor_id: string;
  appointment_date: string;
  appointment_time: string;
  appointment_type: string;
  notes?: string;
  [key: string]: any;
}

export interface UpdateAppointmentData {
  id: string;
  status?: string;
  notes?: string;
  [key: string]: any;
}

export interface PatientListParams {
  search?: string;
  page?: number;
  limit?: number;
  department?: string;
  doctor?: string;
  [key: string]: any;
}
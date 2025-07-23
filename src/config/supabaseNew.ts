import { createClient } from '@supabase/supabase-js';

// NEW SUPABASE PROJECT CONFIGURATION
const supabaseUrl = 'https://oghqwddhojnryovmfvzc.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9naHF3ZGRob2pucnlvdm1mdnpjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMxMTQ1NDEsImV4cCI6MjA2ODY5MDU0MX0.NVvYQFtqIg8OV-vvkAhCNFC_uMC1SBJDSKcLHRjf5w0';

// Create Supabase client with new configuration
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

// COMPREHENSIVE DATABASE SCHEMA TYPES - MATCHING NEW ENHANCED SCHEMA

export interface Hospital {
  id: string;
  name: string;
  address: string;
  phone: string;
  email: string;
  registration_number: string;
  gst_number: string;
  created_at: string;
  updated_at: string;
}

export interface User {
  id: string;
  auth_id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: 'ADMIN' | 'DOCTOR' | 'NURSE' | 'STAFF' | 'RECEPTIONIST';
  phone: string;
  specialization?: string;
  consultation_fee?: number;
  department?: string;
  hospital_id: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Patient {
  id: string;
  patient_id: string; // Auto-generated P0001, P0002, etc.
  first_name: string;
  last_name: string;
  date_of_birth: string;
  age: number; // Calculated via trigger
  gender: 'MALE' | 'FEMALE' | 'OTHER';
  phone: string;
  email?: string;
  address: string;
  emergency_contact_name: string;
  emergency_contact_phone: string;
  blood_group?: string;
  medical_history?: string;
  allergies?: string;
  current_medications?: string;
  insurance_provider?: string;
  insurance_number?: string;
  has_reference?: boolean; // Reference field
  reference_details?: string; // Reference details
  assigned_doctor?: string; // Assigned doctor name
  assigned_department?: string; // Assigned department
  notes?: string;
  hospital_id: string;
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
  hospital_id: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Bed {
  id: string;
  bed_number: string;
  room_type: 'GENERAL' | 'PRIVATE' | 'ICU' | 'EMERGENCY';
  department_id?: string;
  daily_rate: number;
  status: 'AVAILABLE' | 'OCCUPIED' | 'MAINTENANCE' | 'RESERVED';
  hospital_id: string;
  created_at: string;
  updated_at: string;
}

export interface PatientAdmission {
  id: string;
  patient_id: string;
  bed_id: string;
  admission_date: string;
  expected_discharge_date?: string;
  actual_discharge_date?: string;
  admission_notes?: string;
  discharge_notes?: string;
  services: any; // JSONB field
  total_amount: number;
  amount_paid: number;
  balance: number;
  status: 'ACTIVE' | 'DISCHARGED' | 'TRANSFERRED';
  admitted_by: string;
  discharged_by?: string;
  hospital_id: string;
  created_at: string;
  updated_at: string;
}

export interface PatientTransaction {
  id: string;
  patient_id: string;
  admission_id?: string;
  transaction_type: 'ENTRY_FEE' | 'CONSULTATION' | 'LAB_TEST' | 'XRAY' | 'MEDICINE' | 'PROCEDURE' | 'ADMISSION_FEE' | 'DAILY_CHARGE' | 'SERVICE' | 'REFUND';
  amount: number;
  payment_mode: 'CASH' | 'CARD' | 'UPI' | 'ONLINE' | 'BANK_TRANSFER' | 'INSURANCE';
  description: string;
  doctor_id?: string;
  department?: string;
  receipt_number?: string;
  notes?: string;
  status: 'PENDING' | 'COMPLETED' | 'CANCELLED';
  hospital_id: string;
  created_at: string;
  created_by: string;
}

export interface DailyExpense {
  id: string;
  expense_category: 'STAFF_SALARY' | 'UTILITIES' | 'MEDICAL_SUPPLIES' | 'MAINTENANCE' | 'ADMINISTRATIVE' | 'EQUIPMENT' | 'RENT' | 'INSURANCE' | 'OTHER';
  amount: number;
  description: string;
  payment_mode: 'CASH' | 'CARD' | 'UPI' | 'ONLINE' | 'BANK_TRANSFER' | 'CHEQUE';
  vendor_name?: string;
  vendor_contact?: string;
  receipt_number?: string;
  expense_date: string;
  approval_status: 'PENDING' | 'APPROVED' | 'REJECTED';
  approved_by?: string;
  notes?: string;
  hospital_id: string;
  created_at: string;
  created_by: string;
}

export interface FutureAppointment {
  id: string;
  patient_id: string;
  doctor_id: string;
  appointment_date: string;
  appointment_time: string;
  appointment_type: 'CONSULTATION' | 'FOLLOW_UP' | 'EMERGENCY' | 'PROCEDURE' | 'CHECKUP';
  status: 'SCHEDULED' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED' | 'NO_SHOW';
  estimated_cost?: number;
  notes?: string;
  reminder_sent: boolean;
  hospital_id: string;
  created_at: string;
  created_by: string;
}

// ENHANCED INTERFACES WITH RELATIONSHIPS

export interface PatientWithRelations extends Patient {
  transactions?: PatientTransaction[];
  admissions?: PatientAdmission[];
  appointments?: FutureAppointment[];
  totalSpent?: number;
  visitCount?: number;
  lastVisit?: string;
}

export interface PatientAdmissionWithRelations extends PatientAdmission {
  patient?: Patient;
  bed?: Bed;
  transactions?: PatientTransaction[];
  admitted_by_user?: User;
  discharged_by_user?: User;
}

export interface BedWithRelations extends Bed {
  department?: Department;
  current_admission?: PatientAdmission;
  current_patient?: Patient;
}

export interface TransactionWithRelations extends PatientTransaction {
  patient?: Patient;
  doctor?: User;
  admission?: PatientAdmission;
}

export interface AppointmentWithRelations extends FutureAppointment {
  patient?: Patient;
  doctor?: User;
}

// DASHBOARD STATISTICS TYPE
export interface DashboardStats {
  total_patients: number;
  active_admissions: number;
  available_beds: number;
  total_beds: number;
  today_revenue: number;
  today_expenses: number;
  net_revenue: number;
  pending_appointments: number;
  todays_appointments: number;
  occupancy_rate: number;
}

// BED AVAILABILITY TYPE
export interface BedAvailability {
  bed_id: string;
  bed_number: string;
  room_type: string;
  daily_rate: number;
  is_available: boolean;
  current_patient?: string;
}

// CREATE PATIENT DATA TYPE
export interface CreatePatientData {
  first_name: string;
  last_name?: string;
  date_of_birth?: string;
  gender: 'MALE' | 'FEMALE' | 'OTHER';
  phone?: string;
  email?: string;
  address?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  blood_group?: string;
  medical_history?: string;
  allergies?: string;
  current_medications?: string;
  insurance_provider?: string;
  insurance_number?: string;
  has_reference?: boolean; // Reference field
  reference_details?: string; // Reference details
  assigned_doctor?: string; // Assigned doctor name
  assigned_department?: string; // Assigned department
  notes?: string;
  hospital_id: string;
}

// CREATE ADMISSION DATA TYPE
export interface CreateAdmissionData {
  patient_id: string;
  bed_id: string;
  admission_date: string;
  expected_discharge_date?: string;
  admission_notes?: string;
  services?: any;
  admitted_by: string;
  hospital_id: string;
}

// PATIENT SEARCH FILTERS
export interface PatientSearchFilters {
  search?: string;
  gender?: string;
  blood_group?: string;
  age_min?: number;
  age_max?: number;
  admission_status?: 'ALL' | 'ADMITTED' | 'NOT_ADMITTED';
  date_from?: string;
  date_to?: string;
}

// API RESPONSE TYPES
export interface ApiResponse<T> {
  data: T | null;
  error: string | null;
  count?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  count: number;
  page: number;
  per_page: number;
  total_pages: number;
}

// DEFAULT HOSPITAL ID (City General Hospital from your schema)
export const HOSPITAL_ID = '550e8400-e29b-41d4-a716-446655440000';

// APPOINTMENT CONSTANTS
export const APPOINTMENT_TYPES = [
  { value: 'CONSULTATION', label: 'Consultation' },
  { value: 'FOLLOW_UP', label: 'Follow-up' },
  { value: 'EMERGENCY', label: 'Emergency' },
  { value: 'PROCEDURE', label: 'Procedure' },
  { value: 'CHECKUP', label: 'Checkup' }
];

export const APPOINTMENT_STATUS = [
  { value: 'SCHEDULED', label: 'Scheduled' },
  { value: 'CONFIRMED', label: 'Confirmed' },
  { value: 'CANCELLED', label: 'Cancelled' },
  { value: 'COMPLETED', label: 'Completed' },
  { value: 'NO_SHOW', label: 'No Show' }
];

// EXPORT DEFAULT CLIENT
export default supabase;
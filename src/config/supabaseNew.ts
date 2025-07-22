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

// EXACT DATABASE SCHEMA TYPES - MATCHING YOUR DATABASE
export interface Hospital {
  id: string;
  name: string;
  address: string;
  phone: string;
  email: string;
  registration_number: string;
  gst_number: string;
  created_at: string;
}

export interface User {
  id: string;
  auth_id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  phone: string;
  specialization: string;
  consultation_fee: number;
  department: string;
  hospital_id: string;
  is_active: boolean;
  created_at: string;
}

export interface Patient {
  id: string;
  patient_id: string;
  first_name: string;
  last_name: string;
  date_of_birth: string;
  gender: string;
  phone: string;
  email: string;
  address: string;
  emergency_contact_name: string;
  emergency_contact_phone: string;
  blood_group: string;
  medical_history: string;
  allergies: string;
  hospital_id: string;
  created_at: string;
}

export interface PatientTransaction {
  id: string;
  patient_id: string;
  transaction_type: string;
  description: string;
  amount: number;
  payment_mode: string;
  doctor_id: string;
  department: string;
  status: string;
  transaction_reference: string;
  created_at: string;
}

export interface PatientAdmission {
  id: string;
  patient_id: string;
  bed_number: string;
  room_type: string;
  department: string;
  daily_rate: number;
  admission_date: string;
  expected_discharge_date: string;
  actual_discharge_date: string;
  status: string;
  admission_notes: string;
  discharge_notes: string;
  total_amount: number;
  created_at: string;
}

export interface DailyExpense {
  id: string;
  expense_category: string;
  description: string;
  amount: number;
  payment_mode: string;
  expense_date: string;
  approved_by: string;
  status: string;
  receipt_number: string;
  hospital_id: string;
  created_at: string;
}

export interface Department {
  id: string;
  name: string;
  description: string;
  head_doctor_id: string;
  hospital_id: string;
  created_at: string;
}

export interface Bed {
  id: string;
  bed_number: string;
  room_type: string;
  department: string;
  status: string;
  daily_rate: number;
  hospital_id: string;
  created_at: string;
}

export interface FutureAppointment {
  id: string;
  patient_id: string;
  doctor_id: string;
  appointment_date: string;
  appointment_time: string;
  duration_minutes: number;
  appointment_type: string;
  reason: string;
  status: string;
  estimated_cost: number;
  notes: string;
  created_at: string;
}

// Extended types with relations
export interface PatientWithRelations extends Patient {
  transactions?: PatientTransaction[];
  admissions?: PatientAdmission[];
  appointments?: FutureAppointment[];
  totalSpent?: number;
  visitCount?: number;
  lastVisit?: string;
}

export interface DashboardStats {
  totalPatients: number;
  totalDoctors: number;
  totalBeds: number;
  occupiedBeds: number;
  todayRevenue: number;
  monthlyRevenue: number;
  todayAppointments: number;
  pendingAdmissions: number;
  patientGrowthRate: number;
  revenueGrowthRate: number;
}

// Form data types
export interface CreatePatientData {
  first_name: string;
  last_name?: string;
  phone?: string;
  email?: string;
  date_of_birth?: string;
  gender?: string;
  address?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  blood_group?: string;
  medical_history?: string;
  allergies?: string;
  hospital_id: string;
}

export interface CreateTransactionData {
  patient_id: string;
  transaction_type: string;
  description: string;
  amount: number;
  payment_mode: string;
  doctor_id?: string;
  department?: string;
  status?: string;
  transaction_reference?: string;
}

export interface CreateAppointmentData {
  patient_id: string;
  doctor_id: string;
  appointment_date: string;
  appointment_time: string;
  duration_minutes?: number;
  appointment_type?: string;
  reason?: string;
  status?: string;
  estimated_cost?: number;
  notes?: string;
}

// Constants
export const HOSPITAL_ID = '550e8400-e29b-41d4-a716-446655440000'; // Default hospital ID

export const TRANSACTION_TYPES = [
  'CONSULTATION',
  'ADMISSION',
  'PHARMACY',
  'LABORATORY',
  'IMAGING',
  'PROCEDURE',
  'EMERGENCY',
  'DISCHARGE',
  'REFUND'
] as const;

export const PAYMENT_MODES = [
  'CASH',
  'CARD',
  'UPI',
  'BANK_TRANSFER',
  'INSURANCE',
  'CREDIT'
] as const;

export const APPOINTMENT_TYPES = [
  'CONSULTATION',
  'FOLLOW_UP',
  'EMERGENCY',
  'PROCEDURE',
  'SURGERY'
] as const;

export const APPOINTMENT_STATUS = [
  'SCHEDULED',
  'CONFIRMED',
  'IN_PROGRESS',
  'COMPLETED',
  'CANCELLED',
  'NO_SHOW'
] as const;

// Export configured client as default
export default supabase;
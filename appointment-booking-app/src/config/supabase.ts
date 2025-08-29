import { createClient } from '@supabase/supabase-js';

// Shared Supabase configuration with main Hospital CRM
const supabaseUrl = 'https://hgwomxpzaeeqgxsnhceq.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhnd29teHB6YWVlcWd4c25oY2VxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUxMDEwNDEsImV4cCI6MjA3MDY3NzA0MX0.Eeucjix4oV-mGVcIuOXgfFGGVXjsXZj2-oA8ify2O0g';

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase environment variables');
  throw new Error('Missing Supabase environment variables');
}

console.log('✅ Appointment Booking App - Supabase config loaded:', { 
  url: supabaseUrl, 
  hasKey: !!supabaseAnonKey,
  keyLength: supabaseAnonKey?.length,
  keyStart: supabaseAnonKey?.substring(0, 20) + '...',
  app: 'APPOINTMENT_BOOKING'
});

// Create Supabase client with minimal, working config
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
});

// Test connection for appointment booking app
if (typeof window !== 'undefined') {
  supabase.from('patients').select('count', { count: 'exact', head: true })
    .then(({ error, count }) => {
      if (error) {
        console.error('🚨 Appointment Booking App - Supabase connection test failed:', error);
      } else {
        console.log('✅ Appointment Booking App - Supabase connection test successful, patient count:', count);
      }
    });
}

// Shared types with main CRM
export interface Patient {
  id: string;
  patient_id: string;
  first_name: string;
  last_name: string;
  age: string | null;
  gender: 'MALE' | 'FEMALE' | 'OTHER';
  phone: string;
  email?: string;
  address: string;
  date_of_entry?: string;
  assigned_doctor?: string;
  assigned_department?: string;
  hospital_id: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface User {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  role: 'ADMIN' | 'DOCTOR' | 'NURSE' | 'STAFF' | 'ROM' | 'APPOINTMENT_STAFF';
  department?: string;
  specialization?: string;
  consultation_fee?: number;
  hospital_id: string;
  is_active: boolean;
}

export interface Department {
  id: string;
  name: string;
  description?: string;
  head_doctor_id?: string;
  hospital_id: string;
  is_active: boolean;
}

export interface Appointment {
  id: string;
  patient_id: string;
  doctor_id: string;
  department_id: string;
  appointment_date: string;
  appointment_time: string;
  appointment_type: 'CONSULTATION' | 'FOLLOW_UP' | 'EMERGENCY' | 'PROCEDURE' | 'CHECKUP';
  status: 'SCHEDULED' | 'CONFIRMED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW';
  reason: string;
  estimated_duration?: number;
  estimated_cost?: number;
  notes?: string;
  booking_source?: 'MAIN_CRM' | 'BOOKING_APP';
  booked_by?: string;
  hospital_id: string;
  created_at: string;
  updated_at: string;
}

export interface CreateAppointmentData {
  patient_id: string;
  doctor_id: string;
  department_id: string;
  appointment_date: string;
  appointment_time: string;
  appointment_type: 'CONSULTATION' | 'FOLLOW_UP' | 'EMERGENCY' | 'PROCEDURE' | 'CHECKUP';
  reason: string;
  estimated_duration?: number;
  estimated_cost?: number;
  notes?: string;
  booking_source?: 'MAIN_CRM' | 'BOOKING_APP';
  booked_by?: string;
}

// Hospital ID - same as main CRM
export const HOSPITAL_ID = '550e8400-e29b-41d4-a716-446655440000';

export default supabase;
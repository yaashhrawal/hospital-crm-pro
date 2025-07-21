// Supabase Types for Hospital CRM

export interface SupabaseUser {
  id: string;
  email: string;
  user_metadata?: {
    first_name?: string;
    last_name?: string;
    role?: string;
  };
  created_at: string;
}

export interface DatabaseTables {
  users: {
    id: string;
    email: string;
    first_name: string;
    last_name: string;
    role: 'ADMIN' | 'DOCTOR' | 'NURSE' | 'STAFF';
    is_active: boolean;
    created_at: string;
    updated_at: string;
  };
  
  patients: {
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
    created_by?: string;
  };
  
  patient_transactions: {
    id: string;
    patient_id: string;
    transaction_type: 'entry_fee' | 'consultation' | 'service' | 'admission' | 'medicine' | 'discount' | 'refund';
    amount: number;
    payment_mode: 'cash' | 'online' | 'card' | 'upi' | 'insurance' | 'adjustment';
    doctor_id?: string;
    department: string;
    description: string;
    created_at: string;
  };
  
  daily_expenses: {
    id: string;
    expense_category: string;
    description: string;
    amount: number;
    payment_mode: 'cash' | 'online' | 'card' | 'upi';
    date: string;
    approved_by: string;
    created_at: string;
  };
  
  doctors: {
    id: string;
    name: string;
    department: string;
    specialization: string;
    fee: number;
    is_active: boolean;
    created_at: string;
    updated_at: string;
  };
  
  departments: {
    id: string;
    name: string;
    description?: string;
    is_active: boolean;
    created_at: string;
    updated_at: string;
  };
}

// Database Functions Return Types
export interface DashboardStatsResult {
  total_patients: number;
  total_income: number;
  total_expenses: number;
  net_revenue: number;
  active_admissions: number;
  cash_payments: number;
  digital_payments: number;
  discounts_given: number;
  refunds_processed: number;
}
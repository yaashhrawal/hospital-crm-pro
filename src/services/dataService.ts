// Data Service - Adapter for Supabase with LocalStorage fallback
import { supabase } from '../config/supabase';
import { HOSPITAL_ID } from '../config/supabaseNew';
import localStorageService from './localStorageService';
import supabaseAuthService from './supabaseAuthService';
import type { Patient, Doctor, Department, PatientTransaction, PatientAdmission, DailyExpense } from './localStorageService';
import type { User, ApiResponse } from '../types/index';

class DataService {
  private useLocalFallback: boolean = false;
  
  constructor() {
    // Force Supabase mode - no LocalStorage fallback
    this.useLocalFallback = false;
    console.log('✅ DataService initialized in Supabase mode');
    console.log('Environment:', {
      SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL ? 'CONFIGURED' : 'MISSING',
      SUPABASE_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY ? 'CONFIGURED' : 'MISSING',
      LOCAL_FALLBACK: import.meta.env.VITE_ENABLE_LOCAL_STORAGE_FALLBACK
    });
  }

  // Test Supabase connection
  async testSupabaseConnection(): Promise<boolean> {
    try {
      const { error } = await supabase.from('users').select('count').limit(1);
      return !error;
    } catch {
      return false;
    }
  }

  // Automatically switch to local storage if Supabase fails
  private async withFallback<T>(
    supabaseOperation: () => Promise<T>,
    localStorageOperation: () => Promise<T>
  ): Promise<T> {
    if (this.useLocalFallback) {
      return localStorageOperation();
    }

    try {
      return await supabaseOperation();
    } catch (error) {
      console.warn('📡 Supabase operation failed, falling back to localStorage:', error);
      this.useLocalFallback = true;
      localStorageService.initializeDefaultData();
      return localStorageOperation();
    }
  }

  // Authentication Methods - Supabase Direct
  async login(email: string, password: string): Promise<User | null> {
    console.log('🔐 Attempting Supabase login for:', email);
    try {
      const { user, error } = await supabaseAuthService.signIn(email, password);
      if (error) {
        console.error('❌ Supabase login error:', error);
        throw error;
      }
      
      if (user) {
        console.log('✅ Supabase login successful:', user.email);
        return {
          id: user.id || '',
          email: user.email || email,
          password: '',
          first_name: user.first_name || '',
          last_name: user.last_name || '',
          role: (user.role as 'admin' | 'frontdesk' | 'doctor' | 'nurse' | 'accountant' | 'staff') || 'frontdesk',
          is_active: user.is_active ?? true,
          created_at: new Date().toISOString()
        } as User;
      }
      
      return null;
    } catch (error) {
      console.error('🚨 Authentication failed:', error);
      throw error;
    }
  }

  async getCurrentUser(): Promise<User | null> {
    console.log('🔍 Getting current Supabase user...');
    try {
      const user = await supabaseAuthService.getCurrentUser();
      if (user) {
        console.log('✅ Current user found:', user.email);
        return {
          id: user.id,
          email: user.email,
          password: '',
          first_name: user.first_name,
          last_name: user.last_name,
          role: (user.role as 'admin' | 'frontdesk' | 'doctor' | 'nurse' | 'accountant' | 'staff'),
          is_active: user.is_active,
          created_at: new Date().toISOString()
        } as User;
      }
      console.log('⚠️ No current user found');
      return null;
    } catch (error) {
      console.error('❌ Error getting current user:', error);
      return null;
    }
  }

  async logout(): Promise<void> {
    console.log('📡 Logging out via Supabase Auth Service');
    try {
      const { error } = await supabaseAuthService.signOut();
      if (error) {
        console.error('❌ Supabase logout error:', error);
        throw error;
      }
      console.log('✅ Logout successful');
    } catch (error) {
      console.error('🚨 Logout failed:', error);
      throw error;
    }
  }

  // Patient Management - Direct Supabase Integration
  async createPatient(patientData: Omit<Patient, 'id' | 'patient_id' | 'created_at' | 'updated_at' | 'created_by'>): Promise<Patient> {
    console.log('📡 Creating patient directly in Supabase:', patientData);
    try {
      const { data, error } = await supabase
        .from('patients')
        .insert([patientData])
        .select()
        .single();
      if (error) {
        console.error('❌ Supabase patient creation error:', error);
        throw error;
      }
      console.log('✅ Patient created successfully in Supabase:', data);
      return data;
    } catch (error) {
      console.error('🚨 Patient creation failed:', error);
      throw error;
    }
  }

  async getPatients(): Promise<Patient[]> {
    console.log('📡 Fetching patients directly from Supabase');
    try {
      const { data, error } = await supabase
        .from('patients')
        .select('*')
        .eq('is_active', true)
        .eq('hospital_id', HOSPITAL_ID)
        .order('created_at', { ascending: false });
      if (error) {
        console.error('❌ Supabase patients fetch error:', error);
        throw error;
      }
      console.log('✅ Patients fetched successfully from Supabase:', data?.length || 0, 'records');
      return data || [];
    } catch (error) {
      console.error('🚨 Patients fetch failed:', error);
      throw error;
    }
  }

  async getPatientById(id: string): Promise<Patient | null> {
    console.log('📡 Fetching patient by ID directly from Supabase:', id);
    try {
      const { data, error } = await supabase
        .from('patients')
        .select('*')
        .eq('id', id)
        .single();
      if (error) {
        console.error('❌ Supabase patient fetch error:', error);
        throw error;
      }
      console.log('✅ Patient fetched successfully from Supabase:', data);
      return data;
    } catch (error) {
      console.error('🚨 Patient fetch failed:', error);
      throw error;
    }
  }

  // Doctor Management - Direct Supabase Integration
  async getDoctors(): Promise<Doctor[]> {
    console.log('📡 getDoctors() called - returning hardcoded doctors with Dr. Poonam Jain');
    
    // Skip complex database queries and return hardcoded doctors directly
    const hardcodedDoctors = this.getHardcodedDoctors();
    console.log('✅ Returning hardcoded doctors:', hardcodedDoctors);
    return hardcodedDoctors;
  }

  private getHardcodedDoctors(): Doctor[] {
    return [
      {
        id: 'hemant-khajja',
        name: 'DR. HEMANT KHAJJA',
        department: 'ORTHOPAEDIC',
        specialization: 'Orthopaedic Surgeon',
        fee: 800,
        is_active: true
      },
      {
        id: 'lalita-suwalka',
        name: 'DR. LALITA SUWALKA', 
        department: 'DIETICIAN',
        specialization: 'Clinical Dietician',
        fee: 500,
        is_active: true
      },
      {
        id: 'poonam-jain-physiotherapy',
        name: 'DR. POONAM JAIN',
        department: 'PHYSIOTHERAPY', 
        specialization: 'Physiotherapist',
        fee: 600,
        is_active: true
      }
    ];
  }

  async getDoctorsByDepartment(department: string): Promise<Doctor[]> {
    console.log('📡 Fetching doctors by department directly from Supabase:', department);
    try {
      const { data, error } = await supabase
        .from('doctors')
        .select('*')
        .eq('department', department)
        .eq('is_active', true)
        .order('name');
      if (error) {
        console.error('❌ Supabase doctors by department fetch error:', error);
        throw error;
      }
      console.log('✅ Doctors by department fetched successfully from Supabase:', data?.length || 0, 'records');
      return data || [];
    } catch (error) {
      console.error('🚨 Doctors by department fetch failed:', error);
      throw error;
    }
  }

  // Department Management - Direct Supabase Integration
  async getDepartments(): Promise<Department[]> {
    console.log('📡 getDepartments() called - returning hardcoded departments with PHYSIOTHERAPY');
    
    // Skip complex database queries and return hardcoded departments directly
    const hardcodedDepartments = this.getHardcodedDepartments();
    console.log('✅ Returning hardcoded departments:', hardcodedDepartments);
    return hardcodedDepartments;
  }

  private getHardcodedDepartments(): Department[] {
    return [
      {
        id: 'orthopaedic-dept',
        name: 'ORTHOPAEDIC',
        description: 'Orthopaedic Surgery and Bone Care',
        is_active: true
      },
      {
        id: 'dietician-dept', 
        name: 'DIETICIAN',
        description: 'Nutrition and Diet Planning',
        is_active: true
      },
      {
        id: 'physiotherapy-dept',
        name: 'PHYSIOTHERAPY',
        description: 'Physiotherapy and Rehabilitation', 
        is_active: true
      }
    ];
  }

  // Transaction Management - Direct Supabase Integration
  async createTransaction(transactionData: Omit<PatientTransaction, 'id'>): Promise<PatientTransaction> {
    console.log('📡 Creating transaction directly in Supabase:', transactionData);
    try {
      // Prepare data for insertion
      const dataToInsert = { ...transactionData };
      
      // If transaction_date is not provided but created_at is, use created_at as transaction_date
      if (!dataToInsert.transaction_date && dataToInsert.created_at) {
        dataToInsert.transaction_date = dataToInsert.created_at;
      }
      
      // Remove created_at to let database auto-generate it
      if (dataToInsert.created_at) {
        delete dataToInsert.created_at;
      }
      
      console.log('📊 Transaction data to insert:', dataToInsert);
      
      const { data, error } = await supabase
        .from('patient_transactions')
        .insert([dataToInsert])
        .select()
        .single();
      if (error) {
        console.error('❌ Supabase transaction creation error:', error);
        throw error;
      }
      console.log('✅ Transaction created successfully in Supabase:', data);
      return data;
    } catch (error) {
      console.error('🚨 Transaction creation failed:', error);
      throw error;
    }
  }

  async getTransactionsByPatient(patientId: string): Promise<PatientTransaction[]> {
    console.log('📡 Fetching transactions by patient directly from Supabase:', patientId);
    try {
      const { data, error } = await supabase
        .from('patient_transactions')
        .select('*')
        .eq('patient_id', patientId)
        .order('created_at', { ascending: false });
      if (error) {
        console.error('❌ Supabase transactions fetch error:', error);
        throw error;
      }
      console.log('✅ Transactions fetched successfully from Supabase:', data?.length || 0, 'records');
      return data || [];
    } catch (error) {
      console.error('🚨 Transactions fetch failed:', error);
      throw error;
    }
  }

  async getPatientVisits(patientId: string): Promise<any[]> {
    console.log('📡 Fetching patient visits from Supabase:', patientId);
    try {
      const { data, error } = await supabase
        .from('patient_visits')
        .select('*')
        .eq('patient_id', patientId)
        .order('visit_date', { ascending: false });
      if (error) {
        console.error('❌ Supabase patient visits fetch error:', error);
        throw error;
      }
      console.log('✅ Patient visits fetched successfully from Supabase:', data?.length || 0, 'records');
      return data || [];
    } catch (error) {
      console.error('🚨 Patient visits fetch failed:', error);
      throw error;
    }
  }

  async getTransactionsByDate(date: string): Promise<PatientTransaction[]> {
    console.log('📡 Fetching transactions by date directly from Supabase:', date);
    console.log('🕐 Current system date/time:', {
      now: new Date().toISOString(),
      localDate: new Date().toLocaleDateString(),
      requestedDate: date
    });
    
    try {
      // Create date range for the entire day
      const startOfDay = `${date} 00:00:00`;
      const endOfDay = `${date} 23:59:59`;
      
      console.log('📅 Fetching transactions for date range:', { 
        requestedDate: date,
        startOfDay, 
        endOfDay 
      });
      
      // Get all transactions with patient data - using more explicit join
      const { data: allTransactions, error } = await supabase
        .from('patient_transactions')
        .select(`
          *,
          patients!inner(
            id,
            assigned_department,
            assigned_doctor,
            first_name,
            last_name
          )
        `)
        .order('transaction_date', { ascending: true, nullsFirst: false })
        .order('created_at', { ascending: true });
      
      if (error) {
        console.error('❌ Supabase transactions fetch error:', error);
        throw error;
      }
      
      // Then filter in JavaScript for the specific date AND exclude ORTHO/DR HEMANT
      console.log('🔍 Filtering transactions. Sample of first 3 transactions:', 
        allTransactions?.slice(0, 3).map(t => ({
          id: t.id,
          transaction_date: t.transaction_date,
          created_at: t.created_at,
          amount: t.amount,
          patient_id: t.patient_id,
          patient_dept: t.patients?.assigned_department,
          patient_doctor: t.patients?.assigned_doctor,
          patient_name: `${t.patients?.first_name} ${t.patients?.last_name}`
        }))
      );
      
      const data = allTransactions?.filter((t, index) => {
        // First check date
        let dateMatches = false;
        if (t.transaction_date) {
          const txnDate = t.transaction_date.split('T')[0] || t.transaction_date.split(' ')[0];
          dateMatches = txnDate === date;
          if (index < 5) { // Log first 5 for debugging
            console.log(`Transaction ${index}: transaction_date=${t.transaction_date}, extracted=${txnDate}, requested=${date}, matches=${dateMatches}`);
          }
        } else if (t.created_at) {
          const createdDate = t.created_at.split('T')[0];
          dateMatches = createdDate === date;
          if (index < 5) { // Log first 5 for debugging
            console.log(`Transaction ${index}: NO transaction_date, created_at=${t.created_at}, extracted=${createdDate}, requested=${date}, matches=${dateMatches}`);
          }
        }
        
        if (!dateMatches) return false;
        
        // Then check if we should exclude ORTHO/DR HEMANT patients
        const patientDept = t.patients?.assigned_department?.toUpperCase()?.trim() || '';
        const patientDoc = t.patients?.assigned_doctor?.toUpperCase()?.trim() || '';
        
        console.log(`🔍 DataService - Checking transaction ${t.id}: Patient="${t.patients?.first_name} ${t.patients?.last_name}", Dept="${patientDept}", Doc="${patientDoc}"`);
        
        // Exclude if department is ORTHO AND doctor name contains HEMANT (but not KHAJJA)
        if (patientDept === 'ORTHO' && patientDoc.includes('HEMANT') && !patientDoc.includes('KHAJJA')) {
          console.log(`🚫 DataService - Excluding transaction for ORTHO/DR HEMANT patient - Transaction ID: ${t.id}, Patient: "${t.patients?.first_name} ${t.patients?.last_name}", Dept: "${patientDept}", Doc: "${patientDoc}"`);
          return false;
        }
        
        return true;
      });
      
      // Log raw data for debugging
      console.log('📊 Raw transaction data from Supabase:', {
        totalRecords: allTransactions?.length || 0,
        filteredRecords: data?.length || 0,
        requestedDate: date,
        sampleRecord: data?.[0] ? {
          transaction_date: data[0].transaction_date,
          created_at: data[0].created_at,
          amount: data[0].amount,
          transaction_type: data[0].transaction_type
        } : null
      });
      
      console.log('✅ Transactions by date fetched successfully from Supabase:', {
        requestedDate: date,
        totalInDatabase: allTransactions?.length || 0,
        matchingDate: data?.length || 0,
        transactions: data?.map(t => ({
          type: t.transaction_type,
          amount: t.amount,
          patient_id: t.patient_id,
          date: t.transaction_date || t.created_at
        }))
      });
      
      return data || [];
    } catch (error) {
      console.error('🚨 Transactions by date fetch failed:', error);
      throw error;
    }
  }

  // Admission Management - Direct Supabase Integration
  async createAdmission(admissionData: Omit<PatientAdmission, 'id'>): Promise<PatientAdmission> {
    console.log('📡 Creating admission - DISABLED (table removed):', admissionData);
    throw new Error('Patient admissions functionality is temporarily disabled');
  }

  async getActiveAdmissions(): Promise<PatientAdmission[]> {
    console.log('📡 Fetching active admissions - DISABLED (table removed)');
    return []; // Return empty array since patient_admissions table was removed
  }

  // Expense Management - Direct Supabase Integration
  async createExpense(expenseData: Omit<DailyExpense, 'id'>): Promise<DailyExpense> {
    console.log('📡 Creating expense directly in Supabase:', expenseData);
    try {
      const { data, error } = await supabase
        .from('daily_expenses')
        .insert([expenseData])
        .select()
        .single();
      if (error) {
        console.error('❌ Supabase expense creation error:', error);
        throw error;
      }
      console.log('✅ Expense created successfully in Supabase:', data);
      return data;
    } catch (error) {
      console.error('🚨 Expense creation failed:', error);
      throw error;
    }
  }

  async getExpensesByDate(date: string): Promise<DailyExpense[]> {
    console.log('📡 Fetching expenses by date directly from Supabase:', date);
    try {
      // First get all expenses then filter by date to handle different date formats
      const { data: allExpenses, error } = await supabase
        .from('daily_expenses')
        .select('*')
        .eq('hospital_id', HOSPITAL_ID)
        .order('expense_date', { ascending: false });
      
      if (error) {
        console.error('❌ Supabase expenses fetch error:', error);
        throw error;
      }
      
      // Filter expenses for the specific date
      const data = allExpenses?.filter(expense => {
        if (!expense.expense_date) return false;
        
        // Handle both date formats (YYYY-MM-DD and YYYY-MM-DDTHH:MM:SS)
        const expenseDate = expense.expense_date.includes('T') 
          ? expense.expense_date.split('T')[0] 
          : expense.expense_date;
        
        return expenseDate === date;
      }) || [];
      
      console.log('✅ Expenses by date fetched successfully from Supabase:', {
        requestedDate: date,
        totalExpenses: allExpenses?.length || 0,
        filteredExpenses: data.length,
        expenses: data.map(e => ({ id: e.id, amount: e.amount, date: e.expense_date, category: e.expense_category }))
      });
      return data;
    } catch (error) {
      console.error('🚨 Expenses by date fetch failed:', error);
      throw error;
    }
  }

  // Revenue Calculation - Direct Supabase Integration
  async getDailyRevenue(date: string): Promise<{
    totalIncome: number;
    totalExpenses: number;
    netRevenue: number;
    transactionBreakdown: any;
  }> {
    console.log('📡 Calculating daily revenue directly from Supabase for date:', date);
    try {
      // Fetch data directly from Supabase
      // Note: getTransactionsByDate already filters out ORTHO/DR HEMANT transactions
      const transactions = await this.getTransactionsByDate(date);
      const expenses = await this.getExpensesByDate(date);

      // Calculate total income - transactions are already filtered by getTransactionsByDate
      const totalIncome = transactions.reduce((sum, t) => sum + t.amount, 0);
      const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
      const netRevenue = totalIncome - totalExpenses;

      // Build transaction breakdown - transactions are already filtered
      const transactionBreakdown = transactions.reduce((breakdown, t) => {
        breakdown[t.transaction_type] = (breakdown[t.transaction_type] || 0) + t.amount;
        return breakdown;
      }, {} as Record<string, number>);

      const result = {
        totalIncome,
        totalExpenses,
        netRevenue,
        transactionBreakdown,
      };

      console.log('✅ Daily revenue calculated successfully from Supabase:', {
        date,
        totalTransactions: transactions.length,
        totalIncome,
        totalExpenses,
        netRevenue
      });
      return result;
    } catch (error) {
      console.error('🚨 Daily revenue calculation failed:', error);
      throw error;
    }
  }

  // Get service status
  getServiceStatus(): { isOnline: boolean; service: 'Supabase' | 'LocalStorage' } {
    return {
      isOnline: !this.useLocalFallback,
      service: this.useLocalFallback ? 'LocalStorage' : 'Supabase'
    };
  }

  // Data management
  exportData(): string {
    if (this.useLocalFallback) {
      return localStorageService.exportData();
    }
    // For Supabase, we'd need to fetch all tables and export
    throw new Error('Export not implemented for Supabase mode');
  }

  importData(jsonData: string): void {
    if (this.useLocalFallback) {
      localStorageService.importData(jsonData);
    } else {
      throw new Error('Import not implemented for Supabase mode');
    }
  }

  clearAllData(): void {
    if (this.useLocalFallback) {
      localStorageService.clearAllData();
      localStorageService.initializeDefaultData();
    }
  }
}

// Create and export singleton instance
const dataService = new DataService();
export default dataService;

// Export types
export type {
  Patient,
  Doctor, 
  Department,
  PatientTransaction,
  PatientAdmission,
  DailyExpense,
  User
};
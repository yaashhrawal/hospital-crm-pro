import { supabase, HOSPITAL_ID } from '../config/supabaseNew';
import type { 
  Patient, 
  PatientTransaction, 
  FutureAppointment, 
  PatientAdmission,
  DailyExpense,
  User,
  Department,
  Bed,
  CreatePatientData,
  CreateTransactionData,
  CreateAppointmentData,
  PatientWithRelations,
  DashboardStats,
  AppointmentWithRelations
} from '../config/supabaseNew';

export class HospitalService {
  
  // ==================== AUTHENTICATION ====================
  
  static async getCurrentUser(): Promise<User | null> {
    try {
      console.log('🔍 Getting current user from Supabase Auth...');
      
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError) {
        console.error('❌ Auth error:', authError);
        throw authError;
      }
      
      if (!user) {
        console.log('⚠️ No authenticated user');
        return null;
      }
      
      console.log('✅ Auth user found:', user.email);
      
      // Get user profile from users table
      const { data: userProfile, error: profileError } = await supabase
        .from('users')
        .select('*')
        .eq('auth_id', user.id)
        .single();
      
      if (profileError) {
        console.log('ℹ️ No profile found in users table, creating one...');
        
        // If no profile exists, create one automatically
        try {
          return await this.createUserProfile(user);
        } catch (createError: any) {
          console.error('❌ Failed to create profile:', createError);
          
          // If users table doesn't exist or other errors, return a minimal user object
          console.log('🔄 Returning minimal user object for auth user');
          return {
            id: user.id,
            auth_id: user.id,
            email: user.email || '',
            first_name: user.email?.split('@')[0] || 'User',
            last_name: '',
            role: 'STAFF',
            phone: '',
            specialization: '',
            consultation_fee: 0,
            department: 'General',
            hospital_id: HOSPITAL_ID,
            is_active: true,
            created_at: new Date().toISOString()
          } as User;
        }
      }
      
      console.log('✅ User profile found:', userProfile);
      return userProfile as User;
      
    } catch (error: any) {
      console.error('🚨 getCurrentUser error:', error);
      return null;
    }
  }
  
  static async createUserProfile(authUser: any): Promise<User> {
    console.log('👤 Creating user profile for:', authUser.email);
    
    const userData = {
      auth_id: authUser.id,
      email: authUser.email,
      first_name: authUser.user_metadata?.first_name || authUser.email.split('@')[0],
      last_name: authUser.user_metadata?.last_name || '',
      role: 'STAFF', // Default role for all users
      phone: authUser.user_metadata?.phone || '',
      specialization: '',
      consultation_fee: 0,
      department: 'General',
      hospital_id: HOSPITAL_ID,
      is_active: true
    };
    
    // Try to create user profile, but handle duplicate key errors gracefully
    const { data, error } = await supabase
      .from('users')
      .insert([userData])
      .select()
      .single();
    
    if (error) {
      console.error('❌ Failed to create user profile:', error);
      
      // If it's a duplicate key error, try to fetch existing profile
      if (error.code === '23505') { // PostgreSQL unique violation
        console.log('🔄 User profile already exists, fetching existing profile...');
        const { data: existingUser, error: fetchError } = await supabase
          .from('users')
          .select('*')
          .eq('auth_id', authUser.id)
          .single();
        
        if (fetchError) {
          console.error('❌ Failed to fetch existing user profile:', fetchError);
          throw fetchError;
        }
        
        console.log('✅ Found existing user profile:', existingUser);
        return existingUser as User;
      }
      
      throw error;
    }
    
    console.log('✅ User profile created:', data);
    return data as User;
  }
  
  static async signIn(email: string, password: string): Promise<{ user: User | null; error: any }> {
    try {
      console.log('🔐 Signing in with Supabase:', email);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) {
        console.error('❌ Sign in error:', error);
        return { user: null, error };
      }
      
      console.log('✅ Auth successful, getting user profile...');
      const user = await this.getCurrentUser();
      
      return { user, error: null };
      
    } catch (error) {
      console.error('🚨 SignIn exception:', error);
      return { user: null, error };
    }
  }
  
  static async signOut(): Promise<{ error: any }> {
    try {
      const { error } = await supabase.auth.signOut();
      return { error };
    } catch (error) {
      return { error };
    }
  }
  
  // ==================== PATIENT OPERATIONS ====================
  
  static async createPatient(data: CreatePatientData): Promise<Patient> {
    console.log('👤 Creating patient with exact schema:', data);
    
    try {
      // Generate patient ID
      const patientCount = await this.getPatientCount();
      const patientId = `P${String(patientCount + 1).padStart(6, '0')}`;
      
      const patientData = {
        patient_id: patientId,
        first_name: data.first_name,
        last_name: data.last_name || '',
        phone: data.phone || '',
        email: data.email || null,
        date_of_birth: data.date_of_birth || null,
        gender: data.gender || 'MALE',
        address: data.address || '',
        emergency_contact_name: data.emergency_contact_name || '',
        emergency_contact_phone: data.emergency_contact_phone || '',
        blood_group: data.blood_group || null,
        medical_history: data.medical_history || null,
        allergies: data.allergies || null,
        // Doctor and Department information
        doctor: data.doctor || null,
        department: data.department || null,
        // Reference information
        has_reference: data.has_reference || false,
        reference_details: data.reference_details || null,
        // Doctor assignment
        assigned_doctor: data.assigned_doctor || null,
        assigned_department: data.assigned_department || null,
        hospital_id: HOSPITAL_ID
      };
      
      console.log('📤 Inserting patient:', patientData);
      
      const { data: patient, error } = await supabase
        .from('patients')
        .insert([patientData])
        .select()
        .single();
      
      if (error) {
        console.error('❌ Patient creation error:', error);
        throw new Error(`Patient creation failed: ${error.message}`);
      }
      
      console.log('✅ Patient created successfully:', patient);
      return patient as Patient;
      
    } catch (error: any) {
      console.error('🚨 createPatient error:', error);
      throw error;
    }
  }
  
  static async getPatients(limit = 100): Promise<PatientWithRelations[]> {
    try {
      console.log('📋 Fetching patients from new schema...');
      
      const { data: patients, error } = await supabase
        .from('patients')
        .select(`
          *,
          transactions:patient_transactions(*)
        `)
        .eq('hospital_id', HOSPITAL_ID)
        .order('created_at', { ascending: false })
        .limit(limit);
      
      if (error) {
        console.error('❌ Fetch patients error:', error);
        throw error;
      }
      
      console.log(`✅ Fetched ${patients?.length || 0} patients`);
      
      // Enhance patients with calculated fields
      const enhancedPatients = patients?.map(patient => {
        const transactions = patient.transactions || [];
        const totalSpent = transactions.reduce((sum: number, t: any) => sum + (t.amount || 0), 0);
        const visitCount = transactions.length;
        const lastVisit = transactions.length > 0 
          ? transactions.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0].created_at
          : null;
        
        return {
          ...patient,
          totalSpent,
          visitCount,
          lastVisit
        };
      }) || [];
      
      return enhancedPatients as PatientWithRelations[];
      
    } catch (error: any) {
      console.error('🚨 getPatients error:', error);
      throw error;
    }
  }
  
  static async getPatientById(id: string): Promise<PatientWithRelations | null> {
    try {
      const { data: patient, error } = await supabase
        .from('patients')
        .select(`
          *,
          transactions:patient_transactions(*),
          admissions:patient_admissions(*),
          appointments:future_appointments(*)
        `)
        .eq('id', id)
        .single();
      
      if (error) {
        console.error('❌ Get patient by ID error:', error);
        return null;
      }
      
      return patient as PatientWithRelations;
      
    } catch (error: any) {
      console.error('🚨 getPatientById error:', error);
      return null;
    }
  }
  
  private static async getPatientCount(): Promise<number> {
    const { count, error } = await supabase
      .from('patients')
      .select('*', { count: 'exact', head: true })
      .eq('hospital_id', HOSPITAL_ID);
    
    return count || 0;
  }
  
  // ==================== TRANSACTION OPERATIONS ====================
  
  static async createTransaction(data: CreateTransactionData): Promise<PatientTransaction> {
    console.log('💰 Creating transaction:', data);
    
    try {
      const transactionData = {
        patient_id: data.patient_id,
        transaction_type: data.transaction_type,
        description: data.description,
        amount: data.amount,
        payment_mode: data.payment_mode,
        doctor_id: data.doctor_id || null,
        doctor_name: data.doctor_name || null,
        status: data.status || 'COMPLETED',
        transaction_reference: data.transaction_reference || null
      };
      
      const { data: transaction, error } = await supabase
        .from('patient_transactions')
        .insert([transactionData])
        .select()
        .single();
      
      if (error) {
        console.error('❌ Transaction creation error:', error);
        throw new Error(`Transaction creation failed: ${error.message}`);
      }
      
      console.log('✅ Transaction created:', transaction);
      return transaction as PatientTransaction;
      
    } catch (error: any) {
      console.error('🚨 createTransaction error:', error);
      throw error;
    }
  }
  
  static async getTransactionsByPatient(patientId: string): Promise<PatientTransaction[]> {
    try {
      const { data: transactions, error } = await supabase
        .from('patient_transactions')
        .select('*')
        .eq('patient_id', patientId)
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('❌ Get transactions error:', error);
        throw error;
      }
      
      return transactions as PatientTransaction[];
      
    } catch (error: any) {
      console.error('🚨 getTransactionsByPatient error:', error);
      throw error;
    }
  }
  
  // ==================== APPOINTMENT OPERATIONS ====================
  
  static async createAppointment(data: CreateAppointmentData): Promise<FutureAppointment> {
    console.log('📅 Creating appointment:', data);
    
    try {
      const appointmentData = {
        patient_id: data.patient_id,
        doctor_id: data.doctor_id,
        appointment_date: data.appointment_date,
        appointment_time: data.appointment_time,
        duration_minutes: data.duration_minutes || 30,
        appointment_type: data.appointment_type || 'CONSULTATION',
        reason: data.reason || '',
        status: data.status || 'SCHEDULED',
        estimated_cost: data.estimated_cost || 0,
        notes: data.notes || null
      };
      
      const { data: appointment, error } = await supabase
        .from('future_appointments')
        .insert([appointmentData])
        .select()
        .single();
      
      if (error) {
        console.error('❌ Appointment creation error:', error);
        throw new Error(`Appointment creation failed: ${error.message}`);
      }
      
      console.log('✅ Appointment created:', appointment);
      return appointment as FutureAppointment;
      
    } catch (error: any) {
      console.error('🚨 createAppointment error:', error);
      throw error;
    }
  }
  
  static async getAppointments(limit = 100): Promise<AppointmentWithRelations[]> {
    try {
      console.log('📅 Fetching appointments from database...');
      
      // First try with relationships
      const { data: appointments, error } = await supabase
        .from('future_appointments')
        .select(`
          *,
          patient:patients(id, patient_id, first_name, last_name, phone),
          doctor:users(id, first_name, last_name, email)
        `)
        .order('appointment_date', { ascending: true })
        .order('appointment_time', { ascending: true })
        .limit(limit);
      
      if (error) {
        console.error('❌ Get appointments with relations error:', error);
        
        // If relationships fail, try simple query
        console.log('🔄 Trying simple query without relationships...');
        const { data: simpleAppointments, error: simpleError } = await supabase
          .from('future_appointments')
          .select('*')
          .order('appointment_date', { ascending: true })
          .limit(limit);
        
        if (simpleError) {
          console.error('❌ Simple appointments query also failed:', simpleError);
          throw simpleError;
        }
        
        console.log('✅ Got appointments without relationships:', simpleAppointments);
        return (simpleAppointments || []) as AppointmentWithRelations[];
      }
      
      console.log('✅ Successfully loaded appointments with relationships:', appointments);
      return (appointments || []) as AppointmentWithRelations[];
      
    } catch (error: any) {
      console.error('🚨 getAppointments error:', error);
      throw error;
    }
  }
  
  // ==================== DASHBOARD OPERATIONS ====================
  
  static async getDashboardStats(): Promise<DashboardStats> {
    try {
      console.log('📊 Getting dashboard stats...');
      
      const today = new Date().toISOString().split('T')[0];
      const todayStart = `${today}T00:00:00.000Z`;
      const todayEnd = `${today}T23:59:59.999Z`;
      
      // Get counts in parallel
      const [
        patientsResult,
        doctorsResult,
        bedsResult,
        todayAppointmentsResult,
        todayRevenueResult
      ] = await Promise.all([
        supabase.from('patients').select('*', { count: 'exact', head: true }).eq('hospital_id', HOSPITAL_ID),
        supabase.from('users').select('*', { count: 'exact', head: true }).eq('hospital_id', HOSPITAL_ID).neq('role', 'ADMIN'),
        supabase.from('beds').select('*', { count: 'exact', head: true }).eq('hospital_id', HOSPITAL_ID),
        supabase.from('future_appointments').select('*', { count: 'exact', head: true }).eq('appointment_date', today),
        supabase.from('patient_transactions').select('amount').gte('created_at', todayStart).lt('created_at', todayEnd)
      ]);
      
      const totalPatients = patientsResult.count || 0;
      const totalDoctors = doctorsResult.count || 0;
      const totalBeds = bedsResult.count || 0;
      const todayAppointments = todayAppointmentsResult.count || 0;
      
      // Calculate today's revenue (positive amounts only, exclude refunds/discounts)
      const todayRevenue = todayRevenueResult.data?.reduce((sum, t) => {
        const amount = t.amount || 0;
        return sum + (amount > 0 ? amount : 0); // Only count positive amounts as revenue
      }, 0) || 0;
      
      console.log('💰 Today\'s revenue calculation:', {
        todayStart,
        todayEnd,
        transactionCount: todayRevenueResult.data?.length || 0,
        todayRevenue
      });
      
      // Calculate monthly revenue
      const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];
      const monthlyStart = `${startOfMonth}T00:00:00.000Z`;
      const { data: monthlyTransactions } = await supabase
        .from('patient_transactions')
        .select('amount')
        .gte('created_at', monthlyStart);
      
      const monthlyRevenue = monthlyTransactions?.reduce((sum, t) => {
        const amount = t.amount || 0;
        return sum + (amount > 0 ? amount : 0); // Only count positive amounts as revenue
      }, 0) || 0;
      
      return {
        totalPatients,
        totalDoctors,
        totalBeds,
        occupiedBeds: 0, // TODO: Calculate from admissions
        todayRevenue,
        monthlyRevenue,
        todayAppointments,
        pendingAdmissions: 0, // TODO: Calculate from admissions
        patientGrowthRate: 0, // TODO: Calculate growth rate
        revenueGrowthRate: 0 // TODO: Calculate growth rate
      };
      
    } catch (error: any) {
      console.error('🚨 getDashboardStats error:', error);
      throw error;
    }
  }
  
  // ==================== UTILITY OPERATIONS ====================
  
  static async testConnection(): Promise<{ success: boolean; message: string; user?: User | null }> {
    try {
      console.log('🧪 Testing Supabase connection...');
      
      // Test basic connectivity
      const { data, error } = await supabase
        .from('patients')
        .select('count')
        .limit(1);
      
      if (error) {
        return {
          success: false,
          message: `Database connection failed: ${error.message}`
        };
      }
      
      // Test authentication
      const user = await this.getCurrentUser();
      
      return {
        success: true,
        message: user ? `Connected successfully as ${user.email}` : 'Connected successfully (not authenticated)',
        user
      };
      
    } catch (error: any) {
      return {
        success: false,
        message: `Connection test failed: ${error.message}`
      };
    }
  }
  
  static getServiceStatus(): { isOnline: boolean; service: string } {
    return {
      isOnline: true,
      service: 'Supabase'
    };
  }
  
  // ==================== DISCHARGE MANAGEMENT OPERATIONS ====================
  
  static async getPatientTransactionsByAdmission(patientId: string) {
    try {
      console.log('📊 Loading patient transactions for discharge billing...');
      
      const { data, error } = await supabase
        .from('patient_transactions')
        .select('*')
        .eq('patient_id', patientId)
        .eq('status', 'COMPLETED')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      console.log(`✅ Loaded ${data?.length || 0} completed transactions`);
      return data || [];
      
    } catch (error: any) {
      console.error('❌ Error loading patient transactions:', error);
      throw error;
    }
  }
  
  static async createDischargeSummary(summaryData: any) {
    try {
      console.log('📝 Creating discharge summary...');
      
      const { data, error } = await supabase
        .from('discharge_summaries')
        .insert(summaryData)
        .select()
        .single();
      
      if (error) throw error;
      
      console.log('✅ Discharge summary created successfully');
      return data;
      
    } catch (error: any) {
      console.error('❌ Error creating discharge summary:', error);
      throw error;
    }
  }
  
  static async createDischargeBill(billData: any) {
    try {
      console.log('💰 Creating discharge bill...');
      
      const { data, error } = await supabase
        .from('discharge_bills')
        .insert(billData)
        .select()
        .single();
      
      if (error) throw error;
      
      console.log('✅ Discharge bill created successfully');
      return data;
      
    } catch (error: any) {
      console.error('❌ Error creating discharge bill:', error);
      throw error;
    }
  }
  
  static async getDischargeHistory(patientId: string) {
    try {
      console.log('📋 Loading discharge history...');
      
      const { data, error } = await supabase
        .from('discharge_summaries')
        .select(`
          *,
          admission:patient_admissions(*),
          bill:discharge_bills(*),
          created_by_user:users(id, email, first_name, last_name)
        `)
        .eq('patient_id', patientId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      console.log(`✅ Loaded ${data?.length || 0} discharge records`);
      return data || [];
      
    } catch (error: any) {
      console.error('❌ Error loading discharge history:', error);
      throw error;
    }
  }
  
  static async getDischargeSummaryWithBill(admissionId: string) {
    try {
      console.log('📄 Loading complete discharge record...');
      
      const { data, error } = await supabase
        .from('discharge_summaries')
        .select(`
          *,
          bill:discharge_bills(*),
          admission:patient_admissions(*),
          patient:patients(*),
          created_by_user:users(id, email, first_name, last_name)
        `)
        .eq('admission_id', admissionId)
        .single();
      
      if (error) throw error;
      
      console.log('✅ Complete discharge record loaded');
      return data;
      
    } catch (error: any) {
      console.error('❌ Error loading discharge record:', error);
      throw error;
    }
  }
}

export default HospitalService;
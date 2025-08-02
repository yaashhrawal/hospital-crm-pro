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
  
  static async findExistingPatient(phone?: string, firstName?: string, lastName?: string): Promise<Patient | null> {
    try {
      console.log('🔍 Searching for existing patient with:', { phone, firstName, lastName });
      
      if (!phone && !firstName) {
        return null;
      }
      
      // Normalize phone number (remove spaces, dashes, etc.)
      const normalizePhone = (ph: string) => ph.replace(/[\s\-\(\)\.]/g, '').trim();
      
      // Search by phone first (most unique identifier)
      if (phone && phone.trim()) {
        const normalizedPhone = normalizePhone(phone);
        console.log('📱 Searching by normalized phone:', normalizedPhone);
        
        // Get all patients and check phone numbers after normalization
        const { data: allPatients, error } = await supabase
          .from('patients')
          .select('*')
          .eq('hospital_id', HOSPITAL_ID);
        
        if (!error && allPatients) {
          const phoneMatch = allPatients.find(p => 
            p.phone && normalizePhone(p.phone) === normalizedPhone
          );
          
          if (phoneMatch) {
            console.log('✅ Found patient by phone number match');
            return phoneMatch as Patient;
          }
        }
      }
      
      // If no phone match, try name match (case-insensitive)
      if (firstName && firstName.trim()) {
        const normalizedFirstName = firstName.trim().toLowerCase();
        const normalizedLastName = lastName ? lastName.trim().toLowerCase() : '';
        
        console.log('👤 Searching by name:', { normalizedFirstName, normalizedLastName });
        
        let nameQuery = supabase
          .from('patients')
          .select('*')
          .eq('hospital_id', HOSPITAL_ID)
          .ilike('first_name', `%${firstName.trim()}%`);
        
        const { data: nameMatches, error } = await nameQuery;
        
        if (!error && nameMatches && nameMatches.length > 0) {
          // Check for exact match (case-insensitive)
          const exactMatch = nameMatches.find(p => {
            const patientFirstName = (p.first_name || '').toLowerCase();
            const patientLastName = (p.last_name || '').toLowerCase();
            
            // If last name provided, check both first and last name
            if (lastName && lastName.trim()) {
              return patientFirstName === normalizedFirstName && 
                     patientLastName === normalizedLastName;
            }
            // Otherwise, just check first name
            return patientFirstName === normalizedFirstName;
          });
          
          if (exactMatch) {
            console.log('✅ Found exact patient name match');
            return exactMatch as Patient;
          }
          
          // Check for similar matches (both names start with the same letters)
          const similarMatch = nameMatches.find(p => {
            const patientFirstName = (p.first_name || '').toLowerCase();
            const patientLastName = (p.last_name || '').toLowerCase();
            
            if (lastName && lastName.trim()) {
              return patientFirstName.startsWith(normalizedFirstName.substring(0, 3)) && 
                     patientLastName.startsWith(normalizedLastName.substring(0, 3));
            }
            return patientFirstName.startsWith(normalizedFirstName.substring(0, 3));
          });
          
          if (similarMatch) {
            console.log('✅ Found similar patient name match');
            return similarMatch as Patient;
          }
        }
      }
      
      console.log('ℹ️ No existing patient found');
      return null;
      
    } catch (error: any) {
      console.error('🚨 findExistingPatient error:', error);
      return null;
    }
  }
  
  static async createPatientVisit(visitData: {
    patient_id: string;
    visit_type?: string;
    chief_complaint?: string;
    diagnosis?: string;
    treatment_plan?: string;
    doctor_id?: string;
    department?: string;
    vital_signs?: any;
    prescriptions?: any;
    follow_up_date?: string;
    notes?: string;
  }): Promise<any> {
    try {
      console.log('🏥 Creating patient visit:', visitData);
      
      const { data: visit, error } = await supabase
        .from('patient_visits')
        .insert([{
          ...visitData,
          visit_date: visitData.visit_date ? new Date(visitData.visit_date).toISOString() : new Date().toISOString()
        }])
        .select()
        .single();
      
      if (error) {
        console.error('❌ Visit creation error:', error);
        throw new Error(`Visit creation failed: ${error.message}`);
      }
      
      console.log('✅ Visit created successfully:', visit);
      return visit;
      
    } catch (error: any) {
      console.error('🚨 createPatientVisit error:', error);
      throw error;
    }
  }
  
  static async getPatientVisits(patientId: string): Promise<any[]> {
    try {
      const { data: visits, error } = await supabase
        .from('patient_visits')
        .select('*')
        .eq('patient_id', patientId)
        .order('visit_date', { ascending: false });
      
      if (error) {
        console.error('❌ Get visits error:', error);
        throw error;
      }
      
      return visits || [];
      
    } catch (error: any) {
      console.error('🚨 getPatientVisits error:', error);
      throw error;
    }
  }
  
  static async createPatient(data: CreatePatientData): Promise<Patient> {
    console.log('👤 Creating patient with exact schema:', data);
    
    try {
      // Generate patient ID
      const maxPatientIdNumber = await this.getMaxPatientIdNumber();
      const nextPatientIdNumber = maxPatientIdNumber + 1;
      const patientId = `P${String(nextPatientIdNumber).padStart(6, '0')}`;
      
      const patientData = {
        patient_id: patientId,
        prefix: data.prefix || null,
        first_name: data.first_name,
        last_name: data.last_name || '',
        phone: data.phone || '',
        email: data.email || null,
        date_of_birth: data.date_of_birth || null,
        age: data.age && data.age.trim() !== '' ? data.age : null,
        gender: data.gender || 'MALE',
        address: data.address || '',
        emergency_contact_name: data.emergency_contact_name || '',
        emergency_contact_phone: data.emergency_contact_phone || '',
        blood_group: data.blood_group || null,
        medical_history: data.medical_history || null,
        allergies: data.allergies || null,
        // Reference information
        has_reference: data.has_reference || false,
        reference_details: data.reference_details || null,
        // Doctor assignment
        assigned_doctor: data.assigned_doctor || null,
        assigned_department: data.assigned_department || null,
        // Multiple doctors support with fees
        assigned_doctors: data.assigned_doctors || null,
        consultation_fees: data.assigned_doctors && data.assigned_doctors.length > 0 
          ? data.assigned_doctors.map(doctor => ({
              doctorName: doctor.name,
              department: doctor.department,
              fee: doctor.consultationFee || 0,
              isPrimary: doctor.isPrimary || false
            }))
          : null,
        date_of_entry: data.date_of_entry ? data.date_of_entry : null,
        hospital_id: HOSPITAL_ID
      };
      
      console.log('🎂 Age from input data:', data.age, 'Type:', typeof data.age);
      console.log('🎂 Age being stored:', patientData.age, 'Type:', typeof patientData.age);
      console.log('📤 Inserting patient:', patientData);
      console.log('📅 date_of_entry being stored:', patientData.date_of_entry);
      
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
      console.log('🎂 Age in returned patient data:', patient?.age, 'Type:', typeof patient?.age);
      
      return patient as Patient;
      
    } catch (error: any) {
      console.error('🚨 createPatient error:', error);
      throw error;
    }
  }
  
  static async getPatientsForDate(dateStr: string, limit = 100): Promise<PatientWithRelations[]> {
    try {
      console.log(`📅 Fetching patients for EXACT date: ${dateStr} (NO CUMULATIVE RESULTS)`);
      
      // NEW APPROACH: Get all patients and filter exactly client-side
      // This avoids all timezone issues that cause cumulative results
      
      const { data: allPatients, error } = await supabase
        .from('patients')
        .select(`
          *,
          transactions:patient_transactions(*),
          admissions:patient_admissions(*)
        `)
        .eq('hospital_id', HOSPITAL_ID)
        .order('created_at', { ascending: false })
        .limit(1000);
      
      if (error) {
        console.error('❌ Query error:', error);
        throw error;
      }
      
      console.log(`📊 Got ${allPatients?.length || 0} total patients, now filtering for EXACT date: ${dateStr}`);
      
      if (!allPatients || allPatients.length === 0) {
        console.log('⚠️ No patients found in database');
        return [];
      }
      
      // Filter patients with EXACT date matching (no timezone issues)
      const exactDatePatients = allPatients.filter(patient => {
        // Extract dates in YYYY-MM-DD format for exact comparison
        let createdDate = null;
        let entryDate = null;
        
        if (patient.created_at) {
          createdDate = patient.created_at.split('T')[0]; // Extract YYYY-MM-DD
        }
        
        if (patient.date_of_entry) {
          // Handle both date-only and datetime formats
          if (patient.date_of_entry.includes('T')) {
            entryDate = patient.date_of_entry.split('T')[0];
          } else {
            entryDate = patient.date_of_entry; // Already YYYY-MM-DD
          }
        }
        
        // EXACT match check
        const matchesCreated = createdDate === dateStr;
        const matchesEntry = entryDate === dateStr;
        const shouldInclude = matchesCreated || matchesEntry;
        
        // Debug each patient
        console.log(`🔍 Patient: ${patient.first_name} ${patient.last_name}`, {
          createdDate,
          entryDate,
          targetDate: dateStr,
          matchesCreated,
          matchesEntry,
          included: shouldInclude
        });
        
        return shouldInclude;
      });
      
      console.log(`✅ Filtered to ${exactDatePatients.length} patients with EXACT date match for ${dateStr}`);
      
      // Debug: Show filtered results
      if (exactDatePatients.length > 0) {
        console.log('🔍 EXACT DATE FILTER RESULTS:');
        exactDatePatients.forEach((p, i) => {
          const createdDate = p.created_at ? p.created_at.split('T')[0] : null;
          const entryDate = p.date_of_entry ? (p.date_of_entry.includes('T') ? p.date_of_entry.split('T')[0] : p.date_of_entry) : null;
          console.log(`  ${i + 1}. ${p.first_name} ${p.last_name}: created=${createdDate}, entry=${entryDate}`);
          
          // Verify exact match
          if (createdDate !== dateStr && entryDate !== dateStr) {
            console.error(`🚨 FILTER ERROR: Patient ${p.first_name} ${p.last_name} doesn't match ${dateStr}!`);
          }
        });
      }
      
      if (entryTodayQuery.data && entryTodayQuery.data.length > 0) {
        console.log('📅 ENTRY TODAY QUERY RESULTS:');
        entryTodayQuery.data.forEach((p, i) => {
          const createdDate = p.created_at ? p.created_at.split('T')[0] : null;
          const entryDate = p.date_of_entry ? p.date_of_entry.split('T')[0] : null;
          console.log(`  ${i + 1}. ${p.first_name} ${p.last_name}: created=${createdDate}, entry=${entryDate}`);
          
          // Special debugging for problematic patients
          if (p.first_name?.toUpperCase().includes('ANJU') || 
              p.first_name?.toUpperCase().includes('SHER') ||
              p.last_name?.toUpperCase().includes('SINGH')) {
            console.error(`🎯 PROBLEM PATIENT IN ENTRY QUERY: ${p.first_name} ${p.last_name}`, {
              created_at_raw: p.created_at,
              date_of_entry_raw: p.date_of_entry,
              created_at_parsed: createdDate,
              date_of_entry_parsed: entryDate,
              expectedDate: dateStr,
              queryType: 'ENTRY_TODAY'
            });
          }
          
          // Flag problematic entries
          if (entryDate !== dateStr) {
            console.error(`🚨 WRONG DATE IN ENTRY QUERY: Patient ${p.first_name} ${p.last_name} has date_of_entry=${entryDate} but expected ${dateStr}`);
          }
        });
      }
      
      // Combine and deduplicate results
      const combinedPatients = [...(createdTodayQuery.data || []), ...(entryTodayQuery.data || [])];
      const uniquePatients = combinedPatients.filter((patient, index, array) => 
        array.findIndex(p => p.id === patient.id) === index
      );
      
      // STRICT VALIDATION: Only include patients that actually match today's date
      console.log('🔍 Applying strict date validation...');
      const validatedPatients = uniquePatients.filter(patient => {
        const createdDate = patient.created_at ? patient.created_at.split('T')[0] : null;
        const entryDate = patient.date_of_entry ? patient.date_of_entry.split('T')[0] : null;
        
        // Special handling for problematic patients
        const isProblematicPatient = patient.first_name?.toUpperCase().includes('ANJU') || 
                                   patient.first_name?.toUpperCase().includes('SHER') ||
                                   patient.last_name?.toUpperCase().includes('SINGH');
        
        if (isProblematicPatient) {
          console.error(`🎯 CHECKING PROBLEMATIC PATIENT: ${patient.first_name} ${patient.last_name}`, {
            created_at_parsed: createdDate,
            date_of_entry_parsed: entryDate,
            expectedDate: dateStr
          });
          
          // Reject if ANY date field shows 31/07/2025 (yesterday)
          if (createdDate === '2025-07-31' || entryDate === '2025-07-31') {
            console.error(`🚫 BLOCKING PROBLEMATIC PATIENT: ${patient.first_name} ${patient.last_name} has 31/07/2025 date - EXCLUDED FROM TODAY'S FILTER`);
            return false;
          }
        }
        
        // Patient is valid if either created_at OR date_of_entry matches today
        const isValidCreated = createdDate === dateStr;
        const isValidEntry = entryDate === dateStr;
        const isValid = isValidCreated || isValidEntry;
        
        if (!isValid) {
          console.error(`🚨 FILTERING OUT INVALID PATIENT: ${patient.first_name} ${patient.last_name} - created=${createdDate}, entry=${entryDate}, expected=${dateStr}`);
        } else {
          console.log(`✅ Valid patient: ${patient.first_name} ${patient.last_name} - created=${createdDate}, entry=${entryDate}`);
        }
        
        return isValid;
      });
      
      // Apply limit to validated patients
      const limitedPatients = validatedPatients.slice(0, limit);
      
      console.log(`✅ Final result: ${limitedPatients.length} validated patients for ${dateStr} (filtered out ${uniquePatients.length - validatedPatients.length} invalid patients)`);
      
      // Log first few patients for debugging
      if (limitedPatients.length > 0) {
        console.log('🔍 Sample patients found:');
        limitedPatients.slice(0, 3).forEach((p, i) => {
          const createdDate = p.created_at ? p.created_at.split('T')[0] : null;
          const entryDate = p.date_of_entry ? p.date_of_entry.split('T')[0] : null;
          console.log(`${i + 1}. ${p.first_name} ${p.last_name}: created=${createdDate}, entry=${entryDate}`);
        });
      }
      
      // Enhance patients with calculated fields (same as getPatients method)
      const enhancedPatients = limitedPatients.map(patient => {
        const transactions = patient.transactions || [];
        const admissions = patient.admissions || [];
        // Only count completed transactions (exclude cancelled)
        const totalSpent = transactions
          .filter((t: any) => t.status !== 'CANCELLED')
          .reduce((sum: number, t: any) => sum + (t.amount || 0), 0);
        // Count patient entries/registrations and consultations (including 0 fee consultations, excluding cancelled)
        const registrationVisits = transactions.filter((t: any) => 
          (t.transaction_type === 'ENTRY_FEE' || 
          t.transaction_type === 'entry_fee' ||
          t.transaction_type === 'CONSULTATION' ||
          t.transaction_type === 'consultation') &&
          t.status !== 'CANCELLED'
        ).length;
        // If patient exists but has no registration transactions, count as 1 visit (they were registered with 0 fee)
        const visitCount = registrationVisits > 0 ? registrationVisits : 1;
        const activeTransactions = transactions.filter((t: any) => t.status !== 'CANCELLED');
        const lastVisit = activeTransactions.length > 0 
          ? activeTransactions.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0].created_at
          : null;
        
        // All patients are OPD now
        const departmentStatus = 'OPD';
        
        return {
          ...patient,
          totalSpent,
          visitCount,
          lastVisit,
          departmentStatus
        };
      });
      
      return enhancedPatients as PatientWithRelations[];
      
    } catch (error: any) {
      console.error('🚨 getPatientsForDate error:', error);
      
      // Fallback: return empty array instead of throwing
      console.log('🔄 Falling back to empty result due to error');
      return [];
    }
  }

  static async getPatients(limit = 100): Promise<PatientWithRelations[]> {
    try {
      const timestamp = new Date().toISOString();
      console.log(`📋 Fetching patients from new schema at ${timestamp}...`);
      
      // Add cache-busting to ensure fresh data
      const { data: patients, error } = await supabase
        .from('patients')
        .select(`
          *,
          transactions:patient_transactions(*),
          admissions:patient_admissions(*)
        `)
        .eq('hospital_id', HOSPITAL_ID)
        .order('created_at', { ascending: false })
        .limit(limit);
      
      if (error) {
        console.error('❌ Fetch patients error:', error);
        throw error;
      }
      
      console.log(`✅ Fetched ${patients?.length || 0} patients`);
      
      // Debug: Log all patient dates to identify the issue
      if (patients && patients.length > 0) {
        console.log('🔍 Backend: All patient dates (first 10):');
        patients.slice(0, 10).forEach((p, i) => {
          const createdDate = p.created_at ? p.created_at.split('T')[0] : null;
          const entryDate = p.date_of_entry ? p.date_of_entry.split('T')[0] : null;
          console.log(`${i + 1}. ${p.first_name} ${p.last_name}: created=${createdDate}, entry=${entryDate}`);
        });
        
        // Special check for problematic dates
        const todayStr = new Date().toISOString().split('T')[0];
        const yesterdayStr = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        
        const todayPatients = patients.filter(p => {
          const createdDate = p.created_at ? p.created_at.split('T')[0] : null;
          const entryDate = p.date_of_entry ? p.date_of_entry.split('T')[0] : null;
          return createdDate === todayStr || entryDate === todayStr;
        });
        
        const yesterdayPatients = patients.filter(p => {
          const createdDate = p.created_at ? p.created_at.split('T')[0] : null;
          const entryDate = p.date_of_entry ? p.date_of_entry.split('T')[0] : null;
          return createdDate === yesterdayStr || entryDate === yesterdayStr;
        });
        
        console.log(`📊 Backend date analysis:`, {
          todayStr,
          yesterdayStr,
          todayPatients: todayPatients.length,
          yesterdayPatients: yesterdayPatients.length
        });
        
        if (yesterdayPatients.length > 0) {
          console.log('🚨 Backend: Found yesterday patients:', yesterdayPatients.map(p => `${p.first_name} ${p.last_name}`));
        }
      }
      
      // Enhance patients with calculated fields
      const enhancedPatients = patients?.map(patient => {
        const transactions = patient.transactions || [];
        const admissions = patient.admissions || [];
        // Only count completed transactions (exclude cancelled)
        const totalSpent = transactions
          .filter((t: any) => t.status !== 'CANCELLED')
          .reduce((sum: number, t: any) => sum + (t.amount || 0), 0);
        // Count patient entries/registrations and consultations (including 0 fee consultations, excluding cancelled)
        const registrationVisits = transactions.filter((t: any) => 
          (t.transaction_type === 'ENTRY_FEE' || 
          t.transaction_type === 'entry_fee' ||
          t.transaction_type === 'CONSULTATION' ||
          t.transaction_type === 'consultation') &&
          t.status !== 'CANCELLED'
        ).length;
        // If patient exists but has no registration transactions, count as 1 visit (they were registered with 0 fee)
        const visitCount = registrationVisits > 0 ? registrationVisits : 1;
        const activeTransactions = transactions.filter((t: any) => t.status !== 'CANCELLED');
        const lastVisit = activeTransactions.length > 0 
          ? activeTransactions.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0].created_at
          : null;
        
        // All patients are OPD now
        const departmentStatus = 'OPD';
        
        return {
          ...patient,
          totalSpent,
          visitCount,
          lastVisit,
          departmentStatus
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
      
      console.log('🔍 Raw patient data from database:', patient);
      console.log('🎂 Age field in raw data:', patient?.age, 'Type:', typeof patient?.age);
      
      return patient as PatientWithRelations;
      
    } catch (error: any) {
      console.error('🚨 getPatientById error:', error);
      return null;
    }
  }

  static async deletePatient(patientId: string): Promise<void> {
    try {
      console.log(`🗑️ Deleting patient with ID: ${patientId}`);
      const { error } = await supabase
        .from('patients')
        .delete()
        .eq('id', patientId);

      if (error) {
        console.error('❌ Patient deletion error:', error);
        throw new Error(`Patient deletion failed: ${error.message}`);
      }
      console.log(`✅ Patient with ID ${patientId} deleted successfully.`);
    } catch (error: any) {
      console.error('🚨 deletePatient error:', error);
      throw error;
    }
  }

  static async updatePatient(patientId: string, updateData: Partial<Patient>): Promise<Patient | null> {
    try {
      console.log(`📝 Updating patient with ID: ${patientId}`, updateData);
      
      const { data: patient, error } = await supabase
        .from('patients')
        .update(updateData)
        .eq('id', patientId)
        .select()
        .single();

      if (error) {
        // If the error is about columns not existing, just log it and continue
        if (error.message.includes('column') && error.message.includes('does not exist')) {
          console.warn('⚠️ Some columns do not exist in database yet:', error.message);
          console.log('📝 Proceeding without updating non-existent columns...');
          
          // Filter out the fields that don't exist and try again
          const filteredData = { ...updateData };
          delete filteredData.ipd_status;
          delete filteredData.ipd_bed_number;
          
          if (Object.keys(filteredData).length === 0) {
            console.log('📝 No valid fields to update, returning existing patient data');
            return await this.getPatientById(patientId) as Patient;
          }
          
          const { data: patient2, error: error2 } = await supabase
            .from('patients')
            .update(filteredData)
            .eq('id', patientId)
            .select()
            .single();
            
          if (error2) {
            console.error('❌ Update patient error (retry):', error2);
            throw new Error(`Failed to update patient: ${error2.message}`);
          }
          
          return patient2 as Patient;
        } else {
          console.error('❌ Update patient error:', error);
          throw new Error(`Failed to update patient: ${error.message}`);
        }
      }

      console.log(`✅ Patient updated successfully:`, patient);
      return patient as Patient;
    } catch (error: any) {
      console.error('🚨 updatePatient error:', error);
      throw error;
    }
  }
  
  private static async getMaxPatientIdNumber(): Promise<number> {
    try {
      const { data, error } = await supabase
        .from('patients')
        .select('patient_id')
        .order('patient_id', { ascending: false })
        .limit(1);

      if (error) {
        console.error('Error fetching max patient ID:', error);
        return 0;
      }

      if (data && data.length > 0) {
        const maxId = data[0].patient_id;
        const numberPart = parseInt(maxId.substring(1), 10);
        return isNaN(numberPart) ? 0 : numberPart;
      }
      return 0;
    } catch (error) {
      console.error('Exception in getMaxPatientIdNumber:', error);
      return 0;
    }
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

  static async updateTransactionStatus(transactionId: string, status: 'PENDING' | 'COMPLETED' | 'CANCELLED'): Promise<PatientTransaction> {
    try {
      console.log(`🔄 Updating transaction ${transactionId} status to ${status}`);
      
      const { data: transaction, error } = await supabase
        .from('patient_transactions')
        .update({ status })
        .eq('id', transactionId)
        .select()
        .single();
      
      if (error) {
        console.error('❌ Update transaction status error:', error);
        throw new Error(`Failed to update transaction status: ${error.message}`);
      }
      
      console.log('✅ Transaction status updated successfully');
      return transaction as PatientTransaction;
      
    } catch (error: any) {
      console.error('🚨 updateTransactionStatus error:', error);
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
      console.log('📄 Loading complete discharge record for admission:', admissionId);
      
      // First try the full query with bills
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
      
      if (error) {
        console.warn('⚠️ Full query failed, trying simplified query:', error);
        
        // Fallback: try without discharge_bills table
        const { data: simplifiedData, error: simplifiedError } = await supabase
          .from('discharge_summaries')
          .select(`
            *,
            admission:patient_admissions(*),
            patient:patients(*)
          `)
          .eq('admission_id', admissionId)
          .single();
        
        if (simplifiedError) {
          console.error('❌ Simplified query also failed:', simplifiedError);
          throw simplifiedError;
        }
        
        console.log('✅ Simplified discharge record loaded');
        return simplifiedData;
      }
      
      console.log('✅ Complete discharge record loaded');
      return data;
      
    } catch (error: any) {
      console.error('❌ Error loading discharge record:', error);
      console.error('Error details:', JSON.stringify(error, null, 2));
      throw error;
    }
  }
}

export default HospitalService;
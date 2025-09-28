import { supabase, HOSPITAL_ID } from '../config/supabaseNew';
import { logger } from '../utils/logger';
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
      logger.log('🔍 Getting current user from Supabase Auth...');
      
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError) {
        logger.error('❌ Auth error:', authError);
        throw authError;
      }
      
      if (!user) {
        logger.log('⚠️ No authenticated user');
        return null;
      }
      
      logger.log('✅ Auth user found:', user.email);
      
      // Get user role from metadata
      const userRole = user.user_metadata?.role || 'frontdesk';
      
      // Try to get user profile from users table
      let userProfile: any = null;
      let profileError: any = null;
      
      try {
        const result = await supabase
          .from('users')
          .select('*')
          .eq('id', user.id);
          
        if (result.error) {
          profileError = result.error;
          logger.log('⚠️ Users table query error:', result.error);
        } else if (result.data && result.data.length > 0) {
          userProfile = result.data[0];
          logger.log('✅ User profile found:', userProfile);
        } else {
          logger.log('ℹ️ No profile found in users table');
          profileError = { message: 'No profile found' };
        }
      } catch (queryError: any) {
        logger.log('⚠️ Users table access error:', queryError);
        profileError = queryError;
      }
      
      if (profileError || !userProfile) {
        logger.log('🔄 Using fallback user profile creation...');
        
        // Return a minimal user object without trying to create in database
        // This handles cases where users table doesn't exist or has permission issues
        return {
          id: user.id,
          auth_id: user.id,
          email: user.email || '',
          first_name: user.email?.split('@')[0] || 'User',
          last_name: '',
          role: 'STAFF' as const,
          phone: '',
          specialization: '',
          consultation_fee: 0,
          department: 'General',
          hospital_id: HOSPITAL_ID,
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        } as User;
      }
      
      logger.log('✅ User profile found:', userProfile);
      return userProfile as User;
      
    } catch (error: any) {
      logger.error('🚨 getCurrentUser error:', error);
      return null;
    }
  }
  
  static async createUserProfile(authUser: any): Promise<User> {
    logger.log('👤 Attempting user profile creation/retrieval for:', authUser.email);
    
    // Create fallback user object in case of database issues
    const fallbackUser = {
      id: authUser.id,
      auth_id: authUser.id,
      email: authUser.email || '',
      first_name: authUser.email?.split('@')[0] || 'User',
      last_name: '',
      role: 'STAFF' as const,
      phone: '',
      specialization: '',
      consultation_fee: 0,
      department: 'General',
      hospital_id: HOSPITAL_ID,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    } as User;
    
    try {
      // First, try to find existing user by email
      const { data: existingUsers, error: searchError } = await supabase
        .from('users')
        .select('*')
        .eq('email', authUser.email);
        
      if (!searchError && existingUsers && existingUsers.length > 0) {
        logger.log('✅ Found existing user profile by email');
        return existingUsers[0] as User;
      }
      
      // If no existing user, try to create new one
      const userData = {
        auth_id: authUser.id,
        email: authUser.email,
        first_name: authUser.user_metadata?.first_name || authUser.email.split('@')[0],
        last_name: authUser.user_metadata?.last_name || '',
        role: 'STAFF',
        phone: authUser.user_metadata?.phone || '',
        specialization: '',
        consultation_fee: 0,
        department: 'General',
        hospital_id: HOSPITAL_ID,
        is_active: true
      };
      
      const { data: newUser, error: createError } = await supabase
        .from('users')
        .insert([userData])
        .select();
      
      if (!createError && newUser && newUser.length > 0) {
        logger.log('✅ Successfully created new user profile');
        return newUser[0] as User;
      }
      
      // Handle creation errors
      if (createError?.code === '23505') {
        logger.log('🔄 Duplicate key detected, attempting to fetch existing user...');
        const { data: duplicateUser } = await supabase
          .from('users')
          .select('*')
          .eq('email', authUser.email);
          
        if (duplicateUser && duplicateUser.length > 0) {
          logger.log('✅ Retrieved existing user after duplicate key error');
          return duplicateUser[0] as User;
        }
      }
      
      logger.log('⚠️ Database operations failed, using fallback user profile');
      return fallbackUser;
      
    } catch (error: any) {
      logger.log('⚠️ User profile database error, using fallback:', error.message);
      return fallbackUser;
    }
  }
  
  static async signIn(email: string, password: string): Promise<{ user: User | null; error: any }> {
    try {
      logger.log('🔐 Signing in with Supabase:', email);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) {
        logger.error('❌ Sign in error:', error);
        return { user: null, error };
      }
      
      logger.log('✅ Auth successful, getting user profile...');
      const user = await this.getCurrentUser();
      
      return { user, error: null };
      
    } catch (error) {
      logger.error('🚨 SignIn exception:', error);
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
  
  // ==================== CONNECTION STATUS ====================
  
  static async getConnectionStatus(): Promise<boolean> {
    try {
      // Try to make a simple query to check if connection is working
      const { error } = await supabase
        .from('patients')
        .select('id')
        .limit(1);
      
      if (error) {
        logger.error('❌ Connection check failed:', error);
        return false;
      }
      
      logger.log('✅ Connection to Supabase is active');
      return true;
    } catch (error: any) {
      logger.error('🚨 Connection check error:', error);
      return false;
    }
  }
  
  // ==================== PATIENT OPERATIONS ====================
  
  static async findExistingPatient(phone?: string, firstName?: string, lastName?: string): Promise<Patient | null> {
    try {
      logger.log('🔍 Searching for existing patient with:', { phone, firstName, lastName });
      
      if (!phone && !firstName) {
        return null;
      }
      
      // Normalize phone number (remove spaces, dashes, etc.)
      const normalizePhone = (ph: string) => ph.replace(/[\s\-\(\)\.]/g, '').trim();
      
      // Search by phone first (most unique identifier)
      if (phone && phone.trim()) {
        const normalizedPhone = normalizePhone(phone);
        logger.log('📱 Searching by normalized phone:', normalizedPhone);
        
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
            logger.log('✅ Found patient by phone number match');
            return phoneMatch as Patient;
          }
        }
      }
      
      // If no phone match, try name match (case-insensitive)
      if (firstName && firstName.trim()) {
        const normalizedFirstName = firstName.trim().toLowerCase();
        const normalizedLastName = lastName ? lastName.trim().toLowerCase() : '';
        
        logger.log('👤 Searching by name:', { normalizedFirstName, normalizedLastName });
        
        const nameQuery = supabase
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
            logger.log('✅ Found exact patient name match');
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
            logger.log('✅ Found similar patient name match');
            return similarMatch as Patient;
          }
        }
      }
      
      logger.log('ℹ️ No existing patient found');
      return null;
      
    } catch (error: any) {
      logger.error('🚨 findExistingPatient error:', error);
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
      logger.log('🏥 Creating patient visit:', visitData);
      
      const { data: visit, error } = await supabase
        .from('patient_visits')
        .insert([{
          ...visitData,
          visit_date: visitData.visit_date ? new Date(visitData.visit_date).toISOString() : new Date().toISOString()
        }])
        .select()
        .single();
      
      if (error) {
        logger.error('❌ Visit creation error:', error);
        throw new Error(`Visit creation failed: ${error.message}`);
      }
      
      logger.log('✅ Visit created successfully:', visit);
      return visit;
      
    } catch (error: any) {
      logger.error('🚨 createPatientVisit error:', error);
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
        logger.error('❌ Get visits error:', error);
        throw error;
      }
      
      return visits || [];
      
    } catch (error: any) {
      logger.error('🚨 getPatientVisits error:', error);
      throw error;
    }
  }
  
  static async createPatient(data: CreatePatientData): Promise<Patient> {
    logger.log('👤 Creating patient with exact schema:', data);
    
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
        patient_tag: data.patient_tag || null,
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
      
      logger.log('🎂 Age from input data:', data.age, 'Type:', typeof data.age);
      logger.log('🎂 Age being stored:', patientData.age, 'Type:', typeof patientData.age);
      logger.log('📤 Inserting patient:', patientData);
      logger.log('📅 date_of_entry being stored:', patientData.date_of_entry);
      
      const { data: patient, error } = await supabase
        .from('patients')
        .insert([patientData])
        .select()
        .single();
      
      if (error) {
        logger.error('❌ Patient creation error:', error);
        throw new Error(`Patient creation failed: ${error.message}`);
      }
      
      logger.log('✅ Patient created successfully:', patient);
      logger.log('🎂 Age in returned patient data:', patient?.age, 'Type:', typeof patient?.age);
      
      return patient as Patient;
      
    } catch (error: any) {
      logger.error('🚨 createPatient error:', error);
      throw error;
    }
  }
  
  static async getPatientsForDate(dateStr: string, limit = 100): Promise<PatientWithRelations[]> {
    try {
      logger.log(`📅 Fetching patients for EXACT date: ${dateStr} (NO CUMULATIVE RESULTS)`);
      
      // OPTIMIZED APPROACH: Fetch recent patients first (last 30 days) then filter
      // This reduces data transfer while ensuring we get today's patients
      
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const recentDate = thirtyDaysAgo.toISOString();
      
      const { data: allPatients, error } = await supabase
        .from('patients')
        .select(`
          *,
          transactions:patient_transactions(*),
          admissions:patient_admissions(*)
        `)
        .eq('hospital_id', HOSPITAL_ID)
        .gte('created_at', recentDate)
        .order('created_at', { ascending: false })
        .limit(10000);
      
      if (error) {
        logger.error('❌ Query error:', error);
        throw error;
      }
      
      logger.log(`📊 Got ${allPatients?.length || 0} total patients, now filtering for EXACT date: ${dateStr}`);
      
      if (!allPatients || allPatients.length === 0) {
        logger.log('⚠️ No patients found in database');
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
        logger.log(`🔍 Patient: ${patient.first_name} ${patient.last_name}`, {
          createdDate,
          entryDate,
          targetDate: dateStr,
          matchesCreated,
          matchesEntry,
          included: shouldInclude
        });
        
        return shouldInclude;
      });
      
      logger.log(`✅ Filtered to ${exactDatePatients.length} patients with EXACT date match for ${dateStr}`);
      
      // Debug: Show filtered results
      if (exactDatePatients.length > 0) {
        logger.log('🔍 EXACT DATE FILTER RESULTS:');
        exactDatePatients.forEach((p, i) => {
          const createdDate = p.created_at ? p.created_at.split('T')[0] : null;
          const entryDate = p.date_of_entry ? (p.date_of_entry.includes('T') ? p.date_of_entry.split('T')[0] : p.date_of_entry) : null;
          logger.log(`  ${i + 1}. ${p.first_name} ${p.last_name}: created=${createdDate}, entry=${entryDate}`);
          
          // Verify exact match
          if (createdDate !== dateStr && entryDate !== dateStr) {
            logger.error(`🚨 FILTER ERROR: Patient ${p.first_name} ${p.last_name} doesn't match ${dateStr}!`);
          }
        });
      }
      
      // Apply limit to filtered patients
      const limitedPatients = exactDatePatients.slice(0, limit);
      
      logger.log(`✅ Final result: ${limitedPatients.length} patients for exact date ${dateStr}`);
      
      // Log first few patients for debugging
      if (limitedPatients.length > 0) {
        logger.log('🔍 Sample patients found:');
        limitedPatients.slice(0, 3).forEach((p, i) => {
          const createdDate = p.created_at ? p.created_at.split('T')[0] : null;
          const entryDate = p.date_of_entry ? p.date_of_entry.split('T')[0] : null;
          logger.log(`${i + 1}. ${p.first_name} ${p.last_name}: created=${createdDate}, entry=${entryDate}`);
        });
      }
      
      // Enhance patients with calculated fields (same as getPatients method)
      const enhancedPatients = limitedPatients.map(patient => {
        const transactions = patient.transactions || [];
        const admissions = patient.admissions || [];
        
        // Calculate totalSpent from all transactions (not filtered by date)
        // The frontend will handle date filtering for display
        const totalSpent = transactions
          .filter((t: any) => t.status !== 'CANCELLED')
          .reduce((sum: number, t: any) => sum + (t.amount || 0), 0);
        
        // For visitCount and lastVisit, still use all transactions (but exclude cancelled)
        const allActiveTransactions = transactions.filter((t: any) => t.status !== 'CANCELLED');
        
        // Count patient entries/registrations and consultations (including 0 fee consultations, excluding cancelled)
        const visitCount = allActiveTransactions.filter((t: any) =>
          (t.transaction_type === 'ENTRY_FEE' ||
          t.transaction_type === 'entry_fee' ||
          t.transaction_type === 'CONSULTATION' ||
          t.transaction_type === 'consultation' ||
          t.transaction_type === 'LAB_TEST' ||
          t.transaction_type === 'XRAY' ||
          t.transaction_type === 'PROCEDURE')
        ).length;

        // Calculate last visit date
        const lastVisit = allActiveTransactions.length > 0
          ? new Date(Math.max(...allActiveTransactions.map((t: any) => new Date(t.created_at || t.transaction_date || '').getTime())))
              .toISOString().split('T')[0]
          : undefined;

        // Check IPD status to determine department
        const departmentStatus = patient.ipd_status === 'ADMITTED' || patient.ipd_status === 'DISCHARGED' ? 'IPD' : 'OPD';

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
      logger.error('🚨 getPatientsForDate error:', error);
      
      // Fallback: return empty array instead of throwing
      logger.log('🔄 Falling back to empty result due to error');
      return [];
    }
  }

  static async getPatients(limit = 5000, skipOrthoFilter = true, includeInactive = false): Promise<PatientWithRelations[]> {
    try {
      const timestamp = new Date().toISOString();
      logger.log(`📋 Fetching patients with limit=${limit}, skipOrthoFilter=${skipOrthoFilter}, includeInactive=${includeInactive} at ${timestamp}...`);
      
      // First, get the total count to debug
      const { count: totalCount } = await supabase
        .from('patients')
        .select('*', { count: 'exact', head: true })
        .eq('hospital_id', HOSPITAL_ID)
        .eq('is_active', true);
      
      const { count: totalInactiveCount } = await supabase
        .from('patients')
        .select('*', { count: 'exact', head: true })
        .eq('hospital_id', HOSPITAL_ID);
      
      logger.log(`📊 Total ACTIVE patients: ${totalCount}, Total ALL patients: ${totalInactiveCount}`);
      
      // If requesting more than 1000, we need to paginate
      let allPatients: any[] = [];
      const pageSize = 1000; // Supabase PostgREST actual max limit
      
      // Calculate actual patients to fetch based on what's available
      const actualPatientCount = includeInactive ? (totalInactiveCount || 0) : (totalCount || 0);
      const targetCount = Math.min(limit, actualPatientCount);
      const numPages = Math.ceil(targetCount / pageSize);
      
      logger.log(`📄 Need to fetch ${numPages} pages to get ${targetCount} patients (requested: ${limit}, available: ${actualPatientCount})`);
      
      for (let page = 0; page < numPages; page++) {
        const from = page * pageSize;
        const to = Math.min(from + pageSize - 1, targetCount - 1);
        
        logger.log(`📄 Fetching page ${page + 1}/${numPages}: rows ${from} to ${to}`);
        
        let query = supabase
          .from('patients')
          .select(`
            *,
            transactions:patient_transactions(*)
          `)
          .eq('hospital_id', HOSPITAL_ID);
        
        // Only filter by is_active if not including inactive
        if (!includeInactive) {
          query = query.eq('is_active', true);
        }
        
        query = query
          .order('created_at', { ascending: false })
          .range(from, to);
        
        const { data: pageData, error } = await query;
        
        if (error) {
          logger.error(`❌ Error fetching page ${page + 1}:`, error);
          throw error;
        }
        
        if (pageData) {
          allPatients = [...allPatients, ...pageData];
          logger.log(`✅ Fetched ${pageData.length} patients in page ${page + 1}, total so far: ${allPatients.length}`);
        }
        
        // If we got less than a full page, we've reached the end
        if (!pageData || pageData.length < pageSize) {
          break;
        }
      }
      
      const patients = allPatients;
      
      logger.log(`✅ Total fetched ${patients?.length || 0} patients from database`);
      
      // Debug: Check if we're hitting a Supabase limit
      if (patients?.length === 1000 || patients?.length === 100) {
        logger.warn(`⚠️ WARNING: Received exactly ${patients.length} patients - might be hitting a default Supabase limit!`);
      }
      
      // Filter out ORTHO/DR HEMANT patients (unless skipOrthoFilter is true)
      const filteredPatients = skipOrthoFilter ? (patients || []) : patients?.filter(patient => {
        const department = patient.assigned_department?.toUpperCase()?.trim() || '';
        const doctor = patient.assigned_doctor?.toUpperCase()?.trim() || '';
        
        const isOrtho = department === 'ORTHO' || department === 'ORTHOPAEDIC';
        const isHemant = doctor.includes('HEMANT') || doctor === 'DR HEMANT' || doctor === 'DR. HEMANT';
        
        if (isOrtho && isHemant) {
          logger.log(`🚫 HospitalService - Excluding ORTHO/HEMANT patient: ${patient.first_name} ${patient.last_name}`);
          return false;
        }
        
        return true;
      }) || [];
      
      logger.log(`📊 HospitalService - Filtered ${patients?.length || 0} to ${filteredPatients.length} patients (excluded ${(patients?.length || 0) - filteredPatients.length} ORTHO/HEMANT, skipOrthoFilter=${skipOrthoFilter})`);
      
      // Debug: Log all patient dates to identify the issue
      if (filteredPatients && filteredPatients.length > 0) {
        logger.log('🔍 Backend: All filtered patient dates (first 10):');
        filteredPatients.slice(0, 10).forEach((p, i) => {
          const createdDate = p.created_at ? p.created_at.split('T')[0] : null;
          const entryDate = p.date_of_entry ? p.date_of_entry.split('T')[0] : null;
          logger.log(`${i + 1}. ${p.first_name} ${p.last_name}: created=${createdDate}, entry=${entryDate}`);
        });
        
        // Special check for problematic dates
        const todayStr = new Date().toISOString().split('T')[0];
        const yesterdayStr = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        
        const todayPatients = filteredPatients.filter(p => {
          const createdDate = p.created_at ? p.created_at.split('T')[0] : null;
          const entryDate = p.date_of_entry ? p.date_of_entry.split('T')[0] : null;
          return createdDate === todayStr || entryDate === todayStr;
        });
        
        const yesterdayPatients = filteredPatients.filter(p => {
          const createdDate = p.created_at ? p.created_at.split('T')[0] : null;
          const entryDate = p.date_of_entry ? p.date_of_entry.split('T')[0] : null;
          return createdDate === yesterdayStr || entryDate === yesterdayStr;
        });
        
        logger.log(`📊 Backend date analysis:`, {
          todayStr,
          yesterdayStr,
          todayPatients: todayPatients.length,
          yesterdayPatients: yesterdayPatients.length
        });
        
        if (yesterdayPatients.length > 0) {
          logger.log('🚨 Backend: Found yesterday patients:', yesterdayPatients.map(p => `${p.first_name} ${p.last_name}`));
        }
      }
      
      // Enhance patients with calculated fields
      const enhancedPatients = filteredPatients?.map(patient => {
        const transactions = patient.transactions || [];
        const admissions = []; // Temporarily empty until patient_admissions is fixed
        
        // Calculate totalSpent from all transactions (not filtered by date)
        // The frontend will handle date filtering for display
        const totalSpent = transactions
          .filter((t: any) => t.status !== 'CANCELLED')
          .reduce((sum: number, t: any) => sum + (t.amount || 0), 0);
        
        // For visitCount and lastVisit, still use all transactions (but exclude cancelled)
        const allActiveTransactions = transactions.filter((t: any) => t.status !== 'CANCELLED');
        
        // Count patient entries/registrations and consultations (including 0 fee consultations, excluding cancelled)
        const visitCount = allActiveTransactions.filter((t: any) =>
          (t.transaction_type === 'ENTRY_FEE' ||
          t.transaction_type === 'entry_fee' ||
          t.transaction_type === 'CONSULTATION' ||
          t.transaction_type === 'consultation' ||
          t.transaction_type === 'LAB_TEST' ||
          t.transaction_type === 'XRAY' ||
          t.transaction_type === 'PROCEDURE')
        ).length;

        // Calculate last visit date
        const lastVisit = allActiveTransactions.length > 0
          ? new Date(Math.max(...allActiveTransactions.map((t: any) => new Date(t.created_at || t.transaction_date || '').getTime())))
              .toISOString().split('T')[0]
          : undefined;

        // Check IPD status to determine department
        const departmentStatus = patient.ipd_status === 'ADMITTED' || patient.ipd_status === 'DISCHARGED' ? 'IPD' : 'OPD';

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
      logger.error('🚨 getPatients error:', error);
      throw error;
    }
  }
  
  static async getPatientById(id: string): Promise<PatientWithRelations | null> {
    try {
      const { data: patient, error } = await supabase
        .from('patients')
        .select(`
          *,
          transactions:patient_transactions(*)
        `)
        .eq('id', id)
        .single();
      
      if (error) {
        logger.error('❌ Get patient by ID error:', error);
        return null;
      }
      
      logger.log('🔍 Raw patient data from database:', patient);
      logger.log('🎂 Age field in raw data:', patient?.age, 'Type:', typeof patient?.age);
      
      return patient as PatientWithRelations;
      
    } catch (error: any) {
      logger.error('🚨 getPatientById error:', error);
      return null;
    }
  }

  static async deletePatient(patientId: string): Promise<void> {
    try {
      logger.log(`🗑️ Deleting patient with ID: ${patientId}`);
      const { error } = await supabase
        .from('patients')
        .delete()
        .eq('id', patientId);

      if (error) {
        logger.error('❌ Patient deletion error:', error);
        throw new Error(`Patient deletion failed: ${error.message}`);
      }
      logger.log(`✅ Patient with ID ${patientId} deleted successfully.`);
    } catch (error: any) {
      logger.error('🚨 deletePatient error:', error);
      throw error;
    }
  }

  static async updatePatient(patientId: string, updateData: Partial<Patient>): Promise<Patient | null> {
    try {
      logger.log(`📝 Updating patient with ID: ${patientId}`, updateData);
      
      const { data: patient, error } = await supabase
        .from('patients')
        .update(updateData)
        .eq('id', patientId)
        .select()
        .single();

      if (error) {
        // If the error is about columns not existing, just log it and continue
        if (error.message.includes('column') && error.message.includes('does not exist')) {
          logger.warn('⚠️ Some columns do not exist in database yet:', error.message);
          logger.log('📝 Proceeding without updating non-existent columns...');
          
          // Filter out the fields that don't exist and try again
          const filteredData = { ...updateData };
          delete filteredData.ipd_status;
          delete filteredData.ipd_bed_number;
          
          if (Object.keys(filteredData).length === 0) {
            logger.log('📝 No valid fields to update, returning existing patient data');
            return await this.getPatientById(patientId) as Patient;
          }
          
          const { data: patient2, error: error2 } = await supabase
            .from('patients')
            .update(filteredData)
            .eq('id', patientId)
            .select()
            .single();
            
          if (error2) {
            logger.error('❌ Update patient error (retry):', error2);
            throw new Error(`Failed to update patient: ${error2.message}`);
          }
          
          return patient2 as Patient;
        } else {
          logger.error('❌ Update patient error:', error);
          throw new Error(`Failed to update patient: ${error.message}`);
        }
      }

      logger.log(`✅ Patient updated successfully:`, patient);
      return patient as Patient;
    } catch (error: any) {
      logger.error('🚨 updatePatient error:', error);
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
        logger.error('Error fetching max patient ID:', error);
        return 0;
      }

      if (data && data.length > 0) {
        const maxId = data[0].patient_id;
        const numberPart = parseInt(maxId.substring(1), 10);
        return isNaN(numberPart) ? 0 : numberPart;
      }
      return 0;
    } catch (error) {
      logger.error('Exception in getMaxPatientIdNumber:', error);
      return 0;
    }
  }
  
  // ==================== TRANSACTION OPERATIONS ====================
  
  static async createTransaction(data: CreateTransactionData): Promise<PatientTransaction> {
    logger.log('💰 Creating transaction with date (HospitalService):', {
      input_transaction_date: data.transaction_date,
      input_transaction_date_type: typeof data.transaction_date,
      jsDateParsed: data.transaction_date ? new Date(data.transaction_date) : null,
      full_data: data
    });
    
    try {
      const transactionData: any = {
        patient_id: data.patient_id,
        transaction_type: data.transaction_type,
        description: data.description,
        amount: data.amount,
        payment_mode: data.payment_mode,
        doctor_id: data.doctor_id || null,
        doctor_name: data.doctor_name || null,
        department: data.department || null, // Add department field
        status: data.status || 'COMPLETED',
        transaction_reference: data.transaction_reference || null,
        transaction_date: data.transaction_date || new Date().toISOString().split('T')[0], // FIX: Include transaction_date
        hospital_id: HOSPITAL_ID // Fix: Add hospital_id to make transaction visible in dashboard
      };

      // Add discount fields only if they exist and have values
      if (data.discount_type) {
        transactionData.discount_type = data.discount_type;
      }
      if (data.discount_value !== undefined && data.discount_value !== null) {
        transactionData.discount_value = data.discount_value;
      }
      if (data.discount_reason) {
        transactionData.discount_reason = data.discount_reason;
      }
      if (data.online_payment_method) {
        transactionData.online_payment_method = data.online_payment_method;
      }
      
      logger.log('🔍 TRANSACTION CREATION DEBUG:', {
        transactionData,
        transaction_date_being_saved: transactionData.transaction_date,
        HOSPITAL_ID,
        inputData: data,
        todayDate: new Date().toISOString().split('T')[0]
      });
      
      const { data: transaction, error } = await supabase
        .from('patient_transactions')
        .insert([transactionData])
        .select()
        .single();
      
      if (error) {
        logger.error('❌ Transaction creation error:', error);
        throw new Error(`Transaction creation failed: ${error.message}`);
      }
      
      logger.log('✅ Transaction created:', transaction);
      
      // 🔄 UPDATE PATIENT'S LAST VISIT DATE
      const updateLastVisitDate = transactionData.transaction_date;
      logger.log('📅 Updating patient last_visit_date to:', updateLastVisitDate);
      
      const { error: updateError } = await supabase
        .from('patients')
        .update({ 
          last_visit_date: updateLastVisitDate,
          updated_at: new Date().toISOString()
        })
        .eq('id', data.patient_id);
      
      if (updateError) {
        logger.error('⚠️ Failed to update patient last_visit_date:', updateError);
        // Don't throw error - transaction is already created
      } else {
        logger.log('✅ Patient last_visit_date updated successfully');
      }
      
      // 🔍 VERIFY: Check if transaction was actually inserted with correct data
      const verifyQuery = await supabase
        .from('patient_transactions')
        .select(`
          id,
          amount,
          transaction_type,
          description,
          status,
          created_at,
          transaction_date,
          hospital_id,
          patient:patients!inner(id, patient_id, first_name, last_name, hospital_id, date_of_entry, last_visit_date)
        `)
        .eq('id', transaction.id)
        .single();
        
      logger.log('🔍 TRANSACTION VERIFICATION:', {
        insertedTransaction: transaction,
        verificationQuery: verifyQuery.data,
        verificationError: verifyQuery.error,
        hospitalIdMatch: verifyQuery.data?.hospital_id === HOSPITAL_ID,
        patientHospitalId: verifyQuery.data?.patient?.hospital_id,
        patientLastVisitDate: verifyQuery.data?.patient?.last_visit_date,
        todayDate: new Date().toISOString().split('T')[0],
        transactionCreatedDate: verifyQuery.data?.created_at?.split('T')[0],
        transactionDate: verifyQuery.data?.transaction_date
      });
      
      return transaction as PatientTransaction;
      
    } catch (error: any) {
      logger.error('🚨 createTransaction error:', error);
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
        logger.error('❌ Get transactions error:', error);
        throw error;
      }
      
      return transactions as PatientTransaction[];
      
    } catch (error: any) {
      logger.error('🚨 getTransactionsByPatient error:', error);
      throw error;
    }
  }

  static async updateTransaction(transactionId: string, updateData: Partial<PatientTransaction>): Promise<PatientTransaction> {
    try {
      logger.log(`🔄 Updating transaction ${transactionId}:`, updateData);
      
      const { data: transaction, error } = await supabase
        .from('patient_transactions')
        .update(updateData)
        .eq('id', transactionId)
        .select()
        .single();
      
      if (error) {
        logger.error('❌ Update transaction error:', error);
        throw new Error(`Failed to update transaction: ${error.message}`);
      }
      
      logger.log('✅ Transaction updated successfully');
      return transaction as PatientTransaction;
      
    } catch (error: any) {
      logger.error('🚨 updateTransaction error:', error);
      throw error;
    }
  }

  static async updateTransactionStatus(transactionId: string, status: 'PENDING' | 'COMPLETED' | 'CANCELLED'): Promise<PatientTransaction> {
    try {
      logger.log(`🔄 Updating transaction ${transactionId} status to ${status}`);
      
      const { data: transaction, error } = await supabase
        .from('patient_transactions')
        .update({ status })
        .eq('id', transactionId)
        .select()
        .single();
      
      if (error) {
        logger.error('❌ Update transaction status error:', error);
        throw new Error(`Failed to update transaction status: ${error.message}`);
      }
      
      logger.log('✅ Transaction status updated successfully');
      return transaction as PatientTransaction;
      
    } catch (error: any) {
      logger.error('🚨 updateTransactionStatus error:', error);
      throw error;
    }
  }

  static async deleteTransaction(transactionId: string): Promise<void> {
    try {
      logger.log(`🗑️ Permanently deleting transaction ${transactionId}`);
      
      // First fetch the transaction to log details
      const { data: transaction, error: fetchError } = await supabase
        .from('patient_transactions')
        .select('*')
        .eq('id', transactionId)
        .single();
      
      if (fetchError) {
        logger.error('❌ Could not fetch transaction before deletion:', fetchError);
      } else {
        logger.log('📝 Transaction to be deleted:', {
          id: transaction.id,
          created_at: transaction.created_at,
          transaction_date: transaction.transaction_date,
          amount: transaction.amount,
          description: transaction.description,
          age: transaction.created_at ? 
            `${Math.floor((Date.now() - new Date(transaction.created_at).getTime()) / (1000 * 60 * 60 * 24))} days old` : 
            'Unknown age'
        });
      }
      
      // Now delete the transaction
      const { error, count } = await supabase
        .from('patient_transactions')
        .delete()
        .eq('id', transactionId)
        .select('*', { count: 'exact' });
      
      if (error) {
        logger.error('❌ Delete transaction error:', error);
        throw new Error(`Failed to delete transaction: ${error.message}`);
      }
      
      logger.log(`✅ Transaction permanently deleted successfully. Rows affected: ${count || 'unknown'}`);
      
      // Verify deletion by trying to fetch the transaction again
      const { data: verifyData, error: verifyError } = await supabase
        .from('patient_transactions')
        .select('*')
        .eq('id', transactionId);
      
      if (verifyError) {
        logger.log('🔍 Verify query error:', verifyError.message);
      }
      
      if (verifyData && verifyData.length === 0) {
        logger.log('✅ VERIFIED: Transaction completely removed from database');
      } else if (verifyData && verifyData.length > 0) {
        logger.error('❌ CRITICAL WARNING: Transaction still exists in database after deletion!', verifyData);
        throw new Error('Transaction was not actually deleted from the database!');
      }
      
      // Also check if there are any related records that might be causing issues
      const { data: allTransactions, error: allError } = await supabase
        .from('patient_transactions')
        .select('id, description, amount, created_at, transaction_date')
        .limit(5);
        
      if (allError) {
        logger.error('Error checking remaining transactions:', allError);
      } else {
        logger.log('📊 Sample of remaining transactions in database:', allTransactions);
      }
      
    } catch (error: any) {
      logger.error('🚨 deleteTransaction error:', error);
      throw error;
    }
  }
  
  // ==================== APPOINTMENT OPERATIONS ====================
  
  static async createAppointment(data: CreateAppointmentData): Promise<FutureAppointment> {
    logger.log('📅 Creating appointment:', data);
    
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
        logger.error('❌ Appointment creation error:', error);
        throw new Error(`Appointment creation failed: ${error.message}`);
      }
      
      logger.log('✅ Appointment created:', appointment);
      return appointment as FutureAppointment;
      
    } catch (error: any) {
      logger.error('🚨 createAppointment error:', error);
      throw error;
    }
  }
  
  static async getAppointments(limit = 100): Promise<AppointmentWithRelations[]> {
    try {
      logger.log('📅 [HOSPITAL SERVICE] Fetching appointments from database...');
      logger.log('🔗 [HOSPITAL SERVICE] Supabase URL:', process.env.VITE_SUPABASE_URL);
      logger.log('🔑 [HOSPITAL SERVICE] Using anon key:', !!process.env.VITE_SUPABASE_ANON_KEY);
      
      // First try with relationships
      logger.log('🔄 [HOSPITAL SERVICE] Querying future_appointments table with relationships...');
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
        logger.error('❌ [HOSPITAL SERVICE] Get appointments with relations error:', error);
        
        // If relationships fail, try simple query
        logger.log('🔄 [HOSPITAL SERVICE] Trying simple query without relationships...');
        const { data: simpleAppointments, error: simpleError } = await supabase
          .from('future_appointments')
          .select('*')
          .order('appointment_date', { ascending: true })
          .limit(limit);
        
        if (simpleError) {
          logger.error('❌ [HOSPITAL SERVICE] Simple appointments query also failed:', simpleError);
          logger.log('🔍 [HOSPITAL SERVICE] Error details:', JSON.stringify(simpleError, null, 2));
          throw simpleError;
        }
        
        logger.log('✅ [HOSPITAL SERVICE] Got appointments without relationships:', simpleAppointments);
        logger.log('📊 [HOSPITAL SERVICE] Simple appointments count:', simpleAppointments?.length || 0);
        return (simpleAppointments || []) as AppointmentWithRelations[];
      }
      
      logger.log('✅ [HOSPITAL SERVICE] Successfully loaded appointments with relationships:', appointments);
      logger.log('📊 [HOSPITAL SERVICE] Appointments with relationships count:', appointments?.length || 0);
      return (appointments || []) as AppointmentWithRelations[];
      
    } catch (error: any) {
      logger.error('🚨 getAppointments error:', error);
      throw error;
    }
  }
  
  // ==================== DASHBOARD OPERATIONS ====================
  
  static async getDashboardStats(): Promise<DashboardStats> {
    try {
      logger.log('📊 Getting dashboard stats using transaction-based revenue calculation...');
      
      // Use local date to ensure correct timezone handling
      const localToday = new Date();
      const today = localToday.toISOString().split('T')[0];
      
      logger.log('🗓️ Date for revenue calculation:', {
        localDate: localToday.toLocaleString(),
        todayDate: today
      });
      
      // Get counts in parallel
      const [
        patientsResult,
        todayPatientsResult,
        doctorsResult,
        bedsResult,
        todayAppointmentsResult
      ] = await Promise.all([
        // Total patients (for default dashboard view)
        supabase.from('patients').select('*', { count: 'exact', head: true }).eq('hospital_id', HOSPITAL_ID),
        // Today's patients (for revenue card context)
        supabase.from('patients')
          .select('*', { count: 'exact', head: true })
          .eq('hospital_id', HOSPITAL_ID)
          .or(`date_of_entry.eq.${today},created_at.gte.${today}T00:00:00,created_at.lt.${today}T23:59:59`),
        supabase.from('users').select('*', { count: 'exact', head: true }).eq('hospital_id', HOSPITAL_ID).neq('role', 'ADMIN'),
        supabase.from('beds').select('*', { count: 'exact', head: true }).eq('hospital_id', HOSPITAL_ID),
        supabase.from('future_appointments').select('*', { count: 'exact', head: true }).eq('appointment_date', today)
      ]);
      
      const totalPatients = patientsResult.count || 0;
      const todayPatients = todayPatientsResult.count || 0;
      const totalDoctors = doctorsResult.count || 0;
      const totalBeds = bedsResult.count || 0;
      const todayAppointments = todayAppointmentsResult.count || 0;
      
      logger.log('📋 Getting transactions for today\'s revenue calculation...');
      
      // Get ALL transactions using the EXACT same query as OperationsLedger
      const [transactionsResult, recentPatientsResult] = await Promise.all([
        supabase
          .from('patient_transactions')
          .select(`
            id,
            amount,
            payment_mode,
            transaction_type,
            transaction_date,
            description,
            doctor_name,
            status,
            created_at,
            patient:patients(id, patient_id, first_name, last_name, age, gender, patient_tag, assigned_doctor, assigned_department, date_of_entry)
          `)
          .eq('status', 'COMPLETED')
          .order('created_at', { ascending: false }),
        
        // Get recent patients for details section
        supabase
          .from('patients')
          .select('*')
          .eq('hospital_id', HOSPITAL_ID)
          .order('created_at', { ascending: false })
          .limit(10)
      ]);
      
      const allTransactions = transactionsResult.data;
      const transError = transactionsResult.error;
      const recentPatients = recentPatientsResult.data || [];
      
      if (transError) {
        logger.error('❌ Error fetching transactions:', transError);
      }
      
      // 🔍 WHITE-BOX DEBUGGING: Analyze raw data
      logger.log('🔍 WHITE-BOX DEBUG - Raw Transaction Data:', {
        totalTransactions: allTransactions?.length || 0,
        sampleTransactions: allTransactions?.slice(0, 5).map(t => ({
          id: t.id,
          amount: t.amount,
          transaction_date: t.transaction_date,
          transaction_date_type: typeof t.transaction_date,
          created_at: t.created_at,
          patient_id: t.patient_id,
          patient_dept: t.patient?.assigned_department,
          patient_doctor: t.patient?.assigned_doctor
        })) || [],
        todayTarget: today
      });
      
      // Note: todayRevenue calculation is now handled in periodBreakdown.today.revenue below
      logger.log('💰 Using period breakdown for today\'s revenue calculation...');
      
      // Calculate period breakdown for always-available period data
      const periodBreakdown = {
        today: { revenue: 0, transactions: [], count: 0 },
        thisWeek: { revenue: 0, transactions: [], count: 0 },
        thisMonth: { revenue: 0, transactions: [], count: 0 }
      };
      
      // Calculate date boundaries for periods
      const todayDate = today; // YYYY-MM-DD string
      
      // This week: last 7 days including today
      const weekStartDate = new Date();
      weekStartDate.setDate(weekStartDate.getDate() - 6); // 7 days including today
      const weekStartStr = weekStartDate.toISOString().split('T')[0];
      
      // This month: current month
      const monthStartStr = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];
      const monthEndStr = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toISOString().split('T')[0];
      
      logger.log('📅 Period Date Ranges:', {
        today: todayDate,
        weekStart: weekStartStr,
        monthStart: monthStartStr,
        monthEnd: monthEndStr
      });
      
      // Process transactions for period breakdown using EXACT OperationsLedger logic
      if (allTransactions) {
        logger.log('📊 Processing transactions using OperationsLedger filtering logic...');
        allTransactions.forEach((transaction, index) => {
          // Apply the EXACT same filtering as OperationsLedger
          const filterDoctorName = transaction.patient?.assigned_doctor?.toUpperCase() || '';
          const filterDepartment = transaction.patient?.assigned_department?.toUpperCase() || '';
          
          // Skip only if it's specifically DR HEMANT (not KHAJJA) with ORTHO department
          if (filterDepartment === 'ORTHO' && filterDoctorName === 'DR HEMANT') {
            logger.log('🚫 Excluding transaction (OperationsLedger filter):', transaction.id, filterDoctorName, filterDepartment);
            return; // Skip this specific combination
          }
          
          // 🔍 WHITE-BOX: Bulletproof date processing
          const rawTransactionDate = transaction.transaction_date;
          const rawCreatedAt = transaction.created_at;
          
          // CRITICAL FIX: Use patient.date_of_entry as priority (like ComprehensivePatientList)
          let transactionDateStr;
          if (transaction.patient?.date_of_entry && transaction.patient.date_of_entry.trim() !== '') {
            // Priority 1: Patient's date_of_entry (for backdated entries)
            transactionDateStr = transaction.patient.date_of_entry.includes('T') 
              ? transaction.patient.date_of_entry.split('T')[0] 
              : transaction.patient.date_of_entry;
          } else if (transaction.transaction_date && transaction.transaction_date.trim() !== '') {
            // Priority 2: Transaction's transaction_date
            transactionDateStr = transaction.transaction_date.includes('T') 
              ? transaction.transaction_date.split('T')[0] 
              : transaction.transaction_date;
          } else {
            // Priority 3: Transaction's created_at date
            transactionDateStr = transaction.created_at.split('T')[0];
          }
          
          const enhancedTransaction = {
            ...transaction,
            patientName: `${transaction.patient?.first_name || ''} ${transaction.patient?.last_name || ''}`.trim(),
            displayDate: transactionDateStr,
            // Add patient details for matching OperationsLedger display
            patient_age: transaction.patient?.age,
            patient_gender: transaction.patient?.gender,
            patient_tag: transaction.patient?.patient_tag,
            department: transaction.patient?.assigned_department,
            consultant_name: transaction.patient?.assigned_doctor
          };
          
          // 🔍 WHITE-BOX: Debug EVERY transaction date processing
          if (index < 10) {
            logger.log(`🔍 WHITE-BOX Transaction ${index}:`, {
              id: transaction.id,
              amount: transaction.amount,
              patientName: `${transaction.patient?.first_name} ${transaction.patient?.last_name}`,
              patientDateOfEntry: transaction.patient?.date_of_entry,
              rawTransactionDate,
              rawCreatedAt,
              processedDateStr: transactionDateStr,
              dateSourceUsed: transaction.patient?.date_of_entry ? 'PATIENT_ENTRY_DATE' : 
                             (transaction.transaction_date ? 'TRANSACTION_DATE' : 'CREATED_AT'),
              todayDate,
              weekStartStr,
              monthStartStr,
              dateComparisons: {
                isToday: transactionDateStr === todayDate,
                isThisWeek: transactionDateStr >= weekStartStr && transactionDateStr <= todayDate,
                isThisMonth: transactionDateStr >= monthStartStr && transactionDateStr <= monthEndStr
              }
            });
          }
          
          // Today - exact date match
          if (transactionDateStr === todayDate) {
            periodBreakdown.today.revenue += transaction.amount || 0;
            periodBreakdown.today.transactions.push(enhancedTransaction);
            periodBreakdown.today.count++;
          }
          
          // This Week - last 7 days including today
          if (transactionDateStr >= weekStartStr && transactionDateStr <= todayDate) {
            periodBreakdown.thisWeek.revenue += transaction.amount || 0;
            if (periodBreakdown.thisWeek.transactions.length < 20) {
              periodBreakdown.thisWeek.transactions.push(enhancedTransaction);
            }
            periodBreakdown.thisWeek.count++;
          }
          
          // This Month - current month
          if (transactionDateStr >= monthStartStr && transactionDateStr <= monthEndStr) {
            periodBreakdown.thisMonth.revenue += transaction.amount || 0;
            if (periodBreakdown.thisMonth.transactions.length < 50) {
              periodBreakdown.thisMonth.transactions.push(enhancedTransaction);
            }
            periodBreakdown.thisMonth.count++;
          }
        });
      }
      
      logger.log('📊 Period breakdown calculated:', {
        today: `₹${periodBreakdown.today.revenue} (${periodBreakdown.today.count} records)`,
        thisWeek: `₹${periodBreakdown.thisWeek.revenue} (${periodBreakdown.thisWeek.count} records)`,
        thisMonth: `₹${periodBreakdown.thisMonth.revenue} (${periodBreakdown.thisMonth.count} records)`
      });
      
      // 🔍 WHITE-BOX: Final return value analysis
      const finalTodayRevenue = periodBreakdown.today.revenue;
      logger.log('🔍 WHITE-BOX FINAL RETURN VALUES:', {
        todayRevenueReturned: finalTodayRevenue,
        periodBreakdownToday: periodBreakdown.today,
        willShowInDashboard: {
          mainRevenueCard: finalTodayRevenue,
          breakdownToday: periodBreakdown.today.revenue,
          breakdownThisWeek: periodBreakdown.thisWeek.revenue,
          breakdownThisMonth: periodBreakdown.thisMonth.revenue
        }
      });
      
      logger.log('🔍 Dashboard Stats Debug:', {
        totalPatients,
        todayPatients,
        todayRevenue: periodBreakdown.today.revenue,
        periodBreakdownToday: periodBreakdown.today.count,
        timestamp: new Date().toLocaleTimeString(),
        todayDate: today
      });
      
      // Debug sample transactions from today
      const todayTransactions = allTransactions?.filter(t => {
        const tDate = t.transaction_date 
          ? (t.transaction_date.includes('T') ? t.transaction_date.split('T')[0] : t.transaction_date)
          : t.created_at.split('T')[0];
        return tDate === today;
      }) || [];
      
      logger.log('📊 Today\'s Transactions Sample:', {
        todayDate: today,
        count: todayTransactions.length,
        sampleTransactions: todayTransactions.slice(0, 3).map(t => ({
          id: t.id,
          amount: t.amount,
          transaction_date: t.transaction_date,
          created_at: t.created_at,
          patient: t.patient?.first_name + ' ' + t.patient?.last_name
        }))
      });
      
      // Calculate monthly revenue using transaction-based approach
      const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];
      const endOfMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toISOString().split('T')[0];
      
      logger.log('📋 Calculating monthly revenue from transactions...', { startOfMonth, endOfMonth });
      
      // Calculate monthly revenue from all transactions
      let monthlyRevenue = 0;
      if (allTransactions) {
        allTransactions.forEach(transaction => {
          // Use transaction_date if available, otherwise fall back to created_at
          const transactionDate = transaction.transaction_date 
            ? (transaction.transaction_date.includes('T') ? transaction.transaction_date.split('T')[0] : transaction.transaction_date)
            : transaction.created_at.split('T')[0];
          
          // Only include transactions for current month
          if (transactionDate >= startOfMonth && transactionDate <= endOfMonth) {
            // Exclude ORTHO/DR. HEMANT patients
            if (transaction.patient?.assigned_department === 'ORTHO' || 
                transaction.patient?.assigned_doctor === 'DR. HEMANT') {
              // Skip excluded patients
            } else {
              monthlyRevenue += transaction.amount || 0;
            }
          }
        });
      }

      // Get today's expenses from daily_expenses table
      logger.log('💸 Getting today\'s expenses...', { today });
      const { data: todayExpensesData, error: expenseError } = await supabase
        .from('daily_expenses')
        .select('*')
        .eq('date', today);
      
      if (expenseError) {
        logger.error('❌ Error fetching expenses:', expenseError);
      }
      
      logger.log('💸 Raw expenses data:', { 
        count: todayExpensesData?.length || 0,
        data: todayExpensesData,
        queryDate: today 
      });
      
      const todayExpenses = todayExpensesData?.reduce((sum, expense) => sum + (expense.amount || 0), 0) || 0;
      
      // Calculate expense breakdown by category
      const expensesByCategory: Record<string, number> = {};
      const topExpenses: any[] = [];
      
      todayExpensesData?.forEach(expense => {
        const category = expense.expense_category || 'OTHER';
        expensesByCategory[category] = (expensesByCategory[category] || 0) + expense.amount;
        
        if (topExpenses.length < 10) {
          topExpenses.push(expense);
        }
      });

      logger.log('💸 Today\'s expense calculation:', {
        todayDate: today,
        expenseRecords: todayExpensesData?.length || 0,
        totalExpenses: todayExpenses,
        expensesByCategory
      });
      
      logger.log('💰 Monthly revenue calculation (transaction-based):', {
        startOfMonth,
        endOfMonth,
        finalMonthlyRevenue: monthlyRevenue
      });
      
      return {
        totalPatients,
        totalDoctors,
        totalBeds,
        occupiedBeds: 0, // TODO: Calculate from admissions
        todayRevenue: periodBreakdown.today.revenue, // Use exact today's revenue from period breakdown
        monthlyRevenue,
        todayExpenses, // Add today's expenses field
        todayAppointments,
        pendingAdmissions: 0, // TODO: Calculate from admissions
        patientGrowthRate: 0, // TODO: Calculate growth rate
        revenueGrowthRate: 0, // TODO: Calculate growth rate
        
        // Add detailed breakdown with period data
        details: {
          revenue: {
            total: periodBreakdown.today.revenue, // Use exact today's revenue
            byType: {}, // Could be enhanced later
            byPaymentMode: {}, // Could be enhanced later
            byDepartment: {}, // Could be enhanced later
            topTransactions: [], // Could be enhanced later
            periodBreakdown
          },
          patients: {
            total: totalPatients,
            recentPatients: recentPatients
          },
          appointments: {
            total: todayAppointments,
            recentAppointments: []
          },
          expenses: {
            total: todayExpenses, // Use calculated today's expenses
            byCategory: expensesByCategory,
            topExpenses
          },
          beds: {
            total: totalBeds,
            available: totalBeds, // Simplified
            occupied: 0,
            bedsList: []
          }
        }
      };
      
    } catch (error: any) {
      logger.error('🚨 getDashboardStats error:', error);
      throw error;
    }
  }
  
  static async getDashboardStatsWithDateRange(startDate: string, endDate: string): Promise<any> {
    try {
      logger.log('📊 Getting dashboard stats with date range...');
      logger.log('📅 Date range:', { startDate, endDate });
      
      // Parse dates
      const start = new Date(startDate);
      const end = new Date(endDate);
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
      
      // Get counts in parallel
      const [
        patientsResult,
        patientsData,
        doctorsResult,
        bedsResult,
        bedsData,
        appointmentsResult,
        appointmentsData
      ] = await Promise.all([
        // Patients count in date range
        supabase.from('patients')
          .select('*', { count: 'exact', head: true })
          .eq('hospital_id', HOSPITAL_ID)
          .gte('created_at', start.toISOString())
          .lte('created_at', end.toISOString()),
        
        // Patients details in date range
        supabase.from('patients')
          .select('*')
          .eq('hospital_id', HOSPITAL_ID)
          .gte('created_at', start.toISOString())
          .lte('created_at', end.toISOString())
          .order('created_at', { ascending: false })
          .limit(10),
        
        // Total doctors (not filtered by date)
        supabase.from('users')
          .select('*', { count: 'exact', head: true })
          .eq('hospital_id', HOSPITAL_ID)
          .neq('role', 'ADMIN'),
        
        // Total beds (not filtered by date)
        supabase.from('beds')
          .select('*', { count: 'exact', head: true })
          .eq('hospital_id', HOSPITAL_ID),
        
        // Beds details
        supabase.from('beds')
          .select('*')
          .eq('hospital_id', HOSPITAL_ID),
        
        // Appointments count in date range
        supabase.from('future_appointments')
          .select('*', { count: 'exact', head: true })
          .gte('appointment_date', start.toISOString().split('T')[0])
          .lte('appointment_date', end.toISOString().split('T')[0]),
        
        // Appointments details in date range
        supabase.from('future_appointments')
          .select('*, patient:patients!future_appointments_patient_id_fkey(*), doctor:users!future_appointments_doctor_id_fkey(*)')
          .gte('appointment_date', start.toISOString().split('T')[0])
          .lte('appointment_date', end.toISOString().split('T')[0])
          .order('appointment_date', { ascending: false })
          .limit(10)
      ]);
      
      const totalPatients = patientsResult.count || 0;
      const totalDoctors = doctorsResult.count || 0;
      const totalBeds = bedsResult.count || 0;
      const todayAppointments = appointmentsResult.count || 0;
      
      // Calculate bed statistics
      const availableBeds = bedsData.data?.filter(bed => bed.status === 'AVAILABLE').length || 0;
      const occupiedBeds = bedsData.data?.filter(bed => bed.status === 'OCCUPIED').length || 0;
      
      logger.log('📋 Getting transactions for date range revenue calculation...');
      logger.log('📋 Query parameters:', {
        status: 'COMPLETED',
        start: start.toISOString(),
        end: end.toISOString()
      });
      
      // Get transactions in date range with details - using transaction_date for correct filtering
      const { data: allTransactions, error: transError } = await supabase
        .from('patient_transactions')
        .select('*, patient:patients!patient_transactions_patient_id_fkey(first_name, last_name, assigned_department, assigned_doctor)')
        .eq('hospital_id', HOSPITAL_ID)
        .eq('status', 'COMPLETED')
        .gte('transaction_date', start.toISOString().split('T')[0])
        .lte('transaction_date', end.toISOString().split('T')[0])
        .order('transaction_date', { ascending: false });
      
      if (transError) {
        logger.error('❌ Error fetching transactions:', transError);
      } else {
        logger.log('✅ Transactions fetched:', allTransactions?.length || 0, 'records');
        logger.log('📋 Sample transaction:', allTransactions?.[0]);
      }
      
      // Calculate revenue breakdown by type and time periods
      let totalRevenue = 0;
      let filteredRevenue = 0;
      const revenueByType: Record<string, number> = {};
      const revenueByPaymentMode: Record<string, number> = {};
      const revenueByDepartment: Record<string, number> = {};
      const topTransactions: any[] = [];
      
      // Time period breakdowns - calculate based on the selected date range
      const currentDate = new Date();
      const today = new Date(currentDate);
      today.setHours(0, 0, 0, 0);
      const todayEnd = new Date(today);
      todayEnd.setHours(23, 59, 59, 999);
      
      // This week: last 7 days from current date
      const weekStart = new Date(currentDate);
      weekStart.setDate(currentDate.getDate() - 7);
      weekStart.setHours(0, 0, 0, 0);
      
      // This month: current month
      const monthStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      const monthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0, 23, 59, 59, 999);
      
      logger.log('📅 Period calculations:', {
        today: today.toISOString(),
        todayEnd: todayEnd.toISOString(),
        weekStart: weekStart.toISOString(),
        monthStart: monthStart.toISOString(),
        monthEnd: monthEnd.toISOString(),
        filterStart: start.toISOString(),
        filterEnd: end.toISOString()
      });
      
      const periodBreakdown = {
        today: { revenue: 0, transactions: [], count: 0 },
        thisWeek: { revenue: 0, transactions: [], count: 0 },
        thisMonth: { revenue: 0, transactions: [], count: 0 }
      };
      
      if (allTransactions) {
        logger.log('📋 Processing', allTransactions.length, 'transactions for period breakdown');
        allTransactions.forEach((transaction, index) => {
          // Total revenue (all transactions)
          totalRevenue += transaction.amount || 0;
          
          // Use transaction_date if available, otherwise fall back to created_at
          const transactionDateStr = transaction.transaction_date 
            ? (transaction.transaction_date.includes('T') ? transaction.transaction_date.split('T')[0] : transaction.transaction_date)
            : transaction.created_at.split('T')[0];
          const transactionDate = new Date(transactionDateStr + 'T00:00:00.000Z');
          
          // Debug first few transactions
          if (index < 3) {
            logger.log(`Transaction ${index}:`, {
              id: transaction.id,
              created_at: transaction.created_at,
              transaction_date: transaction.transaction_date,
              used_date: transactionDateStr,
              parsed_date: transactionDate.toISOString(),
              amount: transaction.amount,
              patient_dept: transaction.patient?.assigned_department,
              patient_doctor: transaction.patient?.assigned_doctor
            });
          }
          
          // Filtered revenue (excluding ORTHO/DR. HEMANT)
          if (transaction.patient?.assigned_department !== 'ORTHO' && 
              transaction.patient?.assigned_doctor !== 'DR. HEMANT') {
            filteredRevenue += transaction.amount || 0;
            
            // Revenue by transaction type
            const type = transaction.transaction_type || 'OTHER';
            revenueByType[type] = (revenueByType[type] || 0) + transaction.amount;
            
            // Revenue by payment mode
            const mode = transaction.payment_mode || 'CASH';
            revenueByPaymentMode[mode] = (revenueByPaymentMode[mode] || 0) + transaction.amount;
            
            // Revenue by department
            const dept = transaction.department || 'GENERAL';
            revenueByDepartment[dept] = (revenueByDepartment[dept] || 0) + transaction.amount;
            
            // Enhanced transaction object
            const enhancedTransaction = {
              ...transaction,
              patientName: `${transaction.patient?.first_name || ''} ${transaction.patient?.last_name || ''}`.trim()
            };
            
            // Categorize by time periods (must also be within selected date range)
            // Debug period matching for first transaction
            if (index === 0) {
              logger.log('🕒 Period matching for first transaction:', {
                transactionDate: transactionDate.toISOString(),
                today: today.toISOString(),
                todayEnd: todayEnd.toISOString(),
                weekStart: weekStart.toISOString(),
                monthStart: monthStart.toISOString(),
                monthEnd: monthEnd.toISOString(),
                filterStart: start.toISOString(),
                filterEnd: end.toISOString(),
                matchesToday: (transactionDate >= today && transactionDate <= todayEnd && transactionDate >= start && transactionDate <= end),
                matchesWeek: (transactionDate >= weekStart && transactionDate <= end && transactionDate >= start),
                matchesMonth: (transactionDate >= monthStart && transactionDate <= monthEnd && transactionDate >= start && transactionDate <= end)
              });
            }
            
            // Today: transactions from today that are also within the selected range
            if (transactionDate >= today && transactionDate <= todayEnd && 
                transactionDate >= start && transactionDate <= end) {
              periodBreakdown.today.revenue += transaction.amount || 0;
              periodBreakdown.today.transactions.push(enhancedTransaction);
              periodBreakdown.today.count++;
              if (index < 3) logger.log('✅ Added to TODAY:', transaction.id, transaction.amount);
            }
            
            // This Week: transactions from last 7 days that are also within the selected range
            if (transactionDate >= weekStart && transactionDate <= end &&
                transactionDate >= start) {
              periodBreakdown.thisWeek.revenue += transaction.amount || 0;
              if (periodBreakdown.thisWeek.transactions.length < 20) {
                periodBreakdown.thisWeek.transactions.push(enhancedTransaction);
              }
              periodBreakdown.thisWeek.count++;
              if (index < 3) logger.log('✅ Added to WEEK:', transaction.id, transaction.amount);
            }
            
            // This Month: transactions from current month that are also within the selected range
            if (transactionDate >= monthStart && transactionDate <= monthEnd &&
                transactionDate >= start && transactionDate <= end) {
              periodBreakdown.thisMonth.revenue += transaction.amount || 0;
              if (periodBreakdown.thisMonth.transactions.length < 50) {
                periodBreakdown.thisMonth.transactions.push(enhancedTransaction);
              }
              periodBreakdown.thisMonth.count++;
              if (index < 3) logger.log('✅ Added to MONTH:', transaction.id, transaction.amount);
            }
            
            // Keep top 10 transactions overall
            if (topTransactions.length < 10) {
              topTransactions.push(enhancedTransaction);
            }
          }
        });
      }
      
      logger.log('💰 Date range revenue calculation:', {
        startDate: start.toISOString(),
        endDate: end.toISOString(),
        totalRevenue,
        filteredRevenue,
        periodBreakdown: {
          today: `₹${periodBreakdown.today.revenue} (${periodBreakdown.today.count} records)`,
          thisWeek: `₹${periodBreakdown.thisWeek.revenue} (${periodBreakdown.thisWeek.count} records)`,
          thisMonth: `₹${periodBreakdown.thisMonth.revenue} (${periodBreakdown.thisMonth.count} records)`
        }
      });
      
      // Get daily expenses for the date range with details
      const { data: expensesData } = await supabase
        .from('daily_expenses')
        .select('*')
        .gte('date', start.toISOString().split('T')[0])
        .lte('date', end.toISOString().split('T')[0])
        .order('date', { ascending: false });
      
      const totalExpenses = expensesData?.reduce((sum, expense) => sum + (expense.amount || 0), 0) || 0;
      
      // Calculate expense breakdown by category
      const expensesByCategory: Record<string, number> = {};
      const topExpenses: any[] = [];
      
      expensesData?.forEach(expense => {
        const category = expense.expense_category || 'OTHER';
        expensesByCategory[category] = (expensesByCategory[category] || 0) + expense.amount;
        
        if (topExpenses.length < 10) {
          topExpenses.push(expense);
        }
      });
      
      return {
        // Basic stats
        totalPatients,
        totalDoctors,
        totalBeds,
        occupiedBeds,
        todayRevenue: filteredRevenue,
        monthlyRevenue: filteredRevenue,
        todayExpenses: totalExpenses,
        todayAppointments,
        pendingAdmissions: 0,
        patientGrowthRate: 0,
        revenueGrowthRate: 0,
        availableBeds,
        
        // Detailed breakdowns
        details: {
          revenue: {
            total: filteredRevenue,
            byType: revenueByType,
            byPaymentMode: revenueByPaymentMode,
            byDepartment: revenueByDepartment,
            topTransactions,
            periodBreakdown
          },
          patients: {
            total: totalPatients,
            recentPatients: patientsData.data || []
          },
          appointments: {
            total: todayAppointments,
            recentAppointments: appointmentsData.data || []
          },
          expenses: {
            total: totalExpenses,
            byCategory: expensesByCategory,
            topExpenses
          },
          beds: {
            total: totalBeds,
            available: availableBeds,
            occupied: occupiedBeds,
            bedsList: bedsData.data || []
          }
        }
      };
      
    } catch (error: any) {
      logger.error('🚨 getDashboardStatsWithDateRange error:', error);
      throw error;
    }
  }
  
  // ==================== UTILITY OPERATIONS ====================
  
  static async testConnection(): Promise<{ success: boolean; message: string; user?: User | null }> {
    try {
      logger.log('🧪 Testing Supabase connection...');
      
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
      logger.log('📊 Loading patient transactions for discharge billing...');
      
      const { data, error } = await supabase
        .from('patient_transactions')
        .select('*')
        .eq('patient_id', patientId)
        .eq('status', 'COMPLETED')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      logger.log(`✅ Loaded ${data?.length || 0} completed transactions`);
      return data || [];
      
    } catch (error: any) {
      logger.error('❌ Error loading patient transactions:', error);
      throw error;
    }
  }
  
  static async createDischargeSummary(summaryData: any) {
    try {
      logger.log('📝 Creating discharge summary...');
      
      const { data, error } = await supabase
        .from('discharge_summaries')
        .insert(summaryData)
        .select()
        .single();
      
      if (error) throw error;
      
      logger.log('✅ Discharge summary created successfully');
      return data;
      
    } catch (error: any) {
      logger.error('❌ Error creating discharge summary:', error);
      throw error;
    }
  }
  
  static async createDischargeBill(billData: any) {
    try {
      logger.log('💰 Creating discharge bill...');
      
      const { data, error } = await supabase
        .from('discharge_bills')
        .insert(billData)
        .select()
        .single();
      
      if (error) throw error;
      
      logger.log('✅ Discharge bill created successfully');
      return data;
      
    } catch (error: any) {
      logger.error('❌ Error creating discharge bill:', error);
      throw error;
    }
  }
  
  static async getDischargeHistory(patientId: string) {
    try {
      logger.log('📋 Loading discharge history...');
      
      const { data, error } = await supabase
        .from('discharge_summaries')
        .select(`
          *,
          bill:discharge_bills(*),
          created_by_user:users(id, email, first_name, last_name)
        `)
        .eq('patient_id', patientId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      logger.log(`✅ Loaded ${data?.length || 0} discharge records`);
      return data || [];
      
    } catch (error: any) {
      logger.error('❌ Error loading discharge history:', error);
      throw error;
    }
  }
  
  static async getDischargeSummaryWithBill(admissionId: string) {
    try {
      logger.log('📄 Loading complete discharge record for admission:', admissionId);
      
      // First try the full query with bills
      const { data, error } = await supabase
        .from('discharge_summaries')
        .select(`
          *,
          bill:discharge_bills(*),
          patient:patients(*),
          created_by_user:users(id, email, first_name, last_name)
        `)
        .eq('admission_id', admissionId)
        .single();
      
      if (error) {
        logger.warn('⚠️ Full query failed, trying simplified query:', error);
        
        // Fallback: try without discharge_bills table
        const { data: simplifiedData, error: simplifiedError } = await supabase
          .from('discharge_summaries')
          .select(`
            *,
            patient:patients(*)
          `)
          .eq('admission_id', admissionId)
          .single();
        
        if (simplifiedError) {
          logger.error('❌ Simplified query also failed:', simplifiedError);
          throw simplifiedError;
        }
        
        logger.log('✅ Simplified discharge record loaded');
        return simplifiedData;
      }
      
      logger.log('✅ Complete discharge record loaded');
      return data;
      
    } catch (error: any) {
      logger.error('❌ Error loading discharge record:', error);
      logger.error('Error details:', JSON.stringify(error, null, 2));
      throw error;
    }
  }

  static async getDischargedAdmissions() {
    try {
      logger.log('📋 Loading discharged admissions...');
      
      const { data, error } = await supabase
        .from('patient_admissions')
        .select(`
          *,
          patient:patients(*),
          bed:beds(*)
        `)
        .eq('status', 'DISCHARGED')
        .eq('hospital_id', HOSPITAL_ID)
        .order('updated_at', { ascending: false });
      
      if (error) {
        logger.warn('⚠️ Full query failed, trying simplified query:', error);
        
        // Fallback: try without relationships
        const { data: simplifiedData, error: simplifiedError } = await supabase
          .from('patient_admissions')
          .select('*')
          .eq('status', 'DISCHARGED')
          .eq('hospital_id', HOSPITAL_ID)
          .order('updated_at', { ascending: false });
        
        if (simplifiedError) {
          logger.error('❌ Simplified query also failed:', simplifiedError);
          throw simplifiedError;
        }
        
        logger.log('✅ Simplified discharged admissions loaded');
        return simplifiedData || [];
      }
      
      logger.log(`✅ Loaded ${data?.length || 0} discharged admissions`);
      return data || [];
      
    } catch (error: any) {
      logger.error('❌ Error loading discharged admissions:', error);
      throw error;
    }
  }

  static async getDischargeSummary(admissionId: string) {
    try {
      logger.log('📄 Loading discharge summary for admission:', admissionId);
      
      const { data, error } = await supabase
        .from('discharge_summaries')
        .select('*')
        .eq('admission_id', admissionId)
        .single();
      
      if (error) {
        logger.warn('⚠️ No discharge summary found:', error);
        return null;
      }
      
      logger.log('✅ Discharge summary loaded');
      return data;
      
    } catch (error: any) {
      logger.error('❌ Error loading discharge summary:', error);
      return null;
    }
  }

  static async createAdmission(admissionData: any) {
    try {
      logger.log('🏥 Creating admission record:', admissionData);
      
      // First, let's try to get the table schema to understand what fields are required
      logger.log('📊 Attempting to understand table structure...');
      
      // Try to fetch one record to see the structure
      const { data: sampleRecord, error: sampleError } = await supabase
        .from('patient_admissions')
        .select('*')
        .limit(1);
        
      if (sampleRecord && sampleRecord.length > 0) {
        logger.log('📋 Sample admission record structure:', Object.keys(sampleRecord[0]));
      }
      
      // Now try to insert
      const { data, error } = await supabase
        .from('patient_admissions')
        .insert(admissionData)
        .select()
        .single();
      
      if (error) {
        logger.error('❌ Error creating admission:');
        logger.error('Error code:', error.code);
        logger.error('Error message:', error.message);
        logger.error('Error details:', error.details);
        logger.error('Error hint:', error.hint);
        logger.error('Full error object:', JSON.stringify(error, null, 2));
        
        // If it's a not-null constraint error, log which field is missing
        if (error.code === '23502') {
          logger.error('🚨 MISSING REQUIRED FIELD:', error.message);
        }
        
        throw error;
      }
      
      logger.log('✅ Admission record created successfully:', data);
      return data;
      
    } catch (error: any) {
      logger.error('❌ Error creating admission:', error);
      throw error;
    }
  }

  static async verifyAdmissionExists(admissionId: string) {
    try {
      logger.log('🔍 Verifying admission exists:', admissionId);
      
      const { data, error } = await supabase
        .from('patient_admissions')
        .select('*')
        .eq('id', admissionId)
        .single();
      
      if (error) {
        logger.error('❌ Admission verification failed:', error);
        return false;
      }
      
      logger.log('✅ Admission found:', data);
      return true;
      
    } catch (error: any) {
      logger.error('❌ Error verifying admission:', error);
      return false;
    }
  }

  static async createMissingAdmissionRecord(patientId: string, bedId: string, admissionDate?: string, bedNumber?: number) {
    try {
      logger.log('🆘 Creating missing admission record for patient:', patientId);
      
      const admissionData = {
        patient_id: patientId,
        // bed_id removed - it requires a valid bed record in beds table
        bed_number: bedNumber || 1, // Add bed number, default to 1 if not provided
        room_type: 'GENERAL', // Add room type field
        department: 'GENERAL', // Add department field
        admission_date: admissionDate || new Date().toISOString(),
        status: 'ADMITTED' as const,
        hospital_id: HOSPITAL_ID
        // Removed fields that don't exist: admission_reason, treating_doctor, ipd_number, bed_id
      };

      const { data, error } = await supabase
        .from('patient_admissions')
        .insert(admissionData)
        .select()
        .single();
      
      if (error) {
        logger.error('❌ Error creating missing admission:', error);
        throw error;
      }
      
      logger.log('✅ Missing admission record created:', data);
      return data;
      
    } catch (error: any) {
      logger.error('❌ Error creating missing admission:', error);
      throw error;
    }
  }

  // ==================== CUSTOM INVESTIGATIONS ====================
  
  static async getCustomInvestigations(): Promise<any[]> {
    try {
      logger.log('📋 Getting custom investigations...');
      
      const { data: investigations, error } = await supabase
        .from('custom_investigations')
        .select('*')
        .eq('hospital_id', HOSPITAL_ID)
        .eq('is_active', true)
        .order('name', { ascending: true });
      
      if (error) {
        logger.error('❌ Get custom investigations error:', error);
        throw new Error(`Failed to get custom investigations: ${error.message}`);
      }
      
      logger.log('✅ Custom investigations retrieved:', investigations?.length || 0);
      return investigations || [];
      
    } catch (error: any) {
      logger.error('🚨 getCustomInvestigations error:', error);
      throw error;
    }
  }

  static async addCustomInvestigation(name: string, description?: string, category?: string): Promise<any> {
    try {
      logger.log('📋 Adding custom investigation:', name);
      
      const investigationData = {
        name: name.trim(),
        description: description?.trim() || '',
        category: category?.trim() || 'General',
        hospital_id: HOSPITAL_ID,
        created_by: 'user',
        is_active: true
      };
      
      const { data: investigation, error } = await supabase
        .from('custom_investigations')
        .insert(investigationData)
        .select()
        .single();
      
      if (error) {
        // Handle duplicate name error
        if (error.code === '23505') {
          logger.log('⚠️ Investigation already exists:', name);
          // Return existing investigation
          const { data: existing } = await supabase
            .from('custom_investigations')
            .select('*')
            .eq('name', name)
            .eq('hospital_id', HOSPITAL_ID)
            .single();
          return existing;
        }
        logger.error('❌ Add custom investigation error:', error);
        throw new Error(`Failed to add custom investigation: ${error.message}`);
      }
      
      logger.log('✅ Custom investigation added successfully');
      return investigation;
      
    } catch (error: any) {
      logger.error('🚨 addCustomInvestigation error:', error);
      throw error;
    }
  }

  static async deleteCustomInvestigation(id: string): Promise<void> {
    try {
      logger.log('🗑️ Deleting custom investigation:', id);
      
      const { error } = await supabase
        .from('custom_investigations')
        .update({ is_active: false })
        .eq('id', id)
        .eq('hospital_id', HOSPITAL_ID);
      
      if (error) {
        logger.error('❌ Delete custom investigation error:', error);
        throw new Error(`Failed to delete custom investigation: ${error.message}`);
      }
      
      logger.log('✅ Custom investigation deleted successfully');
      
    } catch (error: any) {
      logger.error('🚨 deleteCustomInvestigation error:', error);
      throw error;
    }
  }

  // ==================== CUSTOM PAIN COMPLAINTS ====================
  
  static async getPainComplaints(): Promise<any[]> {
    try {
      logger.log('🩹 Getting pain complaints...');
      
      const { data: complaints, error } = await supabase
        .from('custom_pain_complaints')
        .select('*')
        .eq('hospital_id', HOSPITAL_ID)
        .eq('is_active', true)
        .order('name', { ascending: true });
      
      if (error) {
        logger.error('❌ Get pain complaints error:', error);
        throw new Error(`Failed to get pain complaints: ${error.message}`);
      }
      
      logger.log('✅ Pain complaints retrieved:', complaints?.length || 0);
      return complaints || [];
      
    } catch (error: any) {
      logger.error('🚨 getPainComplaints error:', error);
      throw error;
    }
  }

  static async addPainComplaint(name: string): Promise<any> {
    try {
      logger.log('🩹 Adding pain complaint:', name);
      
      const complaintData = {
        name: name.trim(),
        hospital_id: HOSPITAL_ID,
        created_by: 'user',
        is_active: true
      };
      
      const { data: complaint, error } = await supabase
        .from('custom_pain_complaints')
        .insert(complaintData)
        .select()
        .single();
      
      if (error) {
        if (error.code === '23505') {
          logger.log('⚠️ Pain complaint already exists:', name);
          const { data: existing } = await supabase
            .from('custom_pain_complaints')
            .select('*')
            .eq('name', name)
            .eq('hospital_id', HOSPITAL_ID)
            .single();
          return existing;
        }
        logger.error('❌ Add pain complaint error:', error);
        throw new Error(`Failed to add pain complaint: ${error.message}`);
      }
      
      logger.log('✅ Pain complaint added successfully');
      return complaint;
      
    } catch (error: any) {
      logger.error('🚨 addPainComplaint error:', error);
      throw error;
    }
  }

  // ==================== CUSTOM LOCATIONS ====================
  
  static async getLocations(): Promise<any[]> {
    try {
      logger.log('📍 Getting locations...');
      
      const { data: locations, error } = await supabase
        .from('custom_locations')
        .select('*')
        .eq('hospital_id', HOSPITAL_ID)
        .eq('is_active', true)
        .order('name', { ascending: true });
      
      if (error) {
        logger.error('❌ Get locations error:', error);
        throw new Error(`Failed to get locations: ${error.message}`);
      }
      
      logger.log('✅ Locations retrieved:', locations?.length || 0);
      return locations || [];
      
    } catch (error: any) {
      logger.error('🚨 getLocations error:', error);
      throw error;
    }
  }

  static async addLocation(name: string): Promise<any> {
    try {
      logger.log('📍 Adding location:', name);
      
      const locationData = {
        name: name.trim(),
        hospital_id: HOSPITAL_ID,
        created_by: 'user',
        is_active: true
      };
      
      const { data: location, error } = await supabase
        .from('custom_locations')
        .insert(locationData)
        .select()
        .single();
      
      if (error) {
        if (error.code === '23505') {
          logger.log('⚠️ Location already exists:', name);
          const { data: existing } = await supabase
            .from('custom_locations')
            .select('*')
            .eq('name', name)
            .eq('hospital_id', HOSPITAL_ID)
            .single();
          return existing;
        }
        logger.error('❌ Add location error:', error);
        throw new Error(`Failed to add location: ${error.message}`);
      }
      
      logger.log('✅ Location added successfully');
      return location;
      
    } catch (error: any) {
      logger.error('🚨 addLocation error:', error);
      throw error;
    }
  }

  // ==================== PRESCRIPTION MANAGEMENT ====================
  
  static async savePrescription(prescriptionData: any): Promise<any> {
    try {
      logger.log('💊 Saving prescription...', prescriptionData);
      
      const prescriptionRecord = {
        patient_id: prescriptionData.patient_id,
        patient_name: prescriptionData.patient_name,
        doctor_name: prescriptionData.doctor_name,
        department: prescriptionData.department,
        hospital_id: HOSPITAL_ID,
        chief_complaints: prescriptionData.chief_complaints,
        present_history: prescriptionData.present_history,
        past_history: prescriptionData.past_history,
        drug_history: prescriptionData.drug_history,
        local_examination: prescriptionData.local_examination,
        investigations: prescriptionData.investigations,
        investigation_reference: prescriptionData.investigation_reference,
        general_advise: prescriptionData.general_advise,
        medical_advise: prescriptionData.medical_advise,
        created_by: 'user',
        is_active: true
      };
      
      const { data: prescription, error } = await supabase
        .from('prescriptions')
        .insert(prescriptionRecord)
        .select()
        .single();
      
      if (error) {
        logger.error('❌ Save prescription error:', error);
        throw new Error(`Failed to save prescription: ${error.message}`);
      }
      
      logger.log('✅ Prescription saved successfully');
      return prescription;
      
    } catch (error: any) {
      logger.error('🚨 savePrescription error:', error);
      throw error;
    }
  }

  static async getPrescriptions(patientId: string): Promise<any[]> {
    try {
      logger.log('📋 Getting prescriptions for patient:', patientId);
      
      const { data: prescriptions, error } = await supabase
        .from('prescriptions')
        .select('*')
        .eq('patient_id', patientId)
        .eq('hospital_id', HOSPITAL_ID)
        .eq('is_active', true)
        .order('created_at', { ascending: false });
      
      if (error) {
        logger.error('❌ Get prescriptions error:', error);
        throw new Error(`Failed to get prescriptions: ${error.message}`);
      }
      
      logger.log('✅ Prescriptions retrieved:', prescriptions?.length || 0);
      return prescriptions || [];
      
    } catch (error: any) {
      logger.error('🚨 getPrescriptions error:', error);
      throw error;
    }
  }

  static async updatePrescription(id: string, prescriptionData: any): Promise<any> {
    try {
      logger.log('🔄 Updating prescription:', id);
      
      const updateData = {
        chief_complaints: prescriptionData.chief_complaints,
        present_history: prescriptionData.present_history,
        past_history: prescriptionData.past_history,
        drug_history: prescriptionData.drug_history,
        local_examination: prescriptionData.local_examination,
        investigations: prescriptionData.investigations,
        investigation_reference: prescriptionData.investigation_reference,
        general_advise: prescriptionData.general_advise,
        medical_advise: prescriptionData.medical_advise,
        updated_at: new Date().toISOString()
      };
      
      const { data: prescription, error } = await supabase
        .from('prescriptions')
        .update(updateData)
        .eq('id', id)
        .eq('hospital_id', HOSPITAL_ID)
        .select()
        .single();
      
      if (error) {
        logger.error('❌ Update prescription error:', error);
        throw new Error(`Failed to update prescription: ${error.message}`);
      }
      
      logger.log('✅ Prescription updated successfully');
      return prescription;
      
    } catch (error: any) {
      logger.error('🚨 updatePrescription error:', error);
      throw error;
    }
  }

  static async deletePrescription(id: string): Promise<void> {
    try {
      logger.log('🗑️ Deleting prescription:', id);
      
      const { error } = await supabase
        .from('prescriptions')
        .update({ is_active: false })
        .eq('id', id)
        .eq('hospital_id', HOSPITAL_ID);
      
      if (error) {
        logger.error('❌ Delete prescription error:', error);
        throw new Error(`Failed to delete prescription: ${error.message}`);
      }
      
      logger.log('✅ Prescription deleted successfully');
      
    } catch (error: any) {
      logger.error('🚨 deletePrescription error:', error);
      throw error;
    }
  }
}

export default HospitalService;
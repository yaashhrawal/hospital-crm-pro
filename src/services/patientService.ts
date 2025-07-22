import { supabase } from '../config/supabase';
import type { Patient } from '../types/index';

export interface CreatePatientData {
  first_name: string;
  last_name?: string;
  phone?: string;
  address?: string;
  gender?: 'MALE' | 'FEMALE' | 'OTHER';
  date_of_birth?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  email?: string;
  is_active?: boolean;
}

export class PatientService {
  
  /**
   * Create a new patient with robust error handling
   */
  static async createPatient(patientData: CreatePatientData): Promise<Patient> {
    console.log('🏥 PatientService: Creating patient with data:', patientData);
    
    try {
      // Prepare data with defaults
      const cleanedData = {
        first_name: patientData.first_name?.trim() || '',
        last_name: patientData.last_name?.trim() || '',
        phone: patientData.phone?.trim() || '',
        address: patientData.address?.trim() || '',
        gender: patientData.gender || 'MALE',
        date_of_birth: patientData.date_of_birth || null,
        emergency_contact_name: patientData.emergency_contact_name?.trim() || '',
        emergency_contact_phone: patientData.emergency_contact_phone?.trim() || '',
        email: patientData.email?.trim() || null,
        is_active: patientData.is_active !== false, // Default to true
      };

      // Remove empty strings and replace with null for optional fields
      const finalData = Object.fromEntries(
        Object.entries(cleanedData).map(([key, value]) => [
          key,
          value === '' && !['first_name', 'gender', 'is_active'].includes(key) ? null : value
        ])
      );

      console.log('📤 Sending cleaned data to Supabase:', finalData);

      // Insert into Supabase
      const { data, error } = await supabase
        .from('patients')
        .insert([finalData])
        .select()
        .single();

      if (error) {
        console.error('❌ Supabase insert error:', error);
        throw new Error(`Database error: ${error.message}`);
      }

      if (!data) {
        throw new Error('No data returned from patient creation');
      }

      console.log('✅ Patient created successfully:', data);
      return data as Patient;

    } catch (error: any) {
      console.error('🚨 PatientService error:', error);
      
      // Provide user-friendly error messages
      if (error.message?.includes('duplicate key')) {
        throw new Error('A patient with this information already exists');
      } else if (error.message?.includes('not null violation')) {
        throw new Error('Missing required patient information');
      } else if (error.message?.includes('foreign key')) {
        throw new Error('Invalid reference data provided');
      } else if (error.message?.includes('permission denied') || error.message?.includes('RLS')) {
        throw new Error('Database permission error - please check your login status');
      } else {
        throw new Error(`Failed to create patient: ${error.message}`);
      }
    }
  }

  /**
   * Test database connection and permissions
   */
  static async testConnection(): Promise<{ success: boolean; message: string; details?: any }> {
    try {
      console.log('🧪 Testing Supabase connection and permissions...');

      // Test basic read access
      const { data, error } = await supabase
        .from('patients')
        .select('count')
        .limit(1);

      if (error) {
        return {
          success: false,
          message: `Database access failed: ${error.message}`,
          details: error
        };
      }

      // Test authentication
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError) {
        return {
          success: false,
          message: `Authentication check failed: ${authError.message}`,
          details: authError
        };
      }

      if (!user) {
        return {
          success: false,
          message: 'No authenticated user found'
        };
      }

      return {
        success: true,
        message: `Connection successful. User: ${user.email}`,
        details: { user: user.email, hasTableAccess: true }
      };

    } catch (error: any) {
      return {
        success: false,
        message: `Connection test failed: ${error.message}`,
        details: error
      };
    }
  }
}

export default PatientService;
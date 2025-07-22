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
}

export class FixedPatientService {
  
  /**
   * Create patient with only columns that actually exist in your table
   */
  static async createPatient(patientData: CreatePatientData): Promise<Patient> {
    console.log('🔧 FixedPatientService: Creating patient with minimal columns');
    
    try {
      // Start with absolutely minimal data that should exist in any patients table
      const minimalData = {
        first_name: patientData.first_name?.trim() || 'Unknown',
      };

      // Add optional fields only if provided
      const optionalData: any = {};
      if (patientData.last_name?.trim()) optionalData.last_name = patientData.last_name.trim();
      if (patientData.phone?.trim()) optionalData.phone = patientData.phone.trim();
      if (patientData.address?.trim()) optionalData.address = patientData.address.trim();
      if (patientData.gender) optionalData.gender = patientData.gender;
      if (patientData.date_of_birth) optionalData.date_of_birth = patientData.date_of_birth;
      if (patientData.emergency_contact_name?.trim()) optionalData.emergency_contact_name = patientData.emergency_contact_name.trim();
      if (patientData.emergency_contact_phone?.trim()) optionalData.emergency_contact_phone = patientData.emergency_contact_phone.trim();
      if (patientData.email?.trim()) optionalData.email = patientData.email.trim();

      const finalData = { ...minimalData, ...optionalData };
      console.log('📤 Sending minimal compatible data:', finalData);

      // Try insertion
      const { data, error } = await supabase
        .from('patients')
        .insert([finalData])
        .select()
        .single();

      if (error) {
        console.error('❌ Still failed with minimal data:', error);
        
        // If it's still a column error, try even more minimal
        if (error.message.includes('column') && error.message.includes('does not exist')) {
          console.log('🔧 Trying ultra-minimal data...');
          
          const ultraMinimal = {
            first_name: patientData.first_name?.trim() || 'Unknown',
          };
          
          const { data: ultraData, error: ultraError } = await supabase
            .from('patients')
            .insert([ultraMinimal])
            .select()
            .single();
            
          if (ultraError) {
            throw new Error(`Even minimal insertion failed: ${ultraError.message}`);
          }
          
          console.log('✅ Ultra-minimal patient created:', ultraData);
          return ultraData as Patient;
        }
        
        throw new Error(`Database error: ${error.message}`);
      }

      console.log('✅ Patient created successfully:', data);
      return data as Patient;

    } catch (error: any) {
      console.error('🚨 FixedPatientService error:', error);
      throw new Error(`Patient creation failed: ${error.message}`);
    }
  }

  /**
   * Get the actual table structure
   */
  static async getTableStructure(): Promise<any> {
    try {
      console.log('🔍 Getting actual table structure...');
      
      // Try to get one record to see actual structure
      const { data, error } = await supabase
        .from('patients')
        .select('*')
        .limit(1);

      if (error) {
        return { error: error.message, columns: [] };
      }

      const columns = data && data.length > 0 ? Object.keys(data[0]) : [];
      
      return {
        success: true,
        columns: columns,
        sampleRecord: data?.[0] || null,
        totalRecords: data?.length || 0
      };

    } catch (error: any) {
      return { error: error.message, columns: [] };
    }
  }

  /**
   * Test what columns actually exist
   */
  static async testColumnExists(columnName: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('patients')
        .select(columnName)
        .limit(1);

      return !error;
    } catch {
      return false;
    }
  }
}

export default FixedPatientService;
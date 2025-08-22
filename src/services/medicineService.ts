import { supabase } from '../config/supabase';

export interface Medicine {
  id: string;
  name: string;
  generic_name?: string;
  brand_name?: string;
  category: string;
  dosage_form?: string;
  strength?: string;
  manufacturer?: string;
  is_active: boolean;
  is_custom: boolean;
  usage_count: number;
  created_at: string;
  updated_at: string;
  created_by?: string;
}

export interface CreateMedicineData {
  name: string;
  generic_name?: string;
  brand_name?: string;
  category?: string;
  dosage_form?: string;
  strength?: string;
  manufacturer?: string;
  is_custom?: boolean;
}

class MedicineService {
  /**
   * Get all active medicines with search functionality
   */
  async getMedicines(searchTerm?: string): Promise<Medicine[]> {
    try {
      let query = supabase
        .from('medicines')
        .select('*')
        .eq('is_active', true)
        .order('usage_count', { ascending: false })
        .order('name', { ascending: true });

      if (searchTerm) {
        query = query.ilike('name', `%${searchTerm}%`);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching medicines:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Exception in getMedicines:', error);
      throw error;
    }
  }

  /**
   * Search medicines by name (for dropdown filtering)
   */
  async searchMedicines(searchTerm: string, limit = 50): Promise<Medicine[]> {
    try {
      const { data, error } = await supabase
        .from('medicines')
        .select('*')
        .eq('is_active', true)
        .ilike('name', `%${searchTerm}%`)
        .order('usage_count', { ascending: false })
        .order('name', { ascending: true })
        .limit(limit);

      if (error) {
        console.error('Error searching medicines:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Exception in searchMedicines:', error);
      throw error;
    }
  }

  /**
   * Get most used medicines (for quick access)
   */
  async getPopularMedicines(limit = 20): Promise<Medicine[]> {
    try {
      const { data, error } = await supabase
        .from('medicines')
        .select('*')
        .eq('is_active', true)
        .order('usage_count', { ascending: false })
        .order('name', { ascending: true })
        .limit(limit);

      if (error) {
        console.error('Error fetching popular medicines:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Exception in getPopularMedicines:', error);
      throw error;
    }
  }

  /**
   * Create a new medicine (auto-save custom entries)
   */
  async createMedicine(medicineData: CreateMedicineData): Promise<Medicine> {
    try {
      const { data, error } = await supabase
        .from('medicines')
        .insert({
          ...medicineData,
          category: medicineData.category || 'general',
          is_custom: medicineData.is_custom || true,
          usage_count: 1
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating medicine:', error);
        throw error;
      }

      console.log('✅ Medicine created successfully:', data);
      return data;
    } catch (error) {
      console.error('Exception in createMedicine:', error);
      throw error;
    }
  }

  /**
   * Increment usage count for a medicine
   */
  async incrementUsageCount(medicineId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('medicines')
        .update({
          usage_count: supabase.raw('usage_count + 1'),
          updated_at: new Date().toISOString()
        })
        .eq('id', medicineId);

      if (error) {
        console.error('Error incrementing usage count:', error);
        // Don't throw error for usage count update failures
      }
    } catch (error) {
      console.error('Exception in incrementUsageCount:', error);
      // Don't throw error for usage count update failures
    }
  }

  /**
   * Check if medicine exists by name
   */
  async medicineExists(name: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('medicines')
        .select('id')
        .ilike('name', name)
        .eq('is_active', true)
        .limit(1);

      if (error) {
        console.error('Error checking medicine existence:', error);
        return false;
      }

      return data && data.length > 0;
    } catch (error) {
      console.error('Exception in medicineExists:', error);
      return false;
    }
  }

  /**
   * Get medicine by name (case insensitive)
   */
  async getMedicineByName(name: string): Promise<Medicine | null> {
    try {
      const { data, error } = await supabase
        .from('medicines')
        .select('*')
        .ilike('name', name)
        .eq('is_active', true)
        .limit(1);

      if (error) {
        console.error('Error fetching medicine by name:', error);
        throw error;
      }

      return data && data.length > 0 ? data[0] : null;
    } catch (error) {
      console.error('Exception in getMedicineByName:', error);
      throw error;
    }
  }

  /**
   * Update medicine
   */
  async updateMedicine(id: string, updates: Partial<CreateMedicineData>): Promise<Medicine> {
    try {
      const { data, error } = await supabase
        .from('medicines')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error updating medicine:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Exception in updateMedicine:', error);
      throw error;
    }
  }

  /**
   * Deactivate medicine (soft delete)
   */
  async deactivateMedicine(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('medicines')
        .update({
          is_active: false,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) {
        console.error('Error deactivating medicine:', error);
        throw error;
      }
    } catch (error) {
      console.error('Exception in deactivateMedicine:', error);
      throw error;
    }
  }

  /**
   * Get medicines by category
   */
  async getMedicinesByCategory(category: string): Promise<Medicine[]> {
    try {
      const { data, error } = await supabase
        .from('medicines')
        .select('*')
        .eq('is_active', true)
        .eq('category', category)
        .order('usage_count', { ascending: false })
        .order('name', { ascending: true });

      if (error) {
        console.error('Error fetching medicines by category:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Exception in getMedicinesByCategory:', error);
      throw error;
    }
  }
}

export const medicineService = new MedicineService();
export default medicineService;
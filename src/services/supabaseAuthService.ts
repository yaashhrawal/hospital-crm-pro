// Supabase Authentication Service for Hospital CRM
import { supabase } from '../config/supabase';
import type { User, AuthUser as ImportedAuthUser } from '../types/index';
import type { AuthUser as DatabaseAuthUser } from '../types/api';

export interface AuthUser {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: 'ADMIN' | 'DOCTOR' | 'NURSE' | 'STAFF' | 'admin' | 'doctor' | 'staff';
  is_active: boolean;
  [key: string]: any;
}

class SupabaseAuthService {
  /**
   * Sign up new user (for admin use)
   */
  async signUp(email: string, password: string, userData: {
    first_name: string;
    last_name: string;
    role: 'ADMIN' | 'DOCTOR' | 'NURSE' | 'STAFF';
  }) {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            first_name: userData.first_name,
            last_name: userData.last_name,
            role: userData.role,
          }
        }
      });

      if (error) throw error;

      // Create user profile in users table
      if (data.user) {
        const { error: profileError } = await supabase
          .from('users')
          .insert({
            id: data.user.id,
            email: data.user.email!,
            first_name: userData.first_name,
            last_name: userData.last_name,
            role: userData.role,
            is_active: true,
          });

        if (profileError) {
          console.error('Profile creation error:', profileError);
        }
      }

      return { data, error: null };
    } catch (error) {
      return { data: null, error: error as Error };
    }
  }

  /**
   * Sign in existing user
   */
  async signIn(email: string, password: string): Promise<{ user: AuthUser | null; error: Error | null }> {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      if (data.user) {
        // Get user profile from users table
        const { data: profile, error: profileError } = await supabase
          .from('users')
          .select('*')
          .eq('id', data.user.id)
          .single();

        if (profileError) {
          // Create profile for any authenticated user
          console.log('Creating user profile for:', email);
          
          // Determine user role and details
          const isAdmin = email === 'admin@hospital.com';
          const userProfile = {
            id: data.user.id,
            email: data.user.email!,
            first_name: isAdmin ? 'Admin' : data.user.user_metadata?.first_name || 'User',
            last_name: isAdmin ? 'User' : data.user.user_metadata?.last_name || 'Staff',
            role: isAdmin ? 'ADMIN' : 'STAFF',
            is_active: true,
          };
          
          const { error: createError } = await supabase
            .from('users')
            .insert(userProfile);

          if (!createError) {
            console.log('User profile created successfully');
            return {
              user: {
                id: userProfile.id,
                email: userProfile.email,
                first_name: userProfile.first_name,
                last_name: userProfile.last_name,
                role: userProfile.role as 'ADMIN' | 'DOCTOR' | 'NURSE' | 'STAFF',
                is_active: userProfile.is_active,
              },
              error: null
            };
          } else {
            console.error('Error creating user profile:', createError);
            throw createError;
          }
        }

        return {
          user: {
            id: profile.id,
            email: profile.email,
            first_name: profile.first_name,
            last_name: profile.last_name,
            role: profile.role,
            is_active: profile.is_active,
          },
          error: null
        };
      }

      return { user: null, error: null };
    } catch (error) {
      return { user: null, error: error as Error };
    }
  }

  /**
   * Sign out current user
   */
  async signOut() {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  }

  /**
   * Get current user session
   */
  async getCurrentUser(): Promise<AuthUser | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) return null;

      // Get user profile
      const { data: profile, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error || !profile) return null;

      return {
        id: profile.id,
        email: profile.email,
        first_name: profile.first_name,
        last_name: profile.last_name,
        role: profile.role,
        is_active: profile.is_active,
      };
    } catch (error) {
      console.error('Get current user error:', error);
      return null;
    }
  }

  /**
   * Listen to auth state changes
   */
  onAuthStateChange(callback: (user: AuthUser | null) => void) {
    return supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        const user = await this.getCurrentUser();
        callback(user);
      } else {
        callback(null);
      }
    });
  }

  /**
   * Check if user is authenticated
   */
  async isAuthenticated(): Promise<boolean> {
    const { data: { user } } = await supabase.auth.getUser();
    return !!user;
  }

  /**
   * Update user profile
   */
  async updateProfile(updates: Partial<AuthUser>) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No authenticated user');

      const { error } = await supabase
        .from('users')
        .update(updates)
        .eq('id', user.id);

      if (error) throw error;
      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  }
}

export const supabaseAuthService = new SupabaseAuthService();
export default supabaseAuthService;
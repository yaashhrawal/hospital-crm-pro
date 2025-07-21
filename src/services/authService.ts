import dataService from './dataService';
import type { User } from './dataService';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role?: 'ADMIN' | 'DOCTOR' | 'NURSE' | 'STAFF';
}

export interface AuthUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  isActive: boolean;
}

export interface AuthResponse {
  user: AuthUser | null;
  error: string | null;
}

class AuthService {
  /**
   * Sign in with email and password
   */
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    try {
      console.log('🔧 [AuthService] Starting login process for email:', credentials.email);
      
      // Use dataService for login
      const user = await dataService.login(credentials.email, credentials.password);

      if (!user) {
        console.error('❌ [AuthService] Invalid credentials');
        return {
          user: null,
          error: 'Invalid email or password',
        };
      }

      console.log('✅ [AuthService] Login successful, returning user:', user);

      const authUser: AuthUser = {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        role: user.role,
        isActive: user.is_active,
      };

      return {
        user: authUser,
        error: null,
      };
    } catch (error) {
      console.error('❌ [AuthService] Login exception:', error);
      return {
        user: null,
        error: error instanceof Error ? error.message : 'Login failed',
      };
    }
  }

  /**
   * Register a new user (not implemented for local storage)
   */
  async register(_userData: RegisterData): Promise<AuthResponse> {
    return {
      user: null,
      error: 'Registration not available in offline mode',
    };
  }

  /**
   * Sign out current user
   */
  async logout(): Promise<{ error: string | null }> {
    try {
      await dataService.logout();
      return { error: null };
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : 'Logout failed',
      };
    }
  }

  /**
   * Get current user session
   */
  async getCurrentUser(): Promise<AuthUser | null> {
    try {
      console.log('🔧 [AuthService] Getting current user session...');
      
      const user = dataService.getCurrentUser();
      
      if (!user) {
        console.log('🔧 [AuthService] No user found');
        return null;
      }

      const authUser: AuthUser = {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        role: user.role,
        isActive: user.is_active,
      };

      console.log('✅ [AuthService] Current user retrieved:', authUser);
      return authUser;
    } catch (error) {
      console.error('❌ [AuthService] Exception getting current user:', error);
      return null;
    }
  }

  /**
   * Reset password (not available in offline mode)
   */
  async resetPassword(_email: string): Promise<{ error: string | null }> {
    return {
      error: 'Password reset not available in offline mode',
    };
  }

  /**
   * Update password (not available in offline mode)
   */
  async updatePassword(_newPassword: string): Promise<{ error: string | null }> {
    return {
      error: 'Password update not available in offline mode',
    };
  }

  /**
   * Update user profile (not available in offline mode)
   */
  async updateProfile(_userId: string, _updates: Partial<User>): Promise<{ error: string | null }> {
    return {
      error: 'Profile update not available in offline mode',
    };
  }

  /**
   * Subscribe to auth state changes (mock implementation)
   */
  onAuthStateChange(_callback: (user: AuthUser | null) => void) {
    // Mock implementation - in a real app this would listen for storage changes
    return {
      data: {
        subscription: {
          unsubscribe: () => {},
        },
      },
    };
  }

  /**
   * Check if user has specific role
   */
  hasRole(user: AuthUser | null, roles: string | string[]): boolean {
    if (!user) return false;
    
    const roleArray = Array.isArray(roles) ? roles : [roles];
    return roleArray.includes(user.role);
  }

  /**
   * Check if user is admin
   */
  isAdmin(user: AuthUser | null): boolean {
    return this.hasRole(user, 'ADMIN');
  }

  /**
   * Check if user is doctor
   */
  isDoctor(user: AuthUser | null): boolean {
    return this.hasRole(user, 'DOCTOR');
  }

  /**
   * Get user permissions based on role
   */
  getUserPermissions(user: AuthUser | null): string[] {
    if (!user) return [];

    const basePermissions = ['read_own_profile'];

    switch (user.role) {
      case 'ADMIN':
        return [
          ...basePermissions,
          'read_all_users',
          'write_all_users',
          'read_patients',
          'create_patients',
          'write_patients',
          'read_appointments',
          'create_appointments',
          'write_appointments',
          'read_bills',
          'create_bills',
          'write_bills',
          'read_dashboard',
          'create_expenses',
          'manage_departments',
        ];
      
      case 'DOCTOR':
        return [
          ...basePermissions,
          'read_patients',
          'create_patients',
          'write_patients',
          'read_appointments',
          'create_appointments',
          'write_appointments',
          'read_bills',
          'create_bills',
          'write_bills',
          'read_dashboard',
        ];
      
      case 'NURSE':
        return [
          ...basePermissions,
          'read_patients',
          'create_patients',
          'write_patients',
          'read_appointments',
          'write_appointments',
          'read_bills',
          'read_dashboard',
        ];
      
      case 'STAFF':
        return [
          ...basePermissions,
          'read_patients',
          'create_patients',
          'read_appointments',
          'read_bills',
          'create_bills',
          'write_bills',
          'read_dashboard',
        ];
      
      default:
        return basePermissions;
    }
  }
}

export const authService = new AuthService();
export default authService;
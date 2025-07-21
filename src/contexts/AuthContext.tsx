import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { authService } from '../services/authService';
import type { LoginCredentials, RegisterData } from '../services/authService';
import type { AuthUser } from '../config/supabase';

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  login: (credentials: LoginCredentials) => Promise<{ success: boolean; error?: string }>;
  register: (userData: RegisterData) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  updateProfile: (updates: Partial<AuthUser>) => Promise<{ success: boolean; error?: string }>;
  resetPassword: (email: string) => Promise<{ success: boolean; error?: string }>;
  updatePassword: (newPassword: string) => Promise<{ success: boolean; error?: string }>;
  hasRole: (roles: string | string[]) => boolean;
  hasPermission: (permission: string) => boolean;
  isAdmin: () => boolean;
  isDoctor: () => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('🔧 [AuthContext] Initializing authentication...');
    
    // Check for existing session on mount
    const initializeAuth = async () => {
      try {
        console.log('🔧 [AuthContext] Getting current user...');
        const currentUser = await authService.getCurrentUser();
        console.log('🔧 [AuthContext] Current user result:', currentUser);
        
        setUser(currentUser);
        console.log('🔧 [AuthContext] User state set to:', currentUser);
      } catch (error) {
        console.error('❌ [AuthContext] Error initializing auth:', error);
        setUser(null);
      } finally {
        setLoading(false);
        console.log('🔧 [AuthContext] Loading set to false');
      }
    };

    initializeAuth();

    // Subscribe to auth state changes
    console.log('🔧 [AuthContext] Setting up auth state change listener...');
    const { data: { subscription } } = authService.onAuthStateChange((user) => {
      console.log('🔧 [AuthContext] Auth state changed. New user:', user);
      setUser(user);
      setLoading(false);
    });

    return () => {
      console.log('🔧 [AuthContext] Cleaning up auth subscription...');
      subscription?.unsubscribe();
    };
  }, []);

  const login = async (credentials: LoginCredentials): Promise<{ success: boolean; error?: string }> => {
    try {
      console.log('🔧 [AuthContext] Starting login with credentials:', { email: credentials.email });
      setLoading(true);
      
      const result = await authService.login(credentials);
      console.log('🔧 [AuthContext] Login service result:', result);
      
      const { user: loggedInUser, error } = result;
      
      if (error) {
        console.error('❌ [AuthContext] Login error from service:', error);
        return { success: false, error };
      }

      console.log('🔧 [AuthContext] Login successful, setting user:', loggedInUser);
      setUser(loggedInUser);
      
      console.log('✅ [AuthContext] Login completed successfully');
      return { success: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Login failed';
      console.error('❌ [AuthContext] Login exception:', error);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
      console.log('🔧 [AuthContext] Login loading set to false');
    }
  };

  const register = async (userData: RegisterData): Promise<{ success: boolean; error?: string }> => {
    try {
      setLoading(true);
      const { user: newUser, error } = await authService.register(userData);
      
      if (error) {
        return { success: false, error };
      }

      setUser(newUser);
      return { success: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Registration failed';
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const logout = async (): Promise<void> => {
    try {
      setLoading(true);
      await authService.logout();
      setUser(null);
    } catch (error) {
      console.error('Logout error:', error);
      // Force logout on client side even if server call fails
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (updates: Partial<AuthUser>): Promise<{ success: boolean; error?: string }> => {
    if (!user) {
      return { success: false, error: 'No user logged in' };
    }

    try {
      const { error } = await authService.updateProfile(user.id, updates);
      
      if (error) {
        return { success: false, error };
      }

      // Update local user state
      setUser({ ...user, ...updates });
      return { success: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Profile update failed';
      return { success: false, error: errorMessage };
    }
  };

  const resetPassword = async (email: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const { error } = await authService.resetPassword(email);
      
      if (error) {
        return { success: false, error };
      }

      return { success: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Password reset failed';
      return { success: false, error: errorMessage };
    }
  };

  const updatePassword = async (newPassword: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const { error } = await authService.updatePassword(newPassword);
      
      if (error) {
        return { success: false, error };
      }

      return { success: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Password update failed';
      return { success: false, error: errorMessage };
    }
  };

  const hasRole = (roles: string | string[]): boolean => {
    return authService.hasRole(user, roles);
  };

  const hasPermission = (permission: string): boolean => {
    const permissions = authService.getUserPermissions(user);
    return permissions.includes(permission);
  };

  const isAdmin = (): boolean => {
    return authService.isAdmin(user);
  };

  const isDoctor = (): boolean => {
    return authService.isDoctor(user);
  };

  const value: AuthContextType = {
    user,
    loading,
    login,
    register,
    logout,
    updateProfile,
    resetPassword,
    updatePassword,
    hasRole,
    hasPermission,
    isAdmin,
    isDoctor,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Higher-order component for protecting routes
interface ProtectedRouteProps {
  children: ReactNode;
  roles?: string | string[];
  permissions?: string | string[];
  fallback?: ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  roles,
  permissions,
  fallback = <div className="flex items-center justify-center h-64">
    <div className="text-center">
      <h2 className="text-xl font-semibold text-gray-900 mb-2">Access Denied</h2>
      <p className="text-gray-600">You don't have permission to access this page.</p>
    </div>
  </div>,
}) => {
  const { user, loading, hasRole, hasPermission } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Authentication Required</h2>
          <p className="text-gray-600">Please log in to access this page.</p>
        </div>
      </div>
    );
  }

  // Check role-based access
  if (roles && !hasRole(roles)) {
    return <>{fallback}</>;
  }

  // Check permission-based access
  if (permissions) {
    const permissionArray = Array.isArray(permissions) ? permissions : [permissions];
    const hasRequiredPermission = permissionArray.some(permission => hasPermission(permission));
    
    if (!hasRequiredPermission) {
      return <>{fallback}</>;
    }
  }

  return <>{children}</>;
};

// Hook for loading states
export const useAuthLoading = () => {
  const { loading } = useAuth();
  return loading;
};

// Hook for user data
export const useUser = () => {
  const { user } = useAuth();
  return user;
};

// Hook for auth actions
export const useAuthActions = () => {
  const { login, register, logout, updateProfile, resetPassword, updatePassword } = useAuth();
  return { login, register, logout, updateProfile, resetPassword, updatePassword };
};

// Hook for permissions
export const usePermissions = () => {
  const { hasRole, hasPermission, isAdmin, isDoctor } = useAuth();
  return { hasRole, hasPermission, isAdmin, isDoctor };
};

export default AuthContext;
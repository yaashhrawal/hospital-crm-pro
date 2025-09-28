import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { authService } from '../services/authService';
import type { LoginCredentials, RegisterData } from '../services/authService';
import type { AuthUser } from '../config/supabaseNew';
import { logger, setLoggerPermissions } from '../utils/logger';
import { setUserStatus } from '../utils/smartConsoleBlocker';
import { setDevToolsAccess } from '../utils/devToolsBlocker';

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
  isFrontdesk: () => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  // Update logger permissions and console access whenever user changes
  useEffect(() => {
    if (user) {
      const userIsAdmin = authService.isAdmin(user) || user.email === 'admin@valant.com' || user.email === 'meenal@valant.com';

      // Keep minimal debug info for troubleshooting
      (window as any).authDebug = {
        isAdmin: userIsAdmin,
        email: user.email
      };

      setLoggerPermissions(userIsAdmin, user.email || '');
      setUserStatus(userIsAdmin, user.email || '');
      setDevToolsAccess(userIsAdmin, user.email || '');
    } else {
      (window as any).authDebug = { isAdmin: false, email: null };
      setLoggerPermissions(false, '');
      setUserStatus(false, '');
      setDevToolsAccess(false, '');
    }
  }, [user]);

  useEffect(() => {
    logger.log('🔧 [AuthContext] Initializing authentication...');
    
    // Check for existing session on mount
    const initializeAuth = async () => {
      try {
        logger.log('🔧 [AuthContext] Getting current user...');
        const currentUser = await authService.getCurrentUser();
        logger.log('🔧 [AuthContext] Current user result:', currentUser);
        
        setUser(currentUser);
        logger.log('🔧 [AuthContext] User state set to:', currentUser);

        // Update console access immediately when user is set during initialization
        if (currentUser) {
          const userIsAdmin = authService.isAdmin(currentUser) || currentUser.email === 'admin@valant.com' || currentUser.email === 'meenal@valant.com';
          setLoggerPermissions(userIsAdmin, currentUser.email || '');
          setUserStatus(userIsAdmin, currentUser.email || '');
          setDevToolsAccess(userIsAdmin, currentUser.email || '');
        }
      } catch (error) {
        logger.error('❌ [AuthContext] Error initializing auth:', error);
        setUser(null);
      } finally {
        setLoading(false);
        logger.log('🔧 [AuthContext] Loading set to false');
      }
    };

    initializeAuth();

    // Subscribe to auth state changes
    logger.log('🔧 [AuthContext] Setting up auth state change listener...');
    const { data: { subscription } } = authService.onAuthStateChange((user) => {
      logger.log('🔧 [AuthContext] Auth state changed. New user:', user);
      setUser(user);
      setLoading(false);
    });

    return () => {
      logger.log('🔧 [AuthContext] Cleaning up auth subscription...');
      subscription?.unsubscribe();
    };
  }, []);

  const login = async (credentials: LoginCredentials): Promise<{ success: boolean; error?: string }> => {
    try {
      logger.log('🔧 [AuthContext] Starting login with credentials:', { email: credentials.email });
      setLoading(true);
      
      const result = await authService.login(credentials);
      logger.log('🔧 [AuthContext] Login service result:', result);
      
      const { user: loggedInUser, error } = result;
      
      if (error) {
        logger.error('❌ [AuthContext] Login error from service:', error);
        return { success: false, error };
      }

      logger.log('🔧 [AuthContext] Login successful, setting user:', loggedInUser);
      setUser(loggedInUser);
      
      logger.log('✅ [AuthContext] Login completed successfully');
      return { success: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Login failed';
      logger.error('❌ [AuthContext] Login exception:', error);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
      logger.log('🔧 [AuthContext] Login loading set to false');
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
      logger.error('Logout error:', error);
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
    logger.log('🔍 [AuthContext] hasPermission check:', {
      permission,
      user: user ? { email: user.email, role: user.role } : null,
      userObject: user
    });
    
    // FORCE ADMIN ACCESS: Grant all permissions to admin users
    if (user && (user.email === 'admin@valant.com' || user.email === 'meenal@valant.com')) {
      logger.log('✅ [AuthContext] FORCE ADMIN ACCESS - granting permission:', permission);
      return true;
    }
    
    // Admin users have ALL permissions - no restrictions
    if (user && authService.isAdmin(user)) {
      logger.log('✅ [AuthContext] User is admin - granting permission:', permission);
      return true;
    }
    
    const permissions = authService.getUserPermissions(user);
    const hasIt = permissions.includes(permission);
    
    logger.log('🔍 [AuthContext] Permission check result:', {
      permission,
      userRole: user?.role,
      allPermissions: permissions,
      hasPermission: hasIt,
      isAdminCheck: authService.isAdmin(user)
    });
    
    return hasIt;
  };

  const isAdmin = (): boolean => {
    return authService.isAdmin(user);
  };

  const isDoctor = (): boolean => {
    return authService.isDoctor(user);
  };

  const isFrontdesk = (): boolean => {
    return authService.isFrontdesk(user);
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
    isFrontdesk,
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
  const { hasRole, hasPermission, isAdmin, isDoctor, isFrontdesk } = useAuth();
  return { hasRole, hasPermission, isAdmin, isDoctor, isFrontdesk };
};

export default AuthContext;
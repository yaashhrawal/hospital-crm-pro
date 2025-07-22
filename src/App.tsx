import React, { useState, useEffect } from 'react';
import toast, { Toaster } from 'react-hot-toast';
import HospitalService from './services/hospitalService';
import type { User } from './config/supabaseNew';

// Import new components
import NewFlexiblePatientEntry from './components/NewFlexiblePatientEntry';
import ComprehensivePatientList from './components/ComprehensivePatientList';
import FutureAppointmentsSystem from './components/FutureAppointmentsSystem';
import RealTimeDashboard from './components/RealTimeDashboard';
import AuthDebugger from './components/AuthDebugger';
import TransactionTypeTester from './components/TransactionTypeTester';

// Login Component
const LoginPage: React.FC<{ onLogin: () => void }> = ({ onLogin }) => {
  const [email, setEmail] = useState('admin@hospital.com');
  const [password, setPassword] = useState('admin123');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      console.log('🔐 Attempting login with:', email);
      const { user, error } = await HospitalService.signIn(email, password);
      
      if (error) {
        console.error('❌ Login error:', error);
        toast.error(`Login failed: ${error.message || 'Invalid credentials'}`);
        return;
      }
      
      if (user) {
        console.log('✅ Login successful:', user.email);
        toast.success(`Welcome back, ${user.first_name}!`);
        onLogin();
      } else {
        toast.error('Invalid credentials');
      }
    } catch (error: any) {
      console.error('🚨 Login exception:', error);
      toast.error(`Login failed: ${error.message || 'Connection error'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="text-center">
          <div className="text-6xl mb-4">🏥</div>
          <h2 className="text-3xl font-extrabold text-gray-900">
            Hospital CRM Pro
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Complete Hospital Management System with Supabase Backend
          </p>
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-xl sm:rounded-lg sm:px-10 border">
          <form className="space-y-6" onSubmit={handleLogin}>
            <div>
              <label className="block text-sm font-medium text-gray-700">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="mt-1 appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter your email"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="mt-1 appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter your password"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Signing in...
                </div>
              ) : (
                'Sign in to Hospital CRM'
              )}
            </button>
          </form>

          {/* Default Credentials Info */}
          <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <h3 className="text-sm font-medium text-blue-800 mb-2">Default Credentials:</h3>
            <p className="text-xs text-blue-700">Email: admin@hospital.com</p>
            <p className="text-xs text-blue-700">Password: admin123</p>
          </div>

          {/* Features List */}
          <div className="mt-6 text-center">
            <p className="text-xs text-gray-500 mb-2">Features Available:</p>
            <div className="flex flex-wrap justify-center gap-1">
              <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">Patient Management</span>
              <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">Appointments</span>
              <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded">Analytics</span>
              <span className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded">Real-time Dashboard</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Main App Component
const App: React.FC = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check authentication status on app start
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      console.log('🔍 Checking authentication status...');
      const user = await HospitalService.getCurrentUser();
      
      if (user) {
        console.log('✅ User authenticated:', user.email);
        setCurrentUser(user);
        setIsLoggedIn(true);
        toast.success(`Welcome back, ${user.first_name}!`, { duration: 2000 });
      } else {
        console.log('ℹ️ No authenticated user found');
        setIsLoggedIn(false);
      }
    } catch (error: any) {
      console.error('🚨 Auth check error:', error);
      setIsLoggedIn(false);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async () => {
    setIsLoggedIn(true);
    // Re-fetch user data after login
    const user = await HospitalService.getCurrentUser();
    setCurrentUser(user);
  };

  const handleLogout = async () => {
    try {
      console.log('🚪 Signing out...');
      const { error } = await HospitalService.signOut();
      
      if (error) {
        console.error('❌ Logout error:', error);
        toast.error('Logout failed');
        return;
      }
      
      setIsLoggedIn(false);
      setCurrentUser(null);
      setActiveTab('dashboard');
      toast.success('Logged out successfully');
      console.log('✅ Logout successful');
    } catch (error: any) {
      console.error('🚨 Logout exception:', error);
      toast.error('Logout failed');
    }
  };

  // Show loading screen while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">🏥</div>
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading Hospital CRM...</p>
          <p className="text-xs text-gray-500 mt-2">Connecting to Supabase...</p>
        </div>
      </div>
    );
  }

  // Show login page if not authenticated
  if (!isLoggedIn) {
    return <LoginPage onLogin={handleLogin} />;
  }

  // Main app navigation tabs
  const tabs = [
    { 
      id: 'dashboard', 
      name: '📊 Dashboard', 
      component: RealTimeDashboard,
      description: 'Real-time analytics and overview' 
    },
    { 
      id: 'patient-entry', 
      name: '👤 New Patient', 
      component: NewFlexiblePatientEntry,
      description: 'Register new patients with flexible entry' 
    },
    { 
      id: 'patient-list', 
      name: '👥 Patient List', 
      component: ComprehensivePatientList,
      description: 'View and manage all patients' 
    },
    { 
      id: 'appointments', 
      name: '📅 Appointments', 
      component: FutureAppointmentsSystem,
      description: 'Schedule and manage appointments' 
    },
    { 
      id: 'auth-debug', 
      name: '🔍 Auth Debug', 
      component: AuthDebugger,
      description: 'Debug authentication issues' 
    },
    { 
      id: 'transaction-test', 
      name: '🧪 Transaction Test', 
      component: TransactionTypeTester,
      description: 'Test transaction types to fix constraint errors' 
    },
  ];

  const ActiveComponent = tabs.find(tab => tab.id === activeTab)?.component || RealTimeDashboard;
  const activeTabInfo = tabs.find(tab => tab.id === activeTab);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <div className="text-3xl mr-3">🏥</div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Hospital CRM Pro</h1>
                <p className="text-sm text-gray-600">
                  🟢 Supabase Connected • {currentUser ? `Logged in as ${currentUser.first_name} ${currentUser.last_name}` : 'Guest User'}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              {currentUser && (
                <div className="text-right">
                  <div className="text-sm font-medium text-gray-900">
                    {currentUser.first_name} {currentUser.last_name}
                  </div>
                  <div className="text-xs text-gray-500">
                    {currentUser.role} • {currentUser.email}
                  </div>
                </div>
              )}
              <button
                onClick={handleLogout}
                className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 transition-colors"
              >
                🚪 Logout
              </button>
            </div>
          </div>
          
          {/* Navigation Tabs */}
          <div className="border-t border-gray-200">
            <nav className="-mb-px flex space-x-8">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  } transition-colors`}
                >
                  {tab.name}
                </button>
              ))}
            </nav>
          </div>
        </div>
      </div>

      {/* Page Title */}
      {activeTabInfo && (
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <h2 className="text-lg font-semibold text-gray-900">{activeTabInfo.name}</h2>
            <p className="text-sm text-gray-600">{activeTabInfo.description}</p>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="py-6">
        <ActiveComponent />
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center text-sm text-gray-500">
            <div>
              © 2024 Hospital CRM Pro • Built with React, TypeScript & Supabase
            </div>
            <div className="flex items-center space-x-4">
              <span className="flex items-center">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-1 animate-pulse"></div>
                System Online
              </span>
              <span>Version 2.0</span>
            </div>
          </div>
        </div>
      </footer>

      {/* Toast Notifications */}
      <Toaster 
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#ffffff',
            color: '#374151',
            border: '1px solid #e5e7eb',
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
          },
          success: {
            duration: 3000,
            style: {
              background: '#f0fdf4',
              color: '#166534',
              border: '1px solid #bbf7d0',
            },
            iconTheme: {
              primary: '#22c55e',
              secondary: '#ffffff',
            },
          },
          error: {
            duration: 5000,
            style: {
              background: '#fef2f2',
              color: '#991b1b',
              border: '1px solid #fecaca',
            },
            iconTheme: {
              primary: '#ef4444',
              secondary: '#ffffff',
            },
          },
          loading: {
            style: {
              background: '#fef3c7',
              color: '#92400e',
              border: '1px solid #fed7aa',
            },
          }
        }}
      />
    </div>
  );
};

export default App;
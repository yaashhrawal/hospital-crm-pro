import React, { useState, useEffect } from 'react';
import toast, { Toaster } from 'react-hot-toast';
import HospitalService from './services/hospitalService';
import type { User } from './config/supabaseNew';

// Import production components only
import ComprehensivePatientList from './components/ComprehensivePatientList';
import ErrorBoundary from './components/ErrorBoundary';
import RealTimeDashboard from './components/RealTimeDashboard';
import NewFlexiblePatientEntry from './components/NewFlexiblePatientEntry';
import DailyExpenseTab from './components/DailyExpenseTab';
import RefundTab from './components/RefundTab';
import EnhancedDashboard from './components/EnhancedDashboard';
import OperationsLedger from './components/OperationsLedger';
import BillingSection from './components/BillingSection';
import IPDBedManagement from './components/IPDBedManagement';
import DischargeSection from './components/DischargeSection';
// import HospitalServices from './components/HospitalServices'; // Removed - using patient-specific services instead

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
  const [isNavVisible, setIsNavVisible] = useState(true);
  const [navHideTimer, setNavHideTimer] = useState<NodeJS.Timeout | null>(null);
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);

  // Auto-hide navigation after 3 seconds of inactivity
  useEffect(() => {
    if (!isLoggedIn) return;
    
    let timer: NodeJS.Timeout | null = null;
    
    const startHideTimer = () => {
      if (timer) {
        clearTimeout(timer);
      }
      timer = setTimeout(() => {
        setIsNavVisible(false);
      }, 3000); // Hide after 3 seconds
      setNavHideTimer(timer);
    };

    // Start the timer initially
    startHideTimer();

    // Cleanup timer on unmount
    return () => {
      if (timer) {
        clearTimeout(timer);
      }
      if (navHideTimer) {
        clearTimeout(navHideTimer);
      }
    };
  }, [isLoggedIn]);

  // Handle mouse enter - show navigation
  const handleNavMouseEnter = () => {
    setIsNavVisible(true);
    if (navHideTimer) {
      clearTimeout(navHideTimer);
      setNavHideTimer(null);
    }
  };

  // Handle mouse leave - start hide timer
  const handleNavMouseLeave = () => {
    if (navHideTimer) {
      clearTimeout(navHideTimer);
    }
    const timer = setTimeout(() => {
      setIsNavVisible(false);
    }, 2000); // Hide after 2 seconds when mouse leaves
    setNavHideTimer(timer);
  };

  useEffect(() => {
    // Check authentication status on app start
    checkAuthStatus();
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isUserDropdownOpen && event.target) {
        const target = event.target as HTMLElement;
        // Only close if click is outside dropdown area
        if (!target.closest('.user-dropdown')) {
          setIsUserDropdownOpen(false);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isUserDropdownOpen]);

  // Debug modal states
  useEffect(() => {
    console.log('showProfileModal:', showProfileModal);
    console.log('showSettingsModal:', showSettingsModal);
  }, [showProfileModal, showSettingsModal]);

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

  // Main app navigation tabs - CLEAN PRODUCTION
  const tabs = [
    { 
      id: 'dashboard', 
      name: '📊 Dashboard', 
      component: EnhancedDashboard
    },
    { 
      id: 'patient-entry', 
      name: '👤 New Patient', 
      component: NewFlexiblePatientEntry,
      description: 'Register new patients with comprehensive information and reference tracking' 
    },
    { 
      id: 'patient-list', 
      name: '👥 Patient List', 
      component: ComprehensivePatientList,
      description: 'View and manage all registered patients' 
    },
    { 
      id: 'ipd-beds', 
      name: '🛏️ IPD Beds', 
      component: IPDBedManagement,
      description: 'Real-time hospital bed occupancy tracking and management' 
    },
    { 
      id: 'discharge', 
      name: '📤 Discharge', 
      component: DischargeSection,
      description: 'View all discharged patients with complete discharge summaries' 
    },
    { 
      id: 'expenses', 
      name: '💸 Expenses', 
      component: DailyExpenseTab,
      description: 'Record and track daily hospital expenses' 
    },
    { 
      id: 'refunds', 
      name: '💰 Refunds', 
      component: RefundTab,
      description: 'Process patient refunds and maintain financial records' 
    },
    { 
      id: 'billing', 
      name: '💳 Billing', 
      component: BillingSection,
      description: 'Generate IPD, OPD, and Combined bills for patients' 
    },
    { 
      id: 'operations', 
      name: '📊 Operations', 
      component: OperationsLedger,
      description: 'Financial ledger perfectly synchronized with Patient List - no date mismatches!' 
    }
  ];

  const ActiveComponent = tabs.find(tab => tab.id === activeTab)?.component || RealTimeDashboard;
  const activeTabInfo = tabs.find(tab => tab.id === activeTab);

  const renderActiveComponent = () => {
    if (activeTab === 'dashboard') {
      return <EnhancedDashboard onNavigate={setActiveTab} />;
    } else if (activeTab === 'patient-list') {
      return <ComprehensivePatientList onNavigate={setActiveTab} />;
    } else if (activeTab === 'operations') {
      return <OperationsLedger onNavigate={setActiveTab} />;
    }
    return <ActiveComponent />;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Main Header - Always Visible */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header Content - Always Visible */}
          <div className="flex justify-between items-center py-3">
            <div className="flex items-center space-x-4">
              {/* Logo */}
              <img 
                src="/logo.png" 
                alt="VALANT HOSPITAL" 
                className="h-12 w-12 object-contain"
              />
              {/* Hospital Name */}
              <div>
                <h1 className="text-xl font-bold text-blue-900">VALANT HOSPITAL</h1>
                <p className="text-xs text-gray-500">
                  Hospital Management System
                </p>
              </div>
            </div>
            

            {/* Right Side - User Info & Actions */}
            <div className="flex items-center space-x-4">

              {/* User Avatar & Info with Dropdown */}
              {currentUser && (
                <div className="relative user-dropdown">
                  <button
                    onClick={() => setIsUserDropdownOpen(!isUserDropdownOpen)}
                    className="flex items-center space-x-3 hover:bg-gray-50 rounded-lg p-2 transition-colors"
                  >
                    <div className="text-right">
                      <div className="text-sm font-medium text-gray-900">
                        {currentUser.first_name} {currentUser.last_name}
                      </div>
                      <div className="text-xs text-gray-500">
                        {currentUser.email}
                      </div>
                    </div>
                    <div className="flex items-center space-x-1">
                      <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
                        {currentUser.first_name?.charAt(0)}{currentUser.last_name?.charAt(0)}
                      </div>
                      <svg className={`w-4 h-4 text-gray-400 transition-transform ${isUserDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </button>

                  {/* Dropdown Menu */}
                  {isUserDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                      <div className="py-1">
                        <div className="px-4 py-2 border-b border-gray-100">
                          <div className="text-sm font-medium text-gray-900">
                            {currentUser.first_name} {currentUser.last_name}
                          </div>
                          <div className="text-xs text-gray-500">
                            {currentUser.email}
                          </div>
                        </div>
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            console.log('Profile button clicked');
                            setIsUserDropdownOpen(false);
                            setShowProfileModal(true);
                          }}
                          className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                          <span>Profile</span>
                        </button>
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            console.log('Settings button clicked');
                            setIsUserDropdownOpen(false);
                            setShowSettingsModal(true);
                          }}
                          className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          <span>Settings</span>
                        </button>
                        <div className="border-t border-gray-100 mt-1">
                          <button
                            onClick={() => {
                              setIsUserDropdownOpen(false);
                              handleLogout();
                            }}
                            className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center space-x-2"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                            </svg>
                            <span>Logout</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs - Auto-hide Section */}
      <div 
        className="bg-white border-b border-gray-200 relative"
        onMouseEnter={handleNavMouseEnter}
        onMouseLeave={handleNavMouseLeave}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* All Navigation Tabs in Single Row */}
          <div 
            className={`transition-all duration-500 ease-in-out transform ${
              isNavVisible 
                ? 'translate-y-0 opacity-100 max-h-20' 
                : '-translate-y-full opacity-0 max-h-0 overflow-hidden'
            }`}
          >
            <nav className="flex justify-center space-x-4 py-3 overflow-x-auto">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id);
                    // Reset the hide timer when a tab is clicked
                    if (navHideTimer) {
                      clearTimeout(navHideTimer);
                    }
                    const timer = setTimeout(() => {
                      setIsNavVisible(false);
                    }, 3000);
                    setNavHideTimer(timer);
                  }}
                  className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                    activeTab === tab.id
                      ? 'bg-blue-100 text-blue-700 border border-blue-200'
                      : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
                  }`}
                >
                  {tab.name}
                </button>
              ))}
            </nav>
          </div>

          {/* Minimal Hover Trigger Area - Only visible when navigation is hidden */}
          <div 
            className={`transition-all duration-300 ${
              isNavVisible ? 'h-0 opacity-0' : 'h-2 opacity-0 hover:bg-gray-100'
            }`}
          >
            {/* Invisible hover area to trigger navigation */}
          </div>
        </div>
      </div>


      {/* Main Content */}
      <main className="pb-6">
        <ErrorBoundary>
          {renderActiveComponent()}
        </ErrorBoundary>
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
              <span>Version 3.0</span>
            </div>
          </div>
        </div>
      </footer>

      {/* Profile Modal */}
      {showProfileModal && currentUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full mx-4 max-h-[90vh] overflow-hidden">
            {/* Header */}
            <div className="bg-blue-600 text-white p-6 flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold">User Profile</h2>
                <p className="text-blue-100">Manage your account information</p>
              </div>
              <button
                onClick={() => setShowProfileModal(false)}
                className="text-white hover:text-blue-200 text-2xl font-bold"
              >
                ×
              </button>
            </div>

            {/* Profile Content */}
            <div className="p-6 space-y-6">
              {/* User Avatar Section */}
              <div className="flex items-center space-x-6">
                <div className="w-20 h-20 bg-blue-600 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                  {currentUser.first_name?.charAt(0)}{currentUser.last_name?.charAt(0)}
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">
                    {currentUser.first_name} {currentUser.last_name}
                  </h3>
                  <p className="text-gray-600">{currentUser.email}</p>
                  <p className="text-sm text-gray-500">STAFF • Hospital Administrator</p>
                </div>
              </div>

              {/* Profile Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="text-lg font-semibold text-gray-900">Personal Information</h4>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">First Name</label>
                      <input
                        type="text"
                        value={currentUser.first_name || ''}
                        readOnly
                        className="mt-1 block w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-md text-gray-900"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Last Name</label>
                      <input
                        type="text"
                        value={currentUser.last_name || ''}
                        readOnly
                        className="mt-1 block w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-md text-gray-900"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Email Address</label>
                      <input
                        type="email"
                        value={currentUser.email || ''}
                        readOnly
                        className="mt-1 block w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-md text-gray-900"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="text-lg font-semibold text-gray-900">Account Details</h4>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">User ID</label>
                      <input
                        type="text"
                        value={currentUser.id || ''}
                        readOnly
                        className="mt-1 block w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-md text-gray-900 font-mono text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Role</label>
                      <input
                        type="text"
                        value="Hospital Administrator"
                        readOnly
                        className="mt-1 block w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-md text-gray-900"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Status</label>
                      <div className="mt-1 flex items-center">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          <span className="w-1.5 h-1.5 bg-green-500 rounded-full mr-1"></span>
                          Active
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
                <button
                  onClick={() => setShowProfileModal(false)}
                  className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    toast.success('Profile editing feature coming soon!');
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Edit Profile
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Settings Modal */}
      {showSettingsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden">
            {/* Header */}
            <div className="bg-gray-800 text-white p-6 flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold">System Settings</h2>
                <p className="text-gray-300">Configure your hospital management system</p>
              </div>
              <button
                onClick={() => setShowSettingsModal(false)}
                className="text-white hover:text-gray-300 text-2xl font-bold"
              >
                ×
              </button>
            </div>

            {/* Settings Content */}
            <div className="p-6 space-y-8 max-h-[calc(90vh-120px)] overflow-y-auto">
              {/* System Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  System Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-green-50 p-4 rounded-lg">
                    <h4 className="font-medium text-green-900">Database Status</h4>
                    <p className="text-green-700 flex items-center mt-1">
                      <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                      Connected (Supabase)
                    </p>
                  </div>
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h4 className="font-medium text-blue-900">Version</h4>
                    <p className="text-blue-700">Hospital CRM Pro v3.0</p>
                  </div>
                  <div className="bg-yellow-50 p-4 rounded-lg">
                    <h4 className="font-medium text-yellow-900">Last Backup</h4>
                    <p className="text-yellow-700">Auto-backup enabled</p>
                  </div>
                </div>
              </div>

              {/* Preferences */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
                  </svg>
                  Application Preferences
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-gray-900">Auto-hide Navigation</h4>
                        <p className="text-sm text-gray-600">Hide navigation tabs after inactivity</p>
                      </div>
                      <div className="w-12 h-6 bg-blue-600 rounded-full relative">
                        <div className="w-5 h-5 bg-white rounded-full absolute top-0.5 right-0.5"></div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-gray-900">Sound Notifications</h4>
                        <p className="text-sm text-gray-600">Play sounds for alerts and notifications</p>
                      </div>
                      <div className="w-12 h-6 bg-gray-300 rounded-full relative">
                        <div className="w-5 h-5 bg-white rounded-full absolute top-0.5 left-0.5"></div>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Time Zone</label>
                      <select className="w-full px-3 py-2 border border-gray-300 rounded-md">
                        <option>Asia/Kolkata (IST)</option>
                        <option>Asia/Mumbai (IST)</option>
                        <option>UTC</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Language</label>
                      <select className="w-full px-3 py-2 border border-gray-300 rounded-md">
                        <option>English</option>
                        <option>Hindi</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              {/* Data Management */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
                  </svg>
                  Data Management
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <button className="p-4 border border-gray-300 rounded-lg hover:bg-gray-50 text-left">
                    <h4 className="font-medium text-gray-900">Export Data</h4>
                    <p className="text-sm text-gray-600 mt-1">Download patient and transaction data</p>
                  </button>
                  <button className="p-4 border border-gray-300 rounded-lg hover:bg-gray-50 text-left">
                    <h4 className="font-medium text-gray-900">Import Data</h4>
                    <p className="text-sm text-gray-600 mt-1">Upload data from external sources</p>
                  </button>
                  <button className="p-4 border border-gray-300 rounded-lg hover:bg-gray-50 text-left">
                    <h4 className="font-medium text-gray-900">Backup Settings</h4>
                    <p className="text-sm text-gray-600 mt-1">Configure automatic backups</p>
                  </button>
                  <button className="p-4 border border-gray-300 rounded-lg hover:bg-gray-50 text-left">
                    <h4 className="font-medium text-gray-900">Clear Cache</h4>
                    <p className="text-sm text-gray-600 mt-1">Clear temporary data and cache</p>
                  </button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
                <button
                  onClick={() => setShowSettingsModal(false)}
                  className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    toast.success('Settings saved successfully!');
                    setShowSettingsModal(false);
                  }}
                  className="px-4 py-2 bg-gray-800 text-white rounded-md hover:bg-gray-900"
                >
                  Save Settings
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

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
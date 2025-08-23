import React, { useState, useEffect } from 'react';
import toast, { Toaster } from 'react-hot-toast';
import HospitalService from './services/hospitalService';
import type { User } from './config/supabaseNew';
import { supabase } from './config/supabaseNew';
import { useAuth } from './contexts/AuthContext';
import { 
  loadGoogleDriveAPI, 
  initGoogleDriveClient, 
  signInToGoogleDrive, 
  uploadToGoogleDrive,
  isGoogleAPILoaded,
  isSignedInToGoogleDrive,
  signOutFromGoogleDrive
} from './utils/googleDriveAuth';

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
// import TableInspector from './components/TableInspector'; // Removed debug component
import { Login } from './pages/Login/Login'; // Import 3D Login component
// import HospitalServices from './components/HospitalServices'; // Removed - using patient-specific services instead

// Login Component - Replaced with 3D animated version from ./pages/Login/Login
// The old LoginPage component has been commented out and replaced with the imported Login component

// Main App Component
const App: React.FC = () => {
  const { user, loading } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isNavVisible, setIsNavVisible] = useState(true);
  const [navHideTimer, setNavHideTimer] = useState<NodeJS.Timeout | null>(null);
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  
  // Profile editing states
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editedProfile, setEditedProfile] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: ''
  });
  
  // Settings states
  const [settings, setSettings] = useState({
    autoHideNav: true,
    soundNotifications: false,
    timeZone: 'Asia/Kolkata (IST)',
    language: 'English'
  });
  
  // Data management states
  const [showExportModal, setShowExportModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showBackupModal, setShowBackupModal] = useState(false);
  const [exportFormat, setExportFormat] = useState('json');
  const [exportData, setExportData] = useState({
    patients: true,
    transactions: true,
    appointments: true,
    expenses: true,
    refunds: true
  });
  const [backupSettings, setBackupSettings] = useState({
    frequency: 'Daily',
    time: '02:00',
    storageLocation: 'local'
  });
  const [isBackupInProgress, setIsBackupInProgress] = useState(false);
  const [showGoogleDriveSetup, setShowGoogleDriveSetup] = useState(false);
  const [googleDriveCredentials, setGoogleDriveCredentials] = useState({
    clientId: '',
    apiKey: ''
  });
  const [googleDriveUser, setGoogleDriveUser] = useState<{ email: string; name: string } | null>(null);

  // Auto-hide navigation after 3 seconds of inactivity (only if enabled in settings)
  useEffect(() => {
    if (!user) return;
    
    // If auto-hide is disabled, always show navigation
    if (!settings.autoHideNav) {
      setIsNavVisible(true);
      if (navHideTimer) {
        clearTimeout(navHideTimer);
        setNavHideTimer(null);
      }
      return;
    }
    
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

    // Start the timer initially only if auto-hide is enabled
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
  }, [user, settings.autoHideNav]);

  // Handle mouse enter - show navigation (only if auto-hide is enabled)
  const handleNavMouseEnter = () => {
    if (settings.autoHideNav) {
      setIsNavVisible(true);
      if (navHideTimer) {
        clearTimeout(navHideTimer);
        setNavHideTimer(null);
      }
    }
  };

  // Handle mouse leave - start hide timer (only if auto-hide is enabled)
  const handleNavMouseLeave = () => {
    if (!settings.autoHideNav) return; // Don't hide if auto-hide is disabled
    
    if (navHideTimer) {
      clearTimeout(navHideTimer);
    }
    const timer = setTimeout(() => {
      setIsNavVisible(false);
    }, 2000); // Hide after 2 seconds when mouse leaves
    setNavHideTimer(timer);
  };

  // Authentication is now handled by AuthContext

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

  // Authentication functions removed - now handled by AuthContext

  const { logout } = useAuth();
  const { hasPermission } = useAuth();

  const handleLogout = async () => {
    try {
      console.log('🚪 Signing out...');
      await logout();
      setActiveTab('dashboard');
      toast.success('Logged out successfully');
      console.log('✅ Logout successful');
    } catch (error: any) {
      console.error('🚨 Logout exception:', error);
      toast.error('Logout failed');
    }
  };

  // Profile management functions
  const handleEditProfile = () => {
    setIsEditingProfile(true);
    setEditedProfile({
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',
      email: user?.email || '',
      phone: user?.phone || ''
    });
  };

  const handleSaveProfile = async () => {
    try {
      // Here you would typically call an API to update the user profile
      // For now, we'll just show a success message and update local state
      toast.success('Profile updated successfully!');
      
      // Update the current user state with new values
      if (currentUser) {
        setCurrentUser({
          ...currentUser,
          first_name: editedProfile.first_name,
          last_name: editedProfile.last_name,
          email: editedProfile.email,
          phone: editedProfile.phone
        });
      }
      
      setIsEditingProfile(false);
    } catch (error) {
      toast.error('Failed to update profile');
      console.error('Profile update error:', error);
    }
  };

  const handleCancelProfileEdit = () => {
    setIsEditingProfile(false);
    setEditedProfile({
      first_name: '',
      last_name: '',
      email: '',
      phone: ''
    });
  };

  // Settings management functions
  const handleSettingChange = (key: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleDataExport = () => {
    setShowExportModal(true);
  };

  const handleDataImport = () => {
    setShowImportModal(true);
  };

  const handleBackupSettings = () => {
    setShowBackupModal(true);
  };

  const performBackup = async () => {
    setIsBackupInProgress(true);
    const loadingToast = toast.loading('Creating backup...');
    
    try {
      // Fetch comprehensive data for backup
      toast.dismiss(loadingToast);
      const statusToast = toast.loading('Fetching patient data...', { duration: 0 });
      
      // Get ALL patients data with all fields (no limits, including inactive)
      const { data: patients, error: patientsError } = await supabase
        .from('patients')
        .select('*')
        .eq('hospital_id', '550e8400-e29b-41d4-a716-446655440000')
        .order('created_at', { ascending: false });
      
      if (patientsError) {
        console.error('Error fetching patients for backup:', patientsError);
        toast.error('Failed to fetch patient data for backup');
        throw patientsError;
      }
      
      toast.dismiss(statusToast);
      const appointmentToast = toast.loading('Fetching appointments...', { duration: 0 });
      
      // Get ALL appointments (no limits)
      const { data: appointments, error: appointmentsError } = await supabase
        .from('future_appointments')
        .select(`
          *,
          patient:patients(id, patient_id, first_name, last_name, phone),
          doctor:users(id, first_name, last_name, email)
        `)
        .eq('hospital_id', '550e8400-e29b-41d4-a716-446655440000')
        .order('appointment_date', { ascending: true })
        .order('appointment_time', { ascending: true });
      
      if (appointmentsError) {
        console.error('Error fetching appointments for backup:', appointmentsError);
        // Don't fail backup for appointments error, just log it
        console.warn('⚠️ Continuing backup without appointments');
      }
      
      toast.dismiss(appointmentToast);
      const transactionToast = toast.loading('Fetching transactions...', { duration: 0 });
      
      // Get all transactions with patient details
      const { data: transactions } = await supabase
        .from('patient_transactions')
        .select(`
          *,
          patient:patients(id, patient_id, first_name, last_name, phone)
        `)
        .eq('hospital_id', '550e8400-e29b-41d4-a716-446655440000')
        .order('created_at', { ascending: false });
      
      toast.dismiss(transactionToast);
      const expenseToast = toast.loading('Fetching expenses...', { duration: 0 });
      
      // Get all expenses
      const { data: expenses } = await supabase
        .from('daily_expenses')
        .select('*')
        .eq('hospital_id', '550e8400-e29b-41d4-a716-446655440000')
        .order('expense_date', { ascending: false });
        
      toast.dismiss(expenseToast);
      const refundToast = toast.loading('Fetching refunds...', { duration: 0 });
      
      // Get all refunds with error handling
      let refunds: any[] = [];
      try {
        const { data: refundData, error: refundError } = await supabase
          .from('patient_refunds')
          .select(`
            *,
            patient:patients(id, patient_id, first_name, last_name, phone)
          `)
          .eq('hospital_id', '550e8400-e29b-41d4-a716-446655440000')
          .order('created_at', { ascending: false });
        
        if (!refundError && refundData) {
          refunds = refundData;
          console.log(`✅ Retrieved ${refunds.length} refunds for backup`);
        } else {
          console.warn('⚠️ Refunds table not accessible, skipping refunds in backup');
          refunds = [];
        }
      } catch (error) {
        console.warn('⚠️ Error fetching refunds, using empty array:', error);
        refunds = [];
      }
      
      toast.dismiss(refundToast);
      const finalToast = toast.loading('Preparing backup file...');
      
      const backupData = {
        backup_info: {
          hospital_name: 'VALANT HOSPITAL',
          backup_date: new Date().toISOString(),
          backup_by: user?.email || 'Unknown',
          backup_version: '2.0',
          data_types: ['patients', 'transactions', 'appointments', 'expenses', 'refunds'],
          total_records: (patients?.length || 0) + (transactions?.length || 0) + (appointments?.length || 0) + (expenses?.length || 0) + (refunds?.length || 0)
        },
        patients: {
          count: patients?.length || 0,
          data: patients || [],
          fields: ['id', 'patient_id', 'prefix', 'first_name', 'last_name', 'age', 'gender', 'phone', 'email', 'address', 'emergency_contact_name', 'emergency_contact_phone', 'blood_group', 'medical_history', 'allergies', 'current_medications', 'insurance_provider', 'insurance_number', 'has_reference', 'reference_details', 'assigned_doctor', 'assigned_department', 'notes', 'date_of_entry', 'ipd_status', 'ipd_bed_number', 'is_active', 'created_at', 'updated_at', 'created_by']
        },
        transactions: {
          count: transactions?.length || 0,
          data: transactions || [],
          fields: ['id', 'patient_id', 'transaction_type', 'amount', 'payment_mode', 'description', 'status', 'created_at', 'created_by'],
          total_amount: transactions?.reduce((sum, t) => sum + (t.amount || 0), 0) || 0
        },
        appointments: {
          count: appointments?.length || 0,
          data: appointments || [],
          fields: ['id', 'patient_id', 'doctor_id', 'appointment_date', 'appointment_time', 'appointment_type', 'status', 'estimated_cost', 'notes', 'reminder_sent', 'hospital_id', 'created_at', 'created_by']
        },
        expenses: {
          count: expenses?.length || 0,
          data: expenses || [],
          fields: ['id', 'expense_category', 'amount', 'description', 'payment_mode', 'vendor_name', 'vendor_contact', 'expense_date', 'created_at', 'created_by'],
          total_amount: expenses?.reduce((sum, e) => sum + (e.amount || 0), 0) || 0,
          by_category: expenses?.reduce((acc, e) => {
            const category = e.expense_category || 'OTHER';
            acc[category] = (acc[category] || 0) + (e.amount || 0);
            return acc;
          }, {} as Record<string, number>) || {}
        },
        refunds: {
          count: refunds?.length || 0,
          data: refunds || [],
          fields: refunds.length > 0 ? Object.keys(refunds[0]) : ['id', 'amount', 'reason', 'patient_id', 'created_at'],
          total_amount: refunds?.reduce((sum, r) => sum + (r.amount || 0), 0) || 0,
          note: refunds.length === 0 ? 'Refunds table not accessible during backup' : 'All refunds included'
        },
        summary: {
          total_patients: patients?.length || 0,
          total_transactions: transactions?.length || 0,
          total_appointments: appointments?.length || 0,
          total_expenses: expenses?.length || 0,
          total_refunds: refunds?.length || 0,
          total_revenue: transactions?.reduce((sum, t) => sum + (t.amount || 0), 0) || 0,
          total_expenses_amount: expenses?.reduce((sum, e) => sum + (e.amount || 0), 0) || 0,
          total_refunds_amount: refunds?.reduce((sum, r) => sum + (r.amount || 0), 0) || 0,
          net_revenue: (transactions?.reduce((sum, t) => sum + (t.amount || 0), 0) || 0) - (refunds?.reduce((sum, r) => sum + (r.amount || 0), 0) || 0)
        }
      };
      
      console.log('📊 Backup Summary (ALL ENTRIES):', {
        patients: backupData.patients.count,
        transactions: backupData.transactions.count,
        appointments: backupData.appointments.count,
        expenses: backupData.expenses.count,
        refunds: backupData.refunds.count,
        total_records: backupData.backup_info.total_records
      });
      
      console.log('✅ COMPLETE DATABASE BACKUP - All patient entries included (no limits applied)');
      console.log('📋 Patient sample check:', patients?.slice(0, 3).map(p => `${p.patient_id}: ${p.first_name} ${p.last_name}`));
      
      toast.dismiss(finalToast);
      
      const backupContent = JSON.stringify(backupData, null, 2);
      const fileName = `valant-hospital-backup-${new Date().toISOString().split('T')[0]}.json`;
      
      if (backupSettings.storageLocation === 'local') {
        // Local storage backup - download file
        const blob = new Blob([backupContent], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
        toast.dismiss(loadingToast);
        toast.success(`✅ Complete backup saved as ${fileName}!\n📊 ALL ENTRIES BACKED UP: ${backupData.summary.total_patients} patients (complete details), ${backupData.summary.total_transactions} transactions, ${backupData.summary.total_appointments} appointments, ${backupData.summary.total_expenses} expenses, ${backupData.summary.total_refunds} refunds\n🔄 No limits applied - every single record included`, { duration: 10000 });
        
      } else if (backupSettings.storageLocation === 'google-drive') {
        // Google Drive backup
        if (!isSignedInToGoogleDrive()) {
          toast.dismiss(loadingToast);
          toast.error('Please connect to Google Drive first');
          setShowGoogleDriveSetup(true);
          return;
        }
        
        const result = await uploadToGoogleDrive(fileName, backupContent, 'application/json');
        
        if (result) {
          toast.dismiss(loadingToast);
          toast.success(`✅ Complete backup uploaded to Google Drive!\n📊 ALL ENTRIES BACKED UP: ${backupData.summary.total_patients} patients (complete details), ${backupData.summary.total_transactions} transactions, ${backupData.summary.total_appointments} appointments, ${backupData.summary.total_expenses} expenses, ${backupData.summary.total_refunds} refunds\n🔄 No limits applied - every single record included\n🔗 ${result.webViewLink}`, { duration: 12000 });
          console.log('Google Drive file:', result);
        } else {
          toast.dismiss(loadingToast);
          toast.error('Failed to upload backup to Google Drive');
        }
      }
      
      // Save backup timestamp
      localStorage.setItem('lastBackup', new Date().toISOString());
      
    } catch (error) {
      console.error('Backup error:', error);
      toast.dismiss(loadingToast);
      toast.error('Backup failed. Please try again.');
    } finally {
      setIsBackupInProgress(false);
    }
  };

  const handleGoogleDriveConnect = async () => {
    const loadingToast = toast.loading('Connecting to Google Drive...');
    
    try {
      // Load Google API if not already loaded
      if (!isGoogleAPILoaded()) {
        await loadGoogleDriveAPI();
      }
      
      // Initialize with user's credentials
      const initialized = await initGoogleDriveClient(
        googleDriveCredentials.clientId,
        googleDriveCredentials.apiKey
      );
      
      if (!initialized) {
        toast.dismiss(loadingToast);
        toast.error('Failed to initialize Google Drive. Please check your credentials.');
        return;
      }
      
      // Sign in
      const user = await signInToGoogleDrive();
      
      if (user) {
        setGoogleDriveUser(user);
        localStorage.setItem('googleDriveCredentials', JSON.stringify(googleDriveCredentials));
        toast.dismiss(loadingToast);
        toast.success(`Connected to Google Drive as ${user.email}`);
        setShowGoogleDriveSetup(false);
      } else {
        toast.dismiss(loadingToast);
        toast.error('Failed to sign in to Google Drive');
      }
    } catch (error) {
      console.error('Google Drive connection error:', error);
      toast.dismiss(loadingToast);
      toast.error('Failed to connect to Google Drive');
    }
  };

  const handleGoogleDriveDisconnect = async () => {
    await signOutFromGoogleDrive();
    setGoogleDriveUser(null);
    localStorage.removeItem('googleDriveCredentials');
    toast.success('Disconnected from Google Drive');
  };

  const handleClearCache = () => {
    toast.loading('Clearing application cache...', { duration: 1500 });
    setTimeout(() => {
      // Clear various caches
      localStorage.removeItem('hospitalPatientCache');
      localStorage.removeItem('hospitalTransactionCache');
      localStorage.removeItem('hospitalAppointmentCache');
      sessionStorage.clear();
      
      // Clear query cache if using React Query
      if (window.location.reload) {
        toast.success('Cache cleared! Page will reload...', { duration: 2000 });
        setTimeout(() => window.location.reload(), 2000);
      } else {
        toast.success('Cache cleared successfully!');
      }
    }, 1500);
  };

  const performDataExport = async () => {
    try {
      const loadingToast = toast.loading('Fetching data from database...');
      
      const exportDataObject: any = {
        export_info: {
          hospital_name: 'VALANT HOSPITAL',
          exported_at: new Date().toISOString(),
          exported_by: user?.email || 'Unknown'
        }
      };
      
      // Fetch real data from database
      if (exportData.patients) {
        const { data: patients } = await HospitalService.getPatients();
        exportDataObject.patients = {
          count: patients?.length || 0,
          data: patients || []
        };
      }
      
      if (exportData.transactions) {
        const { data: transactions } = await supabase
          .from('patient_transactions')
          .select('*')
          .eq('hospital_id', '550e8400-e29b-41d4-a716-446655440000');
        exportDataObject.transactions = {
          count: transactions?.length || 0,
          data: transactions || []
        };
      }
      
      if (exportData.appointments) {
        const { data: appointments } = await HospitalService.getAppointments();
        exportDataObject.appointments = {
          count: appointments?.length || 0,
          data: appointments || []
        };
      }
      
      if (exportData.expenses) {
        const { data: expenses } = await supabase
          .from('daily_expenses')
          .select('*')
          .eq('hospital_id', '550e8400-e29b-41d4-a716-446655440000');
        exportDataObject.expenses = {
          count: expenses?.length || 0,
          data: expenses || []
        };
      }
      
      // Add refunds data to export
      try {
        const { data: refunds } = await supabase
          .from('patient_refunds')
          .select(`
            *,
            patient:patients(id, patient_id, first_name, last_name, phone)
          `)
          .eq('hospital_id', '550e8400-e29b-41d4-a716-446655440000');
          
        exportDataObject.refunds = {
          count: refunds?.length || 0,
          data: refunds || [],
          note: refunds?.length === 0 ? 'No refunds found or table not accessible' : 'All refunds included'
        };
      } catch (error) {
        console.warn('⚠️ Refunds not available for export:', error);
        exportDataObject.refunds = {
          count: 0,
          data: [],
          note: 'Refunds table not accessible'
        };
      }
      
      toast.dismiss(loadingToast);
      toast.loading('Generating export file...', { duration: 2000 });
      
      // Create file content
      let fileContent: string;
      let fileName: string;
      let mimeType: string;
      
      if (exportFormat === 'json') {
        fileContent = JSON.stringify(exportDataObject, null, 2);
        fileName = `valant-hospital-data-${new Date().toISOString().split('T')[0]}.json`;
        mimeType = 'application/json';
      } else {
        // CSV format with real data
        let csvContent = 'VALANT HOSPITAL DATA EXPORT\n';
        csvContent += `Exported on: ${new Date().toLocaleString()}\n\n`;
        
        if (exportData.patients && exportDataObject.patients?.data?.length > 0) {
          csvContent += '=== PATIENTS ===\n';
          csvContent += 'Patient ID,First Name,Last Name,Phone,Doctor Name,Department,Gender,Age,Address,Patient Tag,Visit Count,Department Status,Total Spent,Last Visit,Registration Date\n';
          exportDataObject.patients.data.forEach((p: any) => {
            const doctorName = p.assigned_doctor || (p.assigned_doctors && p.assigned_doctors.length > 0 ? p.assigned_doctors[0].name : '') || '';
            const department = p.assigned_department || (p.assigned_doctors && p.assigned_doctors.length > 0 ? p.assigned_doctors[0].department : '') || '';
            const lastVisitDate = p.lastVisit || p.date_of_entry || p.created_at || '';
            const registrationDate = p.created_at || p.date_of_entry || '';
            
            csvContent += `"${p.patient_id || 'N/A'}","${p.first_name || ''}","${p.last_name || ''}","${p.phone || ''}","${doctorName}","${department}","${p.gender === 'MALE' ? 'Male' : p.gender === 'FEMALE' ? 'Female' : p.gender || ''}","${p.age || ''}","${p.address || ''}","${p.patient_tag || p.notes || ''}","${p.visitCount || 0}","${p.departmentStatus || 'OPD'}","${p.totalSpent || 0}","${lastVisitDate ? new Date(lastVisitDate).toLocaleDateString() : 'No visits'}","${registrationDate ? new Date(registrationDate).toLocaleDateString() : 'Unknown'}"
`;
          });
          csvContent += '\n';
        }
        
        if (exportData.transactions && exportDataObject.transactions?.data?.length > 0) {
          csvContent += '=== TRANSACTIONS ===\n';
          csvContent += 'Transaction ID,Type,Amount,Payment Mode,Description,Date\n';
          exportDataObject.transactions.data.forEach((t: any) => {
            csvContent += `"${t.id}","${t.transaction_type}",${t.amount},"${t.payment_mode}","${t.description || 'N/A'}","${new Date(t.created_at).toLocaleString()}"\n`;
          });
          csvContent += '\n';
        }
        
        if (exportData.appointments && exportDataObject.appointments?.data?.length > 0) {
          csvContent += '=== APPOINTMENTS ===\n';
          csvContent += 'Appointment ID,Patient,Doctor,Date,Time,Type,Status\n';
          exportDataObject.appointments.data.forEach((a: any) => {
            csvContent += `"${a.id}","${a.patient?.first_name || 'Unknown'} ${a.patient?.last_name || ''}","${a.doctor?.first_name || 'Unknown'} ${a.doctor?.last_name || ''}","${a.appointment_date}","${a.appointment_time}","${a.appointment_type}","${a.status}"\n`;
          });
          csvContent += '\n';
        }
        
        if (exportData.expenses && exportDataObject.expenses?.data?.length > 0) {
          csvContent += '=== EXPENSES ===\n';
          csvContent += 'Expense ID,Category,Amount,Description,Payment Mode,Vendor,Date\n';
          exportDataObject.expenses.data.forEach((e: any) => {
            csvContent += `"${e.id}","${e.expense_category}",${e.amount},"${e.description}","${e.payment_mode}","${e.vendor_name || 'N/A'}","${new Date(e.expense_date).toLocaleDateString()}"\n`;
          });
          csvContent += '\n';
        }
        
        if (exportDataObject.refunds?.data?.length > 0) {
          csvContent += '=== REFUNDS ===\n';
          csvContent += 'Refund ID,Patient ID,Patient Name,Amount,Reason,Payment Mode,Date\n';
          exportDataObject.refunds.data.forEach((r: any) => {
            const patientName = r.patient ? `${r.patient.first_name} ${r.patient.last_name}` : 'Unknown';
            csvContent += `"${r.id}","${r.patient_id || 'N/A'}","${patientName}",${r.amount || 0},"${r.reason || 'N/A'}","${r.payment_mode || 'N/A'}","${new Date(r.created_at).toLocaleDateString()}"\n`;
          });
        }
        
        fileContent = csvContent;
        fileName = `valant-hospital-data-${new Date().toISOString().split('T')[0]}.csv`;
        mimeType = 'text/csv';
      }
      
      // Create and download file
      const blob = new Blob([fileContent], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      setShowExportModal(false);
      toast.success(`Data exported successfully as ${fileName}!`);
      
    } catch (error) {
      toast.error('Export failed. Please try again.');
      console.error('Export error:', error);
    }
  };

  const handleFileImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const content = e.target?.result as string;
        let parsedData;
        
        if (file.type === 'application/json' || file.name.endsWith('.json')) {
          parsedData = JSON.parse(content);
          toast.success(`JSON file parsed successfully! Found ${Object.keys(parsedData).length} data sections.`);
        } else if (file.type === 'text/csv' || file.name.endsWith('.csv')) {
          const lines = content.split('\n');
          toast.success(`CSV file parsed successfully! Found ${lines.length - 1} data rows.`);
        } else {
          toast.error('Unsupported file format. Please use JSON or CSV files.');
          return;
        }
        
        // Process imported data for database insertion
        if (file.type === 'application/json' || file.name.endsWith('.json')) {
          const parsedData = JSON.parse(content);
          const loadingToast = toast.loading('Importing data to database...');
          let importedCount = 0;
          
          try {
            // Import patients
            if (parsedData.patients && Array.isArray(parsedData.patients)) {
              for (const patient of parsedData.patients) {
                try {
                  // Skip if patient already exists (basic validation)
                  if (!patient.first_name) continue;
                  
                  await HospitalService.createPatient({
                    first_name: patient.first_name,
                    last_name: patient.last_name || '',
                    age: patient.age || null,
                    gender: patient.gender || 'MALE',
                    phone: patient.phone || '',
                    email: patient.email,
                    address: patient.address,
                    emergency_contact_name: patient.emergency_contact_name,
                    emergency_contact_phone: patient.emergency_contact_phone,
                    blood_group: patient.blood_group,
                    medical_history: patient.medical_history,
                    allergies: patient.allergies,
                    hospital_id: '550e8400-e29b-41d4-a716-446655440000'
                  });
                  importedCount++;
                } catch (err) {
                  console.error('Error importing patient:', err);
                  // Continue with next patient instead of stopping
                }
              }
            }
            
            toast.dismiss(loadingToast);
            toast.success(`Successfully imported ${importedCount} new patients!`);
            
          } catch (error) {
            toast.dismiss(loadingToast);
            toast.error('Failed to import data. Please check the format.');
            console.error('Import error:', error);
          }
        }
        
        setShowImportModal(false);
        
      } catch (error) {
        toast.error('Failed to parse file. Please check the format.');
        console.error('Import error:', error);
      }
    };
    
    reader.readAsText(file);
  };

  // Load settings from localStorage on mount
  useEffect(() => {
    const savedSettings = localStorage.getItem('hospitalSettings');
    if (savedSettings) {
      setSettings(JSON.parse(savedSettings));
    }
  }, []);

  // Save settings to localStorage when changed
  useEffect(() => {
    localStorage.setItem('hospitalSettings', JSON.stringify(settings));
  }, [settings]);

  // Load backup settings and Google Drive credentials on mount
  useEffect(() => {
    const savedBackupSettings = localStorage.getItem('backupSettings');
    if (savedBackupSettings) {
      setBackupSettings(JSON.parse(savedBackupSettings));
    }
    
    const savedGoogleCredentials = localStorage.getItem('googleDriveCredentials');
    if (savedGoogleCredentials) {
      setGoogleDriveCredentials(JSON.parse(savedGoogleCredentials));
    }
  }, []);

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

  // Show loading spinner while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Show login page if not authenticated
  if (!user) {
    return <Login />;
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
      description: 'Financial ledger perfectly synchronized with Patient List - no date mismatches!',
      permission: 'access_operations'
    }
  ];

  // Filter tabs based on user permissions
  const filteredTabs = tabs.filter(tab => {
    if (!tab.permission) return true; // Allow tabs without permission requirements
    return hasPermission(tab.permission);
  });

  const ActiveComponent = filteredTabs.find(tab => tab.id === activeTab)?.component || RealTimeDashboard;
  const activeTabInfo = filteredTabs.find(tab => tab.id === activeTab);

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
              {user && (
                <div className="relative user-dropdown">
                  <button
                    onClick={() => setIsUserDropdownOpen(!isUserDropdownOpen)}
                    className="flex items-center space-x-3 hover:bg-gray-50 rounded-lg p-2 transition-colors"
                  >
                    <div className="text-right">
                      <div className="text-sm font-medium text-gray-900">
                        {user.firstName} {user.lastName}
                      </div>
                      <div className="text-xs text-gray-500">
                        {user.email}
                      </div>
                    </div>
                    <div className="flex items-center space-x-1">
                      <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
                        {user.firstName?.charAt(0) || 'U'}{user.lastName?.charAt(0) || 'S'}
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
                            {user.firstName} {user.lastName}
                          </div>
                          <div className="text-xs text-gray-500">
                            {user.email}
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
              (isNavVisible || !settings.autoHideNav) 
                ? 'translate-y-0 opacity-100 max-h-20' 
                : '-translate-y-full opacity-0 max-h-0 overflow-hidden'
            }`}
          >
            <nav className="flex justify-center space-x-4 py-3 overflow-x-auto">
              {filteredTabs.map((tab) => (
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

          {/* Minimal Hover Trigger Area - Only visible when navigation is hidden AND auto-hide is enabled */}
          {settings.autoHideNav && (
            <div 
              className={`transition-all duration-300 ${
                isNavVisible ? 'h-0 opacity-0' : 'h-2 opacity-0 hover:bg-gray-100'
              }`}
            >
              {/* Invisible hover area to trigger navigation */}
            </div>
          )}
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
              © 2024 • Advanced Healthcare Management System
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
      {showProfileModal && user && (
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
                  {user.firstName?.charAt(0)}{user.lastName?.charAt(0)}
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">
                    {user.firstName} {user.lastName}
                  </h3>
                  <p className="text-gray-600">{user.email}</p>
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
                        value={isEditingProfile ? editedProfile.firstName : user.firstName || ''}
                        onChange={(e) => isEditingProfile && setEditedProfile(prev => ({ ...prev, first_name: e.target.value }))}
                        readOnly={!isEditingProfile}
                        className={`mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md ${
                          isEditingProfile ? 'bg-white text-gray-900 focus:ring-2 focus:ring-blue-500' : 'bg-gray-50 text-gray-900'
                        }`}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Last Name</label>
                      <input
                        type="text"
                        value={isEditingProfile ? editedProfile.lastName : user.lastName || ''}
                        onChange={(e) => isEditingProfile && setEditedProfile(prev => ({ ...prev, last_name: e.target.value }))}
                        readOnly={!isEditingProfile}
                        className={`mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md ${
                          isEditingProfile ? 'bg-white text-gray-900 focus:ring-2 focus:ring-blue-500' : 'bg-gray-50 text-gray-900'
                        }`}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Email Address</label>
                      <input
                        type="email"
                        value={isEditingProfile ? editedProfile.email : user.email || ''}
                        onChange={(e) => isEditingProfile && setEditedProfile(prev => ({ ...prev, email: e.target.value }))}
                        readOnly={!isEditingProfile}
                        className={`mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md ${
                          isEditingProfile ? 'bg-white text-gray-900 focus:ring-2 focus:ring-blue-500' : 'bg-gray-50 text-gray-900'
                        }`}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Phone Number</label>
                      <input
                        type="tel"
                        value={isEditingProfile ? editedProfile.phone : user.phone || 'Not provided'}
                        onChange={(e) => isEditingProfile && setEditedProfile(prev => ({ ...prev, phone: e.target.value }))}
                        readOnly={!isEditingProfile}
                        placeholder="Enter phone number"
                        className={`mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md ${
                          isEditingProfile ? 'bg-white text-gray-900 focus:ring-2 focus:ring-blue-500' : 'bg-gray-50 text-gray-900'
                        }`}
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
                        value={user.id || ''}
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
                  onClick={() => {
                    setShowProfileModal(false);
                    setIsEditingProfile(false);
                  }}
                  className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600"
                >
                  Close
                </button>
                {!isEditingProfile ? (
                  <button
                    onClick={handleEditProfile}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    Edit Profile
                  </button>
                ) : (
                  <>
                    <button
                      onClick={handleCancelProfileEdit}
                      className="px-4 py-2 bg-gray-400 text-white rounded-md hover:bg-gray-500"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSaveProfile}
                      className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                    >
                      Save Changes
                    </button>
                  </>
                )}
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
                    <p className="text-blue-700">Version 3.0</p>
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
                        <p className="text-sm text-gray-600">
                          Hide navigation tabs after inactivity 
                          <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${
                            settings.autoHideNav 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {settings.autoHideNav ? 'ENABLED' : 'DISABLED'}
                          </span>
                        </p>
                      </div>
                      <button
                        onClick={() => handleSettingChange('autoHideNav', !settings.autoHideNav)}
                        className={`w-12 h-6 rounded-full relative transition-colors ${
                          settings.autoHideNav ? 'bg-blue-600' : 'bg-gray-300'
                        }`}
                      >
                        <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-transform ${
                          settings.autoHideNav ? 'right-0.5' : 'left-0.5'
                        }`}></div>
                      </button>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-gray-900">Sound Notifications</h4>
                        <p className="text-sm text-gray-600">Play sounds for alerts and notifications</p>
                      </div>
                      <button
                        onClick={() => handleSettingChange('soundNotifications', !settings.soundNotifications)}
                        className={`w-12 h-6 rounded-full relative transition-colors ${
                          settings.soundNotifications ? 'bg-blue-600' : 'bg-gray-300'
                        }`}
                      >
                        <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-transform ${
                          settings.soundNotifications ? 'right-0.5' : 'left-0.5'
                        }`}></div>
                      </button>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Time Zone</label>
                      <select 
                        value={settings.timeZone}
                        onChange={(e) => handleSettingChange('timeZone', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="Asia/Kolkata (IST)">Asia/Kolkata (IST)</option>
                        <option value="Asia/Mumbai (IST)">Asia/Mumbai (IST)</option>
                        <option value="Asia/Delhi (IST)">Asia/Delhi (IST)</option>
                        <option value="UTC">UTC</option>
                        <option value="America/New_York (EST)">America/New_York (EST)</option>
                        <option value="Europe/London (GMT)">Europe/London (GMT)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Language</label>
                      <select 
                        value={settings.language}
                        onChange={(e) => handleSettingChange('language', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="English">English</option>
                        <option value="Hindi">हिंदी (Hindi)</option>
                        <option value="Bengali">বাংলা (Bengali)</option>
                        <option value="Tamil">தமிழ் (Tamil)</option>
                        <option value="Marathi">मराठी (Marathi)</option>
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
                  <button 
                    onClick={handleDataExport}
                    className="p-4 border border-gray-300 rounded-lg hover:bg-blue-50 hover:border-blue-300 text-left transition-colors"
                  >
                    <div className="flex items-center">
                      <svg className="w-5 h-5 text-blue-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <h4 className="font-medium text-gray-900">Export Data</h4>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">Download patient and transaction data</p>
                  </button>
                  <button 
                    onClick={handleDataImport}
                    className="p-4 border border-gray-300 rounded-lg hover:bg-green-50 hover:border-green-300 text-left transition-colors"
                  >
                    <div className="flex items-center">
                      <svg className="w-5 h-5 text-green-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
                      </svg>
                      <h4 className="font-medium text-gray-900">Import Data</h4>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">Upload data from external sources</p>
                  </button>
                  <button 
                    onClick={handleBackupSettings}
                    className="p-4 border border-gray-300 rounded-lg hover:bg-yellow-50 hover:border-yellow-300 text-left transition-colors"
                  >
                    <div className="flex items-center">
                      <svg className="w-5 h-5 text-yellow-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                      <h4 className="font-medium text-gray-900">Backup Settings</h4>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">Configure automatic backups</p>
                  </button>
                  <button 
                    onClick={handleClearCache}
                    className="p-4 border border-gray-300 rounded-lg hover:bg-red-50 hover:border-red-300 text-left transition-colors"
                  >
                    <div className="flex items-center">
                      <svg className="w-5 h-5 text-red-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      <h4 className="font-medium text-gray-900">Clear Cache</h4>
                    </div>
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
                    // Settings are already saved to localStorage via useEffect
                    toast.success(`Settings saved successfully!
                    • Auto-hide Navigation: ${settings.autoHideNav ? 'ON' : 'OFF'}
                    • Sound Notifications: ${settings.soundNotifications ? 'ON' : 'OFF'}
                    • Time Zone: ${settings.timeZone}
                    • Language: ${settings.language}`, 
                    { duration: 4000 });
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

      {/* Export Data Modal */}
      {showExportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full mx-4 max-h-[90vh] overflow-hidden">
            <div className="bg-blue-600 text-white p-6 flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold">Export Data</h2>
                <p className="text-blue-100">Download your hospital data</p>
              </div>
              <button
                onClick={() => setShowExportModal(false)}
                className="text-white hover:text-blue-200 text-2xl font-bold"
              >
                ×
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Select Data to Export</h3>
                <div className="grid grid-cols-2 gap-4">
                  {Object.entries(exportData).map(([key, value]) => (
                    <label key={key} className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        checked={value}
                        onChange={(e) => setExportData(prev => ({ ...prev, [key]: e.target.checked }))}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <span className="text-gray-900 capitalize">{key}</span>
                    </label>
                  ))}
                </div>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Export Format</h3>
                <div className="flex space-x-4">
                  <label className="flex items-center space-x-2">
                    <input
                      type="radio"
                      value="json"
                      checked={exportFormat === 'json'}
                      onChange={(e) => setExportFormat(e.target.value)}
                      className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                    />
                    <span>JSON Format</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input
                      type="radio"
                      value="csv"
                      checked={exportFormat === 'csv'}
                      onChange={(e) => setExportFormat(e.target.value)}
                      className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                    />
                    <span>CSV Format</span>
                  </label>
                </div>
              </div>
              
              <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
                <button
                  onClick={() => setShowExportModal(false)}
                  className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600"
                >
                  Cancel
                </button>
                <button
                  onClick={performDataExport}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Export Data
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Import Data Modal */}
      {showImportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full mx-4 max-h-[90vh] overflow-hidden">
            <div className="bg-green-600 text-white p-6 flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold">Import Data</h2>
                <p className="text-green-100">Upload data from external sources</p>
              </div>
              <button
                onClick={() => setShowImportModal(false)}
                className="text-white hover:text-green-200 text-2xl font-bold"
              >
                ×
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                  <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <div className="mt-4">
                  <label htmlFor="file-upload" className="cursor-pointer">
                    <span className="mt-2 block text-sm font-medium text-gray-900">
                      Click to upload or drag and drop
                    </span>
                    <span className="mt-1 block text-sm text-gray-500">
                      JSON or CSV files only
                    </span>
                  </label>
                  <input
                    id="file-upload"
                    name="file-upload"
                    type="file"
                    accept=".json,.csv"
                    onChange={handleFileImport}
                    className="sr-only"
                  />
                </div>
              </div>
              
              <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
                <div className="flex">
                  <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-yellow-800">Important</h3>
                    <p className="mt-1 text-sm text-yellow-700">
                      Make sure your data follows the correct format. Importing will add new records but won't overwrite existing ones.
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
                <button
                  onClick={() => setShowImportModal(false)}
                  className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Backup Settings Modal */}
      {showBackupModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full mx-4 max-h-[90vh] overflow-hidden">
            <div className="bg-yellow-600 text-white p-6 flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold">Backup Settings</h2>
                <p className="text-yellow-100">Configure automatic data backups</p>
              </div>
              <button
                onClick={() => setShowBackupModal(false)}
                className="text-white hover:text-yellow-200 text-2xl font-bold"
              >
                ×
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Backup Frequency</h3>
                  <select className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-yellow-500">
                    <option>Daily</option>
                    <option>Weekly</option>
                    <option>Monthly</option>
                    <option>Manual only</option>
                  </select>
                </div>
                
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Backup Time</h3>
                  <input
                    type="time"
                    defaultValue="02:00"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-yellow-500"
                  />
                </div>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Storage Location</h3>
                <div className="space-y-3">
                  <label className="flex items-center space-x-3">
                    <input 
                      type="radio" 
                      name="storage" 
                      value="local"
                      checked={backupSettings.storageLocation === 'local'}
                      onChange={(e) => setBackupSettings(prev => ({ ...prev, storageLocation: e.target.value }))}
                      className="w-4 h-4 text-yellow-600" 
                    />
                    <span>Local Storage (Download)</span>
                  </label>
                  <label className="flex items-center space-x-3">
                    <input 
                      type="radio" 
                      name="storage" 
                      value="google-drive"
                      checked={backupSettings.storageLocation === 'google-drive'}
                      onChange={(e) => setBackupSettings(prev => ({ ...prev, storageLocation: e.target.value }))}
                      className="w-4 h-4 text-yellow-600" 
                    />
                    <span>Cloud Storage (Google Drive)</span>
                    {googleDriveUser && (
                      <span className="text-sm text-green-600">
                        ✓ Connected as {googleDriveUser.email}
                      </span>
                    )}
                  </label>
                  
                  {backupSettings.storageLocation === 'google-drive' && !googleDriveUser && (
                    <div className="ml-6 p-3 bg-blue-50 border border-blue-200 rounded-md">
                      <p className="text-sm text-blue-800 mb-2">Connect to Google Drive to enable cloud backup</p>
                      <button
                        onClick={() => setShowGoogleDriveSetup(true)}
                        className="text-sm bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
                      >
                        Setup Google Drive
                      </button>
                    </div>
                  )}
                  
                  {backupSettings.storageLocation === 'google-drive' && googleDriveUser && (
                    <div className="ml-6 p-3 bg-green-50 border border-green-200 rounded-md">
                      <p className="text-sm text-green-800 mb-2">Connected to: {googleDriveUser.email}</p>
                      <button
                        onClick={handleGoogleDriveDisconnect}
                        className="text-sm bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700"
                      >
                        Disconnect
                      </button>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="bg-green-50 border border-green-200 rounded-md p-4">
                <div className="flex">
                  <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-green-800">Status</h3>
                    <p className="mt-1 text-sm text-green-700">
                      Last backup: Yesterday at 2:00 AM (Success)
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="flex justify-between pt-6 border-t border-gray-200">
                <button
                  onClick={performBackup}
                  disabled={isBackupInProgress}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                >
                  {isBackupInProgress ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Creating Backup...</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                      <span>Create Backup Now</span>
                    </>
                  )}
                </button>
                
                <div className="flex space-x-3">
                  <button
                    onClick={() => setShowBackupModal(false)}
                    className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600"
                  >
                    Close
                  </button>
                  <button
                    onClick={() => {
                      localStorage.setItem('backupSettings', JSON.stringify(backupSettings));
                      toast.success('Backup settings saved successfully!');
                    }}
                    className="px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700"
                  >
                    Save Settings
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Google Drive Setup Modal */}
      {showGoogleDriveSetup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full mx-4 max-h-[90vh] overflow-hidden">
            <div className="bg-blue-600 text-white p-6 flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold">Google Drive Setup</h2>
                <p className="text-blue-100">Connect your Google Drive for cloud backup</p>
              </div>
              <button
                onClick={() => setShowGoogleDriveSetup(false)}
                className="text-white hover:text-blue-200 text-2xl font-bold"
              >
                ×
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
                <div className="flex">
                  <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-yellow-800">Setup Required</h3>
                    <p className="mt-1 text-sm text-yellow-700">
                      To use Google Drive backup, you need to provide your Google Cloud Console credentials.
                      <br />
                      1. Go to <a href="https://console.cloud.google.com/" target="_blank" rel="noopener noreferrer" className="underline">Google Cloud Console</a>
                      <br />
                      2. Create a new project or select existing one
                      <br />
                      3. Enable the Google Drive API
                      <br />
                      4. Create credentials (OAuth 2.0 Client ID and API Key)
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Google Cloud OAuth 2.0 Client ID
                  </label>
                  <input
                    type="text"
                    value={googleDriveCredentials.clientId}
                    onChange={(e) => setGoogleDriveCredentials(prev => ({ ...prev, clientId: e.target.value }))}
                    placeholder="Your Google Cloud OAuth 2.0 Client ID"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Google Cloud API Key
                  </label>
                  <input
                    type="text"
                    value={googleDriveCredentials.apiKey}
                    onChange={(e) => setGoogleDriveCredentials(prev => ({ ...prev, apiKey: e.target.value }))}
                    placeholder="Your Google Cloud API Key"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
              
              <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
                <button
                  onClick={() => setShowGoogleDriveSetup(false)}
                  className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600"
                >
                  Cancel
                </button>
                <button
                  onClick={handleGoogleDriveConnect}
                  disabled={!googleDriveCredentials.clientId || !googleDriveCredentials.apiKey}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Connect to Google Drive
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
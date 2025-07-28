import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { supabase } from '../config/supabaseNew';
import type { 
  PatientAdmissionWithRelations, 
  Patient,
  DashboardStats,
  User
} from '../config/supabaseNew';
import HospitalService from '../services/hospitalService';
import DischargePatientModal from './DischargePatientModal';
import IPDServiceManager from './IPDServiceManager';
import IPDPartialBilling from './IPDPartialBilling';
import IPDNavigation from './IPDNavigation';
import IPDCard from './IPDCard';
import { exportToExcel, formatDate, formatCurrency } from '../utils/excelExport';

// Normalize room type to match database constraint - FIXED
const normalizeRoomType = (roomType: string): string => {
  if (!roomType) return 'GENERAL';
  
  const normalized = roomType.toUpperCase().trim();
  
  // Only allow exact constraint values
  const validRoomTypes = ['GENERAL', 'PRIVATE', 'ICU', 'EMERGENCY'];
  
  if (validRoomTypes.includes(normalized)) {
    return normalized;
  }
  
  // Map variations to valid constraint values
  const roomTypeMap: { [key: string]: string } = {
    'SEMI_PRIVATE': 'PRIVATE',
    'DELUXE': 'PRIVATE', 
    'STANDARD': 'GENERAL',
    'VIP': 'PRIVATE',
    'SEMI': 'PRIVATE',
    'REGULAR': 'GENERAL'
  };
  
  return roomTypeMap[normalized] || 'GENERAL';
};

// Billing Cell Component
const BillingCell: React.FC<{ admission: any; onManageBilling: () => void }> = ({ admission, onManageBilling }) => {
  const [billingData, setBillingData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    calculateBilling();
  }, [admission]);

  const calculateBilling = async () => {
    try {
      setLoading(true);
      
      // Get all transactions for this patient after admission
      const { data: transactions, error } = await supabase
        .from('patient_transactions')
        .select('*')
        .eq('patient_id', admission.patient_id)
        .gte('created_at', admission.admission_date)
        .eq('status', 'COMPLETED');

      if (error) {
        console.error('Error fetching transactions:', error);
        setBillingData({ netAmount: admission.total_amount || 0 });
        return;
      }

      // Calculate services from patient list and IPD services
      const serviceTransactions = transactions?.filter(t => 
        t.transaction_type === 'SERVICE' && t.amount > 0
      ) || [];
      const servicesTotal = serviceTransactions.reduce((sum, t) => sum + t.amount, 0);

      // Calculate daily charges
      const admissionDate = new Date(admission.admission_date);
      const currentDate = new Date();
      const daysDiff = Math.ceil((currentDate.getTime() - admissionDate.getTime()) / (1000 * 60 * 60 * 24));
      const stayDays = daysDiff < 1 ? 1 : daysDiff;

      const DOCTORS_DAILY_CHARGE = 500;
      const RMO_DAILY_CHARGE = 300;
      const NURSING_DAILY_CHARGE = 200;
      const BED_DAILY_CHARGE = 800;
      
      const totalDailyCharges = (DOCTORS_DAILY_CHARGE + RMO_DAILY_CHARGE + NURSING_DAILY_CHARGE + BED_DAILY_CHARGE) * stayDays;

      // Calculate advance payments (ADMISSION_FEE transactions)
      const advancePayments = transactions?.filter(t => 
        t.transaction_type === 'ADMISSION_FEE' && t.amount > 0
      ) || [];
      const totalAdvancePayments = advancePayments.reduce((sum, t) => sum + t.amount, 0);

      // Calculate partial payments
      const partialPayments = transactions?.filter(t => 
        t.transaction_type === 'IPD_PAYMENT' && t.amount > 0
      ) || [];
      const totalPartialPayments = partialPayments.reduce((sum, t) => sum + t.amount, 0);

      const grandTotal = servicesTotal + totalDailyCharges;
      const totalPaid = totalAdvancePayments + totalPartialPayments;
      const netAmount = grandTotal - totalPaid;

      setBillingData({
        servicesTotal,
        dailyCharges: totalDailyCharges,
        stayDays,
        grandTotal,
        advancePayments: totalAdvancePayments,
        partialPayments: totalPartialPayments,
        totalPaid,
        netAmount: Math.max(0, netAmount)
      });
    } catch (error) {
      console.error('Error calculating billing:', error);
      setBillingData({ netAmount: admission.total_amount || 0 });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center">
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-600 mx-auto mb-1"></div>
        <div className="text-xs text-gray-500">Calculating...</div>
      </div>
    );
  }

  return (
    <div>
      <div className="text-xs text-gray-600 mb-1">
        <div>Services: ₹{billingData?.servicesTotal?.toLocaleString() || '0'}</div>
        <div>Daily ({billingData?.stayDays || 0}d): ₹{billingData?.dailyCharges?.toLocaleString() || '0'}</div>
        <div>Advance: -₹{billingData?.advancePayments?.toLocaleString() || '0'}</div>
        <div>Partial: -₹{billingData?.partialPayments?.toLocaleString() || '0'}</div>
      </div>
      <div className="font-semibold text-green-600 mb-1">
        Net: ₹{billingData?.netAmount?.toLocaleString() || '0'}
      </div>
      <button
        onClick={onManageBilling}
        className="bg-green-600 text-white px-2 py-1 rounded text-xs hover:bg-green-700"
        title="Manage Billing & Payments"
      >
        💰 Billing
      </button>
    </div>
  );
};

const EnhancedIPDManagement: React.FC = () => {
  console.log('🔄 EnhancedIPDManagement component loaded - COUNTS REMOVED FROM TABS');
  const [admissions, setAdmissions] = useState<PatientAdmissionWithRelations[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'active' | 'discharged'>('active');
  
  // Separate counts for both active and discharged patients
  const [activePatientsCount, setActivePatientsCount] = useState<number>(0);
  const [dischargedPatientsCount, setDischargedPatientsCount] = useState<number>(0);
  const [countsLoading, setCountsLoading] = useState(false);
  
  // Discharge modal state
  const [showDischargeModal, setShowDischargeModal] = useState(false);
  const [selectedAdmissionForDischarge, setSelectedAdmissionForDischarge] = useState<PatientAdmissionWithRelations | null>(null);
  
  // IPD Service Manager modal state
  const [showServiceManager, setShowServiceManager] = useState(false);
  const [selectedAdmissionForServices, setSelectedAdmissionForServices] = useState<PatientAdmissionWithRelations | null>(null);
  
  // IPD Partial Billing modal state
  const [showPartialBilling, setShowPartialBilling] = useState(false);
  const [selectedAdmissionForBilling, setSelectedAdmissionForBilling] = useState<PatientAdmissionWithRelations | null>(null);
  
  // IPD Documents modal state
  const [showIPDDocuments, setShowIPDDocuments] = useState(false);
  const [selectedAdmissionForDocuments, setSelectedAdmissionForDocuments] = useState<PatientAdmissionWithRelations | null>(null);
  
  // Discharge Card modal state
  const [showDischargeCard, setShowDischargeCard] = useState(false);
  const [selectedAdmissionForDischargeCard, setSelectedAdmissionForDischargeCard] = useState<PatientAdmissionWithRelations | null>(null);

  useEffect(() => {
    console.log('🚀 IPD Management useEffect triggered, activeTab:', activeTab);
    // Clear previous data when switching tabs
    setAdmissions([]);
    setLoading(true);
    
    // Fix any status inconsistencies
    fixStatusInconsistencies();
    loadData();
    loadCounts(); // Load both counts instead of broken stats
  }, [activeTab]);

  // Fix status inconsistencies and migrate lowercase values
  const fixStatusInconsistencies = async () => {
    try {
      console.log('🔧 Fixing status inconsistencies...');
      
      // First, update any lowercase status values
      const { error: dischargedError } = await supabase
        .from('patient_admissions')
        .update({ status: 'DISCHARGED' })
        .eq('status', 'discharged');
      
      if (dischargedError) {
        console.error('Error migrating discharged status:', dischargedError);
      }

      const { error: activeError } = await supabase
        .from('patient_admissions')
        .update({ status: 'ACTIVE' })
        .eq('status', 'active');
      
      if (activeError) {
        console.error('Error migrating active status:', activeError);
      }

      // IMPORTANT: Fix patients who have actual_discharge_date but status is still ACTIVE
      const { data: inconsistentAdmissions, error: fetchError } = await supabase
        .from('patient_admissions')
        .select('id, status, actual_discharge_date')
        .not('actual_discharge_date', 'is', null)
        .eq('status', 'ACTIVE');

      if (fetchError) {
        console.error('Error fetching inconsistent admissions:', fetchError);
        return;
      }

      if (inconsistentAdmissions && inconsistentAdmissions.length > 0) {
        console.log(`🚨 Found ${inconsistentAdmissions.length} patients with discharge date but ACTIVE status`);
        
        // Update all these to DISCHARGED
        const ids = inconsistentAdmissions.map(a => a.id);
        const { error: updateError } = await supabase
          .from('patient_admissions')
          .update({ status: 'DISCHARGED' })
          .in('id', ids);

        if (updateError) {
          console.error('Error updating inconsistent statuses:', updateError);
        } else {
          console.log(`✅ Fixed status for ${inconsistentAdmissions.length} discharged patients`);
          toast.success(`Fixed status for ${inconsistentAdmissions.length} discharged patients`);
        }
      }

      // Also check for admissions with discharge_bills but ACTIVE status
      const { data: billsData, error: billsError } = await supabase
        .from('discharge_bills')
        .select('admission_id');

      if (!billsError && billsData) {
        const admissionIds = billsData.map(b => b.admission_id);
        if (admissionIds.length > 0) {
          const { error: billUpdateError } = await supabase
            .from('patient_admissions')
            .update({ status: 'DISCHARGED' })
            .in('id', admissionIds)
            .eq('status', 'ACTIVE');

          if (!billUpdateError) {
            console.log('✅ Updated status for patients with discharge bills');
          }
        }
      }

    } catch (error) {
      console.error('Error fixing status inconsistencies:', error);
    }
  };

  const loadData = async () => {
    console.log('📥 LoadData called for activeTab:', activeTab);
    setLoading(true);
    try {
      console.log('👥 Loading admissions...');
      await loadAdmissions();
      await loadPatients();
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
      console.log('✅ Loading complete, loading state set to false');
    }
  };

  const loadAdmissions = async () => {
    try {
      console.log('🔍 Loading IPD admissions for tab:', activeTab);
      const statusFilter = activeTab === 'active' ? 'ACTIVE' : 'DISCHARGED';
      console.log('🎯 Filtering for status:', statusFilter);
      
      // Add error boundary to catch any rendering issues
      if (activeTab === 'discharged') {
        console.log('📋 Loading discharged patients view...');
      }

      // First, check ALL admissions to see what exists
      const { data: allAdmissions, error: allError } = await supabase
        .from('patient_admissions')
        .select('*')
        .order('created_at', { ascending: false });

      if (allError) {
        console.error('❌ Error loading all admissions:', allError);
      } else {
        console.log('📊 ALL admissions in database:', allAdmissions);
        console.log('📊 Status breakdown:', allAdmissions?.reduce((acc: any, admission) => {
          const status = admission.status || 'NULL';
          acc[status] = (acc[status] || 0) + 1;
          return acc;
        }, {}));
      }

      // Try loading with relationships first
      let admissionsData = [];
      try {
        const { data: relationshipData, error: relationshipError } = await supabase
          .from('patient_admissions')
          .select(`
            *,
            patient:patients(id, patient_id, first_name, last_name, phone, age, blood_group, emergency_contact_name, emergency_contact_phone, address, gender, medical_history, allergies),
            bed:beds(id, bed_number, room_type, daily_rate),
            doctor:doctors(id, name, specialization, department)
          `)
          .eq('status', statusFilter)
          .order('admission_date', { ascending: false });

        if (!relationshipError && relationshipData) {
          console.log('✅ Successfully loaded with relationships');
          console.log('📋 First admission data:', relationshipData[0]);
          admissionsData = relationshipData;
        } else {
          throw relationshipError;
        }
      } catch (relationshipError) {
        console.warn('⚠️ Relationship query failed, trying manual join:', relationshipError);
        
        // Fallback: Load admissions and join manually
        const { data: admissionsOnly, error: admissionsError } = await supabase
          .from('patient_admissions')
          .select('*')
          .eq('status', statusFilter)
          .order('admission_date', { ascending: false });

        if (admissionsError) throw admissionsError;

        // Load patients, beds, and doctors separately
        const patientIds = [...new Set(admissionsOnly?.map(a => a.patient_id) || [])];
        const bedIds = [...new Set(admissionsOnly?.map(a => a.bed_id).filter(Boolean) || [])];
        const doctorIds = [...new Set(admissionsOnly?.map(a => a.doctor_id).filter(Boolean) || [])];

        const [patientsResult, bedsResult, doctorsResult] = await Promise.all([
          supabase.from('patients').select('id, patient_id, first_name, last_name, phone, age, blood_group, emergency_contact_name, emergency_contact_phone, address, gender, medical_history, allergies').in('id', patientIds),
          supabase.from('beds').select('id, bed_number, room_type, daily_rate').in('id', bedIds),
          doctorIds.length > 0 ? supabase.from('doctors').select('id, name, specialization, department').in('id', doctorIds) : { data: [] }
        ]);

        // Manual join
        admissionsData = (admissionsOnly || []).map(admission => ({
          ...admission,
          patient: patientsResult.data?.find(p => p.id === admission.patient_id),
          bed: bedsResult.data?.find(b => b.id === admission.bed_id),
          doctor: doctorsResult.data?.find(d => d.id === admission.doctor_id)
        }));

        console.log('✅ Successfully loaded with manual join');
      }
      
      console.log('📋 Final admissions result:', admissionsData);
      console.log('📋 Found', admissionsData?.length || 0, 'admissions with status:', statusFilter);
      
      // Additional safety check: Filter out any mismatched status
      if (activeTab === 'active') {
        admissionsData = admissionsData?.filter(admission => 
          admission.status === 'ACTIVE' || admission.status === 'active'
        ) || [];
        console.log('🔒 Safety filter: Ensuring only ACTIVE patients in active tab');
      } else {
        admissionsData = admissionsData?.filter(admission => 
          admission.status === 'DISCHARGED' || admission.status === 'discharged'
        ) || [];
        console.log('🔒 Safety filter: Ensuring only DISCHARGED patients in discharged tab');
      }
      
      // IMPORTANT: Debug the count vs list discrepancy
      if (activeTab === 'active') {
        console.log('🚨 DEBUG - Active Count Discrepancy Check:');
        console.log('- Count from database query:', activePatientsCount);
        console.log('- Actual admissions loaded:', admissionsData.length);
        console.log('- Current tab:', activeTab);
        
        if (activePatientsCount !== admissionsData.length) {
          console.log('⚠️ MISMATCH DETECTED! Count:', activePatientsCount, 'vs List:', admissionsData.length);
          
          // Load raw data to see what's happening
          console.log('🔍 Investigating database vs filtered results...');
          
          const { data: rawActive, error: rawError } = await supabase
            .from('patient_admissions')
            .select('id, status, patient_id')
            .eq('status', 'ACTIVE');
            
          if (!rawError && rawActive) {
            console.log('📊 Raw ACTIVE records in DB:', rawActive.length);
            console.log('📋 Raw ACTIVE data:', rawActive);
            
            // Check if these patients have missing relationships
            const patientIds = rawActive.map(r => r.patient_id);
            const { data: patients } = await supabase
              .from('patients')
              .select('id')
              .in('id', patientIds);
              
            console.log('👥 Patients found for active admissions:', patients?.length || 0);
            console.log('🔗 Missing patient relationships:', rawActive.length - (patients?.length || 0));
          }
        }
      }
      
      // Debug doctor data
      if (admissionsData && admissionsData.length > 0) {
        console.log('👨‍⚕️ Doctor data debug:');
        admissionsData.forEach((admission, index) => {
          console.log(`Admission ${index + 1}:`, {
            doctor_id: admission.doctor_id,
            doctor_name: admission.doctor_name,
            doctor_object: admission.doctor,
            department: admission.department
          });
        });
      }
      
      console.log(`🏥 Found ${(admissionsData || []).length} ${statusFilter} admissions`);
      console.log('📊 Setting admissions state with data:', admissionsData);
      setAdmissions(admissionsData || []);
      
      // IMPORTANT: Sync the count with actual loaded data
      if (activeTab === 'active') {
        const actualActiveCount = (admissionsData || []).length;
        if (activePatientsCount !== actualActiveCount) {
          console.log('🔄 Syncing active count with actual data:', actualActiveCount);
          setActivePatientsCount(actualActiveCount);
        }
      } else {
        const actualDischargedCount = (admissionsData || []).length;
        if (dischargedPatientsCount !== actualDischargedCount) {
          console.log('🔄 Syncing discharged count with actual data:', actualDischargedCount);
          setDischargedPatientsCount(actualDischargedCount);
        }
      }
      
      // Debug: Log the current state after setting
      console.log('🔍 Current activeTab:', activeTab);
      console.log('🔍 Admissions data type:', Array.isArray(admissionsData) ? 'array' : typeof admissionsData);
    } catch (error: any) {
      console.error('❌ Error loading admissions:', error);
      console.error('📋 Error details:', error.message, error.stack);
      toast.error(`Failed to load admissions: ${error.message}`);
      setAdmissions([]); // Reset to empty array on error
    }
  };


  const loadPatients = async () => {
    try {
      const { data, error } = await supabase
        .from('patients')
        .select('id, patient_id, first_name, last_name, phone, age, blood_group, emergency_contact_name, emergency_contact_phone, address, gender, medical_history, allergies')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setPatients(data || []);
    } catch (error: any) {
      console.error('Error loading patients:', error);
    }
  };

  const loadCounts = async () => {
    try {
      setCountsLoading(true);
      console.log('📊 Loading admission counts...');
      
      // Load both active and discharged counts in parallel
      const [activeResult, dischargedResult] = await Promise.all([
        supabase
          .from('patient_admissions')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'ACTIVE'),
        supabase
          .from('patient_admissions')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'DISCHARGED')
      ]);

      const activeCount = activeResult.count || 0;
      const dischargedCount = dischargedResult.count || 0;

      console.log('📊 Count results:', { activeCount, dischargedCount });

      setActivePatientsCount(activeCount);
      setDischargedPatientsCount(dischargedCount);

      if (activeResult.error) {
        console.error('❌ Error loading active count:', activeResult.error);
      }
      if (dischargedResult.error) {
        console.error('❌ Error loading discharged count:', dischargedResult.error);
      }

    } catch (error: any) {
      console.error('❌ Error loading counts:', error);
      // Fallback to showing current admissions length
      setActivePatientsCount(activeTab === 'active' ? admissions.length : 0);
      setDischargedPatientsCount(activeTab === 'discharged' ? admissions.length : 0);
    } finally {
      setCountsLoading(false);
    }
  };

  const cleanupOrphanedRecords = async () => {
    try {
      console.log('🧹 Starting cleanup of orphaned admission records...');
      
      // Find admissions with missing patient records
      const { data: allAdmissions, error: admissionError } = await supabase
        .from('patient_admissions')
        .select('id, patient_id, status');
        
      if (admissionError) {
        console.error('❌ Error loading admissions for cleanup:', admissionError);
        return;
      }
      
      if (!allAdmissions || allAdmissions.length === 0) {
        console.log('ℹ️ No admissions found for cleanup');
        return;
      }
      
      // Get all existing patient IDs
      const { data: existingPatients, error: patientError } = await supabase
        .from('patients')
        .select('id');
        
      if (patientError) {
        console.error('❌ Error loading patients for cleanup:', patientError);
        return;
      }
      
      const existingPatientIds = new Set(existingPatients?.map(p => p.id) || []);
      
      // Find orphaned admissions (admissions pointing to non-existent patients)
      const orphanedAdmissions = allAdmissions.filter(admission => 
        !existingPatientIds.has(admission.patient_id)
      );
      
      if (orphanedAdmissions.length === 0) {
        console.log('✅ No orphaned admissions found');
        toast.success('No orphaned records found - database is clean!');
        return;
      }
      
      console.log(`🚨 Found ${orphanedAdmissions.length} orphaned admissions:`, orphanedAdmissions);
      
      // Ask user for confirmation
      const confirmDelete = window.confirm(
        `Found ${orphanedAdmissions.length} orphaned admission records (admissions pointing to deleted patients).\n\n` +
        `Do you want to delete these orphaned records to fix the count discrepancy?\n\n` +
        `This action cannot be undone.`
      );
      
      if (!confirmDelete) {
        console.log('🚫 User cancelled cleanup');
        return;
      }
      
      // Delete orphaned admissions
      const orphanedIds = orphanedAdmissions.map(a => a.id);
      const { error: deleteError } = await supabase
        .from('patient_admissions')
        .delete()
        .in('id', orphanedIds);
        
      if (deleteError) {
        console.error('❌ Error deleting orphaned admissions:', deleteError);
        toast.error('Failed to clean up orphaned records');
        return;
      }
      
      console.log(`✅ Successfully deleted ${orphanedAdmissions.length} orphaned admission records`);
      toast.success(`Cleaned up ${orphanedAdmissions.length} orphaned records! Counts should now be accurate.`);
      
      // Reload data to reflect changes
      await loadData();
      await loadCounts();
      
    } catch (error: any) {
      console.error('❌ Error during cleanup:', error);
      toast.error('Cleanup failed: ' + error.message);
    }
  };

  const loadStats = async () => {
    try {
      // Since get_dashboard_stats RPC doesn't exist, let's build basic stats manually
      const [patientsResult, bedsResult, revenueResult] = await Promise.all([
        supabase.from('patients').select('*', { count: 'exact', head: true }),
        supabase.from('beds').select('*', { count: 'exact', head: true }),
        supabase.from('patient_transactions').select('amount').gte('created_at', new Date().toISOString().split('T')[0])
      ]);

      const totalPatients = patientsResult.count || 0;
      const totalBeds = bedsResult.count || 0;
      const todayRevenue = revenueResult.data?.reduce((sum, t) => sum + (t.amount > 0 ? t.amount : 0), 0) || 0;

      setStats({
        total_patients: totalPatients,
        active_admissions: activePatientsCount,
        available_beds: Math.max(0, totalBeds - activePatientsCount),
        total_beds: totalBeds,
        today_revenue: todayRevenue,
        today_expenses: 0,
        net_revenue: todayRevenue,
        pending_appointments: 0,
        todays_appointments: 0,
        occupancy_rate: totalBeds > 0 ? (activePatientsCount / totalBeds) * 100 : 0
      });

    } catch (error: any) {
      console.error('Error loading stats:', error);
    }
  };



  // Open comprehensive discharge modal instead of simple discharge
  const dischargePatient = (admission: PatientAdmissionWithRelations) => {
    setSelectedAdmissionForDischarge(admission);
    setShowDischargeModal(true);
  };

  const handleDischargeSuccess = async () => {
    setShowDischargeModal(false);
    setSelectedAdmissionForDischarge(null);
    loadData();
    loadCounts(); // Reload counts after discharge
    loadStats();
    toast.success('Patient discharged successfully');
  };

  const handleManageServices = (admission: PatientAdmissionWithRelations) => {
    setSelectedAdmissionForServices(admission);
    setShowServiceManager(true);
  };

  const handleServicesUpdated = () => {
    loadData();
    loadCounts();
    loadStats();
  };

  const handleManageBilling = (admission: PatientAdmissionWithRelations) => {
    setSelectedAdmissionForBilling(admission);
    setShowPartialBilling(true);
  };

  const handleBillCreated = () => {
    setShowPartialBilling(false);
    setSelectedAdmissionForBilling(null);
    loadData();
    loadCounts();
    loadStats();
  };

  const handleShowDocuments = (admission: PatientAdmissionWithRelations) => {
    setSelectedAdmissionForDocuments(admission);
    setShowIPDDocuments(true);
  };

  const handleViewDischargeCard = (admission: PatientAdmissionWithRelations) => {
    setSelectedAdmissionForDischargeCard(admission);
    setShowDischargeCard(true);
  };

  const calculateStayDuration = (admissionDate: string, dischargeDate?: string) => {
    const start = new Date(admissionDate);
    const end = dischargeDate ? new Date(dischargeDate) : new Date();
    const diffTime = Math.abs(end.getTime() - start.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const handleExportToExcel = () => {
    try {
      const exportData = admissions.map(admission => ({
        patient_id: admission.patient?.patient_id || 'N/A',
        patient_name: `${admission.patient?.first_name || ''} ${admission.patient?.last_name || ''}`.trim(),
        age: admission.patient?.age || 'N/A',
        gender: admission.patient?.gender || 'N/A',
        blood_group: admission.patient?.blood_group || 'N/A',
        phone: admission.patient?.phone || 'N/A',
        bed_number: admission.bed?.bed_number || admission.bed_number || 'N/A',
        room_type: admission.bed?.room_type || admission.room_type || 'N/A',
        doctor_name: admission.doctor?.name || admission.doctor_name || admission.assigned_doctor || 'Not Assigned',
        department: admission.doctor?.department || admission.department || 'N/A',
        admission_date: formatDate(admission.admission_date),
        discharge_date: admission.status === 'DISCHARGED' 
          ? (admission.actual_discharge_date 
            ? formatDate(admission.actual_discharge_date) 
            : formatDate(new Date().toISOString())) // Use current date if discharge date is missing
          : 'Still Admitted',
        stay_days: calculateStayDuration(admission.admission_date, admission.actual_discharge_date || (admission.status === 'DISCHARGED' ? new Date().toISOString() : null)),
        status: admission.status,
        emergency_contact_name: admission.patient?.emergency_contact_name || 'N/A',
        emergency_contact_phone: admission.patient?.emergency_contact_phone || 'N/A'
      }));

      const headers = [
        'Patient ID',
        'Patient Name',
        'Age',
        'Gender',
        'Blood Group',
        'Phone',
        'Bed Number',
        'Room Type',
        'Doctor Name',
        'Department',
        'Admission Date',
        'Discharge Date',
        'Stay Days',
        'Status',
        'Emergency Contact Name',
        'Emergency Contact Phone'
      ];

      const success = exportToExcel({
        filename: `IPD_${activeTab}_Report_${new Date().toLocaleDateString('en-IN').replace(/\//g, '-')}`,
        headers,
        data: exportData
      });

      if (success) {
        toast.success('IPD data exported successfully!');
      } else {
        toast.error('Failed to export data');
      }
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Error exporting data');
    }
  };


  // Error fallback UI
  if (!Array.isArray(admissions)) {
    console.error('❌ Admissions is not an array:', admissions);
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="text-center py-12 bg-white rounded-lg shadow-sm">
          <div className="text-6xl mb-4">⚠️</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Data</h3>
          <p className="text-gray-500 mb-4">Unable to load admission data. Please refresh the page.</p>
          <button 
            onClick={() => {
              setAdmissions([]);
              loadData();
            }} 
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
          >
            Reload Data
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800">🏥 Enhanced IPD Management</h1>
        <p className="text-gray-600">Complete In-Patient Department with Bed Management</p>
      </div>

      {/* Statistics Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
          <div className="bg-blue-50 p-4 rounded-lg border-2 border-blue-200">
            <div className="text-2xl font-bold text-blue-700">{stats.active_admissions}</div>
            <div className="text-blue-600 text-sm">Active Admissions</div>
          </div>
          <div className="bg-green-50 p-4 rounded-lg border-2 border-green-200">
            <div className="text-2xl font-bold text-green-700">{stats.available_beds}</div>
            <div className="text-green-600 text-sm">Available Beds</div>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg border-2 border-purple-200">
            <div className="text-2xl font-bold text-purple-700">
              {stats.occupancy_rate.toFixed(1)}%
            </div>
            <div className="text-purple-600 text-sm">Occupancy Rate</div>
          </div>
          <div className="bg-orange-50 p-4 rounded-lg border-2 border-orange-200">
            <div className="text-2xl font-bold text-orange-700">₹{stats.today_revenue.toLocaleString()}</div>
            <div className="text-orange-600 text-sm">Today's Revenue</div>
          </div>
          <div className="bg-red-50 p-4 rounded-lg border-2 border-red-200">
            <div className="text-2xl font-bold text-red-700">₹{stats.net_revenue.toLocaleString()}</div>
            <div className="text-red-600 text-sm">Net Revenue</div>
          </div>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="mb-6 flex justify-between items-center">
        <div className="flex space-x-4">
          <button
            onClick={() => setActiveTab('active')}
            className={`px-6 py-2 rounded-md font-medium ${
              activeTab === 'active'
                ? 'bg-green-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            🛏️ Active Patients
          </button>
          <button
            onClick={() => setActiveTab('discharged')}
            className={`px-6 py-2 rounded-md font-medium ${
              activeTab === 'discharged'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            📋 Discharged
            {/* COUNTS REMOVED - NO NUMBERS SHOULD SHOW */}
          </button>
        </div>

        <div className="flex space-x-3">
          <button
            onClick={handleExportToExcel}
            disabled={loading || admissions.length === 0}
            className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 disabled:opacity-50"
          >
            📊 Export Excel
          </button>
          <button
            onClick={async () => {
              setLoading(true);
              await fixStatusInconsistencies();
              await loadData();
              await loadCounts();
              setLoading(false);
            }}
            disabled={loading}
            className="bg-orange-600 text-white px-4 py-2 rounded-md hover:bg-orange-700 disabled:opacity-50"
          >
            🔧 Fix Status
          </button>
          <button
            onClick={cleanupOrphanedRecords}
            disabled={loading}
            className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 disabled:opacity-50"
            title="Clean up orphaned admission records that point to deleted patients"
          >
            🧹 Clean DB
          </button>
          <button
            onClick={async () => {
              setLoading(true);
              await loadData();
              await loadCounts();
              setLoading(false);
            }}
            disabled={loading}
            className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 disabled:opacity-50"
          >
            {loading ? '⟳' : '🔄'} Refresh
          </button>
        </div>
      </div>

      {/* Debug info */}
      {process.env.NODE_ENV === 'development' && (
        <div className="bg-gray-100 p-2 text-xs mb-2">
          Debug: activeTab={activeTab}, admissions={admissions.length}, loading={loading.toString()}, 
          activeCount={activePatientsCount}, dischargedCount={dischargedPatientsCount}
        </div>
      )}

      {/* Content based on active tab */}
      {/* Admissions View (Active/Discharged) */}
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden min-h-[400px]">
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
              <p className="text-gray-600">Loading {activeTab} admissions...</p>
            </div>
          ) : admissions.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="text-left p-4 font-semibold text-gray-700">Patient</th>
                    <th className="text-left p-4 font-semibold text-gray-700">Bed</th>
                    <th className="text-left p-4 font-semibold text-gray-700">Room Type</th>
                    <th className="text-left p-4 font-semibold text-gray-700">Doctor</th>
                    <th className="text-left p-4 font-semibold text-gray-700">Services</th>
                    <th className="text-left p-4 font-semibold text-gray-700">Days</th>
                    <th className="text-left p-4 font-semibold text-gray-700">Amount & Billing</th>
                    <th className="text-left p-4 font-semibold text-gray-700">Admission Date</th>
                    <th className="text-left p-4 font-semibold text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {admissions.map((admission, index) => (
                    <tr key={admission.id} className={`border-b hover:bg-gray-50 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-25'}`}>
                      <td className="p-4">
                        <div>
                          <div className="font-medium">
                            {admission.patient?.first_name} {admission.patient?.last_name}
                          </div>
                          <div className="text-sm text-gray-500">
                            ID: {admission.patient?.patient_id} | Age: {admission.patient?.age} | {admission.patient?.blood_group || 'N/A'}
                          </div>
                        </div>
                      </td>
                      <td className="p-4 font-medium">{admission.bed?.bed_number || admission.bed_number || 'N/A'}</td>
                      <td className="p-4">{admission.bed?.room_type || admission.room_type || 'N/A'}</td>
                      <td className="p-4">
                        <div>
                          <div className="font-medium">
                            {admission.doctor?.name || admission.doctor_name || admission.assigned_doctor || 'Not Assigned'}
                          </div>
                          <div className="text-sm text-gray-500">
                            {admission.doctor?.specialization || admission.doctor?.department || admission.department || 'N/A'}
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <button
                          onClick={() => handleManageServices(admission)}
                          className="bg-purple-600 text-white px-2 py-1 rounded text-xs hover:bg-purple-700"
                          title="Manage IPD Services"
                        >
                          🔬 Manage
                        </button>
                      </td>
                      <td className="p-4">
                        <span className="font-medium">
                          {calculateStayDuration(admission.admission_date, admission.actual_discharge_date)} days
                        </span>
                      </td>
                      <td className="p-4">
                        <BillingCell admission={admission} onManageBilling={() => handleManageBilling(admission)} />
                      </td>
                      <td className="p-4">
                        <div className="text-sm">
                          <div>Admitted: {new Date(admission.admission_date).toLocaleDateString()}</div>
                          {admission.actual_discharge_date && (
                            <div className="text-blue-600">
                              Discharged: {new Date(admission.actual_discharge_date).toLocaleDateString()}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleShowDocuments(admission)}
                            className="bg-indigo-600 text-white px-3 py-1 rounded text-sm hover:bg-indigo-700"
                            title="IPD Documents (Slip, Card, Stickers)"
                          >
                            📋 Documents
                          </button>
                          
                          {activeTab === 'active' && (
                            <button
                              onClick={() => dischargePatient(admission)}
                              className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700"
                            >
                              📤 Discharge
                            </button>
                          )}
                          
                          {activeTab === 'discharged' && (
                            <button
                              onClick={() => handleViewDischargeCard(admission)}
                              className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700"
                              title="View Discharge Summary Card"
                            >
                              🪪 Discharge Card
                            </button>
                          )}
                          
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🏥</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No {activeTab} admissions found
              </h3>
              <p className="text-gray-500 mb-4">
                {activeTab === 'active' 
                  ? 'No patients are currently admitted to the IPD'
                  : 'No patients have been discharged yet'
                }
              </p>
              {activeTab === 'active' && (
                <p className="text-gray-400 text-sm">
                  Use "Admit to IPD" button from Patient List to admit patients
                </p>
              )}
            </div>
          )}
        </div>

        {/* Comprehensive Discharge Modal */}
        <DischargePatientModal
          admission={selectedAdmissionForDischarge}
          isOpen={showDischargeModal}
          onClose={() => {
            setShowDischargeModal(false);
            setSelectedAdmissionForDischarge(null);
          }}
          onDischargeSuccess={handleDischargeSuccess}
        />

        {/* IPD Service Manager Modal */}
        {selectedAdmissionForServices && (
          <IPDServiceManager
            patientAdmission={selectedAdmissionForServices}
            isOpen={showServiceManager}
            onClose={() => {
              setShowServiceManager(false);
              setSelectedAdmissionForServices(null);
            }}
            onServicesUpdated={handleServicesUpdated}
          />
        )}

        {/* IPD Partial Billing Modal */}
        {selectedAdmissionForBilling && (
          <IPDPartialBilling
            patientAdmission={selectedAdmissionForBilling}
            isOpen={showPartialBilling}
            onClose={() => {
              setShowPartialBilling(false);
              setSelectedAdmissionForBilling(null);
            }}
            onBillCreated={handleBillCreated}
          />
        )}

        {/* IPD Documents Modal */}
        {selectedAdmissionForDocuments && (
          <IPDNavigation
            admission={selectedAdmissionForDocuments}
            onClose={() => {
              setShowIPDDocuments(false);
              setSelectedAdmissionForDocuments(null);
            }}
          />
        )}

        {/* Discharge Card Modal */}
        {selectedAdmissionForDischargeCard && (
          <IPDCard
            admission={selectedAdmissionForDischargeCard}
            onBack={() => {
              setShowDischargeCard(false);
              setSelectedAdmissionForDischargeCard(null);
            }}
          />
        )}

    </div>
  );
};

export default EnhancedIPDManagement;
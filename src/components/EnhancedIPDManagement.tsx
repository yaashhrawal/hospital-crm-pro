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
import EnhancedDischargeModal from './EnhancedDischargeModal';
import IPDServiceManager from './IPDServiceManager';
import IPDPartialBilling from './IPDPartialBilling';
import IPDNavigation from './IPDNavigation';
import useReceiptPrinting from '../hooks/useReceiptPrinting';

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

const EnhancedIPDManagement: React.FC = () => {
  const [admissions, setAdmissions] = useState<PatientAdmissionWithRelations[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'active' | 'discharged'>('active');
  
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
  
  // Receipt printing
  const { printAdmissionReceipt, printDischargeReceipt } = useReceiptPrinting();

  useEffect(() => {
    console.log('🚀 IPD Management useEffect triggered, activeTab:', activeTab);
    // One-time migration to fix lowercase status values
    migrateStatusValues();
    loadData();
    loadStats();
  }, [activeTab]);

  // Temporary migration function to fix any lowercase status values
  const migrateStatusValues = async () => {
    try {
      // Update any 'discharged' to 'DISCHARGED'
      const { error: dischargedError } = await supabase
        .from('patient_admissions')
        .update({ status: 'DISCHARGED' })
        .eq('status', 'discharged');
      
      if (dischargedError) {
        console.error('Error migrating discharged status:', dischargedError);
      }

      // Update any 'active' to 'ACTIVE'
      const { error: activeError } = await supabase
        .from('patient_admissions')
        .update({ status: 'ACTIVE' })
        .eq('status', 'active');
      
      if (activeError) {
        console.error('Error migrating active status:', activeError);
      }
    } catch (error) {
      console.error('Error in status migration:', error);
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
    }
  };

  const loadAdmissions = async () => {
    try {
      console.log('🔍 Loading IPD admissions for tab:', activeTab);
      const statusFilter = activeTab === 'active' ? 'ACTIVE' : 'DISCHARGED';
      console.log('🎯 Filtering for status:', statusFilter);

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
            patient:patients(id, patient_id, first_name, last_name, phone, age, blood_group),
            bed:beds(id, bed_number, room_type, daily_rate)
          `)
          .eq('status', statusFilter)
          .order('admission_date', { ascending: false });

        if (!relationshipError && relationshipData) {
          console.log('✅ Successfully loaded with relationships');
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

        // Load patients and beds separately
        const patientIds = [...new Set(admissionsOnly?.map(a => a.patient_id) || [])];
        const bedIds = [...new Set(admissionsOnly?.map(a => a.bed_id).filter(Boolean) || [])];

        const [patientsResult, bedsResult] = await Promise.all([
          supabase.from('patients').select('id, patient_id, first_name, last_name, phone, age, blood_group').in('id', patientIds),
          supabase.from('beds').select('id, bed_number, room_type, daily_rate').in('id', bedIds)
        ]);

        // Manual join
        admissionsData = (admissionsOnly || []).map(admission => ({
          ...admission,
          patient: patientsResult.data?.find(p => p.id === admission.patient_id),
          bed: bedsResult.data?.find(b => b.id === admission.bed_id)
        }));

        console.log('✅ Successfully loaded with manual join');
      }
      
      console.log('📋 Final admissions result:', admissionsData);
      console.log('📋 Found', admissionsData?.length || 0, 'admissions with status:', statusFilter);
      setAdmissions(admissionsData || []);
    } catch (error: any) {
      console.error('❌ Error loading admissions:', error);
      toast.error(`Failed to load admissions: ${error.message}`);
    }
  };


  const loadPatients = async () => {
    try {
      const { data, error } = await supabase
        .from('patients')
        .select('id, patient_id, first_name, last_name, phone, age, blood_group')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setPatients(data || []);
    } catch (error: any) {
      console.error('Error loading patients:', error);
    }
  };

  const loadStats = async () => {
    try {
      const { data, error } = await supabase.rpc('get_dashboard_stats');
      if (error) throw error;
      setStats(data);
    } catch (error: any) {
      console.error('Error loading stats:', error);
    }
  };



  // Open comprehensive discharge modal instead of simple discharge
  const dischargePatient = (admission: PatientAdmissionWithRelations) => {
    setSelectedAdmissionForDischarge(admission);
    setShowDischargeModal(true);
  };

  const handleDischargeSuccess = () => {
    setShowDischargeModal(false);
    setSelectedAdmissionForDischarge(null);
    loadData();
    loadStats();
  };

  const handleManageServices = (admission: PatientAdmissionWithRelations) => {
    setSelectedAdmissionForServices(admission);
    setShowServiceManager(true);
  };

  const handleServicesUpdated = () => {
    loadData();
    loadStats();
  };

  const handleManageBilling = (admission: PatientAdmissionWithRelations) => {
    setSelectedAdmissionForBilling(admission);
    setShowPartialBilling(true);
  };

  const handleBillCreated = () => {
    loadData();
    loadStats();
  };

  const handleShowDocuments = (admission: PatientAdmissionWithRelations) => {
    setSelectedAdmissionForDocuments(admission);
    setShowIPDDocuments(true);
  };

  const calculateStayDuration = (admissionDate: string, dischargeDate?: string) => {
    const start = new Date(admissionDate);
    const end = dischargeDate ? new Date(dischargeDate) : new Date();
    const diffTime = Math.abs(end.getTime() - start.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const calculateTotalAmount = (admission: PatientAdmissionWithRelations) => {
    // Use service-based total instead of daily rate calculation
    return admission.total_amount || 0;
  };

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
            🛏️ Active Patients ({admissions.length})
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
          </button>
        </div>

        <div className="flex space-x-3">
          <button
            onClick={loadData}
            disabled={loading}
            className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 disabled:opacity-50"
          >
            {loading ? '⟳' : '🔄'} Refresh
          </button>
        </div>
      </div>

      {/* Content based on active tab */}
      {/* Admissions View (Active/Discharged) */}
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
              <p className="text-gray-600">Loading admissions...</p>
            </div>
          ) : admissions.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="text-left p-4 font-semibold text-gray-700">Patient</th>
                    <th className="text-left p-4 font-semibold text-gray-700">Bed</th>
                    <th className="text-left p-4 font-semibold text-gray-700">Room Type</th>
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
                          <div className="font-medium">{admission.patient?.first_name} {admission.patient?.last_name}</div>
                          <div className="text-sm text-gray-500">
                            ID: {admission.patient?.patient_id} | Age: {admission.patient?.age} | {admission.patient?.blood_group || 'N/A'}
                          </div>
                        </div>
                      </td>
                      <td className="p-4 font-medium">{admission.bed?.bed_number || 'N/A'}</td>
                      <td className="p-4">{admission.bed?.room_type || 'N/A'}</td>
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
                        <div>
                          <div className="font-semibold text-green-600">
                            ₹{calculateTotalAmount(admission).toLocaleString()}
                          </div>
                          <button
                            onClick={() => handleManageBilling(admission)}
                            className="bg-green-600 text-white px-2 py-1 rounded text-xs hover:bg-green-700 mt-1"
                            title="Manage Billing & Payments"
                          >
                            💰 Billing
                          </button>
                        </div>
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
                          
                          <button
                            onClick={() => printAdmissionReceipt(admission.id)}
                            className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700"
                            title="Print Admission Receipt"
                          >
                            🖨️ Receipt
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
                              onClick={() => printDischargeReceipt(admission.id)}
                              className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700"
                              title="Print Discharge Summary"
                            >
                              📄 Summary
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
        <EnhancedDischargeModal
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
    </div>
  );
};

export default EnhancedIPDManagement;
import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { supabase } from '../config/supabaseNew';
import type { 
  PatientAdmissionWithRelations, 
  BedWithRelations, 
  Patient,
  DashboardStats,
  User
} from '../config/supabaseNew';
import HospitalService from '../services/hospitalService';

// Normalize room type to match database constraint
const normalizeRoomType = (roomType: string): string => {
  if (!roomType) return 'GENERAL';
  
  const normalized = roomType.toUpperCase().trim();
  
  // Map common variations to standard types
  const roomTypeMap: { [key: string]: string } = {
    'GENERAL': 'GENERAL',
    'PRIVATE': 'PRIVATE', 
    'ICU': 'ICU',
    'EMERGENCY': 'EMERGENCY',
    'SEMI_PRIVATE': 'PRIVATE',
    'DELUXE': 'PRIVATE',
    'STANDARD': 'GENERAL',
    'VIP': 'PRIVATE'
  };
  
  return roomTypeMap[normalized] || 'GENERAL';
};

const EnhancedIPDManagement: React.FC = () => {
  const [admissions, setAdmissions] = useState<PatientAdmissionWithRelations[]>([]);
  const [beds, setBeds] = useState<BedWithRelations[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'active' | 'discharged' | 'beds'>('active');
  const [showAdmitModal, setShowAdmitModal] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [selectedBed, setSelectedBed] = useState<BedWithRelations | null>(null);
  const [admissionNotes, setAdmissionNotes] = useState('');
  const [expectedDischarge, setExpectedDischarge] = useState('');

  useEffect(() => {
    loadData();
    loadStats();
  }, [activeTab]);

  const loadData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'beds') {
        await loadBeds();
      } else {
        await loadAdmissions();
      }
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
      // Fixed: Remove bed relationship since patient_admissions stores bed_number directly
      const { data, error } = await supabase
        .from('patient_admissions')
        .select(`
          *,
          patient:patients(id, patient_id, first_name, last_name, phone, age, blood_group)
        `)
        .eq('status', activeTab === 'active' ? 'ACTIVE' : 'DISCHARGED')
        .order('admission_date', { ascending: false });

      if (error) throw error;
      
      // Manually add bed info by matching bed_number
      if (data) {
        for (const admission of data) {
          if (admission.bed_number) {
            const { data: bedData } = await supabase
              .from('beds')
              .select('id, bed_number, room_type, daily_rate')
              .eq('bed_number', admission.bed_number)
              .single();
            
            if (bedData) {
              admission.bed = bedData;
            }
          }
        }
      }
      
      setAdmissions(data || []);
    } catch (error: any) {
      console.error('Error loading admissions:', error);
      toast.error(`Failed to load admissions: ${error.message}`);
    }
  };

  const loadBeds = async () => {
    try {
      // Fixed: Load beds without problematic relationships
      const { data: bedsData, error } = await supabase
        .from('beds')
        .select('*')
        .order('bed_number');

      if (error) throw error;
      
      // Manually add current admission info by matching bed_number
      if (bedsData) {
        for (const bed of bedsData) {
          const { data: admission } = await supabase
            .from('patient_admissions')
            .select(`
              id, admission_date, status,
              patient:patients(first_name, last_name, patient_id)
            `)
            .eq('bed_number', bed.bed_number)
            .eq('status', 'ACTIVE')
            .single();
          
          if (admission) {
            bed.current_admission = [admission];
          }
        }
      }

      setBeds(bedsData || []);
    } catch (error: any) {
      console.error('Error loading beds:', error);
      toast.error(`Failed to load beds: ${error.message}`);
    }
  };

  const loadPatients = async () => {
    try {
      const { data, error } = await supabase
        .from('patients')
        .select('id, patient_id, first_name, last_name, phone, age, blood_group')
        .eq('is_active', true)
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

  const getAvailableBeds = () => {
    return beds.filter(bed => bed.status === 'AVAILABLE' || !bed.current_admission);
  };

  const admitPatient = async () => {
    if (!selectedPatient || !selectedBed) {
      toast.error('Please select both a patient and a bed');
      return;
    }

    try {
      const currentUser = await HospitalService.getCurrentUser();
      if (!currentUser) {
        toast.error('Authentication required');
        return;
      }

      // Check if bed is still available (simplified check)
      const { data: existingAdmission } = await supabase
        .from('patient_admissions')
        .select('id')
        .eq('bed_number', selectedBed.bed_number)
        .eq('status', 'ACTIVE')
        .single();

      if (existingAdmission) {
        toast.error('Selected bed is no longer available');
        return;
      }

      // Create admission - Fixed to use valid constraint room_type
      const validRoomType = normalizeRoomType(selectedBed.room_type);
      const admissionData = {
        patient_id: selectedPatient.id,
        bed_number: selectedBed.bed_number,
        room_type: validRoomType, // Use normalized room type
        department: selectedBed.department || 'GENERAL',
        daily_rate: selectedBed.daily_rate,
        admission_date: new Date().toISOString(),
        expected_discharge_date: expectedDischarge ? new Date(expectedDischarge).toISOString().split('T')[0] : null,
        admission_notes: admissionNotes || null,
        services: {},
        total_amount: 0,
        amount_paid: 0,
        balance_amount: 0, // Fixed field name
        status: 'ACTIVE',
        hospital_id: '550e8400-e29b-41d4-a716-446655440000'
      };

      console.log('💉 Admission data with normalized room_type:', admissionData);

      const { data: admission, error: admissionError } = await supabase
        .from('patient_admissions')
        .insert([admissionData])
        .select()
        .single();

      if (admissionError) throw admissionError;

      // Update bed status
      const { error: bedError } = await supabase
        .from('beds')
        .update({ status: 'OCCUPIED' })
        .eq('bed_number', selectedBed.bed_number);

      if (bedError) throw bedError;

      // Create admission fee transaction - use valid transaction type
      const { error: transactionError } = await supabase
        .from('patient_transactions')
        .insert([{
          patient_id: selectedPatient.id,
          admission_id: admission.id,
          transaction_type: 'ENTRY_FEE', // Use valid constraint value
          amount: selectedBed.daily_rate,
          payment_mode: 'CASH',
          description: `Admission to bed ${selectedBed.bed_number} - ${selectedBed.room_type}`,
          status: 'PENDING',
          hospital_id: '550e8400-e29b-41d4-a716-446655440000'
        }]);

      if (transactionError) throw transactionError;

      toast.success(`${selectedPatient.first_name} ${selectedPatient.last_name} admitted to bed ${selectedBed.bed_number}`);
      setShowAdmitModal(false);
      setSelectedPatient(null);
      setSelectedBed(null);
      setAdmissionNotes('');
      setExpectedDischarge('');
      loadData();
      loadStats();

    } catch (error: any) {
      console.error('Error admitting patient:', error);
      toast.error(`Failed to admit patient: ${error.message}`);
    }
  };

  const dischargePatient = async (admission: PatientAdmissionWithRelations) => {
    if (!confirm(`Are you sure you want to discharge ${admission.patient?.first_name} ${admission.patient?.last_name}?`)) {
      return;
    }

    try {
      const currentUser = await HospitalService.getCurrentUser();
      if (!currentUser) {
        toast.error('Authentication required');
        return;
      }

      // Update admission status
      const { error: admissionError } = await supabase
        .from('patient_admissions')
        .update({
          status: 'DISCHARGED',
          actual_discharge_date: new Date().toISOString().split('T')[0],
          discharged_by: currentUser.id
        })
        .eq('id', admission.id);

      if (admissionError) throw admissionError;

      // Update bed status
      const { error: bedError } = await supabase
        .from('beds')
        .update({ status: 'AVAILABLE' })
        .eq('bed_number', admission.bed_number);

      if (bedError) throw bedError;

      toast.success('Patient discharged successfully');
      loadData();
      loadStats();

    } catch (error: any) {
      console.error('Error discharging patient:', error);
      toast.error(`Failed to discharge patient: ${error.message}`);
    }
  };

  const calculateStayDuration = (admissionDate: string, dischargeDate?: string) => {
    const start = new Date(admissionDate);
    const end = dischargeDate ? new Date(dischargeDate) : new Date();
    const diffTime = Math.abs(end.getTime() - start.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const calculateTotalAmount = (admission: PatientAdmissionWithRelations) => {
    const days = calculateStayDuration(admission.admission_date, admission.actual_discharge_date);
    const dailyRate = admission.bed?.daily_rate || 0;
    return days * dailyRate;
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
          <button
            onClick={() => setActiveTab('beds')}
            className={`px-6 py-2 rounded-md font-medium ${
              activeTab === 'beds'
                ? 'bg-purple-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            🏨 Bed Management ({beds.length})
          </button>
        </div>

        <div className="flex space-x-3">
          <button
            onClick={() => setShowAdmitModal(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex items-center space-x-2"
          >
            <span>➕</span>
            <span>Admit Patient</span>
          </button>
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
      {activeTab === 'beds' ? (
        // Bed Management View
        <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
          <div className="p-4 bg-gray-50 border-b">
            <h2 className="text-lg font-semibold">Bed Status Overview</h2>
          </div>
          
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
              <p className="text-gray-600">Loading beds...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-6">
              {beds.map((bed) => (
                <div
                  key={bed.id}
                  className={`p-4 rounded-lg border-2 ${
                    bed.status === 'AVAILABLE' 
                      ? 'border-green-200 bg-green-50' 
                      : bed.status === 'OCCUPIED'
                      ? 'border-red-200 bg-red-50'
                      : 'border-yellow-200 bg-yellow-50'
                  }`}
                >
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-bold text-lg">{bed.bed_number}</h3>
                      <p className="text-sm text-gray-600">{bed.room_type} Room</p>
                    </div>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      bed.status === 'AVAILABLE' 
                        ? 'bg-green-100 text-green-800'
                        : bed.status === 'OCCUPIED'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {bed.status}
                    </span>
                  </div>
                  
                  <div className="text-sm space-y-1">
                    <p><strong>Daily Rate:</strong> ₹{bed.daily_rate.toLocaleString()}</p>
                    {bed.department && (
                      <p><strong>Department:</strong> {bed.department.name}</p>
                    )}
                    
                    {bed.current_admission && bed.current_admission.length > 0 && (
                      <div className="mt-3 pt-3 border-t">
                        <p className="font-medium text-gray-800">Current Patient:</p>
                        {bed.current_admission.map((admission: any) => (
                          <div key={admission.id}>
                            <p className="text-sm">
                              {admission.patient?.first_name} {admission.patient?.last_name}
                            </p>
                            <p className="text-xs text-gray-500">
                              Admitted: {new Date(admission.admission_date).toLocaleDateString()}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        // Admissions View (Active/Discharged)
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
                    <th className="text-left p-4 font-semibold text-gray-700">Daily Rate</th>
                    <th className="text-left p-4 font-semibold text-gray-700">Days</th>
                    <th className="text-left p-4 font-semibold text-gray-700">Total Amount</th>
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
                      <td className="p-4 font-medium">{admission.bed?.bed_number}</td>
                      <td className="p-4">{admission.bed?.room_type}</td>
                      <td className="p-4">₹{admission.bed?.daily_rate.toLocaleString()}</td>
                      <td className="p-4">
                        <span className="font-medium">
                          {calculateStayDuration(admission.admission_date, admission.actual_discharge_date)} days
                        </span>
                      </td>
                      <td className="p-4">
                        <span className="font-semibold text-green-600">
                          ₹{calculateTotalAmount(admission).toLocaleString()}
                        </span>
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
                          {activeTab === 'active' && (
                            <button
                              onClick={() => dischargePatient(admission)}
                              className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700"
                            >
                              📤 Discharge
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
                <button
                  onClick={() => setShowAdmitModal(true)}
                  className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700"
                >
                  Admit First Patient
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* Admission Modal */}
      {showAdmitModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-screen overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-800">🛏️ Admit Patient to IPD</h2>
              <button
                onClick={() => setShowAdmitModal(false)}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ✕
              </button>
            </div>

            <div className="space-y-6">
              {/* Patient Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Patient *
                </label>
                <select
                  value={selectedPatient?.id || ''}
                  onChange={(e) => {
                    const patient = patients.find(p => p.id === e.target.value);
                    setSelectedPatient(patient || null);
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">-- Select a patient --</option>
                  {patients.map((patient) => (
                    <option key={patient.id} value={patient.id}>
                      {patient.first_name} {patient.last_name} ({patient.patient_id}) - Age: {patient.age}
                    </option>
                  ))}
                </select>
              </div>

              {/* Bed Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Available Bed *
                </label>
                <select
                  value={selectedBed?.id || ''}
                  onChange={(e) => {
                    const bed = getAvailableBeds().find(b => b.id === e.target.value);
                    setSelectedBed(bed || null);
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">-- Select an available bed --</option>
                  {getAvailableBeds().map((bed) => (
                    <option key={bed.id} value={bed.id}>
                      {bed.bed_number} - {bed.room_type} (₹{bed.daily_rate}/day)
                    </option>
                  ))}
                </select>
              </div>

              {/* Expected Discharge Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Expected Discharge Date
                </label>
                <input
                  type="date"
                  value={expectedDischarge}
                  onChange={(e) => setExpectedDischarge(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Admission Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Admission Notes
                </label>
                <textarea
                  value={admissionNotes}
                  onChange={(e) => setAdmissionNotes(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  placeholder="Enter admission notes, medical conditions, special instructions..."
                />
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end space-x-3 pt-6 border-t">
                <button
                  onClick={() => setShowAdmitModal(false)}
                  className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={admitPatient}
                  disabled={!selectedPatient || !selectedBed}
                  className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  🛏️ Admit Patient
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EnhancedIPDManagement;
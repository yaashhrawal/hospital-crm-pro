import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { supabase } from '../config/supabaseNew';
import HospitalService from '../services/hospitalService';
import type { PatientWithRelations } from '../config/supabaseNew';
import { exportToExcel, formatDate } from '../utils/excelExport';

interface DischargedPatient extends PatientWithRelations {
  discharge_date?: string;
  discharge_summary?: any;
  admission_duration?: string;
  final_diagnosis?: string;
  total_bill_amount?: number;
}

const DischargeSection: React.FC = () => {
  const [dischargedPatients, setDischargedPatients] = useState<DischargedPatient[]>([]);
  const [filteredPatients, setFilteredPatients] = useState<DischargedPatient[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'discharge_date' | 'duration' | 'bill_amount'>('discharge_date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'week' | 'month'>('all');

  useEffect(() => {
    loadDischargedPatients();
  }, []);

  useEffect(() => {
    filterAndSortPatients();
  }, [dischargedPatients, searchTerm, sortBy, sortOrder, dateFilter]);

  const loadDischargedPatients = async () => {
    try {
      setLoading(true);
      
      // Try multiple approaches to find discharged patients
      let allDischargedPatients: DischargedPatient[] = [];
      
      // Approach 1: Get discharged admissions from patient_admissions table
      try {
        const dischargedAdmissions = await HospitalService.getDischargedAdmissions();
        
        const admissionBasedPatients = await Promise.all(
          dischargedAdmissions.map(async (admission) => {
            try {
              // Get discharge summary for this admission
              const dischargeSummary = await HospitalService.getDischargeSummary(admission.id);
              
              // Calculate admission duration
              let admissionDuration = '';
              if (admission.admission_date) {
                const admissionDate = new Date(admission.admission_date);
                const dischargeDate = new Date(admission.updated_at || new Date());
                const diffTime = Math.abs(dischargeDate.getTime() - admissionDate.getTime());
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                admissionDuration = `${diffDays} day${diffDays !== 1 ? 's' : ''}`;
              }

              // Use patient data from admission or create minimal patient data
              const patientData = admission.patient || {
                id: admission.patient_id,
                patient_id: `Unknown-${admission.id}`,
                first_name: 'Unknown',
                last_name: 'Patient',
                phone: '',
                email: '',
                gender: 'UNKNOWN',
                blood_group: ''
              };

              return {
                ...patientData,
                ipd_number: admission.ipd_number || patientData?.ipd_number || 'N/A', // ✅ FIX: Get IPD number from admission or patient
                discharge_date: admission.updated_at,
                discharge_summary: dischargeSummary,
                admission_duration: admissionDuration,
                final_diagnosis: dischargeSummary?.final_diagnosis || 'Not specified',
                total_bill_amount: dischargeSummary?.bill?.total_amount || patientData?.totalSpent || 0,
                ipd_status: 'DISCHARGED'
              } as DischargedPatient;
            } catch (error) {
              // Fallback if discharge info can't be loaded
              const patientData = admission.patient || {
                id: admission.patient_id,
                patient_id: `Unknown-${admission.id}`,
                first_name: 'Unknown',
                last_name: 'Patient',
                phone: '',
                email: '',
                gender: 'UNKNOWN',
                blood_group: ''
              };

              return {
                ...patientData,
                ipd_number: admission.ipd_number || patientData?.ipd_number || 'N/A', // ✅ FIX: Get IPD number from admission or patient
                discharge_date: admission.updated_at || admission.created_at,
                admission_duration: 'Unknown',
                final_diagnosis: 'Not specified',
                total_bill_amount: patientData?.totalSpent || 0,
                ipd_status: 'DISCHARGED'
              } as DischargedPatient;
            }
          })
        );
        
        allDischargedPatients = [...admissionBasedPatients];
      } catch (error) {
      }
      
      // Approach 2: Also check patients table for ipd_status = 'DISCHARGED'
      try {
        const allPatients = await HospitalService.getPatients(50000, true, true);
        const patientsWithDischargedStatus = allPatients.filter(patient => 
          patient.ipd_status === 'DISCHARGED'
        );
        
        // Add any patients not already found through admissions
        for (const patient of patientsWithDischargedStatus) {
          // Enhanced deduplication: check by both patient.id and patient.patient_id
          const alreadyExists = allDischargedPatients.some(dp => 
            dp.id === patient.id || 
            dp.patient_id === patient.patient_id ||
            (dp.patient_id === patient.id) ||
            (dp.id === patient.patient_id)
          );
          if (!alreadyExists) {
            // Try to get discharge history for additional info
            try {
              const dischargeHistory = await HospitalService.getDischargeHistory(patient.id);
              const latestDischarge = dischargeHistory[0];
              
              allDischargedPatients.push({
                ...patient,
                ipd_number: latestDischarge?.ipd_number || patient.ipd_number || 'N/A', // ✅ FIX: Get IPD number from discharge or patient
                discharge_date: latestDischarge?.created_at || patient.updated_at || patient.created_at,
                discharge_summary: latestDischarge,
                admission_duration: 'Unknown',
                final_diagnosis: latestDischarge?.final_diagnosis || 'Not specified',
                total_bill_amount: latestDischarge?.bill?.total_amount || patient.totalSpent || 0,
                ipd_status: 'DISCHARGED'
              } as DischargedPatient);
            } catch (error) {
              // Add patient without discharge details
              allDischargedPatients.push({
                ...patient,
                ipd_number: patient.ipd_number || 'N/A', // ✅ FIX: Get IPD number from patient
                discharge_date: patient.updated_at || patient.created_at,
                admission_duration: 'Unknown',
                final_diagnosis: 'Not specified',
                total_bill_amount: patient.totalSpent || 0,
                ipd_status: 'DISCHARGED'
              } as DischargedPatient);
            }
          }
        }
        
      } catch (error) {
      }

      // FINAL DEDUPLICATION: Remove any remaining duplicates
      console.log('🔍 Before final deduplication:', allDischargedPatients.length);
      
      const uniquePatients = new Map<string, DischargedPatient>();
      
      allDischargedPatients.forEach(patient => {
        // Create multiple possible keys for the same patient
        const keys = [
          patient.id?.toString(),
          patient.patient_id?.toString(),
          `${patient.first_name}-${patient.last_name}-${patient.phone}`.toLowerCase()
        ].filter(Boolean);
        
        // Use the first available key as the primary key
        const primaryKey = keys[0];
        
        if (primaryKey && !uniquePatients.has(primaryKey)) {
          // Check if any of the keys already exist
          const keyExists = keys.some(key => uniquePatients.has(key));
          
          if (!keyExists) {
            uniquePatients.set(primaryKey, patient);
            
            // Also set all other keys to prevent future duplicates
            keys.forEach(key => {
              if (key !== primaryKey) {
                uniquePatients.set(key, patient);
              }
            });
          }
        }
      });
      
      // Convert back to array, removing the duplicate key entries
      const finalUniquePatients = Array.from(new Set(Array.from(uniquePatients.values())));
      
      console.log('✅ After final deduplication:', finalUniquePatients.length);
      console.log('🔄 Removed duplicates:', allDischargedPatients.length - finalUniquePatients.length);

      setDischargedPatients(finalUniquePatients);
      toast.success(`Loaded ${finalUniquePatients.length} discharged patients (${allDischargedPatients.length - finalUniquePatients.length} duplicates removed)`);
      
    } catch (error: any) {
      toast.error(`Failed to load discharged patients: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const filterAndSortPatients = () => {
    let filtered = [...dischargedPatients];

    // Apply search filter
    if (searchTerm.trim()) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(patient => 
        patient.first_name.toLowerCase().includes(search) ||
        patient.last_name.toLowerCase().includes(search) ||
        patient.phone.includes(search) ||
        patient.patient_id.toLowerCase().includes(search) ||
        (patient.final_diagnosis && patient.final_diagnosis.toLowerCase().includes(search))
      );
    }

    // Apply date filter
    if (dateFilter !== 'all') {
      const now = new Date();
      let startDate: Date;

      switch (dateFilter) {
        case 'today':
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          break;
        case 'week':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case 'month':
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          break;
      }

      filtered = filtered.filter(patient => {
        if (!patient.discharge_date) return false;
        const dischargeDate = new Date(patient.discharge_date);
        return dischargeDate >= startDate;
      });
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'name':
          comparison = (a.first_name + ' ' + a.last_name).localeCompare(b.first_name + ' ' + b.last_name);
          break;
        case 'discharge_date':
          const dateA = a.discharge_date ? new Date(a.discharge_date).getTime() : 0;
          const dateB = b.discharge_date ? new Date(b.discharge_date).getTime() : 0;
          comparison = dateA - dateB;
          break;
        case 'duration':
          const durationA = parseInt(a.admission_duration?.split(' ')[0] || '0');
          const durationB = parseInt(b.admission_duration?.split(' ')[0] || '0');
          comparison = durationA - durationB;
          break;
        case 'bill_amount':
          comparison = (a.total_bill_amount || 0) - (b.total_bill_amount || 0);
          break;
      }
      
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    setFilteredPatients(filtered);
  };

  const handleSort = (newSortBy: typeof sortBy) => {
    if (sortBy === newSortBy) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(newSortBy);
      setSortOrder('desc');
    }
  };

  const getSortIcon = (column: typeof sortBy) => {
    if (sortBy !== column) return '↕️';
    return sortOrder === 'asc' ? '↑' : '↓';
  };

  const deleteDischargeRecord = async (patientId: string) => {
    const patient = dischargedPatients.find(p => p.id === patientId);
    if (!patient) {
      toast.error('Patient not found');
      return;
    }

    if (!confirm(`Are you sure you want to remove the discharge record for ${patient.first_name} ${patient.last_name}? This will remove them from the discharged patients list but keep their patient data in the system.`)) {
      return;
    }

    try {
      // Delete discharge summary record instead of the entire patient
      if (patient.discharge_summary?.id) {
        const { error: summaryError } = await supabase
          .from('discharge_summaries')
          .delete()
          .eq('id', patient.discharge_summary.id);
          
        if (summaryError) {
          console.error('Error deleting discharge summary:', summaryError);
          toast.error('Failed to delete discharge summary');
          return;
        }
      }

      // Update patient IPD status back to ADMITTED if they should be re-admitted
      // or set to null if they're completely done
      await HospitalService.updatePatient(patientId, {
        ipd_status: null // or 'ADMITTED' if they should be re-admitted
      });

      // Update admission status back to ADMITTED if needed
      // Find and update related admission record
      const dischargedAdmissions = await HospitalService.getDischargedAdmissions();
      const relatedAdmission = dischargedAdmissions.find(admission => 
        admission.patient_id === patientId || admission.patient?.id === patientId
      );
      
      if (relatedAdmission) {
        const { error: admissionError } = await supabase
          .from('patient_admissions')
          .update({ status: 'ADMITTED' })
          .eq('id', relatedAdmission.id);
          
        if (admissionError) {
          console.warn('Warning: Could not update admission status:', admissionError);
        }
      }
      
      setDischargedPatients(prev => prev.filter(p => p.id !== patientId));
      
      toast.success(`Discharge record for ${patient.first_name} ${patient.last_name} has been removed. Patient data remains in the system.`);
      
    } catch (error: any) {
      console.error('Error deleting discharge record:', error);
      toast.error(`Failed to remove discharge record: ${error.message}`);
    }
  };

  const exportDischargedPatients = () => {
    try {
      const exportData = filteredPatients.map(patient => ({
        patient_id: patient.patient_id,
        first_name: patient.first_name,
        last_name: patient.last_name,
        phone: patient.phone || '',
        gender: patient.gender || '',
        discharge_date: patient.discharge_date ? formatDate(patient.discharge_date) : '',
        admission_duration: patient.admission_duration || '',
        final_diagnosis: patient.final_diagnosis || '',
        total_bill_amount: patient.total_bill_amount || 0,
        total_spent: patient.totalSpent || 0,
        visit_count: patient.visitCount || 0
      }));

      const success = exportToExcel({
        filename: `Discharged_Patients_${new Date().toISOString().split('T')[0]}`,
        headers: [
          'Patient ID',
          'First Name',
          'Last Name',
          'Phone',
          'Gender',
          'Discharge Date',
          'Admission Duration',
          'Final Diagnosis',
          'Total Bill Amount',
          'Total Spent',
          'Visit Count'
        ],
        data: exportData,
        formatters: {
          total_bill_amount: (value) => `₹${value.toLocaleString()}`,
          total_spent: (value) => `₹${value.toLocaleString()}`
        }
      });

      if (success) {
        toast.success(`Exported ${filteredPatients.length} discharged patients to Excel!`);
      } else {
        toast.error('Failed to export discharged patients');
      }
    } catch (error: any) {
      toast.error('Failed to export: ' + error.message);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading discharged patients...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">📤 Discharged Patients</h1>
        <p className="text-gray-600">Patients who have been discharged from IPD</p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-blue-50 p-4 rounded-lg border-2 border-blue-200">
          <div className="text-2xl font-bold text-blue-700">{dischargedPatients.length}</div>
          <div className="text-blue-600">Total Discharged</div>
        </div>
        <div className="bg-green-50 p-4 rounded-lg border-2 border-green-200">
          <div className="text-2xl font-bold text-green-700">{filteredPatients.length}</div>
          <div className="text-green-600">Filtered Results</div>
        </div>
        <div className="bg-purple-50 p-4 rounded-lg border-2 border-purple-200">
          <div className="text-2xl font-bold text-purple-700">
            ₹{dischargedPatients.reduce((sum, p) => sum + (p.total_bill_amount || 0), 0).toLocaleString()}
          </div>
          <div className="text-purple-600">Total Revenue</div>
        </div>
        <div className="bg-orange-50 p-4 rounded-lg border-2 border-orange-200">
          <div className="text-2xl font-bold text-orange-700">
            {dischargedPatients.length > 0 
              ? Math.round(dischargedPatients.reduce((sum, p) => {
                  const days = parseInt(p.admission_duration?.split(' ')[0] || '0');
                  return sum + days;
                }, 0) / dischargedPatients.length)
              : 0}
          </div>
          <div className="text-orange-600">Avg Stay (Days)</div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white p-4 rounded-lg shadow-sm border mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search by name, phone, patient ID, or diagnosis..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Date Filter */}
          <div className="min-w-[150px]">
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value as any)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Time</option>
              <option value="today">Today</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
            </select>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-2">
            <button
              onClick={loadDischargedPatients}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200 shadow-sm hover:shadow-md"
            >
              🔄 Refresh
            </button>
            <button
              onClick={exportDischargedPatients}
              disabled={filteredPatients.length === 0}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-sm hover:shadow-md"
              title="Export to Excel"
            >
              📊 Export
            </button>
          </div>
        </div>
      </div>

      {/* Discharged Patients List */}
      {filteredPatients.length > 0 ? (
        <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th
                    className="text-left p-4 font-semibold text-gray-700 cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('name')}
                  >
                    Patient {getSortIcon('name')}
                  </th>
                  <th className="text-left p-4 font-semibold text-gray-700">IPD No.</th>
                  <th className="text-left p-4 font-semibold text-gray-700">Contact</th>
                  <th
                    className="text-left p-4 font-semibold text-gray-700 cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('discharge_date')}
                  >
                    Discharge Date {getSortIcon('discharge_date')}
                  </th>
                  <th
                    className="text-left p-4 font-semibold text-gray-700 cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('duration')}
                  >
                    Stay Duration {getSortIcon('duration')}
                  </th>
                  <th className="text-left p-4 font-semibold text-gray-700">Final Diagnosis</th>
                  <th
                    className="text-left p-4 font-semibold text-gray-700 cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('bill_amount')}
                  >
                    Total Bill {getSortIcon('bill_amount')}
                  </th>
                  <th className="text-left p-4 font-semibold text-gray-700">Status</th>
                  <th className="text-center p-4 font-semibold text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredPatients.map((patient, index) => (
                  <tr 
                    key={patient.id} 
                    className={`border-b hover:bg-gray-50 ${
                      index % 2 === 0 ? 'bg-white' : 'bg-gray-25'
                    }`}
                  >
                    <td className="p-4">
                      <div>
                        <div className="font-semibold text-gray-800">
                          {patient.first_name} {patient.last_name}
                        </div>
                        <div className="text-sm text-gray-500">ID: {patient.patient_id}</div>
                        <div className="text-sm text-gray-500">
                          {patient.gender} • {patient.blood_group || 'Unknown Blood Group'}
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="font-medium text-blue-600">
                        {patient.ipd_number || 'N/A'}
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="text-sm">
                        <div>{patient.phone || 'No phone'}</div>
                        <div className="text-gray-500">{patient.email || 'No email'}</div>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="text-sm">
                        {patient.discharge_date 
                          ? new Date(patient.discharge_date).toLocaleDateString('en-IN', {
                              day: '2-digit',
                              month: '2-digit',
                              year: 'numeric'
                            })
                          : 'Unknown'
                        }
                      </div>
                    </td>
                    <td className="p-4">
                      <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm font-medium">
                        {patient.admission_duration || 'Unknown'}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="text-sm max-w-xs truncate" title={patient.final_diagnosis}>
                        {patient.final_diagnosis || 'Not specified'}
                      </div>
                    </td>
                    <td className="p-4">
                      <span className="text-green-600 font-semibold">
                        ₹{(patient.total_bill_amount || 0).toLocaleString()}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className="px-2 py-1 rounded text-sm font-medium bg-gray-100 text-gray-800">
                        DISCHARGED
                      </span>
                    </td>
                    <td className="p-4 text-center">
                      <button
                        onClick={() => deleteDischargeRecord(patient.id)}
                        className="px-3 py-1 bg-orange-600 text-white rounded-md hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all duration-200 text-sm font-medium"
                        title="Remove discharge record (patient data will remain in system)"
                      >
                        📝 Remove Discharge
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border p-12 text-center">
          <div className="text-6xl mb-4">📤</div>
          <h3 className="text-xl font-semibold text-gray-800 mb-2">No discharged patients found</h3>
          <p className="text-gray-600 mb-4">
            {searchTerm || dateFilter !== 'all'
              ? 'Try adjusting your search or filters'
              : 'No patients have been discharged yet'
            }
          </p>
          <button
            onClick={loadDischargedPatients}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
          >
            🔄 Refresh List
          </button>
        </div>
      )}
    </div>
  );
};

export default DischargeSection;
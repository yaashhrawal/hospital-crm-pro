import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { supabase } from '../config/supabaseNew';
import HospitalService from '../services/hospitalService';
import IPDAdmissionModal from './IPDAdmissionModal';
import IPDServicesModal from './IPDServicesModal';

interface IPDPatient {
  id: string;
  patient_id: string;
  patient: {
    first_name: string;
    last_name: string;
    phone: string;
    patient_id: string;
  };
  bed_number: string;
  room_type: 'GENERAL' | 'PRIVATE' | 'ICU' | 'EMERGENCY';
  department: string;
  daily_rate: number;
  admission_date: string;
  expected_discharge: string;
  actual_discharge?: string;
  status: 'ACTIVE' | 'DISCHARGED';
  admission_notes: string;
  discharge_notes?: string;
  created_at: string;
}

interface IPDService {
  id: string;
  admission_id: string;
  service_name: string;
  service_type: 'NURSING' | 'MEDICATION' | 'PROCEDURE' | 'CONSULTATION' | 'DIAGNOSTIC' | 'OTHER';
  amount: number;
  service_date: string;
  notes?: string;
  provided_by?: string;
}

const IPDManagement: React.FC = () => {
  const [ipdPatients, setIpdPatients] = useState<IPDPatient[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'active' | 'discharged'>('active');
  const [showAdmitModal, setShowAdmitModal] = useState(false);
  const [editingPatient, setEditingPatient] = useState<IPDPatient | null>(null);
  const [showServicesModal, setShowServicesModal] = useState<string | null>(null);
  const [servicesPatientName, setServicesPatientName] = useState<string>('');

  useEffect(() => {
    loadIPDPatients();
  }, [activeTab]);

  const loadIPDPatients = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('patient_admissions')
        .select(`
          *,
          patient:patients(first_name, last_name, phone, patient_id)
        `)
        .eq('status', activeTab === 'active' ? 'ACTIVE' : 'DISCHARGED')
        .order('admission_date', { ascending: false });

      if (error) {
        console.error('Error loading IPD patients:', error);
        toast.error('Failed to load IPD patients');
        return;
      }

      setIpdPatients(data || []);
    } catch (error: any) {
      console.error('Error loading IPD patients:', error);
      toast.error(`Failed to load IPD patients: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleEditField = async (patientId: string, field: string, value: any) => {
    try {
      const { error } = await supabase
        .from('patient_admissions')
        .update({ [field]: value })
        .eq('id', patientId);

      if (error) {
        console.error('Error updating field:', error);
        toast.error('Failed to update');
        return;
      }

      // Update local state
      setIpdPatients(prev =>
        prev.map(p =>
          p.id === patientId ? { ...p, [field]: value } : p
        )
      );

      toast.success('Updated successfully');
    } catch (error: any) {
      console.error('Error updating field:', error);
      toast.error(`Failed to update: ${error.message}`);
    }
  };

  const calculateStayDuration = (admissionDate: string, dischargeDate?: string) => {
    const start = new Date(admissionDate);
    const end = dischargeDate ? new Date(dischargeDate) : new Date();
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const calculateTotalAmount = (patient: IPDPatient) => {
    const days = calculateStayDuration(patient.admission_date, patient.actual_discharge);
    return days * patient.daily_rate;
  };

  const handleDischarge = async (patientId: string) => {
    if (!confirm('Are you sure you want to discharge this patient?')) return;

    try {
      const dischargeDate = new Date().toISOString().split('T')[0];
      const { error } = await supabase
        .from('patient_admissions')
        .update({
          status: 'DISCHARGED',
          actual_discharge: dischargeDate
        })
        .eq('id', patientId);

      if (error) {
        console.error('Error discharging patient:', error);
        toast.error('Failed to discharge patient');
        return;
      }

      toast.success('Patient discharged successfully');
      loadIPDPatients();
    } catch (error: any) {
      console.error('Error discharging patient:', error);
      toast.error(`Failed to discharge patient: ${error.message}`);
    }
  };

  const EditableField: React.FC<{
    value: string | number;
    onSave: (value: any) => void;
    type?: 'text' | 'number' | 'date' | 'select';
    options?: { value: string; label: string }[];
  }> = ({ value, onSave, type = 'text', options = [] }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [editValue, setEditValue] = useState(value);

    const handleSave = () => {
      onSave(editValue);
      setIsEditing(false);
    };

    const handleCancel = () => {
      setEditValue(value);
      setIsEditing(false);
    };

    if (isEditing) {
      return (
        <div className="flex items-center space-x-1">
          {type === 'select' ? (
            <select
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              className="px-2 py-1 border border-gray-300 rounded text-sm"
              autoFocus
            >
              {options.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          ) : (
            <input
              type={type}
              value={editValue}
              onChange={(e) => setEditValue(type === 'number' ? Number(e.target.value) : e.target.value)}
              className="px-2 py-1 border border-gray-300 rounded text-sm w-full"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSave();
                if (e.key === 'Escape') handleCancel();
              }}
            />
          )}
          <button
            onClick={handleSave}
            className="text-green-600 hover:text-green-800 text-sm"
          >
            ✓
          </button>
          <button
            onClick={handleCancel}
            className="text-red-600 hover:text-red-800 text-sm"
          >
            ✕
          </button>
        </div>
      );
    }

    return (
      <div
        className="cursor-pointer hover:bg-gray-100 px-2 py-1 rounded group"
        onClick={() => setIsEditing(true)}
      >
        <span>{value}</span>
        <span className="ml-1 text-gray-400 opacity-0 group-hover:opacity-100 text-xs">✏️</span>
      </div>
    );
  };

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800">🏥 IPD Management</h1>
        <p className="text-gray-600">In-Patient Department - Comprehensive Admitted Patients Management</p>
      </div>

      {/* Action Buttons */}
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
            🛏️ Active Patients ({ipdPatients.length})
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
            onClick={() => setShowAdmitModal(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex items-center space-x-2"
          >
            <span>➕</span>
            <span>Admit Patient</span>
          </button>
          <button
            onClick={loadIPDPatients}
            disabled={loading}
            className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 disabled:opacity-50"
          >
            {loading ? '⟳' : '🔄'} Refresh
          </button>
        </div>
      </div>

      {/* IPD Patients Table */}
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
            <p className="text-gray-600">Loading IPD patients...</p>
          </div>
        ) : ipdPatients.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left p-4 font-semibold text-gray-700">Patient</th>
                  <th className="text-left p-4 font-semibold text-gray-700">Bed No.</th>
                  <th className="text-left p-4 font-semibold text-gray-700">Room Type</th>
                  <th className="text-left p-4 font-semibold text-gray-700">Department</th>
                  <th className="text-left p-4 font-semibold text-gray-700">Daily Rate</th>
                  <th className="text-left p-4 font-semibold text-gray-700">Days</th>
                  <th className="text-left p-4 font-semibold text-gray-700">Total Amount</th>
                  <th className="text-left p-4 font-semibold text-gray-700">Admission</th>
                  <th className="text-left p-4 font-semibold text-gray-700">Notes</th>
                  <th className="text-left p-4 font-semibold text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {ipdPatients.map((patient, index) => (
                  <tr key={patient.id} className={`border-b hover:bg-gray-50 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-25'}`}>
                    <td className="p-4">
                      <div>
                        <div className="font-medium">{patient.patient?.first_name} {patient.patient?.last_name}</div>
                        <div className="text-sm text-gray-500">
                          ID: {patient.patient?.patient_id} | {patient.patient?.phone}
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <EditableField
                        value={patient.bed_number}
                        onSave={(value) => handleEditField(patient.id, 'bed_number', value)}
                      />
                    </td>
                    <td className="p-4">
                      <EditableField
                        value={patient.room_type}
                        onSave={(value) => handleEditField(patient.id, 'room_type', value)}
                        type="select"
                        options={[
                          { value: 'GENERAL', label: 'General Ward' },
                          { value: 'PRIVATE', label: 'Private Room' },
                          { value: 'ICU', label: 'ICU' },
                          { value: 'EMERGENCY', label: 'Emergency' }
                        ]}
                      />
                    </td>
                    <td className="p-4">
                      <EditableField
                        value={patient.department}
                        onSave={(value) => handleEditField(patient.id, 'department', value)}
                      />
                    </td>
                    <td className="p-4">
                      <EditableField
                        value={patient.daily_rate}
                        onSave={(value) => handleEditField(patient.id, 'daily_rate', value)}
                        type="number"
                      />
                    </td>
                    <td className="p-4">
                      <span className="font-medium">
                        {calculateStayDuration(patient.admission_date, patient.actual_discharge)} days
                      </span>
                    </td>
                    <td className="p-4">
                      <span className="font-semibold text-green-600">
                        ₹{calculateTotalAmount(patient).toLocaleString()}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="text-sm">
                        <div>Admitted: {new Date(patient.admission_date).toLocaleDateString()}</div>
                        {patient.actual_discharge && (
                          <div className="text-blue-600">
                            Discharged: {new Date(patient.actual_discharge).toLocaleDateString()}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="p-4 max-w-xs">
                      <EditableField
                        value={patient.admission_notes || 'No notes'}
                        onSave={(value) => handleEditField(patient.id, 'admission_notes', value)}
                      />
                    </td>
                    <td className="p-4">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => {
                            setShowServicesModal(patient.id);
                            setServicesPatientName(`${patient.patient?.first_name} ${patient.patient?.last_name}`);
                          }}
                          className="bg-purple-600 text-white px-3 py-1 rounded text-sm hover:bg-purple-700"
                        >
                          💊 Services
                        </button>
                        {activeTab === 'active' && (
                          <button
                            onClick={() => handleDischarge(patient.id)}
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
              No {activeTab} patients found
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

      {/* Summary Cards for Active Tab */}
      {activeTab === 'active' && ipdPatients.length > 0 && (
        <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-blue-50 p-4 rounded-lg border-2 border-blue-200">
            <div className="text-2xl font-bold text-blue-700">{ipdPatients.length}</div>
            <div className="text-blue-600 text-sm">Active Admissions</div>
          </div>
          <div className="bg-green-50 p-4 rounded-lg border-2 border-green-200">
            <div className="text-2xl font-bold text-green-700">
              ₹{ipdPatients.reduce((sum, p) => sum + calculateTotalAmount(p), 0).toLocaleString()}
            </div>
            <div className="text-green-600 text-sm">Total Revenue</div>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg border-2 border-purple-200">
            <div className="text-2xl font-bold text-purple-700">
              {ipdPatients.filter(p => p.room_type === 'ICU').length}
            </div>
            <div className="text-purple-600 text-sm">ICU Patients</div>
          </div>
          <div className="bg-orange-50 p-4 rounded-lg border-2 border-orange-200">
            <div className="text-2xl font-bold text-orange-700">
              {Math.round(ipdPatients.reduce((sum, p) => sum + calculateStayDuration(p.admission_date), 0) / ipdPatients.length) || 0}
            </div>
            <div className="text-orange-600 text-sm">Avg Stay (days)</div>
          </div>
        </div>
      )}

      {/* Modals */}
      <IPDAdmissionModal
        isOpen={showAdmitModal}
        onClose={() => setShowAdmitModal(false)}
        onAdmissionSuccess={loadIPDPatients}
      />

      <IPDServicesModal
        isOpen={!!showServicesModal}
        onClose={() => {
          setShowServicesModal(null);
          setServicesPatientName('');
        }}
        admissionId={showServicesModal || ''}
        patientName={servicesPatientName}
      />
    </div>
  );
};

export default IPDManagement;
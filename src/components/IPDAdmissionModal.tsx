import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { supabase } from '../config/supabaseNew';
import HospitalService from '../services/hospitalService';

interface Patient {
  id: string;
  first_name: string;
  last_name: string;
  phone: string;
  patient_id: string;
}

interface IPDAdmissionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdmissionSuccess: () => void;
}

const IPDAdmissionModal: React.FC<IPDAdmissionModalProps> = ({
  isOpen,
  onClose,
  onAdmissionSuccess
}) => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [formData, setFormData] = useState({
    bed_number: '',
    room_type: 'general' as 'general' | 'private' | 'icu',
    department: '',
    daily_rate: '',
    expected_discharge: '',
    admission_notes: '',
  });

  useEffect(() => {
    if (isOpen) {
      loadPatients();
      // Set default expected discharge to 3 days from now
      const defaultDate = new Date();
      defaultDate.setDate(defaultDate.getDate() + 3);
      setFormData(prev => ({
        ...prev,
        expected_discharge: defaultDate.toISOString().split('T')[0]
      }));
    }
  }, [isOpen]);

  const loadPatients = async () => {
    try {
      const { data, error } = await supabase
        .from('patients')
        .select('id, first_name, last_name, phone, patient_id')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading patients:', error);
        toast.error('Failed to load patients');
        return;
      }

      setPatients(data || []);
    } catch (error: any) {
      console.error('Error loading patients:', error);
      toast.error(`Failed to load patients: ${error.message}`);
    }
  };

  const filteredPatients = patients.filter(patient =>
    `${patient.first_name} ${patient.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    patient.phone.includes(searchTerm) ||
    patient.patient_id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAdmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedPatient) {
      toast.error('Please select a patient');
      return;
    }

    if (!formData.bed_number || !formData.department || !formData.daily_rate) {
      toast.error('Please fill in all required fields');
      return;
    }

    setLoading(true);

    try {
      const currentUser = await HospitalService.getCurrentUser();
      if (!currentUser) {
        toast.error('Authentication required');
        return;
      }

      // Check if bed number is already occupied
      const { data: existingBed, error: bedCheckError } = await supabase
        .from('patient_admissions')
        .select('id')
        .eq('bed_number', formData.bed_number)
        .eq('status', 'active')
        .single();

      if (bedCheckError && bedCheckError.code !== 'PGRST116') {
        console.error('Error checking bed availability:', bedCheckError);
        toast.error('Failed to check bed availability');
        return;
      }

      if (existingBed) {
        toast.error(`Bed ${formData.bed_number} is already occupied`);
        return;
      }

      // Check if patient is already admitted
      const { data: existingAdmission, error: admissionCheckError } = await supabase
        .from('patient_admissions')
        .select('id')
        .eq('patient_id', selectedPatient.id)
        .eq('status', 'active')
        .single();

      if (admissionCheckError && admissionCheckError.code !== 'PGRST116') {
        console.error('Error checking patient admission:', admissionCheckError);
        toast.error('Failed to check patient admission status');
        return;
      }

      if (existingAdmission) {
        toast.error(`${selectedPatient.first_name} ${selectedPatient.last_name} is already admitted`);
        return;
      }

      // Create admission record (using only existing database columns)
      const admissionData = {
        patient_id: selectedPatient.id,
        bed_number: formData.bed_number,
        room_type: formData.room_type,
        department: formData.department,
        daily_rate: parseFloat(formData.daily_rate),
        admission_date: new Date().toISOString().split('T')[0],
        status: 'active',
        total_amount: 0
      };

      // Add optional fields only if they exist in the database schema
      const optionalFields: any = {};
      if (formData.expected_discharge) {
        optionalFields.expected_discharge = formData.expected_discharge;
      }
      if (formData.admission_notes) {
        optionalFields.admission_notes = formData.admission_notes;
      }
      if (currentUser.id) {
        optionalFields.admitted_by = currentUser.id;
      }

      // Try to insert with optional fields first, fallback to basic fields if it fails
      let error;
      try {
        const fullData = { ...admissionData, ...optionalFields };
        const result = await supabase
          .from('patient_admissions')
          .insert([fullData]);
        error = result.error;
      } catch (firstError) {
        console.log('First attempt failed, trying with basic fields only:', firstError);
        // Fallback to basic fields only
        const result = await supabase
          .from('patient_admissions')
          .insert([admissionData]);
        error = result.error;
      }

      if (error) {
        console.error('Error creating admission:', error);
        toast.error('Failed to admit patient');
        return;
      }

      toast.success(`${selectedPatient.first_name} ${selectedPatient.last_name} admitted successfully to bed ${formData.bed_number}`);
      onAdmissionSuccess();
      handleClose();
    } catch (error: any) {
      console.error('Error admitting patient:', error);
      toast.error(`Failed to admit patient: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setSelectedPatient(null);
    setSearchTerm('');
    setFormData({
      bed_number: '',
      room_type: 'general',
      department: '',
      daily_rate: '',
      expected_discharge: '',
      admission_notes: '',
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-screen overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">🏥 Admit Patient to IPD</h2>
          <button
            onClick={handleClose}
            className="text-gray-500 hover:text-gray-700 text-2xl"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleAdmit} className="space-y-6">
          {/* Patient Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Patient
            </label>
            <input
              type="text"
              placeholder="Search by name, phone, or patient ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            
            {searchTerm && (
              <div className="mt-2 max-h-40 overflow-y-auto border border-gray-200 rounded-md">
                {filteredPatients.length > 0 ? (
                  filteredPatients.map((patient) => (
                    <div
                      key={patient.id}
                      onClick={() => {
                        setSelectedPatient(patient);
                        setSearchTerm('');
                      }}
                      className="p-3 hover:bg-gray-50 cursor-pointer border-b last:border-b-0"
                    >
                      <div className="font-medium">{patient.first_name} {patient.last_name}</div>
                      <div className="text-sm text-gray-500">ID: {patient.patient_id} | Phone: {patient.phone}</div>
                    </div>
                  ))
                ) : (
                  <div className="p-3 text-gray-500 text-center">No patients found</div>
                )}
              </div>
            )}

            {selectedPatient && (
              <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-md">
                <div className="font-medium text-blue-800">
                  Selected: {selectedPatient.first_name} {selectedPatient.last_name}
                </div>
                <div className="text-sm text-blue-600">
                  ID: {selectedPatient.patient_id} | Phone: {selectedPatient.phone}
                </div>
              </div>
            )}
          </div>

          {/* Admission Details */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Bed Number *
              </label>
              <input
                type="text"
                value={formData.bed_number}
                onChange={(e) => setFormData({ ...formData, bed_number: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., A-101, ICU-01"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Room Type *
              </label>
              <select
                value={formData.room_type}
                onChange={(e) => setFormData({ ...formData, room_type: e.target.value as any })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="general">🏨 General Ward</option>
                <option value="private">🛏️ Private Room</option>
                <option value="icu">🏥 ICU</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Department *
              </label>
              <input
                type="text"
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., Cardiology, Surgery, General Medicine"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Daily Rate (₹) *
              </label>
              <input
                type="number"
                value={formData.daily_rate}
                onChange={(e) => setFormData({ ...formData, daily_rate: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter daily rate"
                min="0"
                step="0.01"
                required
              />
            </div>

            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Expected Discharge Date
              </label>
              <input
                type="date"
                value={formData.expected_discharge}
                onChange={(e) => setFormData({ ...formData, expected_discharge: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Admission Notes
              </label>
              <textarea
                value={formData.admission_notes}
                onChange={(e) => setFormData({ ...formData, admission_notes: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
                placeholder="Enter admission notes, medical conditions, special instructions..."
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 pt-6 border-t">
            <button
              type="button"
              onClick={handleClose}
              className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !selectedPatient}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Admitting...
                </div>
              ) : (
                '🛏️ Admit Patient'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default IPDAdmissionModal;
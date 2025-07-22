import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { supabase } from '../config/supabaseNew';
import HospitalService from '../services/hospitalService';
import type { PatientWithRelations } from '../config/supabaseNew';

interface PatientToIPDModalProps {
  patient: PatientWithRelations;
  isOpen: boolean;
  onClose: () => void;
  onAdmissionSuccess: () => void;
}

const PatientToIPDModal: React.FC<PatientToIPDModalProps> = ({
  patient,
  isOpen,
  onClose,
  onAdmissionSuccess
}) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    bed_number: '',
    room_type: 'GENERAL' as 'GENERAL' | 'PRIVATE' | 'ICU' | 'EMERGENCY',
    department: '',
    daily_rate: '',
    expected_discharge: '',
    admission_notes: '',
  });

  React.useEffect(() => {
    if (isOpen) {
      // Set default expected discharge to 3 days from now
      const defaultDate = new Date();
      defaultDate.setDate(defaultDate.getDate() + 3);
      setFormData(prev => ({
        ...prev,
        expected_discharge: defaultDate.toISOString().split('T')[0]
      }));
    }
  }, [isOpen]);

  const handleAdmit = async (e: React.FormEvent) => {
    e.preventDefault();

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
        .eq('status', 'ACTIVE')
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
        .eq('patient_id', patient.id)
        .eq('status', 'ACTIVE')
        .single();

      if (admissionCheckError && admissionCheckError.code !== 'PGRST116') {
        console.error('Error checking patient admission:', admissionCheckError);
        toast.error('Failed to check patient admission status');
        return;
      }

      if (existingAdmission) {
        toast.error(`${patient.first_name} ${patient.last_name} is already admitted to IPD`);
        return;
      }

      // Create admission record using ONLY existing database columns
      const admissionData = {
        patient_id: patient.id,
        bed_number: formData.bed_number,
        room_type: formData.room_type,
        department: formData.department,
        daily_rate: parseFloat(formData.daily_rate),
        admission_date: new Date().toISOString().split('T')[0],
        status: 'ACTIVE',
        total_amount: 0
      };

      console.log('📤 Inserting admission data:', admissionData);

      const { data: insertedData, error } = await supabase
        .from('patient_admissions')
        .insert([admissionData])
        .select();

      if (error) {
        console.error('ERROR DETAILS:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code,
          formData,
          patient: patient.id,
          admissionData
        });
        toast.error(`Failed to admit patient to IPD: ${error.message}`);
        return;
      }

      console.log('✅ IPD Admission successful:', insertedData);
      console.log('🔍 Verifying admission was saved...');
      
      // Verify the admission was actually saved
      const { data: verifyData, error: verifyError } = await supabase
        .from('patient_admissions')
        .select('*')
        .eq('patient_id', patient.id)
        .eq('status', 'ACTIVE')
        .order('created_at', { ascending: false })
        .limit(1);

      if (verifyError) {
        console.error('❌ Error verifying admission:', verifyError);
      } else {
        console.log('✅ Verification result - admission exists:', verifyData);
      }

      toast.success(`${patient.first_name} ${patient.last_name} successfully admitted to IPD bed ${formData.bed_number}`);
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
    setFormData({
      bed_number: '',
      room_type: 'GENERAL',
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
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-screen overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">🛏️ Admit to IPD</h2>
            <p className="text-gray-600">
              Patient: {patient.first_name} {patient.last_name} (ID: {patient.patient_id})
            </p>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-500 hover:text-gray-700 text-2xl"
          >
            ✕
          </button>
        </div>

        {/* Patient Summary */}
        <div className="bg-blue-50 p-4 rounded-lg mb-6 border border-blue-200">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium text-blue-800">Name:</span>
              <span className="ml-2 text-blue-600">{patient.first_name} {patient.last_name}</span>
            </div>
            <div>
              <span className="font-medium text-blue-800">Age:</span>
              <span className="ml-2 text-blue-600">{patient.age || 'N/A'} years</span>
            </div>
            <div>
              <span className="font-medium text-blue-800">Phone:</span>
              <span className="ml-2 text-blue-600">{patient.phone}</span>
            </div>
            <div>
              <span className="font-medium text-blue-800">Blood Group:</span>
              <span className="ml-2 text-blue-600">{patient.blood_group || 'N/A'}</span>
            </div>
          </div>
        </div>

        <form onSubmit={handleAdmit} className="space-y-4">
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
                <option value="GENERAL">🏨 General Ward</option>
                <option value="PRIVATE">🛏️ Private Room</option>
                <option value="ICU">🏥 ICU</option>
                <option value="EMERGENCY">🚨 Emergency</option>
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
          <div className="flex justify-end space-x-3 pt-4 border-t">
            <button
              type="button"
              onClick={handleClose}
              className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Admitting...
                </div>
              ) : (
                '🛏️ Admit to IPD'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PatientToIPDModal;
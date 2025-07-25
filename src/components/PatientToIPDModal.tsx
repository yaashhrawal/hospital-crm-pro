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
    expected_discharge: '',
    admission_notes: '',
    procedure_planned: '',
    history_present_illness: '',
    past_medical_history: '',
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

    if (!formData.bed_number || !formData.department || !formData.history_present_illness.trim()) {
      toast.error('Please fill in all required fields (Bed Number, Department, History of Present Illness)');
      return;
    }

    setLoading(true);

    try {
      const currentUser = await HospitalService.getCurrentUser();
      if (!currentUser) {
        toast.error('Authentication required');
        return;
      }

      // Check if bed number is already occupied by checking beds table
      const { data: existingBed, error: bedCheckError } = await supabase
        .from('beds')
        .select('id, status')
        .eq('bed_number', formData.bed_number)
        .single();

      if (bedCheckError && bedCheckError.code !== 'PGRST116') {
        console.error('Error checking bed availability:', bedCheckError);
        // Continue anyway - we'll create the bed if needed
      } else if (existingBed && existingBed.status === 'OCCUPIED') {
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

      // First, create or find the bed record
      console.log('🛏️ Creating/finding bed record...');
      
      let bedRecord;
      // Try to find existing bed with same number
      const { data: existingBedRecord, error: bedFindError } = await supabase
        .from('beds')
        .select('*')
        .eq('bed_number', formData.bed_number)
        .single();

      if (existingBedRecord && !bedFindError) {
        console.log('✅ Found existing bed record:', existingBedRecord);
        bedRecord = existingBedRecord;
        
        // Update bed status to occupied
        await supabase
          .from('beds')
          .update({ 
            status: 'OCCUPIED',
            room_type: formData.room_type
          })
          .eq('id', bedRecord.id);
      } else {
        console.log('➕ Creating new bed record...');
        // Create new bed record
        const { data: newBedData, error: bedCreateError } = await supabase
          .from('beds')
          .insert([{
            bed_number: formData.bed_number,
            room_type: formData.room_type,
            status: 'OCCUPIED',
            hospital_id: '550e8400-e29b-41d4-a716-446655440000'
          }])
          .select()
          .single();

        if (bedCreateError) {
          console.error('❌ Error creating bed:', bedCreateError);
          toast.error(`Failed to create bed: ${bedCreateError.message}`);
          return;
        }
        
        bedRecord = newBedData;
        console.log('✅ Created new bed record:', bedRecord);
      }

      // Create admission record using proper schema
      const admissionData = {
        patient_id: patient.id,
        bed_number: formData.bed_number,
        room_type: formData.room_type,
        department: formData.department,
        admission_date: new Date().toISOString(),
        status: 'ACTIVE',
        services: {},
        total_amount: 0,
        amount_paid: 0,
        balance_amount: 0,
        hospital_id: '550e8400-e29b-41d4-a716-446655440000',
        procedure_planned: formData.procedure_planned.trim() || null,
        history_present_illness: formData.history_present_illness.trim() || null,
        past_medical_history: formData.past_medical_history.trim() || null,
        admission_notes: formData.admission_notes.trim() || null
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
      expected_discharge: '',
      admission_notes: '',
      procedure_planned: '',
      history_present_illness: '',
      past_medical_history: '',
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
                Procedure Planned
              </label>
              <input
                type="text"
                value={formData.procedure_planned}
                onChange={(e) => setFormData({ ...formData, procedure_planned: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., Laparoscopic Cholecystectomy, Appendectomy, Medical Management..."
              />
            </div>

            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                History of Present Illness (HPI) *
              </label>
              <textarea
                value={formData.history_present_illness}
                onChange={(e) => setFormData({ ...formData, history_present_illness: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
                placeholder="Chief complaint, onset, duration, severity, associated symptoms, timeline..."
                required
              />
            </div>

            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Past Medical History
              </label>
              <textarea
                value={formData.past_medical_history}
                onChange={(e) => setFormData({ ...formData, past_medical_history: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
                placeholder="Previous surgeries, chronic conditions, medications, allergies..."
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
                rows={2}
                placeholder="Additional notes, special instructions..."
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
import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { supabase } from '../config/supabaseNew';

const MinimalIPDAdmission: React.FC = () => {
  const [patients, setPatients] = useState<any[]>([]);
  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [bedNumber, setBedNumber] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadPatients();
  }, []);

  const loadPatients = async () => {
    try {
      const { data, error } = await supabase
        .from('patients')
        .select('id, first_name, last_name, patient_id')
        .limit(20);

      if (error) {
        console.error('Error loading patients:', error);
        return;
      }

      setPatients(data || []);
    } catch (error) {
      console.error('Exception loading patients:', error);
    }
  };

  const admitPatient = async () => {
    if (!selectedPatientId || !bedNumber.trim()) {
      toast.error('Please select a patient and enter bed number');
      return;
    }

    setLoading(true);

    try {
      console.log('🏥 Starting MINIMAL IPD admission...');
      
      // Create admission with ONLY the absolute minimum required fields
      const { data, error } = await supabase
        .from('patient_admissions')
        .insert({
          patient_id: selectedPatientId,
          bed_number: bedNumber.trim(),
          room_type: 'general',
          department: 'General',
          daily_rate: 1000,
          admission_date: new Date().toISOString().split('T')[0],
          status: 'active',
          total_amount: 0
        })
        .select();

      if (error) {
        console.error('❌ Admission failed:', error);
        toast.error(`Admission failed: ${error.message}`);
      } else {
        console.log('✅ Admission successful:', data);
        toast.success(`Patient admitted successfully to bed ${bedNumber}!`);
        setBedNumber('');
        setSelectedPatientId('');
      }

    } catch (error: any) {
      console.error('💥 Exception during admission:', error);
      toast.error(`Exception: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800">🏥 Minimal IPD Admission</h1>
        <p className="text-gray-600">Simplest possible IPD admission test</p>
      </div>

      <div className="bg-white p-6 rounded-lg border space-y-6">
        {/* Patient Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Patient *
          </label>
          <select
            value={selectedPatientId}
            onChange={(e) => setSelectedPatientId(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          >
            <option value="">-- Select a patient --</option>
            {patients.map((patient) => (
              <option key={patient.id} value={patient.id}>
                {patient.first_name} {patient.last_name} (ID: {patient.patient_id})
              </option>
            ))}
          </select>
        </div>

        {/* Bed Number */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Bed Number *
          </label>
          <input
            type="text"
            value={bedNumber}
            onChange={(e) => setBedNumber(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="e.g., A-101"
            required
          />
        </div>

        {/* Submit Button */}
        <div>
          <button
            onClick={admitPatient}
            disabled={loading || !selectedPatientId || !bedNumber.trim()}
            className="w-full bg-blue-600 text-white py-3 px-6 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Admitting Patient...
              </div>
            ) : (
              '🛏️ Admit to IPD'
            )}
          </button>
        </div>

        {/* Current Admissions */}
        <div className="mt-8 pt-6 border-t">
          <h3 className="text-lg font-semibold mb-4">Current Admissions</h3>
          <CurrentAdmissions />
        </div>
      </div>
    </div>
  );
};

const CurrentAdmissions: React.FC = () => {
  const [admissions, setAdmissions] = useState<any[]>([]);

  useEffect(() => {
    loadAdmissions();
  }, []);

  const loadAdmissions = async () => {
    try {
      const { data, error } = await supabase
        .from('patient_admissions')
        .select(`
          *,
          patient:patients(first_name, last_name, patient_id)
        `)
        .eq('status', 'active')
        .order('admission_date', { ascending: false });

      if (error) {
        console.error('Error loading admissions:', error);
        return;
      }

      setAdmissions(data || []);
    } catch (error) {
      console.error('Exception loading admissions:', error);
    }
  };

  const dischargePatient = async (admissionId: string) => {
    try {
      const { error } = await supabase
        .from('patient_admissions')
        .update({
          status: 'discharged',
          discharge_date: new Date().toISOString().split('T')[0]
        })
        .eq('id', admissionId);

      if (error) {
        console.error('Error discharging patient:', error);
        toast.error('Failed to discharge patient');
        return;
      }

      toast.success('Patient discharged successfully');
      loadAdmissions(); // Refresh the list
    } catch (error: any) {
      console.error('Exception discharging patient:', error);
      toast.error(`Failed to discharge: ${error.message}`);
    }
  };

  return (
    <div>
      {admissions.length > 0 ? (
        <div className="space-y-3">
          {admissions.map((admission) => (
            <div key={admission.id} className="bg-gray-50 p-4 rounded border">
              <div className="flex justify-between items-center">
                <div>
                  <div className="font-medium">
                    {admission.patient?.first_name} {admission.patient?.last_name}
                  </div>
                  <div className="text-sm text-gray-600">
                    Bed: {admission.bed_number} | Room: {admission.room_type} | 
                    Admitted: {new Date(admission.admission_date).toLocaleDateString()}
                  </div>
                </div>
                <button
                  onClick={() => dischargePatient(admission.id)}
                  className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700"
                >
                  Discharge
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-gray-500 text-center py-4">No active admissions</p>
      )}
    </div>
  );
};

export default MinimalIPDAdmission;
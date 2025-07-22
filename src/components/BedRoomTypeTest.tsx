import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { supabase } from '../config/supabaseNew';

const BedRoomTypeTest: React.FC = () => {
  const [beds, setBeds] = useState<any[]>([]);
  const [patients, setPatients] = useState<any[]>([]);
  const [selectedPatient, setSelectedPatient] = useState('');
  const [selectedBed, setSelectedBed] = useState('');
  const [loading, setLoading] = useState(false);

  const loadBeds = async () => {
    try {
      const { data, error } = await supabase
        .from('beds')
        .select('*')
        .order('bed_number');

      if (error) throw error;
      setBeds(data || []);
      console.log('Beds loaded:', data);
    } catch (error: any) {
      console.error('Error loading beds:', error);
      toast.error(`Failed to load beds: ${error.message}`);
    }
  };

  const loadPatients = async () => {
    try {
      const { data, error } = await supabase
        .from('patients')
        .select('id, patient_id, first_name, last_name')
        .eq('is_active', true)
        .limit(10);

      if (error) throw error;
      setPatients(data || []);
    } catch (error: any) {
      console.error('Error loading patients:', error);
      toast.error(`Failed to load patients: ${error.message}`);
    }
  };

  const testAdmission = async () => {
    if (!selectedPatient || !selectedBed) {
      toast.error('Please select both patient and bed');
      return;
    }

    setLoading(true);
    try {
      const bed = beds.find(b => b.id === selectedBed);
      if (!bed) {
        toast.error('Bed not found');
        return;
      }

      console.log('Testing admission with bed:', bed);
      console.log('Room type value:', bed.room_type);
      console.log('Room type type:', typeof bed.room_type);

      // Test the exact admission data that would be sent
      const admissionData = {
        patient_id: selectedPatient,
        bed_id: selectedBed,
        admission_date: new Date().toISOString().split('T')[0],
        expected_discharge_date: null,
        admission_notes: 'Test admission',
        services: {},
        total_amount: 0,
        amount_paid: 0,
        balance: 0,
        status: 'ACTIVE',
        admitted_by: '00000000-0000-0000-0000-000000000000', // Dummy user ID
        hospital_id: '550e8400-e29b-41d4-a716-446655440000'
      };

      console.log('Admission data to insert:', admissionData);

      const { data, error } = await supabase
        .from('patient_admissions')
        .insert([admissionData])
        .select();

      if (error) {
        console.error('DETAILED ERROR:', error);
        toast.error(`Failed: ${error.message}`);
      } else {
        console.log('SUCCESS:', data);
        toast.success('Test admission successful!');
        
        // Clean up test data
        if (data && data[0]) {
          await supabase.from('patient_admissions').delete().eq('id', data[0].id);
          console.log('Cleaned up test admission');
        }
      }

    } catch (error: any) {
      console.error('Exception:', error);
      toast.error(`Exception: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800">🔍 Bed Room Type Test</h1>
        <p className="text-gray-600">Test bed data and room type constraints</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Load Data */}
        <div className="bg-white p-6 rounded-lg border">
          <h2 className="text-lg font-semibold mb-4">Load Test Data</h2>
          <div className="space-y-4">
            <button
              onClick={loadBeds}
              className="w-full bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              🛏️ Load Beds
            </button>
            <button
              onClick={loadPatients}
              className="w-full bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
            >
              👥 Load Patients
            </button>
          </div>
        </div>

        {/* Test Admission */}
        <div className="bg-white p-6 rounded-lg border">
          <h2 className="text-lg font-semibold mb-4">Test Admission</h2>
          <div className="space-y-4">
            <select
              value={selectedPatient}
              onChange={(e) => setSelectedPatient(e.target.value)}
              className="w-full px-3 py-2 border rounded"
            >
              <option value="">Select Patient</option>
              {patients.map(p => (
                <option key={p.id} value={p.id}>
                  {p.first_name} {p.last_name} ({p.patient_id})
                </option>
              ))}
            </select>

            <select
              value={selectedBed}
              onChange={(e) => setSelectedBed(e.target.value)}
              className="w-full px-3 py-2 border rounded"
            >
              <option value="">Select Bed</option>
              {beds.map(b => (
                <option key={b.id} value={b.id}>
                  {b.bed_number} - {b.room_type} (₹{b.daily_rate})
                </option>
              ))}
            </select>

            <button
              onClick={testAdmission}
              disabled={loading || !selectedPatient || !selectedBed}
              className="w-full bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 disabled:opacity-50"
            >
              {loading ? 'Testing...' : '🧪 Test Admission'}
            </button>
          </div>
        </div>
      </div>

      {/* Beds Display */}
      {beds.length > 0 && (
        <div className="mt-8 bg-white p-6 rounded-lg border">
          <h2 className="text-lg font-semibold mb-4">Available Beds ({beds.length})</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {beds.map(bed => (
              <div key={bed.id} className="p-4 border rounded bg-gray-50">
                <div className="font-medium">{bed.bed_number}</div>
                <div className="text-sm text-gray-600">
                  Room Type: <strong>{bed.room_type}</strong> ({typeof bed.room_type})
                </div>
                <div className="text-sm text-gray-600">
                  Daily Rate: ₹{bed.daily_rate}
                </div>
                <div className="text-sm text-gray-600">
                  Status: {bed.status}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Patients Display */}
      {patients.length > 0 && (
        <div className="mt-8 bg-white p-6 rounded-lg border">
          <h2 className="text-lg font-semibold mb-4">Available Patients ({patients.length})</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {patients.map(patient => (
              <div key={patient.id} className="p-3 border rounded bg-gray-50">
                <div className="font-medium">
                  {patient.first_name} {patient.last_name}
                </div>
                <div className="text-sm text-gray-600">
                  ID: {patient.patient_id}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mt-8 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
        <h3 className="font-medium text-yellow-800 mb-2">📝 Test Instructions:</h3>
        <ol className="text-sm text-yellow-700 space-y-1">
          <li>1. Open browser console (F12 → Console) to see detailed logs</li>
          <li>2. Click "Load Beds" to see what room_type values exist</li>
          <li>3. Click "Load Patients" to see available patients</li>
          <li>4. Select a patient and bed, then test admission</li>
          <li>5. Check console for exact error details and data values</li>
        </ol>
      </div>
    </div>
  );
};

export default BedRoomTypeTest;
import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { supabase } from '../config/supabaseNew';

const SimpleIPDTest: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [patients, setPatients] = useState<any[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<any>(null);

  const loadPatients = async () => {
    try {
      const { data, error } = await supabase
        .from('patients')
        .select('id, first_name, last_name, patient_id')
        .limit(10);

      if (error) {
        console.error('Error loading patients:', error);
        toast.error(`Failed to load patients: ${error.message}`);
        return;
      }

      setPatients(data || []);
      console.log('Loaded patients:', data);
    } catch (error: any) {
      console.error('Exception loading patients:', error);
      toast.error(`Exception: ${error.message}`);
    }
  };

  const testSimpleAdmission = async () => {
    if (!selectedPatient) {
      toast.error('Please select a patient first');
      return;
    }

    setLoading(true);
    
    try {
      console.log('🏥 Starting SIMPLE IPD admission test...');
      console.log('Selected patient:', selectedPatient);

      // ABSOLUTE MINIMAL DATA - only the required fields from schema
      const minimalData = {
        patient_id: selectedPatient.id,
        bed_number: 'TEST-001',
        room_type: 'general',
        department: 'Test',
        daily_rate: 100,
        admission_date: '2025-01-22',
        status: 'active',
        total_amount: 0
      };

      console.log('📤 Attempting to insert minimal data:', minimalData);

      const { data: result, error } = await supabase
        .from('patient_admissions')
        .insert([minimalData])
        .select();

      console.log('📥 Supabase response:', { result, error });

      if (error) {
        console.error('❌ DETAILED ERROR:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code,
          stack: error
        });
        toast.error(`FAILED: ${error.message}`);
      } else {
        console.log('✅ SUCCESS! Admission created:', result);
        toast.success(`SUCCESS! Patient admitted to bed TEST-001`);
        
        // Clean up the test data
        if (result && result[0]) {
          await supabase
            .from('patient_admissions')
            .delete()
            .eq('id', result[0].id);
          console.log('🧹 Cleaned up test data');
        }
      }

    } catch (exception: any) {
      console.error('💥 EXCEPTION during admission:', exception);
      toast.error(`EXCEPTION: ${exception.message}`);
    } finally {
      setLoading(false);
    }
  };

  const testTableExists = async () => {
    try {
      console.log('🔍 Testing if patient_admissions table exists...');
      
      const { data, error } = await supabase
        .from('patient_admissions')
        .select('count(*)')
        .limit(1);

      if (error) {
        console.error('❌ Table test failed:', error);
        toast.error(`Table doesn't exist or accessible: ${error.message}`);
      } else {
        console.log('✅ Table exists and is accessible');
        toast.success('patient_admissions table exists and is accessible');
      }
    } catch (error: any) {
      console.error('💥 Exception testing table:', error);
      toast.error(`Exception: ${error.message}`);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800">🧪 Simple IPD Test</h1>
        <p className="text-gray-600">Minimal test to isolate IPD admission issues</p>
      </div>

      <div className="space-y-6">
        {/* Test 1: Table Existence */}
        <div className="bg-white p-6 rounded-lg border">
          <h2 className="text-lg font-semibold mb-4">Test 1: Check Table</h2>
          <button
            onClick={testTableExists}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            🔍 Test if patient_admissions table exists
          </button>
        </div>

        {/* Test 2: Load Patients */}
        <div className="bg-white p-6 rounded-lg border">
          <h2 className="text-lg font-semibold mb-4">Test 2: Load Patients</h2>
          <button
            onClick={loadPatients}
            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 mb-4"
          >
            📋 Load Available Patients
          </button>
          
          {patients.length > 0 && (
            <div className="mt-4">
              <h3 className="font-medium mb-2">Select a patient for testing:</h3>
              <div className="space-y-2">
                {patients.map((patient) => (
                  <label key={patient.id} className="flex items-center space-x-2">
                    <input
                      type="radio"
                      name="patient"
                      value={patient.id}
                      onChange={() => setSelectedPatient(patient)}
                      className="text-blue-600"
                    />
                    <span>{patient.first_name} {patient.last_name} (ID: {patient.patient_id})</span>
                  </label>
                ))}
              </div>
              
              {selectedPatient && (
                <div className="mt-4 p-3 bg-blue-50 rounded border">
                  <strong>Selected:</strong> {selectedPatient.first_name} {selectedPatient.last_name}
                  <br />
                  <strong>Database ID:</strong> {selectedPatient.id}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Test 3: Simple Admission */}
        <div className="bg-white p-6 rounded-lg border">
          <h2 className="text-lg font-semibold mb-4">Test 3: Simple Admission</h2>
          <p className="text-sm text-gray-600 mb-4">
            This will attempt to admit the selected patient with minimal data
          </p>
          <button
            onClick={testSimpleAdmission}
            disabled={loading || !selectedPatient}
            className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 disabled:opacity-50"
          >
            {loading ? (
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Testing...
              </div>
            ) : (
              '🧪 Test Simple IPD Admission'
            )}
          </button>
        </div>

        {/* Instructions */}
        <div className="bg-yellow-50 p-6 rounded-lg border border-yellow-200">
          <h3 className="font-semibold text-yellow-800 mb-2">📝 Instructions:</h3>
          <ol className="text-sm text-yellow-700 space-y-1">
            <li>1. Open browser console (F12 → Console) to see detailed logs</li>
            <li>2. Run Test 1 to verify table access</li>
            <li>3. Run Test 2 to load patients</li>
            <li>4. Select a patient from the list</li>
            <li>5. Run Test 3 to attempt admission</li>
            <li>6. Check console for exact error details</li>
          </ol>
        </div>
      </div>
    </div>
  );
};

export default SimpleIPDTest;
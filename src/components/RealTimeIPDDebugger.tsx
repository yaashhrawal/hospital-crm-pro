import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { supabase } from '../config/supabaseNew';
import HospitalService from '../services/hospitalService';

const RealTimeIPDDebugger: React.FC = () => {
  const [debugData, setDebugData] = useState<any>(null);
  const [testResult, setTestResult] = useState<any>(null);

  const debugRealIPDAdmission = async () => {
    try {
      console.log('🚨 DEBUGGING REAL IPD ADMISSION ATTEMPT...');
      
      // Get real data from your database
      const results: any = { timestamp: new Date().toISOString() };
      
      // 1. Get actual patients
      const { data: patients, error: patientsError } = await supabase
        .from('patients')
        .select('id, patient_id, first_name, last_name, gender')
        .limit(5);
      
      results.patients = patients;
      results.patientsError = patientsError?.message;
      console.log('👥 Real patients:', patients);
      
      // 2. Get actual beds  
      const { data: beds, error: bedsError } = await supabase
        .from('beds')
        .select('id, bed_number, room_type, daily_rate, status')
        .limit(5);
      
      results.beds = beds;
      results.bedsError = bedsError?.message;
      console.log('🛏️ Real beds:', beds);
      
      // 3. Get current user
      const currentUser = await HospitalService.getCurrentUser();
      results.currentUser = currentUser;
      console.log('👤 Current user:', currentUser);
      
      if (patients && patients.length > 0 && beds && beds.length > 0) {
        const testPatient = patients[0];
        const testBed = beds[0];
        
        // 4. Try exact IPD admission like the frontend does
        const admissionData = {
          patient_id: testPatient.id,
          bed_number: testBed.bed_number,
          room_type: testBed.room_type?.toUpperCase() || 'GENERAL',
          department: 'GENERAL',
          daily_rate: testBed.daily_rate || 1000,
          admission_date: new Date().toISOString(),
          expected_discharge_date: null,
          admission_notes: 'Real test admission',
          services: {},
          total_amount: 0,
          amount_paid: 0,
          balance_amount: 0,
          status: 'ACTIVE',
          hospital_id: '550e8400-e29b-41d4-a716-446655440000',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        
        console.log('📋 EXACT admission data being sent:', admissionData);
        results.admissionData = admissionData;
        
        // 5. Try the admission
        try {
          const { data: admission, error: admissionError } = await supabase
            .from('patient_admissions')
            .insert([admissionData])
            .select();
          
          if (admissionError) {
            console.error('❌ ADMISSION FAILED:', admissionError);
            results.admissionError = {
              message: admissionError.message,
              code: admissionError.code,
              details: admissionError.details,
              hint: admissionError.hint
            };
          } else {
            console.log('✅ ADMISSION SUCCESS:', admission);
            results.admissionSuccess = admission;
            
            // Clean up test
            if (admission && admission[0]) {
              await supabase.from('patient_admissions').delete().eq('id', admission[0].id);
              console.log('🧹 Cleaned up test admission');
            }
          }
        } catch (error: any) {
          console.error('❌ ADMISSION EXCEPTION:', error);
          results.admissionException = error.message;
        }
      }
      
      setDebugData(results);
      console.log('📊 COMPLETE DEBUG RESULTS:', results);
      
    } catch (error: any) {
      console.error('🚨 DEBUG FAILED:', error);
      toast.error(`Debug failed: ${error.message}`);
    }
  };

  const testWithDifferentRoomTypes = async () => {
    if (!debugData?.patients?.length) {
      toast.error('Run main debug first');
      return;
    }

    const testPatient = debugData.patients[0];
    const roomTypes = ['GENERAL', 'PRIVATE', 'ICU', 'EMERGENCY'];
    const results: any[] = [];

    for (const roomType of roomTypes) {
      try {
        const testData = {
          patient_id: testPatient.id,
          bed_number: `TEST-${roomType}`,
          room_type: roomType,
          department: 'GENERAL',
          daily_rate: 1000,
          admission_date: new Date().toISOString(),
          status: 'ACTIVE',
          services: {},
          total_amount: 0,
          amount_paid: 0,
          balance_amount: 0,
          hospital_id: '550e8400-e29b-41d4-a716-446655440000'
        };

        const { data, error } = await supabase
          .from('patient_admissions')
          .insert([testData])
          .select();

        if (error) {
          results.push({
            roomType,
            success: false,
            error: error.message,
            code: error.code
          });
        } else {
          results.push({
            roomType,
            success: true
          });
          // Clean up
          if (data?.[0]) {
            await supabase.from('patient_admissions').delete().eq('id', data[0].id);
          }
        }
      } catch (error: any) {
        results.push({
          roomType,
          success: false,
          exception: error.message
        });
      }
    }

    setTestResult(results);
    console.log('🧪 Room type test results:', results);
  };

  const showSQLFix = () => {
    const sqlFix = `
-- EMERGENCY FIX based on your specific error
-- Run this in Supabase SQL Editor:

-- Check what the constraint actually expects:
SELECT conname, pg_get_constraintdef(oid) 
FROM pg_constraint 
WHERE conrelid = 'patient_admissions'::regclass 
AND conname LIKE '%room_type%';

-- Temporarily remove constraint to test:
ALTER TABLE patient_admissions DROP CONSTRAINT IF EXISTS patient_admissions_room_type_check;

-- Test admission without constraint:
INSERT INTO patient_admissions (
  patient_id, bed_number, room_type, department, daily_rate,
  admission_date, status, services, total_amount, amount_paid, 
  balance_amount, hospital_id
) 
SELECT 
  (SELECT id FROM patients LIMIT 1),
  'TEST-DEBUG',
  'GENERAL',
  'GENERAL', 
  1000,
  NOW(),
  'ACTIVE',
  '{}',
  0,
  0,
  0,
  '550e8400-e29b-41d4-a716-446655440000'
WHERE EXISTS (SELECT 1 FROM patients LIMIT 1);

-- Clean up test:
DELETE FROM patient_admissions WHERE bed_number = 'TEST-DEBUG';

-- Re-add constraint with correct values:
ALTER TABLE patient_admissions ADD CONSTRAINT patient_admissions_room_type_check 
CHECK (room_type IN ('GENERAL', 'PRIVATE', 'ICU', 'EMERGENCY'));
`;

    navigator.clipboard.writeText(sqlFix).then(() => {
      toast.success('Emergency SQL fix copied to clipboard!');
    });
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-red-600">🚨 Real-Time IPD Debugger</h1>
        <p className="text-gray-600">Debug the exact IPD admission that's failing</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <button
          onClick={debugRealIPDAdmission}
          className="bg-red-600 text-white px-4 py-3 rounded-lg hover:bg-red-700"
        >
          🚨 Debug Real Admission
        </button>

        <button
          onClick={testWithDifferentRoomTypes}
          disabled={!debugData}
          className="bg-blue-600 text-white px-4 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          🧪 Test Room Types
        </button>

        <button
          onClick={showSQLFix}
          className="bg-green-600 text-white px-4 py-3 rounded-lg hover:bg-green-700"
        >
          📋 Copy SQL Fix
        </button>
      </div>

      {/* Debug Results */}
      {debugData && (
        <div className="space-y-6">
          {/* Error Display */}
          {debugData.admissionError && (
            <div className="bg-red-50 p-6 rounded-lg border border-red-200">
              <h2 className="text-lg font-semibold text-red-800 mb-4">❌ Exact Error</h2>
              <div className="font-mono text-sm text-red-700 space-y-2">
                <div><strong>Message:</strong> {debugData.admissionError.message}</div>
                <div><strong>Code:</strong> {debugData.admissionError.code}</div>
                {debugData.admissionError.details && (
                  <div><strong>Details:</strong> {debugData.admissionError.details}</div>
                )}
              </div>
            </div>
          )}

          {/* Success Display */}
          {debugData.admissionSuccess && (
            <div className="bg-green-50 p-6 rounded-lg border border-green-200">
              <h2 className="text-lg font-semibold text-green-800 mb-4">✅ Success</h2>
              <p className="text-green-700">IPD admission worked! The issue might be intermittent.</p>
            </div>
          )}

          {/* Real Data Display */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-lg border">
              <h2 className="text-lg font-semibold mb-4">👥 Your Real Patients</h2>
              {debugData.patients?.length > 0 ? (
                <div className="space-y-2">
                  {debugData.patients.slice(0, 3).map((p: any, i: number) => (
                    <div key={i} className="p-2 bg-gray-50 rounded text-sm">
                      <div><strong>{p.first_name} {p.last_name}</strong></div>
                      <div>ID: {p.patient_id} | UUID: {p.id}</div>
                      <div>Gender: {p.gender}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-red-600">No patients found</div>
              )}
            </div>

            <div className="bg-white p-6 rounded-lg border">
              <h2 className="text-lg font-semibold mb-4">🛏️ Your Real Beds</h2>
              {debugData.beds?.length > 0 ? (
                <div className="space-y-2">
                  {debugData.beds.slice(0, 3).map((b: any, i: number) => (
                    <div key={i} className="p-2 bg-gray-50 rounded text-sm">
                      <div><strong>{b.bed_number}</strong></div>
                      <div>Room Type: {b.room_type}</div>
                      <div>Rate: ₹{b.daily_rate} | Status: {b.status}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-red-600">No beds found</div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Room Type Test Results */}
      {testResult && (
        <div className="mt-6 bg-white p-6 rounded-lg border">
          <h2 className="text-lg font-semibold mb-4">🧪 Room Type Test Results</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {testResult.map((result: any, index: number) => (
              <div
                key={index}
                className={`p-4 rounded border ${
                  result.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
                }`}
              >
                <div className="font-medium">{result.roomType}</div>
                <div className={`text-sm ${result.success ? 'text-green-600' : 'text-red-600'}`}>
                  {result.success ? '✅ SUCCESS' : '❌ FAILED'}
                </div>
                {result.error && (
                  <div className="text-xs text-red-500 mt-1">{result.error.substring(0, 30)}...</div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mt-6 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
        <h3 className="font-medium text-yellow-800 mb-2">🎯 This Will Show:</h3>
        <ul className="text-sm text-yellow-700 space-y-1">
          <li>• Your actual patient and bed data</li>
          <li>• The exact admission data being sent</li>
          <li>• The exact error message from Supabase</li>
          <li>• Which room types work vs fail</li>
          <li>• Emergency SQL fix for immediate resolution</li>
        </ul>
      </div>
    </div>
  );
};

export default RealTimeIPDDebugger;
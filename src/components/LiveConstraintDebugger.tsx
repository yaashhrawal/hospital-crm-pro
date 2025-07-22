import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { supabase } from '../config/supabaseNew';

const LiveConstraintDebugger: React.FC = () => {
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [realTimeTest, setRealTimeTest] = useState<any>(null);

  const debugConstraintNow = async () => {
    try {
      console.log('🚨 LIVE DEBUGGING: Checking your actual database right now...');
      
      const results: any = {
        timestamp: new Date().toISOString(),
        beds: [],
        constraint: null,
        liveTest: []
      };

      // 1. Get actual beds from your database
      const { data: beds, error: bedsError } = await supabase
        .from('beds')
        .select('*')
        .limit(5);

      if (bedsError) {
        console.error('❌ Beds error:', bedsError);
        results.bedsError = bedsError.message;
      } else {
        results.beds = beds;
        console.log('🛏️ Your actual beds:', beds);
      }

      // 2. Get actual patients
      const { data: patients, error: patientsError } = await supabase
        .from('patients')
        .select('id, patient_id, first_name, last_name')
        .eq('is_active', true)
        .limit(3);

      if (patientsError) {
        results.patientsError = patientsError.message;
      } else {
        results.patients = patients;
        console.log('👥 Your actual patients:', patients);
      }

      // 3. Test the EXACT data that would be sent in IPD admission
      if (beds && beds.length > 0 && patients && patients.length > 0) {
        const testBed = beds[0];
        const testPatient = patients[0];

        // This is EXACTLY what the frontend sends
        const exactAdmissionData = {
          patient_id: testPatient.id,
          bed_number: testBed.bed_number,
          room_type: testBed.room_type, // EXACT value from beds table
          department: testBed.department || 'GENERAL',
          daily_rate: testBed.daily_rate || 1000,
          admission_date: new Date().toISOString(),
          expected_discharge_date: null,
          admission_notes: null,
          services: {},
          total_amount: 0,
          amount_paid: 0,
          balance_amount: 0,
          status: 'ACTIVE',
          hospital_id: '550e8400-e29b-41d4-a716-446655440000'
        };

        console.log('📋 EXACT admission data being sent:', exactAdmissionData);
        results.exactData = exactAdmissionData;

        // Try the exact insertion that's failing
        try {
          const { data: admissionResult, error: admissionError } = await supabase
            .from('patient_admissions')
            .insert([exactAdmissionData])
            .select();

          if (admissionError) {
            console.error('❌ EXACT ERROR:', admissionError);
            results.exactError = admissionError.message;
            results.exactErrorCode = admissionError.code;
            results.exactErrorDetails = admissionError.details;
          } else {
            console.log('✅ SUCCESS with exact data:', admissionResult);
            results.exactSuccess = true;
            
            // Clean up
            if (admissionResult && admissionResult[0]) {
              await supabase.from('patient_admissions').delete().eq('id', admissionResult[0].id);
            }
          }
        } catch (error: any) {
          console.error('❌ Exception with exact data:', error);
          results.exactException = error.message;
        }

        // Also test with hardcoded known good values
        const hardcodedTest = {
          patient_id: testPatient.id,
          bed_number: 'DEBUG-001',
          room_type: 'GENERAL', // Hardcoded known value
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

        try {
          const { data: hardcodedResult, error: hardcodedError } = await supabase
            .from('patient_admissions')
            .insert([hardcodedTest])
            .select();

          if (hardcodedError) {
            console.error('❌ Hardcoded test failed:', hardcodedError);
            results.hardcodedError = hardcodedError.message;
          } else {
            console.log('✅ Hardcoded test SUCCESS:', hardcodedResult);
            results.hardcodedSuccess = true;
            
            // Clean up
            if (hardcodedResult && hardcodedResult[0]) {
              await supabase.from('patient_admissions').delete().eq('id', hardcodedResult[0].id);
            }
          }
        } catch (error: any) {
          results.hardcodedException = error.message;
        }
      }

      setDebugInfo(results);
      console.log('📊 COMPLETE DEBUG RESULTS:', results);

    } catch (error: any) {
      console.error('🚨 DEBUG FAILED:', error);
      toast.error(`Debug failed: ${error.message}`);
    }
  };

  const testIndividualRoomTypes = async () => {
    if (!debugInfo?.beds?.length) {
      toast.error('Run main debug first to get bed data');
      return;
    }

    const testPatientId = debugInfo.patients?.[0]?.id;
    if (!testPatientId) {
      toast.error('No test patient available');
      return;
    }

    const roomTypesToTest = ['GENERAL', 'PRIVATE', 'ICU', 'EMERGENCY'];
    const testResults: any[] = [];

    for (const roomType of roomTypesToTest) {
      try {
        const testData = {
          patient_id: testPatientId,
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
          testResults.push({
            roomType,
            success: false,
            error: error.message,
            errorCode: error.code
          });
          console.log(`❌ ${roomType}:`, error.message);
        } else {
          testResults.push({
            roomType,
            success: true,
            data: data[0]
          });
          console.log(`✅ ${roomType}: SUCCESS`);
          
          // Clean up
          if (data && data[0]) {
            await supabase.from('patient_admissions').delete().eq('id', data[0].id);
          }
        }
      } catch (error: any) {
        testResults.push({
          roomType,
          success: false,
          exception: error.message
        });
      }
    }

    setRealTimeTest(testResults);
    console.log('🧪 Room type test results:', testResults);
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-red-600">🚨 Live Constraint Debugger</h1>
        <p className="text-gray-600">Real-time debugging of your actual Supabase database right now</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <button
          onClick={debugConstraintNow}
          className="bg-red-600 text-white px-4 py-3 rounded-lg hover:bg-red-700"
        >
          🚨 Debug Database NOW
        </button>

        <button
          onClick={testIndividualRoomTypes}
          disabled={!debugInfo}
          className="bg-blue-600 text-white px-4 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          🧪 Test Room Types
        </button>
      </div>

      {/* Real-time debug results */}
      {debugInfo && (
        <div className="space-y-6">
          {/* Your Actual Beds */}
          <div className="bg-white p-6 rounded-lg border">
            <h2 className="text-lg font-semibold mb-4">🛏️ Your Actual Beds Right Now</h2>
            {debugInfo.beds?.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {debugInfo.beds.map((bed: any, index: number) => (
                  <div key={index} className="p-3 bg-gray-50 rounded">
                    <div className="font-mono text-sm">
                      <div><strong>Bed:</strong> {bed.bed_number}</div>
                      <div><strong>Room Type:</strong> "{bed.room_type}" ({typeof bed.room_type})</div>
                      <div><strong>Daily Rate:</strong> ₹{bed.daily_rate}</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-red-600">No beds found or error: {debugInfo.bedsError}</div>
            )}
          </div>

          {/* Exact Error */}
          <div className="bg-red-50 p-6 rounded-lg border border-red-200">
            <h2 className="text-lg font-semibold text-red-800 mb-4">❌ Exact Error with Your Data</h2>
            {debugInfo.exactError ? (
              <div className="space-y-2">
                <div className="font-mono text-sm text-red-700">
                  <strong>Error:</strong> {debugInfo.exactError}
                </div>
                {debugInfo.exactErrorCode && (
                  <div className="font-mono text-sm text-red-700">
                    <strong>Code:</strong> {debugInfo.exactErrorCode}
                  </div>
                )}
                <div className="mt-4 p-4 bg-white rounded border">
                  <strong>Exact Data Sent:</strong>
                  <pre className="text-xs mt-2 overflow-x-auto">
                    {JSON.stringify(debugInfo.exactData, null, 2)}
                  </pre>
                </div>
              </div>
            ) : debugInfo.exactSuccess ? (
              <div className="text-green-600 font-medium">✅ SUCCESS with your exact data!</div>
            ) : (
              <div className="text-gray-600">No test performed yet</div>
            )}
          </div>

          {/* Hardcoded Test */}
          <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
            <h2 className="text-lg font-semibold text-blue-800 mb-4">🧪 Hardcoded 'GENERAL' Test</h2>
            {debugInfo.hardcodedError ? (
              <div className="text-red-600 font-mono text-sm">{debugInfo.hardcodedError}</div>
            ) : debugInfo.hardcodedSuccess ? (
              <div className="text-green-600 font-medium">✅ SUCCESS with hardcoded 'GENERAL'</div>
            ) : (
              <div className="text-gray-600">No hardcoded test performed</div>
            )}
          </div>
        </div>
      )}

      {/* Room Type Test Results */}
      {realTimeTest && (
        <div className="mt-6 bg-white p-6 rounded-lg border">
          <h2 className="text-lg font-semibold mb-4">🧪 Individual Room Type Test Results</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {realTimeTest.map((result: any, index: number) => (
              <div
                key={index}
                className={`p-4 rounded border ${
                  result.success 
                    ? 'bg-green-50 border-green-200' 
                    : 'bg-red-50 border-red-200'
                }`}
              >
                <div className="font-medium">{result.roomType}</div>
                <div className={`text-sm ${result.success ? 'text-green-600' : 'text-red-600'}`}>
                  {result.success ? '✅ SUCCESS' : '❌ FAILED'}
                </div>
                {result.error && (
                  <div className="text-xs text-red-500 mt-1">{result.error.substring(0, 50)}...</div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mt-6 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
        <h3 className="font-medium text-yellow-800 mb-2">📋 Instructions:</h3>
        <ol className="text-sm text-yellow-700 space-y-1">
          <li>1. Click "Debug Database NOW" to see your actual data</li>
          <li>2. Check the exact error message and data being sent</li>
          <li>3. Click "Test Room Types" to see which values work</li>
          <li>4. Check browser console for complete debugging details</li>
        </ol>
      </div>
    </div>
  );
};

export default LiveConstraintDebugger;
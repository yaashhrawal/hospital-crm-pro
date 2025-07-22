import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { supabase } from '../config/supabaseNew';

const AppointmentsDebugger: React.FC = () => {
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const runDiagnostic = async () => {
    setLoading(true);
    const diagnosis: any = {
      timestamp: new Date().toISOString(),
      steps: []
    };

    try {
      // Step 1: Check if future_appointments table exists
      diagnosis.steps.push('🔍 Step 1: Checking if future_appointments table exists...');
      
      try {
        const { data: tableCheck, error: tableError } = await supabase
          .from('future_appointments')
          .select('id')
          .limit(1);
        
        if (tableError) {
          diagnosis.steps.push(`❌ Table check failed: ${tableError.message}`);
          diagnosis.tableExists = false;
          diagnosis.tableError = tableError;
        } else {
          diagnosis.steps.push('✅ future_appointments table exists');
          diagnosis.tableExists = true;
        }
      } catch (error: any) {
        diagnosis.steps.push(`❌ Table check exception: ${error.message}`);
        diagnosis.tableExists = false;
      }

      // Step 2: Count total records
      if (diagnosis.tableExists) {
        diagnosis.steps.push('🔍 Step 2: Counting appointments in table...');
        
        try {
          const { count, error: countError } = await supabase
            .from('future_appointments')
            .select('*', { count: 'exact', head: true });
          
          if (countError) {
            diagnosis.steps.push(`❌ Count failed: ${countError.message}`);
          } else {
            diagnosis.steps.push(`📊 Total appointments in table: ${count}`);
            diagnosis.totalCount = count;
          }
        } catch (error: any) {
          diagnosis.steps.push(`❌ Count exception: ${error.message}`);
        }
      }

      // Step 3: Try to fetch appointments with relationships
      if (diagnosis.tableExists) {
        diagnosis.steps.push('🔍 Step 3: Testing appointment fetch with relationships...');
        
        try {
          const { data: appointments, error: fetchError } = await supabase
            .from('future_appointments')
            .select(`
              *,
              patient:patients(*),
              doctor:users(*)
            `)
            .order('appointment_date', { ascending: true })
            .limit(5);
          
          if (fetchError) {
            diagnosis.steps.push(`❌ Fetch with relationships failed: ${fetchError.message}`);
            diagnosis.relationshipError = fetchError;
          } else {
            diagnosis.steps.push(`✅ Successfully fetched ${appointments?.length || 0} appointments with relationships`);
            diagnosis.sampleAppointments = appointments?.slice(0, 2); // Show first 2 for debugging
          }
        } catch (error: any) {
          diagnosis.steps.push(`❌ Fetch exception: ${error.message}`);
        }
      }

      // Step 4: Try simple fetch without relationships
      if (diagnosis.tableExists) {
        diagnosis.steps.push('🔍 Step 4: Testing simple appointment fetch...');
        
        try {
          const { data: simpleAppointments, error: simpleError } = await supabase
            .from('future_appointments')
            .select('*')
            .limit(5);
          
          if (simpleError) {
            diagnosis.steps.push(`❌ Simple fetch failed: ${simpleError.message}`);
          } else {
            diagnosis.steps.push(`✅ Simple fetch successful: ${simpleAppointments?.length || 0} appointments`);
            diagnosis.simpleAppointments = simpleAppointments?.slice(0, 2);
          }
        } catch (error: any) {
          diagnosis.steps.push(`❌ Simple fetch exception: ${error.message}`);
        }
      }

      // Step 5: Check patients table
      diagnosis.steps.push('🔍 Step 5: Checking patients table...');
      try {
        const { count: patientCount, error: patientError } = await supabase
          .from('patients')
          .select('*', { count: 'exact', head: true });
        
        if (patientError) {
          diagnosis.steps.push(`❌ Patients table check failed: ${patientError.message}`);
        } else {
          diagnosis.steps.push(`✅ Patients table has ${patientCount} records`);
          diagnosis.patientCount = patientCount;
        }
      } catch (error: any) {
        diagnosis.steps.push(`❌ Patients table exception: ${error.message}`);
      }

      // Step 6: Check users table  
      diagnosis.steps.push('🔍 Step 6: Checking users table...');
      try {
        const { count: userCount, error: userError } = await supabase
          .from('users')
          .select('*', { count: 'exact', head: true });
        
        if (userError) {
          diagnosis.steps.push(`❌ Users table check failed: ${userError.message}`);
        } else {
          diagnosis.steps.push(`✅ Users table has ${userCount} records`);
          diagnosis.userCount = userCount;
        }
      } catch (error: any) {
        diagnosis.steps.push(`❌ Users table exception: ${error.message}`);
      }

      diagnosis.steps.push('🏁 Diagnostic complete!');
      
    } catch (error: any) {
      diagnosis.steps.push(`🚨 Diagnostic failed: ${error.message}`);
      diagnosis.criticalError = error;
    }

    setDebugInfo(diagnosis);
    setLoading(false);
  };

  const createSampleAppointment = async () => {
    try {
      // Get first patient and user
      const { data: patients } = await supabase.from('patients').select('id').limit(1);
      const { data: users } = await supabase.from('users').select('id').limit(1);
      
      if (!patients?.length) {
        toast.error('No patients found. Please add a patient first.');
        return;
      }
      
      if (!users?.length) {
        toast.error('No users found. Please ensure you are logged in.');
        return;
      }

      const sampleAppointment = {
        patient_id: patients[0].id,
        doctor_id: users[0].id,
        appointment_date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Tomorrow
        appointment_time: '10:00:00',
        appointment_type: 'CONSULTATION',
        status: 'SCHEDULED',
        reason: 'Test appointment created by debugger',
        estimated_cost: 500,
        duration_minutes: 30
      };

      const { error } = await supabase
        .from('future_appointments')
        .insert([sampleAppointment]);

      if (error) {
        toast.error(`Failed to create sample appointment: ${error.message}`);
      } else {
        toast.success('Sample appointment created successfully!');
        await runDiagnostic(); // Refresh diagnostic
      }
    } catch (error: any) {
      toast.error(`Error creating sample appointment: ${error.message}`);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-red-600">🩺 Appointments Diagnostic Tool</h1>
        <p className="text-gray-600">Diagnose what's wrong with the appointments section</p>
      </div>

      <div className="flex gap-4 mb-6">
        <button
          onClick={runDiagnostic}
          disabled={loading}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? '🔄 Running Diagnostic...' : '🔍 Run Diagnostic'}
        </button>

        <button
          onClick={createSampleAppointment}
          disabled={loading}
          className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-50"
        >
          🧪 Create Test Appointment
        </button>
      </div>

      {debugInfo && (
        <div className="bg-white rounded-lg border p-6">
          <h2 className="text-lg font-semibold mb-4">📋 Diagnostic Results</h2>
          
          {/* Steps */}
          <div className="mb-6">
            <h3 className="font-medium mb-2">🔄 Process Steps:</h3>
            <div className="bg-gray-50 p-4 rounded max-h-60 overflow-y-auto">
              {debugInfo.steps.map((step: string, index: number) => (
                <div key={index} className="text-sm mb-1 font-mono">{step}</div>
              ))}
            </div>
          </div>

          {/* Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="bg-blue-50 p-3 rounded">
              <div className="font-medium text-blue-800">Table Status</div>
              <div className={debugInfo.tableExists ? 'text-green-600' : 'text-red-600'}>
                {debugInfo.tableExists ? '✅ Exists' : '❌ Missing'}
              </div>
            </div>
            
            <div className="bg-green-50 p-3 rounded">
              <div className="font-medium text-green-800">Total Appointments</div>
              <div className="text-green-600">
                {debugInfo.totalCount !== undefined ? debugInfo.totalCount : 'Unknown'}
              </div>
            </div>
            
            <div className="bg-purple-50 p-3 rounded">
              <div className="font-medium text-purple-800">Related Data</div>
              <div className="text-purple-600 text-sm">
                Patients: {debugInfo.patientCount || 0}<br/>
                Users: {debugInfo.userCount || 0}
              </div>
            </div>
          </div>

          {/* Sample Data */}
          {debugInfo.sampleAppointments && debugInfo.sampleAppointments.length > 0 && (
            <div className="mb-4">
              <h3 className="font-medium mb-2">📄 Sample Appointments:</h3>
              <div className="bg-gray-50 p-4 rounded text-sm">
                <pre>{JSON.stringify(debugInfo.sampleAppointments, null, 2)}</pre>
              </div>
            </div>
          )}

          {/* Errors */}
          {(debugInfo.tableError || debugInfo.relationshipError || debugInfo.criticalError) && (
            <div className="mb-4">
              <h3 className="font-medium mb-2 text-red-600">❌ Errors Found:</h3>
              <div className="bg-red-50 p-4 rounded text-sm text-red-800">
                {debugInfo.tableError && (
                  <div className="mb-2">
                    <strong>Table Error:</strong> {debugInfo.tableError.message}
                  </div>
                )}
                {debugInfo.relationshipError && (
                  <div className="mb-2">
                    <strong>Relationship Error:</strong> {debugInfo.relationshipError.message}
                  </div>
                )}
                {debugInfo.criticalError && (
                  <div className="mb-2">
                    <strong>Critical Error:</strong> {debugInfo.criticalError.message}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      <div className="mt-6 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
        <h3 className="font-medium text-yellow-800 mb-2">💡 Next Steps:</h3>
        <ol className="text-sm text-yellow-700 space-y-1">
          <li>1. Click "Run Diagnostic" to identify the issue</li>
          <li>2. If table is missing, run the CREATE_APPOINTMENTS_TABLE.sql script in Supabase</li>
          <li>3. If table exists but has no data, click "Create Test Appointment"</li>
          <li>4. Check the results and errors for specific fixes needed</li>
        </ol>
      </div>
    </div>
  );
};

export default AppointmentsDebugger;
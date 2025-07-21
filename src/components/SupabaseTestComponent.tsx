import React, { useState, useEffect } from 'react';
import { supabase } from '../config/supabase';
import dataService from '../services/dataService';

const SupabaseTestComponent: React.FC = () => {
  const [connectionStatus, setConnectionStatus] = useState<string>('Testing...');
  const [patients, setPatients] = useState<any[]>([]);
  const [authUser, setAuthUser] = useState<any>(null);
  const [testResults, setTestResults] = useState<string[]>([]);

  const addResult = (message: string) => {
    setTestResults(prev => [...prev, `${new Date().toISOString()}: ${message}`]);
    console.log(message);
  };

  useEffect(() => {
    runTests();
  }, []);

  const runTests = async () => {
    addResult('🧪 Starting Supabase tests...');

    // Test 1: Basic connection
    try {
      addResult('📡 Testing basic connection...');
      const { data, error } = await supabase.from('users').select('count').limit(1);
      
      if (error) {
        addResult(`❌ Connection failed: ${error.message}`);
        setConnectionStatus('Failed');
        return;
      }
      
      addResult('✅ Basic connection successful');
      setConnectionStatus('Connected');
    } catch (err: any) {
      addResult(`🚨 Connection exception: ${err.message}`);
      setConnectionStatus('Error');
      return;
    }

    // Test 2: Authentication
    try {
      addResult('🔐 Checking authentication...');
      const { data: { user }, error } = await supabase.auth.getUser();
      
      if (error) {
        addResult(`❌ Auth check failed: ${error.message}`);
      } else if (user) {
        addResult(`✅ User authenticated: ${user.email}`);
        setAuthUser(user);
      } else {
        addResult('⚠️ No authenticated user found');
      }
    } catch (err: any) {
      addResult(`🚨 Auth exception: ${err.message}`);
    }

    // Test 3: Patient data retrieval via dataService
    try {
      addResult('👥 Testing patient retrieval via dataService...');
      const patientsData = await dataService.getPatients();
      
      addResult(`✅ Patients retrieved: ${patientsData.length} records`);
      setPatients(patientsData);
      
      if (patientsData.length > 0) {
        addResult(`Sample patient: ${patientsData[0].first_name} ${patientsData[0].last_name}`);
      }
    } catch (err: any) {
      addResult(`❌ Patient retrieval failed: ${err.message}`);
    }

    // Test 4: Direct Supabase patient query
    try {
      addResult('🔍 Testing direct Supabase patient query...');
      const { data: directPatients, error } = await supabase
        .from('patients')
        .select('*')
        .limit(10);
      
      if (error) {
        addResult(`❌ Direct query failed: ${error.message}`);
        addResult(`Error details: ${JSON.stringify(error)}`);
      } else {
        addResult(`✅ Direct query successful: ${directPatients?.length || 0} records`);
      }
    } catch (err: any) {
      addResult(`🚨 Direct query exception: ${err.message}`);
    }

    // Test 5: Test table access
    const tables = ['patients', 'patient_transactions', 'daily_expenses', 'users', 'doctors', 'departments'];
    
    for (const table of tables) {
      try {
        addResult(`📋 Testing table '${table}'...`);
        const { data, error } = await supabase
          .from(table)
          .select('*')
          .limit(1);
        
        if (error) {
          addResult(`❌ Table '${table}' error: ${error.message}`);
        } else {
          addResult(`✅ Table '${table}' accessible (${data?.length || 0} records)`);
        }
      } catch (err: any) {
        addResult(`🚨 Table '${table}' exception: ${err.message}`);
      }
    }

    addResult('🏁 Tests completed');
  };

  const testCreatePatient = async () => {
    try {
      addResult('🧪 Testing patient creation...');
      
      const testPatient = {
        first_name: 'Test',
        last_name: 'Patient',
        phone: '9999999999',
        address: 'Test Address',
        gender: 'MALE' as const,
        date_of_birth: '1990-01-01',
        emergency_contact_name: 'Emergency Contact',
        emergency_contact_phone: '8888888888',
        is_active: true,
        created_by: authUser?.id || 'test-user'
      };

      const newPatient = await dataService.createPatient(testPatient);
      addResult(`✅ Test patient created successfully: ${newPatient.id}`);
      
      // Refresh patients list
      const updatedPatients = await dataService.getPatients();
      setPatients(updatedPatients);
      addResult(`📊 Updated patient count: ${updatedPatients.length}`);
      
    } catch (err: any) {
      addResult(`❌ Patient creation failed: ${err.message}`);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white shadow-lg rounded-lg">
      <h2 className="text-2xl font-bold mb-4">Supabase Connection Test</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Status Panel */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="text-lg font-semibold mb-2">Connection Status</h3>
          <div className={`p-2 rounded ${
            connectionStatus === 'Connected' ? 'bg-green-100 text-green-800' :
            connectionStatus === 'Failed' ? 'bg-red-100 text-red-800' :
            'bg-yellow-100 text-yellow-800'
          }`}>
            {connectionStatus}
          </div>
          
          {authUser && (
            <div className="mt-2 p-2 bg-blue-100 text-blue-800 rounded">
              Authenticated as: {authUser.email}
            </div>
          )}
        </div>

        {/* Patients Panel */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="text-lg font-semibold mb-2">Patients Data</h3>
          <div className="mb-2">
            <strong>Total Patients:</strong> {patients.length}
          </div>
          
          <button
            onClick={testCreatePatient}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            disabled={connectionStatus !== 'Connected'}
          >
            Test Create Patient
          </button>
          
          {patients.length > 0 && (
            <div className="mt-2 text-sm">
              <strong>Latest:</strong> {patients[0]?.first_name} {patients[0]?.last_name}
            </div>
          )}
        </div>
      </div>

      {/* Test Results Log */}
      <div className="mt-6">
        <h3 className="text-lg font-semibold mb-2">Test Results Log</h3>
        <div className="bg-black text-green-400 p-4 rounded-lg max-h-96 overflow-y-auto font-mono text-sm">
          {testResults.map((result, index) => (
            <div key={index}>{result}</div>
          ))}
        </div>
      </div>

      {/* Refresh Button */}
      <div className="mt-4">
        <button
          onClick={runTests}
          className="px-6 py-2 bg-green-500 text-white rounded hover:bg-green-600"
        >
          Re-run Tests
        </button>
      </div>
    </div>
  );
};

export default SupabaseTestComponent;
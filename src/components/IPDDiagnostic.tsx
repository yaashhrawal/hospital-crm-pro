import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { supabase } from '../config/supabaseNew';
import HospitalService from '../services/hospitalService';

const IPDDiagnostic: React.FC = () => {
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const addResult = (test: string, status: 'success' | 'error', details: any) => {
    setResults(prev => [...prev, { test, status, details, timestamp: new Date().toISOString() }]);
  };

  const runDiagnostics = async () => {
    setLoading(true);
    setResults([]);

    try {
      // Test 1: Check database connection
      addResult('Database Connection', 'success', 'Testing Supabase connection...');
      
      // Test 2: Check if patient_admissions table exists
      try {
        const { data: tableCheck, error: tableError } = await supabase
          .from('patient_admissions')
          .select('*')
          .limit(1);
        
        if (tableError) {
          addResult('Table Existence', 'error', `patient_admissions table error: ${tableError.message}`);
        } else {
          addResult('Table Existence', 'success', 'patient_admissions table exists');
        }
      } catch (error: any) {
        addResult('Table Existence', 'error', `Table check failed: ${error.message}`);
      }

      // Test 3: Check table structure
      try {
        const { data: schemaData, error: schemaError } = await supabase
          .rpc('get_table_columns', { table_name: 'patient_admissions' })
          .single();
        
        if (schemaError) {
          addResult('Table Schema', 'error', `Schema check failed: ${schemaError.message}`);
        } else {
          addResult('Table Schema', 'success', schemaData);
        }
      } catch (error: any) {
        addResult('Table Schema', 'error', `Schema RPC failed: ${error.message}`);
      }

      // Test 4: Check current user authentication
      try {
        const currentUser = await HospitalService.getCurrentUser();
        if (currentUser) {
          addResult('Authentication', 'success', `User authenticated: ${currentUser.email}`);
        } else {
          addResult('Authentication', 'error', 'No user authenticated');
        }
      } catch (error: any) {
        addResult('Authentication', 'error', `Auth check failed: ${error.message}`);
      }

      // Test 5: Test basic insert with minimal data
      try {
        const testData = {
          patient_id: 'test-uuid-123',  // This will fail due to foreign key, but we'll see the exact error
          bed_number: 'TEST-01',
          room_type: 'general',
          department: 'Test Department',
          daily_rate: 100,
          admission_date: new Date().toISOString().split('T')[0],
          status: 'active',
          total_amount: 0
        };

        const { data: insertData, error: insertError } = await supabase
          .from('patient_admissions')
          .insert([testData])
          .select();

        if (insertError) {
          addResult('Basic Insert Test', 'error', `Insert failed: ${insertError.message} | Code: ${insertError.code} | Details: ${insertError.details}`);
        } else {
          addResult('Basic Insert Test', 'success', 'Insert succeeded (unexpected)');
          // Clean up test data
          if (insertData && insertData[0]) {
            await supabase.from('patient_admissions').delete().eq('id', insertData[0].id);
          }
        }
      } catch (error: any) {
        addResult('Basic Insert Test', 'error', `Insert exception: ${error.message}`);
      }

      // Test 6: Check patients table for valid patient IDs
      try {
        const { data: patientsData, error: patientsError } = await supabase
          .from('patients')
          .select('id, first_name, last_name')
          .limit(5);

        if (patientsError) {
          addResult('Patients Check', 'error', `Patients table error: ${patientsError.message}`);
        } else {
          addResult('Patients Check', 'success', `Found ${patientsData?.length || 0} patients`);
          if (patientsData && patientsData.length > 0) {
            addResult('Sample Patient', 'success', patientsData[0]);
          }
        }
      } catch (error: any) {
        addResult('Patients Check', 'error', `Patients check failed: ${error.message}`);
      }

      // Test 7: Check RLS policies
      try {
        const { data: rlsData, error: rlsError } = await supabase
          .from('patient_admissions')
          .select('*')
          .limit(1);

        if (rlsError) {
          addResult('RLS Check', 'error', `RLS error: ${rlsError.message}`);
        } else {
          addResult('RLS Check', 'success', 'RLS allows SELECT operations');
        }
      } catch (error: any) {
        addResult('RLS Check', 'error', `RLS check failed: ${error.message}`);
      }

    } catch (error: any) {
      addResult('General Error', 'error', `Diagnostic failed: ${error.message}`);
    }

    setLoading(false);
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800">🔍 IPD Diagnostic Tool</h1>
        <p className="text-gray-600">Run comprehensive diagnostics to identify IPD admission issues</p>
      </div>

      <div className="mb-6">
        <button
          onClick={runDiagnostics}
          disabled={loading}
          className="bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? (
            <div className="flex items-center">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Running Diagnostics...
            </div>
          ) : (
            '🔍 Run IPD Diagnostics'
          )}
        </button>
      </div>

      {results.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
          <div className="p-4 bg-gray-50 border-b">
            <h2 className="text-lg font-semibold">Diagnostic Results</h2>
          </div>
          <div className="p-4 space-y-4 max-h-96 overflow-y-auto">
            {results.map((result, index) => (
              <div key={index} className={`p-3 rounded border-l-4 ${
                result.status === 'success' 
                  ? 'bg-green-50 border-green-500' 
                  : 'bg-red-50 border-red-500'
              }`}>
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <span className={result.status === 'success' ? 'text-green-600' : 'text-red-600'}>
                        {result.status === 'success' ? '✅' : '❌'}
                      </span>
                      <span className="font-medium">{result.test}</span>
                    </div>
                    <div className="mt-2 text-sm text-gray-700">
                      <pre className="whitespace-pre-wrap font-mono text-xs bg-gray-100 p-2 rounded">
                        {typeof result.details === 'object' 
                          ? JSON.stringify(result.details, null, 2)
                          : result.details
                        }
                      </pre>
                    </div>
                  </div>
                  <div className="text-xs text-gray-500 ml-4">
                    {new Date(result.timestamp).toLocaleTimeString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {results.length > 0 && (
        <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <h3 className="font-medium text-blue-800 mb-2">Next Steps:</h3>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• Review the error messages above to identify the root cause</li>
            <li>• Check if the database schema matches the expected structure</li>
            <li>• Verify that RLS policies allow INSERT operations</li>
            <li>• Ensure valid patient IDs are being used for foreign key references</li>
          </ul>
        </div>
      )}
    </div>
  );
};

export default IPDDiagnostic;
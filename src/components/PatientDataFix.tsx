import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { supabase } from '../config/supabase';

const PatientDataFix: React.FC = () => {
  const [testResults, setTestResults] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const addResult = (message: string) => {
    setTestResults(prev => [...prev, `${new Date().toISOString()}: ${message}`]);
    console.log(message);
  };

  const createTestPatient = async () => {
    try {
      setLoading(true);
      addResult('🧪 Testing patient creation with minimal data...');

      // Test with minimal required fields only
      const minimalPatientData = {
        first_name: 'Test',
        last_name: 'Patient',
        phone: '9999999999',
        address: 'Test Address',
        gender: 'MALE',
        is_active: true,
      };

      addResult(`📤 Sending minimal patient data: ${JSON.stringify(minimalPatientData, null, 2)}`);

      const { data, error } = await supabase
        .from('patients')
        .insert([minimalPatientData])
        .select()
        .single();

      if (error) {
        addResult(`❌ Patient creation failed: ${error.message}`);
        addResult(`🔍 Error details: ${JSON.stringify(error, null, 2)}`);
        
        // Try to get table structure
        addResult('🔍 Attempting to get table structure...');
        const { data: tableData, error: tableError } = await supabase
          .from('patients')
          .select('*')
          .limit(1);
        
        if (tableError) {
          addResult(`❌ Cannot access patients table: ${tableError.message}`);
        } else {
          addResult(`✅ Table accessible, sample structure: ${JSON.stringify(tableData, null, 2)}`);
        }
      } else {
        addResult(`✅ Patient created successfully: ${JSON.stringify(data, null, 2)}`);
        toast.success('Test patient created successfully!');
      }
    } catch (error: any) {
      addResult(`🚨 Exception during patient creation: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const testTableAccess = async () => {
    try {
      setLoading(true);
      addResult('🔍 Testing table access and structure...');

      // Test basic table access
      const { data, error } = await supabase
        .from('patients')
        .select('*')
        .limit(3);

      if (error) {
        addResult(`❌ Table access failed: ${error.message}`);
        addResult(`🔍 Error code: ${error.code}`);
        addResult(`🔍 Error hint: ${error.hint}`);
      } else {
        addResult(`✅ Table accessible with ${data?.length || 0} records`);
        if (data && data.length > 0) {
          addResult(`📋 Sample record structure: ${JSON.stringify(data[0], null, 2)}`);
        }
      }

      // Test user authentication
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError) {
        addResult(`❌ Auth check failed: ${authError.message}`);
      } else if (user) {
        addResult(`✅ User authenticated: ${user.email}`);
      } else {
        addResult(`⚠️ No authenticated user found`);
      }

    } catch (error: any) {
      addResult(`🚨 Exception during table test: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const fixRLSPolicies = async () => {
    try {
      setLoading(true);
      addResult('🔧 Attempting to create RLS policies...');

      const policies = [
        `CREATE POLICY "Allow authenticated reads on patients" ON patients FOR SELECT USING (auth.role() = 'authenticated');`,
        `CREATE POLICY "Allow authenticated inserts on patients" ON patients FOR INSERT WITH CHECK (auth.role() = 'authenticated');`,
        `CREATE POLICY "Allow authenticated updates on patients" ON patients FOR UPDATE USING (auth.role() = 'authenticated');`,
      ];

      for (const policy of policies) {
        try {
          const { error } = await supabase.rpc('exec_sql', { sql: policy });
          if (error) {
            addResult(`❌ Policy creation failed: ${error.message}`);
          } else {
            addResult(`✅ Policy created successfully`);
          }
        } catch (error: any) {
          addResult(`⚠️ Policy might already exist: ${error.message}`);
        }
      }

      addResult('📋 RLS policy creation attempted. Check Supabase dashboard for verification.');
      
    } catch (error: any) {
      addResult(`🚨 Exception during RLS setup: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const clearResults = () => {
    setTestResults([]);
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">🔧 Patient Data Troubleshooting</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <button
          onClick={testTableAccess}
          disabled={loading}
          className="bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50"
        >
          🔍 Test Table Access
        </button>
        
        <button
          onClick={createTestPatient}
          disabled={loading}
          className="bg-green-600 text-white py-3 px-4 rounded-md hover:bg-green-700 disabled:opacity-50"
        >
          🧪 Test Patient Creation
        </button>
        
        <button
          onClick={fixRLSPolicies}
          disabled={loading}
          className="bg-purple-600 text-white py-3 px-4 rounded-md hover:bg-purple-700 disabled:opacity-50"
        >
          🔧 Fix RLS Policies
        </button>
        
        <button
          onClick={clearResults}
          disabled={loading}
          className="bg-gray-600 text-white py-3 px-4 rounded-md hover:bg-gray-700 disabled:opacity-50"
        >
          🗑️ Clear Results
        </button>
      </div>

      {/* Test Results */}
      <div className="bg-black text-green-400 p-4 rounded-lg max-h-96 overflow-y-auto font-mono text-sm">
        <div className="mb-2 text-white">Troubleshooting Results:</div>
        {testResults.length === 0 ? (
          <div className="text-gray-400">Click a button above to start testing...</div>
        ) : (
          testResults.map((result, index) => (
            <div key={index} className="mb-1">{result}</div>
          ))
        )}
      </div>

      {/* Help Instructions */}
      <div className="mt-6 p-4 bg-blue-100 rounded-lg">
        <h4 className="font-semibold text-blue-800 mb-2">💡 Troubleshooting Steps:</h4>
        <ol className="text-blue-700 text-sm space-y-1 list-decimal list-inside">
          <li><strong>Test Table Access:</strong> Check if you can read from the patients table</li>
          <li><strong>Test Patient Creation:</strong> Try creating a minimal patient record</li>
          <li><strong>Fix RLS Policies:</strong> Attempt to create missing Row Level Security policies</li>
          <li><strong>Manual Fix:</strong> If automatic fix fails, go to Supabase SQL Editor and run:
            <pre className="mt-2 p-2 bg-blue-200 rounded text-xs">
{`CREATE POLICY "Allow authenticated reads on patients" 
ON patients FOR SELECT 
USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated inserts on patients" 
ON patients FOR INSERT 
WITH CHECK (auth.role() = 'authenticated');`}
            </pre>
          </li>
        </ol>
      </div>
    </div>
  );
};

export default PatientDataFix;
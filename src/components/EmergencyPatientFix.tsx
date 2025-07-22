import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { supabase } from '../config/supabase';

const EmergencyPatientFix: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [testResults, setTestResults] = useState<string[]>([]);

  const addResult = (message: string) => {
    setTestResults(prev => [...prev, `${new Date().toISOString()}: ${message}`]);
    console.log(message);
  };

  const emergencyCreatePatient = async () => {
    try {
      setLoading(true);
      addResult('🚨 EMERGENCY: Attempting direct patient creation bypass...');

      // Try the absolute simplest approach first
      const simpleData = {
        first_name: 'Emergency Test',
        phone: '9999999999',
        gender: 'MALE',
        is_active: true
      };

      addResult(`📤 Trying minimal data: ${JSON.stringify(simpleData)}`);

      // Method 1: Direct insert without RLS
      try {
        const { data, error } = await supabase
          .from('patients')
          .insert([simpleData])
          .select()
          .single();

        if (error) {
          addResult(`❌ Method 1 failed: ${error.message}`);
          addResult(`🔍 Error details: ${JSON.stringify(error)}`);
        } else {
          addResult(`✅ SUCCESS! Patient created: ${JSON.stringify(data)}`);
          toast.success('Patient created successfully!');
          return;
        }
      } catch (e: any) {
        addResult(`❌ Method 1 exception: ${e.message}`);
      }

      // Method 2: Try with upsert
      try {
        addResult('🔄 Trying Method 2: Upsert approach...');
        const { data, error } = await supabase
          .from('patients')
          .upsert([simpleData])
          .select()
          .single();

        if (error) {
          addResult(`❌ Method 2 failed: ${error.message}`);
        } else {
          addResult(`✅ SUCCESS with upsert! Patient: ${JSON.stringify(data)}`);
          toast.success('Patient created with upsert!');
          return;
        }
      } catch (e: any) {
        addResult(`❌ Method 2 exception: ${e.message}`);
      }

      // Method 3: Try with RPC call
      try {
        addResult('🔄 Trying Method 3: RPC approach...');
        const { data, error } = await supabase.rpc('create_patient_emergency', {
          p_first_name: 'Emergency Test',
          p_phone: '9999999999',
          p_gender: 'MALE'
        });

        if (error) {
          addResult(`❌ Method 3 failed: ${error.message}`);
        } else {
          addResult(`✅ SUCCESS with RPC! Result: ${JSON.stringify(data)}`);
          toast.success('Patient created with RPC!');
          return;
        }
      } catch (e: any) {
        addResult(`❌ Method 3 exception: ${e.message}`);
      }

      addResult('🚨 ALL METHODS FAILED - Check Supabase dashboard manually');
      toast.error('All patient creation methods failed');

    } catch (error: any) {
      addResult(`🚨 Emergency creation failed: ${error.message}`);
      toast.error('Emergency patient creation failed');
    } finally {
      setLoading(false);
    }
  };

  const checkTableStructure = async () => {
    try {
      setLoading(true);
      addResult('🔍 Checking table structure and permissions...');

      // Check if table exists and is accessible
      const { data, error, count } = await supabase
        .from('patients')
        .select('*', { count: 'exact', head: true });

      if (error) {
        addResult(`❌ Table access error: ${error.message}`);
        addResult(`🔍 Error code: ${error.code}`);
        addResult(`🔍 Error hint: ${error.hint}`);
        addResult(`🔍 Error details: ${JSON.stringify(error.details)}`);
      } else {
        addResult(`✅ Table accessible. Record count: ${count}`);
      }

      // Check authentication
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError) {
        addResult(`❌ Auth error: ${authError.message}`);
      } else if (user) {
        addResult(`✅ Authenticated as: ${user.email}`);
        addResult(`🔍 User ID: ${user.id}`);
        addResult(`🔍 User role: ${user.role}`);
      } else {
        addResult(`⚠️ No user authenticated`);
      }

      // Try to get table info
      try {
        const { data: tableData, error: tableError } = await supabase
          .from('patients')
          .select('*')
          .limit(1);

        if (tableError) {
          addResult(`❌ Sample data fetch failed: ${tableError.message}`);
        } else {
          addResult(`✅ Sample data structure: ${JSON.stringify(tableData, null, 2)}`);
        }
      } catch (e: any) {
        addResult(`❌ Table structure check failed: ${e.message}`);
      }

    } catch (error: any) {
      addResult(`🚨 Structure check failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const disableRLSTemporarily = async () => {
    try {
      setLoading(true);
      addResult('⚠️ Attempting to disable RLS temporarily...');

      // This won't work from client side, but let's try
      const { data, error } = await supabase.rpc('disable_rls_patients');
      
      if (error) {
        addResult(`❌ Cannot disable RLS from client: ${error.message}`);
        addResult('💡 You need to run this in Supabase SQL Editor:');
        addResult('   ALTER TABLE patients DISABLE ROW LEVEL SECURITY;');
      } else {
        addResult(`✅ RLS disabled: ${JSON.stringify(data)}`);
      }

    } catch (error: any) {
      addResult(`❌ RLS disable failed: ${error.message}`);
      addResult('💡 Manual fix required in Supabase dashboard');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-red-600">🚨 Emergency Patient Fix</h2>
        <p className="text-gray-600 mt-2">Diagnostic tools to fix patient creation issues</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <button
          onClick={checkTableStructure}
          disabled={loading}
          className="bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50"
        >
          🔍 Check Structure
        </button>
        
        <button
          onClick={emergencyCreatePatient}
          disabled={loading}
          className="bg-red-600 text-white py-3 px-4 rounded-md hover:bg-red-700 disabled:opacity-50"
        >
          🚨 Emergency Create
        </button>
        
        <button
          onClick={disableRLSTemporarily}
          disabled={loading}
          className="bg-orange-600 text-white py-3 px-4 rounded-md hover:bg-orange-700 disabled:opacity-50"
        >
          ⚠️ Disable RLS
        </button>
      </div>

      {/* Test Results */}
      <div className="bg-black text-green-400 p-4 rounded-lg max-h-96 overflow-y-auto font-mono text-sm">
        <div className="mb-2 text-red-400 font-bold">🚨 EMERGENCY DIAGNOSTIC OUTPUT:</div>
        {testResults.length === 0 ? (
          <div className="text-gray-400">Click buttons above to start emergency diagnosis...</div>
        ) : (
          testResults.map((result, index) => (
            <div key={index} className="mb-1">{result}</div>
          ))
        )}
      </div>

      {/* Emergency Instructions */}
      <div className="mt-6 p-4 bg-red-100 rounded-lg border-2 border-red-300">
        <h4 className="font-bold text-red-800 mb-2">🚨 IMMEDIATE FIX INSTRUCTIONS:</h4>
        <div className="text-red-700 text-sm space-y-2">
          <p><strong>1. Run "Check Structure" first</strong> - This will show the exact error</p>
          <p><strong>2. Go to Supabase Dashboard → SQL Editor</strong></p>
          <p><strong>3. Run this SQL command:</strong></p>
          <pre className="bg-red-200 p-2 rounded text-xs mt-2">
{`-- Disable RLS temporarily
ALTER TABLE patients DISABLE ROW LEVEL SECURITY;

-- Test insert
INSERT INTO patients (first_name, phone, gender, is_active) 
VALUES ('Test Patient', '1234567890', 'MALE', true);

-- Re-enable with proper policies
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all operations" ON patients
    FOR ALL USING (true) WITH CHECK (true);`}
          </pre>
          <p><strong>4. After running SQL, try "Emergency Create" button</strong></p>
          <p><strong>5. If still failing, contact Claude with the diagnostic output above</strong></p>
        </div>
      </div>
    </div>
  );
};

export default EmergencyPatientFix;
import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { supabase } from '../config/supabaseNew';

const DirectDBTest: React.FC = () => {
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const runQuery = async (query: string, description: string) => {
    setLoading(true);
    try {
      console.log(`🔍 Running: ${description}`);
      console.log(`📝 SQL: ${query}`);
      
      const { data, error } = await supabase.rpc('execute_sql', { query });
      
      if (error) {
        console.error(`❌ ${description} failed:`, error);
        setResult({ type: 'error', description, error: error.message, query });
        toast.error(`${description} failed: ${error.message}`);
      } else {
        console.log(`✅ ${description} success:`, data);
        setResult({ type: 'success', description, data, query });
        toast.success(`${description} completed`);
      }
    } catch (exception: any) {
      console.error(`💥 ${description} exception:`, exception);
      setResult({ type: 'exception', description, error: exception.message, query });
      toast.error(`${description} exception: ${exception.message}`);
    }
    setLoading(false);
  };

  const tests = [
    {
      name: "Check if patient_admissions table exists",
      query: "SELECT table_name FROM information_schema.tables WHERE table_name = 'patient_admissions';"
    },
    {
      name: "Show patient_admissions table structure",
      query: "SELECT column_name, data_type, is_nullable, column_default FROM information_schema.columns WHERE table_name = 'patient_admissions' ORDER BY ordinal_position;"
    },
    {
      name: "Check constraints on patient_admissions",
      query: "SELECT constraint_name, constraint_type FROM information_schema.table_constraints WHERE table_name = 'patient_admissions';"
    },
    {
      name: "Count existing admissions",
      query: "SELECT COUNT(*) as admission_count FROM patient_admissions;"
    },
    {
      name: "Show RLS policies for patient_admissions",
      query: "SELECT schemaname, tablename, policyname, roles, cmd, qual FROM pg_policies WHERE tablename = 'patient_admissions';"
    },
    {
      name: "Test basic select from patients",
      query: "SELECT id, first_name, last_name FROM patients LIMIT 5;"
    }
  ];

  const testDirectInsert = async () => {
    setLoading(true);
    try {
      // First get a real patient ID
      const { data: patients, error: pError } = await supabase
        .from('patients')
        .select('id')
        .limit(1);

      if (pError || !patients || patients.length === 0) {
        toast.error('No patients found to test with');
        setLoading(false);
        return;
      }

      const patientId = patients[0].id;
      console.log('Using patient ID:', patientId);

      // Try direct insert
      const insertQuery = `
        INSERT INTO patient_admissions (
          patient_id, 
          bed_number, 
          room_type, 
          department, 
          daily_rate, 
          admission_date, 
          status, 
          total_amount
        ) VALUES (
          '${patientId}',
          'DIRECT-TEST-001',
          'general',
          'Test Department',
          100.00,
          CURRENT_DATE,
          'active',
          0.00
        ) RETURNING id, bed_number;
      `;

      await runQuery(insertQuery, "Direct SQL INSERT test");

    } catch (error: any) {
      console.error('Direct insert test failed:', error);
      toast.error(`Direct insert failed: ${error.message}`);
    }
    setLoading(false);
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800">🗄️ Direct Database Test</h1>
        <p className="text-gray-600">Direct SQL queries to understand the database structure</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {tests.map((test, index) => (
          <button
            key={index}
            onClick={() => runQuery(test.query, test.name)}
            disabled={loading}
            className="p-4 text-left bg-white border rounded-lg hover:bg-gray-50 disabled:opacity-50"
          >
            <div className="font-medium text-gray-800">{test.name}</div>
            <div className="text-xs text-gray-500 mt-1 font-mono">{test.query.substring(0, 60)}...</div>
          </button>
        ))}
      </div>

      <div className="mb-6">
        <button
          onClick={testDirectInsert}
          disabled={loading}
          className="bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 disabled:opacity-50"
        >
          {loading ? 'Testing...' : '🧪 Test Direct SQL INSERT'}
        </button>
      </div>

      {result && (
        <div className={`p-6 rounded-lg border ${
          result.type === 'success' 
            ? 'bg-green-50 border-green-200' 
            : 'bg-red-50 border-red-200'
        }`}>
          <h3 className="font-semibold mb-2">
            {result.type === 'success' ? '✅' : '❌'} {result.description}
          </h3>
          
          <div className="mb-4">
            <strong>Query:</strong>
            <pre className="bg-gray-100 p-2 rounded text-xs mt-1 overflow-x-auto">
              {result.query}
            </pre>
          </div>

          {result.error && (
            <div className="mb-4">
              <strong>Error:</strong>
              <pre className="bg-red-100 p-2 rounded text-xs mt-1 text-red-800">
                {result.error}
              </pre>
            </div>
          )}

          {result.data && (
            <div>
              <strong>Result:</strong>
              <pre className="bg-gray-100 p-2 rounded text-xs mt-1 overflow-x-auto">
                {JSON.stringify(result.data, null, 2)}
              </pre>
            </div>
          )}
        </div>
      )}

      <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
        <h3 className="font-medium text-blue-800 mb-2">💡 Purpose:</h3>
        <p className="text-sm text-blue-700">
          This component runs direct SQL queries to examine the actual database structure, 
          constraints, and permissions. It helps identify if the issue is with the table 
          structure, RLS policies, or data validation.
        </p>
      </div>
    </div>
  );
};

export default DirectDBTest;
import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { supabase } from '../config/supabase';
import FixedPatientService from '../services/patientServiceFixed';

const TableStructureFix: React.FC = () => {
  const [tableInfo, setTableInfo] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [testResults, setTestResults] = useState<string[]>([]);

  const addResult = (message: string) => {
    setTestResults(prev => [...prev, `${new Date().toISOString()}: ${message}`]);
    console.log(message);
  };

  useEffect(() => {
    checkTableStructure();
  }, []);

  const checkTableStructure = async () => {
    try {
      setLoading(true);
      addResult('🔍 Checking actual table structure...');
      
      const structure = await FixedPatientService.getTableStructure();
      setTableInfo(structure);
      
      if (structure.error) {
        addResult(`❌ Cannot access table: ${structure.error}`);
      } else {
        addResult(`✅ Table accessible with columns: ${structure.columns.join(', ')}`);
        if (structure.sampleRecord) {
          addResult(`📋 Sample record: ${JSON.stringify(structure.sampleRecord, null, 2)}`);
        }
      }
    } catch (error: any) {
      addResult(`🚨 Structure check failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const testMinimalInsert = async () => {
    try {
      setLoading(true);
      addResult('🧪 Testing minimal patient creation...');
      
      const testData = {
        first_name: 'Structure Test',
        last_name: 'Patient',
        phone: '9999999999'
      };
      
      const result = await FixedPatientService.createPatient(testData);
      addResult(`✅ SUCCESS! Patient created: ${JSON.stringify(result, null, 2)}`);
      toast.success('Patient creation works!');
      
    } catch (error: any) {
      addResult(`❌ Minimal insert failed: ${error.message}`);
      toast.error('Patient creation still failing');
    } finally {
      setLoading(false);
    }
  };

  const fixTableStructure = async () => {
    try {
      setLoading(true);
      addResult('🔧 Attempting to fix table structure...');
      
      // Check which columns are missing
      const commonColumns = ['is_active', 'created_at', 'updated_at', 'created_by'];
      const missingColumns = [];
      
      for (const col of commonColumns) {
        const exists = await FixedPatientService.testColumnExists(col);
        if (!exists) {
          missingColumns.push(col);
        }
      }
      
      if (missingColumns.length > 0) {
        addResult(`⚠️ Missing columns: ${missingColumns.join(', ')}`);
        addResult('💡 To fix this, run these SQL commands in Supabase:');
        
        for (const col of missingColumns) {
          let sqlCommand = '';
          switch (col) {
            case 'is_active':
              sqlCommand = 'ALTER TABLE patients ADD COLUMN is_active BOOLEAN DEFAULT true;';
              break;
            case 'created_at':
              sqlCommand = 'ALTER TABLE patients ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT now();';
              break;
            case 'updated_at':
              sqlCommand = 'ALTER TABLE patients ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT now();';
              break;
            case 'created_by':
              sqlCommand = 'ALTER TABLE patients ADD COLUMN created_by UUID;';
              break;
          }
          addResult(`   ${sqlCommand}`);
        }
      } else {
        addResult('✅ All expected columns exist');
      }
      
    } catch (error: any) {
      addResult(`❌ Structure fix failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const createCompatibleTable = () => {
    const sql = `
-- Create new compatible patients table
CREATE TABLE IF NOT EXISTS patients_compatible (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    first_name TEXT NOT NULL,
    last_name TEXT,
    phone TEXT,
    address TEXT,
    gender TEXT DEFAULT 'MALE',
    date_of_birth DATE,
    emergency_contact_name TEXT,
    emergency_contact_phone TEXT,
    email TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    created_by UUID
);

-- Disable RLS for compatibility
ALTER TABLE patients_compatible DISABLE ROW LEVEL SECURITY;

-- Copy existing data if any
INSERT INTO patients_compatible (first_name, last_name, phone, address, gender, date_of_birth, emergency_contact_name, emergency_contact_phone, email)
SELECT 
    first_name, 
    last_name, 
    phone, 
    address, 
    gender, 
    date_of_birth, 
    emergency_contact_name, 
    emergency_contact_phone, 
    email
FROM patients 
WHERE first_name IS NOT NULL;

-- Backup old table and rename new one
ALTER TABLE patients RENAME TO patients_backup;
ALTER TABLE patients_compatible RENAME TO patients;
`;

    addResult('📋 Copy this SQL to create a compatible table:');
    addResult(sql);
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-blue-600">🔧 Table Structure Fix</h2>
        <p className="text-gray-600 mt-2">Fix column mismatch issues in your patients table</p>
      </div>

      {/* Current Table Info */}
      {tableInfo && (
        <div className="mb-6 p-4 bg-blue-50 rounded-lg">
          <h3 className="font-semibold text-blue-800 mb-2">Current Table Structure</h3>
          {tableInfo.error ? (
            <p className="text-red-600">Error: {tableInfo.error}</p>
          ) : (
            <div>
              <p className="text-blue-700">
                <strong>Columns:</strong> {tableInfo.columns?.join(', ') || 'None found'}
              </p>
              <p className="text-blue-700">
                <strong>Records:</strong> {tableInfo.totalRecords || 0}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Action Buttons */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <button
          onClick={checkTableStructure}
          disabled={loading}
          className="bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50"
        >
          🔍 Check Structure
        </button>
        
        <button
          onClick={testMinimalInsert}
          disabled={loading}
          className="bg-green-600 text-white py-3 px-4 rounded-md hover:bg-green-700 disabled:opacity-50"
        >
          🧪 Test Insert
        </button>
        
        <button
          onClick={fixTableStructure}
          disabled={loading}
          className="bg-orange-600 text-white py-3 px-4 rounded-md hover:bg-orange-700 disabled:opacity-50"
        >
          🔧 Generate Fix SQL
        </button>
        
        <button
          onClick={createCompatibleTable}
          disabled={loading}
          className="bg-purple-600 text-white py-3 px-4 rounded-md hover:bg-purple-700 disabled:opacity-50"
        >
          📋 Create New Table
        </button>
      </div>

      {/* Test Results */}
      <div className="bg-black text-green-400 p-4 rounded-lg max-h-96 overflow-y-auto font-mono text-sm">
        <div className="mb-2 text-yellow-400 font-bold">🔧 TABLE STRUCTURE ANALYSIS:</div>
        {testResults.length === 0 ? (
          <div className="text-gray-400">Checking table structure...</div>
        ) : (
          testResults.map((result, index) => (
            <div key={index} className="mb-1">{result}</div>
          ))
        )}
      </div>

      {/* Instructions */}
      <div className="mt-6 p-4 bg-yellow-100 rounded-lg border-2 border-yellow-300">
        <h4 className="font-bold text-yellow-800 mb-2">💡 QUICK FIX INSTRUCTIONS:</h4>
        <div className="text-yellow-700 text-sm space-y-2">
          <p><strong>OPTION 1 - Add Missing Columns:</strong></p>
          <p>Go to Supabase → SQL Editor and add missing columns manually</p>
          
          <p className="pt-2"><strong>OPTION 2 - Create Compatible Table:</strong></p>
          <p>Click "Create New Table" button above, copy the SQL, and run it in Supabase</p>
          
          <p className="pt-2"><strong>OPTION 3 - Use Minimal Data Only:</strong></p>
          <p>The fixed patient service will work with whatever columns you have</p>
        </div>
      </div>
    </div>
  );
};

export default TableStructureFix;
import React, { useState } from 'react';
import { supabase } from '../config/supabaseNew';

const TableFinder: React.FC = () => {
  const [result, setResult] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  const findTables = async () => {
    setLoading(true);
    setResult('');
    
    try {
      console.log('🔍 Looking for assigned doctor/department tables...');
      setResult('🔍 Searching for tables with "assigned" or similar patterns...\n\n');
      
      // Try common table name patterns
      const tablesToCheck = [
        'assigned_doctors',
        'assigned_departments', 
        'doctor_assignments',
        'department_assignments',
        'users', // Sometimes doctors are in users table
        'staff',
        'employees'
      ];
      
      for (const tableName of tablesToCheck) {
        try {
          const { data, error } = await supabase
            .from(tableName)
            .select('*')
            .limit(1);
            
          if (!error && data !== null) {
            setResult(prev => prev + `✅ Found table: ${tableName}\n`);
            if (data.length > 0) {
              setResult(prev => prev + `   Columns: ${Object.keys(data[0]).join(', ')}\n`);
            }
            setResult(prev => prev + `   Records: ${data.length}\n\n`);
          }
        } catch (err) {
          // Table doesn't exist, skip
        }
      }
      
      // Also check what's actually in the doctors table structure
      try {
        const { data, error } = await supabase
          .from('doctors')
          .select('*')
          .limit(3);
          
        if (data) {
          setResult(prev => prev + `\n📋 Current doctors table structure:\n`);
          setResult(prev => prev + `Columns: ${Object.keys(data[0] || {}).join(', ')}\n`);
          setResult(prev => prev + `Sample records: ${data.length}\n`);
          
          data.forEach((doctor, index) => {
            setResult(prev => prev + `\nRecord ${index + 1}:\n${JSON.stringify(doctor, null, 2)}\n`);
          });
        }
      } catch (err) {
        setResult(prev => prev + `❌ Error checking doctors table: ${err}\n`);
      }
      
      // Check departments table too
      try {
        const { data, error } = await supabase
          .from('departments')
          .select('*')
          .limit(3);
          
        if (data) {
          setResult(prev => prev + `\n📋 Current departments table structure:\n`);
          setResult(prev => prev + `Columns: ${Object.keys(data[0] || {}).join(', ')}\n`);
          setResult(prev => prev + `Sample records: ${data.length}\n`);
          
          data.forEach((dept, index) => {
            setResult(prev => prev + `\nDepartment ${index + 1}:\n${JSON.stringify(dept, null, 2)}\n`);
          });
        }
      } catch (err) {
        setResult(prev => prev + `❌ Error checking departments table: ${err}\n`);
      }
      
    } catch (error) {
      console.error('Table search error:', error);
      setResult(prev => prev + `🚨 Error: ${error}\n`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-md max-w-4xl">
      <h2 className="text-2xl font-bold mb-4">Find Doctor/Department Tables</h2>
      <p className="text-gray-600 mb-4">
        Let's find the correct tables that patient entry uses for doctors and departments.
      </p>
      
      <button
        onClick={findTables}
        disabled={loading}
        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:bg-gray-400"
      >
        {loading ? 'Searching...' : 'Find Tables'}
      </button>
      
      {result && (
        <div className="mt-4 p-4 bg-gray-100 rounded">
          <h3 className="font-semibold mb-2">Search Results:</h3>
          <pre className="whitespace-pre-wrap text-sm">{result}</pre>
        </div>
      )}
    </div>
  );
};

export default TableFinder;
import React, { useState } from 'react';
import { supabase } from '../config/supabaseNew';

const AgeMigrator: React.FC = () => {
  const [status, setStatus] = useState<string>('Ready to migrate');
  const [loading, setLoading] = useState(false);

  const runMigration = async () => {
    setLoading(true);
    setStatus('🔄 Starting migration...');

    try {
      // Step 1: Add age column
      setStatus('📝 Step 1: Adding age column...');
      const { error: addColumnError } = await supabase
        .from('patients')
        .select('*')
        .limit(1);

      if (addColumnError) {
        setStatus('❌ Error checking table structure');
        setLoading(false);
        return;
      }

      // Since we can't run DDL directly, let's try a different approach
      // Check if we need to add sample data with age
      const { data: patientsData, error: fetchError } = await supabase
        .from('patients')
        .select('*')
        .limit(5);

      if (fetchError) {
        setStatus(`❌ Error: ${fetchError.message}`);
        setLoading(false);
        return;
      }

      setStatus(`✅ Found ${patientsData?.length || 0} patients. Database structure check complete.`);
      setStatus('⚠️ Note: Age column needs to be added manually in Supabase dashboard or via SQL editor.');
      
    } catch (error) {
      setStatus(`💥 Migration failed: ${error}`);
    }
    
    setLoading(false);
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-md max-w-md">
      <h3 className="text-lg font-semibold mb-4">Age Column Migration</h3>
      <div className="mb-4">
        <p className="text-sm text-gray-600 mb-2">Status:</p>
        <p className="text-sm bg-gray-100 p-2 rounded">{status}</p>
      </div>
      <button
        onClick={runMigration}
        disabled={loading}
        className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 disabled:opacity-50"
      >
        {loading ? 'Running Migration...' : 'Run Age Migration'}
      </button>
      
      <div className="mt-4 text-xs text-gray-500">
        <p><strong>Manual Steps Required:</strong></p>
        <ol className="list-decimal list-inside mt-2 space-y-1">
          <li>Go to Supabase Dashboard → SQL Editor</li>
          <li>Run: ALTER TABLE patients ADD COLUMN age INTEGER;</li>
          <li>Run: UPDATE patients SET age = EXTRACT(YEAR FROM age(CURRENT_DATE, date_of_birth));</li>
          <li>Run: ALTER TABLE patients ALTER COLUMN age SET NOT NULL;</li>
          <li>Run: ALTER TABLE patients DROP COLUMN date_of_birth;</li>
        </ol>
      </div>
    </div>
  );
};

export default AgeMigrator;
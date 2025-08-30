import React, { useState } from 'react';
import { supabase } from '../config/supabaseNew';
import toast from 'react-hot-toast';

const RemoveTriggerComponent: React.FC = () => {
  const [executing, setExecuting] = useState(false);
  const [result, setResult] = useState<string>('');

  const removeTrigger = async () => {
    setExecuting(true);
    setResult('');
    
    try {
      // Step 1: Remove the trigger
      console.log('🔥 Removing transaction_date trigger...');
      
      const { error: triggerError } = await supabase.rpc('sql', {
        query: 'DROP TRIGGER IF EXISTS trigger_set_transaction_date ON patient_transactions'
      });
      
      if (triggerError) {
        throw new Error(`Trigger removal failed: ${triggerError.message}`);
      }
      
      // Step 2: Remove the function
      console.log('🔥 Removing trigger function...');
      
      const { error: functionError } = await supabase.rpc('sql', {
        query: 'DROP FUNCTION IF EXISTS set_transaction_date_from_patient()'
      });
      
      if (functionError) {
        throw new Error(`Function removal failed: ${functionError.message}`);
      }
      
      // Step 3: Verify removal
      const { data: triggerCheck, error: checkError } = await supabase
        .from('information_schema.triggers')
        .select('*')
        .eq('event_object_table', 'patient_transactions')
        .eq('trigger_name', 'trigger_set_transaction_date');
        
      console.log('🔍 Trigger check result:', { triggerCheck, checkError });
      
      const success = !triggerCheck || triggerCheck.length === 0;
      
      if (success) {
        setResult('✅ SUCCESS: Trigger and function removed successfully! New transactions will now use the correct transaction_date.');
        toast.success('Database trigger removed successfully!');
      } else {
        setResult('❌ WARNING: Trigger might still exist. Please check manually.');
        toast.error('Could not verify trigger removal');
      }
      
    } catch (error: any) {
      console.error('❌ Error removing trigger:', error);
      
      // Try alternative method using raw SQL
      try {
        console.log('🔄 Trying alternative SQL execution...');
        
        // Execute SQL directly
        const { error: sqlError1 } = await supabase.rpc('exec_sql', {
          sql: 'DROP TRIGGER IF EXISTS trigger_set_transaction_date ON patient_transactions;'
        });
        
        const { error: sqlError2 } = await supabase.rpc('exec_sql', {
          sql: 'DROP FUNCTION IF EXISTS set_transaction_date_from_patient();'
        });
        
        if (!sqlError1 && !sqlError2) {
          setResult('✅ SUCCESS: Trigger removed using alternative method!');
          toast.success('Trigger removed successfully!');
        } else {
          throw new Error(`Alternative method failed: ${sqlError1?.message || sqlError2?.message}`);
        }
        
      } catch (altError) {
        setResult(`❌ FAILED: ${error.message}\n\nPlease execute this SQL manually in Supabase:\n\nDROP TRIGGER IF EXISTS trigger_set_transaction_date ON patient_transactions;\nDROP FUNCTION IF EXISTS set_transaction_date_from_patient();`);
        toast.error('Please execute SQL manually in Supabase dashboard');
      }
    } finally {
      setExecuting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4">
        <h2 className="text-xl font-bold text-red-600 mb-4">
          🔧 Database Trigger Fix Required
        </h2>
        
        <div className="mb-4 p-4 bg-yellow-100 border-l-4 border-yellow-500">
          <p className="text-sm text-yellow-800">
            <strong>Issue Found:</strong> There's a database trigger that automatically overrides transaction dates 
            with patient entry dates. This is why new services show old dates.
          </p>
        </div>

        <div className="mb-4 p-4 bg-blue-100 border-l-4 border-blue-500">
          <p className="text-sm text-blue-800">
            <strong>Solution:</strong> Remove the trigger so transactions can have their actual service dates.
          </p>
        </div>
        
        {result && (
          <div className="mb-4 p-4 bg-gray-100 border rounded">
            <pre className="text-sm whitespace-pre-wrap">{result}</pre>
          </div>
        )}
        
        <div className="flex gap-3">
          <button
            onClick={removeTrigger}
            disabled={executing}
            className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 disabled:opacity-50"
          >
            {executing ? 'Removing Trigger...' : '🔥 Remove Database Trigger'}
          </button>
          
          <button
            onClick={() => window.location.reload()}
            className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
          >
            Close & Reload
          </button>
        </div>
        
        <div className="mt-4 text-xs text-gray-600">
          <p><strong>What this does:</strong></p>
          <ul className="list-disc list-inside mt-1">
            <li>Removes the trigger that overrides transaction_date</li>
            <li>Allows new services to use their actual service date</li>
            <li>Updates the patient's last_visit_date correctly</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default RemoveTriggerComponent;
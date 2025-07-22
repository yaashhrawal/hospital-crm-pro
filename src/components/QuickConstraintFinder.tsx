import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { supabase } from '../config/supabaseNew';

const QuickConstraintFinder: React.FC = () => {
  const [constraintInfo, setConstraintInfo] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const findConstraint = async () => {
    setLoading(true);
    try {
      console.log('🔍 Looking for transaction type constraint...');
      
      // Try to query the constraint directly
      const { data, error } = await supabase
        .from('information_schema.check_constraints')
        .select('*')
        .ilike('constraint_name', '%transaction_type%');
      
      if (error) {
        console.log('Direct constraint query failed:', error);
        
        // Alternative: Try to get table info
        const { data: tableInfo, error: tableError } = await supabase
          .from('information_schema.columns')
          .select('*')
          .eq('table_name', 'patient_transactions')
          .eq('column_name', 'transaction_type');
        
        if (tableError) {
          setConstraintInfo('❌ Could not access constraint information. Please use the transaction tester or check Supabase SQL editor.');
          toast.error('Could not access constraint info');
        } else {
          setConstraintInfo(`Table info found: ${JSON.stringify(tableInfo, null, 2)}`);
        }
      } else {
        setConstraintInfo(`Constraint info: ${JSON.stringify(data, null, 2)}`);
        console.log('✅ Found constraint info:', data);
      }
    } catch (error: any) {
      console.error('❌ Error finding constraint:', error);
      setConstraintInfo(`Error: ${error.message}. Please check Supabase SQL editor or use transaction tester.`);
      toast.error('Failed to find constraint info');
    } finally {
      setLoading(false);
    }
  };

  const testMinimalTransaction = async () => {
    setLoading(true);
    try {
      // Test the most basic transaction type
      console.log('🧪 Testing minimal transaction...');
      
      const { data, error } = await supabase
        .from('patient_transactions')
        .select('transaction_type')
        .limit(1);
      
      if (error) {
        console.log('❌ Cannot read from patient_transactions:', error);
        setConstraintInfo(`Cannot read patient_transactions: ${error.message}`);
      } else {
        console.log('✅ Can read patient_transactions:', data);
        setConstraintInfo(`✅ Table accessible. Sample data: ${JSON.stringify(data, null, 2)}`);
        
        if (data && data.length > 0) {
          toast.success(`Found existing transaction type: ${data[0].transaction_type}`);
        } else {
          toast.info('Table is empty, need to test transaction types');
        }
      }
    } catch (error: any) {
      console.error('❌ Test failed:', error);
      setConstraintInfo(`Test failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">🔍 Constraint Finder</h2>
      
      <div className="mb-6 p-4 bg-red-50 rounded-lg border border-red-200">
        <h3 className="text-lg font-semibold mb-2 text-red-800">Current Error</h3>
        <p className="text-sm text-red-700">
          <code>patient_transactions_transaction_type_che</code> constraint violation
        </p>
        <p className="text-sm text-red-600 mt-2">
          This means your database has a specific list of allowed transaction types that we need to discover.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <button
          onClick={testMinimalTransaction}
          disabled={loading}
          className="bg-blue-600 text-white px-4 py-3 rounded-md hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Testing...' : '1. Check Existing Data'}
        </button>
        
        <button
          onClick={findConstraint}
          disabled={loading}
          className="bg-green-600 text-white px-4 py-3 rounded-md hover:bg-green-700 disabled:opacity-50"
        >
          {loading ? 'Searching...' : '2. Find Constraint Info'}
        </button>
      </div>

      {constraintInfo && (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <h3 className="text-lg font-semibold mb-2">Results</h3>
          <pre className="text-sm bg-white p-3 rounded border overflow-auto max-h-64">
            {constraintInfo}
          </pre>
        </div>
      )}

      <div className="p-4 bg-yellow-50 rounded-lg">
        <h3 className="text-lg font-semibold mb-2">🔧 Manual Solutions</h3>
        <div className="text-sm space-y-2">
          <p><strong>Option 1:</strong> Use the "🧪 Transaction Test" tab to test all common types</p>
          <p><strong>Option 2:</strong> Check your Supabase SQL Editor and run:</p>
          <code className="block bg-white p-2 rounded mt-1">
            SELECT conname, pg_get_constraintdef(oid) FROM pg_constraint WHERE conname LIKE '%transaction_type%';
          </code>
          <p><strong>Option 3:</strong> Check existing data in your patient_transactions table</p>
          <p><strong>Option 4:</strong> Tell me what transaction types you want to use, and I'll update the schema</p>
        </div>
      </div>
    </div>
  );
};

export default QuickConstraintFinder;
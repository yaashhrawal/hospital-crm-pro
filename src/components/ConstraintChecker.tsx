import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { supabase } from '../config/supabaseNew';

const ConstraintChecker: React.FC = () => {
  const [testResults, setTestResults] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const possibleTransactionTypes = [
    'CONSULTATION',
    'ADMISSION', 
    'PHARMACY',
    'LABORATORY',
    'IMAGING',
    'PROCEDURE',
    'EMERGENCY',
    'DISCHARGE',
    'REFUND',
    'PAYMENT',
    'consultation',
    'admission',
    'pharmacy',
    'laboratory',
    'imaging',
    'procedure',
    'emergency',
    'discharge',
    'refund',
    'payment',
    'fee',
    'entry_fee',
    'consultation_fee',
    'discount',
    'adjustment',
    'registration',
    'treatment'
  ];

  const testTransactionType = async (transactionType: string): Promise<string> => {
    try {
      // Try to insert a test record
      const testData = {
        patient_id: '00000000-0000-0000-0000-000000000000', // Dummy UUID
        transaction_type: transactionType,
        description: `Test transaction for type: ${transactionType}`,
        amount: 1,
        payment_mode: 'CASH',
        status: 'COMPLETED'
      };

      const { data, error } = await supabase
        .from('patient_transactions')
        .insert([testData])
        .select();

      if (error) {
        if (error.message.includes('violates check constraint')) {
          return `❌ ${transactionType} - CONSTRAINT VIOLATION`;
        } else if (error.message.includes('foreign key')) {
          // Foreign key error means the type is allowed but patient doesn't exist
          return `✅ ${transactionType} - ALLOWED (FK error expected)`;
        } else {
          return `❌ ${transactionType} - OTHER ERROR: ${error.message}`;
        }
      } else {
        // Success - but we should clean up
        if (data && data[0]) {
          await supabase
            .from('patient_transactions')
            .delete()
            .eq('id', data[0].id);
        }
        return `✅ ${transactionType} - ALLOWED AND INSERTED`;
      }
    } catch (error: any) {
      return `❌ ${transactionType} - EXCEPTION: ${error.message}`;
    }
  };

  const testAllTypes = async () => {
    setLoading(true);
    setTestResults([]);
    const results: string[] = [];

    for (const type of possibleTransactionTypes) {
      const result = await testTransactionType(type);
      results.push(result);
      setTestResults([...results]);
      
      // Show successful types immediately
      if (result.includes('✅')) {
        toast.success(`Found working type: ${type}`, { duration: 2000 });
      }
      
      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 200));
    }

    setLoading(false);
    
    const successfulTypes = results.filter(r => r.includes('✅'));
    if (successfulTypes.length > 0) {
      toast.success(`Found ${successfulTypes.length} working transaction types!`);
    } else {
      toast.error('No working transaction types found. Check your database schema.');
    }
  };

  const getWorkingTypes = () => {
    return testResults
      .filter(result => result.includes('✅'))
      .map(result => result.split(' - ')[0].replace('✅ ', ''));
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">🔍 Transaction Type Constraint Checker</h2>
      
      <div className="mb-6 p-4 bg-red-50 rounded-lg border border-red-200">
        <h3 className="text-lg font-semibold mb-2 text-red-800">Current Issue</h3>
        <p className="text-sm text-red-700 mb-2">
          <code>patient_transactions_transaction_type_check</code> constraint is preventing transaction creation.
        </p>
        <p className="text-sm text-red-600">
          This tool will test all possible transaction types to find which ones are allowed by your database.
        </p>
      </div>

      <div className="mb-6">
        <button
          onClick={testAllTypes}
          disabled={loading}
          className="bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Testing All Types...' : `🧪 Test All ${possibleTransactionTypes.length} Transaction Types`}
        </button>
      </div>

      {/* Working Types Summary */}
      {getWorkingTypes().length > 0 && (
        <div className="mb-6 p-4 bg-green-50 rounded-lg border border-green-200">
          <h3 className="text-lg font-semibold mb-2 text-green-800">✅ Working Transaction Types</h3>
          <div className="flex flex-wrap gap-2">
            {getWorkingTypes().map(type => (
              <span key={type} className="bg-green-100 text-green-800 px-3 py-1 rounded text-sm font-medium">
                {type}
              </span>
            ))}
          </div>
          <p className="text-sm text-green-700 mt-2">
            Use any of these types in your transaction creation code.
          </p>
        </div>
      )}

      {/* Test Results */}
      {testResults.length > 0 && (
        <div className="p-4 bg-gray-50 rounded-lg">
          <h3 className="text-lg font-semibold mb-3">📋 Test Results ({testResults.length}/{possibleTransactionTypes.length})</h3>
          <div className="space-y-1 max-h-96 overflow-y-auto">
            {testResults.map((result, index) => (
              <div 
                key={index} 
                className={`text-sm p-2 rounded ${
                  result.includes('✅') 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'
                }`}
              >
                {result}
              </div>
            ))}
          </div>
        </div>
      )}

      {loading && (
        <div className="text-center py-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
          <p className="text-gray-600">Testing transaction types... ({testResults.length}/{possibleTransactionTypes.length})</p>
        </div>
      )}

      <div className="mt-6 p-4 bg-yellow-50 rounded-lg">
        <h3 className="text-lg font-semibold mb-2">💡 Next Steps</h3>
        <ol className="text-sm space-y-1">
          <li>1. Run the test above to find working transaction types</li>
          <li>2. Copy the working types (green ones)</li>
          <li>3. I'll update the code to use those exact types</li>
          <li>4. Patient registration will work with transactions</li>
        </ol>
      </div>
    </div>
  );
};

export default ConstraintChecker;
import React, { useState } from 'react';
import toast from 'react-hot-toast';
import HospitalService from '../services/hospitalService';
import { supabase } from '../config/supabaseNew';

const TransactionTypeTester: React.FC = () => {
  const [testType, setTestType] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<string[]>([]);

  const commonTransactionTypes = [
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
    'FEE',
    'ENTRY_FEE',
    'CONSULTATION_FEE',
    'DISCOUNT',
    'ADJUSTMENT',
    'CASH',
    'CARD',
    'UPI',
    'ONLINE',
    'consultation',
    'admission',
    'entry_fee',
    'discount',
    'refund',
    'payment'
  ];

  const testTransactionType = async (type: string) => {
    try {
      console.log(`Testing transaction type: ${type}`);
      
      // First, try to get a patient to test with
      const patients = await HospitalService.getPatients(1);
      let testPatientId = '';
      
      if (patients.length === 0) {
        // Create a test patient
        const testPatient = await HospitalService.createPatient({
          first_name: 'Test',
          last_name: 'Patient',
          hospital_id: '550e8400-e29b-41d4-a716-446655440000'
        });
        testPatientId = testPatient.id;
      } else {
        testPatientId = patients[0].id;
      }
      
      // Try to create transaction with this type
      const testTransaction = {
        patient_id: testPatientId,
        transaction_type: type,
        description: `Test transaction with type: ${type}`,
        amount: 1,
        payment_mode: 'CASH',
        status: 'COMPLETED'
      };
      
      await HospitalService.createTransaction(testTransaction);
      
      console.log(`✅ SUCCESS: ${type} is allowed`);
      return `✅ ${type} - SUCCESS`;
      
    } catch (error: any) {
      console.log(`❌ FAILED: ${type} - ${error.message}`);
      return `❌ ${type} - ${error.message}`;
    }
  };

  const testAllTypes = async () => {
    setLoading(true);
    setResults([]);
    
    const testResults: string[] = [];
    
    for (const type of commonTransactionTypes) {
      const result = await testTransactionType(type);
      testResults.push(result);
      setResults([...testResults]);
      
      // Small delay to avoid overwhelming the database
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    setLoading(false);
    toast.success('Transaction type testing complete!');
  };

  const testSingleType = async () => {
    if (!testType.trim()) {
      toast.error('Please enter a transaction type to test');
      return;
    }
    
    setLoading(true);
    const result = await testTransactionType(testType.trim());
    setResults([result, ...results]);
    setLoading(false);
    setTestType('');
  };

  const checkConstraint = async () => {
    try {
      // Query to check the constraint definition
      const { data, error } = await supabase
        .rpc('check_constraint_info')
        .single();
        
      if (error) {
        console.log('Cannot query constraint directly, will test manually');
        toast.info('Testing transaction types manually...');
        return;
      }
      
      console.log('Constraint info:', data);
    } catch (error) {
      console.log('Direct constraint query failed, using manual testing');
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">🧪 Transaction Type Tester</h2>
      
      <div className="mb-6 p-4 bg-yellow-50 rounded-lg">
        <h3 className="text-lg font-semibold mb-2">Error Details</h3>
        <p className="text-sm text-gray-700 mb-2">
          The error "violates check constraint patient_transactions_transaction_type_ch" means your database 
          has a specific list of allowed transaction types that we need to discover.
        </p>
      </div>

      {/* Single Type Test */}
      <div className="mb-6 p-4 bg-blue-50 rounded-lg">
        <h3 className="text-lg font-semibold mb-3">Test Single Transaction Type</h3>
        <div className="flex gap-2">
          <input
            type="text"
            value={testType}
            onChange={(e) => setTestType(e.target.value)}
            placeholder="Enter transaction type to test"
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={testSingleType}
            disabled={loading}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Testing...' : 'Test'}
          </button>
        </div>
      </div>

      {/* Batch Test */}
      <div className="mb-6 p-4 bg-green-50 rounded-lg">
        <h3 className="text-lg font-semibold mb-3">Test All Common Types</h3>
        <p className="text-sm text-gray-600 mb-3">
          This will test {commonTransactionTypes.length} common transaction types to find which ones work.
        </p>
        <button
          onClick={testAllTypes}
          disabled={loading}
          className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 disabled:opacity-50"
        >
          {loading ? 'Testing All Types...' : 'Test All Common Types'}
        </button>
      </div>

      {/* Results */}
      {results.length > 0 && (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <h3 className="text-lg font-semibold mb-3">Test Results</h3>
          <div className="space-y-1 max-h-60 overflow-y-auto">
            {results.map((result, index) => (
              <div 
                key={index} 
                className={`text-sm p-2 rounded ${
                  result.startsWith('✅') 
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

      {/* Instructions */}
      <div className="p-4 bg-purple-50 rounded-lg">
        <h3 className="text-lg font-semibold mb-3">💡 Instructions</h3>
        <ol className="text-sm space-y-2">
          <li>1. Click "Test All Common Types" to find allowed transaction types</li>
          <li>2. Look for the ✅ SUCCESS results - these are the allowed values</li>
          <li>3. Once we know the allowed types, we'll update the code to use them</li>
          <li>4. If you know specific types to test, use the single test above</li>
        </ol>
      </div>
    </div>
  );
};

export default TransactionTypeTester;
import React, { useState } from 'react';
import { supabase } from '../config/supabaseNew';
import toast from 'react-hot-toast';

interface TransactionDateDebuggerProps {
  onClose?: () => void;
}

const TransactionDateDebugger: React.FC<TransactionDateDebuggerProps> = ({ onClose }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [patientInfo, setPatientInfo] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [triggerInfo, setTriggerInfo] = useState<any[]>([]);

  const debugTransactionDates = async () => {
    if (!searchTerm.trim()) {
      toast.error('Please enter search term');
      return;
    }

    setLoading(true);
    setResults([]);
    setPatientInfo(null);

    try {
      // Search for patient by multiple fields
      let patient = null;
      
      // Try by ID first
      const { data: patientById } = await supabase
        .from('patients')
        .select('*')
        .eq('id', searchTerm)
        .maybeSingle();
      
      if (patientById) {
        patient = patientById;
      } else {
        // Try by patient_id field
        const { data: patientByPatientId } = await supabase
          .from('patients')
          .select('*')
          .eq('patient_id', searchTerm)
          .maybeSingle();
        
        if (patientByPatientId) {
          patient = patientByPatientId;
        } else {
          // Try by name (case insensitive)
          const { data: patientsByName } = await supabase
            .from('patients')
            .select('*')
            .or(`first_name.ilike.%${searchTerm}%,last_name.ilike.%${searchTerm}%`)
            .limit(1);
          
          if (patientsByName && patientsByName.length > 0) {
            patient = patientsByName[0];
          }
        }
      }

      if (!patient) {
        toast.error('Patient not found. Try searching by name like "govind"');
        setLoading(false);
        return;
      }
      
      setPatientInfo(patient);

      // Get all transactions for this patient
      const { data: transactions, error: transError } = await supabase
        .from('patient_transactions')
        .select('*')
        .eq('patient_id', patient.id)
        .order('created_at', { ascending: false });

      if (transError) {
        toast.error('Error fetching transactions');
        setLoading(false);
        return;
      }

      const debugResults = transactions?.map((t, index) => ({
        index: index + 1,
        id: t.id.slice(0, 8),
        type: t.transaction_type,
        amount: t.amount,
        transaction_date: t.transaction_date,
        created_at: t.created_at,
        description: t.description,
        dateForDisplay: t.transaction_date || t.created_at?.split('T')[0] || 'No date',
        patientEntryDate: patient.date_of_entry,
        priority: t.transaction_date ? '1-TRANSACTION_DATE' : 
                 t.created_at ? '2-CREATED_AT' : '3-NO_DATE'
      })) || [];

      setResults(debugResults);
      
      // Also check for database triggers
      try {
        const { data: triggers } = await supabase
          .rpc('sql', { 
            query: `SELECT trigger_name, event_manipulation, event_object_table 
                    FROM information_schema.triggers 
                    WHERE event_object_table = 'patient_transactions'` 
          });
        setTriggerInfo(triggers || []);
      } catch (triggerError) {
        console.log('Could not check triggers:', triggerError);
      }
      
      toast.success(`Found ${debugResults.length} transactions`);

    } catch (error) {
      console.error('Debug error:', error);
      toast.error('Debug failed');
    } finally {
      setLoading(false);
    }
  };

  const fixTriggerIssue = async () => {
    try {
      // Try to remove any problematic triggers
      await supabase.rpc('sql', {
        query: `DROP TRIGGER IF EXISTS trigger_set_transaction_date ON patient_transactions;
                DROP FUNCTION IF EXISTS set_transaction_date_from_patient();`
      });
      toast.success('Attempted to remove problematic triggers');
    } catch (error) {
      toast.error('Could not remove triggers - may need manual removal');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-6xl w-full max-h-[90vh] overflow-auto p-6">
        <h2 className="text-xl font-bold mb-4">🔍 Transaction Date Debugger</h2>
        
        <div className="mb-4 flex gap-2">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Enter patient name (e.g. 'govind') or ID"
            className="flex-1 p-2 border border-gray-300 rounded"
          />
          <button
            onClick={debugTransactionDates}
            disabled={loading}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Debugging...' : 'Debug Dates'}
          </button>
          <button
            onClick={fixTriggerIssue}
            className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
          >
            🔧 Fix DB Triggers
          </button>
          <button
            onClick={() => onClose ? onClose() : window.location.reload()}
            className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
          >
            Close
          </button>
        </div>

        {results.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse border border-gray-300">
              <thead className="bg-gray-100">
                <tr>
                  <th className="border border-gray-300 p-2">#</th>
                  <th className="border border-gray-300 p-2">ID</th>
                  <th className="border border-gray-300 p-2">Type</th>
                  <th className="border border-gray-300 p-2">Amount</th>
                  <th className="border border-gray-300 p-2">Transaction Date</th>
                  <th className="border border-gray-300 p-2">Created At</th>
                  <th className="border border-gray-300 p-2">Display Date</th>
                  <th className="border border-gray-300 p-2">Priority</th>
                  <th className="border border-gray-300 p-2">Description</th>
                </tr>
              </thead>
              <tbody>
                {results.map((result) => (
                  <tr key={result.id} className="hover:bg-gray-50">
                    <td className="border border-gray-300 p-2">{result.index}</td>
                    <td className="border border-gray-300 p-2 font-mono">{result.id}</td>
                    <td className="border border-gray-300 p-2">{result.type}</td>
                    <td className="border border-gray-300 p-2">₹{result.amount}</td>
                    <td className="border border-gray-300 p-2 font-mono bg-green-50">
                      {result.transaction_date || '❌ NULL'}
                    </td>
                    <td className="border border-gray-300 p-2 font-mono">
                      {result.created_at?.split('T')[0] || '❌ NULL'}
                    </td>
                    <td className="border border-gray-300 p-2 font-bold">
                      {result.dateForDisplay}
                    </td>
                    <td className="border border-gray-300 p-2 text-xs">
                      {result.priority}
                    </td>
                    <td className="border border-gray-300 p-2 max-w-xs truncate">
                      {result.description}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {patientInfo && (
          <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded">
            <h3 className="font-bold text-blue-800">Found Patient:</h3>
            <p><strong>Name:</strong> {patientInfo.first_name} {patientInfo.last_name}</p>
            <p><strong>ID:</strong> {patientInfo.id.slice(0, 8)}...</p>
            <p><strong>Patient ID:</strong> {patientInfo.patient_id}</p>
            <p><strong>Date of Entry:</strong> {patientInfo.date_of_entry || 'Not set'}</p>
            <p><strong>Last Visit Date:</strong> {patientInfo.last_visit_date || 'Not set'}</p>
          </div>
        )}

        {triggerInfo.length > 0 && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded">
            <h3 className="font-bold text-red-800">⚠️ Database Triggers Found:</h3>
            {triggerInfo.map((trigger, index) => (
              <p key={index} className="text-red-700">
                <strong>{trigger.trigger_name}</strong> on {trigger.event_object_table} ({trigger.event_manipulation})
              </p>
            ))}
            <p className="text-red-600 text-sm mt-2">
              These triggers may be overriding transaction dates. Click "Fix DB Triggers" to remove them.
            </p>
          </div>
        )}

        <div className="mt-4 text-sm text-gray-600">
          <p><strong>Issue Analysis:</strong></p>
          <ul className="list-disc list-inside mt-2">
            <li><strong>Expected:</strong> Transaction Date = 2025-08-30 (today, when service was added)</li>
            <li><strong>Actual:</strong> Transaction Date = 2025-08-27 (patient entry date)</li>
            <li><strong>Cause:</strong> Database trigger overriding the transaction_date field</li>
            <li><strong>Fix:</strong> Remove the problematic database triggers</li>
          </ul>
          
          <p className="mt-2"><strong>How to use:</strong></p>
          <ol className="list-decimal list-inside">
            <li>Enter patient name (like "govind") and click "Debug Dates"</li>
            <li>If triggers are found, click "🔧 Fix DB Triggers" to remove them</li>
            <li>Add a new service to test if dates are now correct</li>
          </ol>
        </div>
      </div>
    </div>
  );
};

export default TransactionDateDebugger;
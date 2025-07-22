import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { supabase } from '../config/supabaseNew';

const DatabaseConstraintInspector: React.FC = () => {
  const [constraintDetails, setConstraintDetails] = useState<any>(null);
  const [testResults, setTestResults] = useState<string[]>([]);
  const [sqlFix, setSqlFix] = useState<string>('');

  const inspectConstraint = async () => {
    try {
      console.log('🔍 Inspecting database constraints...');
      
      // First, let's try to get schema information
      const { data: columns, error: columnsError } = await supabase
        .from('information_schema.columns')
        .select('*')
        .eq('table_name', 'patient_admissions')
        .eq('column_name', 'room_type');

      console.log('📊 Column info:', columns);

      // Test different room_type values to see what works
      const testValues = [
        'GENERAL', 'PRIVATE', 'ICU', 'EMERGENCY',
        'General', 'Private', 'Icu', 'Emergency',
        'general', 'private', 'icu', 'emergency',
        'SEMI_PRIVATE', 'DELUXE', 'VIP', 'STANDARD'
      ];

      const results: string[] = [];
      
      for (const roomType of testValues) {
        try {
          const testData = {
            patient_id: '00000000-0000-0000-0000-000000000001',
            bed_number: `TEST-${Math.random().toString(36).substr(2, 5)}`,
            room_type: roomType,
            department: 'GENERAL',
            daily_rate: 1000,
            admission_date: new Date().toISOString(),
            status: 'ACTIVE',
            services: {},
            total_amount: 0,
            amount_paid: 0,
            balance_amount: 0,
            hospital_id: '550e8400-e29b-41d4-a716-446655440000'
          };

          const { data, error } = await supabase
            .from('patient_admissions')
            .insert([testData])
            .select();

          if (error) {
            results.push(`❌ "${roomType}": ${error.message}`);
            console.log(`❌ "${roomType}" failed:`, error.message);
          } else {
            results.push(`✅ "${roomType}": SUCCESS`);
            console.log(`✅ "${roomType}" works!`);
            
            // Clean up successful test
            if (data && data[0]) {
              await supabase.from('patient_admissions').delete().eq('id', data[0].id);
            }
          }
        } catch (testError: any) {
          results.push(`❌ "${roomType}": ${testError.message}`);
        }
      }

      setTestResults(results);
      console.log('📋 Test results:', results);

      // Generate SQL fix based on results
      const workingValues = results
        .filter(r => r.includes('✅'))
        .map(r => r.split('"')[1])
        .map(v => `'${v}'`)
        .join(', ');

      if (workingValues) {
        const fixSql = `
-- SQL FIX for patient_admissions room_type constraint
-- Run this in your Supabase SQL Editor

-- Step 1: Drop the existing constraint
ALTER TABLE patient_admissions DROP CONSTRAINT IF EXISTS patient_admissions_room_type_check;

-- Step 2: Add new constraint with working values
ALTER TABLE patient_admissions ADD CONSTRAINT patient_admissions_room_type_check 
CHECK (room_type IN (${workingValues}));

-- Step 3: Verify the constraint
SELECT 
  conname as constraint_name,
  pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conname = 'patient_admissions_room_type_check';
        `;
        setSqlFix(fixSql);
      }

    } catch (error: any) {
      console.error('❌ Constraint inspection failed:', error);
      toast.error(`Inspection failed: ${error.message}`);
    }
  };

  const copyFixToClipboard = () => {
    navigator.clipboard.writeText(sqlFix).then(() => {
      toast.success('SQL fix copied to clipboard!');
    });
  };

  const updateBedsToWorkingTypes = async () => {
    try {
      const workingTypes = testResults
        .filter(r => r.includes('✅'))
        .map(r => r.split('"')[1]);

      if (workingTypes.length === 0) {
        toast.error('No working room types found. Run constraint inspection first.');
        return;
      }

      // Use the first working type as default
      const defaultType = workingTypes[0];
      
      const { error } = await supabase
        .from('beds')
        .update({ room_type: defaultType })
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Update all beds

      if (error) {
        console.error('❌ Beds update failed:', error);
        toast.error(`Failed to update beds: ${error.message}`);
      } else {
        console.log(`✅ Updated all beds to room_type: ${defaultType}`);
        toast.success(`All beds updated to room_type: ${defaultType}`);
      }

    } catch (error: any) {
      console.error('❌ Beds update error:', error);
      toast.error(`Update error: ${error.message}`);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-blue-600">🔍 Database Constraint Inspector</h1>
        <p className="text-gray-600">Inspect the exact room_type constraint in your Supabase database</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <button
          onClick={inspectConstraint}
          className="bg-blue-600 text-white px-4 py-3 rounded-lg hover:bg-blue-700"
        >
          🔍 Inspect Constraint
        </button>

        <button
          onClick={copyFixToClipboard}
          disabled={!sqlFix}
          className="bg-green-600 text-white px-4 py-3 rounded-lg hover:bg-green-700 disabled:opacity-50"
        >
          📋 Copy SQL Fix
        </button>

        <button
          onClick={updateBedsToWorkingTypes}
          disabled={testResults.length === 0}
          className="bg-purple-600 text-white px-4 py-3 rounded-lg hover:bg-purple-700 disabled:opacity-50"
        >
          🔧 Update Beds Table
        </button>
      </div>

      {/* Test Results */}
      {testResults.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg border">
            <h2 className="text-lg font-semibold mb-4">🧪 Constraint Test Results</h2>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {testResults.map((result, index) => (
                <div
                  key={index}
                  className={`p-2 rounded text-sm font-mono ${
                    result.includes('✅') 
                      ? 'bg-green-50 text-green-800' 
                      : 'bg-red-50 text-red-800'
                  }`}
                >
                  {result}
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg border">
            <h2 className="text-lg font-semibold mb-4">📊 Analysis</h2>
            <div className="space-y-3">
              <div>
                <span className="font-medium">Working Values:</span>
                <div className="mt-1">
                  {testResults
                    .filter(r => r.includes('✅'))
                    .map((r, i) => (
                      <span key={i} className="inline-block bg-green-100 text-green-800 px-2 py-1 rounded text-xs mr-2 mb-1">
                        {r.split('"')[1]}
                      </span>
                    ))}
                </div>
              </div>
              <div>
                <span className="font-medium">Failing Values:</span>
                <div className="mt-1">
                  {testResults
                    .filter(r => r.includes('❌'))
                    .slice(0, 5)
                    .map((r, i) => (
                      <span key={i} className="inline-block bg-red-100 text-red-800 px-2 py-1 rounded text-xs mr-2 mb-1">
                        {r.split('"')[1]}
                      </span>
                    ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SQL Fix */}
      {sqlFix && (
        <div className="bg-gray-50 p-6 rounded-lg border">
          <h2 className="text-lg font-semibold mb-4">🛠️ SQL Fix (Run in Supabase SQL Editor)</h2>
          <pre className="bg-gray-800 text-green-400 p-4 rounded text-sm overflow-x-auto">
            {sqlFix}
          </pre>
          <div className="mt-4 p-4 bg-yellow-50 rounded border border-yellow-200">
            <h3 className="font-medium text-yellow-800 mb-2">⚠️ Instructions:</h3>
            <ol className="text-sm text-yellow-700 space-y-1">
              <li>1. Go to your Supabase Dashboard → SQL Editor</li>
              <li>2. Copy and paste the SQL above</li>
              <li>3. Run the SQL to fix the constraint</li>
              <li>4. Test IPD admission again</li>
            </ol>
          </div>
        </div>
      )}

      <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
        <h3 className="font-medium text-blue-800 mb-2">🎯 What This Tool Does:</h3>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• Tests 16 different room_type values against your database</li>
          <li>• Shows exactly which values are allowed by the constraint</li>
          <li>• Generates SQL to fix the constraint with working values</li>
          <li>• Updates your beds table to use valid room_type values</li>
          <li>• All results logged in browser console for debugging</li>
        </ul>
      </div>
    </div>
  );
};

export default DatabaseConstraintInspector;
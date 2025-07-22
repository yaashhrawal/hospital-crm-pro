import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { supabase } from '../config/supabaseNew';

const DatabaseConstraintAnalyzer: React.FC = () => {
  const [constraints, setConstraints] = useState<any[]>([]);
  const [bedData, setBedData] = useState<any[]>([]);
  const [patientAdmissions, setPatientAdmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const analyzeConstraints = async () => {
    setLoading(true);
    try {
      console.log('🔍 Starting database constraint analysis...');

      // Check constraints on patient_admissions table
      const { data: constraintData, error: constraintError } = await supabase.rpc('sql_query', {
        sql: `
          SELECT 
            conname as constraint_name,
            pg_get_constraintdef(c.oid) as constraint_definition,
            contype as constraint_type
          FROM pg_constraint c
          JOIN pg_class t ON c.conrelid = t.oid
          JOIN pg_namespace n ON t.relnamespace = n.oid
          WHERE t.relname = 'patient_admissions'
          AND n.nspname = 'public'
          AND contype = 'c';
        `
      });

      if (constraintError) {
        console.error('❌ Constraint query error:', constraintError);
        // Try alternative method
        await analyzeConstraintsAlternative();
      } else {
        setConstraints(constraintData || []);
        console.log('✅ Constraints found:', constraintData);
      }

    } catch (error: any) {
      console.error('🚨 Analysis error:', error);
      toast.error(`Analysis failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const analyzeConstraintsAlternative = async () => {
    try {
      // Get schema information
      const { data: schemaData, error } = await supabase
        .from('information_schema.table_constraints')
        .select('*')
        .eq('table_name', 'patient_admissions')
        .eq('constraint_type', 'CHECK');

      if (error) throw error;
      console.log('📊 Schema constraints:', schemaData);

      // Also check column constraints
      const { data: columnData, error: columnError } = await supabase
        .from('information_schema.columns')
        .select('*')
        .eq('table_name', 'patient_admissions');

      if (columnError) throw columnError;
      console.log('📋 Column definitions:', columnData);

    } catch (error: any) {
      console.error('❌ Alternative analysis failed:', error);
      toast.error(`Schema analysis failed: ${error.message}`);
    }
  };

  const analyzeBedData = async () => {
    try {
      const { data, error } = await supabase
        .from('beds')
        .select('*')
        .order('bed_number');

      if (error) throw error;

      setBedData(data || []);
      console.log('🛏️ Bed data analysis:');
      console.log('Total beds:', data?.length);
      
      if (data && data.length > 0) {
        const roomTypes = [...new Set(data.map(bed => bed.room_type))];
        console.log('Unique room types:', roomTypes);
        console.log('Room type examples:', data.slice(0, 3).map(bed => ({
          bed_number: bed.bed_number,
          room_type: bed.room_type,
          room_type_type: typeof bed.room_type
        })));
      }

    } catch (error: any) {
      console.error('🚨 Bed analysis error:', error);
      toast.error(`Bed analysis failed: ${error.message}`);
    }
  };

  const analyzeAdmissions = async () => {
    try {
      const { data, error } = await supabase
        .from('patient_admissions')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;

      setPatientAdmissions(data || []);
      console.log('🏥 Recent admissions analysis:', data);
      
      if (data && data.length > 0) {
        const roomTypesInAdmissions = [...new Set(data.map(adm => adm.room_type))];
        console.log('Room types in admissions:', roomTypesInAdmissions);
      }

    } catch (error: any) {
      console.error('🚨 Admissions analysis error:', error);
      console.log('📝 Note: Error might be expected if no admissions exist yet');
    }
  };

  const testConstraintViolation = async () => {
    try {
      console.log('🧪 Testing different room_type values...');

      const testValues = ['GENERAL', 'PRIVATE', 'ICU', 'EMERGENCY', 'general', 'private', 'icu', 'emergency'];
      
      for (const roomType of testValues) {
        try {
          console.log(`Testing room_type: "${roomType}"`);
          
          const testData = {
            patient_id: '00000000-0000-0000-0000-000000000001',
            bed_number: 'TEST-001',
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
            console.log(`❌ "${roomType}" failed:`, error.message);
          } else {
            console.log(`✅ "${roomType}" succeeded:`, data);
            // Clean up successful test
            if (data && data[0]) {
              await supabase.from('patient_admissions').delete().eq('id', data[0].id);
            }
          }

        } catch (testError: any) {
          console.log(`❌ "${roomType}" exception:`, testError.message);
        }
      }

    } catch (error: any) {
      console.error('🚨 Constraint test error:', error);
      toast.error(`Constraint test failed: ${error.message}`);
    }
  };

  const runFullAnalysis = async () => {
    console.log('🚀 Starting comprehensive database analysis...');
    await analyzeConstraints();
    await analyzeBedData();
    await analyzeAdmissions();
    await testConstraintViolation();
    console.log('✅ Analysis complete - check console for detailed results');
    toast.success('Analysis complete! Check browser console for detailed results.');
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800">🔍 Database Constraint Analyzer</h1>
        <p className="text-gray-600">Complete analysis of patient_admissions table constraints and room_type issues</p>
      </div>

      {/* Control Panel */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <button
          onClick={runFullAnalysis}
          disabled={loading}
          className="bg-blue-600 text-white px-4 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium"
        >
          {loading ? '🔄 Analyzing...' : '🚀 Run Full Analysis'}
        </button>

        <button
          onClick={analyzeConstraints}
          className="bg-purple-600 text-white px-4 py-3 rounded-lg hover:bg-purple-700 font-medium"
        >
          🔍 Check Constraints
        </button>

        <button
          onClick={analyzeBedData}
          className="bg-green-600 text-white px-4 py-3 rounded-lg hover:bg-green-700 font-medium"
        >
          🛏️ Analyze Beds
        </button>

        <button
          onClick={testConstraintViolation}
          className="bg-red-600 text-white px-4 py-3 rounded-lg hover:bg-red-700 font-medium"
        >
          🧪 Test Constraints
        </button>
      </div>

      {/* Results Display */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Constraints */}
        {constraints.length > 0 && (
          <div className="bg-white p-6 rounded-lg border">
            <h2 className="text-xl font-semibold mb-4">📋 Table Constraints</h2>
            <div className="space-y-3">
              {constraints.map((constraint, index) => (
                <div key={index} className="p-3 bg-gray-50 rounded">
                  <div className="font-medium text-gray-800">{constraint.constraint_name}</div>
                  <div className="text-sm text-gray-600 mt-1">
                    Type: {constraint.constraint_type}
                  </div>
                  <div className="text-xs text-gray-500 mt-2 font-mono">
                    {constraint.constraint_definition}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Bed Data */}
        {bedData.length > 0 && (
          <div className="bg-white p-6 rounded-lg border">
            <h2 className="text-xl font-semibold mb-4">🛏️ Bed Room Types ({bedData.length} beds)</h2>
            <div className="space-y-2">
              {[...new Set(bedData.map(bed => bed.room_type))].map((roomType, index) => {
                const count = bedData.filter(bed => bed.room_type === roomType).length;
                return (
                  <div key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                    <span className="font-medium">{roomType}</span>
                    <span className="text-sm text-gray-600">{count} beds</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Recent Admissions */}
        {patientAdmissions.length > 0 && (
          <div className="bg-white p-6 rounded-lg border lg:col-span-2">
            <h2 className="text-xl font-semibold mb-4">🏥 Recent Admissions</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left p-2">Bed Number</th>
                    <th className="text-left p-2">Room Type</th>
                    <th className="text-left p-2">Status</th>
                    <th className="text-left p-2">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {patientAdmissions.slice(0, 5).map((admission, index) => (
                    <tr key={index} className="border-t">
                      <td className="p-2">{admission.bed_number}</td>
                      <td className="p-2 font-medium">{admission.room_type}</td>
                      <td className="p-2">{admission.status}</td>
                      <td className="p-2">{new Date(admission.created_at).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Instructions */}
      <div className="mt-8 p-6 bg-yellow-50 rounded-lg border border-yellow-200">
        <h3 className="font-medium text-yellow-800 mb-3">📝 Analysis Instructions:</h3>
        <ol className="text-sm text-yellow-700 space-y-2">
          <li><strong>1. Open Browser Console (F12 → Console)</strong> - All detailed results are logged here</li>
          <li><strong>2. Click "Run Full Analysis"</strong> - Comprehensive check of all constraints and data</li>
          <li><strong>3. Review Console Output</strong> - Look for exact constraint definitions and test results</li>
          <li><strong>4. Check Room Type Values</strong> - Compare bed room_types with admission requirements</li>
          <li><strong>5. Identify Constraint Pattern</strong> - See which room_type values pass/fail the tests</li>
        </ol>
      </div>

      {/* Expected Issues */}
      <div className="mt-6 p-6 bg-blue-50 rounded-lg border border-blue-200">
        <h3 className="font-medium text-blue-800 mb-3">🎯 Common Issues This Will Identify:</h3>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• <strong>Case Sensitivity</strong>: Database expects UPPERCASE but beds have lowercase</li>
          <li>• <strong>Missing Values</strong>: Constraint allows specific values not in beds table</li>
          <li>• <strong>Extra Constraints</strong>: Additional check constraints on room_type field</li>
          <li>• <strong>Data Type Issues</strong>: ENUM vs VARCHAR differences</li>
        </ul>
      </div>
    </div>
  );
};

export default DatabaseConstraintAnalyzer;
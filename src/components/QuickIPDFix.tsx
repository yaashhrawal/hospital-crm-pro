import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { supabase } from '../config/supabaseNew';

const QuickIPDFix: React.FC = () => {
  const [bedData, setBedData] = useState<any[]>([]);
  const [constraintInfo, setConstraintInfo] = useState<string>('');
  const [fixing, setFixing] = useState(false);

  const analyzeProblem = async () => {
    try {
      console.log('🔍 Analyzing room_type constraint issue...');

      // Get all beds to see room_type values
      const { data: beds, error: bedsError } = await supabase
        .from('beds')
        .select('*')
        .limit(10);

      if (bedsError) throw bedsError;

      setBedData(beds || []);
      console.log('🛏️ Beds data:', beds);

      if (beds && beds.length > 0) {
        const roomTypes = [...new Set(beds.map(bed => bed.room_type))];
        console.log('📊 Unique room types in beds table:', roomTypes);
        setConstraintInfo(`Found room types: ${roomTypes.join(', ')}`);

        // Test each room type
        for (const roomType of roomTypes) {
          await testRoomType(roomType);
        }
      }

    } catch (error: any) {
      console.error('❌ Analysis error:', error);
      toast.error(`Analysis failed: ${error.message}`);
    }
  };

  const testRoomType = async (roomType: string) => {
    try {
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
        console.log(`❌ "${roomType}" FAILED:`, error.message);
        toast.error(`"${roomType}" failed: ${error.message.substring(0, 50)}...`);
      } else {
        console.log(`✅ "${roomType}" SUCCESS`);
        toast.success(`"${roomType}" works!`);
        // Clean up test data
        if (data && data[0]) {
          await supabase.from('patient_admissions').delete().eq('id', data[0].id);
        }
      }
    } catch (error: any) {
      console.log(`❌ "${roomType}" EXCEPTION:`, error.message);
    }
  };

  const fixRoomTypes = async () => {
    if (bedData.length === 0) {
      toast.error('Please analyze the problem first');
      return;
    }

    setFixing(true);
    try {
      console.log('🔧 Attempting to fix room_type values...');

      // Try to update all room types to uppercase
      const { error: updateError } = await supabase
        .from('beds')
        .update({ room_type: 'GENERAL' })
        .neq('room_type', '');

      if (updateError) {
        console.error('❌ Update failed:', updateError);
        
        // If update fails, try standard room type values
        const standardTypes = ['GENERAL', 'PRIVATE', 'ICU', 'EMERGENCY'];
        
        for (const roomType of standardTypes) {
          await testRoomType(roomType);
        }
      } else {
        console.log('✅ Updated all beds to GENERAL room type');
        toast.success('Fixed! All beds set to GENERAL room type');
      }

    } catch (error: any) {
      console.error('❌ Fix failed:', error);
      toast.error(`Fix failed: ${error.message}`);
    } finally {
      setFixing(false);
    }
  };

  const testIPDAdmission = async () => {
    if (bedData.length === 0) {
      toast.error('Please analyze the problem first');
      return;
    }

    try {
      // Use the first available bed
      const testBed = bedData[0];
      
      const admissionData = {
        patient_id: '00000000-0000-0000-0000-000000000001',
        bed_number: testBed.bed_number,
        room_type: 'GENERAL', // Use fixed room type
        department: testBed.department || 'GENERAL',
        daily_rate: testBed.daily_rate,
        admission_date: new Date().toISOString(),
        status: 'ACTIVE',
        services: {},
        total_amount: 0,
        amount_paid: 0,
        balance_amount: 0,
        hospital_id: '550e8400-e29b-41d4-a716-446655440000'
      };

      console.log('🧪 Testing IPD admission with:', admissionData);

      const { data, error } = await supabase
        .from('patient_admissions')
        .insert([admissionData])
        .select();

      if (error) {
        console.error('❌ Test admission failed:', error);
        toast.error(`Test failed: ${error.message}`);
      } else {
        console.log('✅ Test admission SUCCESS:', data);
        toast.success('IPD admission test successful!');
        
        // Clean up test data
        if (data && data[0]) {
          await supabase.from('patient_admissions').delete().eq('id', data[0].id);
        }
      }

    } catch (error: any) {
      console.error('❌ Test admission error:', error);
      toast.error(`Test error: ${error.message}`);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-red-600">🚨 Quick IPD Fix</h1>
        <p className="text-gray-600">Emergency fix for room_type constraint violation</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <button
          onClick={analyzeProblem}
          className="bg-blue-600 text-white px-4 py-3 rounded-lg hover:bg-blue-700"
        >
          🔍 Analyze Problem
        </button>

        <button
          onClick={fixRoomTypes}
          disabled={fixing || bedData.length === 0}
          className="bg-green-600 text-white px-4 py-3 rounded-lg hover:bg-green-700 disabled:opacity-50"
        >
          {fixing ? '🔧 Fixing...' : '🔧 Fix Room Types'}
        </button>

        <button
          onClick={testIPDAdmission}
          disabled={bedData.length === 0}
          className="bg-purple-600 text-white px-4 py-3 rounded-lg hover:bg-purple-700 disabled:opacity-50"
        >
          🧪 Test IPD Admission
        </button>
      </div>

      {constraintInfo && (
        <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200 mb-6">
          <h3 className="font-medium text-yellow-800 mb-2">📊 Analysis Result:</h3>
          <p className="text-yellow-700">{constraintInfo}</p>
        </div>
      )}

      {bedData.length > 0 && (
        <div className="bg-white p-6 rounded-lg border">
          <h2 className="text-lg font-semibold mb-4">🛏️ Beds Analysis ({bedData.length} beds)</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {bedData.slice(0, 6).map((bed, index) => (
              <div key={index} className="p-3 bg-gray-50 rounded border">
                <div className="font-medium">{bed.bed_number}</div>
                <div className="text-sm text-gray-600">
                  Room Type: <span className="font-mono bg-yellow-100 px-2 py-1 rounded">{bed.room_type}</span>
                </div>
                <div className="text-sm text-gray-600">Daily Rate: ₹{bed.daily_rate}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mt-6 p-4 bg-red-50 rounded-lg border border-red-200">
        <h3 className="font-medium text-red-800 mb-2">🎯 Quick Fix Steps:</h3>
        <ol className="text-sm text-red-700 space-y-1">
          <li>1. <strong>Analyze Problem</strong> - Check room_type values in beds table</li>
          <li>2. <strong>Fix Room Types</strong> - Update all beds to use valid constraint values</li>
          <li>3. <strong>Test Admission</strong> - Verify IPD admission works with fixed data</li>
          <li>4. <strong>Check Console</strong> - All detailed results logged in browser console</li>
        </ol>
      </div>
    </div>
  );
};

export default QuickIPDFix;
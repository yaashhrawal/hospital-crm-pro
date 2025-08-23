import React, { useState, useEffect } from 'react';
import { supabase } from '../config/supabaseNew';

// Expose supabase globally for console access
declare global {
  interface Window {
    supabase: any;
  }
}

if (typeof window !== 'undefined') {
  window.supabase = supabase;
}

const AddDoctorComponent: React.FC = () => {
  const [result, setResult] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    console.log('🔧 AddDoctorComponent mounted. Supabase available:', !!window.supabase);
    setResult(prev => prev + '🔧 Component ready. You can also use browser console with window.supabase\n');
  }, []);

  const addPoonamJain = async () => {
    setLoading(true);
    setResult('');
    
    try {
      console.log('🏥 Adding PHYSIOTHERAPY department...');
      
      // First add PHYSIOTHERAPY department if it doesn't exist
      const { data: deptData, error: deptError } = await supabase
        .from('departments')
        .upsert([{
          name: 'PHYSIOTHERAPY',
          description: 'Physiotherapy and Rehabilitation',
          is_active: true
        }], {
          onConflict: 'name',
          ignoreDuplicates: false
        })
        .select();
        
      if (deptError) {
        console.error('Department error:', deptError);
        setResult(prev => prev + `❌ Department error: ${deptError.message}\n`);
      } else {
        console.log('✅ Department added or updated');
        setResult(prev => prev + '✅ PHYSIOTHERAPY department added/updated\n');
      }

      console.log('👩‍⚕️ Adding Dr. Poonam Jain...');
      
      // Add Dr. Poonam Jain if she doesn't exist
      const { data: doctorData, error: doctorError } = await supabase
        .from('doctors')
        .upsert([{
          name: 'DR. POONAM JAIN',
          department: 'PHYSIOTHERAPY',
          specialization: 'Physiotherapist',
          fee: 600.00,
          is_active: true
        }], {
          onConflict: 'name',
          ignoreDuplicates: false
        })
        .select();
        
      if (doctorError) {
        console.error('Doctor error:', doctorError);
        setResult(prev => prev + `❌ Doctor error: ${doctorError.message}\n`);
      } else {
        console.log('✅ Doctor added or updated');
        setResult(prev => prev + '✅ DR. POONAM JAIN added/updated\n');
      }

      // Verify the additions
      console.log('🔍 Verifying additions...');
      
      const { data: doctors } = await supabase
        .from('doctors')
        .select('*')
        .eq('name', 'DR. POONAM JAIN');
        
      const { data: departments } = await supabase
        .from('departments')
        .select('*')
        .eq('name', 'PHYSIOTHERAPY');
        
      console.log('Doctor found:', doctors);
      console.log('Department found:', departments);
      
      setResult(prev => prev + `\n🔍 Verification:\n`);
      setResult(prev => prev + `Doctor: ${doctors?.length ? 'FOUND' : 'NOT FOUND'}\n`);
      setResult(prev => prev + `Department: ${departments?.length ? 'FOUND' : 'NOT FOUND'}\n`);
      
      if (doctors?.length) {
        setResult(prev => prev + `Doctor details: ${JSON.stringify(doctors[0], null, 2)}\n`);
      }
      
    } catch (error) {
      console.error('Error:', error);
      setResult(prev => prev + `🚨 Error: ${error}\n`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-md max-w-2xl">
      <h2 className="text-2xl font-bold mb-4">Add Dr. Poonam Jain</h2>
      <p className="text-gray-600 mb-4">
        This will add Dr. Poonam Jain (Physiotherapist) to the database along with the PHYSIOTHERAPY department.
      </p>
      
      <button
        onClick={addPoonamJain}
        disabled={loading}
        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:bg-gray-400"
      >
        {loading ? 'Adding...' : 'Add Dr. Poonam Jain'}
      </button>
      
      {result && (
        <div className="mt-4 p-4 bg-gray-100 rounded">
          <h3 className="font-semibold mb-2">Result:</h3>
          <pre className="whitespace-pre-wrap text-sm">{result}</pre>
        </div>
      )}
    </div>
  );
};

export default AddDoctorComponent;
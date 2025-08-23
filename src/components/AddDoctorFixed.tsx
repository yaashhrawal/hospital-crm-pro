import React, { useState } from 'react';
import { supabase } from '../config/supabaseNew';

const AddDoctorFixed: React.FC = () => {
  const [result, setResult] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  const addPoonamJain = async () => {
    setLoading(true);
    setResult('');
    
    try {
      console.log('🏥 Adding PHYSIOTHERAPY department to actual schema...');
      setResult('🏥 Adding PHYSIOTHERAPY department...\n');
      
      // Add PHYSIOTHERAPY department using the actual column structure
      const { data: deptData, error: deptError } = await supabase
        .from('departments')
        .insert([{
          name: 'PHYSIOTHERAPY',
          description: 'Physiotherapy and Rehabilitation',
          specialty: 'Physiotherapy',
          hospital_experience: 'Orthophysiotherapy and Rehabilitation',
          is_active: true,
          hospital_id: '00000000-0000-0000-0000-000000000000' // Default hospital ID
        }])
        .select();
        
      if (deptError) {
        console.error('Department error:', deptError);
        setResult(prev => prev + `❌ Department error: ${deptError.message}\n`);
      } else {
        console.log('✅ Department added or already exists');
        setResult(prev => prev + '✅ PHYSIOTHERAPY department added\n');
      }

      console.log('👩‍⚕️ Adding Dr. Poonam Jain to actual schema...');
      setResult(prev => prev + '\n👩‍⚕️ Adding Dr. Poonam Jain...\n');
      
      // Get the department ID first
      const { data: dept } = await supabase
        .from('departments')
        .select('id')
        .eq('name', 'PHYSIOTHERAPY')
        .single();
        
      if (!dept) {
        setResult(prev => prev + '❌ Could not find PHYSIOTHERAPY department ID\n');
        return;
      }
      
      // Add Dr. Poonam Jain using the actual column structure  
      const { data: doctorData, error: doctorError } = await supabase
        .from('doctors')
        .insert([{
          first_name: 'DR. POONAM',
          last_name: 'JAIN',
          email: 'poonam.jain@hospital.com',
          department_id: dept.id,
          specialty: 'Physiotherapist',
          hospital_experience: 'B.P.Th (Mumbai), M.P.Th - Orthophysiotherapy (Mumbai)',
          is_active: true
        }])
        .select();
        
      if (doctorError) {
        console.error('Doctor error:', doctorError);
        setResult(prev => prev + `❌ Doctor error: ${doctorError.message}\n`);
      } else {
        console.log('✅ Doctor added successfully');
        setResult(prev => prev + '✅ DR. POONAM JAIN added successfully\n');
      }

      // Verify the additions
      console.log('🔍 Verifying additions...');
      setResult(prev => prev + '\n🔍 Verifying additions...\n');
      
      const { data: doctors } = await supabase
        .from('doctors')
        .select('*, departments(name)')
        .eq('first_name', 'DR. POONAM')
        .eq('last_name', 'JAIN');
        
      const { data: departments } = await supabase
        .from('departments')
        .select('*')
        .eq('name', 'PHYSIOTHERAPY');
        
      console.log('Doctor found:', doctors);
      console.log('Department found:', departments);
      
      setResult(prev => prev + `Doctor: ${doctors?.length ? 'FOUND ✅' : 'NOT FOUND ❌'}\n`);
      setResult(prev => prev + `Department: ${departments?.length ? 'FOUND ✅' : 'NOT FOUND ❌'}\n`);
      
      if (doctors?.length) {
        setResult(prev => prev + `\nDoctor Details:\n`);
        setResult(prev => prev + `Name: ${doctors[0].first_name} ${doctors[0].last_name}\n`);
        setResult(prev => prev + `Department: ${doctors[0].departments?.name || 'Unknown'}\n`);
        setResult(prev => prev + `Specialty: ${doctors[0].specialty}\n`);
        setResult(prev => prev + `Experience: ${doctors[0].hospital_experience}\n`);
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
      <h2 className="text-2xl font-bold mb-4">Add Dr. Poonam Jain (Fixed Schema)</h2>
      <p className="text-gray-600 mb-4">
        This will add Dr. Poonam Jain (Physiotherapist) using the correct database schema.
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

export default AddDoctorFixed;
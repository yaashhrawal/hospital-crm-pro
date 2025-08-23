console.log('Adding Dr. Poonam Jain to database...');
import { supabase, HOSPITAL_ID } from './src/config/supabaseNew.js';

async function addDoctor() {
  try {
    console.log('🏥 Adding PHYSIOTHERAPY department...');
    const { data: deptData, error: deptError } = await supabase
      .from('departments')
      .insert([{
        name: 'PHYSIOTHERAPY',
        description: 'Physiotherapy and Rehabilitation',
        is_active: true
      }])
      .select();
      
    if (deptError && deptError.code !== '23505') {
      console.error('Department error:', deptError);
    } else {
      console.log('✅ Department added or already exists');
    }

    console.log('👩‍⚕️ Adding Dr. Poonam Jain...');
    const { data: doctorData, error: doctorError } = await supabase
      .from('doctors')
      .insert([{
        name: 'DR. POONAM JAIN',
        department: 'PHYSIOTHERAPY',
        specialization: 'Physiotherapist',
        fee: 600.00,
        is_active: true
      }])
      .select();
      
    if (doctorError && doctorError.code !== '23505') {
      console.error('Doctor error:', doctorError);
    } else {
      console.log('✅ Doctor added or already exists');
    }

    console.log('🔍 Verifying additions...');
    const { data: doctors } = await supabase
      .from('doctors')
      .select('*')
      .eq('name', 'DR. POONAM JAIN');
      
    const { data: departments } = await supabase
      .from('departments')
      .select('*')
      .eq('name', 'PHYSIOTHERAPY');
      
    console.log('Doctor:', doctors);
    console.log('Department:', departments);
    
  } catch (error) {
    console.error('Error:', error);
  }
}

addDoctor();
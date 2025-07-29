import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://oghqwddhojnryovmfvzc.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9naHF3ZGRob2pucnlvdm1mdnpjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMxMTQ1NDEsImV4cCI6MjA2ODY5MDU0MX0.NVvYQFtqIg8OV-vvkAhCNFC_uMC1SBJDSKcLHRjf5w0';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testConnection() {
  console.log('Testing Supabase connection...');
  console.log('URL:', supabaseUrl);
  
  try {
    // Test auth
    console.log('\n1. Testing authentication...');
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: 'admin@hospital.com',
      password: 'admin123'
    });
    
    if (authError) {
      console.error('❌ Auth error:', authError.message);
    } else {
      console.log('✅ Auth successful:', authData.user?.email);
    }
    
    // Test database connection
    console.log('\n2. Testing database connection...');
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .limit(1);
    
    if (error) {
      console.error('❌ Database error:', error.message);
      console.error('Details:', error);
    } else {
      console.log('✅ Database connection successful');
      console.log('Sample data:', data);
    }
    
    // Test patients table
    console.log('\n3. Testing patients table...');
    const { data: patients, error: patientsError } = await supabase
      .from('patients')
      .select('count')
      .limit(1);
    
    if (patientsError) {
      console.error('❌ Patients table error:', patientsError.message);
    } else {
      console.log('✅ Patients table accessible');
    }
    
  } catch (err) {
    console.error('Connection test failed:', err);
  }
}

testConnection();
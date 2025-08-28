import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://oghqwddhojnryovmfvzc.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9naHF3ZGRob2pucnlvdm1mdnpjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMxMTQ1NDEsImV4cCI6MjA2ODY5MDU0MX0.NVvYQFtqIg8OV-vvkAhCNFC_uMC1SBJDSKcLHRjf5w0';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testDashboardLogic() {
  console.log('\n=== TESTING DASHBOARD LOGIC EXACTLY ===\n');
  
  try {
    console.log('1. Calling HospitalService.getAppointments() equivalent...');
    
    // Simulate HospitalService.getAppointments()
    const { data: appointments, error } = await supabase
      .from('future_appointments')
      .select(`
        *,
        patient:patients(id, patient_id, first_name, last_name, phone),
        doctor:users(id, first_name, last_name, email)
      `)
      .order('appointment_date', { ascending: true })
      .order('appointment_time', { ascending: true })
      .limit(100);
    
    if (error) {
      console.error('❌ Error with relationships:', error);
      
      // Try fallback query (what HospitalService does)
      console.log('🔄 Trying fallback query...');
      const { data: simpleAppointments, error: simpleError } = await supabase
        .from('future_appointments')
        .select('*')
        .order('appointment_date', { ascending: true })
        .limit(100);
      
      if (simpleError) {
        console.error('❌ Fallback also failed:', simpleError);
        return;
      }
      
      console.log('✅ Fallback successful, using simple appointments');
      // Use simple appointments for the rest of the test
      testDashboardTransformation(simpleAppointments);
      return;
    }
    
    console.log('✅ Successfully loaded appointments with relationships');
    console.log(`Found ${appointments?.length || 0} appointments`);
    
    if (appointments && appointments.length > 0) {
      console.log('\nFirst appointment with relationships:');
      console.log(JSON.stringify(appointments[0], null, 2));
    }
    
    // Test the dashboard transformation
    testDashboardTransformation(appointments);
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

function testDashboardTransformation(appointmentsData) {
  console.log('\n2. Testing Dashboard transformation...');
  
  // Simulate dashboard transformation
  const supabaseAppointments = (appointmentsData || []).map((apt) => {
    // Create scheduled_at from appointment_date and appointment_time
    const scheduledAt = apt.scheduled_at || `${apt.appointment_date}T${apt.appointment_time || '00:00:00'}`;
    
    // Ensure patient and department objects exist
    const transformedApt = {
      ...apt,
      scheduled_at: scheduledAt,
      patient: apt.patient || {
        first_name: 'Unknown',
        last_name: 'Patient',
        id: apt.patient_id
      },
      department: apt.department || {
        name: apt.department_name || 'General'
      },
      appointment_type: apt.appointment_type || 'CONSULTATION',
      status: apt.status || 'SCHEDULED'
    };
    
    return transformedApt;
  });
  
  console.log(`✅ Transformed ${supabaseAppointments.length} appointments`);
  
  if (supabaseAppointments.length > 0) {
    console.log('\nFirst transformed appointment:');
    console.log(JSON.stringify(supabaseAppointments[0], null, 2));
  }
  
  // Test the date filtering
  testDateFiltering(supabaseAppointments);
}

function testDateFiltering(allAppointments) {
  console.log('\n3. Testing date filtering...');
  
  // Simulate selectedDate = new Date() (today)
  const selectedDate = new Date();
  console.log(`Selected date: ${selectedDate.toISOString()}`);
  
  const startDate = new Date(selectedDate);
  startDate.setHours(0, 0, 0, 0);
  const endDate = new Date(selectedDate);
  endDate.setDate(endDate.getDate() + 7);
  endDate.setHours(23, 59, 59, 999);
  
  console.log(`Filter range: ${startDate.toISOString()} to ${endDate.toISOString()}`);
  
  const filteredAppointments = allAppointments.filter((appointment) => {
    const appointmentDate = new Date(appointment.scheduled_at);
    const isInRange = appointmentDate >= startDate && appointmentDate <= endDate;
    
    console.log(`  - ${appointment.scheduled_at} -> ${appointmentDate.toISOString()} -> ${isInRange ? '✅ INCLUDED' : '❌ EXCLUDED'}`);
    
    return isInRange;
  }).slice(0, 10); // Show maximum 10 appointments
  
  console.log(`\n✅ After filtering: ${filteredAppointments.length} appointments should show in dashboard`);
  
  if (filteredAppointments.length > 0) {
    console.log('\n📅 Appointments that SHOULD display:');
    filteredAppointments.forEach((apt, index) => {
      console.log(`${index + 1}. ${apt.patient?.first_name} ${apt.patient?.last_name} - ${apt.scheduled_at}`);
    });
  } else {
    console.log('\n❌ NO APPOINTMENTS WILL SHOW - This is the problem!');
  }
}

testDashboardLogic().then(() => {
  console.log('\n=== TEST COMPLETE ===\n');
  process.exit(0);
});
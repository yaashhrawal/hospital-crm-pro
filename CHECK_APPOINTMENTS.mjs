import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://oghqwddhojnryovmfvzc.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9naHF3ZGRob2pucnlvdm1mdnpjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMxMTQ1NDEsImV4cCI6MjA2ODY5MDU0MX0.NVvYQFtqIg8OV-vvkAhCNFC_uMC1SBJDSKcLHRjf5w0';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkAppointments() {
  console.log('\n=== CHECKING FUTURE_APPOINTMENTS TABLE ===\n');
  
  try {
    // 1. Check if table exists and get all appointments
    const { data: allAppointments, error: allError } = await supabase
      .from('future_appointments')
      .select('*')
      .order('appointment_date', { ascending: true });
    
    if (allError) {
      console.error('❌ Error fetching appointments:', allError);
      return;
    }
    
    console.log(`✅ Found ${allAppointments?.length || 0} total appointments in future_appointments table\n`);
    
    if (allAppointments && allAppointments.length > 0) {
      console.log('📅 All appointments:');
      allAppointments.forEach((apt, index) => {
        console.log(`\n${index + 1}. Appointment ID: ${apt.id}`);
        console.log(`   Patient ID: ${apt.patient_id}`);
        console.log(`   Doctor ID: ${apt.doctor_id}`);
        console.log(`   Date: ${apt.appointment_date}`);
        console.log(`   Time: ${apt.appointment_time}`);
        console.log(`   Status: ${apt.status}`);
        console.log(`   Reason: ${apt.reason || apt.notes}`);
        console.log(`   Created: ${apt.created_at}`);
      });
    }
    
    // 2. Check upcoming appointments (next 7 days)
    const today = new Date();
    const nextWeek = new Date();
    nextWeek.setDate(today.getDate() + 7);
    
    const todayStr = today.toISOString().split('T')[0];
    const nextWeekStr = nextWeek.toISOString().split('T')[0];
    
    console.log(`\n\n=== CHECKING UPCOMING APPOINTMENTS (${todayStr} to ${nextWeekStr}) ===\n`);
    
    const { data: upcomingAppointments, error: upcomingError } = await supabase
      .from('future_appointments')
      .select('*')
      .gte('appointment_date', todayStr)
      .lte('appointment_date', nextWeekStr)
      .order('appointment_date', { ascending: true });
    
    if (upcomingError) {
      console.error('❌ Error fetching upcoming appointments:', upcomingError);
      return;
    }
    
    console.log(`✅ Found ${upcomingAppointments?.length || 0} upcoming appointments\n`);
    
    if (upcomingAppointments && upcomingAppointments.length > 0) {
      console.log('📅 Upcoming appointments:');
      upcomingAppointments.forEach((apt, index) => {
        console.log(`\n${index + 1}. Date: ${apt.appointment_date} at ${apt.appointment_time}`);
        console.log(`   Status: ${apt.status}`);
        console.log(`   Patient: ${apt.patient_id}`);
      });
    }
    
    // 3. Check with relationships
    console.log('\n\n=== CHECKING WITH RELATIONSHIPS ===\n');
    
    const { data: withRelations, error: relError } = await supabase
      .from('future_appointments')
      .select(`
        *,
        patient:patients(id, first_name, last_name, phone)
      `)
      .limit(5);
    
    if (relError) {
      console.error('❌ Error with relationships:', relError);
      console.log('This might be why appointments aren\'t showing properly in the dashboard');
    } else {
      console.log('✅ Successfully loaded with patient relationships');
      if (withRelations && withRelations.length > 0) {
        console.log('\nSample appointment with patient data:');
        console.log(JSON.stringify(withRelations[0], null, 2));
      }
    }
    
    // 4. Check if patients exist
    console.log('\n\n=== CHECKING PATIENTS ===\n');
    
    const { data: patients, error: patError } = await supabase
      .from('patients')
      .select('id, patient_id, first_name, last_name')
      .limit(5);
    
    if (patError) {
      console.error('❌ Error fetching patients:', patError);
    } else {
      console.log(`✅ Found ${patients?.length || 0} patients in database`);
      if (patients && patients.length > 0) {
        console.log('Sample patients:');
        patients.forEach(p => {
          console.log(`  - ${p.first_name} ${p.last_name} (ID: ${p.id})`);
        });
      }
    }
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

checkAppointments().then(() => {
  console.log('\n=== CHECK COMPLETE ===\n');
  process.exit(0);
});
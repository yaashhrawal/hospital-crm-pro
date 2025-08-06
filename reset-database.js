#!/usr/bin/env node

/**
 * Database Reset Script
 * This script will:
 * 1. Clear all IPD entries and admissions
 * 2. Reset all beds to available status
 * 3. Clear debug/test data
 * 4. Reset patient IPD status to OPD
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials in environment variables');
  console.error('Required: VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (or VITE_SUPABASE_ANON_KEY)');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function resetDatabase() {
  console.log('🔄 Starting database reset...\n');

  try {
    // 1. Clear IPD admissions
    console.log('1️⃣ Clearing IPD admissions...');
    const { data: admissions, error: admissionsError } = await supabase
      .from('patient_admissions')
      .delete()
      .neq('id', 'dummy'); // Delete all records

    if (admissionsError) {
      console.error('❌ Error clearing admissions:', admissionsError);
    } else {
      console.log('✅ Cleared all IPD admissions');
    }

    // 2. Reset all beds to available
    console.log('\n2️⃣ Resetting all beds to available...');
    const { data: beds, error: bedsError } = await supabase
      .from('beds')
      .update({ 
        status: 'AVAILABLE',
        current_patient_id: null,
        assigned_patient_name: null,
        assigned_patient_phone: null,
        admission_date: null,
        notes: null,
        updated_at: new Date().toISOString()
      })
      .neq('id', 'dummy'); // Update all beds

    if (bedsError) {
      console.error('❌ Error resetting beds:', bedsError);
    } else {
      console.log('✅ Reset all beds to available status');
    }

    // 3. Reset patient IPD status
    console.log('\n3️⃣ Resetting patient IPD status...');
    const { data: patients, error: patientsError } = await supabase
      .from('patients')
      .update({ 
        ipd_status: 'OPD',
        updated_at: new Date().toISOString()
      })
      .neq('ipd_status', 'OPD'); // Only update non-OPD patients

    if (patientsError) {
      console.error('❌ Error resetting patient status:', patientsError);
    } else {
      console.log('✅ Reset all patient IPD status to OPD');
    }

    // 4. Clear IPD billing records
    console.log('\n4️⃣ Clearing IPD billing records...');
    const { data: ipdBills, error: ipdBillsError } = await supabase
      .from('ipd_bills')
      .delete()
      .neq('id', 'dummy');

    if (ipdBillsError) {
      console.error('❌ Error clearing IPD bills:', ipdBillsError);
    } else {
      console.log('✅ Cleared all IPD billing records');
    }

    // 5. Clear test/debug patients (optional - uncomment if needed)
    console.log('\n5️⃣ Clearing debug/test data...');
    
    // Delete patients with test names
    const { data: testPatients, error: testPatientsError } = await supabase
      .from('patients')
      .delete()
      .or('first_name.ilike.*test*,first_name.ilike.*debug*,first_name.ilike.*demo*,last_name.ilike.*test*,last_name.ilike.*debug*,last_name.ilike.*demo*');

    if (testPatientsError) {
      console.warn('⚠️ Warning clearing test patients:', testPatientsError.message);
    } else {
      console.log('✅ Cleared test/debug patients');
    }

    // 6. Get summary statistics
    console.log('\n📊 Database Reset Summary:');
    
    // Count remaining records
    const { count: remainingAdmissions } = await supabase
      .from('patient_admissions')
      .select('*', { count: 'exact', head: true });
    
    const { count: availableBeds } = await supabase
      .from('beds')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'AVAILABLE');
    
    const { count: totalBeds } = await supabase
      .from('beds')
      .select('*', { count: 'exact', head: true });
    
    const { count: opdPatients } = await supabase
      .from('patients')
      .select('*', { count: 'exact', head: true })
      .eq('ipd_status', 'OPD');
    
    const { count: totalPatients } = await supabase
      .from('patients')
      .select('*', { count: 'exact', head: true });

    const { count: remainingIPDBills } = await supabase
      .from('ipd_bills')
      .select('*', { count: 'exact', head: true });

    console.log(`├─ IPD Admissions: ${remainingAdmissions || 0}`);
    console.log(`├─ Available Beds: ${availableBeds || 0}/${totalBeds || 0}`);
    console.log(`├─ OPD Patients: ${opdPatients || 0}/${totalPatients || 0}`);
    console.log(`└─ IPD Bills: ${remainingIPDBills || 0}`);

    console.log('\n🎉 Database reset completed successfully!');
    console.log('\nNext steps:');
    console.log('- Refresh your application');
    console.log('- IPD beds section should show all beds as available');
    console.log('- All patients should be in OPD status');
    console.log('- IPD billing should be cleared');

  } catch (error) {
    console.error('💥 Fatal error during database reset:', error);
    process.exit(1);
  }
}

// Run the reset
resetDatabase().catch(console.error);
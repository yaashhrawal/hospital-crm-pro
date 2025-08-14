#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';

// Valant credentials
const valantClient = createClient(
  'https://oghqwddhojnryovmfvzc.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9naHF3ZGRob2pucnlvdm1mdnpjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMxMTQ1NDEsImV4cCI6MjA2ODY5MDU0MX0.NVvYQFtqIg8OV-vvkAhCNFC_uMC1SBJDSKcLHRjf5w0'
);

// Madhuban credentials
const madhubanClient = createClient(
  'https://btoeupnfqkioxigrheyp.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ0b2V1cG5mcWtpb3hpZ3JoZXlwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQwMTg0MjQsImV4cCI6MjA2OTU5NDQyNH0.j70Ab_8XHCUG9eYHdEbbcZAPko3_Lj2edkzkZEpd8QQ'
);

async function debugDatabaseIssue() {
  console.log('🔍 DEBUGGING DATABASE SEPARATION ISSUE\n');
  
  console.log('📊 Database Information:');
  console.log('Valant:   oghqwddhojnryovmfvzc.supabase.co');
  console.log('Madhuban: btoeupnfqkioxigrheyp.supabase.co\n');
  
  try {
    // Check patient counts in both databases
    console.log('👥 Checking patient counts...');
    
    const { count: valantCount, error: valantError } = await valantClient
      .from('patients')
      .select('*', { count: 'exact', head: true });
    
    const { count: madhubanCount, error: madhubanError } = await madhubanClient
      .from('patients')
      .select('*', { count: 'exact', head: true });
    
    console.log(`Valant patients: ${valantCount || 'Error'}`);
    console.log(`Madhuban patients: ${madhubanCount || 'Error'}`);
    
    if (valantError) console.log('Valant error:', valantError.message);
    if (madhubanError) console.log('Madhuban error:', madhubanError.message);
    
    // Get latest patients from both
    console.log('\n📋 Latest patients in each database:');
    
    const { data: valantPatients } = await valantClient
      .from('patients')
      .select('patient_id, first_name, last_name, created_at')
      .order('created_at', { ascending: false })
      .limit(5);
    
    const { data: madhubanPatients } = await madhubanClient
      .from('patients')
      .select('patient_id, first_name, last_name, created_at')
      .order('created_at', { ascending: false })
      .limit(5);
    
    console.log('\nVALANT Latest Patients:');
    valantPatients?.forEach(p => console.log(`- ${p.patient_id}: ${p.first_name} ${p.last_name}`));
    
    console.log('\nMADHUBAN Latest Patients:');
    madhubanPatients?.forEach(p => console.log(`- ${p.patient_id}: ${p.first_name} ${p.last_name}`));
    
    // Check if any patient IDs match
    if (valantPatients && madhubanPatients) {
      const valantIds = valantPatients.map(p => p.patient_id);
      const madhubanIds = madhubanPatients.map(p => p.patient_id);
      const common = valantIds.filter(id => madhubanIds.includes(id));
      
      if (common.length > 0) {
        console.log('\n🚨 PROBLEM FOUND: Common patient IDs detected!');
        console.log('Common IDs:', common);
        console.log('This indicates databases are somehow connected!');
      } else {
        console.log('\n✅ No common patient IDs found.');
      }
    }
    
    console.log('\n🔍 ANALYSIS:');
    console.log('If data appears in both databases, possible causes:');
    console.log('1. Vercel environment variables pointing to same database');
    console.log('2. Frontend code still using cached credentials');
    console.log('3. Browser cache/localStorage issues');
    console.log('4. Wrong environment variables in one or both deployments');
    
  } catch (error) {
    console.error('❌ Debug failed:', error.message);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  debugDatabaseIssue()
    .then(() => process.exit(0))
    .catch(err => {
      console.error('Fatal error:', err);
      process.exit(1);
    });
}
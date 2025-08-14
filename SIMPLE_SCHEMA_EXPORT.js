#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';

const valantClient = createClient(
  'https://oghqwddhojnryovmfvzc.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9naHF3ZGRob2pucnlvdm1mdnpjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzExNDU0MSwiZXhwIjoyMDY4NjkwNTQxfQ.NYr_Q6dLcxeKMqKA3h4GN92xkHjLfZClVKRd30Epmvg'
);

async function getPatientSchema() {
  console.log('📋 GETTING VALANT PATIENTS SCHEMA');
  console.log('=================================\n');
  
  try {
    // Get a sample patient to see the structure
    const { data: samplePatient, error } = await valantClient
      .from('patients')
      .select('*')
      .limit(1);
    
    if (error) {
      console.log('❌ Error getting sample patient:', error.message);
      return;
    }
    
    if (!samplePatient || samplePatient.length === 0) {
      console.log('❌ No patients found in Valant database');
      return;
    }
    
    console.log('📊 VALANT PATIENT STRUCTURE:');
    console.log('============================');
    
    const patient = samplePatient[0];
    const columns = Object.keys(patient);
    
    console.log(`Found ${columns.length} columns:`);
    columns.forEach((col, index) => {
      const value = patient[col];
      const type = Array.isArray(value) ? 'ARRAY' : typeof value;
      console.log(`${index + 1}. ${col} (${type})`);
    });
    
    // Generate ALTER TABLE statements based on common column types
    let alterSQL = `-- ALTER TABLE statements to add ALL missing columns to Madhuban\n\n`;
    
    columns.forEach(col => {
      const value = patient[col];
      let sqlType = 'TEXT';
      
      if (col.includes('id') && col !== 'patient_id') {
        sqlType = 'UUID';
      } else if (col.includes('date') || col.includes('_at')) {
        sqlType = 'TIMESTAMPTZ';
      } else if (col.includes('amount') || col.includes('fee') || col.includes('rate') || col.includes('balance')) {
        sqlType = 'NUMERIC(10,2)';
      } else if (col.includes('count') || col === 'age') {
        sqlType = 'INTEGER';
      } else if (col.includes('active') || col.includes('reference') || col.includes('required')) {
        sqlType = 'BOOLEAN';
      } else if (Array.isArray(value)) {
        sqlType = 'TEXT[]';
      }
      
      alterSQL += `ALTER TABLE patients ADD COLUMN IF NOT EXISTS ${col} ${sqlType};\n`;
    });
    
    console.log('\n📄 COMPLETE ALTER TABLE SQL:');
    console.log('============================');
    console.log(alterSQL);
    
    // Save to file
    const fs = await import('fs');
    fs.writeFileSync('/Users/mac/hospital-crm-pro/COMPLETE_MADHUBAN_FIX.sql', alterSQL);
    
    console.log('\n✅ Complete schema fix saved to: COMPLETE_MADHUBAN_FIX.sql');
    console.log('\n🎯 COPY THIS SQL TO MADHUBAN SUPABASE:');
    console.log(alterSQL);
    
  } catch (error) {
    console.error('❌ Schema export failed:', error.message);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  getPatientSchema()
    .then(() => process.exit(0))
    .catch(err => {
      console.error('Fatal error:', err);
      process.exit(1);
    });
}
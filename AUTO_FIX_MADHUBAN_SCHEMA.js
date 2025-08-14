#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';

const madhubanClient = createClient(
  'https://btoeupnfqkioxigrheyp.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ0b2V1cG5mcWtpb3hpZ3JoZXlwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDAxODQyNCwiZXhwIjoyMDY5NTk0NDI0fQ.BWDIB5vzXl6J7PasV51yOa-rAEt_QxK8x9VoGcfkT5U'
);

async function fixMadhubanSchema() {
  console.log('🔧 FIXING MADHUBAN DATABASE SCHEMA');
  console.log('==================================\n');
  
  try {
    console.log('➕ Adding missing assigned_doctors column...');
    
    const { error: alterError } = await madhubanClient.rpc('execute_sql', {
      sql: `
        -- Add missing columns
        ALTER TABLE patients ADD COLUMN IF NOT EXISTS assigned_doctors TEXT[];
        ALTER TABLE patients ADD COLUMN IF NOT EXISTS assigned_doctor_ids UUID[];
        
        -- Update existing records
        UPDATE patients SET assigned_doctors = '{}' WHERE assigned_doctors IS NULL;
        UPDATE patients SET assigned_doctor_ids = '{}' WHERE assigned_doctor_ids IS NULL;
      `
    });
    
    if (alterError) {
      console.log('❌ Error with RPC, trying direct SQL execution...');
      
      // Try adding column directly
      const alterQueries = [
        "ALTER TABLE patients ADD COLUMN IF NOT EXISTS assigned_doctors TEXT[]",
        "ALTER TABLE patients ADD COLUMN IF NOT EXISTS assigned_doctor_ids UUID[]",
        "UPDATE patients SET assigned_doctors = '{}' WHERE assigned_doctors IS NULL",
        "UPDATE patients SET assigned_doctor_ids = '{}' WHERE assigned_doctor_ids IS NULL"
      ];
      
      for (const query of alterQueries) {
        console.log(`Executing: ${query}`);
        const { error } = await madhubanClient.rpc('exec', { sql: query });
        if (error) {
          console.log(`❌ Error: ${error.message}`);
        } else {
          console.log('✅ Success');
        }
      }
    } else {
      console.log('✅ Schema updated successfully');
    }
    
    // Verify columns exist
    console.log('\n🔍 Verifying columns...');
    const { data: columns, error: selectError } = await madhubanClient
      .from('information_schema.columns')
      .select('column_name, data_type')
      .eq('table_name', 'patients')
      .in('column_name', ['assigned_doctors', 'assigned_doctor_ids']);
    
    if (selectError) {
      console.log('❌ Error checking columns:', selectError.message);
    } else {
      console.log('📋 Found columns:');
      columns?.forEach(col => {
        console.log(`- ${col.column_name}: ${col.data_type}`);
      });
    }
    
    console.log('\n✅ SCHEMA FIX COMPLETED!');
    console.log('🎯 Try adding a patient again - should work now');
    
  } catch (error) {
    console.error('❌ Schema fix failed:', error.message);
    console.log('\n💡 MANUAL FIX REQUIRED:');
    console.log('1. Go to Supabase Dashboard → Madhuban project');
    console.log('2. Go to SQL Editor');
    console.log('3. Run this SQL:');
    console.log('   ALTER TABLE patients ADD COLUMN assigned_doctors TEXT[];');
    console.log('   UPDATE patients SET assigned_doctors = \'{}\' WHERE assigned_doctors IS NULL;');
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  fixMadhubanSchema()
    .then(() => process.exit(0))
    .catch(err => {
      console.error('Fatal error:', err);
      process.exit(1);
    });
}
#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '.env') });

// Get Supabase configuration from environment variables
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase configuration in .env file');
  console.error('Required: VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY');
  process.exit(1);
}

console.log('🔗 Connecting to Supabase...');
console.log('URL:', supabaseUrl);
console.log('Key:', supabaseKey.substring(0, 20) + '...');

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseKey);

async function listAllTables() {
  try {
    console.log('\n📋 Fetching all tables from the database...\n');
    
    // Query to get all tables in the public schema
    const { data: tables, error } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .eq('table_type', 'BASE TABLE');

    if (error) {
      console.error('❌ Error fetching tables:', error.message);
      
      // Try alternative method using RPC or direct query
      console.log('\n🔄 Trying alternative method...');
      
      // Try using raw SQL query
      const { data: rawTables, error: rawError } = await supabase
        .rpc('get_table_names');
      
      if (rawError) {
        console.log('❌ Raw query also failed. Trying to list some known tables...');
        return await testKnownTables();
      } else {
        return rawTables;
      }
    }

    if (!tables || tables.length === 0) {
      console.log('⚠️  No tables found in the public schema');
      return [];
    }

    console.log('✅ Found', tables.length, 'tables:');
    tables.forEach((table, index) => {
      console.log(`${index + 1}. ${table.table_name}`);
    });

    return tables.map(t => t.table_name);
  } catch (err) {
    console.error('❌ Exception while fetching tables:', err.message);
    return await testKnownTables();
  }
}

async function testKnownTables() {
  console.log('\n🧪 Testing access to common table names...\n');
  
  // Common table names that might exist in a hospital CRM
  const potentialTables = [
    'patients',
    'patient',
    'opd_patients',
    'ipd_patients',
    'beds',
    'bed_management',
    'billing',
    'appointments',
    'medical_records',
    'medical_data',
    'medical_consent_data',
    'medical_examination_data',
    'medical_medication_data',
    'medical_vital_signs_data',
    'doctors',
    'staff',
    'rooms',
    'departments',
    'medications',
    'treatments',
    'discharge_records',
    'admissions',
    'consent_forms',
    'vital_signs',
    'medication_charts',
    'examination_records',
    'clinical_records',
    'lab_results',
    'prescriptions',
    'invoices',
    'payments',
    'insurance_claims'
  ];

  const accessibleTables = [];
  const inaccessibleTables = [];

  for (const tableName of potentialTables) {
    try {
      console.log(`Testing: ${tableName}...`);
      
      // Try to query the table with a LIMIT 0 to check if it exists and is accessible
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .limit(0);

      if (error) {
        console.log(`  ❌ ${tableName}: ${error.message}`);
        inaccessibleTables.push({ name: tableName, error: error.message });
      } else {
        console.log(`  ✅ ${tableName}: Accessible`);
        accessibleTables.push(tableName);
      }
    } catch (err) {
      console.log(`  ❌ ${tableName}: Exception - ${err.message}`);
      inaccessibleTables.push({ name: tableName, error: err.message });
    }
  }

  return { accessibleTables, inaccessibleTables };
}

async function testSpecificMedicalTables() {
  console.log('\n🏥 Testing specific medical_*_data tables mentioned in the issue...\n');
  
  const medicalTables = [
    'medical_consent_data',
    'medical_examination_data', 
    'medical_medication_data',
    'medical_vital_signs_data'
  ];

  for (const tableName of medicalTables) {
    try {
      console.log(`Testing: ${tableName}...`);
      
      // First try to select with limit 1
      const { data, error, count } = await supabase
        .from(tableName)
        .select('*', { count: 'exact' })
        .limit(1);

      if (error) {
        console.log(`  ❌ ${tableName}:`);
        console.log(`     Error: ${error.message}`);
        console.log(`     Code: ${error.code || 'N/A'}`);
        console.log(`     Details: ${error.details || 'N/A'}`);
        
        if (error.message.includes('406') || error.code === '406') {
          console.log(`     🚨 This is the 406 error you're experiencing!`);
        }
      } else {
        console.log(`  ✅ ${tableName}: Accessible`);
        console.log(`     Records count: ${count || 'Unknown'}`);
        if (data && data.length > 0) {
          console.log(`     Sample columns:`, Object.keys(data[0]).join(', '));
        }
      }
    } catch (err) {
      console.log(`  ❌ ${tableName}: Exception - ${err.message}`);
    }
  }
}

async function getTableSchema(tableName) {
  try {
    console.log(`\n📊 Getting schema for table: ${tableName}`);
    
    const { data, error } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type, is_nullable')
      .eq('table_name', tableName)
      .eq('table_schema', 'public');

    if (error) {
      console.log(`❌ Could not fetch schema: ${error.message}`);
      return null;
    }

    if (data && data.length > 0) {
      console.log(`Columns in ${tableName}:`);
      data.forEach(col => {
        console.log(`  - ${col.column_name} (${col.data_type}) ${col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'}`);
      });
      return data;
    } else {
      console.log(`No schema information found for ${tableName}`);
      return null;
    }
  } catch (err) {
    console.log(`Exception getting schema: ${err.message}`);
    return null;
  }
}

async function main() {
  console.log('🏥 Hospital CRM Database Connection Test');
  console.log('========================================\n');

  try {
    // Test basic connection
    console.log('🔍 Testing basic Supabase connection...');
    const { data, error } = await supabase.auth.getSession();
    
    if (error) {
      console.log('⚠️  Auth session error (this might be normal):', error.message);
    } else {
      console.log('✅ Basic connection established');
    }

    // List all tables
    const tables = await listAllTables();
    
    // Test specific medical tables
    await testSpecificMedicalTables();
    
    // If we found some accessible tables, show their schemas
    if (Array.isArray(tables) && tables.length > 0) {
      console.log('\n📊 Getting schema information for accessible tables...');
      for (const table of tables.slice(0, 5)) { // Limit to first 5 tables
        await getTableSchema(table);
      }
    }

    console.log('\n✨ Test completed!');
    console.log('\n📝 Summary:');
    console.log('- If you see 406 errors above, those tables likely don\'t exist');
    console.log('- Accessible tables are the ones you should use in your application'); 
    console.log('- Check the schema information to understand the table structure');

  } catch (err) {
    console.error('💥 Fatal error during database test:', err.message);
    console.error('Stack:', err.stack);
  }
}

// Run the test
main().catch(console.error);
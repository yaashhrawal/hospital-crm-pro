// Test script to identify 406 errors in Complete Patient Record tables
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Test patient ID (using format from error message)
const testPatientId = 'P000917';

// Tables that should work (according to user)
const workingTables = [
  'custom_doctors',
  'custom_complaints', 
  'patient_chief_complaints'
];

// Tables that return 406 errors (according to user)
const failingTables = [
  'patient_high_risk',
  'patient_examination', 
  'patient_investigation',
  'patient_enhanced_prescription',
  'patient_diagnosis',
  'patient_record_summary'
];

async function testTableQuery(tableName, patientId) {
  console.log(`\n🔍 Testing table: ${tableName}`);
  
  try {
    const { data, error, status, statusText } = await supabase
      .from(tableName)
      .select('*')
      .eq('patient_id', patientId);

    if (error) {
      console.log(`❌ Error for ${tableName}:`, {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint
      });
      return { table: tableName, status: 'error', error };
    }

    console.log(`✅ Success for ${tableName}:`, {
      recordCount: data?.length || 0,
      status: status,
      statusText: statusText
    });
    
    return { table: tableName, status: 'success', data, recordCount: data?.length || 0 };
    
  } catch (err) {
    console.log(`💥 Exception for ${tableName}:`, err.message);
    return { table: tableName, status: 'exception', error: err };
  }
}

async function testTableExists(tableName) {
  console.log(`\n📋 Testing if table exists: ${tableName}`);
  
  try {
    // Try to get table structure
    const { data, error } = await supabase.rpc('get_table_info', { table_name: tableName });
    
    if (error) {
      console.log(`❌ Table info error for ${tableName}:`, error.message);
      
      // Alternative: try a simple select with limit 0
      const { error: selectError } = await supabase
        .from(tableName)
        .select('*')
        .limit(0);
        
      if (selectError) {
        if (selectError.code === '42P01') {
          console.log(`❌ Table ${tableName} does not exist (42P01)`);
          return { table: tableName, exists: false, error: selectError };
        }
        console.log(`❌ Other error for ${tableName}:`, selectError);
        return { table: tableName, exists: 'unknown', error: selectError };
      }
      
      console.log(`✅ Table ${tableName} exists (select worked)`);
      return { table: tableName, exists: true };
    }
    
    console.log(`✅ Table ${tableName} exists and has info`);
    return { table: tableName, exists: true, info: data };
    
  } catch (err) {
    console.log(`💥 Exception checking ${tableName}:`, err.message);
    return { table: tableName, exists: 'exception', error: err };
  }
}

async function testRLSPolicies(tableName) {
  console.log(`\n🔒 Testing RLS policies for: ${tableName}`);
  
  try {
    // Test without authentication
    const { data: anonData, error: anonError } = await supabase
      .from(tableName)
      .select('*')
      .limit(1);
      
    console.log(`Anonymous query result:`, {
      error: anonError?.message,
      dataCount: anonData?.length || 0
    });
    
    return {
      table: tableName,
      anonAccess: !anonError,
      anonError: anonError?.message
    };
    
  } catch (err) {
    console.log(`💥 Exception testing RLS for ${tableName}:`, err.message);
    return { table: tableName, rlsError: err.message };
  }
}

async function main() {
  console.log('🚀 Starting 406 Error Investigation');
  console.log('=====================================');
  console.log(`Testing with patient ID: ${testPatientId}`);
  
  const results = {
    tableExists: {},
    workingTables: {},
    failingTables: {},
    rlsPolicies: {}
  };
  
  // Test if all tables exist
  console.log('\n\n📋 STEP 1: Testing Table Existence');
  console.log('================================');
  
  const allTables = [...workingTables, ...failingTables];
  
  for (const table of allTables) {
    const result = await testTableExists(table);
    results.tableExists[table] = result;
  }
  
  // Test working tables
  console.log('\n\n✅ STEP 2: Testing Working Tables');  
  console.log('===============================');
  
  for (const table of workingTables) {
    const result = await testTableQuery(table, testPatientId);
    results.workingTables[table] = result;
  }
  
  // Test failing tables
  console.log('\n\n❌ STEP 3: Testing Failing Tables');
  console.log('===============================');
  
  for (const table of failingTables) {
    const result = await testTableQuery(table, testPatientId);
    results.failingTables[table] = result;
  }
  
  // Test RLS policies
  console.log('\n\n🔒 STEP 4: Testing RLS Policies');
  console.log('=============================');
  
  for (const table of allTables) {
    const result = await testRLSPolicies(table);
    results.rlsPolicies[table] = result;
  }
  
  // Summary
  console.log('\n\n📊 SUMMARY OF RESULTS');
  console.log('===================');
  
  console.log('\nTable Existence:');
  Object.entries(results.tableExists).forEach(([table, result]) => {
    const exists = result.exists === true ? '✅ EXISTS' : 
                   result.exists === false ? '❌ MISSING' : '❓ UNKNOWN';
    console.log(`  ${table}: ${exists}`);
  });
  
  console.log('\nWorking Tables Results:');
  Object.entries(results.workingTables).forEach(([table, result]) => {
    const status = result.status === 'success' ? `✅ SUCCESS (${result.recordCount} records)` : 
                   `❌ ${result.status.toUpperCase()}`;
    console.log(`  ${table}: ${status}`);
  });
  
  console.log('\nFailing Tables Results:');
  Object.entries(results.failingTables).forEach(([table, result]) => {
    const status = result.status === 'success' ? `✅ SUCCESS (${result.recordCount} records)` : 
                   `❌ ${result.status.toUpperCase()}`;
    console.log(`  ${table}: ${status}`);
    if (result.error) {
      console.log(`    Error: ${result.error.message || result.error}`);
    }
  });
  
  console.log('\nRLS Policy Results:');
  Object.entries(results.rlsPolicies).forEach(([table, result]) => {
    const access = result.anonAccess ? '✅ ACCESSIBLE' : '❌ BLOCKED';
    console.log(`  ${table}: ${access}`);
    if (result.anonError) {
      console.log(`    Error: ${result.anonError}`);
    }
  });
  
  // Analysis
  console.log('\n\n🔍 ANALYSIS');
  console.log('=========');
  
  const missingTables = Object.entries(results.tableExists)
    .filter(([table, result]) => result.exists === false)
    .map(([table]) => table);
    
  if (missingTables.length > 0) {
    console.log(`❌ Missing tables: ${missingTables.join(', ')}`);
  }
  
  const workingButShouldFail = Object.entries(results.failingTables)
    .filter(([table, result]) => result.status === 'success')
    .map(([table]) => table);
    
  if (workingButShouldFail.length > 0) {
    console.log(`🤔 Tables that work but were expected to fail: ${workingButShouldFail.join(', ')}`);
  }
  
  const failingButShouldWork = Object.entries(results.workingTables)
    .filter(([table, result]) => result.status !== 'success')
    .map(([table]) => table);
    
  if (failingButShouldWork.length > 0) {
    console.log(`🚨 Tables that fail but were expected to work: ${failingButShouldWork.join(', ')}`);
  }
  
  console.log('\n🏁 Investigation complete!');
}

main().catch(console.error);
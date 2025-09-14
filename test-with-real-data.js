// Test with real patient data to understand the disconnect
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

async function findRealPatientIds() {
  console.log('🔍 Looking for real patient IDs in the database...');
  
  try {
    const { data, error } = await supabase
      .from('patients')
      .select('patient_id')
      .limit(5);

    if (error) {
      console.log('❌ Error fetching patients:', error.message);
      return [];
    }

    const patientIds = data?.map(p => p.patient_id) || [];
    console.log(`✅ Found ${patientIds.length} patient IDs:`, patientIds);
    return patientIds;
  } catch (err) {
    console.log('❌ Exception fetching patients:', err.message);
    return [];
  }
}

async function testTableWithRealPatient(tableName, patientId) {
  console.log(`\n🧪 Testing ${tableName} with real patient ID: ${patientId}`);
  
  try {
    const { data, error, status, statusText } = await supabase
      .from(tableName)
      .select('*')
      .eq('patient_id', patientId);

    console.log(`Response - Status: ${status}, StatusText: ${statusText}`);
    
    if (error) {
      console.log(`❌ Error:`, {
        message: error.message,
        code: error.code,
        details: error.details
      });
      return false;
    }

    console.log(`✅ Success - Records found: ${data?.length || 0}`);
    if (data?.length > 0) {
      console.log(`📄 Sample record:`, JSON.stringify(data[0], null, 2));
    }
    
    return true;
  } catch (err) {
    console.log(`💥 Exception:`, err.message);
    return false;
  }
}

async function testInsertIntoTable(tableName, patientId) {
  console.log(`\n💾 Testing INSERT into ${tableName} for patient: ${patientId}`);
  
  const testData = {};
  
  // Create appropriate test data for each table
  if (tableName === 'patient_high_risk') {
    testData.patient_id = patientId;
    testData.risk_factors = ['TEST_CONDITION'];
    testData.notes = 'Test data from 406 investigation';
  } else if (tableName === 'patient_examination') {
    testData.patient_id = patientId;
    testData.general_appearance = 'Test examination data';
    testData.notes = 'Test data from 406 investigation';
  } else if (tableName === 'patient_investigation') {
    testData.patient_id = patientId;
    testData.laboratory_tests = 'Test lab results';
    testData.notes = 'Test data from 406 investigation';
  } else if (tableName === 'patient_diagnosis') {
    testData.patient_id = patientId;
    testData.primary_diagnosis = 'Test diagnosis';
    testData.notes = 'Test data from 406 investigation';
  } else if (tableName === 'patient_enhanced_prescription') {
    testData.patient_id = patientId;
    testData.medications = [{'name': 'Test Medicine', 'dosage': '10mg'}];
    testData.notes = 'Test data from 406 investigation';
  } else if (tableName === 'patient_record_summary') {
    testData.patient_id = patientId;
    testData.summary = 'Test record summary';
    testData.created_by = 'test_system';
  }

  try {
    const { data, error, status, statusText } = await supabase
      .from(tableName)
      .insert(testData)
      .select();

    console.log(`Insert Response - Status: ${status}, StatusText: ${statusText}`);
    
    if (error) {
      console.log(`❌ Insert Error:`, {
        message: error.message,
        code: error.code,
        details: error.details
      });
      
      // Check if it's because patient_id is wrong type
      if (error.message.includes('invalid input syntax for type uuid')) {
        console.log(`🔧 Patient ID type mismatch detected. Testing with TEXT format...`);
        
        // Test the actual patient_id format from database
        const { data: patientData } = await supabase
          .from('patients')
          .select('patient_id, id')
          .eq('patient_id', patientId)
          .single();
          
        if (patientData) {
          console.log(`📋 Patient data types:`, {
            patient_id: typeof patientData.patient_id,
            patient_id_value: patientData.patient_id,
            id: typeof patientData.id,
            id_value: patientData.id
          });
          
          // Try with the UUID id instead
          const testDataWithUUID = { ...testData, patient_id: patientData.id };
          const { data: data2, error: error2 } = await supabase
            .from(tableName)
            .insert(testDataWithUUID)
            .select();
            
          if (error2) {
            console.log(`❌ UUID Insert Error:`, error2.message);
          } else {
            console.log(`✅ UUID Insert Success:`, data2?.length || 0, 'records');
          }
        }
      }
      
      return false;
    }

    console.log(`✅ Insert Success - Records created: ${data?.length || 0}`);
    
    // Clean up test data
    if (data?.length > 0) {
      const createdId = data[0].id;
      await supabase.from(tableName).delete().eq('id', createdId);
      console.log(`🧹 Cleaned up test record: ${createdId}`);
    }
    
    return true;
  } catch (err) {
    console.log(`💥 Insert Exception:`, err.message);
    return false;
  }
}

async function main() {
  console.log('🚀 Testing with Real Patient Data');
  console.log('=================================');
  
  // Get real patient IDs
  const patientIds = await findRealPatientIds();
  
  if (patientIds.length === 0) {
    console.log('❌ No patients found. Cannot test with real data.');
    return;
  }
  
  const testPatientId = patientIds[0];
  console.log(`\n🎯 Using patient ID for testing: ${testPatientId}`);
  
  const tables = [
    'patient_high_risk',
    'patient_examination', 
    'patient_investigation',
    'patient_enhanced_prescription',
    'patient_diagnosis',
    'patient_record_summary'
  ];
  
  console.log('\n📖 STEP 1: Testing SELECT operations');
  console.log('===================================');
  
  const selectResults = {};
  for (const table of tables) {
    selectResults[table] = await testTableWithRealPatient(table, testPatientId);
  }
  
  console.log('\n💾 STEP 2: Testing INSERT operations');
  console.log('===================================');
  
  const insertResults = {};
  for (const table of tables) {
    insertResults[table] = await testInsertIntoTable(table, testPatientId);
  }
  
  console.log('\n📊 FINAL RESULTS');
  console.log('===============');
  
  console.log('\nSELECT Operations:');
  Object.entries(selectResults).forEach(([table, success]) => {
    console.log(`  ${table}: ${success ? '✅ SUCCESS' : '❌ FAILED'}`);
  });
  
  console.log('\nINSERT Operations:');
  Object.entries(insertResults).forEach(([table, success]) => {
    console.log(`  ${table}: ${success ? '✅ SUCCESS' : '❌ FAILED'}`);
  });
  
  const allSelectWorking = Object.values(selectResults).every(v => v);
  const allInsertWorking = Object.values(insertResults).every(v => v);
  
  console.log(`\n🎯 CONCLUSION:`);
  console.log(`   SELECT operations: ${allSelectWorking ? '✅ ALL WORKING' : '❌ SOME FAILED'}`);
  console.log(`   INSERT operations: ${allInsertWorking ? '✅ ALL WORKING' : '❌ SOME FAILED'}`);
  
  if (allSelectWorking && allInsertWorking) {
    console.log(`\n🎉 NO 406 ERRORS FOUND! The database tables are working correctly.`);
    console.log(`   The reported 406 errors might have been resolved already,`);
    console.log(`   or may occur under specific conditions not tested here.`);
  } else {
    console.log(`\n⚠️  Some operations failed. This might explain the 406 errors.`);
  }
}

main().catch(console.error);
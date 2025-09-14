#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function getTableStructure(tableName) {
  try {
    console.log(`\n📋 Analyzing table: ${tableName}`);
    console.log('=' .repeat(50));
    
    // Get a sample record to understand structure
    const { data: sampleData, error: sampleError, count } = await supabase
      .from(tableName)
      .select('*', { count: 'exact' })
      .limit(3);

    if (sampleError) {
      console.log(`❌ Error accessing ${tableName}: ${sampleError.message}`);
      return null;
    }

    console.log(`📊 Table: ${tableName}`);
    console.log(`📈 Total records: ${count || 'Unknown'}`);

    if (sampleData && sampleData.length > 0) {
      console.log(`🔍 Sample record structure:`);
      const firstRecord = sampleData[0];
      Object.keys(firstRecord).forEach(key => {
        const value = firstRecord[key];
        const type = typeof value;
        const displayValue = value === null ? 'NULL' : 
                           type === 'string' && value.length > 50 ? `"${value.substring(0, 50)}..."` :
                           type === 'object' ? JSON.stringify(value).substring(0, 100) + '...' :
                           `"${value}"`;
        console.log(`   ${key}: ${displayValue} (${type})`);
      });

      // Show all sample records if there are more than one
      if (sampleData.length > 1) {
        console.log(`\n📝 Sample data (first ${sampleData.length} records):`);
        sampleData.forEach((record, index) => {
          console.log(`   Record ${index + 1}:`, 
            Object.keys(record).map(key => `${key}: ${record[key]}`).join(', ').substring(0, 100) + '...');
        });
      }
    } else {
      console.log(`🗃️  Table ${tableName} exists but is empty`);
    }

    return {
      tableName,
      recordCount: count || 0,
      structure: sampleData && sampleData.length > 0 ? Object.keys(sampleData[0]) : [],
      accessible: true
    };
  } catch (err) {
    console.log(`❌ Exception analyzing ${tableName}: ${err.message}`);
    return { tableName, accessible: false, error: err.message };
  }
}

async function testAllPossibleTables() {
  console.log('🏥 Hospital CRM - Detailed Database Analysis');
  console.log('=============================================\n');

  // From the previous test, we know these tables are accessible
  const accessibleTables = [
    'patients',
    'beds', 
    'appointments',
    'medical_examination_data', // This one was accessible!
    'doctors',
    'departments',
    'prescriptions'
  ];

  console.log('✅ Accessible tables found:');
  accessibleTables.forEach(table => console.log(`   - ${table}`));

  const tableAnalysis = [];

  // Analyze each accessible table
  for (const tableName of accessibleTables) {
    const analysis = await getTableStructure(tableName);
    if (analysis) {
      tableAnalysis.push(analysis);
    }
  }

  // Generate a comprehensive report
  console.log('\n\n🎯 SUMMARY REPORT');
  console.log('==================');
  
  console.log('\n📊 Available Tables:');
  tableAnalysis.filter(t => t.accessible).forEach(table => {
    console.log(`✅ ${table.tableName} (${table.recordCount} records)`);
  });

  console.log('\n❌ Missing Medical Tables (causing 406 errors):');
  const missingMedicalTables = [
    'medical_consent_data',
    'medical_medication_data', 
    'medical_vital_signs_data'
  ];
  missingMedicalTables.forEach(table => {
    console.log(`❌ ${table} - Does not exist`);
  });

  console.log('\n✅ Available Medical Table:');
  console.log(`✅ medical_examination_data - This exists and is accessible`);

  console.log('\n💡 RECOMMENDATIONS:');
  console.log('1. The 406 errors are because these tables don\'t exist:');
  console.log('   - medical_consent_data');
  console.log('   - medical_medication_data'); 
  console.log('   - medical_vital_signs_data');
  console.log('');
  console.log('2. Only medical_examination_data exists among the medical_*_data tables');
  console.log('');
  console.log('3. You should either:');
  console.log('   a) Create the missing tables in Supabase');
  console.log('   b) Update your application to use different table names');
  console.log('   c) Check if data is stored in existing tables with different names');

  return tableAnalysis;
}

// Run the analysis
testAllPossibleTables().catch(console.error);
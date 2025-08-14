#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const valantClient = createClient(
  'https://oghqwddhojnryovmfvzc.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9naHF3ZGRob2pucnlvdm1mdnpjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzExNDU0MSwiZXhwIjoyMDY4NjkwNTQxfQ.NYr_Q6dLcxeKMqKA3h4GN92xkHjLfZClVKRd30Epmvg'
);

async function analyzeValantDatabase() {
  console.log('🔍 ANALYZING COMPLETE VALANT DATABASE');
  console.log('===================================\n');
  
  try {
    // First, let's try to get table information using a different approach
    // We'll test with known tables first
    const knownTables = [
      'patients',
      'patient_transactions', 
      'doctors',
      'departments',
      'insurance_providers',
      'admissions',
      'prescriptions',
      'lab_tests',
      'appointments',
      'bills',
      'payments'
    ];

    console.log('🔍 CHECKING FOR EXISTING TABLES:');
    console.log('===============================');

    let existingTables = [];
    let migrationScript = `-- COMPLETE VALANT TO MADHUBAN DATABASE MIGRATION\n`;
    migrationScript += `-- Generated on: ${new Date().toISOString()}\n\n`;

    let dataInsertScript = `-- DATA INSERTION SCRIPT FOR MADHUBAN\n`;
    dataInsertScript += `-- Generated on: ${new Date().toISOString()}\n\n`;

    for (const tableName of knownTables) {
      try {
        const { count, error } = await valantClient
          .from(tableName)
          .select('*', { count: 'exact', head: true });

        if (!error) {
          existingTables.push(tableName);
          console.log(`✅ ${tableName} - ${count || 0} records`);

          // Get sample data to understand structure
          const { data: sampleData, error: sampleError } = await valantClient
            .from(tableName)
            .select('*')
            .limit(1);

          if (!sampleError && sampleData && sampleData.length > 0) {
            const sample = sampleData[0];
            const columns = Object.keys(sample);
            
            console.log(`   📋 Columns (${columns.length}):`, columns.join(', '));

            // Generate CREATE TABLE with proper types
            let createSQL = `-- Table: ${tableName}\n`;
            createSQL += `DROP TABLE IF EXISTS ${tableName} CASCADE;\n`;
            createSQL += `CREATE TABLE ${tableName} (\n`;
            
            columns.forEach((col, index) => {
              const value = sample[col];
              let sqlType = 'TEXT';
              
              if (col === 'id' || col.endsWith('_id')) {
                sqlType = 'UUID';
              } else if (col.includes('date') || col.includes('_at')) {
                sqlType = 'TIMESTAMPTZ';
              } else if (col.includes('amount') || col.includes('fee') || col.includes('total') || col.includes('balance')) {
                sqlType = 'NUMERIC(10,2)';
              } else if (col.includes('count') || col === 'age' || col === 'quantity') {
                sqlType = 'INTEGER';
              } else if (col.includes('active') || col.includes('required') || col.includes('paid') || col.includes('completed')) {
                sqlType = 'BOOLEAN';
              } else if (Array.isArray(value) || (typeof value === 'object' && value !== null)) {
                sqlType = 'JSONB';
              }
              
              createSQL += `  ${col} ${sqlType}`;
              if (index < columns.length - 1) {
                createSQL += ',\n';
              }
            });
            
            createSQL += '\n);\n\n';
            migrationScript += createSQL;

            // Get ALL data for this table
            if (count && count > 0) {
              const { data: allData, error: allDataError } = await valantClient
                .from(tableName)
                .select('*');

              if (!allDataError && allData && allData.length > 0) {
                dataInsertScript += `-- Data for ${tableName} (${allData.length} records)\n`;
                dataInsertScript += `DELETE FROM ${tableName};\n`;
                
                for (const record of allData) {
                  const columnNames = Object.keys(record);
                  const values = columnNames.map(col => {
                    const value = record[col];
                    if (value === null) return 'NULL';
                    if (typeof value === 'string') return `'${value.replace(/'/g, "''")}'`;
                    if (typeof value === 'boolean') return value.toString();
                    if (Array.isArray(value) || typeof value === 'object') {
                      return `'${JSON.stringify(value).replace(/'/g, "''")}'::jsonb`;
                    }
                    return value.toString();
                  });

                  dataInsertScript += `INSERT INTO ${tableName} (${columnNames.join(', ')}) VALUES (${values.join(', ')});\n`;
                }
                dataInsertScript += `\n`;
              }
            }
          }
        } else {
          console.log(`❌ ${tableName} - does not exist or no access`);
        }
      } catch (err) {
        console.log(`❌ ${tableName} - error: ${err.message}`);
      }
    }

    console.log(`\n📊 FOUND ${existingTables.length} TABLES WITH DATA`);
    console.log('='.repeat(50));

    // Save files
    fs.writeFileSync('/Users/mac/hospital-crm-pro/COMPLETE_VALANT_SCHEMA.sql', migrationScript);
    fs.writeFileSync('/Users/mac/hospital-crm-pro/COMPLETE_VALANT_DATA.sql', dataInsertScript);

    console.log('\n✅ COMPLETE DATABASE ANALYSIS FINISHED!');
    console.log('======================================');
    console.log('📄 Generated files:');
    console.log('  - COMPLETE_VALANT_SCHEMA.sql (recreates all table structures)');
    console.log('  - COMPLETE_VALANT_DATA.sql (migrates ALL data)');
    
    console.log('\n🎯 MIGRATION STEPS:');
    console.log('1. Run COMPLETE_VALANT_SCHEMA.sql in Madhuban Supabase SQL Editor');
    console.log('2. Run COMPLETE_VALANT_DATA.sql in Madhuban Supabase SQL Editor');
    console.log('3. All Valant data will be replicated in Madhuban');
    console.log('4. Manually delete unwanted records as needed');

  } catch (error) {
    console.error('❌ Analysis failed:', error.message);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  analyzeValantDatabase()
    .then(() => process.exit(0))
    .catch(err => {
      console.error('Fatal error:', err);
      process.exit(1);
    });
}
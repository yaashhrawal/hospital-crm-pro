#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const valantClient = createClient(
  'https://oghqwddhojnryovmfvzc.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9naHF3ZGRob2pucnlvdm1mdnpjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzExNDU0MSwiZXhwIjoyMDY4NjkwNTQxfQ.NYr_Q6dLcxeKMqKA3h4GN92xkHjLfZClVKRd30Epmvg'
);

function getCorrectDataType(columnName, sampleValue) {
  // Check actual data to determine correct type
  if (sampleValue === null) return 'TEXT';
  
  const stringValue = String(sampleValue);
  
  // UUID pattern check - must be exactly 36 chars with hyphens in right places
  const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (uuidPattern.test(stringValue)) {
    return 'UUID';
  }
  
  // Date/timestamp patterns
  if (columnName.includes('date') || columnName.includes('_at')) {
    if (stringValue.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)) {
      return 'TIMESTAMPTZ';
    } else if (stringValue.match(/^\d{4}-\d{2}-\d{2}$/)) {
      return 'DATE';
    }
  }
  
  // Numeric patterns
  if (columnName.includes('amount') || columnName.includes('fee') || columnName.includes('total') || columnName.includes('balance')) {
    if (!isNaN(parseFloat(stringValue))) {
      return 'NUMERIC(10,2)';
    }
  }
  
  // Integer patterns
  if (columnName === 'age' || columnName.includes('count') || columnName === 'quantity') {
    if (!isNaN(parseInt(stringValue)) && stringValue.indexOf('.') === -1) {
      return 'INTEGER';
    }
  }
  
  // Boolean patterns
  if (typeof sampleValue === 'boolean') {
    return 'BOOLEAN';
  }
  
  // JSON/Array patterns
  if (Array.isArray(sampleValue) || (typeof sampleValue === 'object' && sampleValue !== null)) {
    return 'JSONB';
  }
  
  // Default to TEXT
  return 'TEXT';
}

async function generateCorrectedMigration() {
  console.log('🔧 GENERATING CORRECTED MIGRATION WITH PROPER DATA TYPES');
  console.log('=====================================================\n');
  
  try {
    const knownTables = ['patients', 'patient_transactions', 'doctors', 'departments'];

    let migrationScript = `-- CORRECTED VALANT TO MADHUBAN DATABASE MIGRATION\n`;
    migrationScript += `-- Generated on: ${new Date().toISOString()}\n`;
    migrationScript += `-- Fixed data type mapping based on actual data\n\n`;

    let dataInsertScript = `-- CORRECTED DATA INSERTION SCRIPT FOR MADHUBAN\n`;
    dataInsertScript += `-- Generated on: ${new Date().toISOString()}\n\n`;

    for (const tableName of knownTables) {
      console.log(`🔍 ANALYZING TABLE: ${tableName}`);
      
      const { data: sampleData, error } = await valantClient
        .from(tableName)
        .select('*')
        .limit(5);

      if (error || !sampleData || sampleData.length === 0) {
        console.log(`❌ No data in ${tableName}, skipping...`);
        continue;
      }

      const sample = sampleData[0];
      const columns = Object.keys(sample);
      
      console.log(`📋 Analyzing ${columns.length} columns...`);

      // Generate CREATE TABLE with CORRECT types based on actual data
      let createSQL = `-- Table: ${tableName}\n`;
      createSQL += `DROP TABLE IF EXISTS ${tableName} CASCADE;\n`;
      createSQL += `CREATE TABLE ${tableName} (\n`;
      
      columns.forEach((col, index) => {
        const sampleValue = sample[col];
        const dataType = getCorrectDataType(col, sampleValue);
        
        console.log(`  ${col}: ${typeof sampleValue} -> ${dataType} (sample: ${JSON.stringify(sampleValue)?.substring(0, 30)})`);
        
        createSQL += `  ${col} ${dataType}`;
        if (index < columns.length - 1) {
          createSQL += ',\n';
        }
      });
      
      createSQL += '\n);\n\n';
      migrationScript += createSQL;

      // Get ALL data for this table
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
            return `'${value}'`;
          });

          dataInsertScript += `INSERT INTO ${tableName} (${columnNames.join(', ')}) VALUES (${values.join(', ')});\n`;
        }
        dataInsertScript += `\n`;
        console.log(`✅ Generated ${allData.length} INSERT statements for ${tableName}`);
      }
    }

    // Save corrected files
    fs.writeFileSync('/Users/mac/hospital-crm-pro/CORRECTED_VALANT_SCHEMA.sql', migrationScript);
    fs.writeFileSync('/Users/mac/hospital-crm-pro/CORRECTED_VALANT_DATA.sql', dataInsertScript);

    console.log('\n✅ CORRECTED MIGRATION FILES GENERATED!');
    console.log('=====================================');
    console.log('📄 New corrected files:');
    console.log('  - CORRECTED_VALANT_SCHEMA.sql (proper data types)');
    console.log('  - CORRECTED_VALANT_DATA.sql (compatible data)');
    
    console.log('\n🎯 USE THESE CORRECTED FILES:');
    console.log('1. Run CORRECTED_VALANT_SCHEMA.sql in Madhuban Supabase SQL Editor');
    console.log('2. Run CORRECTED_VALANT_DATA.sql in Madhuban Supabase SQL Editor');

  } catch (error) {
    console.error('❌ Correction failed:', error.message);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  generateCorrectedMigration()
    .then(() => process.exit(0))
    .catch(err => {
      console.error('Fatal error:', err);
      process.exit(1);
    });
}
#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const valantClient = createClient(
  'https://oghqwddhojnryovmfvzc.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9naHF3ZGRob2pucnlvdm1mdnpjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzExNDU0MSwiZXhwIjoyMDY4NjkwNTQxfQ.NYr_Q6dLcxeKMqKA3h4GN92xkHjLfZClVKRd30Epmvg'
);

const madhubanClient = createClient(
  'https://btoeupnfqkioxigrheyp.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ0b2V1cG5mcWtpb3hpZ3JoZXlwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzExNDU0MSwiZXhwIjoyMDY4NjkwNTQxfQ.M_LzZ_eXmKJSf6L8oJgvJJ7fVcHv4ZnNeJqsGJ_jxSk'
);

async function analyzeCompleteDatabase() {
  console.log('🔍 ANALYZING COMPLETE VALANT DATABASE');
  console.log('===================================\n');
  
  try {
    // Get all table names from information_schema
    const { data: tables, error: tablesError } = await valantClient
      .from('information_schema.tables')
      .select('table_name, table_type')
      .eq('table_schema', 'public')
      .neq('table_name', 'schema_migrations')
      .order('table_name');

    if (tablesError) {
      console.log('❌ Error getting tables:', tablesError.message);
      return;
    }

    console.log('📊 FOUND TABLES IN VALANT DATABASE:');
    console.log('==================================');
    tables.forEach((table, index) => {
      console.log(`${index + 1}. ${table.table_name} (${table.table_type})`);
    });

    let migrationScript = `-- COMPLETE VALANT TO MADHUBAN DATABASE MIGRATION\n`;
    migrationScript += `-- Generated on: ${new Date().toISOString()}\n`;
    migrationScript += `-- This script creates all tables and migrates all data\n\n`;

    let dataInsertScript = `-- DATA INSERTION SCRIPT FOR MADHUBAN\n`;
    dataInsertScript += `-- Generated on: ${new Date().toISOString()}\n\n`;

    // Analyze each table
    for (const table of tables) {
      const tableName = table.table_name;
      console.log(`\n📋 ANALYZING TABLE: ${tableName}`);
      console.log('='.repeat(30 + tableName.length));

      // Get table schema
      const { data: columns, error: columnsError } = await valantClient
        .from('information_schema.columns')
        .select('column_name, data_type, is_nullable, column_default, character_maximum_length, numeric_precision, numeric_scale')
        .eq('table_name', tableName)
        .order('ordinal_position');

      if (columnsError) {
        console.log(`❌ Error getting columns for ${tableName}:`, columnsError.message);
        continue;
      }

      console.log(`📝 COLUMNS (${columns.length}):`);
      columns.forEach((col, index) => {
        console.log(`  ${index + 1}. ${col.column_name} - ${col.data_type}${col.character_maximum_length ? `(${col.character_maximum_length})` : ''}${col.numeric_precision ? `(${col.numeric_precision},${col.numeric_scale})` : ''} ${col.is_nullable === 'NO' ? 'NOT NULL' : 'NULL'}`);
      });

      // Generate CREATE TABLE statement
      let createSQL = `-- Table: ${tableName}\n`;
      createSQL += `CREATE TABLE IF NOT EXISTS ${tableName} (\n`;
      
      columns.forEach((col, index) => {
        let columnDef = `  ${col.column_name} ${col.data_type}`;
        
        if (col.character_maximum_length) {
          columnDef += `(${col.character_maximum_length})`;
        } else if (col.numeric_precision) {
          columnDef += `(${col.numeric_precision}${col.numeric_scale ? `,${col.numeric_scale}` : ''})`;
        }
        
        if (col.column_default) {
          columnDef += ` DEFAULT ${col.column_default}`;
        }
        
        if (col.is_nullable === 'NO') {
          columnDef += ' NOT NULL';
        }
        
        createSQL += columnDef;
        if (index < columns.length - 1) {
          createSQL += ',\n';
        }
      });
      
      createSQL += '\n);\n\n';
      migrationScript += createSQL;

      // Get data count
      const { count, error: countError } = await valantClient
        .from(tableName)
        .select('*', { count: 'exact', head: true });

      if (countError) {
        console.log(`❌ Error counting records in ${tableName}:`, countError.message);
        continue;
      }

      console.log(`📊 RECORDS: ${count || 0}`);

      if (count && count > 0) {
        // Get sample data to understand structure
        const { data: sampleData, error: dataError } = await valantClient
          .from(tableName)
          .select('*')
          .limit(5);

        if (dataError) {
          console.log(`❌ Error getting sample data from ${tableName}:`, dataError.message);
          continue;
        }

        if (sampleData && sampleData.length > 0) {
          console.log(`📋 SAMPLE DATA STRUCTURE:`);
          const sample = sampleData[0];
          Object.keys(sample).forEach(key => {
            const value = sample[key];
            const type = Array.isArray(value) ? 'ARRAY' : typeof value;
            console.log(`    ${key}: ${type} = ${JSON.stringify(value)?.substring(0, 50)}${JSON.stringify(value)?.length > 50 ? '...' : ''}`);
          });

          // Get ALL data for migration
          const { data: allData, error: allDataError } = await valantClient
            .from(tableName)
            .select('*');

          if (allDataError) {
            console.log(`❌ Error getting all data from ${tableName}:`, allDataError.message);
            continue;
          }

          if (allData && allData.length > 0) {
            // Generate INSERT statements
            dataInsertScript += `-- Data for table: ${tableName} (${allData.length} records)\n`;
            dataInsertScript += `DELETE FROM ${tableName}; -- Clear existing data\n`;
            
            for (const record of allData) {
              const columnNames = Object.keys(record);
              const values = columnNames.map(col => {
                const value = record[col];
                if (value === null) return 'NULL';
                if (typeof value === 'string') return `'${value.replace(/'/g, "''")}'`;
                if (typeof value === 'boolean') return value.toString();
                if (Array.isArray(value) || typeof value === 'object') return `'${JSON.stringify(value).replace(/'/g, "''")}'::jsonb`;
                return value.toString();
              });

              dataInsertScript += `INSERT INTO ${tableName} (${columnNames.join(', ')}) VALUES (${values.join(', ')});\n`;
            }
            dataInsertScript += `\n`;
          }
        }
      }
    }

    // Save migration scripts
    fs.writeFileSync('/Users/mac/hospital-crm-pro/COMPLETE_VALANT_SCHEMA.sql', migrationScript);
    fs.writeFileSync('/Users/mac/hospital-crm-pro/COMPLETE_VALANT_DATA.sql', dataInsertScript);

    console.log('\n✅ ANALYSIS COMPLETE!');
    console.log('=====================');
    console.log('📄 Files generated:');
    console.log('  - COMPLETE_VALANT_SCHEMA.sql (table structures)');
    console.log('  - COMPLETE_VALANT_DATA.sql (all data)');
    
    console.log('\n🎯 NEXT STEPS:');
    console.log('1. Run COMPLETE_VALANT_SCHEMA.sql in Madhuban Supabase SQL Editor');
    console.log('2. Run COMPLETE_VALANT_DATA.sql in Madhuban Supabase SQL Editor');
    console.log('3. Verify all data migrated successfully');
    console.log('4. Manually clean up unwanted data as needed');

  } catch (error) {
    console.error('❌ Analysis failed:', error.message);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  analyzeCompleteDatabase()
    .then(() => process.exit(0))
    .catch(err => {
      console.error('Fatal error:', err);
      process.exit(1);
    });
}
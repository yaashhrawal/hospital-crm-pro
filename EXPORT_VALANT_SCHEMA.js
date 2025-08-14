#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';

const valantClient = createClient(
  'https://oghqwddhojnryovmfvzc.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9naHF3ZGRob2pucnlvdm1mdnpjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzExNDU0MSwiZXhwIjoyMDY5NTk0NDI0fQ.NYr_Q6dLcxeKMqKA3h4GN92xkHjLfZClVKRd30Epmvg'
);

async function exportValantSchema() {
  console.log('📋 EXPORTING EXACT VALANT PATIENTS TABLE SCHEMA');
  console.log('==============================================\n');
  
  try {
    // Get exact column structure from Valant database
    const { data: columns, error } = await valantClient
      .from('information_schema.columns')
      .select('column_name, data_type, is_nullable, column_default, character_maximum_length, numeric_precision, numeric_scale')
      .eq('table_name', 'patients')
      .order('ordinal_position');
    
    if (error) {
      console.log('❌ Error getting schema:', error.message);
      return;
    }
    
    console.log('📊 VALANT PATIENTS TABLE COLUMNS:');
    console.log('=================================');
    
    let createTableSQL = 'CREATE TABLE IF NOT EXISTS patients_new (\n';
    let alterTableSQL = '';
    
    columns.forEach((col, index) => {
      console.log(`${index + 1}. ${col.column_name} - ${col.data_type}${col.character_maximum_length ? `(${col.character_maximum_length})` : ''}${col.numeric_precision ? `(${col.numeric_precision},${col.numeric_scale})` : ''} ${col.is_nullable === 'NO' ? 'NOT NULL' : 'NULL'}`);
      
      // Build CREATE TABLE statement
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
      
      createTableSQL += columnDef;
      if (index < columns.length - 1) {
        createTableSQL += ',\n';
      }
      
      // Build ALTER TABLE statements
      alterTableSQL += `ALTER TABLE patients ADD COLUMN IF NOT EXISTS ${col.column_name} ${col.data_type}`;
      if (col.character_maximum_length) {
        alterTableSQL += `(${col.character_maximum_length})`;
      } else if (col.numeric_precision) {
        alterTableSQL += `(${col.numeric_precision}${col.numeric_scale ? `,${col.numeric_scale}` : ''})`;
      }
      if (col.column_default) {
        alterTableSQL += ` DEFAULT ${col.column_default}`;
      }
      alterTableSQL += ';\n';
    });
    
    createTableSQL += '\n);';
    
    console.log('\n📄 COMPLETE CREATE TABLE SQL:');
    console.log('============================');
    console.log(createTableSQL);
    
    console.log('\n📄 ALTER TABLE SQL FOR MADHUBAN:');
    console.log('================================');
    console.log(alterTableSQL);
    
    console.log('\n💾 Saving to files...');
    
    // Save to files
    const fs = await import('fs');
    fs.writeFileSync('/Users/mac/hospital-crm-pro/VALANT_PATIENTS_SCHEMA.sql', createTableSQL);
    fs.writeFileSync('/Users/mac/hospital-crm-pro/MADHUBAN_ALTER_PATIENTS.sql', alterTableSQL);
    
    console.log('✅ Schema exported to files:');
    console.log('- VALANT_PATIENTS_SCHEMA.sql');
    console.log('- MADHUBAN_ALTER_PATIENTS.sql');
    
    console.log('\n🎯 NEXT STEPS:');
    console.log('1. Copy MADHUBAN_ALTER_PATIENTS.sql content');
    console.log('2. Run it in Madhuban Supabase SQL Editor');
    console.log('3. This will add ALL missing columns');
    
  } catch (error) {
    console.error('❌ Export failed:', error.message);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  exportValantSchema()
    .then(() => process.exit(0))
    .catch(err => {
      console.error('Fatal error:', err);
      process.exit(1);
    });
}
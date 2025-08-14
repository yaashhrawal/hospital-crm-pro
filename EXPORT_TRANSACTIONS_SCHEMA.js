#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';

const valantClient = createClient(
  'https://oghqwddhojnryovmfvzc.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9naHF3ZGRob2pucnlvdm1mdnpjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzExNDU0MSwiZXhwIjoyMDY4NjkwNTQxfQ.NYr_Q6dLcxeKMqKA3h4GN92xkHjLfZClVKRd30Epmvg'
);

async function exportTransactionsSchema() {
  console.log('📋 EXPORTING PATIENT_TRANSACTIONS TABLE SCHEMA');
  console.log('==============================================\n');
  
  try {
    // Get a sample transaction to see the structure
    const { data: sampleTransaction, error } = await valantClient
      .from('patient_transactions')
      .select('*')
      .limit(1);
    
    if (error) {
      console.log('❌ Error getting sample transaction:', error.message);
      return;
    }
    
    if (!sampleTransaction || sampleTransaction.length === 0) {
      console.log('❌ No transactions found in Valant database');
      return;
    }
    
    console.log('📊 VALANT PATIENT_TRANSACTIONS STRUCTURE:');
    console.log('========================================');
    
    const transaction = sampleTransaction[0];
    const columns = Object.keys(transaction);
    
    console.log(`Found ${columns.length} columns:`);
    columns.forEach((col, index) => {
      const value = transaction[col];
      const type = Array.isArray(value) ? 'ARRAY' : typeof value;
      console.log(`${index + 1}. ${col} (${type})`);
    });
    
    // Generate ALTER TABLE statements
    let alterSQL = `-- ALTER TABLE statements to add ALL missing columns to patient_transactions in Madhuban\n\n`;
    
    columns.forEach(col => {
      const value = transaction[col];
      let sqlType = 'TEXT';
      
      if (col.includes('id') && col !== 'transaction_id') {
        sqlType = 'UUID';
      } else if (col.includes('date') || col.includes('_at')) {
        sqlType = 'TIMESTAMPTZ';
      } else if (col.includes('amount') || col.includes('fee') || col.includes('rate') || col.includes('balance') || col.includes('total')) {
        sqlType = 'NUMERIC(10,2)';
      } else if (col.includes('count') || col === 'quantity') {
        sqlType = 'INTEGER';
      } else if (col.includes('active') || col.includes('paid') || col.includes('completed')) {
        sqlType = 'BOOLEAN';
      } else if (Array.isArray(value)) {
        sqlType = 'TEXT[]';
      }
      
      alterSQL += `ALTER TABLE patient_transactions ADD COLUMN IF NOT EXISTS ${col} ${sqlType};\n`;
    });
    
    console.log('\n📄 ALTER TABLE SQL FOR PATIENT_TRANSACTIONS:');
    console.log('==========================================');
    console.log(alterSQL);
    
    // Save to file
    const fs = await import('fs');
    fs.writeFileSync('/Users/mac/hospital-crm-pro/FIX_TRANSACTIONS_SCHEMA.sql', alterSQL);
    
    console.log('\n✅ Transactions schema fix saved to: FIX_TRANSACTIONS_SCHEMA.sql');
    console.log('\n🎯 COPY THIS SQL TO MADHUBAN SUPABASE:');
    console.log(alterSQL);
    
  } catch (error) {
    console.error('❌ Transactions schema export failed:', error.message);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  exportTransactionsSchema()
    .then(() => process.exit(0))
    .catch(err => {
      console.error('Fatal error:', err);
      process.exit(1);
    });
}
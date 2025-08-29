import pkg from 'pg';
const { Pool } = pkg;
import fs from 'fs';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: 'backend/.env' });

// Azure PostgreSQL connection
const pool = new Pool({
  host: process.env.AZURE_DB_HOST,
  port: process.env.AZURE_DB_PORT,
  database: process.env.AZURE_DB_NAME,
  user: process.env.AZURE_DB_USER,
  password: process.env.AZURE_DB_PASSWORD,
  ssl: {
    rejectUnauthorized: false
  }
});

// Case conversion mappings
const paymentModeMap = {
  'CASH': 'cash',
  'ONLINE': 'online', 
  'CARD': 'card',
  'UPI': 'upi',
  'INSURANCE': 'insurance',
  'ADJUSTMENT': 'adjustment'
};

const transactionTypeMap = {
  'ENTRY_FEE': 'entry_fee',
  'CONSULTATION': 'consultation',
  'SERVICE': 'service',
  'ADMISSION': 'admission',
  'MEDICINE': 'medicine',
  'DISCOUNT': 'discount',
  'REFUND': 'refund',
  'PROCEDURE': 'procedure',
  'LAB_TEST': 'lab_test',
  'IMAGING': 'imaging'
};

async function cleanupAndImportTransactions() {
  console.log('🧹 Cleaning up and properly importing transactions...');
  
  const client = await pool.connect();
  
  try {
    // Read the exported data
    const rawData = fs.readFileSync('supabase_real_data.json', 'utf8');
    const data = JSON.parse(rawData);
    
    const supabaseTransactionIds = new Set(data.patient_transactions.map(t => t.id));
    
    console.log(`Total transactions in Supabase: ${data.patient_transactions.length}`);
    console.log(`Expected transaction IDs: ${supabaseTransactionIds.size}`);
    
    // Get current transaction count
    const currentResult = await client.query('SELECT COUNT(*) as count FROM patient_transactions');
    const currentCount = parseInt(currentResult.rows[0].count);
    console.log(`Current transactions in Azure: ${currentCount}`);
    
    // Step 1: Clean up - keep only transactions that exist in Supabase data
    console.log('\n🧹 Step 1: Cleaning up duplicate/invalid transactions...');
    
    const supabaseIdsList = Array.from(supabaseTransactionIds);
    const placeholders = supabaseIdsList.map((_, i) => `$${i + 1}`).join(', ');
    
    const deleteResult = await client.query(
      `DELETE FROM patient_transactions WHERE id NOT IN (${placeholders})`,
      supabaseIdsList
    );
    
    console.log(`✅ Removed ${deleteResult.rowCount} duplicate/invalid transactions`);
    
    // Get admin user ID
    const adminResult = await client.query("SELECT id FROM users WHERE email = 'admin@hospital.com'");
    const adminUserId = adminResult.rows[0]?.id;
    
    // Get valid patient IDs
    const patientResult = await client.query('SELECT id FROM patients');
    const validPatientIds = new Set(patientResult.rows.map(row => row.id));
    
    // Step 2: Get remaining transactions after cleanup
    const remainingResult = await client.query('SELECT id FROM patient_transactions');
    const existingIds = new Set(remainingResult.rows.map(row => row.id));
    
    console.log(`\n📊 After cleanup: ${existingIds.size} transactions remain`);
    console.log(`Missing: ${data.patient_transactions.length - existingIds.size} transactions`);
    
    // Step 3: Import missing transactions
    console.log('\n📝 Step 2: Importing missing transactions...');
    
    let successCount = 0;
    let skippedCount = 0;
    let errorCount = 0;
    
    for (const transaction of data.patient_transactions) {
      try {
        // Skip if already exists
        if (existingIds.has(transaction.id)) {
          skippedCount++;
          continue;
        }
        
        // Skip if patient doesn't exist
        if (!validPatientIds.has(transaction.patient_id)) {
          console.log(`❌ Skipping transaction ${transaction.id} - invalid patient ${transaction.patient_id}`);
          errorCount++;
          continue;
        }
        
        // Fix case issues
        const paymentMode = paymentModeMap[transaction.payment_mode] || 'cash';
        const transactionType = transactionTypeMap[transaction.transaction_type] || 'consultation';
        const amount = transaction.amount || 0;
        
        const query = `
          INSERT INTO patient_transactions (
            id, patient_id, transaction_type, amount, payment_mode, 
            doctor_id, doctor_name, department, description, 
            transaction_date, created_at, created_by
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        `;
        
        await client.query(query, [
          transaction.id,
          transaction.patient_id,
          transactionType,
          amount,
          paymentMode,
          transaction.doctor_id,
          transaction.doctor_name,
          transaction.department || 'General Medicine',
          transaction.description || 'Medical service',
          transaction.transaction_date || transaction.created_at || new Date(),
          transaction.created_at || new Date(),
          adminUserId
        ]);
        
        successCount++;
        
        if (successCount <= 10) {
          console.log(`✅ Imported: ${transaction.id} - ${paymentMode} ${transactionType} - $${amount}`);
        } else if (successCount % 100 === 0) {
          console.log(`   Progress: ${successCount} transactions imported`);
        }
        
      } catch (error) {
        errorCount++;
        if (errorCount <= 5) {
          console.error(`❌ Error importing transaction ${transaction.id}:`, error.message);
        }
      }
    }
    
    // Final verification
    const finalResult = await client.query('SELECT COUNT(*) as count FROM patient_transactions');
    const finalCount = parseInt(finalResult.rows[0].count);
    
    // Verify all transactions are from Supabase
    const verifyResult = await client.query(
      `SELECT COUNT(*) as count FROM patient_transactions WHERE id = ANY($1)`,
      [supabaseIdsList]
    );
    const validCount = parseInt(verifyResult.rows[0].count);
    
    console.log(`\n📊 Final Results:`);
    console.log(`================`);
    console.log(`Successfully imported: ${successCount}`);
    console.log(`Skipped (existing): ${skippedCount}`);
    console.log(`Errors: ${errorCount}`);
    console.log(`\n🎯 Database State:`);
    console.log(`=================`);
    console.log(`Total transactions: ${finalCount}`);
    console.log(`Valid Supabase transactions: ${validCount}`);
    console.log(`Expected: ${data.patient_transactions.length}`);
    console.log(`Status: ${finalCount === data.patient_transactions.length && validCount === finalCount ? '✅ PERFECT' : finalCount === data.patient_transactions.length ? '✅ COMPLETE' : `⚠️  ${finalCount}/${data.patient_transactions.length}`}`);
    
    return { successCount, errorCount, finalCount, validCount };
    
  } finally {
    client.release();
  }
}

async function main() {
  try {
    console.log('🚀 Cleaning up and fixing transaction imports...');
    console.log('===============================================');
    
    const result = await cleanupAndImportTransactions();
    
    if (result.finalCount === 1000 && result.validCount === result.finalCount) {
      console.log('\n✅ Perfect! All 1000 transactions properly imported with no duplicates!');
    } else if (result.finalCount === 1000) {
      console.log('\n✅ All 1000 transactions imported successfully!');
    } else {
      console.log(`\n⚠️  ${result.finalCount}/1000 transactions imported`);
    }
    
  } catch (error) {
    console.error('❌ Cleanup failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main().catch(console.error);
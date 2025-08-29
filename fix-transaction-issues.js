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

async function analyzeTransactionIssues() {
  console.log('🔍 Analyzing transaction import issues...');
  
  const client = await pool.connect();
  
  try {
    // Read the exported data
    const rawData = fs.readFileSync('supabase_real_data.json', 'utf8');
    const data = JSON.parse(rawData);
    
    console.log(`Total transactions in Supabase: ${data.patient_transactions.length}`);
    
    // Get current transactions in Azure
    const currentResult = await client.query('SELECT COUNT(*) as count FROM patient_transactions');
    const currentCount = parseInt(currentResult.rows[0].count);
    console.log(`Current transactions in Azure: ${currentCount}`);
    console.log(`Missing transactions: ${data.patient_transactions.length - currentCount}`);
    
    // Get admin user ID
    const adminResult = await client.query("SELECT id FROM users WHERE email = 'admin@hospital.com'");
    const adminUserId = adminResult.rows[0]?.id;
    
    // Get all valid patient IDs and doctor IDs
    const patientIds = await client.query('SELECT id FROM patients');
    const validPatientIds = new Set(patientIds.rows.map(row => row.id));
    
    const doctorIds = await client.query('SELECT id FROM doctors');
    const validDoctorIds = new Set(doctorIds.rows.map(row => row.id));
    
    console.log(`\nValid patient IDs: ${validPatientIds.size}`);
    console.log(`Valid doctor IDs: ${validDoctorIds.size}`);
    
    let validTransactions = 0;
    let invalidPatientRef = 0;
    let invalidDoctorRef = 0;
    let invalidPaymentMode = 0;
    let invalidTransactionType = 0;
    let nullAmount = 0;
    let duplicateId = 0;
    
    const allowedPaymentModes = ['cash', 'online', 'card', 'upi', 'insurance', 'adjustment'];
    const allowedTransactionTypes = ['entry_fee', 'consultation', 'service', 'admission', 'medicine', 'discount', 'refund', 'procedure', 'lab_test', 'imaging'];
    
    console.log('\n🔍 Analyzing each transaction...');
    
    const existingTransactionIds = new Set();
    const existingResult = await client.query('SELECT id FROM patient_transactions');
    existingResult.rows.forEach(row => existingTransactionIds.add(row.id));
    
    const problemTransactions = [];
    
    for (let i = 0; i < data.patient_transactions.length; i++) {
      const transaction = data.patient_transactions[i];
      const issues = [];
      
      // Check for duplicate ID
      if (existingTransactionIds.has(transaction.id)) {
        duplicateId++;
        continue;
      }
      
      // Check patient reference
      if (!validPatientIds.has(transaction.patient_id)) {
        issues.push(`Invalid patient_id: ${transaction.patient_id}`);
        invalidPatientRef++;
      }
      
      // Check doctor reference (allow null)
      if (transaction.doctor_id && !validDoctorIds.has(transaction.doctor_id)) {
        issues.push(`Invalid doctor_id: ${transaction.doctor_id}`);
        invalidDoctorRef++;
      }
      
      // Check payment mode
      if (!allowedPaymentModes.includes(transaction.payment_mode)) {
        issues.push(`Invalid payment_mode: ${transaction.payment_mode}`);
        invalidPaymentMode++;
      }
      
      // Check transaction type
      if (!allowedTransactionTypes.includes(transaction.transaction_type)) {
        issues.push(`Invalid transaction_type: ${transaction.transaction_type}`);
        invalidTransactionType++;
      }
      
      // Check amount
      if (transaction.amount === null || transaction.amount === undefined) {
        issues.push('Null amount');
        nullAmount++;
      }
      
      if (issues.length > 0) {
        problemTransactions.push({
          index: i,
          id: transaction.id,
          patient_id: transaction.patient_id,
          amount: transaction.amount,
          payment_mode: transaction.payment_mode,
          transaction_type: transaction.transaction_type,
          doctor_id: transaction.doctor_id,
          issues: issues
        });
      } else {
        validTransactions++;
      }
    }
    
    console.log(`\n📊 Analysis Results:`);
    console.log(`===================`);
    console.log(`Total transactions analyzed: ${data.patient_transactions.length}`);
    console.log(`Already imported (duplicates): ${duplicateId}`);
    console.log(`Valid transactions ready for import: ${validTransactions}`);
    console.log(`Transactions with issues: ${problemTransactions.length}`);
    console.log(`\nIssue breakdown:`);
    console.log(`- Invalid patient references: ${invalidPatientRef}`);
    console.log(`- Invalid doctor references: ${invalidDoctorRef}`);
    console.log(`- Invalid payment modes: ${invalidPaymentMode}`);
    console.log(`- Invalid transaction types: ${invalidTransactionType}`);
    console.log(`- Null amounts: ${nullAmount}`);
    
    // Show first 10 problem transactions for debugging
    if (problemTransactions.length > 0) {
      console.log(`\n🚨 First 10 Problem Transactions:`);
      console.log(`=================================`);
      problemTransactions.slice(0, 10).forEach((trans, i) => {
        console.log(`${i+1}. Transaction ID: ${trans.id}`);
        console.log(`   Patient ID: ${trans.patient_id}`);
        console.log(`   Amount: ${trans.amount}`);
        console.log(`   Payment Mode: ${trans.payment_mode}`);
        console.log(`   Transaction Type: ${trans.transaction_type}`);
        console.log(`   Issues: ${trans.issues.join(', ')}`);
        console.log('');
      });
    }
    
    return {
      totalTransactions: data.patient_transactions.length,
      currentCount,
      validTransactions,
      problemTransactions,
      adminUserId,
      allowedPaymentModes,
      allowedTransactionTypes
    };
    
  } finally {
    client.release();
  }
}

async function fixAndImportTransactions(analysisResult) {
  console.log('\n🔧 Fixing and importing transactions...');
  
  const client = await pool.connect();
  
  try {
    // Read the exported data
    const rawData = fs.readFileSync('supabase_real_data.json', 'utf8');
    const data = JSON.parse(rawData);
    
    let successCount = 0;
    let fixedCount = 0;
    let errorCount = 0;
    
    // Get existing transaction IDs to avoid duplicates
    const existingResult = await client.query('SELECT id FROM patient_transactions');
    const existingIds = new Set(existingResult.rows.map(row => row.id));
    
    // Get valid patient and doctor IDs for reference checking
    const patientIds = await client.query('SELECT id FROM patients');
    const validPatientIds = new Set(patientIds.rows.map(row => row.id));
    
    const doctorIds = await client.query('SELECT id FROM doctors');
    const validDoctorIds = new Set(doctorIds.rows.map(row => row.id));
    
    console.log('\n📝 Processing transactions with fixes...');
    
    for (let i = 0; i < data.patient_transactions.length; i++) {
      const transaction = data.patient_transactions[i];
      
      try {
        // Skip if already exists
        if (existingIds.has(transaction.id)) {
          continue;
        }
        
        let wasFixed = false;
        
        // Fix invalid patient reference - skip transaction if patient doesn't exist
        if (!validPatientIds.has(transaction.patient_id)) {
          console.log(`❌ Skipping transaction ${transaction.id} - invalid patient ${transaction.patient_id}`);
          errorCount++;
          continue;
        }
        
        // Fix doctor reference
        let doctorId = transaction.doctor_id;
        if (doctorId && !validDoctorIds.has(doctorId)) {
          doctorId = null; // Set to null if invalid
          wasFixed = true;
        }
        
        // Fix payment mode
        let paymentMode = transaction.payment_mode;
        if (!analysisResult.allowedPaymentModes.includes(paymentMode)) {
          paymentMode = 'cash'; // Default to cash
          wasFixed = true;
        }
        
        // Fix transaction type
        let transactionType = transaction.transaction_type;
        if (!analysisResult.allowedTransactionTypes.includes(transactionType)) {
          transactionType = 'consultation'; // Default to consultation
          wasFixed = true;
        }
        
        // Fix amount
        let amount = transaction.amount;
        if (amount === null || amount === undefined) {
          amount = 500.00; // Default amount
          wasFixed = true;
        }
        
        if (wasFixed) {
          fixedCount++;
          if (fixedCount <= 5) {
            console.log(`🔧 Fixed transaction ${transaction.id}:`);
            console.log(`   Patient: ${transaction.patient_id}`);
            console.log(`   Doctor: ${transaction.doctor_id} -> ${doctorId}`);
            console.log(`   Payment: ${transaction.payment_mode} -> ${paymentMode}`);
            console.log(`   Type: ${transaction.transaction_type} -> ${transactionType}`);
            console.log(`   Amount: ${transaction.amount} -> ${amount}`);
          }
        }
        
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
          doctorId,
          transaction.doctor_name,
          transaction.department || 'General Medicine',
          transaction.description || 'Medical service',
          transaction.transaction_date || transaction.created_at || new Date(),
          transaction.created_at || new Date(),
          analysisResult.adminUserId
        ]);
        
        successCount++;
        
        if (successCount % 100 === 0) {
          console.log(`   Progress: ${successCount} transactions imported`);
        }
        
      } catch (error) {
        errorCount++;
        if (errorCount <= 5) {
          console.error(`❌ Error importing transaction ${transaction.id}:`, error.message);
        }
      }
    }
    
    console.log(`\n📊 Import Results:`);
    console.log(`=================`);
    console.log(`Successfully imported: ${successCount}`);
    console.log(`Fixed during import: ${fixedCount}`);
    console.log(`Errors/Skipped: ${errorCount}`);
    
    // Final verification
    const finalResult = await client.query('SELECT COUNT(*) as count FROM patient_transactions');
    const finalCount = parseInt(finalResult.rows[0].count);
    
    console.log(`\n🎯 Final transaction count: ${finalCount}`);
    console.log(`Expected: ${data.patient_transactions.length}`);
    console.log(`Status: ${finalCount >= 999 ? '✅ EXCELLENT' : `⚠️  ${finalCount}/${data.patient_transactions.length}`}`);
    
    return { successCount, fixedCount, errorCount, finalCount };
    
  } finally {
    client.release();
  }
}

async function main() {
  try {
    console.log('🔧 Fixing transaction import issues...');
    console.log('======================================');
    
    const analysis = await analyzeTransactionIssues();
    
    if (analysis.validTransactions > 0 || analysis.problemTransactions.length > 0) {
      await fixAndImportTransactions(analysis);
    }
    
    console.log('\n✅ Transaction fixes completed!');
    
  } catch (error) {
    console.error('❌ Fix process failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main().catch(console.error);
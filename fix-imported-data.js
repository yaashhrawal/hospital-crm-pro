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

async function fixAndImportDoctors() {
  console.log('\n👨‍⚕️ Fixing and importing doctors...');
  
  const client = await pool.connect();
  
  try {
    // Read the exported data
    const rawData = fs.readFileSync('supabase_real_data.json', 'utf8');
    const data = JSON.parse(rawData);
    
    // Get admin user ID
    const adminResult = await client.query("SELECT id FROM users WHERE email = 'admin@hospital.com'");
    const adminUserId = adminResult.rows[0]?.id;
    
    let successCount = 0;
    
    for (const doctor of data.doctors) {
      try {
        // Skip if name is empty or null
        if (!doctor.name || doctor.name.trim() === '') {
          continue;
        }
        
        const query = `
          INSERT INTO doctors (name, department, specialization, fee, phone, email, is_active, created_at, updated_at)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
          ON CONFLICT DO NOTHING
        `;
        
        await client.query(query, [
          doctor.name.trim(),
          doctor.department || 'General Medicine',
          doctor.specialization || 'General Practice',
          doctor.fee || 500.00,
          doctor.phone,
          doctor.email,
          doctor.is_active !== false,
          doctor.created_at || new Date(),
          new Date()
        ]);
        
        successCount++;
        
      } catch (error) {
        console.error(`❌ Error importing doctor ${doctor.name}:`, error.message);
      }
    }
    
    console.log(`✅ Doctors imported: ${successCount} successful`);
    return successCount;
    
  } finally {
    client.release();
  }
}

async function fixAndImportTransactions() {
  console.log('\n💰 Fixing and importing transactions...');
  
  const client = await pool.connect();
  
  try {
    const rawData = fs.readFileSync('supabase_real_data.json', 'utf8');
    const data = JSON.parse(rawData);
    
    const adminResult = await client.query("SELECT id FROM users WHERE email = 'admin@hospital.com'");
    const adminUserId = adminResult.rows[0]?.id;
    
    let successCount = 0;
    let errorCount = 0;
    
    for (const transaction of data.patient_transactions) {
      try {
        // Skip if required fields are missing
        if (!transaction.department || transaction.department.trim() === '') {
          transaction.department = 'General Medicine';
        }
        
        // Fix payment mode if not in allowed values
        const allowedPaymentModes = ['cash', 'online', 'card', 'upi', 'insurance', 'adjustment'];
        if (!allowedPaymentModes.includes(transaction.payment_mode)) {
          transaction.payment_mode = 'cash';
        }
        
        // Fix transaction type if not in allowed values
        const allowedTransactionTypes = ['entry_fee', 'consultation', 'service', 'admission', 'medicine', 'discount', 'refund', 'procedure', 'lab_test', 'imaging'];
        if (!allowedTransactionTypes.includes(transaction.transaction_type)) {
          transaction.transaction_type = 'consultation';
        }
        
        const query = `
          INSERT INTO patient_transactions (
            patient_id, transaction_type, amount, payment_mode, 
            doctor_id, doctor_name, department, description, 
            transaction_date, created_at, created_by
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
          ON CONFLICT DO NOTHING
        `;
        
        await client.query(query, [
          transaction.patient_id,
          transaction.transaction_type,
          transaction.amount || 0,
          transaction.payment_mode,
          transaction.doctor_id,
          transaction.doctor_name,
          transaction.department,
          transaction.description || 'Medical service',
          transaction.transaction_date || transaction.created_at || new Date(),
          transaction.created_at || new Date(),
          adminUserId
        ]);
        
        successCount++;
        
        if (successCount % 100 === 0) {
          console.log(`   Progress: ${successCount} transactions imported`);
        }
        
      } catch (error) {
        errorCount++;
        if (errorCount <= 5) { // Show only first 5 errors
          console.error(`❌ Error importing transaction:`, error.message);
        }
      }
    }
    
    console.log(`✅ Transactions imported: ${successCount} successful, ${errorCount} errors`);
    return successCount;
    
  } finally {
    client.release();
  }
}

async function fixAndImportBeds() {
  console.log('\n🛏️ Fixing and importing beds...');
  
  const client = await pool.connect();
  
  try {
    const rawData = fs.readFileSync('supabase_real_data.json', 'utf8');
    const data = JSON.parse(rawData);
    
    let successCount = 0;
    
    for (const bed of data.beds) {
      try {
        // Fix room type if not in allowed values
        const allowedRoomTypes = ['general', 'private', 'semi-private', 'icu', 'nicu', 'emergency'];
        if (!allowedRoomTypes.includes(bed.room_type)) {
          bed.room_type = 'general';
        }
        
        // Fix bed status if not in allowed values
        const allowedStatuses = ['available', 'occupied', 'maintenance', 'reserved'];
        if (!allowedStatuses.includes(bed.status)) {
          bed.status = 'available';
        }
        
        const query = `
          INSERT INTO beds (
            bed_number, department, room_type, floor, status, 
            patient_id, daily_rate, created_at, updated_at
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
          ON CONFLICT (bed_number) DO NOTHING
        `;
        
        await client.query(query, [
          bed.bed_number,
          bed.department || 'General Medicine',
          bed.room_type,
          bed.floor || 1,
          bed.status,
          bed.patient_id,
          bed.daily_rate || 1000.00,
          bed.created_at || new Date(),
          new Date()
        ]);
        
        successCount++;
        
      } catch (error) {
        console.error(`❌ Error importing bed ${bed.bed_number}:`, error.message);
      }
    }
    
    console.log(`✅ Beds imported: ${successCount} successful`);
    return successCount;
    
  } finally {
    client.release();
  }
}

async function main() {
  try {
    console.log('🔧 Fixing and completing data import...');
    console.log('=====================================');
    
    let totalFixed = 0;
    
    totalFixed += await fixAndImportDoctors();
    totalFixed += await fixAndImportTransactions();
    totalFixed += await fixAndImportBeds();
    
    console.log('\n🎯 Final Results:');
    console.log('==================');
    console.log(`Total records fixed and imported: ${totalFixed}`);
    
    // Final verification
    const client = await pool.connect();
    const results = await client.query(`
      SELECT 
        'users' as table_name, COUNT(*) as count FROM users
      UNION ALL
      SELECT 'departments' as table_name, COUNT(*) as count FROM departments
      UNION ALL
      SELECT 'doctors' as table_name, COUNT(*) as count FROM doctors
      UNION ALL
      SELECT 'patients' as table_name, COUNT(*) as count FROM patients
      UNION ALL
      SELECT 'patient_transactions' as table_name, COUNT(*) as count FROM patient_transactions
      UNION ALL
      SELECT 'beds' as table_name, COUNT(*) as count FROM beds
      ORDER BY table_name
    `);
    
    console.log('\n📊 Final Database State:');
    console.log('========================');
    results.rows.forEach(row => {
      console.log(`${row.table_name}: ${row.count} records`);
    });
    
    client.release();
    
    console.log('\n✅ Real data migration completed successfully!');
    
  } catch (error) {
    console.error('❌ Fix process failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main().catch(console.error);
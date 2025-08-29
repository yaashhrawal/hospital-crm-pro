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

async function importDoctors(doctors) {
  console.log(`\n👨‍⚕️ Importing ${doctors.length} doctors...`);
  
  const client = await pool.connect();
  
  try {
    let successCount = 0;
    let errorCount = 0;
    
    for (const doctor of doctors) {
      try {
        const query = `
          INSERT INTO doctors (id, name, department, specialization, fee, phone, email, is_active, created_at, updated_at)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
          ON CONFLICT (id) DO UPDATE SET
            name = EXCLUDED.name,
            department = EXCLUDED.department,
            specialization = EXCLUDED.specialization,
            fee = EXCLUDED.fee,
            phone = EXCLUDED.phone,
            email = EXCLUDED.email,
            updated_at = NOW()
        `;
        
        await client.query(query, [
          doctor.id,
          doctor.name,
          doctor.department,
          doctor.specialization,
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
        errorCount++;
      }
    }
    
    console.log(`✅ Doctors imported: ${successCount} success, ${errorCount} errors`);
    return successCount;
    
  } finally {
    client.release();
  }
}

async function importPatients(patients) {
  console.log(`\n👥 Importing ${patients.length} patients...`);
  
  const client = await pool.connect();
  
  try {
    // Get admin user ID for created_by field
    const adminResult = await client.query("SELECT id FROM users WHERE email = 'admin@hospital.com'");
    const adminUserId = adminResult.rows[0]?.id;
    
    let successCount = 0;
    let errorCount = 0;
    
    for (const patient of patients) {
      try {
        const query = `
          INSERT INTO patients (
            id, patient_id, first_name, last_name, age, gender, phone, email, 
            address, emergency_contact_name, emergency_contact_phone, 
            medical_history, allergies, current_medications, blood_group, 
            notes, date_of_entry, patient_tag, is_active, created_at, updated_at, created_by
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22)
          ON CONFLICT (id) DO UPDATE SET
            patient_id = EXCLUDED.patient_id,
            first_name = EXCLUDED.first_name,
            last_name = EXCLUDED.last_name,
            age = EXCLUDED.age,
            gender = EXCLUDED.gender,
            phone = EXCLUDED.phone,
            email = EXCLUDED.email,
            address = EXCLUDED.address,
            updated_at = NOW()
        `;
        
        await client.query(query, [
          patient.id,
          patient.patient_id,
          patient.first_name,
          patient.last_name,
          patient.age,
          patient.gender,
          patient.phone,
          patient.email,
          patient.address,
          patient.emergency_contact_name,
          patient.emergency_contact_phone,
          patient.medical_history,
          patient.allergies,
          patient.current_medications,
          patient.blood_group,
          patient.notes,
          patient.date_of_entry,
          patient.patient_tag,
          patient.is_active !== false,
          patient.created_at || new Date(),
          new Date(),
          adminUserId
        ]);
        
        successCount++;
        
        if (successCount % 100 === 0) {
          console.log(`   Progress: ${successCount}/${patients.length} patients imported`);
        }
        
      } catch (error) {
        console.error(`❌ Error importing patient ${patient.patient_id}:`, error.message);
        errorCount++;
      }
    }
    
    console.log(`✅ Patients imported: ${successCount} success, ${errorCount} errors`);
    return successCount;
    
  } finally {
    client.release();
  }
}

async function importTransactions(transactions) {
  console.log(`\n💰 Importing ${transactions.length} transactions...`);
  
  const client = await pool.connect();
  
  try {
    // Get admin user ID for created_by field
    const adminResult = await client.query("SELECT id FROM users WHERE email = 'admin@hospital.com'");
    const adminUserId = adminResult.rows[0]?.id;
    
    let successCount = 0;
    let errorCount = 0;
    
    for (const transaction of transactions) {
      try {
        const query = `
          INSERT INTO patient_transactions (
            id, patient_id, transaction_type, amount, payment_mode, 
            doctor_id, doctor_name, department, description, 
            transaction_date, created_at, created_by
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
          ON CONFLICT (id) DO UPDATE SET
            amount = EXCLUDED.amount,
            payment_mode = EXCLUDED.payment_mode,
            description = EXCLUDED.description,
            transaction_date = EXCLUDED.transaction_date
        `;
        
        await client.query(query, [
          transaction.id,
          transaction.patient_id,
          transaction.transaction_type,
          transaction.amount,
          transaction.payment_mode,
          transaction.doctor_id,
          transaction.doctor_name,
          transaction.department,
          transaction.description,
          transaction.transaction_date || transaction.created_at || new Date(),
          transaction.created_at || new Date(),
          adminUserId
        ]);
        
        successCount++;
        
        if (successCount % 100 === 0) {
          console.log(`   Progress: ${successCount}/${transactions.length} transactions imported`);
        }
        
      } catch (error) {
        console.error(`❌ Error importing transaction ${transaction.id}:`, error.message);
        errorCount++;
      }
    }
    
    console.log(`✅ Transactions imported: ${successCount} success, ${errorCount} errors`);
    return successCount;
    
  } finally {
    client.release();
  }
}

async function importBeds(beds) {
  console.log(`\n🛏️ Importing ${beds.length} beds...`);
  
  const client = await pool.connect();
  
  try {
    let successCount = 0;
    let errorCount = 0;
    
    for (const bed of beds) {
      try {
        const query = `
          INSERT INTO beds (
            id, bed_number, department, room_type, floor, status, 
            patient_id, daily_rate, created_at, updated_at
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
          ON CONFLICT (id) DO UPDATE SET
            bed_number = EXCLUDED.bed_number,
            department = EXCLUDED.department,
            room_type = EXCLUDED.room_type,
            status = EXCLUDED.status,
            patient_id = EXCLUDED.patient_id,
            daily_rate = EXCLUDED.daily_rate,
            updated_at = NOW()
        `;
        
        await client.query(query, [
          bed.id,
          bed.bed_number,
          bed.department,
          bed.room_type,
          bed.floor || 1,
          bed.status || 'available',
          bed.patient_id,
          bed.daily_rate || 1000.00,
          bed.created_at || new Date(),
          new Date()
        ]);
        
        successCount++;
        
      } catch (error) {
        console.error(`❌ Error importing bed ${bed.bed_number}:`, error.message);
        errorCount++;
      }
    }
    
    console.log(`✅ Beds imported: ${successCount} success, ${errorCount} errors`);
    return successCount;
    
  } finally {
    client.release();
  }
}

async function main() {
  try {
    console.log('🚀 Starting real data import to Azure PostgreSQL...');
    console.log('==================================================');
    
    // Read exported data
    const rawData = fs.readFileSync('supabase_real_data.json', 'utf8');
    const data = JSON.parse(rawData);
    
    console.log('\n📊 Data to import:');
    Object.entries(data).forEach(([table, records]) => {
      console.log(`${table}: ${records.length} records`);
    });
    
    // Test database connection
    const client = await pool.connect();
    console.log('\n✅ Connected to Azure PostgreSQL database');
    client.release();
    
    let totalImported = 0;
    
    // Import doctors first (referenced by transactions)
    if (data.doctors && data.doctors.length > 0) {
      totalImported += await importDoctors(data.doctors);
    }
    
    // Import patients (referenced by transactions and beds)
    if (data.patients && data.patients.length > 0) {
      totalImported += await importPatients(data.patients);
    }
    
    // Import transactions
    if (data.patient_transactions && data.patient_transactions.length > 0) {
      totalImported += await importTransactions(data.patient_transactions);
    }
    
    // Import beds
    if (data.beds && data.beds.length > 0) {
      totalImported += await importBeds(data.beds);
    }
    
    console.log('\n🎯 Import Summary:');
    console.log('==================');
    console.log(`Total records imported: ${totalImported}`);
    
    // Verify import
    console.log('\n🔍 Verification:');
    console.log('================');
    
    const verifyClient = await pool.connect();
    const results = await verifyClient.query(`
      SELECT 
        'doctors' as table_name, COUNT(*) as count FROM doctors
      UNION ALL
      SELECT 'patients' as table_name, COUNT(*) as count FROM patients
      UNION ALL
      SELECT 'patient_transactions' as table_name, COUNT(*) as count FROM patient_transactions
      UNION ALL
      SELECT 'beds' as table_name, COUNT(*) as count FROM beds
      ORDER BY table_name
    `);
    
    results.rows.forEach(row => {
      console.log(`${row.table_name}: ${row.count} records`);
    });
    
    verifyClient.release();
    
    console.log('\n✅ Real data migration completed successfully!');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main().catch(console.error);
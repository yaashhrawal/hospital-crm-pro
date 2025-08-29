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

async function findAndImportMissingPatients() {
  console.log('🔍 Finding and importing missing patients...');
  
  const client = await pool.connect();
  
  try {
    // Read the exported data
    const rawData = fs.readFileSync('supabase_real_data.json', 'utf8');
    const data = JSON.parse(rawData);
    
    console.log(`Total patients in Supabase: ${data.patients.length}`);
    
    // Get current patients in Azure
    const currentResult = await client.query('SELECT COUNT(*) as count FROM patients');
    const currentCount = parseInt(currentResult.rows[0].count);
    console.log(`Current patients in Azure: ${currentCount}`);
    console.log(`Missing patients: ${data.patients.length - currentCount}`);
    
    // Get admin user ID
    const adminResult = await client.query("SELECT id FROM users WHERE email = 'admin@hospital.com'");
    const adminUserId = adminResult.rows[0]?.id;
    
    let successCount = 0;
    let errorCount = 0;
    let skippedCount = 0;
    
    console.log('\n📋 Processing all patients again with detailed logging...');
    
    for (let i = 0; i < data.patients.length; i++) {
      const patient = data.patients[i];
      
      try {
        // Check if patient already exists
        const existingResult = await client.query('SELECT id FROM patients WHERE id = $1', [patient.id]);
        
        if (existingResult.rows.length > 0) {
          skippedCount++;
          if (skippedCount <= 5) {
            console.log(`⏭️  Skipping existing patient: ${patient.first_name} ${patient.last_name} (ID: ${patient.id})`);
          }
          continue;
        }
        
        console.log(`📝 Processing patient ${i+1}/${data.patients.length}: ${patient.first_name} ${patient.last_name}`);
        
        const query = `
          INSERT INTO patients (
            id, patient_id, first_name, last_name, age, gender, phone, email, 
            address, emergency_contact_name, emergency_contact_phone, 
            medical_history, allergies, current_medications, blood_group, 
            notes, date_of_entry, patient_tag, is_active, created_at, updated_at, created_by
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22)
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
        console.log(`   ✅ Successfully imported: ${patient.first_name} ${patient.last_name}`);
        
      } catch (error) {
        errorCount++;
        console.error(`   ❌ Error importing patient ${patient.first_name} ${patient.last_name}:`, error.message);
        
        // Log detailed error info for debugging
        if (errorCount <= 10) {
          console.error(`      Patient ID: ${patient.id}`);
          console.error(`      Patient Data:`, {
            patient_id: patient.patient_id,
            name: `${patient.first_name} ${patient.last_name}`,
            age: patient.age,
            gender: patient.gender
          });
        }
      }
    }
    
    console.log(`\n📊 Import Results:`);
    console.log(`=================`);
    console.log(`New imports: ${successCount}`);
    console.log(`Skipped (existing): ${skippedCount}`);
    console.log(`Errors: ${errorCount}`);
    console.log(`Total processed: ${successCount + skippedCount + errorCount}`);
    
    // Final count verification
    const finalResult = await client.query('SELECT COUNT(*) as count FROM patients');
    const finalCount = parseInt(finalResult.rows[0].count);
    console.log(`\n🎯 Final patient count in Azure: ${finalCount}`);
    console.log(`Expected: ${data.patients.length}`);
    console.log(`Match: ${finalCount === data.patients.length ? '✅ YES' : '❌ NO'}`);
    
    return { successCount, errorCount, finalCount };
    
  } finally {
    client.release();
  }
}

async function main() {
  try {
    console.log('🔧 Fixing missing patients import...');
    console.log('===================================');
    
    const result = await findAndImportMissingPatients();
    
    if (result.finalCount === 961) {
      console.log('\n✅ All 961 patients successfully imported!');
    } else {
      console.log(`\n⚠️  Still missing ${961 - result.finalCount} patients`);
    }
    
  } catch (error) {
    console.error('❌ Fix process failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main().catch(console.error);
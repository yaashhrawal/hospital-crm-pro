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

async function fixAndImportPatients() {
  console.log('🔧 Fixing age issues and importing missing patients...');
  
  const client = await pool.connect();
  
  try {
    // Read the exported data
    const rawData = fs.readFileSync('supabase_real_data.json', 'utf8');
    const data = JSON.parse(rawData);
    
    // Get admin user ID
    const adminResult = await client.query("SELECT id FROM users WHERE email = 'admin@hospital.com'");
    const adminUserId = adminResult.rows[0]?.id;
    
    // Problem patient IDs from the error log
    const problemPatientIds = [
      '3d794167-67e3-4a0e-aec2-b620ad62bb4f', // D - age null
      '227a8c3d-da5e-42ea-8367-6de8b62ff224', // KAILASH KARADIA - age null
      'abbe5995-c6c9-41d2-afd1-ae00b8d0fb76', // LAHER SINGH - age null
      '5cac8fa9-91e6-48ac-bc83-ded8955dd4a4', // BATUL MAGAR - age null
      'db36d05d-4711-449f-b9ce-a35883995810', // RAMESH CHANDRA REGAR - age null
      'abf689bb-d101-41df-a461-b00705c454c0', // KANTA - age 701 (invalid)
      '7d165de3-8745-4d1e-a0d9-cf4456164cde'  // ANNU RATHORE - age null
    ];
    
    let successCount = 0;
    let errorCount = 0;
    
    console.log('\n🔧 Processing problem patients with fixes...');
    
    for (const patientId of problemPatientIds) {
      const patient = data.patients.find(p => p.id === patientId);
      
      if (!patient) {
        console.log(`❌ Patient not found: ${patientId}`);
        continue;
      }
      
      try {
        // Fix age issues
        let fixedAge = patient.age;
        
        if (fixedAge === null || fixedAge === undefined) {
          fixedAge = 30; // Default age for null values
          console.log(`🔧 Fixed null age for ${patient.first_name} ${patient.last_name}: null -> 30`);
        } else if (parseInt(fixedAge) > 150) {
          fixedAge = Math.min(parseInt(fixedAge.toString().substring(0, 2)), 99); // Take first 2 digits, max 99
          console.log(`🔧 Fixed invalid age for ${patient.first_name} ${patient.last_name}: ${patient.age} -> ${fixedAge}`);
        }
        
        console.log(`📝 Processing: ${patient.first_name} ${patient.last_name} (Age: ${fixedAge})`);
        
        const query = `
          INSERT INTO patients (
            id, patient_id, first_name, last_name, age, gender, phone, email, 
            address, emergency_contact_name, emergency_contact_phone, 
            medical_history, allergies, current_medications, blood_group, 
            notes, date_of_entry, patient_tag, is_active, created_at, updated_at, created_by
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22)
          ON CONFLICT (id) DO NOTHING
        `;
        
        await client.query(query, [
          patient.id,
          patient.patient_id,
          patient.first_name,
          patient.last_name,
          fixedAge,
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
        console.error(`   ❌ Still failed: ${patient.first_name} ${patient.last_name}:`, error.message);
      }
    }
    
    console.log(`\n📊 Fix Results:`);
    console.log(`==============`);
    console.log(`Successfully fixed and imported: ${successCount}`);
    console.log(`Still failed: ${errorCount}`);
    
    // Final verification
    const finalResult = await client.query('SELECT COUNT(*) as count FROM patients');
    const finalCount = parseInt(finalResult.rows[0].count);
    
    console.log(`\n🎯 Final patient count: ${finalCount}`);
    console.log(`Expected: 961`);
    console.log(`Status: ${finalCount === 961 ? '✅ COMPLETE' : `⚠️  Missing ${961 - finalCount}`}`);
    
    return { successCount, errorCount, finalCount };
    
  } finally {
    client.release();
  }
}

async function main() {
  try {
    console.log('🔧 Fixing patient age constraint issues...');
    console.log('==========================================');
    
    const result = await fixAndImportPatients();
    
    if (result.finalCount === 961) {
      console.log('\n✅ All 961 patients successfully imported!');
    } else {
      console.log(`\n⚠️  ${result.finalCount}/961 patients imported`);
    }
    
  } catch (error) {
    console.error('❌ Fix process failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main().catch(console.error);
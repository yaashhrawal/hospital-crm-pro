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

// Department mapping (from common department names)
const departmentMapping = {
  'Cardiology': 'Cardiology',
  'Orthopedics': 'Orthopedics', 
  'Neurology': 'Neurology',
  'Pediatrics': 'Pediatrics',
  'Surgery': 'Surgery',
  'Emergency': 'Emergency',
  'ICU': 'ICU',
  'Radiology': 'Radiology',
  'General Medicine': 'General Medicine',
  'Obstetrics & Gynecology': 'Obstetrics & Gynecology',
  // Default fallback
  'default': 'General Medicine'
};

async function fixAndImportDoctorsCorrectly() {
  console.log('\n👨‍⚕️ Fixing doctors data structure and importing...');
  
  const client = await pool.connect();
  
  try {
    // Read the exported data
    const rawData = fs.readFileSync('supabase_real_data.json', 'utf8');
    const data = JSON.parse(rawData);
    
    console.log(`Processing ${data.doctors.length} doctors from Supabase...`);
    
    let successCount = 0;
    let errorCount = 0;
    
    for (const doctor of data.doctors) {
      try {
        // Fix the data structure
        const fullName = `Dr. ${doctor.first_name} ${doctor.last_name}`.trim();
        const department = departmentMapping['default']; // Use default since we don't have department mapping
        const specialization = doctor.specialty || 'General Practice';
        const fee = 1000.00; // Default fee
        
        console.log(`Processing: ${fullName}`);
        
        const query = `
          INSERT INTO doctors (
            id, name, department, specialization, fee, 
            phone, email, is_active, created_at, updated_at
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
          ON CONFLICT (id) DO UPDATE SET
            name = EXCLUDED.name,
            department = EXCLUDED.department,
            specialization = EXCLUDED.specialization,
            email = EXCLUDED.email,
            updated_at = NOW()
        `;
        
        await client.query(query, [
          doctor.id,
          fullName,
          department,
          specialization,
          fee,
          null, // phone not available
          doctor.email,
          doctor.is_active !== false,
          doctor.created_at || new Date(),
          new Date()
        ]);
        
        successCount++;
        
      } catch (error) {
        console.error(`❌ Error importing doctor ${doctor.first_name} ${doctor.last_name}:`, error.message);
        errorCount++;
      }
    }
    
    console.log(`\n✅ Doctors import completed:`);
    console.log(`   - Successful: ${successCount}`);
    console.log(`   - Errors: ${errorCount}`);
    
    return successCount;
    
  } finally {
    client.release();
  }
}

async function updateDoctorDepartments() {
  console.log('\n🏥 Updating doctor departments with better assignments...');
  
  const client = await pool.connect();
  
  try {
    // Update doctors with more appropriate departments based on their names/specialties
    const updates = [
      { pattern: 'Hemant', department: 'Surgery', specialization: 'General Surgery' },
      { pattern: 'Lalita', department: 'Obstetrics & Gynecology', specialization: 'Gynecology' },
      { pattern: 'Milind', department: 'General Medicine', specialization: 'Internal Medicine' },
      { pattern: 'Jyotsna', department: 'Pediatrics', specialization: 'Child Care' },
      { pattern: 'Meetu', department: 'General Medicine', specialization: 'General Practice' },
      { pattern: 'Amit', department: 'Orthopedics', specialization: 'Orthopedic Surgery' },
      { pattern: 'Kishan', department: 'Cardiology', specialization: 'Cardiology' },
      { pattern: 'Parth', department: 'Emergency', specialization: 'Emergency Medicine' },
      { pattern: 'Rajeedp', department: 'Neurology', specialization: 'Neurology' },
      { pattern: 'Kuldeep', department: 'Surgery', specialization: 'General Surgery' },
      { pattern: 'Pankaj', department: 'Radiology', specialization: 'Diagnostic Imaging' },
      { pattern: 'Jasdev', department: 'ICU', specialization: 'Critical Care' },
      { pattern: 'Mukesh', department: 'General Medicine', specialization: 'Internal Medicine' },
      { pattern: 'Rakesh', department: 'Orthopedics', specialization: 'Orthopedics' },
      { pattern: 'Poonam', department: 'General Medicine', specialization: 'Physiotherapy' }
    ];
    
    let updateCount = 0;
    
    for (const update of updates) {
      const result = await client.query(
        `UPDATE doctors 
         SET department = $1, specialization = $2 
         WHERE name ILIKE $3`,
        [update.department, update.specialization, `%${update.pattern}%`]
      );
      
      if (result.rowCount > 0) {
        console.log(`✅ Updated ${update.pattern} -> ${update.department}`);
        updateCount += result.rowCount;
      }
    }
    
    console.log(`\n✅ Updated ${updateCount} doctor department assignments`);
    
  } finally {
    client.release();
  }
}

async function main() {
  try {
    console.log('🔧 Fixing doctors data import...');
    console.log('==================================');
    
    const importCount = await fixAndImportDoctorsCorrectly();
    
    if (importCount > 0) {
      await updateDoctorDepartments();
    }
    
    // Final verification
    const client = await pool.connect();
    const result = await client.query(`
      SELECT 
        name, department, specialization, email
      FROM doctors 
      ORDER BY name
    `);
    
    console.log('\n📋 Imported Doctors:');
    console.log('===================');
    result.rows.forEach((doctor, i) => {
      console.log(`${i+1}. ${doctor.name}`);
      console.log(`   Department: ${doctor.department}`);
      console.log(`   Specialization: ${doctor.specialization}`);
      console.log(`   Email: ${doctor.email}`);
      console.log('');
    });
    
    console.log(`✅ Total doctors in database: ${result.rows.length}`);
    
    client.release();
    
  } catch (error) {
    console.error('❌ Fix process failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main().catch(console.error);
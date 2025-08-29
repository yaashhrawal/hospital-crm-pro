import pkg from 'pg';
const { Pool } = pkg;
import bcrypt from 'bcrypt';
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

async function createDoctorUserAccounts() {
  console.log('👥 Creating user accounts for doctors...');
  
  const client = await pool.connect();
  
  try {
    // Get all doctors
    const doctorsResult = await client.query(`
      SELECT id, name, email, department 
      FROM doctors 
      WHERE is_active = true 
      ORDER BY name
    `);
    
    console.log(`Found ${doctorsResult.rows.length} doctors to create accounts for`);
    
    let successCount = 0;
    let errorCount = 0;
    
    const defaultPassword = 'Doctor123!'; // Default password for all doctors
    const hashedPassword = await bcrypt.hash(defaultPassword, 10);
    
    console.log('\n🔧 Creating user accounts...');
    
    for (const doctor of doctorsResult.rows) {
      try {
        // Check if user account already exists
        const existingUser = await client.query(
          'SELECT id FROM users WHERE email = $1',
          [doctor.email]
        );
        
        if (existingUser.rows.length > 0) {
          console.log(`⏭️  User already exists: ${doctor.name} (${doctor.email})`);
          continue;
        }
        
        // Split name into first and last name
        const nameParts = doctor.name.replace('Dr. ', '').trim().split(' ');
        const firstName = nameParts[0] || 'Doctor';
        const lastName = nameParts.slice(1).join(' ') || 'User';
        
        // Create user account for doctor
        const query = `
          INSERT INTO users (
            email, password_hash, first_name, last_name, role, 
            is_active, created_at, updated_at
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
          RETURNING id
        `;
        
        const result = await client.query(query, [
          doctor.email,
          hashedPassword,
          firstName,
          lastName,
          'DOCTOR',
          true,
          new Date(),
          new Date()
        ]);
        
        successCount++;
        console.log(`✅ Created account: ${doctor.name} (${doctor.email})`);
        
      } catch (error) {
        errorCount++;
        console.error(`❌ Error creating account for ${doctor.name}:`, error.message);
      }
    }
    
    console.log(`\n📊 Account Creation Results:`);
    console.log(`===========================`);
    console.log(`Successfully created: ${successCount} accounts`);
    console.log(`Errors: ${errorCount}`);
    console.log(`Default password for all doctors: ${defaultPassword}`);
    
    // Verify final user count
    const userCountResult = await client.query('SELECT COUNT(*) as count, role FROM users GROUP BY role');
    
    console.log(`\n🎯 Final User Account Summary:`);
    console.log(`=============================`);
    userCountResult.rows.forEach(row => {
      console.log(`${row.role}: ${row.count} users`);
    });
    
    return { successCount, errorCount };
    
  } finally {
    client.release();
  }
}

async function main() {
  try {
    console.log('🚀 Creating doctor user accounts...');
    console.log('===================================');
    
    const result = await createDoctorUserAccounts();
    
    console.log('\n✅ Doctor user accounts creation completed!');
    console.log('\n🔑 Login Information:');
    console.log('=====================');
    console.log('All doctors can login with:');
    console.log('- Email: their respective doctor email');
    console.log('- Password: Doctor123!');
    console.log('- Role: DOCTOR');
    
  } catch (error) {
    console.error('❌ Account creation failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main().catch(console.error);
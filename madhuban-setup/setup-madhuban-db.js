#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Madhuban Supabase credentials
const MADHUBAN_URL = 'https://btoeupnfqkioxigrheyp.supabase.co';
const MADHUBAN_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ0b2V1cG5mcWtpb3hpZ3JoZXlwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDAxODQyNCwiZXhwIjoyMDY5NTk0NDI0fQ.BWDIB5vzXl6J7PasV51yOa-rAEt_QxK8x9VoGcfkT5U';

const madhubanClient = createClient(MADHUBAN_URL, MADHUBAN_SERVICE_KEY);

async function setupMadhubanDatabase() {
  console.log('🏥 Setting up Madhuban Hospital Database...\n');
  
  try {
    // Read the schema file
    const schemaPath = path.join(__dirname, 'MADHUBAN_SCHEMA.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');
    
    console.log('📋 Executing database schema...');
    
    // Execute the schema
    const { data, error } = await madhubanClient.rpc('exec_sql', {
      sql_query: schema
    });
    
    if (error) {
      console.error('❌ Error executing schema:', error.message);
      console.log('\n💡 Alternative: Please copy the contents of MADHUBAN_SCHEMA.sql');
      console.log('   and run it in the Supabase SQL Editor manually.');
      return;
    }
    
    console.log('✅ Database schema created successfully!');
    
    // Verify tables were created
    console.log('\n🔍 Verifying tables...');
    const tables = [
      'users', 'hospitals', 'departments', 'doctors', 
      'patients', 'beds', 'patient_admissions', 
      'patient_transactions', 'appointments', 'bills', 
      'discharge_summaries'
    ];
    
    for (const table of tables) {
      const { count, error } = await madhubanClient.from(table).select('*', { count: 'exact', head: true });
      if (!error) {
        console.log(`✅ Table '${table}' created`);
      } else {
        console.log(`❌ Table '${table}' error:`, error.message);
      }
    }
    
    console.log('\n🎉 Madhuban Hospital database setup complete!');
    console.log('\n📝 Next steps:');
    console.log('1. Update the Madhuban repository with environment variables');
    console.log('2. Create Vercel project and deploy');
    
  } catch (error) {
    console.error('❌ Setup failed:', error.message);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  setupMadhubanDatabase()
    .then(() => process.exit(0))
    .catch(err => {
      console.error('Fatal error:', err);
      process.exit(1);
    });
}
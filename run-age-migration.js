import { createClient } from '@supabase/supabase-js';

// Supabase configuration
const supabaseUrl = 'https://oghqwddhojnryovmfvzc.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9naHF3ZGRob2pucnlvdm1mdnpjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMxMTQ1NDEsImV4cCI6MjA2ODY5MDU0MX0.NVvYQFtqIg8OV-vvkAhCNFC_uMC1SBJDSKcLHRjf5w0';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function runAgeMigration() {
  console.log('🔄 Starting age column migration...');
  
  try {
    // Step 1: Add age column
    console.log('📝 Step 1: Adding age column...');
    const { error: addColumnError } = await supabase.rpc('execute_sql', {
      sql: 'ALTER TABLE patients ADD COLUMN IF NOT EXISTS age INTEGER;'
    });
    
    if (addColumnError) {
      console.error('❌ Error adding age column:', addColumnError);
      return;
    }
    console.log('✅ Age column added successfully');

    // Step 2: Update existing records
    console.log('📝 Step 2: Updating existing records...');
    const { error: updateError } = await supabase.rpc('execute_sql', {
      sql: `UPDATE patients 
            SET age = EXTRACT(YEAR FROM age(CURRENT_DATE, date_of_birth))
            WHERE date_of_birth IS NOT NULL AND age IS NULL;`
    });
    
    if (updateError) {
      console.error('❌ Error updating records:', updateError);
      return;
    }
    console.log('✅ Records updated successfully');

    // Step 3: Make age column NOT NULL
    console.log('📝 Step 3: Making age column NOT NULL...');
    const { error: notNullError } = await supabase.rpc('execute_sql', {
      sql: 'ALTER TABLE patients ALTER COLUMN age SET NOT NULL;'
    });
    
    if (notNullError) {
      console.error('❌ Error making age NOT NULL:', notNullError);
      return;
    }
    console.log('✅ Age column made NOT NULL');

    // Step 4: Add check constraint
    console.log('📝 Step 4: Adding age constraint...');
    const { error: constraintError } = await supabase.rpc('execute_sql', {
      sql: 'ALTER TABLE patients ADD CONSTRAINT age_check CHECK (age >= 0 AND age <= 150);'
    });
    
    if (constraintError) {
      console.error('❌ Error adding constraint:', constraintError);
      return;
    }
    console.log('✅ Age constraint added successfully');

    // Step 5: Drop date_of_birth column
    console.log('📝 Step 5: Dropping date_of_birth column...');
    const { error: dropError } = await supabase.rpc('execute_sql', {
      sql: 'ALTER TABLE patients DROP COLUMN IF EXISTS date_of_birth;'
    });
    
    if (dropError) {
      console.error('❌ Error dropping date_of_birth column:', dropError);
      return;
    }
    console.log('✅ Date of birth column dropped successfully');

    console.log('🎉 Age column migration completed successfully!');
    
  } catch (error) {
    console.error('💥 Migration failed:', error);
  }
}

// Run the migration
runAgeMigration();
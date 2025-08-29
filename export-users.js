import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase configuration');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function exportUsersData() {
  console.log('👥 Exporting user accounts from Supabase...');
  
  try {
    // Export users table data
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('*');
    
    if (usersError) {
      console.error('❌ Error exporting users:', usersError.message);
      return null;
    }
    
    console.log(`✅ Found ${users?.length || 0} user accounts`);
    
    // Also try to get auth users if accessible (may not work with anon key)
    let authUsers = [];
    try {
      const { data: authData, error: authError } = await supabase.auth.admin.listUsers();
      if (!authError && authData?.users) {
        authUsers = authData.users;
        console.log(`✅ Found ${authUsers.length} auth users`);
      }
    } catch (err) {
      console.log('ℹ️ Auth users not accessible with current permissions');
    }
    
    const exportData = {
      users: users || [],
      auth_users: authUsers
    };
    
    // Save to JSON file
    const exportFile = 'supabase_users_data.json';
    fs.writeFileSync(exportFile, JSON.stringify(exportData, null, 2));
    
    console.log(`\n📊 Export Summary:`);
    console.log(`=================`);
    console.log(`Users table: ${users?.length || 0} records`);
    console.log(`Auth users: ${authUsers.length} records`);
    console.log(`\n✅ Users data exported to ${exportFile}`);
    
    return exportData;
    
  } catch (error) {
    console.error('❌ Export failed:', error.message);
    return null;
  }
}

async function main() {
  console.log('🚀 Starting Supabase users export...');
  console.log('===================================');
  
  const data = await exportUsersData();
  
  if (data) {
    console.log('\n🎯 Users export completed successfully!');
  } else {
    console.log('\n❌ Users export failed');
    process.exit(1);
  }
}

main().catch(console.error);
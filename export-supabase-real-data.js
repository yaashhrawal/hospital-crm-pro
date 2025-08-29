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

async function exportTableData(tableName) {
  try {
    console.log(`\n📊 Exporting ${tableName}...`);
    
    const { data, error } = await supabase
      .from(tableName)
      .select('*');
    
    if (error) {
      console.error(`❌ Error exporting ${tableName}:`, error.message);
      return null;
    }
    
    console.log(`✅ ${tableName}: ${data?.length || 0} records`);
    return data;
  } catch (err) {
    console.error(`❌ Exception exporting ${tableName}:`, err.message);
    return null;
  }
}

async function main() {
  console.log('🚀 Starting Supabase real data export...');
  console.log('=====================================');
  
  const tables = [
    'users',
    'doctors', 
    'patients',
    'patient_transactions',
    'patient_admissions',
    'beds',
    'appointments',
    'medicines',
    'patient_visits',
    'daily_expenses',
    'discharge_summary'
  ];
  
  const exportedData = {};
  
  for (const table of tables) {
    const data = await exportTableData(table);
    if (data) {
      exportedData[table] = data;
    }
  }
  
  // Save to JSON file
  const exportFile = 'supabase_real_data.json';
  fs.writeFileSync(exportFile, JSON.stringify(exportedData, null, 2));
  
  console.log('\n🎯 Export Summary:');
  console.log('=================');
  Object.entries(exportedData).forEach(([table, data]) => {
    console.log(`${table}: ${data.length} records`);
  });
  
  console.log(`\n✅ Data exported to ${exportFile}`);
  console.log(`📁 File size: ${fs.statSync(exportFile).size} bytes`);
}

main().catch(console.error);
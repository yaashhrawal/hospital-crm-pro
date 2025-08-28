import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkBedStatus() {
  try {
    console.log('🔍 Checking all beds status in database...\n');
    
    // Get all beds
    const { data: beds, error } = await supabase
      .from('beds')
      .select('*')
      .order('bed_number');
    
    if (error) {
      console.error('Error fetching beds:', error);
      return;
    }
    
    console.log(`📊 Total beds: ${beds.length}\n`);
    
    // Group by status
    const statusCount = {};
    beds.forEach(bed => {
      const status = bed.status || 'NULL';
      statusCount[status] = (statusCount[status] || 0) + 1;
    });
    
    console.log('Status distribution:');
    Object.entries(statusCount).forEach(([status, count]) => {
      console.log(`  ${status}: ${count}`);
    });
    
    console.log('\n📋 Detailed bed information:');
    console.log('=' . repeat(80));
    
    beds.forEach(bed => {
      console.log(`\nBed ${bed.bed_number}:`);
      console.log(`  Status: ${bed.status}`);
      console.log(`  Patient ID: ${bed.patient_id || 'None'}`);
      console.log(`  IPD Number: ${bed.ipd_number || 'None'}`);
      console.log(`  Admission Date: ${bed.admission_date || 'None'}`);
      
      // Flag potential issues
      if (bed.patient_id && bed.status !== 'occupied' && bed.status !== 'OCCUPIED') {
        console.log(`  ⚠️ WARNING: Has patient but status is ${bed.status}`);
      }
      if (!bed.patient_id && (bed.status === 'occupied' || bed.status === 'OCCUPIED')) {
        console.log(`  ⚠️ WARNING: No patient but status is ${bed.status}`);
      }
    });
    
    // Check for beds that should be vacant but have patient data
    const problematicBeds = beds.filter(bed => 
      (bed.status === 'vacant' || bed.status === 'AVAILABLE') && 
      (bed.patient_id || bed.ipd_number || bed.admission_date)
    );
    
    if (problematicBeds.length > 0) {
      console.log('\n⚠️ PROBLEMATIC BEDS (status is vacant/available but has patient data):');
      console.log('=' . repeat(80));
      problematicBeds.forEach(bed => {
        console.log(`  Bed ${bed.bed_number}: status=${bed.status}, patient_id=${bed.patient_id}, ipd=${bed.ipd_number}`);
      });
    }
    
  } catch (error) {
    console.error('Error:', error);
  }
}

checkBedStatus();
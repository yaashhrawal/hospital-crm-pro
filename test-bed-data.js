const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client (you'll need to update these values)
const supabaseUrl = 'https://your-project.supabase.co'; // Replace with your URL
const supabaseAnonKey = 'your-anon-key'; // Replace with your anon key

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testBedData() {
  console.log('🧪 Testing bed data relationships...\n');
  
  try {
    // Test 1: Check if beds table exists and has data
    console.log('1. Checking beds table...');
    const { data: beds, error: bedsError } = await supabase
      .from('beds')
      .select('id, bed_number, room_type, daily_rate')
      .limit(5);
    
    if (bedsError) {
      console.error('❌ Beds table error:', bedsError);
    } else {
      console.log('✅ Beds table data:', beds);
      console.log(`   Found ${beds?.length || 0} beds\n`);
    }

    // Test 2: Check patient_admissions with bed relationships
    console.log('2. Checking patient_admissions with bed relationships...');
    const { data: admissions, error: admissionsError } = await supabase
      .from('patient_admissions')
      .select(`
        id,
        patient_id,
        bed_id,
        bed_number,
        room_type,
        daily_rate,
        status,
        bed:beds(id, bed_number, room_type, daily_rate)
      `)
      .limit(5);
    
    if (admissionsError) {
      console.error('❌ Admissions relationship error:', admissionsError);
    } else {
      console.log('✅ Admissions with relationships:', admissions);
      console.log(`   Found ${admissions?.length || 0} admissions\n`);
      
      // Analyze the data
      if (admissions && admissions.length > 0) {
        console.log('3. Data analysis:');
        admissions.forEach((admission, index) => {
          const bedFromRelation = admission.bed?.bed_number || 'N/A';
          const bedFromLegacy = admission.bed_number || 'N/A';
          const roomFromRelation = admission.bed?.room_type || 'N/A';
          const roomFromLegacy = admission.room_type || 'N/A';
          
          console.log(`   Admission ${index + 1}:`);
          console.log(`     - Bed ID: ${admission.bed_id || 'N/A'}`);
          console.log(`     - Bed (relation): ${bedFromRelation}`);
          console.log(`     - Bed (legacy): ${bedFromLegacy}`);
          console.log(`     - Room (relation): ${roomFromRelation}`);
          console.log(`     - Room (legacy): ${roomFromLegacy}`);
          console.log('');
        });
      }
    }

  } catch (error) {
    console.error('🚨 Test failed:', error);
  }
}

// Run the test if this file is executed directly
if (require.main === module) {
  testBedData();
} else {
  module.exports = { testBedData };
}
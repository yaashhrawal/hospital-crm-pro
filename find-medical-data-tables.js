#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function searchForMedicalDataAlternatives() {
  console.log('🔍 Searching for possible alternatives to missing medical_*_data tables...\n');

  // Check if data might be stored in the beds table or other tables
  const potentialAlternatives = [
    'beds', // We saw this has medical-related fields
    'patients', // Might have medical data embedded
    'prescriptions', // Medical prescriptions
  ];

  for (const tableName of potentialAlternatives) {
    try {
      console.log(`\n🔎 Checking ${tableName} for medical data patterns...`);
      
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .limit(2);

      if (error) {
        console.log(`❌ Error: ${error.message}`);
        continue;
      }

      if (!data || data.length === 0) {
        console.log(`   Empty table`);
        continue;
      }

      // Look for medical-related fields
      const record = data[0];
      const medicalFields = Object.keys(record).filter(key => 
        key.toLowerCase().includes('medical') ||
        key.toLowerCase().includes('consent') ||
        key.toLowerCase().includes('medication') ||
        key.toLowerCase().includes('vital') ||
        key.toLowerCase().includes('clinical') ||
        key.toLowerCase().includes('examination') ||
        key.toLowerCase().includes('history') ||
        key.toLowerCase().includes('treatment')
      );

      if (medicalFields.length > 0) {
        console.log(`   ✅ Found medical-related fields:`);
        medicalFields.forEach(field => {
          const value = record[field];
          const preview = value === null ? 'NULL' :
                         typeof value === 'object' ? JSON.stringify(value).substring(0, 100) + '...' :
                         typeof value === 'string' && value.length > 50 ? `"${value.substring(0, 50)}..."` :
                         `"${value}"`;
          console.log(`      - ${field}: ${preview}`);
        });
      } else {
        console.log(`   ⚪ No obvious medical fields found`);
      }

    } catch (err) {
      console.log(`❌ Exception: ${err.message}`);
    }
  }
}

async function checkBedTableMedicalData() {
  console.log('\n\n🛏️  DETAILED ANALYSIS: Beds Table Medical Data');
  console.log('='.repeat(50));
  
  try {
    const { data, error } = await supabase
      .from('beds')
      .select('*')
      .not('consent_form_data', 'eq', '{}')
      .limit(1);

    if (error) {
      console.log('❌ Error querying beds with consent forms:', error.message);
      return;
    }

    if (data && data.length > 0) {
      console.log('✅ Found bed with medical consent data:');
      const bed = data[0];
      
      console.log(`\nBed ${bed.bed_number} medical data:`);
      console.log(`- consent_form_data: ${JSON.stringify(bed.consent_form_data, null, 2)}`);
      console.log(`- consent_form_submitted: ${bed.consent_form_submitted}`);
      console.log(`- clinical_record_data: ${JSON.stringify(bed.clinical_record_data, null, 2)}`);
      console.log(`- clinical_record_submitted: ${bed.clinical_record_submitted}`);
      
    } else {
      console.log('ℹ️  No beds found with consent form data');
    }

    // Check if any beds have medical data
    const { data: bedsWithData, error: bedsError } = await supabase
      .from('beds')
      .select('bed_number, consent_form_submitted, clinical_record_submitted, progress_sheet_submitted, nurses_orders_submitted')
      .or('consent_form_submitted.eq.true,clinical_record_submitted.eq.true,progress_sheet_submitted.eq.true,nurses_orders_submitted.eq.true');

    if (bedsWithData && bedsWithData.length > 0) {
      console.log('\n📊 Beds with submitted medical forms:');
      bedsWithData.forEach(bed => {
        console.log(`   Bed ${bed.bed_number}: Consent=${bed.consent_form_submitted}, Clinical=${bed.clinical_record_submitted}, Progress=${bed.progress_sheet_submitted}, Nurses=${bed.nurses_orders_submitted}`);
      });
    } else {
      console.log('\n📊 No beds currently have submitted medical forms');
    }

  } catch (err) {
    console.log('❌ Exception analyzing bed medical data:', err.message);
  }
}

async function generateFixRecommendations() {
  console.log('\n\n🔧 RECOMMENDATIONS TO FIX 406 ERRORS');
  console.log('='.repeat(50));

  console.log('\n🎯 IMMEDIATE FIXES:');
  
  console.log('\n1. CREATE MISSING TABLES:');
  console.log('   You need to create these tables in your Supabase database:');
  console.log('   - medical_consent_data');
  console.log('   - medical_medication_data');
  console.log('   - medical_vital_signs_data');

  console.log('\n2. OR UPDATE YOUR CODE:');
  console.log('   Based on the analysis, it appears medical data might be stored in:');
  console.log('   - Consent forms: beds.consent_form_data');
  console.log('   - Clinical records: beds.clinical_record_data'); 
  console.log('   - Medical examination: medical_examination_data table (exists but empty)');

  console.log('\n3. TYPICAL MEDICAL TABLE STRUCTURES:');
  console.log('   If you create the missing tables, they should probably have:');
  
  console.log('\n   medical_consent_data:');
  console.log('   - id (UUID, primary key)');
  console.log('   - patient_id (text, foreign key)');
  console.log('   - consent_type (text)');
  console.log('   - consent_data (jsonb)');
  console.log('   - submitted_at (timestamp)');
  console.log('   - created_at (timestamp)');
  console.log('   - updated_at (timestamp)');

  console.log('\n   medical_medication_data:');
  console.log('   - id (UUID, primary key)');
  console.log('   - patient_id (text, foreign key)');
  console.log('   - medication_name (text)');
  console.log('   - dosage (text)');
  console.log('   - frequency (text)');
  console.log('   - prescribed_by (text)');
  console.log('   - start_date (date)');
  console.log('   - end_date (date)');
  console.log('   - created_at (timestamp)');

  console.log('\n   medical_vital_signs_data:');
  console.log('   - id (UUID, primary key)');
  console.log('   - patient_id (text, foreign key)');
  console.log('   - blood_pressure (text)');
  console.log('   - heart_rate (integer)');
  console.log('   - temperature (decimal)');
  console.log('   - oxygen_saturation (integer)');
  console.log('   - recorded_at (timestamp)');
  console.log('   - recorded_by (text)');
  console.log('   - created_at (timestamp)');
}

async function main() {
  console.log('🏥 Medical Data Tables - Investigation & Fix Recommendations');
  console.log('='.repeat(65));

  await searchForMedicalDataAlternatives();
  await checkBedTableMedicalData();
  await generateFixRecommendations();

  console.log('\n\n✨ Analysis Complete!');
  console.log('\nNext steps:');
  console.log('1. Review the missing table structures above');
  console.log('2. Create the missing tables in Supabase');
  console.log('3. OR modify your app to use existing data storage patterns');
  console.log('4. Test the 406 errors should be resolved');
}

main().catch(console.error);
/**
 * Cleanup script to delete declined/cancelled appointments
 */

import { createClient } from '@supabase/supabase-js';

// Supabase configuration
const supabaseUrl = 'https://oghqwddhojnryovmfvzc.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9naHF3ZGRob2pucnlvdm1mdnpjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMxMTQ1NDEsImV4cCI6MjA2ODY5MDU0MX0.NVvYQFtqIg8OV-vvkAhCNFC_uMC1SBJDSKcLHRjf5w0';

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function cleanupAppointments() {
  try {
    console.log('🔍 Checking appointment statuses...');
    
    // First, check what statuses exist
    const { data: statusCheck, error: statusError } = await supabase
      .from('future_appointments')
      .select('status')
      .neq('status', null);
    
    if (statusError) {
      throw statusError;
    }
    
    // Count statuses
    const statusCounts = {};
    statusCheck.forEach(appointment => {
      const status = appointment.status;
      statusCounts[status] = (statusCounts[status] || 0) + 1;
    });
    
    console.log('📊 Current appointment statuses:');
    Object.entries(statusCounts).forEach(([status, count]) => {
      console.log(`  ${status}: ${count}`);
    });
    
    // Delete cancelled appointments
    console.log('\n🗑️ Deleting CANCELLED appointments...');
    const { data: deletedCancelled, error: deleteError } = await supabase
      .from('future_appointments')
      .delete()
      .eq('status', 'CANCELLED')
      .select();
    
    if (deleteError) {
      throw deleteError;
    }
    
    console.log(`✅ Deleted ${deletedCancelled?.length || 0} CANCELLED appointments`);
    
    // Also delete NO_SHOW appointments if any
    console.log('\n🗑️ Deleting NO_SHOW appointments...');
    const { data: deletedNoShow, error: deleteNoShowError } = await supabase
      .from('future_appointments')
      .delete()
      .eq('status', 'NO_SHOW')
      .select();
    
    if (deleteNoShowError) {
      throw deleteNoShowError;
    }
    
    console.log(`✅ Deleted ${deletedNoShow?.length || 0} NO_SHOW appointments`);
    
    // Check final count
    const { count: finalCount, error: countError } = await supabase
      .from('future_appointments')
      .select('id', { count: 'exact', head: true });
    
    if (countError) {
      throw countError;
    }
    
    console.log(`\n📈 Final appointment count: ${finalCount}`);
    console.log('✨ Cleanup completed successfully!');
    
  } catch (error) {
    console.error('❌ Error during cleanup:', error);
  }
}

// Run the cleanup
cleanupAppointments();
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://oghqwddhojnryovmfvzc.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9naHF3ZGRob2pucnlvdm1mdnpjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMxMTQ1NDEsImV4cCI6MjA2ODY5MDU0MX0.NVvYQFtqIg8OV-vvkAhCNFC_uMC1SBJDSKcLHRjf5w0';

console.log('🔍 COMPREHENSIVE DATA SOURCE ANALYSIS');
console.log('=====================================');

const supabase = createClient(supabaseUrl, supabaseKey);

async function analyzeAllDataSources() {
  try {
    // 1. DATABASE ANALYSIS
    console.log('\n📊 DATABASE ANALYSIS:');
    console.log('----------------------');
    
    // Check daily_expenses table
    const { data: expenses, error: expenseError } = await supabase
      .from('daily_expenses')
      .select('*')
      .limit(10);
    
    console.log('💸 DAILY_EXPENSES TABLE:');
    console.log('  Count:', expenses?.length || 0);
    console.log('  Error:', expenseError?.message || 'None');
    if (expenses?.length) {
      expenses.slice(0, 3).forEach((exp, i) => {
        console.log(`  ${i+1}. ${exp.expense_date} | ${exp.description} | ₹${exp.amount} | ${exp.payment_mode}`);
      });
    }
    
    // Check patient_transactions table
    const { data: transactions, error: transError } = await supabase
      .from('patient_transactions')
      .select('*')
      .limit(10);
    
    console.log('\n💳 PATIENT_TRANSACTIONS TABLE:');
    console.log('  Count:', transactions?.length || 0);
    console.log('  Error:', transError?.message || 'None');
    if (transactions?.length) {
      transactions.slice(0, 3).forEach((trans, i) => {
        const date = trans.transaction_date || trans.created_at?.split('T')[0];
        console.log(`  ${i+1}. ${date} | ${trans.description} | ₹${trans.amount} | ${trans.payment_mode} | ${trans.receipt_number || 'N/A'}`);
      });
    }
    
    // 2. LOCALSTORAGE ANALYSIS (simulated - can't access from Node.js)
    console.log('\n💾 LOCALSTORAGE ANALYSIS:');
    console.log('-------------------------');
    console.log('❗ LocalStorage keys to check in browser:');
    console.log('  - hospital_crm_expenses (LocalStorageService expenses)');
    console.log('  - hospital_crm_transactions (LocalStorageService transactions)');
    console.log('  - hospital_appointments (Dashboard appointments)');
    console.log('  - lastPatientUpdate (Cache control)');
    console.log('  - lastTransactionUpdate (Cache control)');
    console.log('  - dashboardRefreshTime (Cache control)');
    
    // 3. REACT QUERY CACHE ANALYSIS
    console.log('\n🔄 REACT QUERY CACHE ANALYSIS:');
    console.log('------------------------------');
    console.log('Cache keys used in dashboard:');
    console.log('  - queryKeys.dashboardStats (5 min stale time)');
    console.log('  - [\'all-patients\'] (5 min stale time)');
    console.log('  - [\'beds\', \'all\'] (5 min stale time)');
    console.log('  - [\'operations\', \'revenue-expenses\', dateFilter, dates...] (5 min stale time)');
    console.log('  - [\'appointments\', \'dashboard\', \'localStorage\'] (5 min stale time)');
    
    // 4. AUTHENTICATION STATE ANALYSIS
    console.log('\n🔐 AUTHENTICATION ANALYSIS:');
    console.log('----------------------------');
    try {
      const { data: { user } } = await supabase.auth.getUser();
      console.log('Current auth user:', user ? user.email : 'None (Anonymous)');
      console.log('Auth session:', user ? 'Active' : 'None');
      console.log('RLS Impact:', user ? 'Authenticated - Can access data' : 'Anonymous - Blocked by RLS');
    } catch (authError) {
      console.log('Auth check failed:', authError.message);
    }
    
    // 5. DATA FLOW SUMMARY
    console.log('\n🌊 DATA FLOW SUMMARY:');
    console.log('---------------------');
    console.log('Dashboard expense data sources (in order of priority):');
    console.log('1. Supabase daily_expenses table (if authenticated)');
    console.log('2. LocalStorage hospital_crm_expenses (if Supabase fails)');
    console.log('3. React Query cached data (5 min stale time)');
    console.log('4. Empty array fallback ([])');
    
    console.log('\nDashboard transaction data sources:');
    console.log('1. Supabase patient_transactions table (if authenticated)');
    console.log('2. LocalStorage hospital_crm_transactions (if Supabase fails)');
    console.log('3. React Query cached data (5 min stale time)');
    console.log('4. Empty array fallback ([])');
    
    // 6. PROBLEM DIAGNOSIS
    console.log('\n🚨 PROBLEM DIAGNOSIS:');
    console.log('---------------------');
    if (expenseError?.code === '42501' || transError?.code === '42501') {
      console.log('✅ ISSUE IDENTIFIED: Row Level Security (RLS) blocking database access');
      console.log('   - Database tables exist but are protected by RLS policies');
      console.log('   - Anonymous access is blocked');
      console.log('   - Dashboard may be showing cached/localStorage data instead');
      console.log('   - Date filtering works correctly, but operates on limited/stale data');
    } else if (!expenses?.length && !transactions?.length) {
      console.log('⚠️  DATABASE IS EMPTY: No data in either table');
      console.log('   - If dashboard shows data, it\'s coming from localStorage or cache');
      console.log('   - Need to check browser localStorage for actual data source');
    } else {
      console.log('🔍 MIXED RESULTS: Some data access successful');
      console.log('   - May have partial authentication or specific RLS policies');
    }
    
    console.log('\n✅ NEXT STEPS TO RESOLVE:');
    console.log('-------------------------');
    console.log('1. Open browser dev tools → Application → Local Storage');
    console.log('2. Check keys: hospital_crm_expenses, hospital_crm_transactions');
    console.log('3. Check browser Console for dashboard query logs');
    console.log('4. Sign in to the app to authenticate database access');
    console.log('5. Compare authenticated vs anonymous data access');
    
  } catch (error) {
    console.error('❌ Analysis failed:', error.message);
  }
}

analyzeAllDataSources();
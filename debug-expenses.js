import { createClient } from '@supabase/supabase-js';

// Create TWO Supabase clients to test both configurations
const supabaseUrl = 'https://oghqwddhojnryovmfvzc.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9naHF3ZGRob2pucnlvdm1mdnpjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMxMTQ1NDEsImV4cCI6MjA2ODY5MDU0MX0.NVvYQFtqIg8OV-vvkAhCNFC_uMC1SBJDSKcLHRjf5w0';

console.log('🔗 Testing BOTH Supabase configurations...');

// Test with same config as supabaseNew.ts (hardcoded)
const supabaseNew = createClient(supabaseUrl, supabaseKey);

// Test with same config as supabase.ts (env vars - should be same)
const supabaseOld = createClient(
  process.env.VITE_SUPABASE_URL || supabaseUrl,
  process.env.VITE_SUPABASE_ANON_KEY || supabaseKey
);

const supabase = supabaseNew; // Use the new config for testing

async function debugExpenses() {
  try {
    console.log('🚨 DEBUGGING EXPENSES DATABASE...');
    
    // Check connection first
    const { data: connectionTest, error: connectionError } = await supabase
      .from('daily_expenses')
      .select('count', { count: 'exact', head: true });
    
    if (connectionError) {
      console.error('❌ Connection error:', connectionError);
      return;
    }
    
    console.log('✅ Connected to database. Total expense records:', connectionTest);
    
    // 1. Check all expenses in database
    const { data: allExpenses, error: allError } = await supabase
      .from('daily_expenses')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(20);
    
    if (allError) {
      console.error('❌ Error fetching all expenses:', allError);
      return;
    }
    
    console.log('💸 ALL EXPENSES IN DATABASE (last 10):');
    allExpenses?.forEach((expense, index) => {
      console.log(`${index + 1}. Date: ${expense.expense_date} | Amount: ₹${expense.amount} | Desc: ${expense.description}`);
    });
    
    console.log('\n💸 UNIQUE EXPENSE DATES:');
    const uniqueDates = [...new Set(allExpenses?.map(e => e.expense_date))];
    uniqueDates.forEach(date => console.log(`- ${date}`));
    
    // 2. Check expenses for today (2025-08-25)
    const today = '2025-08-25';
    const { data: todayExpenses } = await supabase
      .from('daily_expenses')
      .select('*')
      .eq('expense_date', today)
      .order('created_at', { ascending: false });
    
    console.log(`\n💸 EXPENSES FOR TODAY (${today}):`);
    console.log(`Count: ${todayExpenses?.length || 0}`);
    if (todayExpenses?.length) {
      todayExpenses.forEach((expense, index) => {
        console.log(`${index + 1}. Amount: ₹${expense.amount} | Desc: ${expense.description}`);
      });
    }
    
    // 3. Check expenses for yesterday (2025-08-24)  
    const yesterday = '2025-08-24';
    const { data: yesterdayExpenses } = await supabase
      .from('daily_expenses')
      .select('*')
      .eq('expense_date', yesterday)
      .order('created_at', { ascending: false });
    
    console.log(`\n💸 EXPENSES FOR YESTERDAY (${yesterday}):`);
    console.log(`Count: ${yesterdayExpenses?.length || 0}`);
    if (yesterdayExpenses?.length) {
      yesterdayExpenses.forEach((expense, index) => {
        console.log(`${index + 1}. Amount: ₹${expense.amount} | Desc: ${expense.description}`);
      });
      
      const totalAmount = yesterdayExpenses.reduce((sum, e) => sum + (e.amount || 0), 0);
      console.log(`💰 TOTAL FOR ${yesterday}: ₹${totalAmount}`);
    }
    
    // 4. Check date range query (like dashboard does)
    const startDate = '2025-08-24';
    const endDate = '2025-08-24';
    
    const { data: rangeExpenses } = await supabase
      .from('daily_expenses')
      .select('*')
      .gte('expense_date', startDate)
      .lte('expense_date', endDate)
      .order('expense_date', { ascending: false });
    
    console.log(`\n💸 DATE RANGE QUERY (${startDate} to ${endDate}):`);
    console.log(`Count: ${rangeExpenses?.length || 0}`);
    if (rangeExpenses?.length) {
      const totalRangeAmount = rangeExpenses.reduce((sum, e) => sum + (e.amount || 0), 0);
      console.log(`💰 TOTAL: ₹${totalRangeAmount}`);
    }
    
    // 5. Check if data is coming from patient_transactions table instead
    console.log('\n📋 CHECKING PATIENT_TRANSACTIONS TABLE...');
    const { data: allTransactions, error: transError } = await supabase
      .from('patient_transactions')
      .select('*')
      .limit(10)
      .order('created_at', { ascending: false });
    
    if (transError) {
      console.error('❌ Error querying patient_transactions:', transError);
    } else {
      console.log('💳 PATIENT TRANSACTIONS FOUND:', allTransactions?.length || 0);
      allTransactions?.forEach((trans, index) => {
        console.log(`${index + 1}. ${trans.transaction_date || trans.created_at?.split('T')[0]} | ${trans.description} | ₹${trans.amount} | ${trans.payment_mode} | ${trans.receipt_number || 'N/A'}`);
      });
    }
    
    // 6. Check transaction_date filtering specifically for 2025-08-24
    console.log('\n💰 CHECKING TRANSACTIONS FOR 2025-08-24...');
    const { data: todayTransactions } = await supabase
      .from('patient_transactions')
      .select('*')
      .eq('transaction_date', '2025-08-24')
      .limit(20);
    
    console.log('💰 Transactions for 2025-08-24:', todayTransactions?.length || 0);
    todayTransactions?.forEach((trans, index) => {
      console.log(`${index + 1}. ${trans.description} | ₹${trans.amount} | ${trans.payment_mode} | ${trans.receipt_number || 'N/A'}`);
    });
    
  } catch (error) {
    console.error('❌ Debug error:', error);
  }
}

debugExpenses();
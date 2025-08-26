import React, { useState, useEffect, useMemo } from 'react';
import toast from 'react-hot-toast';
import { supabase } from '../config/supabaseNew';
import { exportToExcel, formatCurrency, formatDateTime } from '../utils/excelExport';
import ModernDatePicker from './ui/ModernDatePicker';

// Function to convert UTC database time to actual local system time
const formatLocalTime = (dateTime: Date | string): string => {
  try {
    const validDateTime = dateTime instanceof Date ? dateTime : new Date(dateTime);
    
    if (isNaN(validDateTime.getTime())) {
      return 'Invalid Time';
    }
    
    // Manual conversion: UTC time + local timezone offset
    const utcTime = validDateTime.getTime();
    const localTimezoneOffset = new Date().getTimezoneOffset() * 60 * 1000; // Convert minutes to milliseconds
    const localTime = new Date(utcTime - localTimezoneOffset); // Subtract because getTimezoneOffset returns negative for positive timezones
    
    return localTime.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  } catch (error) {
    console.error('Time formatting error:', error);
    return 'Time Error';
  }
};

interface LedgerEntry {
  id: string;
  date: string;
  time: string;
  type: 'REVENUE' | 'EXPENSE' | 'REFUND';
  category: string;
  description: string;
  amount: number;
  original_amount?: number;
  discount_amount?: number;
  net_amount?: number;
  payment_mode: 'CASH' | 'ONLINE';
  patient_name?: string;
  patient_id?: string;
  patient_age?: string;
  patient_gender?: string;
  consultant_name?: string;
  department?: string;
  patient_tag?: string;
  reference_id?: string;
  created_at: string;
}

const OperationsLedger: React.FC = () => {
  const [entries, setEntries] = useState<LedgerEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateFrom, setDateFrom] = useState(new Date().toISOString().split('T')[0]); // Default to today
  const [dateTo, setDateTo] = useState(new Date().toISOString().split('T')[0]);
  const [filterPaymentMode, setFilterPaymentMode] = useState<'all' | 'CASH' | 'ONLINE'>('all');
  const [filterType, setFilterType] = useState<'all' | 'REVENUE' | 'EXPENSE' | 'REFUND'>('all');
  const [filterPatientTag, setFilterPatientTag] = useState<string>('all');
  const [availablePatientTags, setAvailablePatientTags] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<'date' | 'amount' | 'patient' | 'type' | 'time'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  
  // Debug: Log state changes
  useEffect(() => {
    console.log('🔧 Sort state changed:', { sortBy, sortOrder });
  }, [sortBy, sortOrder]);

  useEffect(() => {
    console.log('🚀 OperationsLedger component mounted with sorting enabled');
    loadLedgerEntries();
  }, [dateFrom, dateTo]);

  const loadLedgerEntries = async () => {
    setLoading(true);
    
    // 🔄 CRITICAL: Clear any cached data
    console.log('🔄 Reloading operations ledger with fresh data...');
    console.log('📅 Date range for query:', { dateFrom, dateTo });
    
    try {
      const allEntries: LedgerEntry[] = [];
      
      // CRITICAL FIX: Load patient transactions with flexible date filtering
      // Many transactions may have NULL transaction_date, so we need a more inclusive query
      const { data: transactions, error: transError } = await supabase
        .from('patient_transactions')
        .select(`
          id,
          amount,
          payment_mode,
          transaction_type,
          transaction_date,
          description,
          doctor_name,
          status,
          created_at,
          patient:patients(id, patient_id, first_name, last_name, age, gender, patient_tag, assigned_doctor, assigned_department, date_of_entry)
        `)
        .eq('status', 'COMPLETED')
        .order('created_at', { ascending: false });

      if (transError) {
        console.error('Error loading transactions:', transError);
      } else if (transactions) {
        console.log(`📊 Retrieved ${transactions.length} transactions, now filtering by date range ${dateFrom} to ${dateTo}`);
        
        transactions.forEach((trans: any) => {
          // FILTER: Skip only DR HEMANT with ORTHO department (not DR HEMANT KHAJJA with ORTHOPAEDIC)
          const filterDoctorName = trans.patient?.assigned_doctor?.toUpperCase() || '';
          const filterDepartment = trans.patient?.assigned_department?.toUpperCase() || '';
          
          // Skip only if it's specifically DR HEMANT (not KHAJJA) with ORTHO department
          if (filterDepartment === 'ORTHO' && filterDoctorName === 'DR HEMANT') {
            return; // Skip this specific combination
          }
          
          let cleanDescription = trans.description || `${trans.transaction_type} Payment`;
          let originalAmount = trans.amount;
          let discountAmount = 0;
          let netAmount = trans.amount;
          
          // Parse existing description for discount information
          if (cleanDescription.includes('Original:') && cleanDescription.includes('Discount:') && cleanDescription.includes('Net:')) {
            // Extract original amount
            const originalMatch = cleanDescription.match(/Original:\s*₹([\d,]+(?:\.\d{2})?)/); 
            if (originalMatch) {
              originalAmount = parseFloat(originalMatch[1].replace(/,/g, ''));
            }
            
            // Extract discount amount
            const discountMatch = cleanDescription.match(/Discount:\s*\d+%\s*\(₹([\d,]+(?:\.\d{2})?)\)/);
            if (discountMatch) {
              discountAmount = parseFloat(discountMatch[1].replace(/,/g, ''));
            }
            
            // Extract net amount
            const netMatch = cleanDescription.match(/Net:\s*₹([\d,]+(?:\.\d{2})?)/); 
            if (netMatch) {
              netAmount = parseFloat(netMatch[1].replace(/,/g, ''));
            }
            
            // Clean the description - remove discount calculations
            cleanDescription = cleanDescription.replace(/\s*\|\s*Original:.*?Net:\s*₹[\d,]+(?:\.\d{2})?/, '');
          }
          
          // Extract consultant name and department
          let consultantName = '';
          let department = '';
          
          // If it's a consultation, ensure proper doctor name format
          if (trans.transaction_type === 'consultation') {
            // Extract doctor name from description if present
            const doctorMatch = cleanDescription.match(/Consultation Fee - (.+?)(?:\s*-\s*Patient Age|$)/);
            if (doctorMatch) {
              consultantName = doctorMatch[1];
              cleanDescription = `Consultation Fee - ${consultantName}`;
            } else if (trans.doctor_name) {
              consultantName = trans.doctor_name.toUpperCase();
              cleanDescription = `Consultation Fee - ${consultantName}`;
            } else if (trans.patient?.assigned_doctor) {
              consultantName = trans.patient.assigned_doctor;
              cleanDescription = `Consultation Fee - ${consultantName}`;
            }
          } else if (trans.patient?.assigned_doctor) {
            consultantName = trans.patient.assigned_doctor;
          }
          
          // Get department from patient's assigned department
          if (trans.patient?.assigned_department) {
            department = trans.patient.assigned_department;
          }
          
          // Add patient age to description (keep for backward compatibility)
          if (trans.patient?.age) {
            cleanDescription += ` - Patient Age: ${trans.patient.age} years`;
          }
          
          // CRITICAL FIX: Always prioritize transaction_date (this is the service date selected by user)
          let effectiveDate = new Date();
          let effectiveDateStr = '';
          let transactionDateTime = new Date(trans.created_at); // Use created_at for time display
          
          // Debug logging for date issues
          console.log('📅 OPERATIONS DATE DEBUG:', {
            transaction_id: trans.id,
            transaction_date: trans.transaction_date,
            transaction_date_type: typeof trans.transaction_date,
            patient_date_of_entry: trans.patient?.date_of_entry,
            created_at: trans.created_at,
            description: trans.description?.substring(0, 50),
            patient_name: `${trans.patient?.first_name} ${trans.patient?.last_name}`
          });
          
          if (trans.transaction_date && trans.transaction_date.trim() !== '') {
            // PRIORITY 1: Use transaction_date (this is the service date selected by user in PatientServiceManager)
            effectiveDateStr = trans.transaction_date.includes('T') 
              ? trans.transaction_date.split('T')[0] 
              : trans.transaction_date;
            // 🔥 CRITICAL FIX: Parse date correctly to avoid month/day swapping
            const dateParts = effectiveDateStr.split('-'); // ['2025', '08', '14']
            effectiveDate = new Date(parseInt(dateParts[0]), parseInt(dateParts[1]) - 1, parseInt(dateParts[2])); // Month is 0-based
            console.log('✅ Using transaction_date:', effectiveDateStr, '→', effectiveDate.toLocaleDateString());
          } else if (trans.patient?.date_of_entry && trans.patient.date_of_entry.trim() !== '') {
            // PRIORITY 2: Fallback to patient's date_of_entry
            effectiveDateStr = trans.patient.date_of_entry.includes('T') 
              ? trans.patient.date_of_entry.split('T')[0] 
              : trans.patient.date_of_entry;
            // 🔥 CRITICAL FIX: Parse date correctly to avoid month/day swapping
            const dateParts = effectiveDateStr.split('-'); // ['2025', '08', '14']
            effectiveDate = new Date(parseInt(dateParts[0]), parseInt(dateParts[1]) - 1, parseInt(dateParts[2])); // Month is 0-based
            console.log('⚠️ Falling back to patient date_of_entry:', effectiveDateStr, '→', effectiveDate.toLocaleDateString());
          } else {
            // PRIORITY 3: Final fallback to created_at
            effectiveDate = new Date(trans.created_at);
            effectiveDateStr = trans.created_at.split('T')[0];
            console.log('⚠️ Falling back to created_at:', effectiveDateStr, '→', effectiveDate.toLocaleDateString());
          }
          
          // CLIENT-SIDE DATE FILTERING: Now check if this transaction falls within the selected date range
          if (effectiveDateStr < dateFrom || effectiveDateStr > dateTo) {
            console.log(`❌ Transaction ${trans.id} outside date range: ${effectiveDateStr} not in ${dateFrom}-${dateTo}`);
            return; // Skip this transaction
          }
          
          console.log(`✅ Transaction ${trans.id} within date range: ${effectiveDateStr} in ${dateFrom}-${dateTo}`);
          
          // 🔍 DEBUG DATE FORMATTING ISSUE
          console.log('🔍 DATE FORMATTING DEBUG:', {
            transaction_id: trans.id,
            effectiveDateStr: effectiveDateStr,
            effectiveDate: effectiveDate.toISOString(),
            effectiveDateLocal: effectiveDate.toString(),
            willFormat: 'DD/MM/YYYY using en-IN locale'
          });
          
          // 🔥 CRITICAL FIX: Format date manually to avoid locale issues
          const day = effectiveDate.getDate().toString().padStart(2, '0');
          const month = (effectiveDate.getMonth() + 1).toString().padStart(2, '0'); // Month is 0-based
          const year = effectiveDate.getFullYear();
          const istDate = `${day}/${month}/${year}`;
          
          // 🔍 DEBUG FORMATTED DATE
          console.log('🔍 FORMATTED DATE RESULT:', {
            transaction_id: trans.id,
            originalStr: effectiveDateStr,
            formattedDate: istDate,
            expectedFormat: 'DD/MM/YYYY'
          });
          
          // Convert UTC database time to local time
          const localTime = formatLocalTime(transactionDateTime);
          
          // CRITICAL FIX: Identify refunds (negative amount transactions)
          const isRefund = trans.amount < 0;
          const entryType = isRefund ? 'REFUND' : 'REVENUE';
          const displayAmount = Math.abs(trans.amount); // Always show positive amount for display
          
          allEntries.push({
            id: trans.id,
            date: istDate,
            time: localTime,
            type: entryType,
            category: isRefund ? 'REFUND' : trans.transaction_type,
            description: cleanDescription,
            amount: displayAmount,
            original_amount: Math.abs(originalAmount),
            discount_amount: discountAmount,
            net_amount: Math.abs(netAmount),
            payment_mode: trans.payment_mode || 'CASH',
            patient_name: trans.patient ? `${trans.patient.first_name} ${trans.patient.last_name}` : 'Unknown',
            patient_id: trans.patient?.patient_id,
            patient_age: trans.patient?.age || '',
            patient_gender: trans.patient?.gender || '',
            consultant_name: consultantName,
            department: department,
            patient_tag: trans.patient?.patient_tag || '',
            reference_id: trans.id,
            created_at: trans.created_at
          });
        });
      }

      // Load daily expenses
      const { data: expenses, error: expError } = await supabase
        .from('daily_expenses')
        .select('*')
        .gte('expense_date', dateFrom)
        .lte('expense_date', dateTo)
        .order('expense_date', { ascending: false });

      if (expError) {
        console.error('Error loading expenses:', expError);
      } else if (expenses) {
        console.log('💰 Loaded expenses from database:', expenses);
        console.log('💰 Number of expenses found:', expenses.length);
        expenses.forEach((expense: any) => {
          // CRITICAL FIX: Format expenses date and time in IST 12-hour format
          const expenseDate = new Date(expense.expense_date);
          const expenseDateTime = new Date(expense.created_at);
          
          const istDate = expenseDate.toLocaleDateString('en-IN', {
            timeZone: 'Asia/Kolkata',
            day: '2-digit',
            month: '2-digit', 
            year: 'numeric'
          });
          
          // Convert UTC database time to local time
          const localTime = formatLocalTime(expenseDateTime);
          
          // Use description as primary expense name, fallback to category
          let expenseName = 'Daily Expense';
          if (expense.description && expense.description.trim()) {
            expenseName = expense.description.trim();
          } else if (expense.expense_category && expense.expense_category.trim()) {
            expenseName = expense.expense_category.trim();
          }
          
          console.log('💰 Processing expense:', {
            id: expense.id,
            category: expense.expense_category,
            description: expense.description,
            finalName: expenseName
          });

          allEntries.push({
            id: expense.id,
            date: istDate,
            time: localTime,
            type: 'EXPENSE',
            category: expense.expense_category,
            description: expense.description,
            amount: expense.amount,
            payment_mode: expense.payment_mode || 'CASH',
            patient_name: expenseName, // Show expense name
            patient_id: 'N/A', // Expenses don't have patient IDs
            patient_age: 'N/A', // Expenses don't have patient age
            patient_gender: 'N/A', // Expenses don't have patient gender
            consultant_name: expense.approved_by || 'System',
            department: 'Administration',
            patient_tag: 'N/A',
            reference_id: expense.id,
            created_at: expense.created_at
          });
        });
      }

      // Load refunds with error handling
      let refunds: any[] = [];
      
      try {
        const { data: refundData, error: refundError } = await supabase
          .from('patient_refunds')
          .select(`
            *,
            patient:patients(id, patient_id, first_name, last_name, age, gender, patient_tag, assigned_doctor, assigned_department, date_of_entry)
          `)
          .eq('hospital_id', '550e8400-e29b-41d4-a716-446655440000')
          .gte('created_at', `${dateFrom}T00:00:00`)
          .lte('created_at', `${dateTo}T23:59:59`)
          .order('created_at', { ascending: false });
        
        if (refundError) {
          console.warn('⚠️ Patient refunds table not accessible:', refundError.message);
          refunds = [];
        } else {
          refunds = refundData || [];
        }
      } catch (error) {
        console.warn('⚠️ Refunds query failed, using empty array');
        refunds = [];
      }

      if (refunds && refunds.length > 0) {
        refunds.forEach((refund: any) => {
          // CRITICAL FIX: Use patient's date_of_entry for refunds too
          let effectiveDate = new Date();
          let refundDateTime = new Date(refund.created_at); // Always use refund time for time display
          
          if (refund.patient?.date_of_entry && refund.patient.date_of_entry.trim() !== '') {
            // Priority 1: Patient's date_of_entry (for backdated entries)
            const dateStr = refund.patient.date_of_entry.includes('T') 
              ? refund.patient.date_of_entry.split('T')[0] 
              : refund.patient.date_of_entry;
            effectiveDate = new Date(dateStr + 'T00:00:00');
          } else {
            // Priority 2: Refund's created_at date (fallback)
            effectiveDate = new Date(refund.created_at);
          }
          
          // CRITICAL FIX: Format date and time in IST 12-hour format
          const istDate = effectiveDate.toLocaleDateString('en-IN', {
            timeZone: 'Asia/Kolkata',
            day: '2-digit',
            month: '2-digit', 
            year: 'numeric'
          });
          
          // Convert UTC database time to local time
          const localTime = formatLocalTime(refundDateTime);
          
          allEntries.push({
            id: refund.id,
            date: istDate,
            time: localTime,
            type: 'REFUND',
            category: 'REFUND',
            description: refund.reason || 'Patient Refund',
            amount: refund.amount,
            payment_mode: refund.payment_mode || 'CASH',
            patient_name: refund.patient ? `${refund.patient.first_name} ${refund.patient.last_name}` : 'Unknown',
            patient_id: refund.patient?.patient_id,
            patient_age: refund.patient?.age || '',
            patient_gender: refund.patient?.gender || '',
            consultant_name: refund.patient?.assigned_doctor || '',
            department: refund.patient?.assigned_department || '',
            patient_tag: refund.patient?.patient_tag || '',
            reference_id: refund.id,
            created_at: refund.created_at
          });
        });
      }

      // Sort all entries by date/time
      allEntries.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      
      // Extract unique patient tags (add default suggestions like PatientList)
      const uniqueTags = [...new Set([
        ...allEntries
          .map(entry => entry.patient_tag)
          .filter(tag => tag && tag.trim() !== ''),
        'Community', 'Camp' // Add common suggestions
      ])].sort();
      
      console.log('🏥 Operations Debug - All Entries:', allEntries.length);
      console.log('🏥 Operations Debug - Patient Tags Found:', uniqueTags);
      console.log('🏥 Operations Debug - Sample entries with tags:', 
        allEntries
          .filter(e => e.patient_tag)
          .slice(0, 3)
          .map(e => ({ patient: e.patient_name, tag: e.patient_tag }))
      );
      console.log('🏥 Operations Debug - Date Range:', { dateFrom, dateTo });
      
      if (uniqueTags.length === 2) { // Only 'Camp' and 'Community' defaults
        console.log('🔍 No actual patient tags found in database for date range');
        console.log('💡 Try: 1) Add patients with tags, or 2) Expand date range');
      }
      
      setAvailablePatientTags(uniqueTags);
      
      // Debug: Log all entries before setting them
      console.log('🔍 All entries being set:', allEntries);
      console.log('🔍 Expense entries only:', allEntries.filter(e => e.type === 'EXPENSE'));
      
      setEntries(allEntries);
    } catch (error: any) {
      console.error('Error loading ledger:', error);
      toast.error('Failed to load ledger entries');
    } finally {
      setLoading(false);
    }
  };

  const getFilteredEntries = () => {
    let filtered = [...entries];

    if (filterType !== 'all') {
      filtered = filtered.filter(entry => entry.type === filterType);
    }

    if (filterPaymentMode !== 'all') {
      filtered = filtered.filter(entry => entry.payment_mode === filterPaymentMode);
    }

    if (filterPatientTag !== 'all') {
      filtered = filtered.filter(entry => entry.patient_tag === filterPatientTag);
    }

    return filtered;
  };

  const calculateTotals = (filteredEntries: LedgerEntry[]) => {
    const totals = {
      revenue: 0,
      expenses: 0,
      refunds: 0,
      cashRevenue: 0,
      onlineRevenue: 0,
      cashExpenses: 0,
      onlineExpenses: 0,
      cashRefunds: 0,
      onlineRefunds: 0
    };

    filteredEntries.forEach(entry => {
      if (entry.type === 'REVENUE') {
        totals.revenue += entry.amount;
        if (entry.payment_mode?.toLowerCase() === 'cash') {
          totals.cashRevenue += entry.amount;
        } else if (['online', 'card', 'upi'].includes(entry.payment_mode?.toLowerCase())) {
          totals.onlineRevenue += entry.amount;
        }
      } else if (entry.type === 'EXPENSE') {
        totals.expenses += entry.amount;
        if (entry.payment_mode?.toLowerCase() === 'cash') {
          totals.cashExpenses += entry.amount;
        } else if (['online', 'card', 'upi'].includes(entry.payment_mode?.toLowerCase())) {
          totals.onlineExpenses += entry.amount;
        }
      } else if (entry.type === 'REFUND') {
        totals.refunds += entry.amount;
        if (entry.payment_mode?.toLowerCase() === 'cash') {
          totals.cashRefunds += entry.amount;
        } else if (['online', 'card', 'upi'].includes(entry.payment_mode?.toLowerCase())) {
          totals.onlineRefunds += entry.amount;
        }
      }
    });

    const netRevenue = totals.revenue - totals.expenses - totals.refunds;
    // Deduct ALL expenses and refunds from cash (regardless of their payment mode)
    const netCash = totals.cashRevenue - totals.expenses - totals.refunds;
    const netOnline = totals.onlineRevenue;

    // Debug logging
    console.log('💰 OPERATIONS CALCULATION DEBUG:', {
      filteredEntriesCount: filteredEntries.length,
      totalRevenue: totals.revenue,
      totalExpenses: totals.expenses,
      totalRefunds: totals.refunds,
      cashRevenue: totals.cashRevenue,
      onlineRevenue: totals.onlineRevenue,
      netCash: netCash,
      netOnline: netOnline,
      netRevenue: netRevenue,
      sampleEntries: filteredEntries.slice(0, 5).map(e => ({
        type: e.type,
        amount: e.amount,
        payment_mode: e.payment_mode
      }))
    });

    return { ...totals, netRevenue, netCash, netOnline };
  };

  const filteredEntries = getFilteredEntries();
  
  // Apply sorting with useMemo to ensure re-sorting when sort options change
  const sortedEntries = useMemo(() => {
    console.log('🚀 SORTING DEBUG START');
    console.log('📊 Current sort settings:', { sortBy, sortOrder });
    console.log('📋 Entries to sort:', filteredEntries.length);
    
    if (filteredEntries.length === 0) {
      console.log('⚠️ No entries to sort');
      return [];
    }
    
    // Log first few entries before sorting
    console.log('🔍 Sample entries before sorting:', filteredEntries.slice(0, 3).map(e => ({
      id: e.id,
      date: e.date,
      time: e.time,
      amount: e.amount,
      patient: e.patient_name,
      type: e.type
    })));
    
    const sorted = [...filteredEntries].sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'date':
          // Sort by date first, then by time
          try {
            // Convert DD/MM/YYYY format to a parseable format (MM/DD/YYYY)
            const convertDate = (ddmmyyyy: string, time: string) => {
              const [day, month, year] = ddmmyyyy.split('/');
              const convertedDate = `${month}/${day}/${year} ${time}`;
              console.log(`🔄 Converting date: ${ddmmyyyy} ${time} → ${convertedDate}`);
              return new Date(convertedDate).getTime();
            };
            
            const dateA = convertDate(a.date, a.time);
            const dateB = convertDate(b.date, b.time);
            comparison = dateA - dateB;
            console.log(`📅 Date compare: ${a.date} ${a.time} vs ${b.date} ${b.time} = ${comparison}`);
            
            if (isNaN(dateA) || isNaN(dateB)) {
              console.error('❌ Date conversion failed:', { 
                a: { date: a.date, time: a.time, converted: dateA },
                b: { date: b.date, time: b.time, converted: dateB }
              });
              comparison = 0;
            }
          } catch (error) {
            console.error('❌ Date parsing error:', error, { 
              a: a.date + ' ' + a.time, 
              b: b.date + ' ' + b.time 
            });
            comparison = 0;
          }
          break;
        case 'amount':
          const amountA = a.net_amount || a.amount;
          const amountB = b.net_amount || b.amount;
          comparison = amountA - amountB;
          console.log(`💰 Amount compare: ${amountA} vs ${amountB} = ${comparison}`);
          break;
        case 'patient':
          const nameA = a.patient_name || '';
          const nameB = b.patient_name || '';
          comparison = nameA.localeCompare(nameB);
          console.log(`👤 Patient compare: "${nameA}" vs "${nameB}" = ${comparison}`);
          break;
        case 'type':
          comparison = a.type.localeCompare(b.type);
          console.log(`🏷️ Type compare: ${a.type} vs ${b.type} = ${comparison}`);
          break;
        default:
          console.log('❓ Unknown sort criteria:', sortBy);
          comparison = 0;
      }
      
      const result = sortOrder === 'asc' ? comparison : -comparison;
      return result;
    });
    
    // Log first few entries after sorting
    console.log('✅ Sample entries after sorting:', sorted.slice(0, 3).map(e => ({
      id: e.id,
      date: e.date,
      time: e.time,
      amount: e.amount,
      patient: e.patient_name,
      type: e.type
    })));
    
    console.log('🏁 SORTING DEBUG END - Returning', sorted.length, 'sorted entries');
    return sorted;
  }, [filteredEntries, sortBy, sortOrder]);
  
  const totals = calculateTotals(filteredEntries);

  const exportOperationsToExcel = () => {
    try {
      const exportData = sortedEntries.map(entry => {
        // Calculate proper amounts with negative signs for expenses/refunds
        const originalAmount = entry.original_amount || entry.amount;
        const discountAmount = entry.discount_amount || 0;
        const netAmount = entry.net_amount || entry.amount;
        
        // Apply negative sign for expenses and refunds
        const signedOriginalAmount = (entry.type === 'EXPENSE' || entry.type === 'REFUND') ? -originalAmount : originalAmount;
        const signedNetAmount = (entry.type === 'EXPENSE' || entry.type === 'REFUND') ? -netAmount : netAmount;
        
        return {
          date: entry.date,
          time: entry.time,
          patient_id: entry.patient_id || '',
          patient_name: entry.patient_name || '',
          age: entry.patient_age || '',
          gender: entry.patient_gender || '',
          consultant: entry.consultant_name || '',
          department: entry.department || '',
          type: entry.type,
          category: entry.category,
          description: entry.description,
          patient_tag: entry.patient_tag || '',
          payment_mode: entry.payment_mode,
          original_amount: signedOriginalAmount,
          discount_amount: discountAmount,
          net_amount: signedNetAmount
        };
      });

      const success = exportToExcel({
        filename: `Operations_Ledger_${dateFrom}_to_${dateTo}`,
        headers: [
          'Date',
          'Time',
          'Patient ID',
          'Patient Name / Expense Name',
          'Age',
          'Gender',
          'Consultant',
          'Department',
          'Type',
          'Category',
          'Description',
          'Patient Tag',
          'Payment Mode',
          'Original Amount',
          'Discount Amount',
          'Net Amount'
        ],
        data: exportData,
        formatters: {
          original_amount: (value) => Number(value).toFixed(2),
          discount_amount: (value) => Number(value).toFixed(2),
          net_amount: (value) => Number(value).toFixed(2)
        }
      });

      if (success) {
        toast.success('Operations ledger exported successfully!');
      } else {
        toast.error('Failed to export operations ledger');
      }
    } catch (error: any) {
      console.error('Export error:', error);
      toast.error('Failed to export: ' + error.message);
    }
  };

  const printOperationsReport = () => {
    console.log('🖨️ Print function called');
    
    try {
      if (sortedEntries.length === 0) {
        toast.error('No data to print');
        return;
      }

      console.log('📊 Sorted entries length:', sortedEntries.length);

      const totals = calculateTotals(sortedEntries);
      const revenueEntries = sortedEntries.filter(e => e.type === 'REVENUE');
      const expenseEntries = sortedEntries.filter(e => e.type === 'EXPENSE');
      const refundEntries = sortedEntries.filter(e => e.type === 'REFUND');
      
      const printContent = `
        <html>
          <head>
            <title>Operations Ledger - Transaction Details Report</title>
            <style>
              @media print {
                body { font-family: Arial, sans-serif; font-size: 9px; margin: 15px; line-height: 1.3; }
                .header { text-align: center; margin-bottom: 15px; border-bottom: 2px solid #000; padding-bottom: 8px; }
                .header h1 { font-size: 14px; margin: 0 0 3px 0; }
                .header h2 { font-size: 12px; margin: 0 0 3px 0; color: #333; }
                .header p { font-size: 8px; margin: 1px 0; color: #666; }
                .summary { margin: 10px 0; padding: 8px; background: #f8f8f8; border: 1px solid #ddd; }
                .summary h3 { font-size: 10px; margin: 0 0 5px 0; font-weight: bold; }
                .summary-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px; margin-bottom: 8px; }
                .summary-item { text-align: center; }
                .summary-item strong { display: block; font-size: 8px; color: #666; }
                .summary-item span { font-size: 10px; font-weight: bold; }
                .net-revenue { background: #e8f5e8; padding: 8px; margin: 8px 0; border: 1px solid #4CAF50; text-align: center; }
                .net-revenue h4 { margin: 0 0 5px 0; font-size: 10px; color: #2E7D32; }
                .breakdown-section { margin: 12px 0; }
                .breakdown-section h4 { font-size: 9px; font-weight: bold; margin: 0 0 5px 0; padding: 3px 0; border-bottom: 1px solid #ccc; }
                table { width: 100%; border-collapse: collapse; margin: 8px 0; }
                th, td { border: 1px solid #ccc; padding: 3px; text-align: left; font-size: 7px; }
                th { background-color: #f0f0f0; font-weight: bold; }
                .revenue-row { background-color: #f0fff0; }
                .expense-row { background-color: #fff0f0; }
                .refund-row { background-color: #fff8f0; }
                .totals { margin-top: 12px; font-weight: bold; border-top: 2px solid #000; padding-top: 8px; }
                .totals-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px; }
                @page { margin: 0.4in; size: A4; }
              }
              body { font-family: Arial, sans-serif; font-size: 9px; margin: 15px; line-height: 1.3; }
              .header { text-align: center; margin-bottom: 15px; border-bottom: 2px solid #000; padding-bottom: 8px; }
              .header h1 { font-size: 14px; margin: 0 0 3px 0; }
              .header h2 { font-size: 12px; margin: 0 0 3px 0; color: #333; }
              .header p { font-size: 8px; margin: 1px 0; color: #666; }
              .summary { margin: 10px 0; padding: 8px; background: #f8f8f8; border: 1px solid #ddd; }
              .summary h3 { font-size: 10px; margin: 0 0 5px 0; font-weight: bold; }
              .summary-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px; margin-bottom: 8px; }
              .summary-item { text-align: center; }
              .summary-item strong { display: block; font-size: 8px; color: #666; }
              .summary-item span { font-size: 10px; font-weight: bold; }
              .net-revenue { background: #e8f5e8; padding: 8px; margin: 8px 0; border: 1px solid #4CAF50; text-align: center; }
              .net-revenue h4 { margin: 0 0 5px 0; font-size: 10px; color: #2E7D32; }
              .breakdown-section { margin: 12px 0; }
              .breakdown-section h4 { font-size: 9px; font-weight: bold; margin: 0 0 5px 0; padding: 3px 0; border-bottom: 1px solid #ccc; }
              table { width: 100%; border-collapse: collapse; margin: 8px 0; }
              th, td { border: 1px solid #ccc; padding: 3px; text-align: left; font-size: 7px; }
              th { background-color: #f0f0f0; font-weight: bold; }
              .revenue-row { background-color: #f0fff0; }
              .expense-row { background-color: #fff0f0; }
              .refund-row { background-color: #fff8f0; }
              .totals { margin-top: 12px; font-weight: bold; border-top: 2px solid #000; padding-top: 8px; }
              .totals-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px; }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>HOSPITAL OPERATIONS LEDGER</h1>
              <h2>Complete Transaction Details & Revenue Analysis</h2>
              <p><strong>Raj Hospital & Maternity Center</strong></p>
              <p>Period: <strong>${dateFrom}</strong> to <strong>${dateTo}</strong></p>
              <p>Report Generated: ${new Date().toLocaleString()} | Total Transactions: ${sortedEntries.length}</p>
            </div>
            
            <div class="summary">
              <h3>📊 Financial Overview</h3>
              <div class="summary-grid">
                <div class="summary-item">
                  <strong>TOTAL REVENUE</strong>
                  <span style="color: green;">${formatCurrency(totals.revenue || 0)}</span>
                </div>
                <div class="summary-item">
                  <strong>TOTAL EXPENSES</strong>
                  <span style="color: red;">${formatCurrency(totals.expenses || 0)}</span>
                </div>
                <div class="summary-item">
                  <strong>TOTAL REFUNDS</strong>
                  <span style="color: orange;">${formatCurrency(refundEntries.reduce((sum, e) => sum + (e.net_amount || e.amount), 0))}</span>
                </div>
              </div>
              <div class="net-revenue">
                <h4>💰 NET REVENUE BREAKDOWN</h4>
                <div style="display: flex; justify-content: space-between; font-size: 9px;">
                  <span><strong>Cash Revenue:</strong> ${formatCurrency(totals.netCash || 0)}</span>
                  <span><strong>Online Revenue:</strong> ${formatCurrency(totals.netOnline || 0)}</span>
                  <span><strong>FINAL NET REVENUE:</strong> ${formatCurrency(totals.netRevenue || 0)}</span>
                </div>
              </div>
            </div>

            <div class="breakdown-section">
              <h4>💚 REVENUE TRANSACTIONS (${revenueEntries.length} entries)</h4>
              <table>
                <thead>
                  <tr>
                    <th width="8%">Date</th>
                    <th width="6%">Time</th>
                    <th width="20%">Patient Name</th>
                    <th width="15%">Category</th>
                    <th width="20%">Description</th>
                    <th width="8%">Amount</th>
                    <th width="8%">Payment</th>
                    <th width="15%">Doctor</th>
                  </tr>
                </thead>
                <tbody>
                  ${revenueEntries.map(entry => `
                    <tr class="revenue-row">
                      <td>${entry.date}</td>
                      <td>${entry.time}</td>
                      <td>${entry.patient_name || 'N/A'}</td>
                      <td>${entry.category}</td>
                      <td>${entry.description}</td>
                      <td style="text-align: right; font-weight: bold; color: green;">₹${((entry.net_amount || entry.amount) || 0).toFixed(0)}</td>
                      <td>${entry.payment_mode}</td>
                      <td>${entry.consultant_name || 'N/A'}</td>
                    </tr>
                  `).join('')}
                  <tr style="border-top: 2px solid green; font-weight: bold;">
                    <td colspan="5" style="text-align: right;"><strong>REVENUE SUBTOTAL:</strong></td>
                    <td style="text-align: right; color: green;"><strong>₹${(totals.revenue || 0).toFixed(0)}</strong></td>
                    <td colspan="2"></td>
                  </tr>
                </tbody>
              </table>
            </div>

            ${expenseEntries.length > 0 ? `
            <div class="breakdown-section">
              <h4>❌ EXPENSE TRANSACTIONS (${expenseEntries.length} entries)</h4>
              <table>
                <thead>
                  <tr>
                    <th width="8%">Date</th>
                    <th width="6%">Time</th>
                    <th width="20%">Expense Name</th>
                    <th width="15%">Category</th>
                    <th width="20%">Description</th>
                    <th width="8%">Amount</th>
                    <th width="8%">Payment</th>
                    <th width="15%">Department</th>
                  </tr>
                </thead>
                <tbody>
                  ${expenseEntries.map(entry => `
                    <tr class="expense-row">
                      <td>${entry.date}</td>
                      <td>${entry.time}</td>
                      <td>${entry.patient_name || 'N/A'}</td>
                      <td>${entry.category}</td>
                      <td>${entry.description}</td>
                      <td style="text-align: right; font-weight: bold; color: red;">-₹${((entry.net_amount || entry.amount) || 0).toFixed(0)}</td>
                      <td>${entry.payment_mode}</td>
                      <td>${entry.department || 'N/A'}</td>
                    </tr>
                  `).join('')}
                  <tr style="border-top: 2px solid red; font-weight: bold;">
                    <td colspan="5" style="text-align: right;"><strong>EXPENSES SUBTOTAL:</strong></td>
                    <td style="text-align: right; color: red;"><strong>-₹${(totals.expenses || 0).toFixed(0)}</strong></td>
                    <td colspan="2"></td>
                  </tr>
                </tbody>
              </table>
            </div>
            ` : ''}

            ${refundEntries.length > 0 ? `
            <div class="breakdown-section">
              <h4>🔄 REFUND TRANSACTIONS (${refundEntries.length} entries)</h4>
              <table>
                <thead>
                  <tr>
                    <th width="8%">Date</th>
                    <th width="6%">Time</th>
                    <th width="20%">Patient Name</th>
                    <th width="15%">Category</th>
                    <th width="20%">Refund Reason</th>
                    <th width="8%">Amount</th>
                    <th width="8%">Payment</th>
                    <th width="15%">Doctor</th>
                  </tr>
                </thead>
                <tbody>
                  ${refundEntries.map(entry => `
                    <tr class="refund-row">
                      <td>${entry.date}</td>
                      <td>${entry.time}</td>
                      <td>${entry.patient_name || 'N/A'}</td>
                      <td>${entry.category}</td>
                      <td>${entry.description}</td>
                      <td style="text-align: right; font-weight: bold; color: orange;">-₹${((entry.net_amount || entry.amount) || 0).toFixed(0)}</td>
                      <td>${entry.payment_mode}</td>
                      <td>${entry.consultant_name || 'N/A'}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
            ` : ''}
            
            <div class="totals">
              <div class="totals-grid">
                <div><strong>Period:</strong> ${dateFrom} to ${dateTo}</div>
                <div><strong>Net Revenue:</strong> <span style="color: ${(totals.netRevenue || 0) >= 0 ? 'green' : 'red'};">₹${(totals.netRevenue || 0).toFixed(0)}</span></div>
                <div><strong>Generated:</strong> ${new Date().toLocaleString()}</div>
              </div>
            </div>
          </body>
        </html>
      `;

      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(printContent);
        printWindow.document.close();
        setTimeout(() => {
          printWindow.print();
          toast.success('Detailed operations report opened for printing!');
        }, 500);
      } else {
        toast.error('Could not open print window - popup blocked?');
      }
      
    } catch (error) {
      console.error('❌ Print error:', error);
      toast.error('Print failed: ' + (error as Error).message);
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'REVENUE': return 'text-green-600';
      case 'EXPENSE': return 'text-red-600';
      case 'REFUND': return 'text-orange-600';
      default: return 'text-gray-600';
    }
  };

  const getTypeBgColor = (type: string) => {
    switch (type) {
      case 'REVENUE': return 'bg-green-100';
      case 'EXPENSE': return 'bg-red-100';
      case 'REFUND': return 'bg-orange-100';
      default: return 'bg-gray-100';
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Print CSS */}
      <style>{`
        @media print {
          body * { visibility: hidden; }
          .operations-print-area, .operations-print-area * { visibility: visible; }
          .operations-print-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            font-family: Arial, sans-serif;
            font-size: 10px;
          }
          .print-hide { display: none !important; }
          table { font-size: 8px !important; border-collapse: collapse; width: 100%; }
          th, td { border: 1px solid #000; padding: 2px; }
          th { background-color: #f0f0f0; font-weight: bold; }
        }
      `}</style>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800">💰 Operations Ledger</h1>
        <p className="text-gray-600">Complete financial transaction history with revenue and expenses</p>
      </div>

      {/* Quick Date Filters */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg border border-blue-200 mb-4">
        <div className="flex flex-wrap gap-2 items-center">
          <span className="text-sm font-medium text-gray-700 mr-2">📅 Quick Filters:</span>
          <button
            onClick={() => {
              const today = new Date().toISOString().split('T')[0];
              setDateFrom(today);
              setDateTo(today);
            }}
            className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm hover:bg-blue-200 transition-colors"
          >
            Today
          </button>
          <button
            onClick={() => {
              const yesterday = new Date();
              yesterday.setDate(yesterday.getDate() - 1);
              const dateStr = yesterday.toISOString().split('T')[0];
              setDateFrom(dateStr);
              setDateTo(dateStr);
            }}
            className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm hover:bg-blue-200 transition-colors"
          >
            Yesterday
          </button>
          <button
            onClick={() => {
              const today = new Date();
              const lastWeek = new Date();
              lastWeek.setDate(today.getDate() - 7);
              setDateFrom(lastWeek.toISOString().split('T')[0]);
              setDateTo(today.toISOString().split('T')[0]);
            }}
            className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm hover:bg-blue-200 transition-colors"
          >
            Last 7 Days
          </button>
          <button
            onClick={() => {
              const today = new Date();
              const lastMonth = new Date();
              lastMonth.setDate(today.getDate() - 30);
              setDateFrom(lastMonth.toISOString().split('T')[0]);
              setDateTo(today.toISOString().split('T')[0]);
            }}
            className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm hover:bg-blue-200 transition-colors"
          >
            Last 30 Days
          </button>
          <button
            onClick={() => {
              const today = new Date();
              const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
              setDateFrom(firstDay.toISOString().split('T')[0]);
              setDateTo(today.toISOString().split('T')[0]);
            }}
            className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm hover:bg-blue-200 transition-colors"
          >
            This Month
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow-sm border mb-6">
        <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
          <div>
            <ModernDatePicker
              label="From Date"
              value={dateFrom}
              onChange={setDateFrom}
              placeholder="Select start date"
              className="w-full"
            />
          </div>
          
          <div>
            <ModernDatePicker
              label="To Date"
              value={dateTo}
              onChange={setDateTo}
              placeholder="Select end date"
              className="w-full"
              minDate={dateFrom} // Ensure "to" date is not before "from" date
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Transaction Type</label>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as any)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Types</option>
              <option value="REVENUE">Revenue Only</option>
              <option value="EXPENSE">Expenses Only</option>
              <option value="REFUND">Refunds Only</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Payment Mode</label>
            <select
              value={filterPaymentMode}
              onChange={(e) => setFilterPaymentMode(e.target.value as any)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Payments</option>
              <option value="CASH">Cash Only</option>
              <option value="ONLINE">Online Only</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Patient Tag</label>
            <select
              value={filterPatientTag}
              onChange={(e) => setFilterPatientTag(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Tags</option>
              {availablePatientTags.map((tag) => (
                <option key={tag} value={tag}>
                  {tag}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Sort By</label>
            <div className="flex space-x-1">
              <select
                value={sortBy}
                onChange={(e) => {
                  const newSortBy = e.target.value as any;
                  console.log('📊 Sort criteria changing from', sortBy, 'to', newSortBy);
                  setSortBy(newSortBy);
                }}
                className="flex-1 px-2 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              >
                <option value="date">Date & Time</option>
                <option value="amount">Amount</option>
                <option value="patient">Patient Name</option>
                <option value="type">Type</option>
              </select>
              <button
                onClick={() => {
                  const newSortOrder = sortOrder === 'asc' ? 'desc' : 'asc';
                  console.log('🔄 Sort order changing from', sortOrder, 'to', newSortOrder);
                  setSortOrder(newSortOrder);
                }}
                className={`px-2 py-2 border rounded-md text-sm transition-colors ${
                  sortOrder === 'asc' 
                    ? 'border-blue-300 bg-blue-50 hover:bg-blue-100' 
                    : 'border-red-300 bg-red-50 hover:bg-red-100'
                }`}
                title={`Currently: ${sortOrder === 'asc' ? 'Ascending' : 'Descending'} - Click to toggle`}
              >
                {sortOrder === 'asc' ? '⬆️ ASC' : '⬇️ DESC'}
              </button>
            </div>
          </div>

          <div className="flex items-end space-x-2 md:col-span-1">
            <button
              onClick={loadLedgerEntries}
              disabled={loading}
              className="w-full bg-blue-600 text-white px-2 py-8 rounded-md hover:bg-blue-700 disabled:opacity-50 text-sm mb-1"
            >
              {loading ? '🔄 Loading...' : '🔍 Search'}
            </button>
            <div className="flex flex-col space-y-1">
              <button
                onClick={printOperationsReport}
                disabled={loading || sortedEntries.length === 0}
                className="w-full bg-blue-600 text-white px-2 py-1 rounded-md hover:bg-blue-700 disabled:opacity-50 text-xs"
                title="Print Operations Report"
              >
                🖨️ Print
              </button>
              <button
                onClick={exportOperationsToExcel}
                disabled={loading || sortedEntries.length === 0}
                className="w-full bg-green-600 text-white px-2 py-1 rounded-md hover:bg-green-700 disabled:opacity-50 text-xs"
                title="Export to Excel"
              >
                📊 Export
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-green-50 p-4 rounded-lg border-2 border-green-200">
          <div className="text-sm text-green-600">Total Revenue</div>
          <div className="text-2xl font-bold text-green-700">₹{totals.revenue.toLocaleString()}</div>
          <div className="text-xs text-green-600 mt-1">
            Cash: ₹{totals.cashRevenue.toLocaleString()} | Online: ₹{totals.onlineRevenue.toLocaleString()}
          </div>
        </div>

        <div className="bg-red-50 p-4 rounded-lg border-2 border-red-200">
          <div className="text-sm text-red-600">Total Expenses</div>
          <div className="text-2xl font-bold text-red-700">₹{totals.expenses.toLocaleString()}</div>
          <div className="text-xs text-red-600 mt-1">
            Cash: ₹{totals.cashExpenses.toLocaleString()} | Online: ₹{totals.onlineExpenses.toLocaleString()}
          </div>
        </div>

        <div className="bg-orange-50 p-4 rounded-lg border-2 border-orange-200">
          <div className="text-sm text-orange-600">Total Refunds</div>
          <div className="text-2xl font-bold text-orange-700">₹{totals.refunds.toLocaleString()}</div>
          <div className="text-xs text-orange-600 mt-1">
            Cash: ₹{totals.cashRefunds.toLocaleString()} | Online: ₹{totals.onlineRefunds.toLocaleString()}
          </div>
        </div>

        <div className={`p-4 rounded-lg border-2 ${totals.netRevenue >= 0 ? 'bg-blue-50 border-blue-200' : 'bg-red-50 border-red-200'}`}>
          <div className={`text-sm ${totals.netRevenue >= 0 ? 'text-blue-600' : 'text-red-600'}`}>Net Revenue</div>
          <div className={`text-2xl font-bold ${totals.netRevenue >= 0 ? 'text-blue-700' : 'text-red-700'}`}>
            ₹{Math.abs(totals.netRevenue).toLocaleString()}
            {totals.netRevenue < 0 && ' (Loss)'}
          </div>
          <div className={`text-xs mt-1 ${totals.netRevenue >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
            Cash: ₹{totals.netCash.toLocaleString()} | Online: ₹{totals.netOnline.toLocaleString()}
          </div>
        </div>
      </div>

      {/* Ledger Table */}
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden operations-print-area">
        <div className="p-4 bg-gray-50 border-b">
          <h2 className="text-lg font-semibold">Transaction Details ({sortedEntries.length} entries)</h2>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading transactions...</p>
          </div>
        ) : sortedEntries.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full" style={{ tableLayout: 'fixed' }}>
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-center p-3 font-semibold text-gray-700" style={{ width: '50px' }}>S.No</th>
                  <th className="text-center p-3 font-semibold text-gray-700" style={{ width: '90px' }}>Date & Time</th>
                  <th className="text-center p-3 font-semibold text-gray-700" style={{ width: '80px' }}>Patient ID</th>
                  <th className="text-left p-3 font-semibold text-gray-700" style={{ width: '120px' }}>Patient Name / Expense Name</th>
                  <th className="text-center p-3 font-semibold text-gray-700" style={{ width: '80px' }}>Age & Gender</th>
                  <th className="text-left p-3 font-semibold text-gray-700" style={{ width: '100px' }}>Consultant</th>
                  <th className="text-left p-3 font-semibold text-gray-700" style={{ width: '90px' }}>Department</th>
                  <th className="text-center p-3 font-semibold text-gray-700" style={{ width: '80px' }}>Type</th>
                  <th className="text-center p-3 font-semibold text-gray-700" style={{ width: '80px' }}>Payment Mode</th>
                  <th className="text-right p-3 font-semibold text-gray-700" style={{ width: '80px' }}>Amount (₹)</th>
                  <th className="text-right p-3 font-semibold text-gray-700" style={{ width: '70px' }}>Discount (₹)</th>
                  <th className="text-right p-3 font-semibold text-gray-700" style={{ width: '90px' }}>Net Revenue (₹)</th>
                </tr>
              </thead>
              <tbody>
                {sortedEntries.map((entry, index) => {
                  // Use the parsed values from the entry
                  const originalAmount = entry.original_amount || entry.amount;
                  const discountAmount = entry.discount_amount || 0;
                  const netAmount = entry.net_amount || entry.amount;
                  
                  return (
                    <tr key={entry.id} className={`border-b hover:bg-gray-50 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-25'}`}>
                      <td className="p-3 text-center text-sm" style={{ width: '50px' }}>
                        {index + 1}
                      </td>
                      <td className="p-3 text-center text-xs" style={{ width: '90px' }}>
                        <div>{entry.date}</div>
                        <div className="text-gray-500">{entry.time}</div>
                      </td>
                      <td className="p-3 text-center text-sm font-medium" style={{ width: '80px' }}>
                        {entry.patient_id || 'N/A'}
                      </td>
                      <td className="p-3 text-sm" style={{ width: '120px' }}>
                        <div className="flex flex-col">
                          <div 
                            className={`font-medium truncate ${
                              entry.type === 'EXPENSE' ? 'text-orange-600' : 'text-blue-600'
                            }`} 
                            title={entry.patient_name || 'N/A'}
                          >
                            {entry.patient_name || 'N/A'}
                          </div>
                          {entry.type === 'EXPENSE' && (
                            <span className="text-xs text-gray-500 mt-1">
                              💸 Expense
                            </span>
                          )}
                          {entry.type !== 'EXPENSE' && (
                            <span className="text-xs text-gray-500 mt-1">
                              👤 Patient
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="p-3 text-center text-xs" style={{ width: '80px' }}>
                        <div>{entry.patient_age || 'N/A'}</div>
                        <div className="text-gray-500">{entry.patient_gender || 'N/A'}</div>
                      </td>
                      <td className="p-3 text-sm" style={{ width: '100px' }}>
                        <div className="truncate" title={entry.consultant_name || 'N/A'}>
                          {entry.consultant_name || 'N/A'}
                        </div>
                      </td>
                      <td className="p-3 text-sm" style={{ width: '90px' }}>
                        <div className="truncate" title={entry.department || 'N/A'}>
                          {entry.department || 'N/A'}
                        </div>
                      </td>
                      <td className="p-3 text-center" style={{ width: '80px' }}>
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          entry.type === 'REVENUE' ? 'bg-green-100 text-green-800' : 
                          entry.type === 'EXPENSE' ? 'bg-red-100 text-red-800' : 
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {entry.type === 'REVENUE' ? '💰' : entry.type === 'EXPENSE' ? '💸' : '↩️'} {entry.type}
                        </span>
                      </td>
                      <td className="p-3 text-center" style={{ width: '80px' }}>
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          entry.payment_mode?.toLowerCase() === 'cash' ? 'bg-green-100 text-green-800' : 
                          ['online', 'card', 'upi'].includes(entry.payment_mode?.toLowerCase()) ? 'bg-blue-100 text-blue-800' : 
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {entry.payment_mode?.toLowerCase() === 'cash' ? '💵' : 
                           entry.payment_mode?.toLowerCase() === 'online' ? '🌐' :
                           entry.payment_mode?.toLowerCase() === 'card' ? '💳' :
                           entry.payment_mode?.toLowerCase() === 'upi' ? '📱' : ''} 
                          {entry.payment_mode?.toUpperCase() || 'N/A'}
                        </span>
                      </td>
                      <td className={`p-3 text-right text-sm ${entry.type === 'EXPENSE' ? 'text-red-600' : entry.type === 'REFUND' ? 'text-yellow-600' : 'text-green-600'}`} style={{ width: '80px' }}>
                        {entry.type === 'EXPENSE' || entry.type === 'REFUND' ? '-' : ''}₹{originalAmount.toFixed(0)}
                      </td>
                      <td className="p-3 text-right text-sm" style={{ width: '70px' }}>
                        {discountAmount > 0 ? `₹${discountAmount.toFixed(0)}` : '-'}
                      </td>
                      <td className={`p-3 text-right text-sm font-medium ${entry.type === 'EXPENSE' ? 'text-red-600' : entry.type === 'REFUND' ? 'text-yellow-600' : 'text-green-600'}`} style={{ width: '90px' }}>
                        {entry.type === 'EXPENSE' || entry.type === 'REFUND' ? '-' : ''}₹{netAmount.toFixed(0)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📊</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No transactions found</h3>
            <p className="text-gray-500">Try adjusting your date range or filters</p>
          </div>
        )}
      </div>

      {/* Net Revenue Summary */}
      <div className="mt-6 bg-gray-50 p-6 rounded-lg border">
        <h3 className="text-lg font-semibold mb-4">💵 Net Revenue Breakdown</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <h4 className="font-medium text-gray-700 mb-2">Cash Transactions</h4>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span>Revenue:</span>
                <span className="text-green-600">+₹{totals.cashRevenue.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span>Expenses:</span>
                <span className="text-red-600">-₹{totals.cashExpenses.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span>Refunds:</span>
                <span className="text-orange-600">-₹{totals.cashRefunds.toLocaleString()}</span>
              </div>
              <div className="flex justify-between font-semibold pt-2 border-t">
                <span>Net Cash:</span>
                <span className={totals.netCash >= 0 ? 'text-green-600' : 'text-red-600'}>
                  ₹{totals.netCash.toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          <div>
            <h4 className="font-medium text-gray-700 mb-2">Online Transactions</h4>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span>Revenue:</span>
                <span className="text-green-600">+₹{totals.onlineRevenue.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span>Expenses:</span>
                <span className="text-red-600">-₹{totals.onlineExpenses.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span>Refunds:</span>
                <span className="text-orange-600">-₹{totals.onlineRefunds.toLocaleString()}</span>
              </div>
              <div className="flex justify-between font-semibold pt-2 border-t">
                <span>Net Online:</span>
                <span className={totals.netOnline >= 0 ? 'text-green-600' : 'text-red-600'}>
                  ₹{totals.netOnline.toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          <div>
            <h4 className="font-medium text-gray-700 mb-2">Total Summary</h4>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span>Total Revenue:</span>
                <span className="text-green-600">+₹{totals.revenue.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span>Total Expenses:</span>
                <span className="text-red-600">-₹{totals.expenses.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span>Total Refunds:</span>
                <span className="text-orange-600">-₹{totals.refunds.toLocaleString()}</span>
              </div>
              <div className="flex justify-between font-semibold pt-2 border-t text-base">
                <span>NET REVENUE:</span>
                <span className={totals.netRevenue >= 0 ? 'text-green-600' : 'text-red-600'}>
                  ₹{totals.netRevenue.toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OperationsLedger;
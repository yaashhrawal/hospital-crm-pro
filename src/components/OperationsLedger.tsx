import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { supabase } from '../config/supabaseNew';
import { exportToExcel, formatCurrency, formatDateTime } from '../utils/excelExport';

interface LedgerEntry {
  id: string;
  date: string;
  time: string;
  type: 'REVENUE' | 'EXPENSE' | 'REFUND';
  category: string;
  description: string;
  amount: number;
  payment_mode: 'CASH' | 'ONLINE';
  patient_name?: string;
  patient_id?: string;
  reference_id?: string;
  created_at: string;
}

const OperationsLedger: React.FC = () => {
  const [entries, setEntries] = useState<LedgerEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateFrom, setDateFrom] = useState(new Date().toISOString().split('T')[0]);
  const [dateTo, setDateTo] = useState(new Date().toISOString().split('T')[0]);
  const [filterPaymentMode, setFilterPaymentMode] = useState<'all' | 'CASH' | 'ONLINE'>('all');
  const [filterType, setFilterType] = useState<'all' | 'REVENUE' | 'EXPENSE' | 'REFUND'>('all');

  useEffect(() => {
    loadLedgerEntries();
  }, [dateFrom, dateTo]);

  const loadLedgerEntries = async () => {
    setLoading(true);
    try {
      const allEntries: LedgerEntry[] = [];
      
      // Load patient transactions (revenue)
      const { data: transactions, error: transError } = await supabase
        .from('patient_transactions')
        .select(`
          id,
          amount,
          payment_mode,
          transaction_type,
          description,
          status,
          created_at,
          patient:patients(id, patient_id, first_name, last_name)
        `)
        .gte('created_at', `${dateFrom}T00:00:00`)
        .lte('created_at', `${dateTo}T23:59:59`)
        .eq('status', 'COMPLETED')
        .order('created_at', { ascending: false });

      if (transError) {
        console.error('Error loading transactions:', transError);
      } else if (transactions) {
        transactions.forEach((trans: any) => {
          allEntries.push({
            id: trans.id,
            date: new Date(trans.created_at).toLocaleDateString(),
            time: new Date(trans.created_at).toLocaleTimeString(),
            type: 'REVENUE',
            category: trans.transaction_type,
            description: trans.description || `${trans.transaction_type} Payment`,
            amount: trans.amount,
            payment_mode: trans.payment_mode || 'CASH',
            patient_name: trans.patient ? `${trans.patient.first_name} ${trans.patient.last_name}` : 'Unknown',
            patient_id: trans.patient?.patient_id,
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
        expenses.forEach((expense: any) => {
          allEntries.push({
            id: expense.id,
            date: new Date(expense.expense_date).toLocaleDateString(),
            time: new Date(expense.created_at).toLocaleTimeString(),
            type: 'EXPENSE',
            category: expense.expense_category,
            description: expense.description,
            amount: expense.amount,
            payment_mode: expense.payment_mode || 'CASH',
            reference_id: expense.id,
            created_at: expense.created_at
          });
        });
      }

      // Load refunds
      const { data: refunds, error: refundError } = await supabase
        .from('patient_refunds')
        .select(`
          *,
          patient:patients(id, patient_id, first_name, last_name)
        `)
        .gte('created_at', `${dateFrom}T00:00:00`)
        .lte('created_at', `${dateTo}T23:59:59`)
        .order('created_at', { ascending: false });

      if (refundError) {
        console.error('Error loading refunds:', refundError);
      } else if (refunds) {
        refunds.forEach((refund: any) => {
          allEntries.push({
            id: refund.id,
            date: new Date(refund.created_at).toLocaleDateString(),
            time: new Date(refund.created_at).toLocaleTimeString(),
            type: 'REFUND',
            category: 'REFUND',
            description: refund.reason || 'Patient Refund',
            amount: refund.amount,
            payment_mode: refund.payment_mode || 'CASH',
            patient_name: refund.patient ? `${refund.patient.first_name} ${refund.patient.last_name}` : 'Unknown',
            patient_id: refund.patient?.patient_id,
            reference_id: refund.id,
            created_at: refund.created_at
          });
        });
      }

      // Sort all entries by date/time
      allEntries.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      
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
        if (entry.payment_mode === 'CASH') {
          totals.cashRevenue += entry.amount;
        } else {
          totals.onlineRevenue += entry.amount;
        }
      } else if (entry.type === 'EXPENSE') {
        totals.expenses += entry.amount;
        if (entry.payment_mode === 'CASH') {
          totals.cashExpenses += entry.amount;
        } else {
          totals.onlineExpenses += entry.amount;
        }
      } else if (entry.type === 'REFUND') {
        totals.refunds += entry.amount;
        if (entry.payment_mode === 'CASH') {
          totals.cashRefunds += entry.amount;
        } else {
          totals.onlineRefunds += entry.amount;
        }
      }
    });

    const netRevenue = totals.revenue - totals.expenses - totals.refunds;
    const netCash = totals.cashRevenue - totals.cashExpenses - totals.cashRefunds;
    const netOnline = totals.onlineRevenue - totals.onlineExpenses - totals.onlineRefunds;

    return { ...totals, netRevenue, netCash, netOnline };
  };

  const filteredEntries = getFilteredEntries();
  const totals = calculateTotals(filteredEntries);

  const exportOperationsToExcel = () => {
    try {
      const exportData = filteredEntries.map(entry => ({
        date: entry.date,
        time: entry.time,
        type: entry.type,
        category: entry.category,
        description: entry.description,
        patient_name: entry.patient_name || '',
        patient_id: entry.patient_id || '',
        payment_mode: entry.payment_mode,
        amount: entry.amount,
        formatted_amount: formatCurrency(entry.amount)
      }));

      const success = exportToExcel({
        filename: `Operations_Ledger_${dateFrom}_to_${dateTo}`,
        headers: [
          'Date',
          'Time', 
          'Type',
          'Category',
          'Description',
          'Patient Name',
          'Patient ID',
          'Payment Mode',
          'Amount',
          'Formatted Amount'
        ],
        data: exportData,
        formatters: {
          amount: (value) => formatCurrency(value)
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
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800">💰 Operations Ledger</h1>
        <p className="text-gray-600">Complete financial transaction history with revenue and expenses</p>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow-sm border mb-6">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">From Date</label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">To Date</label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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

          <div className="flex items-end space-x-2">
            <button
              onClick={loadLedgerEntries}
              disabled={loading}
              className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? '🔄 Loading...' : '🔍 Search'}
            </button>
            <button
              onClick={exportOperationsToExcel}
              disabled={loading || filteredEntries.length === 0}
              className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 disabled:opacity-50 whitespace-nowrap"
              title="Export to Excel"
            >
              📊 Export
            </button>
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
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <div className="p-4 bg-gray-50 border-b">
          <h2 className="text-lg font-semibold">Transaction Details ({filteredEntries.length} entries)</h2>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading transactions...</p>
          </div>
        ) : filteredEntries.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left p-4 font-semibold text-gray-700">Date & Time</th>
                  <th className="text-left p-4 font-semibold text-gray-700">Type</th>
                  <th className="text-left p-4 font-semibold text-gray-700">Category</th>
                  <th className="text-left p-4 font-semibold text-gray-700">Description</th>
                  <th className="text-left p-4 font-semibold text-gray-700">Patient</th>
                  <th className="text-left p-4 font-semibold text-gray-700">Payment</th>
                  <th className="text-right p-4 font-semibold text-gray-700">Amount</th>
                </tr>
              </thead>
              <tbody>
                {filteredEntries.map((entry, index) => (
                  <tr key={entry.id} className={`border-b hover:bg-gray-50 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-25'}`}>
                    <td className="p-4">
                      <div className="font-medium">{entry.date}</div>
                      <div className="text-sm text-gray-500">{entry.time}</div>
                    </td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${getTypeBgColor(entry.type)} ${getTypeColor(entry.type)}`}>
                        {entry.type}
                      </span>
                    </td>
                    <td className="p-4 text-sm">{entry.category}</td>
                    <td className="p-4">
                      <div className="text-sm">{entry.description}</div>
                    </td>
                    <td className="p-4">
                      {entry.patient_name && (
                        <div>
                          <div className="text-sm font-medium">{entry.patient_name}</div>
                          {entry.patient_id && (
                            <div className="text-xs text-gray-500">ID: {entry.patient_id}</div>
                          )}
                        </div>
                      )}
                    </td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        entry.payment_mode === 'CASH' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {entry.payment_mode}
                      </span>
                    </td>
                    <td className={`p-4 text-right font-semibold ${getTypeColor(entry.type)}`}>
                      {entry.type === 'EXPENSE' || entry.type === 'REFUND' ? '-' : '+'} 
                      ₹{entry.amount.toLocaleString()}
                    </td>
                  </tr>
                ))}
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
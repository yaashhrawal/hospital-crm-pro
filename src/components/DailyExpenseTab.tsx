import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { supabase } from '../config/supabaseNew';
import HospitalService from '../services/hospitalService';

interface DailyExpense {
  id?: string;
  expense_category: string;
  description: string;
  amount: number;
  payment_mode: string;
  expense_date: string;
  status: string;
  receipt_number: string;
  hospital_id: string;
  created_at?: string;
}

const DailyExpenseTab: React.FC = () => {
  const [formData, setFormData] = useState({
    expense_category: 'MEDICAL_SUPPLIES', // Changed to uppercase
    custom_category: '',
    description: '',
    amount: 0,
    payment_mode: 'CASH',
    expense_date: new Date().toISOString().split('T')[0],
    receipt_number: '',
    notes: ''
  });

  const [expenses, setExpenses] = useState<DailyExpense[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingExpenses, setLoadingExpenses] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    loadExpenses();
  }, [selectedDate]);

  const expenseCategories = [
    { value: 'MEDICAL_SUPPLIES', label: '💊 Medical Supplies' },
    { value: 'UTILITIES', label: '⚡ Utilities' },
    { value: 'MAINTENANCE', label: '🔧 Maintenance' },
    { value: 'ADMINISTRATIVE', label: '📋 Administrative' },
    { value: 'EQUIPMENT', label: '🏥 Equipment' },
    { value: 'OTHER', label: '📦 Other Expenses' },
    { value: 'custom', label: '+ Custom Category' }
  ];

  const paymentModes = [
    { value: 'CASH', label: '💵 Cash' },
    { value: 'CARD', label: '💳 Card' },
    { value: 'UPI', label: '📱 UPI' },
    { value: 'BANK_TRANSFER', label: '🏦 Bank Transfer' },
    { value: 'CHEQUE', label: '📄 Cheque' }
  ];

  const loadExpenses = async () => {
    setLoadingExpenses(true);
    try {
      const { data, error } = await supabase
        .from('daily_expenses')
        .select('*')
        .eq('expense_date', selectedDate)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading expenses:', error);
        toast.error('Failed to load expenses');
        return;
      }

      setExpenses(data || []);
    } catch (error: any) {
      console.error('Error loading expenses:', error);
      toast.error(`Failed to load expenses: ${error.message}`);
    } finally {
      setLoadingExpenses(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.description.trim() || formData.amount <= 0) {
      toast.error('Please fill in description and amount');
      return;
    }

    setLoading(true);

    try {
      const expenseData: Partial<DailyExpense> = {
        expense_category: formData.expense_category === 'custom' ? formData.custom_category.toUpperCase() : formData.expense_category,
        description: formData.description.trim(),
        amount: formData.amount,
        payment_mode: formData.payment_mode,
        expense_date: formData.expense_date,
        receipt_number: formData.receipt_number.trim() || `RCP${Date.now()}`,
        status: 'APPROVED',
        hospital_id: '550e8400-e29b-41d4-a716-446655440000'
      };

      console.log('💰 Creating expense with data:', expenseData);

      const { data, error } = await supabase
        .from('daily_expenses')
        .insert([expenseData])
        .select()
        .single();

      if (error) {
        console.error('Error creating expense:', error);
        toast.error(`Failed to record expense: ${error.message}`);
        return;
      }

      toast.success(`Expense of ₹${formData.amount.toLocaleString()} recorded successfully`);

      // Reset form
      setFormData({
        expense_category: 'MEDICAL_SUPPLIES', // Use uppercase
        custom_category: '',
        description: '',
        amount: 0,
        payment_mode: 'CASH',
        expense_date: formData.expense_date, // Keep the same date
        receipt_number: '',
        notes: ''
      });

      // Reload expenses if viewing the same date
      if (selectedDate === formData.expense_date) {
        loadExpenses();
      }

    } catch (error: any) {
      console.error('Error creating expense:', error);
      toast.error(`Failed to record expense: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const deleteExpense = async (expenseId: string) => {
    if (!confirm('Are you sure you want to delete this expense?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('daily_expenses')
        .delete()
        .eq('id', expenseId);

      if (error) {
        console.error('Error deleting expense:', error);
        toast.error('Failed to delete expense');
        return;
      }

      toast.success('Expense deleted successfully');
      loadExpenses();
    } catch (error: any) {
      console.error('Error deleting expense:', error);
      toast.error(`Failed to delete expense: ${error.message}`);
    }
  };

  const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0);

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">💸 Daily Hospital Expenses</h2>
          <p className="text-gray-600">Record and track daily operational expenses</p>
        </div>

        {/* Expense Entry Form */}
        <div className="p-6 bg-gray-50 border-t">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">➕ Add New Expense</h3>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Expense Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={formData.expense_date}
                  onChange={(e) => setFormData({ ...formData, expense_date: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.expense_category}
                  onChange={(e) => setFormData({ ...formData, expense_category: e.target.value, custom_category: '' })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  {expenseCategories.map(cat => (
                    <option key={cat.value} value={cat.value}>{cat.label}</option>
                  ))}
                </select>
              </div>

              {formData.expense_category === 'custom' && (
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Custom Category <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.custom_category}
                    onChange={(e) => setFormData({ ...formData, custom_category: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter custom category name"
                    required
                  />
                </div>
              )}

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter expense description"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Amount (₹) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: Number(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="0"
                  min="0.01"
                  step="0.01"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Payment Mode <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.payment_mode}
                  onChange={(e) => setFormData({ ...formData, payment_mode: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  {paymentModes.map(mode => (
                    <option key={mode.value} value={mode.value}>{mode.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Receipt Number</label>
                <input
                  type="text"
                  value={formData.receipt_number}
                  onChange={(e) => setFormData({ ...formData, receipt_number: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Auto-generated if empty"
                />
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <button
                type="submit"
                disabled={loading}
                className="bg-blue-600 text-white py-2 px-6 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {loading ? 'Recording...' : '💸 Record Expense'}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Expenses List */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-800">📋 Expenses</h3>
            <div className="flex items-center gap-4">
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={loadExpenses}
                disabled={loadingExpenses}
                className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 disabled:opacity-50"
              >
                {loadingExpenses ? 'Loading...' : '🔄 Refresh'}
              </button>
            </div>
          </div>

          {totalExpenses > 0 && (
            <div className="mb-4 p-3 bg-red-50 rounded-lg border border-red-200">
              <div className="text-center">
                <span className="text-xl font-bold text-red-700">
                  Total Expenses: ₹{totalExpenses.toLocaleString()}
                </span>
                <div className="text-sm text-red-600">
                  for {new Date(selectedDate).toLocaleDateString()}
                </div>
              </div>
            </div>
          )}

          {loadingExpenses ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-gray-600 mt-2">Loading expenses...</p>
            </div>
          ) : expenses.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="text-left p-3 font-semibold text-gray-700">Category</th>
                    <th className="text-left p-3 font-semibold text-gray-700">Description</th>
                    <th className="text-left p-3 font-semibold text-gray-700">Amount</th>
                    <th className="text-left p-3 font-semibold text-gray-700">Payment</th>
                    <th className="text-left p-3 font-semibold text-gray-700">Receipt</th>
                    <th className="text-left p-3 font-semibold text-gray-700">Time</th>
                    <th className="text-left p-3 font-semibold text-gray-700">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {expenses.map((expense, index) => (
                    <tr key={expense.id} className={`border-b hover:bg-gray-50 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-25'}`}>
                      <td className="p-3">
                        <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded text-xs">
                          {expense.expense_category.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="p-3">{expense.description}</td>
                      <td className="p-3">
                        <span className="font-semibold text-red-600">₹{expense.amount.toLocaleString()}</span>
                      </td>
                      <td className="p-3">{expense.payment_mode}</td>
                      <td className="p-3 text-sm text-gray-600">{expense.receipt_number}</td>
                      <td className="p-3 text-sm text-gray-600">
                        {expense.created_at ? new Date(expense.created_at).toLocaleTimeString() : 'N/A'}
                      </td>
                      <td className="p-3">
                        <button
                          onClick={() => expense.id && deleteExpense(expense.id)}
                          className="text-red-600 hover:text-red-800 text-sm"
                        >
                          🗑️ Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="text-4xl mb-2">💸</div>
              <p className="text-gray-600">No expenses recorded for {new Date(selectedDate).toLocaleDateString()}</p>
              <p className="text-gray-500 text-sm">Add your first expense above</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DailyExpenseTab;
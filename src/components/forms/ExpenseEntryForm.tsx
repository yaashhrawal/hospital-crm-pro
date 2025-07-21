import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Card } from '../ui/Card';
import dataService from '../../services/dataService';
import type { DailyExpense } from '../../services/dataService';
import toast from 'react-hot-toast';

// Validation schema
const expenseSchema = z.object({
  expense_category: z.enum(['salaries', 'utilities', 'medical_supplies', 'maintenance', 'administrative']),
  description: z.string().min(5, 'Description must be at least 5 characters'),
  amount: z.number().min(1, 'Amount must be at least ₹1').max(100000, 'Amount cannot exceed ₹1,00,000'),
  payment_mode: z.enum(['cash', 'online', 'card', 'upi']),
  date: z.string().min(1, 'Date is required'),
});

type ExpenseFormData = z.infer<typeof expenseSchema>;

interface ExpenseEntryFormProps {
  onExpenseCreated?: (expense: DailyExpense) => void;
  onClose?: () => void;
  initialDate?: string;
}

const ExpenseEntryForm: React.FC<ExpenseEntryFormProps> = ({ 
  onExpenseCreated, 
  onClose,
  initialDate = new Date().toISOString().split('T')[0]
}) => {
  const [loading, setLoading] = useState(false);
  const [showPresets, setShowPresets] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<ExpenseFormData>({
    resolver: zodResolver(expenseSchema),
    defaultValues: {
      date: initialDate,
      payment_mode: 'cash',
      expense_category: 'medical_supplies',
    },
  });

  // Preset expense templates
  const expensePresets = [
    { category: 'salaries', description: 'Doctor Salary - Dr. Name', amount: 50000 },
    { category: 'salaries', description: 'Nurse Salary - Nurse Name', amount: 25000 },
    { category: 'salaries', description: 'Administrative Staff Salary', amount: 20000 },
    { category: 'utilities', description: 'Electricity Bill', amount: 15000 },
    { category: 'utilities', description: 'Water Bill', amount: 5000 },
    { category: 'utilities', description: 'Internet & Phone Bill', amount: 3000 },
    { category: 'medical_supplies', description: 'Medicines Stock Purchase', amount: 25000 },
    { category: 'medical_supplies', description: 'Medical Equipment', amount: 10000 },
    { category: 'medical_supplies', description: 'Lab Supplies', amount: 8000 },
    { category: 'maintenance', description: 'Equipment Maintenance', amount: 12000 },
    { category: 'maintenance', description: 'Building Repairs', amount: 8000 },
    { category: 'maintenance', description: 'Cleaning & Housekeeping', amount: 5000 },
    { category: 'administrative', description: 'Office Supplies', amount: 3000 },
    { category: 'administrative', description: 'Insurance Premium', amount: 15000 },
    { category: 'administrative', description: 'Legal & Professional Fees', amount: 10000 },
  ];

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'salaries': return '👥';
      case 'utilities': return '⚡';
      case 'medical_supplies': return '💊';
      case 'maintenance': return '🔧';
      case 'administrative': return '📋';
      default: return '💰';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'salaries': return 'bg-blue-100 text-blue-800';
      case 'utilities': return 'bg-yellow-100 text-yellow-800';
      case 'medical_supplies': return 'bg-green-100 text-green-800';
      case 'maintenance': return 'bg-orange-100 text-orange-800';
      case 'administrative': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const applyPreset = (preset: any) => {
    setValue('expense_category', preset.category as any);
    setValue('description', preset.description);
    setValue('amount', preset.amount);
    setShowPresets(false);
    toast.success('Preset applied successfully');
  };

  const onSubmit = async (data: ExpenseFormData) => {
    setLoading(true);
    try {
      const currentUser = dataService.getCurrentUser();
      
      const expenseData = {
        ...data,
        approved_by: currentUser?.id || 'admin',
      };

      const newExpense = await dataService.createExpense(expenseData);

      toast.success(`Expense of ₹${data.amount.toLocaleString()} recorded successfully`);

      if (onExpenseCreated) {
        onExpenseCreated(newExpense);
      }

      // Reset form for next entry
      reset({
        date: data.date, // Keep the same date
        payment_mode: 'cash',
        expense_category: 'medical_supplies',
        description: '',
        amount: 0,
      });

    } catch (error) {
      console.error('Error creating expense:', error);
      toast.error('Failed to record expense');
    } finally {
      setLoading(false);
    }
  };

  const watchedCategory = watch('expense_category');
  const watchedAmount = watch('amount');

  return (
    <Card className="max-w-3xl mx-auto p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Daily Expense Entry</h2>
        <p className="text-gray-600">Record hospital expenses and operational costs</p>
        
        {/* Service Status */}
        <div className="mt-4 p-2 bg-blue-50 rounded-lg">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${dataService.getServiceStatus().isOnline ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
            <span className="text-sm text-gray-600">
              Running on {dataService.getServiceStatus().service}
              {!dataService.getServiceStatus().isOnline && ' (Offline Mode)'}
            </span>
          </div>
        </div>
      </div>

      {/* Quick Presets */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold text-gray-700">Quick Presets</h3>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setShowPresets(!showPresets)}
          >
            {showPresets ? 'Hide' : 'Show'} Presets
          </Button>
        </div>
        
        {showPresets && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 p-4 bg-gray-50 rounded-lg">
            {expensePresets
              .filter(preset => !watchedCategory || preset.category === watchedCategory)
              .slice(0, 6)
              .map((preset, index) => (
              <button
                key={index}
                type="button"
                onClick={() => applyPreset(preset)}
                className="text-left p-3 bg-white rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-colors"
              >
                <div className="flex items-start gap-2">
                  <span className="text-lg">{getCategoryIcon(preset.category)}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">
                      {preset.description}
                    </p>
                    <p className="text-xs text-gray-500 capitalize">
                      {preset.category.replace('_', ' ')}
                    </p>
                    <p className="text-sm font-semibold text-green-600">
                      ₹{preset.amount.toLocaleString()}
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Basic Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date *</label>
            <input
              type="date"
              {...register('date')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {errors.date && (
              <p className="text-red-600 text-sm mt-1">{errors.date.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Expense Category *</label>
            <select
              {...register('expense_category')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="salaries">👥 Staff Salaries</option>
              <option value="utilities">⚡ Utilities (Electricity, Water, Internet)</option>
              <option value="medical_supplies">💊 Medical Supplies</option>
              <option value="maintenance">🔧 Maintenance and Repairs</option>
              <option value="administrative">📋 Administrative Costs</option>
            </select>
            {errors.expense_category && (
              <p className="text-red-600 text-sm mt-1">{errors.expense_category.message}</p>
            )}
          </div>
        </div>

        {/* Description and Amount */}
        <div className="space-y-4">
          <div>
            <Input
              label="Description *"
              {...register('description')}
              error={errors.description?.message}
              placeholder="Detailed description of the expense"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Input
                label="Amount (₹) *"
                type="number"
                {...register('amount', { valueAsNumber: true })}
                error={errors.amount?.message}
                placeholder="Enter amount"
                min={1}
                max={100000}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Payment Mode *</label>
              <select
                {...register('payment_mode')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="cash">💵 Cash</option>
                <option value="online">🌐 Online Transfer</option>
                <option value="card">💳 Card Payment</option>
                <option value="upi">📱 UPI</option>
              </select>
              {errors.payment_mode && (
                <p className="text-red-600 text-sm mt-1">{errors.payment_mode.message}</p>
              )}
            </div>
          </div>
        </div>

        {/* Summary Card */}
        {watchedAmount > 0 && (
          <div className={`p-4 rounded-lg ${getCategoryColor(watchedCategory)}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{getCategoryIcon(watchedCategory)}</span>
                <div>
                  <h3 className="font-semibold">
                    {watchedCategory.replace('_', ' ').charAt(0).toUpperCase() + 
                     watchedCategory.replace('_', ' ').slice(1)} Expense
                  </h3>
                  <p className="text-sm opacity-75">
                    {watch('description') || 'No description provided'}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold">₹{watchedAmount.toLocaleString()}</div>
                <div className="text-sm opacity-75">
                  {watch('payment_mode')?.toUpperCase()} Payment
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Form Actions */}
        <div className="flex justify-end gap-4 pt-6 border-t border-gray-200">
          {onClose && (
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
          )}
          <Button type="submit" disabled={loading}>
            {loading ? 'Recording...' : `Record Expense ₹${watchedAmount?.toLocaleString() || '0'}`}
          </Button>
        </div>
      </form>

      {/* Quick Actions */}
      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <h4 className="font-semibold text-gray-700 mb-2">Quick Actions</h4>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => {
              setValue('expense_category', 'utilities');
              setValue('description', 'Monthly Electricity Bill');
              setValue('amount', 15000);
            }}
          >
            ⚡ Electricity Bill
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => {
              setValue('expense_category', 'medical_supplies');
              setValue('description', 'Medicine Stock Purchase');
              setValue('amount', 25000);
            }}
          >
            💊 Medicine Stock
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => {
              setValue('expense_category', 'maintenance');
              setValue('description', 'Equipment Maintenance');
              setValue('amount', 8000);
            }}
          >
            🔧 Maintenance
          </Button>
        </div>
      </div>
    </Card>
  );
};

export default ExpenseEntryForm;
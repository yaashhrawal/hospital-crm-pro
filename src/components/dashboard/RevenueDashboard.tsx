import React, { useState, useEffect } from 'react';
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import dataService from '../../services/dataService';
import { supabase } from '../../config/supabaseNew';
import toast from 'react-hot-toast';

interface RevenueMetrics {
  totalIncome: number;
  totalExpenses: number;
  netRevenue: number;
  transactionBreakdown: Record<string, number>;
  paymentModeBreakdown: Record<string, number>;
  departmentBreakdown: Record<string, number>;
  doctorBreakdown: Record<string, number>;
  transactionDetails?: Array<{
    id: string;
    patient_name: string;
    patient_id: string;
    transaction_type: string;
    amount: number;
    payment_mode: string;
    transaction_date: string;
    created_at: string;
    description?: string;
  }>;
}

interface TimeRange {
  start: string;
  end: string;
  label: string;
}

const RevenueDashboard: React.FC = () => {
  const [selectedTimeRange, setSelectedTimeRange] = useState<'today' | 'week' | 'month'>('today');
  const [revenueMetrics, setRevenueMetrics] = useState<RevenueMetrics | null>(null);
  const [loading, setLoading] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);

  const getTimeRange = (range: 'today' | 'week' | 'month'): TimeRange => {
    const now = new Date();
    console.log('📅 RevenueDashboard - Getting time range for:', range, 'Current date:', now.toISOString());
    
    switch (range) {
      case 'today':
        const todayFormatted = format(now, 'yyyy-MM-dd');
        console.log('📅 RevenueDashboard - Today formatted as:', todayFormatted);
        return {
          start: todayFormatted,
          end: todayFormatted,
          label: 'Today'
        };
      case 'week':
        return {
          start: format(startOfWeek(now, { weekStartsOn: 1 }), 'yyyy-MM-dd'),
          end: format(endOfWeek(now, { weekStartsOn: 1 }), 'yyyy-MM-dd'),
          label: 'This Week'
        };
      case 'month':
        return {
          start: format(startOfMonth(now), 'yyyy-MM-dd'),
          end: format(endOfMonth(now), 'yyyy-MM-dd'),
          label: 'This Month'
        };
    }
  };

  const loadRevenueData = async () => {
    setLoading(true);
    try {
      const timeRange = getTimeRange(selectedTimeRange);
      
      // For today, we can use the single date method
      if (selectedTimeRange === 'today') {
        const dailyRevenue = await dataService.getDailyRevenue(timeRange.start);
        
        // Use the exact same query as OperationsLedger to get matching data
        console.log('📊 RevenueDashboard - Using OperationsLedger query for date:', timeRange.start);
        
        const { data: allTransactions, error } = await supabase
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

        if (error) {
          console.error('❌ RevenueDashboard transaction fetch error:', error);
          throw error;
        }

        // Filter transactions for today using the same logic as OperationsLedger
        const transactions = (allTransactions || []).filter((trans: any) => {
          // Use transaction_date if available, otherwise use created_at
          let transactionDate = trans.transaction_date;
          if (!transactionDate && trans.created_at) {
            transactionDate = trans.created_at.split('T')[0];
          }
          
          // Check if transaction is from the selected date
          const isFromSelectedDate = transactionDate === timeRange.start || 
                                   (trans.created_at && trans.created_at.split('T')[0] === timeRange.start);
          
          if (!isFromSelectedDate) return false;
          
          // Apply the same filtering as OperationsLedger: Skip DR HEMANT (not KHAJJA) with ORTHO department
          const filterDoctorName = trans.patient?.assigned_doctor?.toUpperCase()?.trim() || '';
          const filterDepartment = trans.patient?.assigned_department?.toUpperCase()?.trim() || '';
          
          // Skip if it's ORTHO department AND doctor name contains HEMANT (but not KHAJJA)
          if (filterDepartment === 'ORTHO' && filterDoctorName.includes('HEMANT') && !filterDoctorName.includes('KHAJJA')) {
            console.log(`🚫 RevenueDashboard - Excluding ORTHO/HEMANT transaction:`, {
              patient: `${trans.patient?.first_name} ${trans.patient?.last_name}`,
              department: filterDepartment,
              doctor: filterDoctorName
            });
            return false;
          }
          
          return true;
        });
        
        console.log('📊 RevenueDashboard - Filtered transactions using OperationsLedger logic:', {
          date: timeRange.start,
          totalFromDB: allTransactions?.length || 0,
          filteredCount: transactions.length,
          transactions: transactions.map((t: any) => ({
            id: t.id,
            patient_name: `${t.patient?.first_name || ''} ${t.patient?.last_name || ''}`.trim(),
            type: t.transaction_type,
            amount: t.amount,
            transaction_date: t.transaction_date,
            created_at: t.created_at
          }))
        });
        
        // Build payment mode breakdown from today's transactions only
        const paymentModeBreakdown: Record<string, number> = {};
        const departmentBreakdown: Record<string, number> = {};
        const doctorBreakdown: Record<string, number> = {};
        const transactionDetails: RevenueMetrics['transactionDetails'] = [];
        
        transactions.forEach((trans: any) => {
          // Get patient info from the nested patient object
          const patient = trans.patient;
          const patientName = patient 
            ? `${patient.first_name || ''} ${patient.last_name || ''}`.trim() || 'Unknown Patient'
            : 'Unknown Patient';
            
          // Add ALL transactions to transaction details (matching OperationsLedger)
          transactionDetails.push({
            id: trans.id,
            patient_name: patientName,
            patient_id: patient?.patient_id || trans.patient_id,
            transaction_type: trans.transaction_type,
            amount: trans.amount,
            payment_mode: trans.payment_mode,
            transaction_date: trans.transaction_date || trans.created_at.split('T')[0],
            created_at: trans.created_at,
            description: trans.description
          });
          
          // For aggregated breakdowns, apply same logic as operations
          // Payment mode breakdown
          if (trans.payment_mode) {
            paymentModeBreakdown[trans.payment_mode] = (paymentModeBreakdown[trans.payment_mode] || 0) + trans.amount;
          }
          
          // Department breakdown
          if (patient?.assigned_department) {
            departmentBreakdown[patient.assigned_department] = (departmentBreakdown[patient.assigned_department] || 0) + trans.amount;
          }
          
          // Doctor breakdown
          if (patient?.assigned_doctor) {
            doctorBreakdown[patient.assigned_doctor] = (doctorBreakdown[patient.assigned_doctor] || 0) + trans.amount;
          }
        });
        
        setRevenueMetrics({
          ...dailyRevenue,
          paymentModeBreakdown,
          departmentBreakdown,
          doctorBreakdown,
          transactionDetails: transactionDetails.sort((a, b) => 
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          )
        });
      } else {
        // For week/month, we need to aggregate data across multiple dates
        const startDate = new Date(timeRange.start);
        const endDate = new Date(timeRange.end);
        
        let totalIncome = 0;
        let totalExpenses = 0;
        let transactionBreakdown: Record<string, number> = {};
        let paymentModeBreakdown: Record<string, number> = {};
        let departmentBreakdown: Record<string, number> = {};
        let doctorBreakdown: Record<string, number> = {};

        // Iterate through each date in the range
        for (let date = new Date(startDate); date <= endDate; date.setDate(date.getDate() + 1)) {
          const dateStr = format(date, 'yyyy-MM-dd');
          
          try {
            const [transactions, expenses] = await Promise.all([
              dataService.getTransactionsByDate(dateStr),
              dataService.getExpensesByDate(dateStr),
            ]);

            // Aggregate income
            const dayIncome = transactions.reduce((sum, t) => sum + t.amount, 0);
            totalIncome += dayIncome;

            // Aggregate expenses
            const dayExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
            totalExpenses += dayExpenses;

            // Breakdown by transaction type
            transactions.forEach(t => {
              transactionBreakdown[t.transaction_type] = (transactionBreakdown[t.transaction_type] || 0) + t.amount;
              paymentModeBreakdown[t.payment_mode] = (paymentModeBreakdown[t.payment_mode] || 0) + t.amount;
              departmentBreakdown[t.department] = (departmentBreakdown[t.department] || 0) + t.amount;
            });

            // Get doctor names for breakdown
            const doctors = await dataService.getDoctors();
            transactions.forEach(t => {
              if (t.doctor_id) {
                const doctor = doctors.find(d => d.id === t.doctor_id);
                if (doctor) {
                  doctorBreakdown[doctor.name] = (doctorBreakdown[doctor.name] || 0) + t.amount;
                }
              }
            });

          } catch (error) {
            // Skip if no data for this date
            console.warn(`No data for ${dateStr}:`, error);
          }
        }

        setRevenueMetrics({
          totalIncome,
          totalExpenses,
          netRevenue: totalIncome - totalExpenses,
          transactionBreakdown,
          paymentModeBreakdown,
          departmentBreakdown,
          doctorBreakdown,
        });
      }

    } catch (error) {
      console.error('Error loading revenue data:', error);
      toast.error('Failed to load revenue data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRevenueData();
  }, [selectedTimeRange]);

  // Auto-refresh every 5 minutes for today's data
  useEffect(() => {
    if (!autoRefresh || selectedTimeRange !== 'today') return;

    const interval = setInterval(() => {
      loadRevenueData();
    }, 5 * 60 * 1000); // 5 minutes

    return () => clearInterval(interval);
  }, [autoRefresh, selectedTimeRange]);

  const formatCurrency = (amount: number): string => {
    return `₹${amount.toLocaleString('en-IN')}`;
  };

  const getRevenueColor = (netRevenue: number): string => {
    if (netRevenue > 0) return 'text-green-600';
    if (netRevenue < 0) return 'text-red-600';
    return 'text-gray-600';
  };

  const getTransactionTypeIcon = (type: string): string => {
    switch (type) {
      case 'entry_fee': return '🚪';
      case 'consultation': return '👩‍⚕️';
      case 'service': return '🔬';
      case 'admission': return '🏥';
      case 'medicine': return '💊';
      default: return '💰';
    }
  };

  const getPaymentModeIcon = (mode: string): string => {
    switch (mode) {
      case 'cash': return '💵';
      case 'online': return '🌐';
      case 'card': return '💳';
      case 'upi': return '📱';
      case 'insurance': return '🛡️';
      default: return '💰';
    }
  };

  const currentTimeRange = getTimeRange(selectedTimeRange);

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Revenue Dashboard</h1>
          <p className="text-gray-600 mt-1">Real-time revenue tracking and financial insights</p>
        </div>
        <div className="flex items-center gap-4">
          {/* Time Range Selector */}
          <div className="flex rounded-lg overflow-hidden border border-gray-300">
            {(['today', 'week', 'month'] as const).map((range) => (
              <button
                key={range}
                onClick={() => setSelectedTimeRange(range)}
                className={`px-4 py-2 text-sm font-medium transition-colors ${
                  selectedTimeRange === range
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                {getTimeRange(range).label}
              </button>
            ))}
          </div>

          {/* Auto-refresh toggle */}
          {selectedTimeRange === 'today' && (
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
                className="w-4 h-4 text-blue-600"
              />
              <span className="text-sm text-gray-600">Auto-refresh</span>
            </label>
          )}

          <Button onClick={loadRevenueData} disabled={loading}>
            {loading ? 'Loading...' : 'Refresh'}
          </Button>
        </div>
      </div>

      {/* Service Status */}
      <div className="bg-blue-50 p-4 rounded-lg">
        <div className="flex items-center gap-2">
          <div className={`w-3 h-3 rounded-full ${dataService.getServiceStatus().isOnline ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
          <span className="font-medium">
            System Status: {dataService.getServiceStatus().service}
            {!dataService.getServiceStatus().isOnline && ' (Offline Mode)'}
          </span>
          {autoRefresh && selectedTimeRange === 'today' && (
            <span className="text-sm text-gray-600 ml-4">• Auto-refresh enabled (5min)</span>
          )}
        </div>
      </div>

      {loading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading revenue data...</p>
        </div>
      ) : !revenueMetrics ? (
        <div className="text-center py-8 text-gray-500">
          <p>No revenue data available for {currentTimeRange.label}</p>
        </div>
      ) : (
        <>
          {/* Main Revenue Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="p-6 text-center bg-green-50 border-green-200">
              <div className="text-3xl font-bold text-green-600 mb-2">
                {formatCurrency(revenueMetrics.totalIncome)}
              </div>
              <div className="text-sm text-gray-600">Total Income</div>
              <div className="text-xs text-gray-500 mt-1">{currentTimeRange.label}</div>
            </Card>

            <Card className="p-6 text-center bg-red-50 border-red-200">
              <div className="text-3xl font-bold text-red-600 mb-2">
                {formatCurrency(revenueMetrics.totalExpenses)}
              </div>
              <div className="text-sm text-gray-600">Total Expenses</div>
              <div className="text-xs text-gray-500 mt-1">{currentTimeRange.label}</div>
            </Card>

            <Card className={`p-6 text-center ${
              revenueMetrics.netRevenue >= 0 
                ? 'bg-blue-50 border-blue-200' 
                : 'bg-red-50 border-red-200'
            }`}>
              <div className={`text-3xl font-bold mb-2 ${getRevenueColor(revenueMetrics.netRevenue)}`}>
                {formatCurrency(revenueMetrics.netRevenue)}
              </div>
              <div className="text-sm text-gray-600">Net Revenue</div>
              <div className="text-xs text-gray-500 mt-1">
                {revenueMetrics.netRevenue >= 0 ? 'Profit' : 'Loss'} • {currentTimeRange.label}
              </div>
            </Card>
          </div>

          {/* Transaction Details List */}
          {revenueMetrics.transactionDetails && revenueMetrics.transactionDetails.length > 0 && (
            <Card className="p-6 mb-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Operations - Transaction Details</h3>
              <div className="overflow-x-auto">
                <div className="max-h-96 overflow-y-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50 sticky top-0">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Type
                        </th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Patient
                        </th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Date
                        </th>
                        <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Amount
                        </th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Payment
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {revenueMetrics.transactionDetails.map((transaction) => (
                        <tr key={transaction.id} className="hover:bg-gray-50">
                          <td className="px-4 py-2 whitespace-nowrap text-sm">
                            <span className="capitalize">{transaction.transaction_type.replace(/_/g, ' ').toLowerCase()}</span>
                          </td>
                          <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">
                            {transaction.patient_name}
                          </td>
                          <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">
                            {format(new Date(transaction.transaction_date), 'M/d/yyyy')}
                          </td>
                          <td className="px-4 py-2 whitespace-nowrap text-sm text-right font-medium text-gray-900">
                            {formatCurrency(transaction.amount)}
                          </td>
                          <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">
                            <span className="capitalize">{transaction.payment_mode.toLowerCase()}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">
                    Total Transactions: {revenueMetrics.transactionDetails.length}
                  </span>
                  <span className="text-sm font-semibold text-gray-900">
                    Total Amount: {formatCurrency(revenueMetrics.transactionDetails.reduce((sum, t) => sum + t.amount, 0))}
                  </span>
                </div>
              </div>
            </Card>
          )}

          {/* Breakdown Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Transaction Type Breakdown */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Revenue by Service Type</h3>
              <div className="space-y-4">
                {Object.entries(revenueMetrics.transactionBreakdown).map(([type, amount]) => {
                  const percentage = revenueMetrics.totalIncome > 0 ? (amount / revenueMetrics.totalIncome) * 100 : 0;
                  return (
                    <div key={type} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{getTransactionTypeIcon(type)}</span>
                        <span className="text-sm font-medium text-gray-700 capitalize">
                          {type.replace('_', ' ')}
                        </span>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-semibold text-gray-900">
                          {formatCurrency(amount)}
                        </div>
                        <div className="text-xs text-gray-500">
                          {percentage.toFixed(1)}%
                        </div>
                      </div>
                      <div className="ml-4 w-24 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${Math.min(percentage, 100)}%` }}
                        ></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>

            {/* Payment Mode Breakdown */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Payment Methods</h3>
              <div className="space-y-4">
                {Object.entries(revenueMetrics.paymentModeBreakdown).map(([mode, amount]) => {
                  const percentage = revenueMetrics.totalIncome > 0 ? (amount / revenueMetrics.totalIncome) * 100 : 0;
                  return (
                    <div key={mode} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{getPaymentModeIcon(mode)}</span>
                        <span className="text-sm font-medium text-gray-700 capitalize">
                          {mode}
                        </span>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-semibold text-gray-900">
                          {formatCurrency(amount)}
                        </div>
                        <div className="text-xs text-gray-500">
                          {percentage.toFixed(1)}%
                        </div>
                      </div>
                      <div className="ml-4 w-24 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-green-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${Math.min(percentage, 100)}%` }}
                        ></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>

            {/* Department Performance */}
            {Object.keys(revenueMetrics.departmentBreakdown).length > 0 && (
              <Card className="p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Revenue by Department</h3>
                <div className="space-y-4">
                  {Object.entries(revenueMetrics.departmentBreakdown)
                    .sort(([,a], [,b]) => b - a)
                    .map(([department, amount]) => {
                      const percentage = revenueMetrics.totalIncome > 0 ? (amount / revenueMetrics.totalIncome) * 100 : 0;
                      return (
                        <div key={department} className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-lg">🏥</span>
                            <span className="text-sm font-medium text-gray-700">
                              {department}
                            </span>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-semibold text-gray-900">
                              {formatCurrency(amount)}
                            </div>
                            <div className="text-xs text-gray-500">
                              {percentage.toFixed(1)}%
                            </div>
                          </div>
                          <div className="ml-4 w-24 bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-purple-600 h-2 rounded-full transition-all duration-300"
                              style={{ width: `${Math.min(percentage, 100)}%` }}
                            ></div>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </Card>
            )}

            {/* Doctor Performance */}
            {Object.keys(revenueMetrics.doctorBreakdown).length > 0 && (
              <Card className="p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Revenue by Doctor</h3>
                <div className="space-y-4">
                  {Object.entries(revenueMetrics.doctorBreakdown)
                    .sort(([,a], [,b]) => b - a)
                    .slice(0, 5) // Top 5 doctors
                    .map(([doctor, amount]) => {
                      const percentage = revenueMetrics.totalIncome > 0 ? (amount / revenueMetrics.totalIncome) * 100 : 0;
                      return (
                        <div key={doctor} className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-lg">👨‍⚕️</span>
                            <span className="text-sm font-medium text-gray-700">
                              {doctor}
                            </span>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-semibold text-gray-900">
                              {formatCurrency(amount)}
                            </div>
                            <div className="text-xs text-gray-500">
                              {percentage.toFixed(1)}%
                            </div>
                          </div>
                          <div className="ml-4 w-24 bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                              style={{ width: `${Math.min(percentage, 100)}%` }}
                            ></div>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </Card>
            )}
          </div>

          {/* Revenue Insights */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Revenue Insights</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="text-lg font-semibold text-blue-600">
                  {formatCurrency(revenueMetrics.totalIncome / Math.max(1, Object.keys(revenueMetrics.transactionBreakdown).length))}
                </div>
                <div className="text-sm text-gray-600">Average per Service Type</div>
              </div>

              <div className="bg-green-50 p-4 rounded-lg">
                <div className="text-lg font-semibold text-green-600">
                  {((revenueMetrics.paymentModeBreakdown.cash || 0) / Math.max(1, revenueMetrics.totalIncome) * 100).toFixed(1)}%
                </div>
                <div className="text-sm text-gray-600">Cash Payments</div>
              </div>

              <div className="bg-purple-50 p-4 rounded-lg">
                <div className="text-lg font-semibold text-purple-600">
                  {(() => {
                    const digitalAmount = (revenueMetrics.paymentModeBreakdown.online || 0) + 
                                         (revenueMetrics.paymentModeBreakdown.card || 0) + 
                                         (revenueMetrics.paymentModeBreakdown.upi || 0);
                    return (digitalAmount / Math.max(1, revenueMetrics.totalIncome) * 100).toFixed(1);
                  })()}%
                </div>
                <div className="text-sm text-gray-600">Digital Payments</div>
              </div>
            </div>
          </Card>
        </>
      )}
    </div>
  );
};

export default RevenueDashboard;
import React, { useState, useEffect } from 'react';
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import dataService from '../../services/dataService';
import toast from 'react-hot-toast';

interface RevenueMetrics {
  totalIncome: number;
  totalExpenses: number;
  netRevenue: number;
  transactionBreakdown: Record<string, number>;
  paymentModeBreakdown: Record<string, number>;
  departmentBreakdown: Record<string, number>;
  doctorBreakdown: Record<string, number>;
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
    
    switch (range) {
      case 'today':
        return {
          start: format(now, 'yyyy-MM-dd'),
          end: format(now, 'yyyy-MM-dd'),
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
        setRevenueMetrics({
          ...dailyRevenue,
          paymentModeBreakdown: {},
          departmentBreakdown: {},
          doctorBreakdown: {},
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
                  {((revenueMetrics.totalIncome - (revenueMetrics.paymentModeBreakdown.cash || 0)) / Math.max(1, revenueMetrics.totalIncome) * 100).toFixed(1)}%
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
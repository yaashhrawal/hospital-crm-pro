// Real-time data hooks for Hospital CRM with Supabase
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../config/supabase';
import dataService from '../services/dataService';
import type { PatientTransaction, Patient, DailyExpense } from '../services/dataService';

export interface DashboardStats {
  totalPatients: number;
  totalIncome: number;
  totalExpenses: number;
  netRevenue: number;
  activeAdmissions: number;
  cashPayments: number;
  digitalPayments: number;
  discountsGiven: number;
  refundsProcessed: number;
}

// Hook for real-time dashboard statistics
export function useRealtimeDashboard(selectedDate: string) {
  const [stats, setStats] = useState<DashboardStats>({
    totalPatients: 0,
    totalIncome: 0,
    totalExpenses: 0,
    netRevenue: 0,
    activeAdmissions: 0,
    cashPayments: 0,
    digitalPayments: 0,
    discountsGiven: 0,
    refundsProcessed: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadStats = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Use Supabase function if available, otherwise calculate manually
      if (!dataService.getServiceStatus().isOnline) {
        // LocalStorage fallback
        const [transactions, expenses, patients] = await Promise.all([
          dataService.getTransactionsByDate(selectedDate),
          dataService.getExpensesByDate(selectedDate),
          dataService.getPatients(),
        ]);

        const todayPatients = patients.filter(p => 
          p.created_at.startsWith(selectedDate)
        );

        const totalIncome = transactions
          .filter(t => t.amount > 0)
          .reduce((sum, t) => sum + t.amount, 0);
        
        const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
        
        const cashPayments = transactions
          .filter(t => t.payment_mode === 'cash' && t.amount > 0)
          .reduce((sum, t) => sum + t.amount, 0);
          
        const digitalPayments = transactions
          .filter(t => ['online', 'card', 'upi'].includes(t.payment_mode) && t.amount > 0)
          .reduce((sum, t) => sum + t.amount, 0);

        const discountsGiven = Math.abs(transactions
          .filter(t => t.transaction_type === 'discount')
          .reduce((sum, t) => sum + t.amount, 0));

        const refundsProcessed = Math.abs(transactions
          .filter(t => t.transaction_type === 'refund')
          .reduce((sum, t) => sum + t.amount, 0));

        setStats({
          totalPatients: todayPatients.length,
          totalIncome,
          totalExpenses,
          netRevenue: totalIncome - totalExpenses,
          activeAdmissions: 0, // Would need admissions data
          cashPayments,
          digitalPayments,
          discountsGiven,
          refundsProcessed,
        });
      } else {
        // Use Supabase function
        const { data, error } = await supabase.rpc('get_dashboard_stats', {
          target_date: selectedDate
        });

        if (error) throw error;

        setStats({
          totalPatients: data.total_patients || 0,
          totalIncome: data.total_income || 0,
          totalExpenses: data.total_expenses || 0,
          netRevenue: data.net_revenue || 0,
          activeAdmissions: data.active_admissions || 0,
          cashPayments: data.cash_payments || 0,
          digitalPayments: data.digital_payments || 0,
          discountsGiven: data.discounts_given || 0,
          refundsProcessed: data.refunds_processed || 0,
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load dashboard stats');
    } finally {
      setLoading(false);
    }
  }, [selectedDate]);

  useEffect(() => {
    loadStats();

    // Set up real-time subscriptions if using Supabase
    if (dataService.getServiceStatus().isOnline) {
      const transactionChannel = supabase
        .channel('dashboard-transactions')
        .on('postgres_changes', 
          { 
            event: '*', 
            schema: 'public', 
            table: 'patient_transactions' 
          }, 
          () => {
            loadStats(); // Reload stats when transactions change
          }
        )
        .subscribe();

      const expenseChannel = supabase
        .channel('dashboard-expenses')
        .on('postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'daily_expenses'
          },
          () => {
            loadStats(); // Reload stats when expenses change
          }
        )
        .subscribe();

      const patientChannel = supabase
        .channel('dashboard-patients')
        .on('postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'patients'
          },
          () => {
            loadStats(); // Reload stats when patients change
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(transactionChannel);
        supabase.removeChannel(expenseChannel);
        supabase.removeChannel(patientChannel);
      };
    }
  }, [loadStats]);

  return { stats, loading, error, refresh: loadStats };
}

// Hook for real-time patient transactions
export function useRealtimeTransactions(selectedDate: string) {
  const [transactions, setTransactions] = useState<PatientTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadTransactions = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await dataService.getTransactionsByDate(selectedDate);
      setTransactions(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load transactions');
    } finally {
      setLoading(false);
    }
  }, [selectedDate]);

  useEffect(() => {
    loadTransactions();

    // Real-time subscription for Supabase
    if (dataService.getServiceStatus().isOnline) {
      const channel = supabase
        .channel('transactions')
        .on('postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'patient_transactions'
          },
          () => {
            loadTransactions();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [loadTransactions]);

  return { transactions, loading, error, refresh: loadTransactions };
}

// Hook for real-time expenses
export function useRealtimeExpenses(selectedDate: string) {
  const [expenses, setExpenses] = useState<DailyExpense[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadExpenses = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await dataService.getExpensesByDate(selectedDate);
      setExpenses(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load expenses');
    } finally {
      setLoading(false);
    }
  }, [selectedDate]);

  useEffect(() => {
    loadExpenses();

    // Real-time subscription for Supabase
    if (dataService.getServiceStatus().isOnline) {
      const channel = supabase
        .channel('expenses')
        .on('postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'daily_expenses'
          },
          () => {
            loadExpenses();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [loadExpenses]);

  return { expenses, loading, error, refresh: loadExpenses };
}

// Hook for real-time patients
export function useRealtimePatients() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadPatients = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await dataService.getPatients();
      setPatients(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load patients');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPatients();

    // Real-time subscription for Supabase
    if (dataService.getServiceStatus().isOnline) {
      const channel = supabase
        .channel('patients')
        .on('postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'patients'
          },
          () => {
            loadPatients();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [loadPatients]);

  return { patients, loading, error, refresh: loadPatients };
}
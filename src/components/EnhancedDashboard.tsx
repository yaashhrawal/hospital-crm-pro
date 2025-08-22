import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { 
  Users, 
  Calendar, 
  Bed,
  IndianRupee,
  TrendingDown,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  X,
  TrendingUp,
  CalendarDays,
  Filter
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { formatCurrency } from '@/utils';
import { dashboardService } from '../services/dashboardService';
import { queryKeys } from '../config/reactQuery';
import { supabase, HOSPITAL_ID } from '../config/supabaseNew';
import bedService from '../services/bedService';
import HospitalService from '../services/hospitalService';

interface Props {
  onNavigate?: (tab: string) => void;
}

interface ServiceBreakdownItem {
  service: string;
  count: number;
  amount: number;
  percentage: string;
}

interface CardBreakdown {
  today: { 
    count: number; 
    data: any[];
    serviceBreakdown?: { [key: string]: { count: number; amount: number; transactions: any[] } };
    topServices?: ServiceBreakdownItem[];
  };
  thisWeek: { 
    count: number; 
    data: any[];
    serviceBreakdown?: { [key: string]: { count: number; amount: number; transactions: any[] } };
    topServices?: ServiceBreakdownItem[];
  };
  thisMonth: { 
    count: number; 
    data: any[];
    serviceBreakdown?: { [key: string]: { count: number; amount: number; transactions: any[] } };
    topServices?: ServiceBreakdownItem[];
  };
}

export const EnhancedDashboard: React.FC<Props> = ({ onNavigate }) => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedCard, setSelectedCard] = useState<string | null>(null);
  const [cardBreakdown, setCardBreakdown] = useState<CardBreakdown | null>(null);
  const [loadingBreakdown, setLoadingBreakdown] = useState(false);
  
  // Date filter state
  const [dateFilter, setDateFilter] = useState<'today' | 'week' | 'month' | 'all' | 'custom'>('today');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Fetch dashboard data
  const { data: dashboardStats, isLoading: statsLoading, refetch: refetchStats } = useQuery({
    queryKey: queryKeys.dashboardStats,
    queryFn: () => dashboardService.getDashboardStats(),
    refetchInterval: 5 * 60 * 1000,
  });

  // Helper function to format date as YYYY-MM-DD
  const formatDateString = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Helper function to get IST date range based on filter
  // FIXED: Now uses IST timezone consistently like operations ledger
  const getDateRange = () => {
    const now = new Date();
    const todayStr = formatDateString(now); // YYYY-MM-DD format
    
    switch (dateFilter) {
      case 'today':
        // Today in IST (same as operations ledger)
        const todayStart = new Date(`${todayStr}T00:00:00+05:30`);
        const todayEnd = new Date(`${todayStr}T23:59:59+05:30`);
        console.log('🏥 Dashboard IST range for today:', {
          start: todayStart.toISOString(),
          end: todayEnd.toISOString()
        });
        return {
          start: todayStart,
          end: todayEnd
        };
        
      case 'week':
        // Last 7 days in IST
        const weekDate = new Date();
        weekDate.setDate(weekDate.getDate() - 7);
        const weekStr = formatDateString(weekDate);
        const weekStart = new Date(`${weekStr}T00:00:00+05:30`);
        const weekEnd = new Date(`${todayStr}T23:59:59+05:30`);
        return {
          start: weekStart,
          end: weekEnd
        };
        
      case 'month':
        // Current month in IST
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        const monthStartStr = formatDateString(monthStart);
        const monthStartIST = new Date(`${monthStartStr}T00:00:00+05:30`);
        const monthEnd = new Date(`${todayStr}T23:59:59+05:30`);
        return {
          start: monthStartIST,
          end: monthEnd
        };
        
      case 'custom':
        if (customStartDate && customEndDate) {
          // Custom dates in IST (same format as operations ledger)
          const customStart = new Date(`${customStartDate}T00:00:00+05:30`);
          const customEnd = new Date(`${customEndDate}T23:59:59+05:30`);
          return {
            start: customStart,
            end: customEnd
          };
        }
        // Fallback to today if custom dates not set
        const fallbackTodayStr = formatDateString(new Date());
        const fallbackTodayStart = new Date(`${fallbackTodayStr}T00:00:00+05:30`);
        const fallbackTodayEnd = new Date(`${fallbackTodayStr}T23:59:59+05:30`);
        return {
          start: fallbackTodayStart,
          end: fallbackTodayEnd
        };
        
      default:
        return null;
    }
  };

  // Fetch ALL patients data without date filtering (we'll filter in getCardData for consistency)
  const { data: allPatientsData, refetch: refetchPatients } = useQuery({
    queryKey: ['all-patients'],
    queryFn: async () => {
      try {
        // Get ALL patients without any date filtering
        const allPatients = await HospitalService.getPatients(1000);
        console.log('📋 Fetched all patients for dashboard:', allPatients?.length || 0);
        return allPatients || [];
      } catch (error) {
        console.warn('Could not fetch all patients:', error);
        return [];
      }
    },
    staleTime: 5 * 60 * 1000,
  });

  // Filter patients based on current filter for display purposes only
  const patientsData = React.useMemo(() => {
    if (dateFilter === 'all') {
      return allPatientsData || [];
    }
    
    // Apply date filtering if not 'all' - use same priority logic as transactions
    const dateRange = getDateRange();
    if (dateRange) {
      const startDateStr = dateRange.start.toISOString().split('T')[0];
      const endDateStr = dateRange.end.toISOString().split('T')[0];
      
      const filteredPatients = (allPatientsData || []).filter(patient => {
        // 🔍 CRITICAL FIX: Use same priority logic as transactions
        let effectiveDateStr;
        if (patient.date_of_entry && patient.date_of_entry.trim() !== '') {
          // Priority 1: Patient's date_of_entry (for backdated entries)
          effectiveDateStr = patient.date_of_entry.includes('T') 
            ? patient.date_of_entry.split('T')[0] 
            : patient.date_of_entry;
        } else {
          // Priority 2: Patient's created_at date
          effectiveDateStr = patient.created_at.split('T')[0];
        }
        
        return effectiveDateStr >= startDateStr && effectiveDateStr <= endDateStr;
      });
      
      // Enhanced debug patient filtering
      console.log('👥 Dashboard Patients Debug (ENHANCED):', {
        filter: dateFilter,
        dateRange: {
          start: dateRange.start.toISOString(),
          end: dateRange.end.toISOString(),
          startDateStr,
          endDateStr
        },
        allPatientCount: allPatientsData?.length || 0,
        filteredPatientCount: filteredPatients?.length || 0,
        
        // Show ALL patients with their effective dates for debugging
        allPatientsWithDates: allPatientsData?.slice(0, 10).map(p => {
          const effectiveDate = p.date_of_entry && p.date_of_entry.trim() !== '' 
            ? (p.date_of_entry.includes('T') ? p.date_of_entry.split('T')[0] : p.date_of_entry)
            : p.created_at.split('T')[0];
          return {
            id: p.id,
            name: `${p.first_name} ${p.last_name}`,
            dateOfEntry: p.date_of_entry,
            createdAt: p.created_at.split('T')[0],
            effectiveDate,
            matchesFilter: effectiveDate >= startDateStr && effectiveDate <= endDateStr,
            exactToday: effectiveDate === endDateStr
          };
        }) || [],
        
        // Show filtered patients
        filteredPatients: filteredPatients?.map(p => ({
          id: p.id,
          name: `${p.first_name} ${p.last_name}`,
          dateOfEntry: p.date_of_entry,
          createdAt: p.created_at.split('T')[0],
          effectiveDate: p.date_of_entry && p.date_of_entry.trim() !== '' 
            ? (p.date_of_entry.includes('T') ? p.date_of_entry.split('T')[0] : p.date_of_entry)
            : p.created_at.split('T')[0]
        })) || []
      });
      
      return filteredPatients;
    }
    
    return allPatientsData || [];
  }, [allPatientsData, dateFilter, customStartDate, customEndDate]);

  // Fetch beds data
  const { data: bedsData, refetch: refetchBeds } = useQuery({
    queryKey: ['beds', 'all'],
    queryFn: async () => {
      try {
        const beds = await bedService.getAllBeds();
        return beds;
      } catch (error) {
        console.warn('Could not fetch beds:', error);
        return [];
      }
    },
    staleTime: 5 * 60 * 1000,
  });

  // Fetch operations revenue/expense data with date filtering
  const { data: operationsData, refetch: refetchOperations } = useQuery({
    queryKey: ['operations', 'revenue-expenses', dateFilter, customStartDate, customEndDate],
    queryFn: async () => {
      try {
        // Get date range for filtering
        const dateRange = getDateRange();
        
        // Build revenue query with date filtering
        let revenueQuery = supabase
          .from('patient_transactions')
          .select(`
            id,
            amount,
            payment_mode,
            transaction_type,
            description,
            status,
            created_at,
            transaction_date,
            patient:patients!inner(id, patient_id, first_name, last_name, hospital_id, date_of_entry, assigned_department, assigned_doctor)
          `)
          .eq('status', 'COMPLETED')
          .eq('patient.hospital_id', HOSPITAL_ID);

        // Get ALL transactions - we'll filter in JavaScript to match hospitalService.ts logic
        const { data: allRevenueData, error: revenueQueryError } = await revenueQuery;
        
        // 🚨 CRITICAL DEBUG: Log the raw database query results
        console.log('🔍 RAW DATABASE QUERY RESULTS:', {
          queryError: revenueQueryError,
          totalTransactions: allRevenueData?.length || 0,
          sampleTransactions: allRevenueData?.slice(0, 5).map(t => ({
            id: t.id,
            amount: t.amount,
            type: t.transaction_type,
            description: t.description,
            status: t.status,
            created_at: t.created_at,
            transaction_date: t.transaction_date,
            patient: {
              id: t.patient?.id,
              name: `${t.patient?.first_name} ${t.patient?.last_name}`,
              hospital_id: t.patient?.hospital_id,
              date_of_entry: t.patient?.date_of_entry,
              assigned_department: t.patient?.assigned_department,
              assigned_doctor: t.patient?.assigned_doctor
            }
          })) || []
        });
        
        // 🔍 CRITICAL FIX: Apply JavaScript filtering with same priority logic as hospitalService.ts
        let revenueData = allRevenueData || [];
        
        // 🚫 EXCLUDE DR. HEMANT & ORTHO patients from revenue calculations
        revenueData = revenueData?.filter(transaction => {
          const patient = transaction.patient;
          const isExcluded = patient?.assigned_department === 'ORTHO' || patient?.assigned_doctor === 'DR. HEMANT';
          return !isExcluded;
        }) || [];
        
        if (dateRange) {
          const startDateStr = dateRange.start.toISOString().split('T')[0];
          const endDateStr = dateRange.end.toISOString().split('T')[0];
          
          revenueData = revenueData?.filter(transaction => {
            // 🔍 FIXED PRIORITY: For services, prioritize transaction date over patient registration date
            let effectiveDateStr;
            if (transaction.transaction_date && transaction.transaction_date.trim() !== '') {
              // Priority 1: Transaction's transaction_date (when the service was actually provided)
              effectiveDateStr = transaction.transaction_date.includes('T') 
                ? transaction.transaction_date.split('T')[0] 
                : transaction.transaction_date;
            } else if (transaction.patient?.date_of_entry && transaction.patient.date_of_entry.trim() !== '') {
              // Priority 2: Patient's date_of_entry (for backdated patient registrations)
              effectiveDateStr = transaction.patient.date_of_entry.includes('T') 
                ? transaction.patient.date_of_entry.split('T')[0] 
                : transaction.patient.date_of_entry;
            } else {
              // Priority 3: Transaction's created_at date (fallback)
              effectiveDateStr = transaction.created_at.split('T')[0];
            }
            
            return effectiveDateStr >= startDateStr && effectiveDateStr <= endDateStr;
          }) || [];
        }
        
        // Debug revenue calculation
        const excludedCount = (allRevenueData?.length || 0) - (allRevenueData?.filter(t => 
          !(t.patient?.assigned_department === 'ORTHO' || t.patient?.assigned_doctor === 'DR. HEMANT')
        )?.length || 0);
        
        // 🔍 DEBUG: Check for today's transactions specifically
        const todayStr = new Date().toISOString().split('T')[0];
        const todaysTransactions = revenueData?.filter(transaction => {
          let effectiveDateStr;
          // 🔍 FIXED PRIORITY: For services, prioritize transaction date over patient registration date
          if (transaction.transaction_date && transaction.transaction_date.trim() !== '') {
            effectiveDateStr = transaction.transaction_date.includes('T') 
              ? transaction.transaction_date.split('T')[0] 
              : transaction.transaction_date;
          } else if (transaction.patient?.date_of_entry && transaction.patient.date_of_entry.trim() !== '') {
            effectiveDateStr = transaction.patient.date_of_entry.includes('T') 
              ? transaction.patient.date_of_entry.split('T')[0] 
              : transaction.patient.date_of_entry;
          } else {
            effectiveDateStr = transaction.created_at.split('T')[0];
          }
          return effectiveDateStr === todayStr;
        }) || [];
        
        console.log('🚨 TODAY REVENUE TRANSACTIONS DEBUG:', {
          todayStr,
          currentDateFilter: dateFilter,
          todaysTransactionCount: todaysTransactions.length,
          todaysTransactionAmount: todaysTransactions.reduce((sum, t) => sum + (t.amount || 0), 0),
          todaysTransactions: todaysTransactions.map(t => ({
            id: t.id,
            amount: t.amount,
            type: t.transaction_type,
            description: t.description,
            status: t.status,
            patient: `${t.patient?.first_name} ${t.patient?.last_name}`,
            patientId: t.patient?.id,
            createdAt: t.created_at,
            transactionDate: t.transaction_date,
            effectiveDate: t.patient?.date_of_entry && t.patient.date_of_entry.trim() !== '' 
              ? (t.patient.date_of_entry.includes('T') ? t.patient.date_of_entry.split('T')[0] : t.patient.date_of_entry)
              : (t.transaction_date && t.transaction_date.trim() !== '' 
                ? (t.transaction_date.includes('T') ? t.transaction_date.split('T')[0] : t.transaction_date)
                : t.created_at.split('T')[0])
          }))
        });
        
        console.log('💰 Dashboard Revenue Debug (FIXED):', {
          filter: dateFilter,
          dateRange: dateRange ? {
            start: dateRange.start.toISOString(),
            end: dateRange.end.toISOString()
          } : 'No date filter (all)',
          allTransactionCount: allRevenueData?.length || 0,
          excludedORTHO_HEMANT: excludedCount,
          afterExclusionCount: (allRevenueData?.length || 0) - excludedCount,
          finalFilteredCount: revenueData?.length || 0,
          totalRevenue: revenueData?.reduce((sum, t) => sum + (t.amount || 0), 0) || 0,
          sampleFilteredTransactions: revenueData?.slice(0, 3).map(t => {
            // Show the effective date being used
            let effectiveDateStr;
            if (t.patient?.date_of_entry && t.patient.date_of_entry.trim() !== '') {
              effectiveDateStr = t.patient.date_of_entry.includes('T') 
                ? t.patient.date_of_entry.split('T')[0] 
                : t.patient.date_of_entry;
            } else if (t.transaction_date && t.transaction_date.trim() !== '') {
              effectiveDateStr = t.transaction_date.includes('T') 
                ? t.transaction_date.split('T')[0] 
                : t.transaction_date;
            } else {
              effectiveDateStr = t.created_at.split('T')[0];
            }
            
            return {
              id: t.id,
              amount: t.amount,
              effectiveDate: effectiveDateStr,
              patientName: `${t.patient?.first_name} ${t.patient?.last_name}`,
              patientDept: t.patient?.assigned_department,
              patientDoctor: t.patient?.assigned_doctor,
              patientDateOfEntry: t.patient?.date_of_entry,
              transactionDate: t.transaction_date,
              createdAt: t.created_at.split('T')[0],
              type: t.transaction_type,
              excludedFromRevenue: t.patient?.assigned_department === 'ORTHO' || t.patient?.assigned_doctor === 'DR. HEMANT'
            };
          })
        });

        // Build expenses query with date filtering
        let expenseQuery = supabase
          .from('daily_expenses')
          .select('*')
          .eq('hospital_id', HOSPITAL_ID);

        // Apply date filtering for expenses if not 'all'
        if (dateRange) {
          expenseQuery = expenseQuery
            .gte('expense_date', dateRange.start.toISOString().split('T')[0])
            .lte('expense_date', dateRange.end.toISOString().split('T')[0]);
        }

        const { data: expenseData } = await expenseQuery;
        
        // ADDED: Query refunds to match operations ledger calculation
        let refunds: any[] = [];
        
        try {
          let refundQuery = supabase
            .from('patient_refunds')
            .select(`*`)
            .eq('hospital_id', HOSPITAL_ID);
          
          // Apply date filtering for refunds if not 'all'
          if (dateRange) {
            refundQuery = refundQuery
              .gte('transaction_date', dateRange.start.toISOString().split('T')[0])
              .lte('transaction_date', dateRange.end.toISOString().split('T')[0]);
          }
          
          const { data: refundData, error: refundError } = await refundQuery;
          
          if (refundError) {
            console.warn('⚠️ Patient refunds table not accessible:', refundError.message);
            refunds = []; // Use empty array as fallback
          } else {
            refunds = refundData || [];
          }
        } catch (error) {
          console.warn('⚠️ Refunds query failed, using empty array');
          refunds = [];
        }
        
        console.log('↩️ Dashboard Refunds Debug:', {
          filter: dateFilter,
          refundCount: refunds?.length || 0,
          totalRefunds: refunds?.reduce((sum, r) => sum + (r.amount || 0), 0) || 0
        });

        return {
          revenue: revenueData || [],
          expenses: expenseData || [],
          refunds: refunds || [],
        };
      } catch (error) {
        console.warn('Could not fetch operations data:', error);
        return { revenue: [], expenses: [], refunds: [] };
      }
    },
    staleTime: 5 * 60 * 1000,
  });

  // Fetch appointments data with fallback (includes localStorage)
  const { data: appointmentsData, isLoading: appointmentsLoading, refetch: refetchAppointments } = useQuery({
    queryKey: ['appointments', 'dashboard', 'localStorage'],
    queryFn: async () => {
      try {
        // Fetch from appointment service
        const { appointmentService } = await import('../services/appointmentService');
        const result = await appointmentService.getAppointments({
          filters: {
            dateRange: {
              start: new Date().toISOString(),
              end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
            },
          },
          limit: 100,
          sortBy: 'scheduled_at',
          sortOrder: 'asc',
        });
        
        // Also get appointments from localStorage
        const localStorageAppointments = localStorage.getItem('hospital_appointments');
        const localAppointments = localStorageAppointments ? JSON.parse(localStorageAppointments) : [];
        
        // Convert localStorage appointments to match the expected format
        const formattedLocalAppointments = localAppointments.map((apt: any) => ({
          id: apt.id,
          patient_name: apt.patient_name,
          doctor_name: apt.doctor_name,
          department: apt.department,
          // Handle both formats: if scheduled_at exists use it, otherwise combine date and time
          scheduled_at: apt.scheduled_at || 
            (apt.appointment_date && apt.appointment_time 
              ? `${apt.appointment_date}T${apt.appointment_time}:00` 
              : new Date().toISOString()),
          appointment_type: apt.appointment_type,
          status: apt.status,
          notes: apt.notes,
          estimated_duration: apt.estimated_duration,
          estimated_cost: apt.estimated_cost,
          created_at: apt.created_at
        }));
        
        // Combine both sources (avoid duplicates by checking IDs)
        const existingIds = new Set((result.data || []).map((a: any) => a.id));
        const uniqueLocalAppointments = formattedLocalAppointments.filter((a: any) => !existingIds.has(a.id));
        const combinedData = [...(result.data || []), ...uniqueLocalAppointments];
        
        console.log('📅 Dashboard Appointments - DB:', result.data?.length || 0, 'LocalStorage:', uniqueLocalAppointments.length);
        
        return { 
          data: combinedData, 
          count: combinedData.length 
        };
      } catch (error) {
        console.warn('Could not fetch appointments from service, using localStorage:', error);
        
        // Fallback to localStorage only
        const localStorageAppointments = localStorage.getItem('hospital_appointments');
        const localAppointments = localStorageAppointments ? JSON.parse(localStorageAppointments) : [];
        
        const formattedLocalAppointments = localAppointments.map((apt: any) => ({
          id: apt.id,
          patient_name: apt.patient_name,
          doctor_name: apt.doctor_name,
          department: apt.department,
          // Handle both formats: if scheduled_at exists use it, otherwise combine date and time
          scheduled_at: apt.scheduled_at || 
            (apt.appointment_date && apt.appointment_time 
              ? `${apt.appointment_date}T${apt.appointment_time}:00` 
              : new Date().toISOString()),
          appointment_type: apt.appointment_type,
          status: apt.status,
          notes: apt.notes,
          estimated_duration: apt.estimated_duration,
          estimated_cost: apt.estimated_cost,
          created_at: apt.created_at
        }));
        
        return { data: formattedLocalAppointments, count: formattedLocalAppointments.length };
      }
    },
    staleTime: 5 * 60 * 1000,
  });

  // Handle refresh data
  const handleRefreshData = async () => {
    console.log('🔄 ENHANCED DASHBOARD REFRESH BUTTON CLICKED');
    console.log('📊 Current dashboard state:', {
      dateFilter,
      customStartDate,
      customEndDate,
      showDatePicker
    });
    
    try {
      console.log('🔄 Refreshing all dashboard data...');
      await Promise.all([
        refetchStats(),
        refetchPatients(),
        refetchBeds(),
        refetchOperations(),
        refetchAppointments(),
      ]);
      console.log('✅ Dashboard refresh completed successfully');
      toast.success('Dashboard data refreshed!');
    } catch (error) {
      console.error('❌ Dashboard refresh failed:', error);
      toast.error('Failed to refresh dashboard data');
    }
  };

  // Listen for localStorage changes to update appointments
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'hospital_appointments') {
        console.log('📅 Appointments updated in localStorage, refreshing...');
        refetchAppointments();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    
    // Also check for changes from same tab (storage event doesn't fire for same tab)
    const interval = setInterval(() => {
      refetchAppointments();
    }, 30000); // Refresh every 30 seconds
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, [refetchAppointments]);

  // Handle appointment confirmation
  const handleConfirmAppointment = async (appointmentId: string) => {
    try {
      // Check if it's a localStorage appointment
      const localStorageAppointments = localStorage.getItem('hospital_appointments');
      if (localStorageAppointments) {
        const appointments = JSON.parse(localStorageAppointments);
        const appointmentIndex = appointments.findIndex((apt: any) => apt.id === appointmentId);
        
        if (appointmentIndex !== -1) {
          const appointment = appointments[appointmentIndex];
          
          // Remove the appointment from localStorage completely (confirmed appointments don't stay on dashboard)
          appointments.splice(appointmentIndex, 1);
          localStorage.setItem('hospital_appointments', JSON.stringify(appointments));
          
          // Log the confirmation for audit purposes
          console.log('✅ Appointment confirmed and removed from dashboard:', {
            id: appointment.id,
            patient: appointment.patient_name,
            date: appointment.appointment_date,
            time: appointment.appointment_time,
            confirmed_at: new Date().toISOString()
          });
          
          toast.success(`Appointment confirmed for ${appointment.patient_name}! Patient is now visible in patient list.`);
          refetchAppointments();
          refetchPatients(); // Refresh patient list to show the now-visible patient
          return;
        }
      }
      
      // If not in localStorage, try to update in database
      const { appointmentService } = await import('../services/appointmentService');
      await appointmentService.updateAppointment(appointmentId, { status: 'confirmed' });
      
      toast.success('Appointment confirmed successfully!');
      refetchAppointments();
    } catch (error) {
      console.error('Error confirming appointment:', error);
      toast.error('Failed to confirm appointment');
    }
  };

  // Handle appointment cancellation (deletes the appointment and potentially the patient)
  const handleCancelAppointment = async (appointmentId: string) => {
    if (!confirm('Are you sure you want to cancel this appointment? This will remove it from the list and may also remove the patient if they were created only for this appointment.')) {
      return;
    }
    
    try {
      // Check if it's a localStorage appointment
      const localStorageAppointments = localStorage.getItem('hospital_appointments');
      if (localStorageAppointments) {
        const appointments = JSON.parse(localStorageAppointments);
        const appointmentIndex = appointments.findIndex((apt: any) => apt.id === appointmentId);
        
        if (appointmentIndex !== -1) {
          const cancelledAppointment = appointments[appointmentIndex];
          
          // If appointment has patient_uuid, delete the patient directly
          if (cancelledAppointment.patient_uuid) {
            try {
              await HospitalService.deletePatient(cancelledAppointment.patient_uuid);
              console.log('🗑️ Patient deleted due to appointment cancellation:', {
                patient_name: cancelledAppointment.patient_name,
                patient_uuid: cancelledAppointment.patient_uuid
              });
              toast.success(`Appointment cancelled and patient ${cancelledAppointment.patient_name} removed from database`);
            } catch (patientError) {
              console.error('Error deleting patient:', patientError);
              // Fallback to old method if UUID deletion fails
              await handlePatientDeletionForCancelledAppointment(cancelledAppointment.patient_name);
            }
          } else {
            // Fallback to old method for appointments without patient_uuid
            await handlePatientDeletionForCancelledAppointment(cancelledAppointment.patient_name);
          }
          
          // Remove the appointment from localStorage completely
          appointments.splice(appointmentIndex, 1);
          localStorage.setItem('hospital_appointments', JSON.stringify(appointments));
          
          // Log the cancellation for audit purposes
          console.log('🗑️ Appointment cancelled and removed:', {
            id: appointmentId,
            patient: cancelledAppointment.patient_name,
            date: cancelledAppointment.appointment_date,
            time: cancelledAppointment.appointment_time,
            cancelled_at: new Date().toISOString()
          });
          
          refetchAppointments();
          // Also refresh patient data in case a patient was deleted
          refetchPatients();
          return;
        }
      }
      
      // If not in localStorage, try to delete from database
      const { appointmentService } = await import('../services/appointmentService');
      
      // Try to delete the appointment if the service supports it
      if (appointmentService.deleteAppointment) {
        await appointmentService.deleteAppointment(appointmentId);
      } else {
        // Fallback to updating status if delete is not available
        await appointmentService.updateAppointment(appointmentId, { status: 'cancelled' });
      }
      
      toast.success('Appointment cancelled and removed');
      refetchAppointments();
    } catch (error) {
      console.error('Error cancelling appointment:', error);
      toast.error('Failed to cancel appointment');
    }
  };

  // Handle patient deletion when appointment is cancelled
  const handlePatientDeletionForCancelledAppointment = async (patientName: string) => {
    console.log('🔍 Starting patient deletion check for cancelled appointment:', patientName);
    
    try {
      // Import HospitalService to interact with patients
      const HospitalService = (await import('../services/hospitalService')).default;
      
      // Get all patients to find the one with matching name
      console.log('📋 Fetching all patients to find match...');
      const allPatients = await HospitalService.getPatients(1000);
      console.log(`📊 Total patients in database: ${allPatients.length}`);
      
      const matchingPatients = allPatients.filter((patient: any) => 
        `${patient.first_name} ${patient.last_name}` === patientName
      );
      
      console.log(`🔎 Found ${matchingPatients.length} patients matching name "${patientName}"`);
      
      if (matchingPatients.length === 0) {
        console.log('🔍 No matching patient found for:', patientName);
        toast(`No patient found with name: ${patientName}`, {
          icon: 'ℹ️',
          duration: 3000,
        });
        return;
      }
      
      // If multiple patients with same name, be cautious
      if (matchingPatients.length > 1) {
        console.warn('⚠️ Multiple patients found with name:', patientName, 'Skipping deletion for safety');
        toast.warning(`Multiple patients found with name "${patientName}". Skipping deletion for safety.`);
        return;
      }
      
      const patient = matchingPatients[0];
      console.log('👤 Patient details:', {
        id: patient.id,
        patient_id: patient.patient_id,
        name: `${patient.first_name} ${patient.last_name}`,
        created_at: patient.created_at,
        transactions_count: patient.transactions ? patient.transactions.length : 0,
        admissions_count: patient.admissions ? patient.admissions.length : 0
      });
      
      // Check if patient has any transactions (indicating they've had services)
      const hasTransactions = patient.transactions && patient.transactions.length > 0;
      console.log(`💳 Has transactions: ${hasTransactions} (${patient.transactions ? patient.transactions.length : 0} transactions)`);
      
      // Check if patient has any admissions
      const hasAdmissions = patient.admissions && patient.admissions.length > 0;
      console.log(`🏥 Has admissions: ${hasAdmissions} (${patient.admissions ? patient.admissions.length : 0} admissions)`);
      
      // Check if patient was created recently (within last 24 hours - indicating they were likely created for the appointment)
      const patientCreatedAt = new Date(patient.created_at);
      const now = new Date();
      const hoursSinceCreation = (now.getTime() - patientCreatedAt.getTime()) / (1000 * 60 * 60);
      const isRecentlyCreated = hoursSinceCreation <= 24;
      
      console.log(`⏰ Patient creation details:`, {
        created_at: patientCreatedAt.toISOString(),
        current_time: now.toISOString(),
        hours_since_creation: hoursSinceCreation.toFixed(2),
        is_recently_created: isRecentlyCreated
      });
      
      // Only delete if patient has no activity AND was created recently
      const shouldDelete = !hasTransactions && !hasAdmissions && isRecentlyCreated;
      console.log(`🤔 Should delete patient? ${shouldDelete}`, {
        no_transactions: !hasTransactions,
        no_admissions: !hasAdmissions,
        recently_created: isRecentlyCreated
      });
      
      if (shouldDelete) {
        console.log('🗑️ Deleting patient created for cancelled appointment:', {
          name: patientName,
          id: patient.patient_id,
          uuid: patient.id,
          created: patientCreatedAt,
          hours_ago: hoursSinceCreation.toFixed(1)
        });
        
        await HospitalService.deletePatient(patient.id);
        console.log('✅ Patient successfully deleted from database');
        toast.success(`Patient ${patientName} also removed (was created only for this appointment)`);
      } else {
        console.log('👤 Keeping patient (has activity or not recently created):', {
          name: patientName,
          id: patient.patient_id,
          hasTransactions,
          hasAdmissions,
          isRecentlyCreated,
          hours_ago: hoursSinceCreation.toFixed(1)
        });
        
        const reason = [];
        if (hasTransactions) reason.push('has transactions');
        if (hasAdmissions) reason.push('has admissions');
        if (!isRecentlyCreated) reason.push('not recently created');
        
        toast(`Patient ${patientName} kept (${reason.join(', ')})`, {
          icon: 'ℹ️',
          duration: 3000,
        });
      }
    } catch (error) {
      console.error('❌ Error checking/deleting patient for cancelled appointment:', error);
      toast.error(`Failed to check/delete patient ${patientName}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  // Calculate card data using same logic as breakdown for consistency
  const getCardData = () => {
    // CONSISTENCY FIX: Use same filtering logic as breakdown
    let totalPatients = 0;
    let totalRevenue = 0;
    
    if (dateFilter === 'today') {
      // For 'today' filter, count actual today's patients using same logic as breakdown
      const todayStr = formatDateString(new Date());
      
      // Count patients for today (same logic as breakdown)
      const allPatients = allPatientsData || []; // Use all patients data, not pre-filtered
      totalPatients = allPatients.filter((p: any) => {
        const effectiveDateStr = p.date_of_entry && p.date_of_entry.trim() !== '' 
          ? (p.date_of_entry.includes('T') ? p.date_of_entry.split('T')[0] : p.date_of_entry)
          : p.created_at.split('T')[0];
        return effectiveDateStr === todayStr;
      }).length;
      
      // Count revenue for today (same logic as breakdown)
      const allRevenue = operationsData?.revenue || [];
      const todaysRevenue = allRevenue.filter((r: any) => {
        let effectiveDateStr;
        // 🔍 FIXED PRIORITY: For services, prioritize transaction date over patient registration date
        if (r.transaction_date && r.transaction_date.trim() !== '') {
          effectiveDateStr = r.transaction_date.includes('T') 
            ? r.transaction_date.split('T')[0] 
            : r.transaction_date;
        } else if (r.patient?.date_of_entry && r.patient.date_of_entry.trim() !== '') {
          effectiveDateStr = r.patient.date_of_entry.includes('T') 
            ? r.patient.date_of_entry.split('T')[0] 
            : r.patient.date_of_entry;
        } else {
          effectiveDateStr = r.created_at.split('T')[0];
        }
        return effectiveDateStr === todayStr;
      });
      
      totalRevenue = todaysRevenue.reduce((sum: number, t: any) => sum + (t.amount || 0), 0);
      
      // 🔍 DEBUG: Log today's revenue calculation
      console.log('💰 TODAY REVENUE CARD DEBUG:', {
        todayStr,
        allRevenueCount: allRevenue.length,
        todaysRevenueCount: todaysRevenue.length,
        todaysRevenueAmount: totalRevenue,
        todaysRevenueTransactions: todaysRevenue.map(r => ({
          id: r.id,
          amount: r.amount,
          description: r.description,
          type: r.transaction_type,
          patient: `${r.patient?.first_name} ${r.patient?.last_name}`,
          effectiveDate: r.patient?.date_of_entry && r.patient.date_of_entry.trim() !== '' 
            ? (r.patient.date_of_entry.includes('T') ? r.patient.date_of_entry.split('T')[0] : r.patient.date_of_entry)
            : (r.transaction_date && r.transaction_date.trim() !== '' 
              ? (r.transaction_date.includes('T') ? r.transaction_date.split('T')[0] : r.transaction_date)
              : r.created_at.split('T')[0]),
          createdAt: r.created_at
        }))
      });
      
      console.log('🏠 Dashboard Home Consistency Fix:', {
        filter: dateFilter,
        todayStr,
        calculatedPatients: totalPatients,
        calculatedRevenue: totalRevenue,
        originalPatientsDataLength: patientsData?.length || 0,
        originalRevenueTotal: (operationsData?.revenue || []).reduce((sum: number, t: any) => sum + (t.amount || 0), 0)
      });
    } else {
      // For other filters, use the existing filtered data
      totalPatients = patientsData?.length || 0;
      totalRevenue = operationsData?.revenue.reduce((sum: number, transaction: any) => 
        sum + (transaction.amount || 0), 0) || 0;
    }
    
    // Filter beds based on admission dates for admissions card
    let filteredAdmissions = 0;
    if (dateFilter === 'all') {
      // For 'all', show currently occupied beds
      filteredAdmissions = bedsData?.filter(bed => 
        bed.status === 'occupied' || bed.status === 'OCCUPIED'
      ).length || 0;
    } else {
      // For date filters, count admissions within date range
      const dateRange = getDateRange();
      if (dateRange && bedsData) {
        filteredAdmissions = bedsData.filter(bed => {
          if (bed.status !== 'occupied' && bed.status !== 'OCCUPIED') return false;
          if (!bed.admission_date) return false;
          
          const admissionDate = new Date(bed.admission_date);
          return admissionDate >= dateRange.start && admissionDate <= dateRange.end;
        }).length;
      }
    }
    
    // Available beds (not affected by date filter - always current status)
    const availableBeds = bedsData?.filter(bed => 
      bed.status === 'vacant' || bed.status === 'AVAILABLE'
    ).length || 0;
    
    // Expenses and refunds use existing filtered data
    const totalExpenses = operationsData?.expenses.reduce((sum: number, expense: any) => 
      sum + (expense.amount || 0), 0) || 0;
    const totalRefunds = operationsData?.refunds?.reduce((sum: number, refund: any) => 
      sum + (refund.amount || 0), 0) || 0;
    
    // Calculate net revenue matching operations ledger formula
    const netRevenue = totalRevenue - totalExpenses - totalRefunds;
    
    // Debug dashboard totals
    console.log('📊 Dashboard Totals (matching operations logic):', {
      filter: dateFilter,
      totalRevenue,
      totalExpenses,
      totalRefunds,
      netRevenue,
      formula: 'Revenue - Expenses - Refunds',
      transactionCount: operationsData?.revenue?.length || 0,
      expenseCount: operationsData?.expenses?.length || 0,
      refundCount: operationsData?.refunds?.length || 0
    });

    return {
      totalPatients,
      admissions: filteredAdmissions,
      availableBeds,
      revenue: totalRevenue,
      expenses: totalExpenses,
    };
  };

  const cardData = getCardData();

  // Handle card click to show breakdown
  const handleCardClick = async (cardType: string) => {
    setSelectedCard(cardType);
    setLoadingBreakdown(true);
    
    try {
      const now = new Date();
      // CRITICAL FIX: Don't mutate the original date object
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const weekStart = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

      let breakdown: CardBreakdown = {
        today: { count: 0, data: [] },
        thisWeek: { count: 0, data: [] },
        thisMonth: { count: 0, data: [] },
      };

      switch (cardType) {
        case 'patients':
          // CONSISTENCY FIX: Use same data source as main card calculation
          console.log('👥 Patient Card Click: Using consistent data source with main card...');
          
          const currentFilteredPatients = patientsData || [];
          
          // Use the SAME all patients data as the main card to ensure consistency
          const allPatientsForBreakdown = allPatientsData || [];
          
          console.log('📊 Data Source Consistency Check:', {
            currentFilter: dateFilter,
            mainCardShowing: cardData.totalPatients,
            currentFilteredLength: currentFilteredPatients.length,
            allPatientsLength: allPatientsForBreakdown.length
          });
          
          // Use consistent date formatting - MATCH main dashboard calculation
          const todayStr = formatDateString(new Date());
          const weekStartDate = new Date();
          weekStartDate.setDate(weekStartDate.getDate() - 7); // Keep same as main dashboard
          const weekStartStr = formatDateString(weekStartDate);
          const monthStartDate = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
          const monthStartStr = formatDateString(monthStartDate);
          
          console.log('📅 Patient Card Date Calculations:', {
            currentFilter: dateFilter,
            todayStr,
            weekStartStr,
            monthStartStr,
            currentFilteredCount: currentFilteredPatients.length
          });
          
          const todayPatients = allPatientsForBreakdown?.filter((p: any) => {
            const effectiveDateStr = p.date_of_entry && p.date_of_entry.trim() !== '' 
              ? (p.date_of_entry.includes('T') ? p.date_of_entry.split('T')[0] : p.date_of_entry)
              : p.created_at.split('T')[0];
            return effectiveDateStr === todayStr;
          }) || [];
          
          const weekPatients = allPatientsForBreakdown?.filter((p: any) => {
            const effectiveDateStr = p.date_of_entry && p.date_of_entry.trim() !== '' 
              ? (p.date_of_entry.includes('T') ? p.date_of_entry.split('T')[0] : p.date_of_entry)
              : p.created_at.split('T')[0];
            
            // Debug individual patient dates for week calculation
            const isInWeekRange = effectiveDateStr >= weekStartStr && effectiveDateStr <= todayStr;
            if (p.first_name && p.first_name.includes('TEST')) {
              console.log(`📅 Week Filter Debug - ${p.first_name} ${p.last_name}:`, {
                effectiveDateStr,
                weekStartStr,
                todayStr,
                isInRange: isInWeekRange
              });
            }
            
            return isInWeekRange;
          }) || [];
          
          const monthPatients = allPatientsForBreakdown?.filter((p: any) => {
            const effectiveDateStr = p.date_of_entry && p.date_of_entry.trim() !== '' 
              ? (p.date_of_entry.includes('T') ? p.date_of_entry.split('T')[0] : p.date_of_entry)
              : p.created_at.split('T')[0];
            return effectiveDateStr >= monthStartStr && effectiveDateStr <= todayStr;
          }) || [];
          
          breakdown = {
            today: { count: todayPatients.length, data: todayPatients },
            thisWeek: { count: weekPatients.length, data: weekPatients },
            thisMonth: { count: monthPatients.length, data: monthPatients },
          };
          
          console.log('📊 Patient Card Breakdown Results:', {
            currentDateFilter: dateFilter,
            mainCardTotalShowing: cardData.totalPatients,
            breakdownResults: {
              todayCount: todayPatients.length,
              weekCount: weekPatients.length,
              monthCount: monthPatients.length
            },
            totalAllPatients: allPatientsForBreakdown?.length,
            dateCalculations: {
              todayStr,
              weekStartStr,
              monthStartStr
            },
            samplePatients: {
              todayPatients: todayPatients.slice(0, 3).map(p => `${p.first_name} ${p.last_name} (${p.date_of_entry || p.created_at.split('T')[0]})`),
              weekPatients: weekPatients.slice(0, 5).map(p => `${p.first_name} ${p.last_name} (${p.date_of_entry || p.created_at.split('T')[0]})`)
            }
          });
          
          break;

        case 'admissions':
          const occupiedBeds = bedsData?.filter(bed => 
            bed.status === 'occupied' || bed.status === 'OCCUPIED') || [];
          const todayAdmissions = occupiedBeds.filter(bed => 
            bed.admission_date && new Date(bed.admission_date) >= today);
          const weekAdmissions = occupiedBeds.filter(bed => 
            bed.admission_date && new Date(bed.admission_date) >= weekStart);
          const monthAdmissions = occupiedBeds.filter(bed => 
            bed.admission_date && new Date(bed.admission_date) >= monthStart);

          breakdown = {
            today: { count: todayAdmissions.length, data: todayAdmissions },
            thisWeek: { count: weekAdmissions.length, data: weekAdmissions },
            thisMonth: { count: monthAdmissions.length, data: monthAdmissions },
          };
          break;

        case 'beds':
          const availableBeds = bedsData?.filter(bed => 
            bed.status === 'vacant' || bed.status === 'AVAILABLE') || [];
          
          breakdown = {
            today: { count: availableBeds.length, data: availableBeds },
            thisWeek: { count: availableBeds.length, data: availableBeds },
            thisMonth: { count: availableBeds.length, data: availableBeds },
          };
          break;

        case 'revenue':
          // CONSISTENCY FIX: Use same data source as main dashboard for consistency
          console.log('💰 Revenue Card Click: Using same filtered data as main dashboard for consistency...');
          
          // Use the same pre-filtered revenue data that the main dashboard uses
          const currentFilteredRevenue = operationsData?.revenue || [];
          
          // For proper breakdown, we need ALL revenue data to calculate Today/Week/Month
          let allRevenueData: any[] = [];
          const allTransactionData = await supabase
            .from('patient_transactions')
            .select(`
              id,
              amount,
              payment_mode,
              transaction_type,
              description,
              status,
              created_at,
              transaction_date,
              patient:patients!inner(id, patient_id, first_name, last_name, hospital_id, date_of_entry, assigned_department, assigned_doctor)
            `)
            .eq('status', 'COMPLETED')
            .eq('patient.hospital_id', HOSPITAL_ID);
          
          if (allTransactionData.error) {
            console.error('❌ Error fetching all transaction data:', allTransactionData.error);
            // Use current filtered data as fallback for all periods
            allRevenueData = currentFilteredRevenue;
          } else {
            // Apply exclusions (DR. HEMANT & ORTHO) - same as main dashboard
            allRevenueData = (allTransactionData.data || []).filter(transaction => {
              const patient = transaction.patient;
              const isExcluded = patient?.assigned_department === 'ORTHO' || patient?.assigned_doctor === 'DR. HEMANT';
              return !isExcluded;
            });
            
            console.log('💰 Revenue Card Data Analysis:', {
              currentFilteredCount: currentFilteredRevenue.length,
              currentFilteredAmount: currentFilteredRevenue.reduce((sum: number, t: any) => sum + (t.amount || 0), 0),
              allTransactionsCount: allTransactionData.data?.length || 0,
              afterExclusionsCount: allRevenueData.length,
              excludedCount: (allTransactionData.data?.length || 0) - allRevenueData.length
            });
          }
          
          // Use consistent date formatting (formatDateString like main dashboard)
          const revenueTodayStr = formatDateString(new Date());
          const weekAgo = new Date();
          weekAgo.setDate(weekAgo.getDate() - 7);
          const revenueWeekStr = formatDateString(weekAgo);
          const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
          const revenueMonthStr = formatDateString(monthStart);
          
          console.log('📅 Revenue Card Date Setup:', {
            todayStr: revenueTodayStr,
            weekStr: revenueWeekStr,
            monthStr: revenueMonthStr
          });

          const todayRevenue = allRevenueData?.filter((r: any) => {
            // Use same date priority logic as main revenue calculation
            let effectiveDateStr;
            if (r.patient?.date_of_entry && r.patient.date_of_entry.trim() !== '') {
              effectiveDateStr = r.patient.date_of_entry.includes('T') 
                ? r.patient.date_of_entry.split('T')[0] 
                : r.patient.date_of_entry;
            } else if (r.transaction_date && r.transaction_date.trim() !== '') {
              effectiveDateStr = r.transaction_date.includes('T') 
                ? r.transaction_date.split('T')[0] 
                : r.transaction_date;
            } else {
              effectiveDateStr = r.created_at.split('T')[0];
            }
            return effectiveDateStr === revenueTodayStr;
          }) || [];
          
          const weekRevenue = allRevenueData?.filter((r: any) => {
            let effectiveDateStr;
            if (r.patient?.date_of_entry && r.patient.date_of_entry.trim() !== '') {
              effectiveDateStr = r.patient.date_of_entry.includes('T') 
                ? r.patient.date_of_entry.split('T')[0] 
                : r.patient.date_of_entry;
            } else if (r.transaction_date && r.transaction_date.trim() !== '') {
              effectiveDateStr = r.transaction_date.includes('T') 
                ? r.transaction_date.split('T')[0] 
                : r.transaction_date;
            } else {
              effectiveDateStr = r.created_at.split('T')[0];
            }
            return effectiveDateStr >= revenueWeekStr && effectiveDateStr <= revenueTodayStr;
          }) || [];
          
          const monthRevenue = allRevenueData?.filter((r: any) => {
            let effectiveDateStr;
            if (r.patient?.date_of_entry && r.patient.date_of_entry.trim() !== '') {
              effectiveDateStr = r.patient.date_of_entry.includes('T') 
                ? r.patient.date_of_entry.split('T')[0] 
                : r.patient.date_of_entry;
            } else if (r.transaction_date && r.transaction_date.trim() !== '') {
              effectiveDateStr = r.transaction_date.includes('T') 
                ? r.transaction_date.split('T')[0] 
                : r.transaction_date;
            } else {
              effectiveDateStr = r.created_at.split('T')[0];
            }
            return effectiveDateStr >= revenueMonthStr && effectiveDateStr <= revenueTodayStr;
          }) || [];

          // Debug revenue breakdown results
          const todayRevenueAmount = todayRevenue.reduce((sum: number, r: any) => sum + (r.amount || 0), 0);
          const weekRevenueAmount = weekRevenue.reduce((sum: number, r: any) => sum + (r.amount || 0), 0);
          const monthRevenueAmount = monthRevenue.reduce((sum: number, r: any) => sum + (r.amount || 0), 0);
          
          // Calculate service/transaction type breakdown for revenue analysis
          const getServiceBreakdown = (transactions: any[]) => {
            const serviceBreakdown: { [key: string]: { count: number; amount: number; transactions: any[] } } = {};
            
            transactions.forEach(t => {
              const serviceType = t.transaction_type || 'Other';
              if (!serviceBreakdown[serviceType]) {
                serviceBreakdown[serviceType] = { count: 0, amount: 0, transactions: [] };
              }
              serviceBreakdown[serviceType].count++;
              serviceBreakdown[serviceType].amount += t.amount || 0;
              serviceBreakdown[serviceType].transactions.push(t);
            });
            
            return serviceBreakdown;
          };

          const todayServiceBreakdown = getServiceBreakdown(todayRevenue);
          const weekServiceBreakdown = getServiceBreakdown(weekRevenue);
          const monthServiceBreakdown = getServiceBreakdown(monthRevenue);

          console.log('🔍 Revenue Card Breakdown Results (WITH SERVICES):', {
            dateComparisons: {
              todayTarget: revenueTodayStr,
              weekTarget: `${revenueWeekStr} to ${revenueTodayStr}`,
              monthTarget: `${revenueMonthStr} to ${revenueTodayStr}`
            },
            counts: {
              todayTransactions: todayRevenue.length,
              weekTransactions: weekRevenue.length,  
              monthTransactions: monthRevenue.length
            },
            amounts: {
              todayAmount: todayRevenueAmount,
              weekAmount: weekRevenueAmount,
              monthAmount: monthRevenueAmount
            },
            serviceBreakdowns: {
              today: Object.entries(todayServiceBreakdown).map(([service, data]) => ({
                service,
                count: data.count,
                amount: data.amount,
                percentage: todayRevenueAmount > 0 ? ((data.amount / todayRevenueAmount) * 100).toFixed(1) + '%' : '0%'
              })).sort((a, b) => b.amount - a.amount),
              week: Object.entries(weekServiceBreakdown).map(([service, data]) => ({
                service,
                count: data.count,
                amount: data.amount,
                percentage: weekRevenueAmount > 0 ? ((data.amount / weekRevenueAmount) * 100).toFixed(1) + '%' : '0%'
              })).sort((a, b) => b.amount - a.amount),
              month: Object.entries(monthServiceBreakdown).map(([service, data]) => ({
                service,
                count: data.count,
                amount: data.amount,
                percentage: monthRevenueAmount > 0 ? ((data.amount / monthRevenueAmount) * 100).toFixed(1) + '%' : '0%'
              })).sort((a, b) => b.amount - a.amount)
            },
            sampleTodayTransactions: todayRevenue.slice(0, 3).map(r => ({
              id: r.id,
              amount: r.amount,
              service: r.transaction_type,
              patientName: `${r.patient?.first_name} ${r.patient?.last_name}`,
              effectiveDate: r.patient?.date_of_entry && r.patient.date_of_entry.trim() !== '' 
                ? (r.patient.date_of_entry.includes('T') ? r.patient.date_of_entry.split('T')[0] : r.patient.date_of_entry)
                : r.transaction_date && r.transaction_date.trim() !== ''
                ? (r.transaction_date.includes('T') ? r.transaction_date.split('T')[0] : r.transaction_date) 
                : r.created_at.split('T')[0],
              dept: r.patient?.assigned_department,
              doctor: r.patient?.assigned_doctor
            })),
            // Check for problematic dates
            august13Revenue: todayRevenue.filter(r => {
              const effectiveDate = r.patient?.date_of_entry && r.patient.date_of_entry.trim() !== '' 
                ? (r.patient.date_of_entry.includes('T') ? r.patient.date_of_entry.split('T')[0] : r.patient.date_of_entry)
                : r.transaction_date && r.transaction_date.trim() !== ''
                ? (r.transaction_date.includes('T') ? r.transaction_date.split('T')[0] : r.transaction_date) 
                : r.created_at.split('T')[0];
              return effectiveDate === '2025-08-13';
            }).length
          });

          breakdown = {
            today: { 
              count: todayRevenueAmount, 
              data: todayRevenue,
              serviceBreakdown: todayServiceBreakdown,
              topServices: Object.entries(todayServiceBreakdown)
                .map(([service, data]) => ({
                  service,
                  count: data.count,
                  amount: data.amount,
                  percentage: todayRevenueAmount > 0 ? Math.max(0, ((data.amount / todayRevenueAmount) * 100)).toFixed(1) : '0'
                }))
                .sort((a, b) => b.amount - a.amount)
                .slice(0, 5) // Top 5 services
            },
            thisWeek: { 
              count: weekRevenueAmount, 
              data: weekRevenue,
              serviceBreakdown: weekServiceBreakdown,
              topServices: Object.entries(weekServiceBreakdown)
                .map(([service, data]) => ({
                  service,
                  count: data.count,
                  amount: data.amount,
                  percentage: weekRevenueAmount > 0 ? ((data.amount / weekRevenueAmount) * 100).toFixed(1) : '0'
                }))
                .sort((a, b) => b.amount - a.amount)
                .slice(0, 5) // Top 5 services
            },
            thisMonth: { 
              count: monthRevenueAmount, 
              data: monthRevenue,
              serviceBreakdown: monthServiceBreakdown,
              topServices: Object.entries(monthServiceBreakdown)
                .map(([service, data]) => ({
                  service,
                  count: data.count,
                  amount: data.amount,
                  percentage: monthRevenueAmount > 0 ? ((data.amount / monthRevenueAmount) * 100).toFixed(1) : '0'
                }))
                .sort((a, b) => b.amount - a.amount)
                .slice(0, 5) // Top 5 services
            },
          };
          break;

        case 'expenses':
          // Define local date variables for expenses case to avoid scope issues
          const expenseMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
          
          const todayExpenses = operationsData?.expenses.filter((e: any) => 
            e.expense_date && new Date(e.expense_date) >= today) || [];
          const weekExpenses = operationsData?.expenses.filter((e: any) => 
            e.expense_date && new Date(e.expense_date) >= weekStart) || [];
          const monthExpenses = operationsData?.expenses.filter((e: any) => 
            e.expense_date && new Date(e.expense_date) >= expenseMonthStart) || [];

          breakdown = {
            today: { 
              count: todayExpenses.reduce((sum: number, e: any) => sum + (e.amount || 0), 0), 
              data: todayExpenses 
            },
            thisWeek: { 
              count: weekExpenses.reduce((sum: number, e: any) => sum + (e.amount || 0), 0), 
              data: weekExpenses 
            },
            thisMonth: { 
              count: monthExpenses.reduce((sum: number, e: any) => sum + (e.amount || 0), 0), 
              data: monthExpenses 
            },
          };
          break;
      }

      setCardBreakdown(breakdown);
    } catch (error) {
      console.error('Error loading breakdown:', error);
    } finally {
      setLoadingBreakdown(false);
    }
  };

  // Calendar navigation
  const navigateMonth = (direction: 'prev' | 'next') => {
    const newMonth = new Date(currentMonth);
    if (direction === 'prev') {
      newMonth.setMonth(newMonth.getMonth() - 1);
    } else {
      newMonth.setMonth(newMonth.getMonth() + 1);
    }
    setCurrentMonth(newMonth);
  };

  // Generate calendar days
  const generateCalendarDays = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());
    
    const days = [];
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 41);
    
    for (let date = new Date(startDate); date < endDate; date.setDate(date.getDate() + 1)) {
      days.push(new Date(date));
    }
    
    return days;
  };

  // Filter appointments for selected date and next 7 days (exclude cancelled)
  const getUpcomingAppointments = () => {
    if (!appointmentsData?.data) return [];
    
    const startDate = new Date(selectedDate);
    startDate.setHours(0, 0, 0, 0);
    const endDate = new Date(selectedDate);
    endDate.setDate(endDate.getDate() + 7);
    endDate.setHours(23, 59, 59, 999);
    
    return appointmentsData.data.filter((appointment: any) => {
      // Exclude cancelled appointments
      if (appointment.status === 'cancelled') return false;
      
      const appointmentDate = new Date(appointment.scheduled_at);
      return appointmentDate >= startDate && appointmentDate <= endDate;
    }).slice(0, 10);
  };

  const formatSelectedDateRange = () => {
    const endDate = new Date(selectedDate);
    endDate.setDate(endDate.getDate() + 7);
    return `${selectedDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
  };

  if (statsLoading) {
    return (
      <div className="min-h-screen bg-[#F5F5F5] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#007bff]"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F5F5]" style={{ fontFamily: 'Arial, Helvetica, sans-serif' }}>
      {/* Header with Date Filter */}
      <div className="bg-[#F5F5F5] px-6 py-4">
        <div className="flex justify-between items-center mb-4">
          {/* Date Filter Section */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-[#333333]">
              <Filter className="h-5 w-5" style={{ color: '#0056B3' }} />
              <span className="font-medium">Filter by Date:</span>
            </div>
            
            {/* Quick Filter Buttons */}
            <div className="flex items-center gap-2">
              {[
                { value: 'all', label: 'All Time' },
                { value: 'today', label: 'Today' },
                { value: 'week', label: 'Last 7 Days' },
                { value: 'month', label: 'This Month' },
                { value: 'custom', label: 'Custom Range' }
              ].map((filter) => (
                <button
                  key={filter.value}
                  onClick={() => {
                    setDateFilter(filter.value as any);
                    if (filter.value === 'custom') {
                      setShowDatePicker(true);
                    } else {
                      setShowDatePicker(false);
                    }
                  }}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                    dateFilter === filter.value
                      ? 'text-white shadow-sm'
                      : 'bg-white text-[#333333] hover:bg-[#f8f9fa] border border-gray-200'
                  }`}
                  style={dateFilter === filter.value ? { backgroundColor: '#0056B3' } : {}}
                >
                  {filter.label}
                </button>
              ))}
            </div>
          </div>

          {/* Refresh Button */}
          <Button 
            onClick={handleRefreshData}
            className="text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:opacity-90"
            style={{ backgroundColor: '#0056B3' }}
          >
            <RefreshCw className="h-4 w-4" />
            Refresh Data
          </Button>
        </div>

        {/* Custom Date Range Picker */}
        {showDatePicker && dateFilter === 'custom' && (
          <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200 mb-4">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <CalendarDays className="h-4 w-4" style={{ color: '#0056B3' }} />
                <span className="text-sm font-medium text-[#333333]">From:</span>
                <input
                  type="date"
                  value={customStartDate}
                  onChange={(e) => setCustomStartDate(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#007bff] focus:border-transparent"
                />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-[#333333]">To:</span>
                <input
                  type="date"
                  value={customEndDate}
                  onChange={(e) => setCustomEndDate(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#007bff] focus:border-transparent"
                />
              </div>
              <button
                onClick={() => setShowDatePicker(false)}
                className="px-3 py-2 bg-[#007bff] text-white rounded-lg text-sm hover:bg-[#0056b3] transition-colors"
              >
                Apply Filter
              </button>
            </div>
            {(customStartDate || customEndDate) && (
              <div className="mt-2 text-xs text-[#666666]">
                Showing data from {customStartDate || 'beginning'} to {customEndDate || 'today'}
              </div>
            )}
          </div>
        )}

        {/* Filter Summary */}
        {dateFilter !== 'all' && (
          <div className="border rounded-lg p-3 mb-4" style={{ backgroundColor: '#f0f4ff', borderColor: '#0056B3' }}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2" style={{ color: '#0056B3' }}>
                <CalendarDays className="h-4 w-4" />
                <span className="text-sm font-medium">
                  {dateFilter === 'today' && 'Showing data for today'}
                  {dateFilter === 'week' && 'Showing data for the last 7 days'}
                  {dateFilter === 'month' && 'Showing data for this month'}
                  {dateFilter === 'custom' && `Showing data from ${customStartDate || 'beginning'} to ${customEndDate || 'today'}`}
                </span>
              </div>
              <button
                onClick={() => {
                  setDateFilter('all');
                  setShowDatePicker(false);
                  setCustomStartDate('');
                  setCustomEndDate('');
                }}
                className="text-sm underline hover:opacity-80"
                style={{ color: '#0056B3' }}
              >
                Clear Filter
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Summary Cards */}
      <div className="px-6 pb-6">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
          {/* Total Patients Card */}
          <div 
            className="bg-white rounded-lg p-6 shadow-sm cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => handleCardClick('patients')}
          >
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-[#999999]">Total Patients</h3>
              <Users className="h-5 w-5" style={{ color: '#0056B3' }} />
            </div>
            <div className="text-3xl font-bold mb-1" style={{ color: '#0056B3' }}>
              {cardData.totalPatients.toLocaleString()}
            </div>
            <p className="text-xs text-[#999999]">
              {dateFilter === 'all' ? 'All time' : 
               dateFilter === 'today' ? 'Today only' :
               dateFilter === 'week' ? 'Last 7 days' :
               dateFilter === 'month' ? 'This month' :
               'Custom range'}
            </p>
          </div>

          {/* Admissions Card */}
          <div 
            className="bg-white rounded-lg p-6 shadow-sm cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => handleCardClick('admissions')}
          >
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-[#999999]">Admissions</h3>
              <Calendar className="h-5 w-5" style={{ color: '#0056B3' }} />
            </div>
            <div className="text-3xl font-bold mb-1" style={{ color: '#0056B3' }}>
              {cardData.admissions.toString()}
            </div>
            <p className="text-xs text-[#999999]">
              {dateFilter === 'all' ? 'All time' : 
               dateFilter === 'today' ? 'Today only' :
               dateFilter === 'week' ? 'Last 7 days' :
               dateFilter === 'month' ? 'This month' :
               'Custom range'}
            </p>
          </div>

          {/* Available Beds Card */}
          <div 
            className="bg-white rounded-lg p-6 shadow-sm cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => handleCardClick('beds')}
          >
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-[#999999]">Available Beds</h3>
              <Bed className="h-5 w-5" style={{ color: '#0056B3' }} />
            </div>
            <div className="text-3xl font-bold mb-1" style={{ color: '#0056B3' }}>
              {cardData.availableBeds.toString()}
            </div>
            <p className="text-xs text-[#999999]">
              {dateFilter === 'all' ? 'All time' : 
               dateFilter === 'today' ? 'Today only' :
               dateFilter === 'week' ? 'Last 7 days' :
               dateFilter === 'month' ? 'This month' :
               'Custom range'}
            </p>
          </div>

          {/* Revenue Card */}
          <div 
            className="bg-white rounded-lg p-6 shadow-sm cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => handleCardClick('revenue')}
          >
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-[#999999]">Revenue</h3>
              <IndianRupee className="h-5 w-5" style={{ color: '#0056B3' }} />
            </div>
            <div className="text-3xl font-bold mb-1" style={{ color: '#0056B3' }}>
              {formatCurrency(cardData.revenue)}
            </div>
            <p className="text-xs text-[#999999]">
              {dateFilter === 'all' ? 'All time' : 
               dateFilter === 'today' ? 'Today only' :
               dateFilter === 'week' ? 'Last 7 days' :
               dateFilter === 'month' ? 'This month' :
               'Custom range'}
            </p>
          </div>

          {/* Expenses Card */}
          <div 
            className="bg-white rounded-lg p-6 shadow-sm cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => handleCardClick('expenses')}
          >
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-[#999999]">Expenses</h3>
              <TrendingDown className="h-5 w-5" style={{ color: '#0056B3' }} />
            </div>
            <div className="text-3xl font-bold mb-1" style={{ color: '#0056B3' }}>
              {formatCurrency(cardData.expenses)}
            </div>
            <p className="text-xs text-[#999999]">
              {dateFilter === 'all' ? 'All time' : 
               dateFilter === 'today' ? 'Today only' :
               dateFilter === 'week' ? 'Last 7 days' :
               dateFilter === 'month' ? 'This month' :
               'Custom range'}
            </p>
          </div>
        </div>

        {/* Bottom Row - Calendar and Appointments */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Appointments Calendar */}
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <h3 className="text-lg font-semibold mb-1" style={{ color: '#0056B3' }}>Appointments Calendar</h3>
            <p className="text-sm text-[#999999] mb-4">Select a date to view scheduled appointments</p>
            
            {/* Calendar Header */}
            <div className="flex items-center justify-between mb-4">
              <button
                onClick={() => navigateMonth('prev')}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <ChevronLeft className="h-5 w-5 text-[#333333]" />
              </button>
              <h4 className="text-lg font-semibold text-[#333333]">
                {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </h4>
              <button
                onClick={() => navigateMonth('next')}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <ChevronRight className="h-5 w-5 text-[#333333]" />
              </button>
            </div>
            
            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-1 mb-2">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <div key={day} className="p-2 text-center text-sm font-medium text-[#999999]">
                  {day}
                </div>
              ))}
            </div>
            
            <div className="grid grid-cols-7 gap-1">
              {generateCalendarDays().map((date, index) => {
                const isCurrentMonth = date.getMonth() === currentMonth.getMonth();
                const isToday = date.toDateString() === new Date().toDateString();
                const isSelected = date.toDateString() === selectedDate.toDateString();
                
                return (
                  <button
                    key={index}
                    onClick={() => setSelectedDate(date)}
                    className={`
                      p-2 text-sm rounded-lg transition-colors
                      ${
                        isCurrentMonth
                          ? isToday
                            ? 'text-white font-bold'
                            : isSelected
                            ? 'text-white'
                            : 'text-[#333333] hover:bg-gray-100'
                          : 'text-[#999999] hover:bg-gray-50'
                      }
                    `}
                    style={
                      isCurrentMonth && (isToday || isSelected)
                        ? { backgroundColor: '#0056B3' }
                        : {}
                    }
                  >
                    {date.getDate()}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Upcoming Appointments */}
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <h3 className="text-lg font-semibold mb-1" style={{ color: '#0056B3' }}>Upcoming Appointments</h3>
            <p className="text-sm text-[#999999] mb-4">
              Showing appointments for {formatSelectedDateRange()}
            </p>
            
            
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {appointmentsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#007bff]"></div>
                </div>
              ) : (
                (() => {
                  const upcomingAppointments = getUpcomingAppointments();
                  
                  console.log('📅 EnhancedDashboard - Appointments Debug:');
                  console.log('- Raw appointmentsData:', appointmentsData);
                  console.log('- Filtered upcoming appointments:', upcomingAppointments);
                  console.log('- Count:', upcomingAppointments.length);
                  
                  if (upcomingAppointments.length === 0) {
                    return (
                      <div className="text-center py-8 text-[#999999]">
                        <Calendar className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p>No appointments for this date range.</p>
                        <p className="text-xs mt-2">Total available: {appointmentsData?.data?.length || 0}</p>
                      </div>
                    );
                  }
                  
                  return upcomingAppointments.map((appointment: any) => (
                    <div key={appointment.id} className="border-l-4 border-[#007bff] pl-4 py-2 hover:bg-gray-50 transition-colors">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <p className="font-medium text-[#333333]">
                            {/* Handle both formats: nested patient object or direct patient_name */}
                            {appointment.patient 
                              ? `${appointment.patient.first_name} ${appointment.patient.last_name}`
                              : appointment.patient_name || 'Unknown Patient'}
                          </p>
                          <p className="text-sm text-[#999999]">
                            {/* Handle both formats: nested department or direct department string */}
                            {appointment.department?.name || appointment.department || 'General'}
                          </p>
                          {appointment.doctor_name && (
                            <p className="text-xs text-[#666666] mt-1">
                              Dr. {appointment.doctor_name}
                            </p>
                          )}
                          {appointment.notes && (
                            <p className="text-xs text-[#888888] mt-1 italic">
                              Note: {appointment.notes}
                            </p>
                          )}
                        </div>
                        <div className="text-right ml-4">
                          <p className="text-sm font-medium text-[#333333]">
                            {new Date(appointment.scheduled_at).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric'
                            })}
                          </p>
                          <p className="text-sm text-[#999999]">
                            {new Date(appointment.scheduled_at).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                              hour12: true
                            })}
                          </p>
                          <span className={`inline-block px-2 py-0.5 text-xs rounded-full mt-1 ${
                            appointment.status === 'scheduled' ? 'bg-blue-100 text-blue-700' :
                            appointment.status === 'confirmed' ? 'bg-green-100 text-green-700' :
                            appointment.status === 'completed' ? 'bg-gray-100 text-gray-700' :
                            'bg-yellow-100 text-yellow-700'
                          }`}>
                            {appointment.status || 'pending'}
                          </span>
                        </div>
                      </div>
                      
                      {/* Action buttons for appointments */}
                      {appointment.status !== 'completed' && (
                        <div className="flex gap-2 mt-2 pt-2 border-t border-gray-100">
                          {appointment.status !== 'confirmed' && (
                            <button
                              onClick={() => handleConfirmAppointment(appointment.id)}
                              className="flex-1 px-2 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                              title="Confirm this appointment"
                            >
                              ✓ Confirm
                            </button>
                          )}
                          {appointment.status === 'confirmed' && (
                            <span className="flex-1 px-2 py-1 text-xs bg-green-100 text-green-700 rounded text-center">
                              ✓ Confirmed
                            </span>
                          )}
                          <button
                            onClick={() => handleCancelAppointment(appointment.id)}
                            className="flex-1 px-2 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                            title="Cancel and remove this appointment"
                          >
                            ✕ Cancel
                          </button>
                        </div>
                      )}
                      
                      {appointment.status === 'completed' && (
                        <div className="mt-2 pt-2 border-t border-gray-100">
                          <span className="block text-xs text-gray-600 text-center">
                            ✓ Completed
                          </span>
                        </div>
                      )}
                    </div>
                  ));
                })()
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Card Breakdown Modal */}
      {selectedCard && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[80vh] overflow-y-auto m-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold capitalize" style={{ color: '#0056B3' }}>
                {selectedCard} Breakdown
              </h2>
              <button
                onClick={() => setSelectedCard(null)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X className="h-5 w-5 text-[#333333]" />
              </button>
            </div>

            {loadingBreakdown ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#007bff]"></div>
              </div>
            ) : cardBreakdown ? (
              <div className="space-y-6">
                {/* Time Period Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="rounded-lg p-4" style={{ backgroundColor: '#f0f4ff' }}>
                    <h3 className="text-sm font-medium text-[#999999]">Today</h3>
                    <div className="text-2xl font-bold" style={{ color: '#0056B3' }}>
                      {['revenue', 'expenses'].includes(selectedCard) 
                        ? formatCurrency(cardBreakdown.today.count)
                        : cardBreakdown.today.count.toLocaleString()}
                    </div>
                    <p className="text-xs text-[#999999]">{cardBreakdown.today.data.length} records</p>
                  </div>
                  
                  <div className="bg-green-50 rounded-lg p-4">
                    <h3 className="text-sm font-medium text-[#999999]">This Week</h3>
                    <div className="text-2xl font-bold text-green-600">
                      {['revenue', 'expenses'].includes(selectedCard) 
                        ? formatCurrency(cardBreakdown.thisWeek.count)
                        : cardBreakdown.thisWeek.count.toLocaleString()}
                    </div>
                    <p className="text-xs text-[#999999]">{cardBreakdown.thisWeek.data.length} records</p>
                  </div>
                  
                  <div className="bg-purple-50 rounded-lg p-4">
                    <h3 className="text-sm font-medium text-[#999999]">This Month</h3>
                    <div className="text-2xl font-bold text-purple-600">
                      {['revenue', 'expenses'].includes(selectedCard) 
                        ? formatCurrency(cardBreakdown.thisMonth.count)
                        : cardBreakdown.thisMonth.count.toLocaleString()}
                    </div>
                    <p className="text-xs text-[#999999]">{cardBreakdown.thisMonth.data.length} records</p>
                  </div>
                </div>

                {/* Service Revenue Breakdown (only for revenue card) */}
                {selectedCard === 'revenue' && cardBreakdown.today.topServices && cardBreakdown.today.topServices.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold mb-3" style={{ color: '#0056B3' }}>
                      Revenue by Service (Today)
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        {cardBreakdown.today.topServices.map((service, index) => (
                          <div key={index} className="flex justify-between items-center p-3 bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg border border-blue-200">
                            <div>
                              <p className="font-medium text-[#333333]">{service.service}</p>
                              <p className="text-xs text-[#666666]">{service.count} transaction{service.count !== 1 ? 's' : ''}</p>
                            </div>
                            <div className="text-right">
                              <p className="font-bold" style={{ color: '#0056B3' }}>{formatCurrency(service.amount)}</p>
                              <p className="text-xs text-[#666666]">{service.percentage}%</p>
                            </div>
                          </div>
                        ))}
                      </div>
                      
                      {/* Service breakdown chart visual */}
                      <div className="bg-gray-50 rounded-lg p-4">
                        <h4 className="text-sm font-medium text-[#666666] mb-3">Service Distribution</h4>
                        <div className="space-y-2">
                          {cardBreakdown.today.topServices.slice(0, 5).map((service, index) => (
                            <div key={index} className="flex items-center space-x-2">
                              <div className="text-xs text-[#666666] w-20 truncate">{service.service}</div>
                              <div className="flex-1 bg-gray-200 rounded-full h-2">
                                <div 
                                  className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full transition-all duration-300"
                                  style={{ width: `${service.percentage}%` }}
                                ></div>
                              </div>
                              <div className="text-xs text-[#666666] w-12 text-right">{service.percentage}%</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Recent Data */}
                <div>
                  <h3 className="text-lg font-semibold mb-3" style={{ color: '#0056B3' }}>
                    Recent {selectedCard.charAt(0).toUpperCase() + selectedCard.slice(1)}
                  </h3>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {cardBreakdown.today.data.slice(0, 10).map((item: any, index: number) => (
                      <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                        <div>
                          <p className="font-medium text-[#333333]">
                            {selectedCard === 'patients' && `${item.first_name} ${item.last_name}`}
                            {selectedCard === 'admissions' && `Bed ${item.bed_number} - ${item.patients?.first_name || 'Unknown'}`}
                            {selectedCard === 'beds' && `Bed ${item.bed_number} (${item.room_type})`}
                            {selectedCard === 'revenue' && `${item.transaction_type || 'Transaction'} - ${item.patient?.first_name || 'Unknown'} ${item.patient?.last_name || ''}`}
                            {selectedCard === 'expenses' && `${item.expense_category || 'Expense'} - ${item.description}`}
                          </p>
                          <p className="text-sm text-[#999999]">
                            {new Date(item.created_at || item.admission_date || item.expense_date || Date.now()).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="text-right">
                          {(['revenue', 'expenses'].includes(selectedCard)) && (
                            <p className="font-semibold" style={{ color: '#0056B3' }}>
                              {formatCurrency(item.amount || 0)}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
};

export default EnhancedDashboard;
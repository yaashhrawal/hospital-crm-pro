import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import dataService from '../../services/dataService';
import type { Patient, PatientTransaction, PatientAdmission, DailyExpense, Doctor } from '../../services/dataService';
import toast from 'react-hot-toast';

interface PatientJourney {
  patient: Patient;
  transactions: PatientTransaction[];
  admission?: PatientAdmission;
  totalPaid: number;
  status: 'active' | 'discharged' | 'outpatient';
  timeline: Array<{
    time: string;
    type: 'entry' | 'consultation' | 'service' | 'admission' | 'discharge';
    description: string;
    amount: number;
    payment_mode: string;
  }>;
}

interface DailyStats {
  totalPatients: number;
  totalIncome: number;
  totalExpenses: number;
  netRevenue: number;
  cashPayments: number;
  digitalPayments: number;
  activeAdmissions: number;
  completedJourneys: number;
}

// Utility function to check if a patient should be excluded (ORTHO/DR HEMANT)
const shouldExcludePatient = (patient: any): boolean => {
  if (!patient) return false;
  
  const department = patient.assigned_department?.toUpperCase()?.trim() || '';
  const doctor = patient.assigned_doctor?.toUpperCase()?.trim() || '';
  
  const isOrtho = department === 'ORTHO' || department === 'ORTHOPAEDIC';
  const isHemant = doctor.includes('HEMANT') || doctor === 'DR HEMANT' || doctor === 'DR. HEMANT';
  
  return isOrtho && isHemant;
};

const DailyOperationsView: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [patientJourneys, setPatientJourneys] = useState<PatientJourney[]>([]);
  const [dailyStats, setDailyStats] = useState<DailyStats>({
    totalPatients: 0,
    totalIncome: 0,
    totalExpenses: 0,
    netRevenue: 0,
    cashPayments: 0,
    digitalPayments: 0,
    activeAdmissions: 0,
    completedJourneys: 0,
  });
  const [expenses, setExpenses] = useState<DailyExpense[]>([]);
  const [loading, setLoading] = useState(false);
  const [expandedPatient, setExpandedPatient] = useState<string | null>(null);

  // Load all data for the selected date
  const loadDailyOperations = async () => {
    setLoading(true);
    try {
      // Load data - transactions already filtered at database level
      console.log('🏥 DailyOperationsView - Fetching filtered data for date:', selectedDate);
      const [transactions, patients, admissions, dailyExpenses] = await Promise.all([
        dataService.getTransactionsByDate(selectedDate), // Already excludes ORTHO/DR HEMANT
        dataService.getPatients(),
        dataService.getActiveAdmissions(),
        dataService.getExpensesByDate(selectedDate),
      ]);
      
      console.log('🏥 DailyOperationsView - Data fetched:', {
        date: selectedDate,
        transactionCount: transactions.length,
        patientCount: patients.length,
        sampleTransactions: transactions.slice(0, 3).map(t => ({
          id: t.id,
          patient_id: t.patient_id,
          type: t.transaction_type,
          amount: t.amount,
          hasPatientData: !!t.patients,
          patientName: t.patients ? `${t.patients.first_name} ${t.patients.last_name}` : 'No patient data'
        }))
      });
      
      setExpenses(dailyExpenses);

      // Transactions are already filtered at the database level
      // No need to filter again here - dataService already excludes ORTHO/DR HEMANT
      console.log('✅ Using pre-filtered transactions (ORTHO/DR HEMANT already excluded at DB level)');
      const filteredTransactions = transactions;

      console.log('📊 Transaction filtering results:', {
        originalCount: transactions.length,
        filteredCount: filteredTransactions.length,
        excludedCount: transactions.length - filteredTransactions.length
      });

      // Group filtered transactions by patient
      const patientTransactionMap = new Map<string, PatientTransaction[]>();
      filteredTransactions.forEach(transaction => {
        const patientId = transaction.patient_id;
        if (!patientTransactionMap.has(patientId)) {
          patientTransactionMap.set(patientId, []);
        }
        patientTransactionMap.get(patientId)!.push(transaction);
      });

      // Create patient journeys
      const journeys: PatientJourney[] = [];
      
      for (const [patientId, patientTransactions] of patientTransactionMap.entries()) {
        // Get patient data from the first transaction (since transactions come with patient data)
        const firstTransaction = patientTransactions[0];
        const patient = firstTransaction.patients || patients.find(p => p.id === patientId);
        
        if (!patient) {
          console.log(`⚠️ No patient data found for patient ID: ${patientId}`);
          continue;
        }

        // Final safety check using utility function
        if (shouldExcludePatient(patient)) {
          console.log(`🚫 SAFETY CHECK: Excluding patient ${patient.first_name} ${patient.last_name} - ORTHO/HEMANT (this should not happen if DB filtering worked)`);
          continue;
        }
        
        console.log(`✅ Including patient ${patient.first_name} ${patient.last_name} - Dept: ${patient.assigned_department}, Doc: ${patient.assigned_doctor}`);

        const patientAdmission = admissions.find(a => a.patient_id === patientId);
        const totalPaid = patientTransactions.reduce((sum, t) => sum + t.amount, 0);

        // Database should now return transactions in chronological order
        // No need for complex frontend sorting since database query is fixed
        console.log(`📋 Transactions for ${patient.first_name} ${patient.last_name} (database ordered):`);

        // Create timeline from database-ordered transactions
        const timeline = patientTransactions.map(transaction => {
          // Convert UTC database time to actual local time
          let formattedTime;
          try {
            const transactionDateTime = new Date(transaction.created_at);
            // Manual timezone conversion
            const utcTime = transactionDateTime.getTime();
            const localTimezoneOffset = new Date().getTimezoneOffset() * 60 * 1000;
            const localTime = new Date(utcTime - localTimezoneOffset);
            
            formattedTime = localTime.toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
              hour12: true
            });
          } catch (timeError) {
            // Fallback to date-fns format if formatting fails
            formattedTime = format(new Date(transaction.created_at), 'hh:mm a');
          }
          
          // Map database transaction types to display types
          let displayType: 'entry' | 'consultation' | 'service' | 'admission' | 'discharge';
          switch (transaction.transaction_type?.toUpperCase()) {
            case 'SERVICE':
              displayType = 'service';
              break;
            case 'ADMISSION_FEE':
              displayType = 'admission';
              break;
            case 'CONSULTATION':
              displayType = 'consultation';
              break;
            case 'ENTRY_FEE':
              displayType = 'entry';
              break;
            default:
              displayType = 'service'; // Default fallback
          }
          
          return {
            time: formattedTime,
            type: displayType,
            description: transaction.description,
            amount: transaction.amount,
            payment_mode: transaction.payment_mode,
          };
        });

        // Final verification: Timeline should now be in perfect chronological order
        console.log(`📋 TIMELINE CREATED: ${timeline.length} events in chronological order for ${patient.first_name} ${patient.last_name}`);

        // Determine status
        let status: 'active' | 'discharged' | 'outpatient' = 'outpatient';
        if (patientAdmission) {
          status = patientAdmission.status === 'active' ? 'active' : 'discharged';
        }

        journeys.push({
          patient,
          transactions: patientTransactions,
          admission: patientAdmission,
          totalPaid,
          status,
          timeline,
        });
      }

      // Sort journeys by first transaction date/time
      journeys.sort((a, b) => {
        // Get the earliest transaction date for each patient
        const getEarliestTransactionTime = (transactions: any[]) => {
          if (!transactions || transactions.length === 0) return 0;
          
          const sortedTransactions = [...transactions].sort((t1, t2) => {
            const date1 = t1.transaction_date ? new Date(t1.transaction_date).getTime() : new Date(t1.created_at).getTime();
            const date2 = t2.transaction_date ? new Date(t2.transaction_date).getTime() : new Date(t2.created_at).getTime();
            return date1 - date2;
          });
          
          const firstTransaction = sortedTransactions[0];
          return firstTransaction.transaction_date ? 
            new Date(firstTransaction.transaction_date).getTime() : 
            new Date(firstTransaction.created_at).getTime();
        };
        
        const timeA = getEarliestTransactionTime(a.transactions);
        const timeB = getEarliestTransactionTime(b.transactions);
        return timeA - timeB;
      });

      setPatientJourneys(journeys);

      // Calculate daily stats using filtered transactions (excluding ORTHO/DR HEMANT)
      const totalIncome = filteredTransactions.reduce((sum, t) => sum + t.amount, 0);
      const totalExpenses = dailyExpenses.reduce((sum, e) => sum + e.amount, 0);
      const netRevenue = totalIncome - totalExpenses;

      const cashPayments = filteredTransactions
        .filter(t => t.payment_mode === 'cash' && t.amount > 0)
        .reduce((sum, t) => sum + t.amount, 0);
      
      const digitalPayments = filteredTransactions
        .filter(t => ['online', 'card', 'upi'].includes(t.payment_mode) && t.amount > 0)
        .reduce((sum, t) => sum + t.amount, 0);

      const activeAdmissions = admissions.filter(a => a.status === 'active').length;
      const completedJourneys = journeys.filter(j => j.status === 'discharged').length;

      setDailyStats({
        totalPatients: journeys.length,
        totalIncome,
        totalExpenses,
        netRevenue,
        cashPayments,
        digitalPayments,
        activeAdmissions,
        completedJourneys,
      });

    } catch (error) {
      console.error('Error loading daily operations:', error);
      toast.error('Failed to load daily operations data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDailyOperations();
  }, [selectedDate]);

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'discharged': return 'bg-gray-100 text-gray-800';
      case 'outpatient': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'entry': return '🚪';
      case 'consultation': return '👩‍⚕️';
      case 'service': return '🧾'; // IPD Bill icon
      case 'admission': return '💰'; // Deposit icon
      case 'discharge': return '👋';
      default: return '💰';
    }
  };

  const exportDailyReport = () => {
    const report = {
      date: selectedDate,
      stats: dailyStats,
      patientJourneys: patientJourneys.map(journey => ({
        patientId: journey.patient.patient_id,
        patientName: `${journey.patient.first_name} ${journey.patient.last_name}`,
        status: journey.status,
        totalPaid: journey.totalPaid,
        timeline: journey.timeline,
        admission: journey.admission ? {
          bedNumber: journey.admission.bed_number,
          roomType: journey.admission.room_type,
          dailyRate: journey.admission.daily_rate,
        } : null,
      })),
      expenses,
    };

    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `daily-operations-${selectedDate}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast.success('Daily report exported successfully');
  };

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Daily Operations Dashboard</h1>
          <p className="text-gray-600 mt-1">Complete view of hospital operations and patient journeys</p>
        </div>
        <div className="flex items-center gap-4">
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <Button onClick={exportDailyReport} variant="outline">
            Export Report
          </Button>
          <Button onClick={loadDailyOperations} disabled={loading}>
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
        </div>
      </div>

      {/* Daily Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
        <Card className="p-4 text-center">
          <div className="text-2xl font-bold text-blue-600">{dailyStats.totalPatients}</div>
          <div className="text-sm text-gray-600">Total Patients</div>
        </Card>
        <Card className="p-4 text-center">
          <div className="text-2xl font-bold text-green-600">₹{dailyStats.totalIncome.toLocaleString()}</div>
          <div className="text-sm text-gray-600">Total Income</div>
        </Card>
        <Card className="p-4 text-center">
          <div className="text-2xl font-bold text-red-600">₹{dailyStats.totalExpenses.toLocaleString()}</div>
          <div className="text-sm text-gray-600">Total Expenses</div>
        </Card>
        <Card className="p-4 text-center">
          <div className={`text-2xl font-bold ${dailyStats.netRevenue >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            ₹{dailyStats.netRevenue.toLocaleString()}
          </div>
          <div className="text-sm text-gray-600">Net Revenue</div>
        </Card>
        <Card className="p-4 text-center">
          <div className="text-2xl font-bold text-purple-600">₹{dailyStats.cashPayments.toLocaleString()}</div>
          <div className="text-sm text-gray-600">Cash Payments</div>
        </Card>
        <Card className="p-4 text-center">
          <div className="text-2xl font-bold text-indigo-600">₹{dailyStats.digitalPayments.toLocaleString()}</div>
          <div className="text-sm text-gray-600">Digital Payments</div>
        </Card>
        <Card className="p-4 text-center">
          <div className="text-2xl font-bold text-orange-600">{dailyStats.activeAdmissions}</div>
          <div className="text-sm text-gray-600">Active Admissions</div>
        </Card>
        <Card className="p-4 text-center">
          <div className="text-2xl font-bold text-gray-600">{dailyStats.completedJourneys}</div>
          <div className="text-sm text-gray-600">Completed Journeys</div>
        </Card>
      </div>

      {/* Patient Journeys */}
      <Card className="p-6">
        <h2 className="text-xl font-bold text-gray-800 mb-4">Patient Journeys Timeline</h2>
        
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading patient journeys...</p>
          </div>
        ) : patientJourneys.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p>No patient journeys found for {format(new Date(selectedDate), 'MMMM d, yyyy')}</p>
          </div>
        ) : (
          <div className="space-y-4">
            {patientJourneys.map((journey) => (
              <div
                key={journey.patient.id}
                className={`border rounded-lg p-4 cursor-pointer transition-all ${
                  expandedPatient === journey.patient.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => setExpandedPatient(
                  expandedPatient === journey.patient.id ? null : journey.patient.id
                )}
              >
                {/* Patient Summary */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                      <span className="text-lg font-bold text-gray-600">
                        {journey.patient.first_name.charAt(0)}{journey.patient.last_name.charAt(0)}
                      </span>
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-800">
                        {journey.patient.first_name} {journey.patient.last_name}
                      </h3>
                      <p className="text-sm text-gray-600">ID: {journey.patient.patient_id}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="font-semibold text-green-600">₹{journey.totalPaid.toLocaleString()}</p>
                      <p className="text-sm text-gray-600">{journey.transactions.length} transactions</p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusBadgeColor(journey.status)}`}>
                      {journey.status.charAt(0).toUpperCase() + journey.status.slice(1)}
                    </span>
                    <svg 
                      className={`w-5 h-5 text-gray-400 transition-transform ${expandedPatient === journey.patient.id ? 'rotate-180' : ''}`} 
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>

                {/* Expanded Details */}
                {expandedPatient === journey.patient.id && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {/* Patient Info */}
                      <div>
                        <h4 className="font-semibold text-gray-800 mb-2">Patient Information</h4>
                        <div className="space-y-1 text-sm">
                          <p><strong>Phone:</strong> {journey.patient.phone}</p>
                          <p><strong>Age:</strong> {new Date().getFullYear() - new Date(journey.patient.date_of_birth).getFullYear()}</p>
                          <p><strong>Gender:</strong> {journey.patient.gender}</p>
                          {journey.patient.blood_group && <p><strong>Blood Group:</strong> {journey.patient.blood_group}</p>}
                          {journey.admission && (
                            <div className="mt-2 p-2 bg-yellow-100 rounded">
                              <p><strong>Bed:</strong> {journey.admission.bed_number}</p>
                              <p><strong>Room:</strong> {journey.admission.room_type}</p>
                              <p><strong>Daily Rate:</strong> ₹{journey.admission.daily_rate}</p>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Journey Timeline */}
                      <div>
                        <h4 className="font-semibold text-gray-800 mb-2">Journey Timeline</h4>
                        <div className="space-y-2">
                          {journey.timeline.map((event, index) => (
                            <div key={index} className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-sm">
                                {getTransactionIcon(event.type)}
                              </div>
                              <div className="flex-1">
                                <div className="flex justify-between items-start">
                                  <div>
                                    <p className="text-sm font-medium">{event.description}</p>
                                    <p className="text-xs text-gray-500">{event.time} • {event.payment_mode}</p>
                                  </div>
                                  <span className="text-sm font-semibold text-green-600">
                                    ₹{event.amount}
                                  </span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Daily Expenses */}
      {expenses.length > 0 && (
        <Card className="p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Daily Expenses</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Payment Mode</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {expenses.map((expense) => (
                  <tr key={expense.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {expense.expense_category.replace('_', ' ').toUpperCase()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {expense.description}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600 font-semibold">
                      ₹{expense.amount.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {expense.payment_mode.toUpperCase()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
};

export default DailyOperationsView;
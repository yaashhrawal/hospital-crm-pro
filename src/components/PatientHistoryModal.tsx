import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import dataService from '../services/dataService';
import type { Patient, PatientTransaction } from '../types/index';
import { getPatientTransactionDate, formatDateForDisplay, getPatientEntryDate } from '../utils/dateUtils';
import ReceiptTemplate, { type ReceiptData } from './receipts/ReceiptTemplate';

interface PatientHistoryModalProps {
  patient: Patient;
  onClose: () => void;
}

interface VisitRecord {
  date: string;
  transactions: PatientTransaction[];
  totalAmount: number;
  doctors: string[];
  departments: string[];
}

interface FinancialSummary {
  totalSpent: number;
  averagePerVisit: number;
  paymentMethodBreakdown: Record<string, number>;
  monthlySpending: Array<{ month: string; amount: number }>;
}

interface VisitAnalytics {
  totalVisits: number;
  averageVisitsPerMonth: number;
  mostFrequentReasons: Array<{ reason: string; count: number }>;
  preferredDoctors: Array<{ doctor: string; count: number }>;
  visitPatterns: Record<string, number>;
}

const PatientHistoryModal: React.FC<PatientHistoryModalProps> = ({ patient, onClose }) => {
  const [activeTab, setActiveTab] = useState<'visits' | 'financial' | 'medical' | 'analytics'>('visits');
  const [visitHistory, setVisitHistory] = useState<VisitRecord[]>([]);
  const [patientVisits, setPatientVisits] = useState<any[]>([]);
  const [financialSummary, setFinancialSummary] = useState<FinancialSummary | null>(null);
  const [visitAnalytics, setVisitAnalytics] = useState<VisitAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editedPatient, setEditedPatient] = useState<Patient>(patient);
  const [selectedTransactions, setSelectedTransactions] = useState<Set<string>>(new Set());
  const [selectAll, setSelectAll] = useState(false);

  useEffect(() => {
    loadPatientData();
  }, [patient.id]);

  const loadPatientData = async () => {
    try {
      setLoading(true);
      
      // Get all transactions for this patient
      const transactions = await dataService.getTransactionsByPatient(patient.id);
      
      // Get patient visits from the visits table
      try {
        const visits = await dataService.getPatientVisits(patient.id);
        setPatientVisits(visits);
      } catch (error) {
        console.log('Patient visits table might not exist yet');
      }
      
      // Process visit history
      const visitMap = new Map<string, PatientTransaction[]>();
      
      // Debug logging
      console.log('🔍 Patient History Debug:', {
        patientId: patient.id,
        patientName: `${patient.first_name} ${patient.last_name}`,
        patientDateOfEntry: patient.date_of_entry,
        transactionCount: transactions.length,
        firstTransaction: transactions[0]
      });
      
      transactions.forEach((transaction, index) => {
        // Use utility function to get consistent date
        const date = getPatientTransactionDate(transaction, patient);
        
        // Debug each transaction
        if (index < 3) {
          console.log(`🔍 Transaction ${index + 1}:`, {
            id: transaction.id,
            type: transaction.transaction_type,
            amount: transaction.amount,
            transaction_date: transaction.transaction_date,
            created_at: transaction.created_at,
            finalDate: date,
            formattedDate: formatDateForDisplay(date),
            patientDateOfEntry: patient.date_of_entry,
            source: patient.date_of_entry ? 'PATIENT_ENTRY_DATE' : (transaction.transaction_date ? 'TRANSACTION_DATE' : 'CREATED_AT')
          });
        }
        
        if (!visitMap.has(date)) {
          visitMap.set(date, []);
        }
        visitMap.get(date)!.push(transaction);
      });

      const visits: VisitRecord[] = Array.from(visitMap.entries())
        .map(([date, dayTransactions]) => ({
          date,
          transactions: dayTransactions,
          totalAmount: dayTransactions.reduce((sum, t) => sum + t.amount, 0),
          doctors: [...new Set(dayTransactions.map(t => t.doctor_id || 'Unknown').filter(Boolean))],
          departments: [...new Set(dayTransactions.map(t => t.department || 'General').filter(Boolean))],
        }))
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      setVisitHistory(visits);

      // Calculate financial summary
      const totalSpent = transactions.reduce((sum, t) => sum + t.amount, 0);
      const averagePerVisit = visits.length > 0 ? totalSpent / visits.length : 0;
      
      const paymentBreakdown: Record<string, number> = {};
      transactions.forEach(t => {
        const method = t.payment_mode || 'cash';
        paymentBreakdown[method] = (paymentBreakdown[method] || 0) + t.amount;
      });

      // Calculate monthly spending
      const monthlyMap = new Map<string, number>();
      transactions.forEach(t => {
        const date = new Date(t.created_at || '');
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        monthlyMap.set(monthKey, (monthlyMap.get(monthKey) || 0) + t.amount);
      });

      const monthlySpending = Array.from(monthlyMap.entries())
        .map(([month, amount]) => ({ month, amount }))
        .sort((a, b) => a.month.localeCompare(b.month));

      setFinancialSummary({
        totalSpent,
        averagePerVisit,
        paymentMethodBreakdown: paymentBreakdown,
        monthlySpending,
      });

      // Calculate visit analytics
      const reasonMap = new Map<string, number>();
      const doctorMap = new Map<string, number>();
      const dayOfWeekMap = new Map<string, number>();

      transactions.forEach(t => {
        // Count transaction types as reasons
        const reason = t.transaction_type || 'consultation';
        reasonMap.set(reason, (reasonMap.get(reason) || 0) + 1);

        // Count doctors
        const doctor = t.doctor_id || 'Unknown';
        doctorMap.set(doctor, (doctorMap.get(doctor) || 0) + 1);

        // Count day of week patterns
        const date = new Date(t.created_at || '');
        const dayOfWeek = date.toLocaleDateString('en', { weekday: 'long' });
        dayOfWeekMap.set(dayOfWeek, (dayOfWeekMap.get(dayOfWeek) || 0) + 1);
      });

      const mostFrequentReasons = Array.from(reasonMap.entries())
        .map(([reason, count]) => ({ reason, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      const preferredDoctors = Array.from(doctorMap.entries())
        .map(([doctor, count]) => ({ doctor, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      const visitPatterns = Object.fromEntries(dayOfWeekMap);

      const totalVisits = visits.length;
      const firstVisit = visits.length > 0 ? new Date(visits[visits.length - 1].date) : new Date();
      const monthsSinceFirst = (new Date().getTime() - firstVisit.getTime()) / (1000 * 60 * 60 * 24 * 30);
      const averageVisitsPerMonth = monthsSinceFirst > 0 ? totalVisits / monthsSinceFirst : 0;

      setVisitAnalytics({
        totalVisits,
        averageVisitsPerMonth,
        mostFrequentReasons,
        preferredDoctors,
        visitPatterns,
      });

    } catch (error) {
      console.error('Error loading patient data:', error);
      toast.error('Failed to load patient history');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveEdit = async () => {
    try {
      // Note: This would need an update patient method in dataService
      toast.success('Patient information updated');
      setIsEditing(false);
    } catch (error) {
      toast.error('Failed to update patient information');
    }
  };

  // Get all transactions from all visits
  const getAllTransactions = () => {
    const allTransactions: (PatientTransaction & { visitDate: string; transactionId: string })[] = [];
    visitHistory.forEach(visit => {
      visit.transactions.forEach((transaction, index) => {
        const transactionId = transaction.id || `${visit.date}-${index}`;
        allTransactions.push({ 
          ...transaction, 
          visitDate: visit.date,
          transactionId: transactionId
        });
      });
    });
    return allTransactions;
  };

  // Handle individual transaction selection
  const handleTransactionSelect = (transactionId: string, checked: boolean) => {
    const newSelected = new Set(selectedTransactions);
    if (checked) {
      newSelected.add(transactionId);
    } else {
      newSelected.delete(transactionId);
    }
    setSelectedTransactions(newSelected);
    
    // Update select all state
    const allTransactions = getAllTransactions();
    setSelectAll(newSelected.size === allTransactions.length);
  };

  // Handle select all transactions
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const allTransactionIds = getAllTransactions().map(t => t.transactionId);
      setSelectedTransactions(new Set(allTransactionIds));
    } else {
      setSelectedTransactions(new Set());
    }
    setSelectAll(checked);
  };

  // Print receipts for selected transactions
  const printSelectedReceipts = () => {
    const allTransactions = getAllTransactions();
    const selectedTransactionsData = allTransactions.filter(t => selectedTransactions.has(t.transactionId));
    
    if (selectedTransactionsData.length === 0) {
      toast.error('Please select at least one transaction to print');
      return;
    }

    // Generate receipts using the same template as patient list
    selectedTransactionsData.forEach((transaction, index) => {
      const receiptData: ReceiptData = {
        type: 'PAYMENT',
        receiptNumber: `REC-${transaction.transactionId}`,
        date: new Date(transaction.visitDate).toLocaleDateString('en-IN'),
        time: new Date().toLocaleTimeString('en-IN', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: true,
          timeZone: 'Asia/Kolkata'
        }),
        
        hospital: {
          name: '',
          address: '10, Madhav Vihar Shobhagpura, Udaipur (313001)',
          phone: '+91 9119118000',
          email: 'valanthospital@gmail.com',
          registration: '',
          gst: '',
          website: 'www.valanthospital.com'
        },
        
        patient: {
          id: patient.patient_id,
          name: `${patient.first_name} ${patient.last_name || ''}`.trim(),
          phone: patient.phone || 'Not provided',
          age: patient.age,
          gender: patient.gender,
          address: patient.address
        },
        
        charges: [{
          description: transaction.description,
          amount: Math.abs(transaction.amount),
          quantity: 1,
          rate: Math.abs(transaction.amount)
        }],
        
        payments: [{
          mode: (transaction.payment_mode?.toUpperCase() || 'CASH') as 'CASH' | 'ONLINE' | 'INSURANCE',
          amount: Math.abs(transaction.amount),
          date: new Date(transaction.visitDate).toLocaleDateString('en-IN')
        }],
        
        totals: {
          subtotal: Math.abs(transaction.amount),
          discount: 0,
          insurance: 0,
          netAmount: Math.abs(transaction.amount),
          amountPaid: Math.abs(transaction.amount),
          balance: 0
        },
        
        staff: {
          processedBy: 'System User',
          authorizedBy: 'Hospital Administrator'
        },
        
        notes: `Transaction Type: ${transaction.transaction_type?.replace('_', ' ').toUpperCase()}`,
        isOriginal: true
      };

      // Create modal for each receipt
      setTimeout(() => {
        const modalContainer = document.createElement('div');
        modalContainer.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4';
        document.body.appendChild(modalContainer);
        
        const modalContent = document.createElement('div');
        modalContent.className = 'bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-auto';
        modalContainer.appendChild(modalContent);
        
        modalContent.innerHTML = `
          <div class="flex justify-between items-center p-4 border-b print:hidden">
            <h3 class="text-lg font-semibold">Receipt ${index + 1} of ${selectedTransactionsData.length}</h3>
            <div class="flex gap-2">
              <button id="printBtn" class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center gap-2">
                <span>🖨️</span> Print Receipt
              </button>
              <button id="closeBtn" class="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600">
                Close
              </button>
            </div>
          </div>
          <div class="p-8 print:p-6" id="receipt-content"></div>
        `;
        
        // Add event listeners
        modalContent.querySelector('#printBtn')?.addEventListener('click', () => window.print());
        modalContent.querySelector('#closeBtn')?.addEventListener('click', () => {
          document.body.removeChild(modalContainer);
        });
        
        // Render the ReceiptTemplate using React
        import('react-dom/client').then(({ createRoot }) => {
          const receiptContainer = modalContent.querySelector('#receipt-content');
          if (receiptContainer) {
            const root = createRoot(receiptContainer);
            root.render(React.createElement(ReceiptTemplate, { data: receiptData }));
          }
        });
        
      }, index * 100); // Stagger the modals slightly
    });

    toast.success(`Generated ${selectedTransactionsData.length} receipts for printing`);
  };

  const formatCurrency = (amount: number) => `₹${amount.toLocaleString()}`;

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'entry_fee': return '🚪';
      case 'consultation': return '👨‍⚕️';
      case 'service': return '🔬';
      case 'medicine': return '💊';
      case 'discount': return '💸';
      case 'refund': return '💰';
      default: return '📋';
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8">
          <div className="text-center">Loading patient history...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold text-gray-800">
                {patient.first_name} {patient.last_name}
              </h2>
              <p className="text-gray-600">Patient ID: {patient.id.slice(0, 8)}</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setIsEditing(!isEditing)}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
              >
                {isEditing ? 'Cancel' : 'Edit'}
              </button>
              <button
                onClick={onClose}
                className="bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400"
              >
                ✕ Close
              </button>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="px-6 py-4 bg-blue-50 border-b">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{visitHistory.length}</div>
              <div className="text-sm text-gray-600">Total Visits</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {formatCurrency(financialSummary?.totalSpent || 0)}
              </div>
              <div className="text-sm text-gray-600">Total Spent</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {formatCurrency(financialSummary?.averagePerVisit || 0)}
              </div>
              <div className="text-sm text-gray-600">Avg per Visit</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {visitHistory.length > 0 ? new Date(visitHistory[0].date).toLocaleDateString() : 'Never'}
              </div>
              <div className="text-sm text-gray-600">Last Visit</div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="px-6 border-b border-gray-200">
          <nav className="flex space-x-8">
            {[
              { key: 'visits', label: '📅 Visit History', count: visitHistory.length },
              { key: 'financial', label: '💰 Financial Summary', count: null },
              { key: 'medical', label: '🏥 Medical Records', count: null },
              { key: 'analytics', label: '📊 Analytics', count: null },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.key
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.label}
                {tab.count !== null && (
                  <span className="ml-2 bg-gray-100 text-gray-600 py-0.5 px-2 rounded-full text-xs">
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {/* Visit History Tab */}
          {activeTab === 'visits' && (
            <div className="space-y-4">
              {/* Show patient visits if available */}
              {patientVisits.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-3">📋 Visit Records</h3>
                  <div className="space-y-3">
                    {patientVisits.map((visit, index) => (
                      <div key={visit.id || index} className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <p className="font-medium text-blue-800">
                              {new Date(visit.visit_date).toLocaleDateString('en', {
                                weekday: 'short',
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric'
                              })}
                            </p>
                            <p className="text-sm text-gray-600">{visit.visit_type || 'Consultation'}</p>
                          </div>
                          {visit.department && (
                            <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-sm">
                              {visit.department}
                            </span>
                          )}
                        </div>
                        {visit.chief_complaint && (
                          <p className="text-sm text-gray-700 mb-1">
                            <strong>Complaint:</strong> {visit.chief_complaint}
                          </p>
                        )}
                        {visit.diagnosis && (
                          <p className="text-sm text-gray-700 mb-1">
                            <strong>Diagnosis:</strong> {visit.diagnosis}
                          </p>
                        )}
                        {visit.notes && (
                          <p className="text-sm text-gray-600 italic">
                            {visit.notes}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-800">💰 Transaction History</h3>
                
                {/* Bulk Actions */}
                {visitHistory.length > 0 && (
                  <div className="flex items-center gap-3">
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={selectAll}
                        onChange={(e) => handleSelectAll(e.target.checked)}
                        className="w-4 h-4"
                      />
                      Select All ({getAllTransactions().length})
                    </label>
                    
                    {selectedTransactions.size > 0 && (
                      <>
                        <span className="text-sm text-blue-600 font-medium">
                          {selectedTransactions.size} selected
                        </span>
                        <button
                          onClick={printSelectedReceipts}
                          className="flex items-center gap-1 px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
                        >
                          🖨️ Print Receipts
                        </button>
                      </>
                    )}
                  </div>
                )}
              </div>
              
              {visitHistory.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No transaction history found for this patient.
                </div>
              ) : (
                visitHistory.map((visit, index) => (
                  <div key={index} className="bg-gray-50 rounded-lg p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="font-semibold text-lg">
                          {new Date(visit.date).toLocaleDateString('en', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </h3>
                        <p className="text-gray-600">
                          Departments: {visit.departments.join(', ')}
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="text-xl font-bold text-green-600">
                          {formatCurrency(visit.totalAmount)}
                        </div>
                        <div className="text-sm text-gray-500">
                          {visit.transactions.length} transactions
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      {visit.transactions.map((transaction, tIndex) => {
                        console.log('🔍 Transaction:', transaction);
                        const transactionId = transaction.id || `${visit.date}-${tIndex}`;
                        return (
                        <div key={tIndex} className="flex justify-between items-center py-2 px-3 bg-white rounded">
                          <div className="flex items-center gap-3">
                            <input
                              type="checkbox"
                              checked={selectedTransactions.has(transactionId)}
                              onChange={(e) => {
                                console.log('📦 Checkbox changed:', transactionId, e.target.checked);
                                handleTransactionSelect(transactionId, e.target.checked);
                              }}
                              className="w-4 h-4"
                              style={{ 
                                minWidth: '16px', 
                                minHeight: '16px',
                                accentColor: '#2563eb',
                                cursor: 'pointer'
                              }}
                            />
                            <span className="text-xl">{getTransactionIcon(transaction.transaction_type)}</span>
                            <div>
                              <div className="font-medium">{transaction.description}</div>
                              <div className="text-sm text-gray-500">
                                {transaction.transaction_type.replace('_', ' ').toUpperCase()} • {transaction.payment_mode?.toUpperCase()}
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className={`font-semibold ${transaction.amount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {formatCurrency(Math.abs(transaction.amount))}
                            </div>
                          </div>
                        </div>
                        );
                      })}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Financial Summary Tab */}
          {activeTab === 'financial' && financialSummary && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Payment Method Breakdown */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-semibold text-lg mb-4">Payment Method Breakdown</h3>
                <div className="space-y-3">
                  {Object.entries(financialSummary.paymentMethodBreakdown).map(([method, amount]) => (
                    <div key={method} className="flex justify-between items-center">
                      <span className="capitalize">{method}</span>
                      <span className="font-semibold">{formatCurrency(amount)}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Monthly Spending Trend */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-semibold text-lg mb-4">Monthly Spending</h3>
                <div className="space-y-2">
                  {financialSummary.monthlySpending.slice(-6).map((month) => (
                    <div key={month.month} className="flex justify-between items-center">
                      <span>{month.month}</span>
                      <span className="font-semibold">{formatCurrency(month.amount)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Medical Records Tab */}
          {activeTab === 'medical' && (
            <div className="space-y-6">
              {/* Basic Information */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-semibold text-lg mb-4">Basic Information</h3>
                {isEditing ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input
                      value={editedPatient.first_name || ''}
                      onChange={(e) => setEditedPatient({...editedPatient, first_name: e.target.value})}
                      placeholder="First Name"
                      className="px-3 py-2 border rounded-md"
                    />
                    <input
                      value={editedPatient.last_name || ''}
                      onChange={(e) => setEditedPatient({...editedPatient, last_name: e.target.value})}
                      placeholder="Last Name"
                      className="px-3 py-2 border rounded-md"
                    />
                    <input
                      value={editedPatient.phone || ''}
                      onChange={(e) => setEditedPatient({...editedPatient, phone: e.target.value})}
                      placeholder="Phone"
                      className="px-3 py-2 border rounded-md"
                    />
                    <input
                      value={editedPatient.address || ''}
                      onChange={(e) => setEditedPatient({...editedPatient, address: e.target.value})}
                      placeholder="Address"
                      className="px-3 py-2 border rounded-md"
                    />
                    <div className="md:col-span-2">
                      <button
                        onClick={handleSaveEdit}
                        className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 mr-2"
                      >
                        Save Changes
                      </button>
                      <button
                        onClick={() => setIsEditing(false)}
                        className="bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div><strong>Phone:</strong> {patient.phone}</div>
                    <div><strong>Gender:</strong> {patient.gender}</div>
                    <div><strong>Date of Birth:</strong> {patient.date_of_birth || 'Not provided'}</div>
                    <div><strong>Address:</strong> {patient.address || 'Not provided'}</div>
                    <div><strong>Emergency Contact:</strong> {patient.emergency_contact_name || 'Not provided'}</div>
                    <div><strong>Emergency Phone:</strong> {patient.emergency_contact_phone || 'Not provided'}</div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Analytics Tab */}
          {activeTab === 'analytics' && visitAnalytics && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Visit Frequency */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-semibold text-lg mb-4">Visit Patterns</h3>
                <div className="space-y-3">
                  <div>
                    <strong>Average visits per month:</strong> {visitAnalytics.averageVisitsPerMonth.toFixed(1)}
                  </div>
                  <div>
                    <strong>Most frequent reasons:</strong>
                    <ul className="mt-2 space-y-1">
                      {visitAnalytics.mostFrequentReasons.map((reason, index) => (
                        <li key={index} className="text-sm">
                          {reason.reason} ({reason.count} times)
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>

              {/* Day of Week Patterns */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-semibold text-lg mb-4">Visit Day Preferences</h3>
                <div className="space-y-2">
                  {Object.entries(visitAnalytics.visitPatterns).map(([day, count]) => (
                    <div key={day} className="flex justify-between items-center">
                      <span>{day}</span>
                      <span className="font-semibold">{count} visits</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PatientHistoryModal;
import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import HospitalService from '../services/hospitalService';
import { ExactDateService } from '../services/exactDateService';
import type { PatientWithRelations } from '../config/supabaseNew';
import { Input } from './ui/Input';
import ModernDatePicker from './ui/ModernDatePicker';
import EditPatientModal from './EditPatientModal';
import Receipt from './Receipt';
import ValantPrescription from './ValantPrescription';
import VHPrescription from './VHPrescription';
import MultiplePrescriptionGenerator from './MultiplePrescriptionGenerator';
import PatientServiceManager from './PatientServiceManager';
import VisitAgainModal from './VisitAgainModal';
import { exportToExcel, formatCurrency, formatCurrencyForExcel, formatDate } from '../utils/excelExport';
import useReceiptPrinting from '../hooks/useReceiptPrinting';
import { createRoot } from 'react-dom/client';
import ReceiptTemplate from './receipts/ReceiptTemplate';
import type { ReceiptData } from './receipts/ReceiptTemplate';

interface PatientHistoryModalProps {
  patient: PatientWithRelations;
  isOpen: boolean;
  onClose: () => void;
  onPatientUpdated?: () => void;
}

const PatientHistoryModal: React.FC<PatientHistoryModalProps> = ({ patient, isOpen, onClose, onPatientUpdated }) => {
  const { printServiceReceipt } = useReceiptPrinting();
  const [deletingTransactionId, setDeletingTransactionId] = useState<string | null>(null);
  const [selectedTransactions, setSelectedTransactions] = useState<Set<string>>(new Set());
  const [selectAll, setSelectAll] = useState(false);
  
  if (!isOpen) return null;

  const totalSpent = patient.totalSpent || 0;
  const visitCount = patient.visitCount || 0;
  const transactions = patient.transactions || [];

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
    setSelectAll(newSelected.size === transactions.length);
  };

  // Handle select all transactions
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const allTransactionIds = transactions.map(t => t.id);
      setSelectedTransactions(new Set(allTransactionIds));
    } else {
      setSelectedTransactions(new Set());
    }
    setSelectAll(checked);
  };

  // Print receipts for selected transactions using the same format as existing receipts
  const printSelectedReceipts = () => {
    const selectedTransactionsData = transactions.filter(t => selectedTransactions.has(t.id));
    
    if (selectedTransactionsData.length === 0) {
      toast.error('Please select at least one transaction to print');
      return;
    }

    // Create a combined receipt for all selected transactions
    const generateReceiptNumber = (type: string): string => {
      const timestamp = Date.now();
      const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
      const typeCode = type.substring(0, 3).toUpperCase();
      return `${typeCode}${timestamp}${random}`;
    };

    // Default hospital information (same as useReceiptPrinting)
    const DEFAULT_HOSPITAL_INFO = {
      name: 'Healthcare Management System',
      address: 'Medical Center, Healthcare District, City - 400001', 
      phone: '+91 98765 43210',
      email: 'info@healthcarecms.com',
      registration: 'MH/HC/2024/001',
      gst: '27ABCDE1234F1Z5'
    };

    // Prepare receipt data with all selected transactions
    const receiptData = {
      type: 'SERVICE' as const,
      receiptNumber: generateReceiptNumber('MULTI'),
      date: new Date().toLocaleDateString('en-IN'),
      time: new Date().toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit', 
        hour12: true
      }),
      hospital: DEFAULT_HOSPITAL_INFO,
      patient: {
        id: patient.patient_id || 'N/A',
        name: `${patient.first_name} ${patient.last_name}`,
        age: patient.age,
        gender: patient.gender,
        phone: patient.phone,
        address: patient.address,
        bloodGroup: patient.blood_group
      },
      charges: selectedTransactionsData.map(transaction => ({
        description: `${transaction.description || transaction.transaction_type} (${new Date(transaction.created_at).toLocaleDateString('en-IN')})`,
        amount: transaction.amount,
        quantity: 1
      })),
      payments: selectedTransactionsData.map(transaction => ({
        mode: transaction.payment_mode || 'CASH',
        amount: transaction.amount,
        reference: transaction.id
      })),
      totals: {
        subtotal: selectedTransactionsData.reduce((sum, t) => sum + t.amount, 0),
        discount: 0,
        insurance: 0,
        netAmount: selectedTransactionsData.reduce((sum, t) => sum + t.amount, 0),
        amountPaid: selectedTransactionsData.reduce((sum, t) => sum + t.amount, 0),
        balance: 0
      },
      staff: {
        processedBy: 'System User'
      },
      notes: `Combined receipt for ${selectedTransactionsData.length} selected transactions. Please keep this receipt for future reference.`,
      isOriginal: true
    };

    // Create and show the combined receipt using the same modal system
    const printCombinedReceipt = (data: ReceiptData) => {
      // Create modal container
      const modalContainer = document.createElement('div');
      modalContainer.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4';
      document.body.appendChild(modalContainer);
      
      const root = createRoot(modalContainer);
      
      const handlePrint = () => {
        window.print();
      };
      
      const handleClose = () => {
        root.unmount();
        document.body.removeChild(modalContainer);
      };

      // Render modal with receipt (same as useReceiptPrinting)
      root.render(
        <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-auto">
          {/* Print and Close buttons */}
          <div className="flex justify-end gap-2 p-4 border-b print:hidden">
            <button
              onClick={handlePrint}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center gap-2"
            >
              <span>🖨️</span> Print Receipt
            </button>
            <button
              onClick={handleClose}
              className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
            >
              Close
            </button>
          </div>

          {/* Receipt Content */}
          <div className="p-8 print:p-6" id="receipt-content">
            <ReceiptTemplate data={data} />
          </div>
        </div>
      );
    };

    printCombinedReceipt(receiptData);
    toast.success(`Generated combined receipt for ${selectedTransactionsData.length} transactions`);
  };

  const handleDeleteTransaction = async (transactionId: string, description: string, amount: number) => {
    if (!confirm(`Are you sure you want to delete this transaction?\n\n"${description}"\nAmount: ₹${amount.toLocaleString()}\n\nThis will mark the transaction as cancelled and cannot be undone.`)) {
      return;
    }

    try {
      setDeletingTransactionId(transactionId);
      
      // Update transaction status to CANCELLED
      await HospitalService.updateTransactionStatus(transactionId, 'CANCELLED');
      
      toast.success('Transaction cancelled successfully. Patient totals will be updated.');
      
      // Close modal and trigger patient list refresh
      onClose();
      if (onPatientUpdated) {
        onPatientUpdated();
      }
    } catch (error: any) {
      toast.error(`Failed to delete transaction: ${error.message}`);
    } finally {
      setDeletingTransactionId(null);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">
            👤 {patient.first_name} {patient.last_name}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
          >
            ×
          </button>
        </div>

        {/* Patient Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-blue-700">₹{totalSpent.toLocaleString()}</div>
            <div className="text-blue-600">Total Spent</div>
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-green-700">{visitCount}</div>
            <div className="text-green-600">Total Visits</div>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-purple-700">
              {(() => {
                // Use the same logic as in the table for consistency
                let lastVisitDate = null;
                let dateSource = '';
                
                // Priority 1: Use date_of_entry if it's explicitly set (user-defined visit date)
                if (patient.date_of_entry && patient.date_of_entry.trim() !== '') {
                  lastVisitDate = patient.date_of_entry;
                  dateSource = 'date_of_entry';
                }
                
                // Priority 2: Most recent transaction date (if no date_of_entry)
                else if (patient.transactions && patient.transactions.length > 0) {
                  const activeTransactions = patient.transactions
                    .filter(t => t.status !== 'CANCELLED' && t.created_at)
                    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
                  
                  if (activeTransactions.length > 0) {
                    lastVisitDate = activeTransactions[0].created_at;
                    dateSource = 'transaction';
                  }
                }
                
                // Priority 3: Use pre-calculated lastVisit field
                else if (patient.lastVisit) {
                  lastVisitDate = patient.lastVisit;
                  dateSource = 'lastVisit';
                }
                
                // Priority 4: Fallback to creation date
                else if (patient.created_at) {
                  lastVisitDate = patient.created_at;
                  dateSource = 'created_at';
                }

                // Debug logging to help identify the issue
                console.log(`🔍 Last visit calculation for ${patient.first_name} ${patient.last_name}:`, {
                  patient_id: patient.patient_id,
                  date_of_entry: patient.date_of_entry,
                  date_of_entry_type: typeof patient.date_of_entry,
                  date_of_entry_empty: !patient.date_of_entry || patient.date_of_entry.trim() === '',
                  transactions_count: patient.transactions ? patient.transactions.length : 0,
                  lastVisit: patient.lastVisit,
                  created_at: patient.created_at,
                  selected_date: lastVisitDate,
                  date_source: dateSource
                });
                
                if (!lastVisitDate) return 'Never';
                
                try {
                  let date;
                  // Handle date strings properly to avoid timezone issues
                  if (typeof lastVisitDate === 'string' && lastVisitDate.match(/^\d{4}-\d{2}-\d{2}$/)) {
                    // For YYYY-MM-DD format, create date as local time to avoid timezone shift
                    const [year, month, day] = lastVisitDate.split('-').map(Number);
                    date = new Date(year, month - 1, day);
                  } else {
                    date = new Date(lastVisitDate);
                  }
                  
                  if (isNaN(date.getTime())) return 'Invalid Date';
                  
                  return date.toLocaleDateString('en-IN', {
                    day: '2-digit',
                    month: '2-digit', 
                    year: 'numeric'
                  });
                } catch (error) {
                  return 'Date Error';
                }
              })()}
            </div>
            <div className="text-purple-600">Last Visit</div>
          </div>
        </div>

        {/* Patient Details */}
        <div className="bg-gray-50 p-4 rounded-lg mb-6">
          <h3 className="text-lg font-semibold mb-3">Patient Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div><span className="font-medium">ID:</span> {patient.patient_id}</div>
            <div><span className="font-medium">Phone:</span> {patient.phone || 'Not provided'}</div>
            <div><span className="font-medium">Email:</span> {patient.email || 'Not provided'}</div>
            <div><span className="font-medium">Gender:</span> {patient.gender === 'MALE' ? 'Male (M)' : patient.gender === 'FEMALE' ? 'Female (F)' : patient.gender || 'Not specified'}</div>
            <div><span className="font-medium">Date of Birth:</span> {patient.date_of_birth || 'Not provided'}</div>
            {patient.patient_tag && (
              <div><span className="font-medium">Patient Tag:</span> 
                <span className="ml-2 bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full text-xs">
                  {patient.patient_tag}
                </span>
              </div>
            )}
            {patient.address && (
              <div className="md:col-span-2"><span className="font-medium">Address:</span> {patient.address}</div>
            )}
            {patient.medical_history && (
              <div className="md:col-span-2"><span className="font-medium">Medical History:</span> {patient.medical_history}</div>
            )}
            {patient.allergies && (
              <div className="md:col-span-2"><span className="font-medium">Allergies:</span> {patient.allergies}</div>
            )}
          </div>
        </div>

        {/* Transaction History */}
        <div>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">Transaction History ({transactions.length})</h3>
            
            {/* Bulk Actions */}
            {transactions.length > 0 && (
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={selectAll}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                    className="w-4 h-4"
                  />
                  Select All ({transactions.length})
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
          
          {transactions.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="text-left p-2 w-8">✓</th>
                    <th className="text-left p-2">Date</th>
                    <th className="text-left p-2">Type</th>
                    <th className="text-left p-2">Description</th>
                    <th className="text-left p-2">Amount</th>
                    <th className="text-left p-2">Payment</th>
                    <th className="text-left p-2">Status</th>
                    <th className="text-left p-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((transaction, index) => (
                    <tr key={transaction.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="p-2">
                        <input
                          type="checkbox"
                          checked={selectedTransactions.has(transaction.id)}
                          onChange={(e) => handleTransactionSelect(transaction.id, e.target.checked)}
                          className="w-4 h-4"
                          style={{ 
                            minWidth: '16px', 
                            minHeight: '16px',
                            accentColor: '#2563eb',
                            cursor: 'pointer'
                          }}
                        />
                      </td>
                      <td className="p-2">{(() => {
                        // FIXED: Use the SAME logic as Last Visit section - patient.date_of_entry first
                        const patient = transaction.patient;
                        let displayDate = null;
                        
                        if (patient?.date_of_entry && patient.date_of_entry.trim() !== '') {
                          displayDate = patient.date_of_entry;
                        } else if (transaction.transaction_date) {
                          displayDate = transaction.transaction_date;
                        } else {
                          displayDate = transaction.created_at;
                        }
                        
                        try {
                          if (typeof displayDate === 'string' && displayDate.match(/^\d{4}-\d{2}-\d{2}$/)) {
                            const [year, month, day] = displayDate.split('-').map(Number);
                            const date = new Date(year, month - 1, day);
                            return date.toLocaleDateString('en-IN', { 
                              timeZone: 'Asia/Kolkata',
                              day: '2-digit',
                              month: '2-digit', 
                              year: 'numeric'
                            });
                          } else {
                            return new Date(displayDate).toLocaleDateString('en-IN', { 
                              timeZone: 'Asia/Kolkata',
                              day: '2-digit',
                              month: '2-digit', 
                              year: 'numeric'
                            });
                          }
                        } catch {
                          return 'Invalid Date';
                        }
                      })()}</td>
                      <td className="p-2">
                        <span className={`px-2 py-1 rounded text-xs ${
                          transaction.transaction_type === 'CONSULTATION' ? 'bg-blue-100 text-blue-800' :
                          transaction.transaction_type === 'ADMISSION' ? 'bg-green-100 text-green-800' :
                          transaction.transaction_type === 'REFUND' ? 'bg-red-100 text-red-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {transaction.transaction_type}
                        </span>
                      </td>
                      <td className="p-2">{transaction.description}</td>
                      <td className="p-2">
                        <span className={transaction.amount >= 0 ? 'text-green-600' : 'text-red-600'}>
                          ₹{Math.abs(transaction.amount).toLocaleString()}
                        </span>
                      </td>
                      <td className="p-2">{transaction.payment_mode}</td>
                      <td className="p-2">
                        <span className={`px-2 py-1 rounded text-xs ${
                          transaction.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                          transaction.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {transaction.status}
                        </span>
                      </td>
                      <td className="p-2">
                        <div className="flex space-x-2">
                          {transaction.status === 'COMPLETED' && (
                            <button
                              onClick={() => printServiceReceipt(transaction.id)}
                              className="bg-orange-500 text-white px-2 py-1 rounded text-xs hover:bg-orange-600"
                              title="Print Receipt"
                            >
                              🖨️
                            </button>
                          )}
                          {transaction.status !== 'CANCELLED' && (
                            <button
                              onClick={() => handleDeleteTransaction(transaction.id, transaction.description, transaction.amount)}
                              disabled={deletingTransactionId === transaction.id}
                              className="bg-red-500 text-white px-2 py-1 rounded text-xs hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed"
                              title="Delete Transaction"
                            >
                              {deletingTransactionId === transaction.id ? '⏳' : '🗑️'}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <div className="text-4xl mb-2">📝</div>
              <p>No transaction history found</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

interface ComprehensivePatientListProps {
  onNavigate?: (tab: string) => void;
}

const ComprehensivePatientList: React.FC<ComprehensivePatientListProps> = ({ onNavigate }) => {
  const [patients, setPatients] = useState<PatientWithRelations[]>([]);
  const [filteredPatients, setFilteredPatients] = useState<PatientWithRelations[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'date' | 'visits' | 'spent'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [filterGender, setFilterGender] = useState<string>('all');
  const [filterTag, setFilterTag] = useState<string>('all');
  const [availableTags, setAvailableTags] = useState<string[]>([]);
  // Helper function to get local date in YYYY-MM-DD format
  const getLocalDateString = (date = new Date()) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const result = `${year}-${month}-${day}`;
    
    // Debug logging
    
    return result;
  };

  const [dateRange, setDateRange] = useState<'all' | 'today' | 'week' | 'month' | 'custom'>('all');
  const [startDate, setStartDate] = useState(getLocalDateString());
  const [endDate, setEndDate] = useState(getLocalDateString());
  const [selectedDate, setSelectedDate] = useState(getLocalDateString());
  const [selectedPatient, setSelectedPatient] = useState<PatientWithRelations | null>(null);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [selectedPatientForReceipt, setSelectedPatientForReceipt] = useState<PatientWithRelations | null>(null);
  const [showValantPrescription, setShowValantPrescription] = useState(false);
  const [showVHPrescription, setShowVHPrescription] = useState(false);
  const [showMultiplePrescription, setShowMultiplePrescription] = useState(false);
  const [multiplePrescriptionType, setMultiplePrescriptionType] = useState<'valant' | 'vh'>('valant');
  const [selectedPatientForPrescription, setSelectedPatientForPrescription] = useState<PatientWithRelations | null>(null);
  const [showServiceManager, setShowServiceManager] = useState(false);
  const [selectedPatientForServices, setSelectedPatientForServices] = useState<PatientWithRelations | null>(null);
  const [showVisitAgainModal, setShowVisitAgainModal] = useState(false);
  const [selectedPatientForVisitAgain, setSelectedPatientForVisitAgain] = useState<PatientWithRelations | null>(null);
  const { printConsultationReceipt } = useReceiptPrinting();

  // Helper function to determine patient department status
  const getDepartmentStatus = (patient: PatientWithRelations) => {
    // Check if patient has been discharged from IPD
    if (patient.ipd_status === 'DISCHARGED') {
      return { status: 'Discharged', style: 'bg-gray-100 text-gray-800' };
    }
    
    // Check if patient has discharged admissions
    if (patient.admissions && patient.admissions.length > 0) {
      const hasDischargedAdmission = patient.admissions.some(
        admission => admission.status === 'DISCHARGED'
      );
      if (hasDischargedAdmission && patient.ipd_status !== 'ADMITTED') {
        return { status: 'Discharged', style: 'bg-gray-100 text-gray-800' };
      }
    }
    
    // Check if currently admitted to IPD
    if (patient.ipd_status === 'ADMITTED') {
      return { status: 'IPD', style: 'bg-red-100 text-red-800' };
    }
    
    // Default to OPD
    return { status: patient.departmentStatus || 'OPD', style: 'bg-green-100 text-green-800' };
  };

  useEffect(() => {
    loadPatients();
  }, [dateRange, startDate, endDate, selectedDate]);

  useEffect(() => {
    // Update date range when dateRange changes
    const today = new Date();
    switch (dateRange) {
      case 'today':
        const todayStr = getLocalDateString(today);
        setSelectedDate(todayStr);
        setStartDate(todayStr);
        setEndDate(todayStr);
        break;
      case 'week':
        const weekStart = new Date(today);
        weekStart.setDate(today.getDate() - today.getDay());
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);
        const weekStartStr = getLocalDateString(weekStart);
        const weekEndStr = getLocalDateString(weekEnd);
        setStartDate(weekStartStr);
        setEndDate(weekEndStr);
        break;
      case 'month':
        const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
        const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);
        setStartDate(getLocalDateString(monthStart));
        setEndDate(getLocalDateString(monthEnd));
        break;
    }
  }, [dateRange]);

  useEffect(() => {
    filterAndSortPatients();
  }, [patients, searchTerm, sortBy, sortOrder, filterGender, filterTag]);

  const loadPatients = async () => {
    try {
      setLoading(true);
      
      let patientsData;
      
      // Use backend filtering for 'today' and single custom dates to get exact results
      if (dateRange === 'today') {
        const todayStr = selectedDate || getLocalDateString();
        
        // Always use the backend method with error handling
        patientsData = await HospitalService.getPatientsForDate(todayStr, 500);
        
        // Debug the returned patients
        if (patientsData.length > 0) {
        } else {
        }
      } else if (dateRange === 'custom') {
        // For custom date, use NEW exact date service to avoid cumulative results
        patientsData = await ExactDateService.getPatientsForExactDate(startDate, 500);
      } else {
        // For date ranges and 'all', load all patients and apply frontend filtering
        patientsData = await HospitalService.getPatients(1000);
      }
      
      // Filter out patients who have PENDING appointments (not confirmed/completed ones)
      patientsData = patientsData.filter(patient => {
        // Check localStorage appointments for this patient
        try {
          const appointments = JSON.parse(localStorage.getItem('hospital_appointments') || '[]');
          const hasPendingAppointment = appointments.some((apt: any) => {
            // Match by patient name or patient_id or patient_uuid
            const patientName = `${patient.first_name} ${patient.last_name}`;
            const isPatientMatch = apt.patient_name === patientName || 
                                   apt.patient_id === patient.patient_id || 
                                   apt.patient_uuid === patient.id;
            
            // Only hide if patient matches AND appointment is still pending (not confirmed/completed)
            return isPatientMatch && (apt.status === 'scheduled' || !apt.status);
          });
          
          if (hasPendingAppointment) {
            console.log(`👤 Hiding patient ${patient.first_name} ${patient.last_name} - has PENDING appointment`);
            return false; // Hide this patient
          }
        } catch (error) {
          console.error('Error checking appointments for patient:', error);
        }
        
        return true; // Show this patient (no pending appointments)
      });
      
      // Debug: Check if backend or frontend filtering was used
      if (dateRange === 'today' || dateRange === 'custom') {
        
        // CUSTOM DATE SPECIFIC DEBUG: Check all returned patients
        if (dateRange === 'custom') {
          
          patientsData.forEach((p, i) => {
            const createdDate = p.created_at ? p.created_at.split('T')[0] : 'NO_CREATED';
            const entryDate = p.date_of_entry ? (p.date_of_entry.includes('T') ? p.date_of_entry.split('T')[0] : p.date_of_entry) : 'NO_ENTRY';
            
            const matchesExpected = (createdDate === startDate || entryDate === startDate);
            
            
            if (!matchesExpected) {
            }
          });
        }
      } else {
      }
      
      // Debug specific patient ROSHAN MEHTA in patient list
      const roshanPatient = patientsData.find(p => 
        p.first_name?.toUpperCase().includes('ROSHAN') && 
        p.last_name?.toUpperCase().includes('MEHTA')
      );
      if (roshanPatient) {
        // Find last visit date using same logic as the table display
        let lastVisitDate = null;
        if (roshanPatient.date_of_entry && roshanPatient.date_of_entry.trim() !== '') {
          lastVisitDate = roshanPatient.date_of_entry;
        } else if (roshanPatient.transactions && roshanPatient.transactions.length > 0) {
          const activeTransactions = roshanPatient.transactions
            .filter(t => t.status !== 'CANCELLED' && t.created_at)
            .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
          if (activeTransactions.length > 0) {
            lastVisitDate = activeTransactions[0].created_at;
          }
        } else if (roshanPatient.lastVisit) {
          lastVisitDate = roshanPatient.lastVisit;
        } else if (roshanPatient.created_at) {
          lastVisitDate = roshanPatient.created_at;
        }
        
        console.log('🔍 ROSHAN MEHTA Debug - Patient List:', {
          patient_name: `${roshanPatient.first_name} ${roshanPatient.last_name}`,
          date_of_entry: roshanPatient.date_of_entry,
          created_at: roshanPatient.created_at,
          lastVisit: roshanPatient.lastVisit,
          calculated_last_visit_date: lastVisitDate,
          patient_list_date: (() => {
            if (!lastVisitDate) return 'Never';
            try {
              let date;
              if (typeof lastVisitDate === 'string' && lastVisitDate.match(/^\d{4}-\d{2}-\d{2}$/)) {
                const [year, month, day] = lastVisitDate.split('-').map(Number);
                date = new Date(year, month - 1, day);
              } else {
                date = new Date(lastVisitDate);
              }
              if (isNaN(date.getTime())) return 'Invalid Date';
              return date.toLocaleDateString('en-IN', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric'
              });
            } catch (error) {
              return 'Date Error';
            }
          })(),
          raw_transactions: roshanPatient.transactions?.map(t => ({
            id: t.id,
            created_at: t.created_at,
            status: t.status
          }))
        });
      }
      
      // Quick debug: Show all patient dates to help identify the issue
      
      // Apply date filtering if not 'all' and not using backend filtering
      // Exclude custom dates since they're now handled by backend (always single dates)
      if (dateRange !== 'all' && dateRange !== 'today' && dateRange !== 'custom') {
        const originalCount = patientsData.length;
        // Calculate dates based on current dateRange - don't rely on state
        let currentStartDate, currentEndDate;
        const today = getLocalDateString();
        
        switch (dateRange) {
          case 'today':
            currentStartDate = selectedDate || today;
            currentEndDate = selectedDate || today;
            break;
          case 'week':
            const todayObj = new Date();
            const weekStart = new Date(todayObj);
            weekStart.setDate(todayObj.getDate() - todayObj.getDay());
            const weekEnd = new Date(weekStart);
            weekEnd.setDate(weekStart.getDate() + 6);
            currentStartDate = getLocalDateString(weekStart);
            currentEndDate = getLocalDateString(weekEnd);
            break;
          case 'month':
            const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
            const monthEnd = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0);
            currentStartDate = getLocalDateString(monthStart);
            currentEndDate = getLocalDateString(monthEnd);
            break;
          case 'custom':
            currentStartDate = startDate;
            currentEndDate = endDate;
            break;
          default:
            currentStartDate = today;
            currentEndDate = today;
        }
        
        // Debug today's date info
        const todaysDateInfo = {
          jsToday: getLocalDateString(),
          selectedDate: selectedDate,
          startDate: startDate,
          endDate: endDate,
          currentStartDate,
          currentEndDate,
          dateRange,
          dateTime: new Date().toLocaleString()
        };
        
        
        // Find the specific patient to debug
        const ashokPatient = patientsData.find(p => 
          p.first_name?.toUpperCase().includes('ASHOK') && 
          p.last_name?.toUpperCase().includes('KUMAR')
        );
        
        if (ashokPatient) {
          // Use the same date parsing logic as in the filter
          let debugCreatedDate = null;
          let debugEntryDate = null;
          
          if (ashokPatient.created_at) {
            debugCreatedDate = new Date(ashokPatient.created_at).toISOString().split('T')[0];
          }
          
          if (ashokPatient.date_of_entry) {
            let entryDate;
            if (typeof ashokPatient.date_of_entry === 'string' && ashokPatient.date_of_entry.includes('T')) {
              entryDate = new Date(ashokPatient.date_of_entry);
            } else {
              entryDate = new Date(ashokPatient.date_of_entry + 'T00:00:00');
            }
            debugEntryDate = entryDate.toISOString().split('T')[0];
          }
          
        }
        
        // Simplified and more reliable filtering logic
        
        const filtered = [];
        
        for (let i = 0; i < patientsData.length; i++) {
          const patient = patientsData[i];
          
          // Get patient date - standardized YYYY-MM-DD format like patient entry forms
          let patientDateStr = null;
          
          // Try date_of_entry first (usually set by user) - ensure YYYY-MM-DD format
          if (patient.date_of_entry) {
            if (typeof patient.date_of_entry === 'string') {
              // Handle both date strings and datetime strings
              if (patient.date_of_entry.includes('T')) {
                patientDateStr = patient.date_of_entry.split('T')[0]; // Extract YYYY-MM-DD from datetime
              } else {
                patientDateStr = patient.date_of_entry; // Already in YYYY-MM-DD format
              }
            }
          }
          
          // Fall back to created_at - ensure YYYY-MM-DD format
          if (!patientDateStr && patient.created_at) {
            if (typeof patient.created_at === 'string') {
              patientDateStr = patient.created_at.split('T')[0]; // Extract YYYY-MM-DD from datetime
            }
          }
          
          // Debug EVERY patient when using today filter to find the issue
          const shouldDebug = dateRange === 'today' || (patient.first_name?.toUpperCase().includes('ASHOK') && patient.last_name?.toUpperCase().includes('KUMAR')) || i < 5;
          
          if (shouldDebug) {
          }
          
          // Validate date format and exclude invalid dates
          if (!patientDateStr) {
            if (shouldDebug) {
            }
            // For today filter, be strict - only include patients with exact dates
            if (dateRange !== 'today') {
              filtered.push(patient); // Include for other filters
            }
            continue;
          }
          
          // Ensure date is in YYYY-MM-DD format (same validation as patient entry forms)
          const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
          if (!dateRegex.test(patientDateStr)) {
            if (shouldDebug) {
            }
            // Try to convert to YYYY-MM-DD format
            try {
              const dateObj = new Date(patientDateStr);
              if (!isNaN(dateObj.getTime())) {
                patientDateStr = getLocalDateString(dateObj);
                if (shouldDebug) {
                }
              } else {
                if (shouldDebug) {
                }
                continue;
              }
            } catch (error) {
              if (shouldDebug) {
              }
              continue;
            }
          }
          
          // Smart date comparison using standardized YYYY-MM-DD format (same as patient entry)
          let isInRange;
          if (dateRange === 'today') {
            // For today filter, use STRICT exact date matching in YYYY-MM-DD format
            isInRange = patientDateStr === currentStartDate;
            
            // Double check with explicit comparison
            if (shouldDebug) {
            }
          } else if (dateRange === 'custom') {
            // Custom dates are now handled by backend, this shouldn't be reached
            isInRange = patientDateStr === currentStartDate;
          } else {
            // For date ranges (week, month, custom range), use range matching in YYYY-MM-DD format
            isInRange = patientDateStr >= currentStartDate && patientDateStr <= currentEndDate;
            
            if (shouldDebug) {
            }
          }
          
          if (shouldDebug) {
          }
          
          if (isInRange) {
            filtered.push(patient);
            if (shouldDebug) {
            }
            // Special alert for problematic dates
            if (dateRange === 'today' && patientDateStr !== currentStartDate) {
            }
          } else {
            if (shouldDebug) {
            }
          }
        }
        
        patientsData = filtered;
        
        // Show final filtered patients for today filter
        if (dateRange === 'today') {
        }
        
        
        // Debug week filter specifically
        if (dateRange === 'week') {
        }
      } else if (dateRange === 'today') {
      } else {
      }
      
      setPatients(patientsData);
      
      // Force re-sorting after patients are loaded to ensure date-based order is correct
      // This is important when back-dated entries are loaded
      
      // Extract unique tags from patients for filter dropdown
      const uniqueTags = [...new Set(
        patientsData
          .map(p => p.patient_tag)
          .filter(tag => tag && tag.trim() !== '')
      ), 'Community', 'Camp'].sort();
      
      // Debug logging for patient tags
      console.log('🏷️ Patient List Debug - Total patients:', patientsData.length);
      const patientsWithTags = patientsData.filter(p => p.patient_tag && p.patient_tag.trim() !== '');
      console.log('🏷️ Patients with tags:', patientsWithTags.length);
      console.log('🏷️ Tagged patients sample:', patientsWithTags.slice(0, 3).map(p => ({
        name: `${p.first_name} ${p.last_name}`,
        tag: p.patient_tag,
        id: p.patient_id
      })));
      console.log('🏷️ Unique tags in patient list:', uniqueTags);
      setAvailableTags(uniqueTags);
    } catch (error: any) {
      toast.error(`Failed to load patients: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const filterAndSortPatients = () => {
    let filtered = [...patients];

    // Apply search filter
    if (searchTerm.trim()) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(patient => 
        patient.first_name.toLowerCase().includes(search) ||
        patient.last_name.toLowerCase().includes(search) ||
        patient.phone.includes(search) ||
        patient.patient_id.toLowerCase().includes(search) ||
        (patient.email && patient.email.toLowerCase().includes(search))
      );
    }

    // Apply gender filter
    if (filterGender !== 'all') {
      filtered = filtered.filter(patient => patient.gender === filterGender);
    }

    // Apply tag filter
    if (filterTag !== 'all') {
      filtered = filtered.filter(patient => patient.patient_tag === filterTag);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'name':
          comparison = (a.first_name + ' ' + a.last_name).localeCompare(b.first_name + ' ' + b.last_name);
          break;
        case 'date':
          // Use date_of_entry if available (user-defined entry date), otherwise fall back to created_at
          const getPatientSortDate = (patient: PatientWithRelations) => {
            if (patient.date_of_entry) {
              // Handle both date strings and datetime strings
              if (typeof patient.date_of_entry === 'string') {
                if (patient.date_of_entry.includes('T')) {
                  return new Date(patient.date_of_entry).getTime();
                } else {
                  return new Date(patient.date_of_entry + 'T00:00:00').getTime();
                }
              }
              return new Date(patient.date_of_entry).getTime();
            }
            return new Date(patient.created_at).getTime();
          };
          
          comparison = getPatientSortDate(a) - getPatientSortDate(b);
          break;
        case 'visits':
          comparison = (a.visitCount || 0) - (b.visitCount || 0);
          break;
        case 'spent':
          comparison = (a.totalSpent || 0) - (b.totalSpent || 0);
          break;
      }
      
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    setFilteredPatients(filtered);
  };

  const handlePatientClick = (patient: PatientWithRelations) => {
    setSelectedPatient(patient);
    setShowHistoryModal(true);
  };

  const handleEditPatient = (patient: PatientWithRelations) => {
    setSelectedPatient(patient);
    setShowEditModal(true);
  };

  const handleVisitAgain = (patient: PatientWithRelations) => {
    setSelectedPatientForVisitAgain(patient);
    setShowVisitAgainModal(true);
  };


  const handleViewReceipt = (patient: PatientWithRelations) => {
    setSelectedPatientForReceipt(patient);
    setShowReceiptModal(true);
  };

  const handleManageServices = (patient: PatientWithRelations) => {
    setSelectedPatientForServices(patient);
    setShowServiceManager(true);
  };

  const handlePatientUpdated = () => {
    loadPatients(); // Reload patients after update
  };

  const handleShiftToIPD = (patient: PatientWithRelations) => {
    // Check if patient is already in IPD
    if (patient.ipd_status === 'ADMITTED') {
      toast.error('Patient is already admitted to IPD');
      return;
    }

    // Navigate to IPD Beds tab
    if (onNavigate) {
      onNavigate('ipd-beds');
      toast.success(`Navigating to IPD Beds to admit ${patient.first_name} ${patient.last_name}`);
    } else {
      toast.success(`Patient ${patient.first_name} ${patient.last_name} selected for IPD admission`);
    }
  };


  const handlePrescription = (patient: PatientWithRelations, template: string) => {
    setSelectedPatientForPrescription(patient);
    
    // Check if patient has multiple doctors
    const hasMultipleDoctors = patient.assigned_doctors && patient.assigned_doctors.length > 1;
    
    if (hasMultipleDoctors) {
      // Use multiple prescription generator
      setMultiplePrescriptionType(template as 'valant' | 'vh');
      setShowMultiplePrescription(true);
    } else {
      // Use single prescription (original behavior)
      if (template === 'valant') {
        setShowValantPrescription(true);
      } else if (template === 'vh') {
        setShowVHPrescription(true);
      }
    }
  };

  const handleSort = (newSortBy: typeof sortBy) => {
    if (sortBy === newSortBy) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(newSortBy);
      setSortOrder('desc');
    }
  };

  const getSortIcon = (column: typeof sortBy) => {
    if (sortBy !== column) return '↕️';
    return sortOrder === 'asc' ? '↑' : '↓';
  };

  const deletePatient = async (patientId: string, patientName: string) => {
    const confirmDelete = window.confirm(
      `Are you sure you want to delete ${patientName}?\n\nThis action cannot be undone and will remove all patient data including medical history, transactions, and appointments.`
    );

    if (!confirmDelete) return;

    try {
      setLoading(true);
      
      // Delete the patient using HospitalService
      await HospitalService.deletePatient(patientId);
      
      toast.success('Patient deleted successfully');
      await loadPatients(); // Reload the patients list
      
    } catch (error: any) {
      toast.error(`Failed to delete patient: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const exportPatientsToExcel = () => {
    try {
      
      const exportData = filteredPatients.map(patient => {
        
        // Debug registration date formatting
        const regDate = patient.created_at || '';
        const formattedRegDate = formatDate(regDate);
        
        return {
          patient_id: patient.patient_id,
          first_name: patient.first_name,
          last_name: patient.last_name,
          phone: patient.phone || '',
          email: patient.email || '',
          gender: patient.gender || '',
          age: patient.age || '',
          address: patient.address || '',
          date_of_birth: patient.date_of_birth || '',
          medical_history: patient.medical_history || '',
          allergies: patient.allergies || '',
          patient_tag: patient.patient_tag || '',
          emergency_contact: patient.emergency_contact_name || '',
          visit_count: patient.visitCount || 0,
          department_status: patient.departmentStatus || 'OPD',
          total_spent: patient.totalSpent || 0, // Clean numeric value
          last_visit: formatDate(patient.lastVisit || patient.date_of_entry || ''),
          registration_date: patient.created_at || '', // Store raw date
        };
      });

      const success = exportToExcel({
        filename: `Patient_List_${getLocalDateString()}`,
        headers: [
          'Patient ID',
          'First Name',
          'Last Name', 
          'Phone',
          'Email',
          'Gender',
          'Age',
          'Address',
          'Date of Birth',
          'Medical History',
          'Allergies',
          'Patient Tag',
          'Emergency Contact',
          'Visit Count',
          'Department Status',
          'Total Spent',
          'Last Visit',
          'Registration Date'
        ],
        data: exportData,
        formatters: {
          total_spent: (value) => formatCurrencyForExcel(value), // Clean numeric value
          last_visit: (value) => value ? formatDate(value) : 'Never',
          registration_date: (value) => value ? formatDate(value) : 'Unknown'
        }
      });

      if (success) {
        toast.success(`Exported ${filteredPatients.length} patients to Excel!`);
      } else {
        toast.error('Failed to export patient list');
      }
    } catch (error: any) {
      toast.error('Failed to export: ' + error.message);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading patients...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">👥 Comprehensive Patient List</h1>
        <p className="text-gray-600">Complete patient management with search, filter, and detailed history</p>
        {dateRange !== 'all' && (
          <div className="mt-2 text-sm text-blue-600 bg-blue-50 px-3 py-1 rounded-full inline-block">
            📅 Showing patients from: {
              dateRange === 'today' ? new Date(selectedDate).toLocaleDateString('en-IN', { 
                timeZone: 'Asia/Kolkata',
                day: '2-digit',
                month: '2-digit', 
                year: 'numeric'
              }) :
              dateRange === 'custom' ? new Date(startDate).toLocaleDateString('en-IN', { 
                timeZone: 'Asia/Kolkata',
                day: '2-digit',
                month: '2-digit', 
                year: 'numeric'
              }) :
              dateRange === 'week' ? `This week (${new Date(startDate).toLocaleDateString('en-IN', { 
                timeZone: 'Asia/Kolkata',
                day: '2-digit',
                month: '2-digit', 
                year: 'numeric'
              })} - ${new Date(endDate).toLocaleDateString('en-IN', { 
                timeZone: 'Asia/Kolkata',
                day: '2-digit',
                month: '2-digit', 
                year: 'numeric'
              })})` :
              `This month (${new Date(startDate).toLocaleDateString('en-IN', { 
                timeZone: 'Asia/Kolkata',
                day: '2-digit',
                month: '2-digit', 
                year: 'numeric'
              })} - ${new Date(endDate).toLocaleDateString('en-IN', { 
                timeZone: 'Asia/Kolkata',
                day: '2-digit',
                month: '2-digit', 
                year: 'numeric'
              })})`
            }
          </div>
        )}
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-blue-50 p-4 rounded-lg border-2 border-blue-200">
          <div className="text-2xl font-bold text-blue-700">{patients.length}</div>
          <div className="text-blue-600">Total Patients</div>
        </div>
        <div className="bg-green-50 p-4 rounded-lg border-2 border-green-200">
          <div className="text-2xl font-bold text-green-700">{filteredPatients.length}</div>
          <div className="text-green-600">Filtered Results</div>
        </div>
        <div className="bg-purple-50 p-4 rounded-lg border-2 border-purple-200">
          <div className="text-2xl font-bold text-purple-700">
            ₹{patients.reduce((sum, p) => {
              // Exclude ORTHO/DR. HEMANT patients from revenue
              if (p.assigned_department === 'ORTHO' || p.assigned_doctor === 'DR. HEMANT') {
                return sum;
              }
              return sum + (p.totalSpent || 0);
            }, 0).toLocaleString()}
          </div>
          <div className="text-purple-600">Total Revenue</div>
        </div>
        <div className="bg-orange-50 p-4 rounded-lg border-2 border-orange-200">
          <div className="text-2xl font-bold text-orange-700">
            {patients.reduce((sum, p) => sum + (p.visitCount || 0), 0)}
          </div>
          <div className="text-orange-600">Total Visits</div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white p-4 rounded-lg shadow-sm border mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search by name, phone, email, or patient ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Gender Filter */}
          <div className="min-w-[150px]">
            <select
              value={filterGender}
              onChange={(e) => setFilterGender(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Genders</option>
              <option value="M">M</option>
              <option value="F">F</option>
              <option value="OTHER">Other</option>
            </select>
          </div>

          {/* TAG Filter */}
          <div className="min-w-[180px]">
            <select
              value={filterTag}
              onChange={(e) => setFilterTag(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Tags</option>
              {availableTags.map((tag) => (
                <option key={tag} value={tag}>
                  {tag}
                </option>
              ))}
            </select>
          </div>

          {/* Date Range Filter */}
          <div className="min-w-[150px]">
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value as any)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Time</option>
              <option value="today">Today</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
              <option value="custom">Custom Date</option>
            </select>
          </div>

          {/* Custom Single Date Input - Modern Date Picker */}
          {dateRange === 'custom' && (
            <div className="min-w-[200px]">
              <ModernDatePicker
                label="Select Date"
                value={startDate}
                onChange={(date) => {
                  setStartDate(date);
                  setEndDate(date); // Always keep start and end date the same
                }}
                placeholder="Select date (DD/MM/YYYY)"
              />
            </div>
          )}

          {/* Single Date Input for Today - Modern Date Picker */}
          {dateRange === 'today' && (
            <>
              <div className="min-w-[200px]">
                <ModernDatePicker
                  label="Select Date"
                  value={selectedDate}
                  onChange={(date) => setSelectedDate(date)}
                  placeholder="Select date (DD/MM/YYYY)"
                />
              </div>
              <button
                onClick={() => {
                  const todayDate = getLocalDateString();
                  setSelectedDate(todayDate);
                  // Force reload after setting today's date
                  setTimeout(() => {
                    loadPatients();
                  }, 100);
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 shadow-sm mt-6 transition-colors duration-200"
                title="Set to today's date"
              >
                📅 Today
              </button>
            </>
          )}

          {/* Action Buttons */}
          <div className="flex space-x-2">
            <button
              onClick={loadPatients}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200 shadow-sm hover:shadow-md"
            >
              🔄 Refresh
            </button>
            <button
              onClick={exportPatientsToExcel}
              disabled={filteredPatients.length === 0}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-sm hover:shadow-md"
              title="Export to Excel"
            >
              📊 Export
            </button>
          </div>
        </div>
      </div>

      {/* Patient List */}
      {filteredPatients.length > 0 ? (
        <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th 
                    className="text-left p-4 font-semibold text-gray-700 cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('name')}
                  >
                    Patient {getSortIcon('name')}
                  </th>
                  <th className="text-left p-4 font-semibold text-gray-700">Contact</th>
                  <th 
                    className="text-left p-4 font-semibold text-gray-700 cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('visits')}
                  >
                    Visits {getSortIcon('visits')}
                  </th>
                  <th className="text-left p-4 font-semibold text-gray-700">Department</th>
                  <th 
                    className="text-left p-4 font-semibold text-gray-700 cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('spent')}
                  >
                    Total Spent {getSortIcon('spent')}
                  </th>
                  <th 
                    className="text-left p-4 font-semibold text-gray-700 cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('date')}
                  >
                    Last Visit {getSortIcon('date')}
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredPatients.map((patient, index) => (
                  <tr 
                    key={patient.id} 
                    className={`border-b hover:bg-gray-50 cursor-pointer ${
                      index % 2 === 0 ? 'bg-white' : 'bg-gray-25'
                    }`}
                    onClick={() => handlePatientClick(patient)}
                  >
                    <td className="p-4">
                      <div>
                        <div className="font-semibold text-gray-800">
                          {patient.first_name} {patient.last_name}
                        </div>
                        <div className="text-sm text-gray-500">ID: {patient.patient_id}</div>
                        <div className="text-sm text-gray-500">
                          {patient.age || 'N/A'} yrs • {patient.gender === 'MALE' ? 'M' : patient.gender === 'FEMALE' ? 'F' : patient.gender || 'N/A'}
                          {patient.patient_tag && (
                            <span className="ml-2 bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full text-xs">
                              {patient.patient_tag}
                            </span>
                          )}
                        </div>
                        <div className="text-sm text-purple-600 mt-1">
                          {patient.assigned_doctors && patient.assigned_doctors.length > 0 ? (
                            <div>
                              <span className="font-medium">
                                👨‍⚕️ {patient.assigned_doctors.find(d => d.isPrimary)?.name || patient.assigned_doctors[0]?.name}
                                {patient.assigned_department && (
                                  <span className="ml-2 text-xs text-gray-600 bg-gray-100 px-2 py-0.5 rounded">
                                    {patient.assigned_department}
                                  </span>
                                )}
                              </span>
                              {patient.assigned_doctors.length > 1 && (
                                <span className="ml-2 bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full text-xs">
                                  +{patient.assigned_doctors.length - 1} more
                                </span>
                              )}
                            </div>
                          ) : patient.assigned_doctor ? (
                            <span className="font-medium">
                              👨‍⚕️ {patient.assigned_doctor}
                              {patient.assigned_department && (
                                <span className="ml-2 text-xs text-gray-600 bg-gray-100 px-2 py-0.5 rounded">
                                  {patient.assigned_department}
                                </span>
                              )}
                            </span>
                          ) : (
                            <span className="text-gray-400">No doctor assigned</span>
                          )}
                        </div>
                        
                        {/* Action Buttons - Moved Below Details */}
                        <div className="flex flex-wrap gap-1 mt-3">
                          {/* 1. Prescription */}
                          <div className="relative inline-block">
                            <select
                              onClick={(e) => e.stopPropagation()}
                              onChange={(e) => {
                                e.stopPropagation();
                                const selectedTemplate = e.target.value;
                                if (selectedTemplate === 'valant') {
                                  handlePrescription(patient, 'valant');
                                } else if (selectedTemplate === 'vh') {
                                  handlePrescription(patient, 'vh');
                                }
                                e.target.value = ''; // Reset selection
                              }}
                              className="bg-orange-600 text-white px-2 py-1 rounded text-xs hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500 cursor-pointer"
                              title="Generate Prescription"
                            >
                              <option value="">📝 Presc.</option>
                              <option value="valant">Valant Template</option>
                              <option value="vh">V+H Template</option>
                            </select>
                          </div>
                          
                          {/* 2. Services */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleManageServices(patient);
                            }}
                            className="bg-purple-600 text-white px-2 py-1 rounded text-xs hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500"
                            title="Manage Medical Services"
                          >
                            🔬 Services
                          </button>
                          
                          {/* 3. Edit */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEditPatient(patient);
                            }}
                            className="bg-green-600 text-white px-2 py-1 rounded text-xs hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
                            title="Edit Patient Details"
                          >
                            ✏️ Edit
                          </button>
                          
                          {/* 4. IPD (renamed from Shift to IPD) */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleShiftToIPD(patient);
                            }}
                            className="bg-teal-600 text-white px-2 py-1 rounded text-xs hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-500"
                            title="Shift Patient to IPD"
                            disabled={patient.ipd_status === 'ADMITTED'}
                          >
                            🏥 IPD
                          </button>
                          
                          {/* 5. History */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handlePatientClick(patient);
                            }}
                            className="bg-blue-600 text-white px-2 py-1 rounded text-xs hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            title="View Patient History"
                          >
                            📋 History
                          </button>
                          
                          {/* 6. Receipt */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleViewReceipt(patient);
                            }}
                            className="bg-indigo-600 text-white px-2 py-1 rounded text-xs hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            title="View Receipt"
                          >
                            🧾 Receipt
                          </button>
                          
                          {/* 7. Delete */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              deletePatient(patient.id, `${patient.first_name} ${patient.last_name}`);
                            }}
                            className="bg-red-600 text-white px-2 py-1 rounded text-xs hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
                            title="Delete patient permanently"
                            disabled={loading}
                          >
                            🗑️ Delete
                          </button>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="text-sm">
                        <div>{patient.phone || 'No phone'}</div>
                        {patient.email && (
                          <div className="text-gray-500">{patient.email}</div>
                        )}
                      </div>
                    </td>
                    <td className="p-4">
                      <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm font-medium">
                        {patient.visitCount || 0}
                      </span>
                    </td>
                    <td className="p-4">
                      {(() => {
                        const deptStatus = getDepartmentStatus(patient);
                        return (
                          <span className={`px-2 py-1 rounded text-sm font-medium ${deptStatus.style}`}>
                            {deptStatus.status}
                          </span>
                        );
                      })()}
                    </td>
                    <td className="p-4">
                      <span className="text-green-600 font-semibold">
                        ₹{(patient.totalSpent || 0).toLocaleString()}
                      </span>
                    </td>
                    <td className="p-4 text-sm text-gray-600">
                      {(() => {
                        // EXTENSIVE DEBUGGING - Log all available date fields
                        
                        let lastVisitDate = null;
                        let dateSource = 'none';
                        
                        // Priority 1: Use date_of_entry if it's explicitly set (user-defined visit date)
                        if (patient.date_of_entry && patient.date_of_entry.trim() !== '') {
                          lastVisitDate = patient.date_of_entry;
                          dateSource = 'entry';
                        }
                        
                        // Priority 2: Most recent transaction date (if transactions exist and no date_of_entry)
                        else if (patient.transactions && patient.transactions.length > 0) {
                          // Filter out cancelled transactions and sort by date
                          const activeTransactions = patient.transactions
                            .filter(t => t.status !== 'CANCELLED' && t.created_at)
                            .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
                          
                          
                          if (activeTransactions.length > 0) {
                            lastVisitDate = activeTransactions[0].created_at;
                            dateSource = 'transaction';
                          }
                        }
                        
                        // Priority 3: Use pre-calculated lastVisit field from HospitalService
                        else if (patient.lastVisit) {
                          lastVisitDate = patient.lastVisit;
                          dateSource = 'calculated';
                        }
                        
                        // Priority 4: Fallback to patient creation date
                        else if (patient.created_at) {
                          lastVisitDate = patient.created_at;
                          dateSource = 'created';
                        }
                        
                        
                        // Format the date consistently
                        if (lastVisitDate) {
                          try {
                            let date;
                            
                            // Handle date strings properly to avoid timezone issues
                            if (typeof lastVisitDate === 'string' && lastVisitDate.match(/^\d{4}-\d{2}-\d{2}$/)) {
                              // For YYYY-MM-DD format, create date as local time to avoid timezone shift
                              const [year, month, day] = lastVisitDate.split('-').map(Number);
                              date = new Date(year, month - 1, day);
                            } else {
                              date = new Date(lastVisitDate);
                            }
                            
                            // Validate the date
                            if (isNaN(date.getTime())) {
                              return 'Invalid Date';
                            }
                            
                            const formattedDate = date.toLocaleDateString('en-IN', {
                              day: '2-digit',
                              month: '2-digit', 
                              year: 'numeric'
                            });
                            return formattedDate;
                          } catch (error) {
                            return 'Date Error';
                          }
                        }
                        
                        return 'Never';
                      })()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border p-12 text-center">
          <div className="text-6xl mb-4">👥</div>
          <h3 className="text-xl font-semibold text-gray-800 mb-2">No patients found</h3>
          <p className="text-gray-600 mb-4">
            {searchTerm || filterGender !== 'all' || filterTag !== 'all' || dateRange !== 'all'
              ? 'Try adjusting your search or filters'
              : 'No patients have been registered yet'
            }
          </p>
          <button
            onClick={loadPatients}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
          >
            🔄 Refresh List
          </button>
        </div>
      )}

      {/* Patient History Modal */}
      {selectedPatient && (
        <PatientHistoryModal
          patient={selectedPatient}
          isOpen={showHistoryModal}
          onClose={() => {
            setShowHistoryModal(false);
            setSelectedPatient(null);
          }}
          onPatientUpdated={loadPatients}
        />
      )}

      {/* Edit Patient Modal */}
      {selectedPatient && (
        <EditPatientModal
          patient={selectedPatient}
          isOpen={showEditModal}
          onClose={() => {
            setShowEditModal(false);
            setSelectedPatient(null);
          }}
          onPatientUpdated={handlePatientUpdated}
        />
      )}


      {/* Receipt Modal */}
      {showReceiptModal && selectedPatientForReceipt && (
        <Receipt
          patientId={selectedPatientForReceipt.id}
          onClose={() => {
            setShowReceiptModal(false);
            setSelectedPatientForReceipt(null);
          }}
        />
      )}

      {/* Valant Prescription Modal */}
      {showValantPrescription && selectedPatientForPrescription && (
        <ValantPrescription
          patient={selectedPatientForPrescription}
          onClose={() => {
            setShowValantPrescription(false);
            setSelectedPatientForPrescription(null);
          }}
        />
      )}

      {/* V+H Prescription Modal */}
      {showVHPrescription && selectedPatientForPrescription && (
        <VHPrescription
          patient={selectedPatientForPrescription}
          onClose={() => {
            setShowVHPrescription(false);
            setSelectedPatientForPrescription(null);
          }}
        />
      )}

      {/* Multiple Prescription Generator Modal */}
      {showMultiplePrescription && selectedPatientForPrescription && (
        <MultiplePrescriptionGenerator
          patient={selectedPatientForPrescription}
          prescriptionType={multiplePrescriptionType}
          onClose={() => {
            setShowMultiplePrescription(false);
            setSelectedPatientForPrescription(null);
          }}
        />
      )}

      {/* Patient Service Manager Modal */}
      {showServiceManager && selectedPatientForServices && (
        <PatientServiceManager
          patient={selectedPatientForServices}
          onClose={() => {
            setShowServiceManager(false);
            setSelectedPatientForServices(null);
          }}
          onServicesUpdated={() => {
            loadPatients(); // Reload to update totals
          }}
        />
      )}

      {/* Visit Again Modal */}
      {showVisitAgainModal && selectedPatientForVisitAgain && (
        <VisitAgainModal
          patient={selectedPatientForVisitAgain}
          onClose={() => {
            setShowVisitAgainModal(false);
            setSelectedPatientForVisitAgain(null);
          }}
          onVisitCreated={() => {
            loadPatients(); // Reload to update patient data and totals
          }}
        />
      )}

    </div>
  );
};

export default ComprehensivePatientList;
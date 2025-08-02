import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import HospitalService from '../services/hospitalService';
import { ExactDateService } from '../services/exactDateService';
import type { PatientWithRelations } from '../config/supabaseNew';
import { Input } from './ui/Input';
import EditPatientModal from './EditPatientModal';
import Receipt from './Receipt';
import ValantPrescription from './ValantPrescription';
import VHPrescription from './VHPrescription';
import MultiplePrescriptionGenerator from './MultiplePrescriptionGenerator';
import PatientServiceManager from './PatientServiceManager';
import VisitAgainModal from './VisitAgainModal';
import { exportToExcel, formatCurrency, formatCurrencyForExcel, formatDate } from '../utils/excelExport';
import useReceiptPrinting from '../hooks/useReceiptPrinting';

interface PatientHistoryModalProps {
  patient: PatientWithRelations;
  isOpen: boolean;
  onClose: () => void;
  onPatientUpdated?: () => void;
}

const PatientHistoryModal: React.FC<PatientHistoryModalProps> = ({ patient, isOpen, onClose, onPatientUpdated }) => {
  const { printServiceReceipt } = useReceiptPrinting();
  const [deletingTransactionId, setDeletingTransactionId] = useState<string | null>(null);
  
  if (!isOpen) return null;

  const totalSpent = patient.totalSpent || 0;
  const visitCount = patient.visitCount || 0;
  const transactions = patient.transactions || [];

  const handleDeleteTransaction = async (transactionId: string, description: string, amount: number) => {
    if (!confirm(`Are you sure you want to delete this transaction?\n\n"${description}"\nAmount: ₹${amount.toLocaleString()}\n\nThis will mark the transaction as cancelled and cannot be undone.`)) {
      return;
    }

    try {
      setDeletingTransactionId(transactionId);
      console.log('🗑️ Deleting transaction:', transactionId);
      
      // Update transaction status to CANCELLED
      await HospitalService.updateTransactionStatus(transactionId, 'CANCELLED');
      
      toast.success('Transaction cancelled successfully. Patient totals will be updated.');
      
      // Close modal and trigger patient list refresh
      onClose();
      if (onPatientUpdated) {
        onPatientUpdated();
      }
    } catch (error: any) {
      console.error('❌ Failed to delete transaction:', error);
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
                
                // Priority 1: Use date_of_entry if it's explicitly set (user-defined visit date)
                if (patient.date_of_entry) {
                  lastVisitDate = patient.date_of_entry;
                }
                
                // Priority 2: Most recent transaction date (if no date_of_entry)
                else if (patient.transactions && patient.transactions.length > 0) {
                  const activeTransactions = patient.transactions
                    .filter(t => t.status !== 'CANCELLED' && t.created_at)
                    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
                  
                  if (activeTransactions.length > 0) {
                    lastVisitDate = activeTransactions[0].created_at;
                  }
                }
                
                // Priority 3: Use pre-calculated lastVisit field
                else if (patient.lastVisit) {
                  lastVisitDate = patient.lastVisit;
                }
                
                // Priority 4: Fallback to creation date
                else if (patient.created_at) {
                  lastVisitDate = patient.created_at;
                }
                
                return lastVisitDate 
                  ? new Date(lastVisitDate).toLocaleDateString('en-IN', {
                      day: '2-digit',
                      month: '2-digit', 
                      year: 'numeric'
                    })
                  : 'Never';
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
            <div><span className="font-medium">Gender:</span> {patient.gender}</div>
            <div><span className="font-medium">Blood Group:</span> {patient.blood_group || 'Not specified'}</div>
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
          <h3 className="text-lg font-semibold mb-3">Transaction History ({transactions.length})</h3>
          {transactions.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-100">
                  <tr>
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
                      <td className="p-2">{new Date(transaction.created_at).toLocaleDateString()}</td>
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
  const [dateRange, setDateRange] = useState<'all' | 'today' | 'week' | 'month' | 'custom'>('all');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
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

  useEffect(() => {
    loadPatients();
  }, [dateRange, startDate, endDate, selectedDate]);

  useEffect(() => {
    // Update date range when dateRange changes
    const today = new Date();
    switch (dateRange) {
      case 'today':
        setSelectedDate(today.toISOString().split('T')[0]);
        setStartDate(today.toISOString().split('T')[0]);
        setEndDate(today.toISOString().split('T')[0]);
        break;
      case 'week':
        const weekStart = new Date(today);
        weekStart.setDate(today.getDate() - today.getDay());
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);
        setStartDate(weekStart.toISOString().split('T')[0]);
        setEndDate(weekEnd.toISOString().split('T')[0]);
        break;
      case 'month':
        const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
        const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);
        setStartDate(monthStart.toISOString().split('T')[0]);
        setEndDate(monthEnd.toISOString().split('T')[0]);
        break;
    }
  }, [dateRange]);

  useEffect(() => {
    filterAndSortPatients();
  }, [patients, searchTerm, sortBy, sortOrder, filterGender, filterTag]);

  const loadPatients = async () => {
    try {
      setLoading(true);
      console.log('🔍 Loading patients from new schema...');
      
      let patientsData;
      
      // Use backend filtering for 'today' and single custom dates to get exact results
      if (dateRange === 'today') {
        const todayStr = selectedDate || new Date().toISOString().split('T')[0];
        console.log(`📅 Using backend date filter for today: ${todayStr}`);
        patientsData = await HospitalService.getPatientsForDate(todayStr, 500);
      } else if (dateRange === 'custom') {
        // For custom date, use NEW exact date service to avoid cumulative results
        console.log(`📅 Using EXACT DATE SERVICE for custom date: ${startDate}`);
        console.log('🎯 CUSTOM DATE DEBUG:', {
          selectedCustomDate: startDate,
          endDateShouldMatch: endDate,
          areEqual: startDate === endDate,
          dateFormat: 'YYYY-MM-DD',
          service: 'ExactDateService (NO CUMULATIVE RESULTS)'
        });
        patientsData = await ExactDateService.getPatientsForExactDate(startDate, 500);
      } else {
        // For date ranges and 'all', load all patients and apply frontend filtering
        console.log(`📅 Loading all patients for ${dateRange} filter`);
        patientsData = await HospitalService.getPatients(500);
      }
      
      console.log(`✅ Loaded ${patientsData.length} patients`);
      
      // Debug: Check if backend or frontend filtering was used
      if (dateRange === 'today' || dateRange === 'custom') {
        console.log('🔍 Backend filtering used - results should be exact for single date');
        
        // CUSTOM DATE SPECIFIC DEBUG: Check all returned patients
        if (dateRange === 'custom') {
          console.log('🚨 CUSTOM DATE FILTER RESULTS ANALYSIS:');
          console.log(`Expected date: ${startDate}`);
          
          patientsData.forEach((p, i) => {
            const createdDate = p.created_at ? p.created_at.split('T')[0] : 'NO_CREATED';
            const entryDate = p.date_of_entry ? (p.date_of_entry.includes('T') ? p.date_of_entry.split('T')[0] : p.date_of_entry) : 'NO_ENTRY';
            
            const matchesExpected = (createdDate === startDate || entryDate === startDate);
            
            console.log(`${i + 1}. ${p.first_name} ${p.last_name}:`, {
              created: createdDate,
              entry: entryDate,
              expected: startDate,
              shouldMatch: matchesExpected,
              warning: !matchesExpected ? '⚠️ WRONG DATE!' : '✅ Correct'
            });
            
            if (!matchesExpected) {
              console.error(`🚨 BACKEND FILTER FAILED: Patient ${p.first_name} ${p.last_name} returned but doesn't match ${startDate}`);
            }
          });
        }
      } else {
        console.log('🔍 Frontend filtering will be applied for date ranges');
      }
      
      // Quick debug: Show all patient dates to help identify the issue
      console.log('📋 All patient dates (first 10):');
      patientsData.slice(0, 10).forEach((p, i) => {
        const createdDateStr = p.created_at ? p.created_at.split('T')[0] : null;
        const entryDateStr = p.date_of_entry ? p.date_of_entry.split('T')[0] : null;
        console.log(`${i + 1}. ${p.first_name} ${p.last_name}: created=${createdDateStr}, entry=${entryDateStr}`);
      });
      
      // Apply date filtering if not 'all' and not using backend filtering
      // Exclude custom dates since they're now handled by backend (always single dates)
      if (dateRange !== 'all' && dateRange !== 'today' && dateRange !== 'custom') {
        console.log('📊 Before filtering:', patientsData.length, 'patients');
        const originalCount = patientsData.length;
        // Calculate dates based on current dateRange - don't rely on state
        let currentStartDate, currentEndDate;
        const today = new Date().toISOString().split('T')[0];
        
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
            currentStartDate = weekStart.toISOString().split('T')[0];
            currentEndDate = weekEnd.toISOString().split('T')[0];
            break;
          case 'month':
            const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
            const monthEnd = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0);
            currentStartDate = monthStart.toISOString().split('T')[0];
            currentEndDate = monthEnd.toISOString().split('T')[0];
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
          jsToday: new Date().toISOString().split('T')[0],
          selectedDate: selectedDate,
          startDate: startDate,
          endDate: endDate,
          currentStartDate,
          currentEndDate,
          dateRange,
          dateTime: new Date().toLocaleString()
        };
        
        console.log('🔍 Date filtering debug:', {
          dateRange,
          currentStartDate,
          currentEndDate,
          totalPatients: patientsData.length,
          todaysDateInfo,
          format: 'Using YYYY-MM-DD format like patient entry forms'
        });
        
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
          
          console.log('👤 Found ASHOK KUMAR patient:', {
            name: `${ashokPatient.first_name} ${ashokPatient.last_name}`,
            created_at_raw: ashokPatient.created_at,
            date_of_entry_raw: ashokPatient.date_of_entry,
            created_at_parsed: debugCreatedDate,
            date_of_entry_parsed: debugEntryDate,
            finalDate: debugEntryDate || debugCreatedDate
          });
        }
        
        // Simplified and more reliable filtering logic
        console.log('🔧 Starting patient filtering...');
        
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
            console.log(`👤 Patient ${i + 1}: ${patient.first_name} ${patient.last_name}`, {
              date_of_entry: patient.date_of_entry,
              created_at: patient.created_at,
              patientDateStr,
              currentStartDate,
              currentEndDate
            });
          }
          
          // Validate date format and exclude invalid dates
          if (!patientDateStr) {
            if (shouldDebug) {
              console.log('❌ No date found - EXCLUDING patient for today filter');
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
              console.log('⚠️ Invalid date format - converting:', patientDateStr);
            }
            // Try to convert to YYYY-MM-DD format
            try {
              const dateObj = new Date(patientDateStr);
              if (!isNaN(dateObj.getTime())) {
                patientDateStr = dateObj.toISOString().split('T')[0];
                if (shouldDebug) {
                  console.log('✅ Converted to YYYY-MM-DD:', patientDateStr);
                }
              } else {
                if (shouldDebug) {
                  console.log('❌ Invalid date - EXCLUDING patient');
                }
                continue;
              }
            } catch (error) {
              if (shouldDebug) {
                console.log('❌ Date conversion failed - EXCLUDING patient:', error);
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
              console.log('🔍 EXACT DATE CHECK (YYYY-MM-DD):', {
                patientDateStr,
                currentStartDate,
                exactMatch: patientDateStr === currentStartDate,
                stringComparison: `"${patientDateStr}" === "${currentStartDate}"`,
                format: 'Both in YYYY-MM-DD format like patient entry'
              });
            }
          } else if (dateRange === 'custom') {
            // Custom dates are now handled by backend, this shouldn't be reached
            console.warn('⚠️ Custom date filtering reached frontend - should be handled by backend');
            isInRange = patientDateStr === currentStartDate;
          } else {
            // For date ranges (week, month, custom range), use range matching in YYYY-MM-DD format
            isInRange = patientDateStr >= currentStartDate && patientDateStr <= currentEndDate;
            
            if (shouldDebug) {
              console.log('🔍 DATE RANGE CHECK (YYYY-MM-DD):', {
                patientDateStr,
                startDate: currentStartDate,
                endDate: currentEndDate,
                isInRange,
                dateRange,
                format: 'Range comparison in YYYY-MM-DD format'
              });
            }
          }
          
          if (shouldDebug) {
            console.log(`📅 Date comparison:`, {
              patientDate: patientDateStr,
              startDate: currentStartDate,
              endDate: currentEndDate,
              isInRange,
              comparison: {
                'patient >= start': patientDateStr >= currentStartDate,
                'patient <= end': patientDateStr <= currentEndDate
              }
            });
          }
          
          if (isInRange) {
            filtered.push(patient);
            if (shouldDebug) {
              console.log('✅ Patient included in filter');
            }
            // Special alert for problematic dates
            if (dateRange === 'today' && patientDateStr !== currentStartDate) {
              console.error('🚨 BUG: Patient included but date does not match!', {
                patientName: `${patient.first_name} ${patient.last_name}`,
                patientDate: patientDateStr,
                expectedDate: currentStartDate,
                exactMatch: patientDateStr === currentStartDate
              });
            }
          } else {
            if (shouldDebug) {
              console.log('❌ Patient excluded from filter');
            }
          }
        }
        
        patientsData = filtered;
        
        // Show final filtered patients for today filter
        if (dateRange === 'today') {
          console.log('🎯 FINAL FILTERED PATIENTS FOR TODAY:');
          patientsData.forEach((p, idx) => {
            const patientDateStr = (p.date_of_entry && p.date_of_entry.split('T')[0]) || (p.created_at && p.created_at.split('T')[0]) || 'NO_DATE';
            console.log(`${idx + 1}. ${p.first_name} ${p.last_name} - Date: ${patientDateStr} (Expected: ${currentStartDate})`);
            
            if (patientDateStr !== currentStartDate && patientDateStr !== 'NO_DATE') {
              console.error(`🚨 WRONG DATE PATIENT: ${p.first_name} ${p.last_name} has date ${patientDateStr} but should be ${currentStartDate}`);
            }
          });
        }
        
        console.log(`📅 Filtered to ${patientsData.length} patients for date range: ${currentStartDate} to ${currentEndDate}`);
        console.log(`📊 Filtering summary:`, {
          originalCount,
          filteredCount: patientsData.length,
          dateRange,
          removedCount: originalCount - patientsData.length
        });
      } else if (dateRange === 'today') {
        console.log('📊 Using backend filtering for today - no client-side filtering needed:', patientsData.length);
      } else {
        console.log('📊 No date filtering applied - showing all patients:', patientsData.length);
      }
      
      setPatients(patientsData);
      
      // Extract unique tags from patients for filter dropdown
      const uniqueTags = [...new Set(
        patientsData
          .map(p => p.patient_tag)
          .filter(tag => tag && tag.trim() !== '')
      )].sort();
      setAvailableTags(uniqueTags);
    } catch (error: any) {
      console.error('❌ Failed to load patients:', error);
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
          comparison = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
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
      console.error('Error deleting patient:', error);
      toast.error(`Failed to delete patient: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const exportPatientsToExcel = () => {
    try {
      console.log('🔍 Exporting patients, checking registration dates...');
      
      const exportData = filteredPatients.map(patient => {
        console.log(`Patient ${patient.patient_id}: created_at = ${patient.created_at}, type = ${typeof patient.created_at}`);
        
        // Debug registration date formatting
        const regDate = patient.created_at || '';
        console.log(`Registration date raw: ${regDate}`);
        const formattedRegDate = formatDate(regDate);
        console.log(`Registration date formatted: ${formattedRegDate}`);
        
        return {
          patient_id: patient.patient_id,
          first_name: patient.first_name,
          last_name: patient.last_name,
          phone: patient.phone || '',
          email: patient.email || '',
          gender: patient.gender || '',
          age: patient.age || '',
          blood_group: patient.blood_group || '',
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
        filename: `Patient_List_${new Date().toISOString().split('T')[0]}`,
        headers: [
          'Patient ID',
          'First Name',
          'Last Name', 
          'Phone',
          'Email',
          'Gender',
          'Age',
          'Blood Group',
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
      console.error('Export error:', error);
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
              dateRange === 'today' ? new Date(selectedDate).toLocaleDateString() :
              dateRange === 'custom' ? new Date(startDate).toLocaleDateString() :
              dateRange === 'week' ? `This week (${new Date(startDate).toLocaleDateString()} - ${new Date(endDate).toLocaleDateString()})` :
              `This month (${new Date(startDate).toLocaleDateString()} - ${new Date(endDate).toLocaleDateString()})`
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
            ₹{patients.reduce((sum, p) => sum + (p.totalSpent || 0), 0).toLocaleString()}
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

          {/* Custom Single Date Input - Same format as Patient Entry */}
          {dateRange === 'custom' && (
            <div className="min-w-[180px]">
              <Input
                type="date"
                label="Select Date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  setEndDate(e.target.value); // Always keep start and end date the same
                }}
              />
            </div>
          )}

          {/* Single Date Input for Today - Same format as Patient Entry */}
          {dateRange === 'today' && (
            <>
              <div className="min-w-[180px]">
                <Input
                  type="date"
                  label="Select Date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                />
              </div>
              <button
                onClick={() => {
                  const todayDate = new Date().toISOString().split('T')[0];
                  console.log('🔄 Setting date to today:', todayDate);
                  setSelectedDate(todayDate);
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 shadow-sm mt-6"
                title="Set to today's date"
              >
                Today
              </button>
            </>
          )}

          {/* Action Buttons */}
          <div className="flex space-x-2">
            <button
              onClick={loadPatients}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              🔄 Refresh
            </button>
            <button
              onClick={exportPatientsToExcel}
              disabled={filteredPatients.length === 0}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
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
                  <th className="text-left p-4 font-semibold text-gray-700">Actions</th>
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
                          {patient.gender} • {patient.blood_group || 'Unknown Blood Group'}
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
                              </span>
                              {patient.assigned_doctors.length > 1 && (
                                <span className="ml-2 bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full text-xs">
                                  +{patient.assigned_doctors.length - 1} more
                                </span>
                              )}
                            </div>
                          ) : patient.assigned_doctor ? (
                            <span className="font-medium">👨‍⚕️ {patient.assigned_doctor}</span>
                          ) : (
                            <span className="text-gray-400">No doctor assigned</span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="text-sm">
                        <div>{patient.phone || 'No phone'}</div>
                        <div className="text-gray-500">{patient.email || 'No email'}</div>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm font-medium">
                        {patient.visitCount || 0}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded text-sm font-medium ${
                        'bg-green-100 text-green-800'
                      }`}>
                        {patient.departmentStatus || 'OPD'}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className="text-green-600 font-semibold">
                        ₹{(patient.totalSpent || 0).toLocaleString()}
                      </span>
                    </td>
                    <td className="p-4 text-sm text-gray-600">
                      {(() => {
                        // EXTENSIVE DEBUGGING - Log all available date fields
                        console.log(`\n🔍 PATIENT ${patient.patient_id} (${patient.first_name} ${patient.last_name}) DATE DEBUG:`);
                        console.log('📊 All available date fields:', {
                          lastVisit: patient.lastVisit,
                          date_of_entry: patient.date_of_entry,
                          created_at: patient.created_at,
                          updated_at: patient.updated_at,
                          transactions_count: patient.transactions?.length || 0,
                          totalSpent: patient.totalSpent,
                          visitCount: patient.visitCount
                        });
                        
                        if (patient.transactions && patient.transactions.length > 0) {
                          console.log('💳 Transaction details:');
                          patient.transactions.forEach((t, idx) => {
                            console.log(`  ${idx + 1}. ${t.transaction_type} - ${t.created_at} - Status: ${t.status} - Amount: ${t.amount}`);
                          });
                        }
                        
                        let lastVisitDate = null;
                        let dateSource = 'none';
                        
                        // Priority 1: Use date_of_entry if it's explicitly set (user-defined visit date)
                        if (patient.date_of_entry) {
                          lastVisitDate = patient.date_of_entry;
                          dateSource = 'entry';
                          console.log(`✅ Using user-defined date_of_entry: ${lastVisitDate}`);
                        }
                        
                        // Priority 2: Most recent transaction date (if transactions exist and no date_of_entry)
                        else if (patient.transactions && patient.transactions.length > 0) {
                          // Filter out cancelled transactions and sort by date
                          const activeTransactions = patient.transactions
                            .filter(t => t.status !== 'CANCELLED' && t.created_at)
                            .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
                          
                          console.log(`📈 Active transactions after filtering: ${activeTransactions.length}`);
                          
                          if (activeTransactions.length > 0) {
                            lastVisitDate = activeTransactions[0].created_at;
                            dateSource = 'transaction';
                            console.log(`✅ Using transaction date: ${lastVisitDate}`);
                          }
                        }
                        
                        // Priority 3: Use pre-calculated lastVisit field from HospitalService
                        else if (patient.lastVisit) {
                          lastVisitDate = patient.lastVisit;
                          dateSource = 'calculated';
                          console.log(`✅ Using calculated lastVisit: ${lastVisitDate}`);
                        }
                        
                        // Priority 4: Fallback to patient creation date
                        else if (patient.created_at) {
                          lastVisitDate = patient.created_at;
                          dateSource = 'created';
                          console.log(`✅ Using created_at: ${lastVisitDate}`);
                        }
                        
                        console.log(`🎯 FINAL RESULT: Date: ${lastVisitDate}, Source: ${dateSource}`);
                        
                        // Format the date consistently
                        if (lastVisitDate) {
                          try {
                            const date = new Date(lastVisitDate);
                            // Validate the date
                            if (isNaN(date.getTime())) {
                              console.warn(`❌ Invalid date for patient ${patient.patient_id}:`, lastVisitDate);
                              return 'Invalid Date';
                            }
                            
                            const formattedDate = date.toLocaleDateString('en-IN', {
                              day: '2-digit',
                              month: '2-digit', 
                              year: 'numeric'
                            });
                            console.log(`📅 Formatted date: ${formattedDate}\n`);
                            return formattedDate;
                          } catch (error) {
                            console.error(`❌ Date parsing error for patient ${patient.patient_id}:`, error);
                            return 'Date Error';
                          }
                        }
                        
                        console.log(`⚠️ No date found - returning 'Never'\n`);
                        return 'Never';
                      })()}
                    </td>
                    <td className="p-4">
                      <div className="flex space-x-2">
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
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleVisitAgain(patient);
                          }}
                          className="bg-orange-600 text-white px-2 py-1 rounded text-xs hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500"
                          title="New Visit for Existing Patient"
                        >
                          🔄 Visit Again
                        </button>
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
                            <option value="">📝 Prescription</option>
                            <option value="valant">Valant Template</option>
                            <option value="vh">V+H Template</option>
                          </select>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleShiftToIPD(patient);
                          }}
                          className="bg-teal-600 text-white px-2 py-1 rounded text-xs hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-500"
                          title="Shift Patient to IPD"
                          disabled={patient.ipd_status === 'ADMITTED'}
                        >
                          🏥 Shift to IPD
                        </button>
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
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
import { usePermissions, useAuth } from '../contexts/AuthContext';
import { supabase } from '../config/supabase';

interface PatientHistoryModalProps {
  patient: PatientWithRelations;
  isOpen: boolean;
  onClose: () => void;
  onPatientUpdated?: () => void;
}

const PatientHistoryModal: React.FC<PatientHistoryModalProps> = ({ patient, isOpen, onClose, onPatientUpdated }) => {
  const { printServiceReceipt } = useReceiptPrinting();
  const { user } = useAuth();
  const [deletingTransactionId, setDeletingTransactionId] = useState<string | null>(null);
  const [selectedTransactions, setSelectedTransactions] = useState<Set<string>>(new Set());
  const [selectAll, setSelectAll] = useState(false);
  const [showTransactionPrescription, setShowTransactionPrescription] = useState(false);
  const [selectedPatientForPrescription, setSelectedPatientForPrescription] = useState<PatientWithRelations | null>(null);
  const [selectedTransactionForPrescription, setSelectedTransactionForPrescription] = useState<any>(null);
  const [selectedPrescriptionType, setSelectedPrescriptionType] = useState<'VH' | 'VALANT'>('VH');

  // Close dropdown when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest('.prescription-dropdown-container')) {
        // Close all dropdowns
        const dropdowns = document.querySelectorAll('[id^="prescription-dropdown-"]');
        dropdowns.forEach(dropdown => {
          (dropdown as HTMLElement).style.display = 'none';
        });
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const printPrescriptionForTransaction = async (patient: PatientWithRelations, transaction: any, prescriptionType: 'VH' | 'VALANT') => {
    // Debug: Log transaction data to see available fields
    console.log('🔍 Transaction data for prescription:', transaction);
    console.log('🏥 Available transaction fields:', Object.keys(transaction));
    
    // Enhanced doctor information resolution
    let finalDoctorName = '';
    let finalDepartment = '';
    let doctorDegree = '';
    let doctorSpecialization = '';
    
    // Priority 1: Use transaction doctor_name and department if available
    if (transaction.doctor_name && transaction.doctor_name.trim()) {
      finalDoctorName = transaction.doctor_name.trim();
      console.log('✅ Using transaction doctor_name:', finalDoctorName);
    }
    
    if (transaction.department && transaction.department.trim()) {
      finalDepartment = transaction.department.trim();
      console.log('✅ Using transaction department:', finalDepartment);
    }
    
    // Priority 2: If transaction has doctor_id, try to get complete doctor info
    if (transaction.doctor_id && (!finalDoctorName || !finalDepartment)) {
      try {
        console.log('🔍 Fetching doctor details for doctor_id:', transaction.doctor_id);
        const { data: doctorInfo, error } = await supabase
          .from('doctors')
          .select('name, department, degree, specialization')
          .eq('id', transaction.doctor_id)
          .single();
          
        if (doctorInfo && !error) {
          finalDoctorName = finalDoctorName || doctorInfo.name || '';
          finalDepartment = finalDepartment || doctorInfo.department || '';
          doctorDegree = doctorInfo.degree || '';
          doctorSpecialization = doctorInfo.specialization || '';
          console.log('✅ Enhanced with doctor table data:', doctorInfo);
        } else if (error) {
          console.log('⚠️ Error fetching doctor details:', error);
        }
      } catch (error) {
        console.log('⚠️ Could not fetch doctor details from doctor_id:', error);
      }
    }
    
    // Priority 3: Fall back to patient assigned doctor/department
    if (!finalDoctorName && patient.assigned_doctor) {
      finalDoctorName = patient.assigned_doctor;
      console.log('🔄 Fallback to patient assigned_doctor:', finalDoctorName);
    }
    
    if (!finalDepartment && patient.assigned_department) {
      finalDepartment = patient.assigned_department;
      console.log('🔄 Fallback to patient assigned_department:', finalDepartment);
    }
    
    // Priority 4: Final fallback to patient doctor_name field
    if (!finalDoctorName && patient.doctor_name) {
      finalDoctorName = patient.doctor_name;
      console.log('🔄 Final fallback to patient doctor_name:', finalDoctorName);
    }
    
    console.log('🎯 FINAL Doctor resolution:', {
      transaction_doctor_name: transaction.doctor_name,
      transaction_department: transaction.department,
      transaction_doctor_id: transaction.doctor_id,
      patient_assigned_doctor: patient.assigned_doctor,
      patient_assigned_department: patient.assigned_department,
      FINAL_doctor_name: finalDoctorName,
      FINAL_department: finalDepartment,
      doctor_degree: doctorDegree,
      doctor_specialization: doctorSpecialization
    });
    
    // Create enhanced patient object with transaction-specific doctor details
    const patientForPrescription = {
      ...patient,
      currentTransactionId: transaction.id,
      currentTransactionDate: transaction.created_at || transaction.transaction_date,
      currentTransactionType: transaction.transaction_type,
      currentTransactionAmount: transaction.amount,
      // Override doctor details with transaction-specific information
      assigned_doctor: finalDoctorName,
      doctor_name: finalDoctorName, // For compatibility with different prescription templates
      assigned_department: finalDepartment,
      doctor_degree: doctorDegree,
      doctor_specialization: doctorSpecialization,
      // Add the transaction info for reference
      transaction_details: {
        type: transaction.transaction_type,
        date: transaction.transaction_date,
        amount: transaction.amount,
        description: transaction.description
      }
    };
    
    console.log('🎯 Final patient data for prescription:', {
      assigned_doctor: patientForPrescription.assigned_doctor,
      doctor_name: patientForPrescription.doctor_name,
      assigned_department: patientForPrescription.assigned_department,
      doctor_degree: patientForPrescription.doctor_degree,
      doctor_specialization: patientForPrescription.doctor_specialization
    });
    
    setSelectedPatientForPrescription(patientForPrescription);
    setSelectedTransactionForPrescription(transaction);
    setSelectedPrescriptionType(prescriptionType);
    setShowTransactionPrescription(true);
  };
  
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

    // Default hospital information (same as main receipt)
    const DEFAULT_HOSPITAL_INFO = {
      name: '',
      address: '10, Madhav Vihar Shobhagpura, Udaipur (313001)', 
      phone: '+91 9119118000',
      email: 'valanthospital@gmail.com',
      registration: '',
      gst: '',
      website: 'www.valanthospital.com'
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
      charges: selectedTransactionsData.map(transaction => {
        // Extract original amount and discount from description if present
        const description = transaction.description || transaction.transaction_type;
        let originalAmount = transaction.amount;
        let discountPercentage = transaction.discount_percentage || 0;
        
        // Extract original amount from description like "Original: ₹750"
        const originalMatch = description.match(/Original:\s*₹?([\d,]+(?:\.\d{2})?)/);
        if (originalMatch) {
          originalAmount = parseFloat(originalMatch[1].replace(/,/g, ''));
        }
        
        // Extract discount percentage from description like "Discount: 100%"
        const discountMatch = description.match(/Discount:\s*(\d+)%/);
        if (discountMatch) {
          discountPercentage = parseInt(discountMatch[1]);
        }
        
        // Clean description - remove discount details and just keep service name and date
        let cleanDescription = description
          .replace(/\s*\|\s*Original:\s*₹[\d,]+(\.\d{2})?\s*\|\s*Discount:\s*\d+%\s*\(₹[\d,]+(\.\d{2})?\)\s*\|\s*Net:\s*₹[\d,]+(\.\d{2})?.*/g, '')
          .replace(/\s*\(Original:\s*₹[\d,]+,\s*Discount:\s*\d+%,\s*Final:\s*₹[\d,]+\)/g, '')
          .trim();
        
        // Add just the date to the service name
        const dateStr = new Date(transaction.created_at).toLocaleDateString('en-IN');
        cleanDescription = cleanDescription + ` (${dateStr})`;
        
        return {
          description: cleanDescription,
          amount: transaction.amount, // Net amount after discount
          rate: originalAmount, // Original amount before discount
          quantity: 1,
          discountPercentage: discountPercentage
        };
      }),
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

    // Print receipt in new window (same logic as prescriptions)
    const printCombinedReceipt = (data: ReceiptData) => {
      // Create a temporary container to render the ReceiptTemplate to HTML
      const tempContainer = document.createElement('div');
      tempContainer.style.position = 'absolute';
      tempContainer.style.left = '-9999px';
      document.body.appendChild(tempContainer);
      
      const root = createRoot(tempContainer);
      
      // Render the ReceiptTemplate to get HTML
      root.render(<ReceiptTemplate data={data} />);
      
      // Wait for rendering to complete, then create custom HTML
      setTimeout(() => {
        // Clean up the temporary container
        root.unmount();
        document.body.removeChild(tempContainer);
        
        // Create custom receipt HTML with logo and proper columns
        const receiptHTML = `
          <div class="receipt-template bg-white p-6 max-w-4xl mx-auto">
            <div class="receipt-header">
              <img src="/logo.png" alt="Hospital Logo" class="receipt-logo">
              <div class="receipt-title">SERVICE RECEIPT</div>
              <div class="hospital-details">
                ${data.hospital.address}<br>
                Phone: ${data.hospital.phone} | Email: ${data.hospital.email}<br>
                Website: ${data.hospital.website}
              </div>
            </div>
            
            <div class="grid grid-cols-2 gap-4 mb-4">
              <div>
                <div class="font-semibold mb-2">Patient Details:</div>
                <div class="space-y-1 text-sm">
                  <div><strong>Name:</strong> ${data.patient.name}</div>
                  <div><strong>Phone:</strong> ${data.patient.phone || 'N/A'}</div>
                  <div><strong>Age:</strong> ${data.patient.age || 'N/A'} | <strong>Gender:</strong> ${data.patient.gender || 'N/A'}</div>
                </div>
              </div>
              <div class="text-right">
                <div class="font-semibold mb-2">Receipt Details:</div>
                <div class="space-y-1 text-sm">
                  <div><strong>Receipt No:</strong> ${data.receiptNumber}</div>
                  <div><strong>Date:</strong> ${data.date}</div>
                  <div><strong>Time:</strong> ${data.time}</div>
                </div>
              </div>
            </div>
            
            <table class="w-full border mb-4">
              <thead>
                <tr class="bg-gray-50">
                  <th class="border px-2 py-2 text-left">S.No.</th>
                  <th class="border px-2 py-2 text-left">Service</th>
                  <th class="border px-2 py-2 text-center">Qty</th>
                  <th class="border px-2 py-2 text-right">Rate (₹)</th>
                  <th class="border px-2 py-2 text-right">Discount</th>
                  <th class="border px-2 py-2 text-right">Amount (₹)</th>
                </tr>
              </thead>
              <tbody>
                ${data.charges.map((charge, index) => `
                  <tr>
                    <td class="border px-2 py-2 text-center">${index + 1}</td>
                    <td class="border px-2 py-2">${charge.description}</td>
                    <td class="border px-2 py-2 text-center">${charge.quantity || 1}</td>
                    <td class="border px-2 py-2 text-right">₹${(charge.rate || charge.amount).toLocaleString()}</td>
                    <td class="border px-2 py-2 text-right">${charge.discountPercentage ? charge.discountPercentage + '%' : '-'}</td>
                    <td class="border px-2 py-2 text-right">₹${charge.amount.toLocaleString()}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
            
            <div class="flex justify-end mb-4">
              <div class="w-64">
                <div class="flex justify-between py-1 text-sm">
                  <span>Subtotal:</span>
                  <span>₹${data.totals.subtotal.toLocaleString()}</span>
                </div>
                ${data.totals.discount > 0 ? `
                <div class="flex justify-between py-1 text-sm">
                  <span>Total Discount:</span>
                  <span>₹${data.totals.discount.toLocaleString()}</span>
                </div>
                ` : ''}
                <div class="flex justify-between py-2 text-lg font-bold border-t">
                  <span>Total Amount:</span>
                  <span>₹${data.totals.netAmount.toLocaleString()}</span>
                </div>
              </div>
            </div>
            
            <div class="text-center text-sm text-gray-600 mt-6">
              ${data.notes || 'Thank you for choosing our services!'}
            </div>
          </div>
        `;
        
        // Create the complete HTML for the new window with full CSS
        const printContent = `
          <!DOCTYPE html>
          <html lang="en">
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Receipt - ${data.receiptNumber}</title>
            <style>
              /* Base styles */
              * {
                box-sizing: border-box;
              }
              body {
                margin: 0;
                padding: 20px;
                font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                background: white;
                color: #1f2937;
                line-height: 1.5;
              }
              
              /* Tailwind-like utility classes */
              .bg-white { background-color: white; }
              .p-6 { padding: 16px; }
              .max-w-4xl { max-width: 896px; }
              .mx-auto { margin-left: auto; margin-right: auto; }
              .text-center { text-align: center; }
              .text-left { text-align: left; }
              .text-right { text-align: right; }
              .font-bold { font-weight: 700; }
              .font-semibold { font-weight: 600; }
              .text-sm { font-size: 12px; }
              .text-xs { font-size: 11px; }
              .text-lg { font-size: 16px; }
              .text-xl { font-size: 18px; }
              .text-2xl { font-size: 20px; }
              .text-gray-600 { color: #4b5563; }
              .text-gray-800 { color: #1f2937; }
              .border { border: 1px solid #d1d5db; }
              .border-t { border-top: 1px solid #d1d5db; }
              .border-b { border-bottom: 1px solid #d1d5db; }
              .border-black { border-color: #000; }
              .mb-1 { margin-bottom: 2px; }
              .mb-2 { margin-bottom: 6px; }
              .mb-4 { margin-bottom: 12px; }
              .mb-6 { margin-bottom: 16px; }
              .mt-4 { margin-top: 12px; }
              .mt-6 { margin-top: 16px; }
              .py-1 { padding-top: 3px; padding-bottom: 3px; }
              .py-2 { padding-top: 6px; padding-bottom: 6px; }
              .px-2 { padding-left: 6px; padding-right: 6px; }
              .px-4 { padding-left: 12px; padding-right: 12px; }
              .w-full { width: 100%; }
              .w-64 { width: 256px; }
              .flex { display: flex; }
              .justify-between { justify-content: space-between; }
              .justify-end { justify-content: flex-end; }
              .items-center { align-items: center; }
              .space-y-1 > * + * { margin-top: 2px; }
              .space-y-2 > * + * { margin-top: 6px; }
              .grid { display: grid; }
              .grid-cols-2 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
              .grid-cols-3 { grid-template-columns: repeat(3, minmax(0, 1fr)); }
              .gap-4 { gap: 12px; }
              .uppercase { text-transform: uppercase; }
              .bg-gray-50 { background-color: #f9fafb; }
              
              /* Table styles */
              table {
                width: 100%;
                border-collapse: collapse;
                margin: 10px 0;
              }
              th, td {
                padding: 4px 6px;
                text-align: left;
                border: 1px solid #d1d5db;
                font-size: 11px;
              }
              th {
                background-color: #f9fafb;
                font-weight: 600;
              }
              .text-right { text-align: right; }
              .text-center { text-align: center; }
              
              /* Receipt specific styles */
              .receipt-header {
                text-align: center;
                border-bottom: 2px solid #000;
                padding-bottom: 12px;
                margin-bottom: 16px;
              }
              .receipt-logo {
                max-width: 150px;
                height: auto;
                margin: 0 auto 8px auto;
                display: block;
              }
              .receipt-title {
                font-size: 20px;
                font-weight: bold;
                margin: 4px 0;
              }
              .hospital-details {
                font-size: 11px;
                color: #4b5563;
                line-height: 1.3;
              }
              
              /* Print buttons */
              .print-buttons {
                position: fixed;
                top: 10px;
                right: 10px;
                z-index: 1000;
                background: white;
                padding: 10px;
                border-radius: 5px;
                box-shadow: 0 2px 10px rgba(0,0,0,0.1);
              }
              .btn {
                padding: 8px 16px;
                margin: 0 5px;
                border: none;
                border-radius: 4px;
                cursor: pointer;
                font-size: 14px;
              }
              .btn-primary {
                background-color: #0056b3;
                color: white;
              }
              .btn-secondary {
                background-color: #6c757d;
                color: white;
              }
              .btn:hover {
                opacity: 0.8;
              }
              
              /* Print styles */
              @media print {
                @page {
                  margin: 0.5in;
                  size: A4;
                }
                body {
                  margin: 0;
                  padding: 0;
                }
                .print-buttons {
                  display: none !important;
                }
                .receipt-template {
                  page-break-before: always;
                  background: white !important;
                  padding: 20px !important;
                }
                body * {
                  visibility: hidden;
                }
                .receipt-template, .receipt-template * {
                  visibility: visible !important;
                  opacity: 1 !important;
                }
                .receipt-template {
                  position: absolute;
                  left: 0;
                  top: 0;
                  width: 100%;
                }
              }
            </style>
          </head>
          <body>
            <div class="print-buttons">
              <button class="btn btn-primary" onclick="window.print()">🖨️ Print</button>
              <button class="btn btn-secondary" onclick="window.close()">Close</button>
            </div>
            ${receiptHTML}
            <script>
              window.focus();
            </script>
          </body>
          </html>
        `;

        // Open in new window (same as prescriptions)
        const printWindow = window.open('', '_blank');
        if (printWindow) {
          printWindow.document.write(printContent);
          printWindow.document.close();
        } else {
          toast.error('Please allow popups to print receipts');
        }
      }, 100);
    };

    printCombinedReceipt(receiptData);
    toast.success(`Generated combined receipt for ${selectedTransactionsData.length} transactions`);
  };

  const handleDeleteTransaction = async (transactionId: string, description: string, amount: number) => {
    if (!confirm(`Are you sure you want to permanently delete this transaction?\n\n"${description}"\nAmount: ₹${amount.toLocaleString()}\n\nThis action cannot be undone and will remove the transaction from all records.`)) {
      return;
    }

    try {
      setDeletingTransactionId(transactionId);
      
      // Permanently delete the transaction
      await HospitalService.deleteTransaction(transactionId);
      
      toast.success('Transaction deleted permanently from all records.');
      
      // Remove the deleted transaction from the current patient's transaction list
      const updatedTransactions = patient.transactions?.filter(t => t.id !== transactionId) || [];
      const updatedPatient = {
        ...patient,
        transactions: updatedTransactions,
        // Recalculate totals
        totalSpent: updatedTransactions
          .filter(t => t.status !== 'CANCELLED')
          .reduce((sum, t) => sum + (t.amount || 0), 0),
        visitCount: updatedTransactions.filter(t => 
          t.transaction_type === 'ENTRY_FEE' || 
          t.transaction_type === 'entry_fee' ||
          t.transaction_type === 'CONSULTATION' ||
          t.transaction_type === 'consultation'
        ).length || 1
      };
      
      // Update the patient in the parent component's state
      patient.transactions = updatedTransactions;
      patient.totalSpent = updatedPatient.totalSpent;
      patient.visitCount = updatedPatient.visitCount;
      
      // Trigger dashboard refresh to update totals everywhere
      window.dispatchEvent(new Event('transactionUpdated'));
      
      // Trigger patient list refresh to update the main list
      if (onPatientUpdated) {
        onPatientUpdated();
      }
      
      // Don't close the modal - let user continue viewing/managing transactions
      toast.info('You can continue managing transactions or close this window.');
      
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
          <h2 className="text-2xl font-bold" style={{ color: '#0056B3' }}>
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
          <h3 className="text-lg font-semibold mb-3" style={{ color: '#0056B3' }}>Patient Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div><span className="font-medium">ID:</span> {patient.patient_id}</div>
            <div><span className="font-medium">Phone:</span> {patient.phone || 'Not provided'}</div>
            <div><span className="font-medium">Email:</span> {patient.email || 'Not provided'}</div>
            <div><span className="font-medium">Gender:</span> {patient.gender === 'MALE' ? 'Male (M)' : patient.gender === 'FEMALE' ? 'Female (F)' : patient.gender || 'Not specified'}</div>
            <div><span className="font-medium">Date of Birth:</span> {patient.date_of_birth || 'Not provided'}</div>
            {(patient.patient_tag || patient.notes) && (
              <div><span className="font-medium">Patient Tag:</span> 
                <span className="ml-2 bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full text-xs">
                  {patient.patient_tag || patient.notes}
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
            <h3 className="text-lg font-semibold" style={{ color: '#0056B3' }}>Transaction History ({transactions.length})</h3>
            
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
                    <th className="text-left p-2">Discount</th>
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
                      <td className="p-2">{(() => {
                        // Clean description by removing discount information
                        let cleanDescription = transaction.description || '';
                        // Remove patterns like "| Original: ₹750 | Discount: 100% (₹750.00) | Net: ₹0.00"
                        cleanDescription = cleanDescription.replace(/\s*\|\s*Original:\s*₹[\d,]+(\.\d{2})?\s*\|\s*Discount:\s*\d+%\s*\(₹[\d,]+(\.\d{2})?\)\s*\|\s*Net:\s*₹[\d,]+(\.\d{2})?.*/g, '');
                        // Remove patterns like "(Original: ₹1,500, Discount: 10%, Final: ₹1,350)"
                        cleanDescription = cleanDescription.replace(/\s*\(Original:\s*₹[\d,]+,\s*Discount:\s*\d+%,\s*Final:\s*₹[\d,]+\)/g, '');
                        return cleanDescription.trim();
                      })()}</td>
                      <td className="p-2">
                        <span className={transaction.amount >= 0 ? 'text-green-600' : 'text-red-600'}>
                          ₹{Math.abs(transaction.amount).toLocaleString()}
                        </span>
                      </td>
                      <td className="p-2">{(() => {
                        // Use discount_percentage field if available, otherwise extract from description
                        if (transaction.discount_percentage !== undefined && transaction.discount_percentage > 0) {
                          return `${transaction.discount_percentage}%`;
                        }
                        const description = transaction.description || '';
                        const discountMatch = description.match(/Discount:\s*(\d+)%/);
                        return discountMatch ? `${discountMatch[1]}%` : '-';
                      })()}</td>
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
                          {transaction.status === 'COMPLETED' && (
                            <div className="relative inline-block prescription-dropdown-container">
                              <button
                                onClick={() => {
                                  const dropdownId = `prescription-dropdown-${transaction.id}`;
                                  const dropdown = document.getElementById(dropdownId);
                                  if (dropdown) {
                                    dropdown.style.display = dropdown.style.display === 'none' ? 'block' : 'none';
                                  }
                                }}
                                className="bg-blue-500 text-white px-2 py-1 rounded text-xs hover:bg-blue-600 flex items-center"
                                title="Print Prescription"
                              >
                                📋 ▼
                              </button>
                              <div
                                id={`prescription-dropdown-${transaction.id}`}
                                className="absolute top-8 left-0 bg-white border border-gray-300 rounded shadow-lg z-50"
                                style={{ display: 'none', minWidth: '80px' }}
                              >
                                <button
                                  onClick={async () => {
                                    await printPrescriptionForTransaction(patient, transaction, 'VH');
                                    document.getElementById(`prescription-dropdown-${transaction.id}`)!.style.display = 'none';
                                  }}
                                  className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 border-b"
                                >
                                  VH
                                </button>
                                <button
                                  onClick={async () => {
                                    await printPrescriptionForTransaction(patient, transaction, 'VALANT');
                                    document.getElementById(`prescription-dropdown-${transaction.id}`)!.style.display = 'none';
                                  }}
                                  className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100"
                                >
                                  V
                                </button>
                              </div>
                            </div>
                          )}
                          {transaction.status !== 'CANCELLED' && user?.email !== 'frontdesk@valant.com' && (
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

      {/* Transaction-specific Prescription Modal */}
      {showTransactionPrescription && selectedPatientForPrescription && (
        <>
          {selectedPrescriptionType === 'VH' ? (
            <VHPrescription
              patient={selectedPatientForPrescription}
              onClose={() => {
                setShowTransactionPrescription(false);
                setSelectedPatientForPrescription(null);
                setSelectedTransactionForPrescription(null);
              }}
            />
          ) : (
            <ValantPrescription
              patient={selectedPatientForPrescription}
              onClose={() => {
                setShowTransactionPrescription(false);
                setSelectedPatientForPrescription(null);
                setSelectedTransactionForPrescription(null);
              }}
            />
          )}
        </>
      )}
    </div>
  );
};

interface ComprehensivePatientListProps {
  onNavigate?: (tab: string) => void;
}

const ComprehensivePatientList: React.FC<ComprehensivePatientListProps> = ({ onNavigate }) => {
  const { hasPermission } = usePermissions();
  const { user } = useAuth();
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

  const [dateRange, setDateRange] = useState<'all' | 'today' | 'week' | 'month' | 'custom'>('today');
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

  // Helper function to get the most recent payment mode (simplified to Cash/Online only)
  const getRecentPaymentMode = (patient: PatientWithRelations) => {
    if (!patient.transactions || patient.transactions.length === 0) {
      console.log(`No transactions for patient ${patient.first_name} ${patient.last_name}`);
      return null;
    }

    console.log(`Patient ${patient.first_name} ${patient.last_name} has ${patient.transactions.length} transactions`);
    
    const completedTransactions = patient.transactions.filter(t => t.status === 'COMPLETED' && t.payment_mode);
    console.log(`Completed transactions with payment_mode:`, completedTransactions.map(t => ({
      id: t.id,
      payment_mode: t.payment_mode,
      status: t.status,
      created_at: t.created_at,
      transaction_date: t.transaction_date
    })));

    // Get the most recent completed transaction with payment mode
    const recentTransaction = completedTransactions
      .sort((a, b) => {
        const dateA = new Date(a.created_at || a.transaction_date || '');
        const dateB = new Date(b.created_at || b.transaction_date || '');
        return dateB.getTime() - dateA.getTime();
      })[0];

    if (!recentTransaction?.payment_mode) {
      console.log(`No recent transaction with payment_mode found`);
      return null;
    }
    
    console.log(`Recent transaction payment_mode: "${recentTransaction.payment_mode}"`);
    
    // Normalize payment mode comparison - handle both uppercase and lowercase
    const paymentMode = recentTransaction.payment_mode?.toLowerCase();
    const result = paymentMode === 'cash' ? 'Cash' : 'Online';
    
    console.log(`Normalized payment_mode: "${paymentMode}" -> Returning: ${result}`);
    return result;
  };

  useEffect(() => {
    console.log('🔄 PatientList useEffect triggered:', { dateRange, startDate, endDate, selectedDate });
    console.log('📊 Current component state:', {
      dateRange,
      isDefaultToday: dateRange === 'today',
      todayDate: getLocalDateString(),
      selectedDate,
      startDate,
      endDate
    });
    loadPatients();
  }, [dateRange, startDate, endDate, selectedDate]);

  useEffect(() => {
    console.log('📅 PatientList dateRange changed to:', dateRange);
    // Update date range when dateRange changes
    const today = new Date();
    switch (dateRange) {
      case 'today':
        const todayStr = getLocalDateString(today);
        console.log('📅 Setting today date to:', todayStr);
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
      console.log('🔄 loadPatients called with:', { dateRange, selectedDate, startDate, endDate });
      setLoading(true);
      
      let patientsData;
      
      // Use backend filtering for 'today' and single custom dates to get exact results
      if (dateRange === 'today') {
        const todayStr = selectedDate || getLocalDateString();
        console.log('📅 Loading TODAY patients for date:', todayStr);
        
        // Always use the backend method with error handling
        patientsData = await HospitalService.getPatientsForDate(todayStr, 500);
        
        // Debug the returned patients
        console.log('✅ Loaded', patientsData.length, 'patients for today');
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
      
      // Debug patient_tag data (minimal logging)
      if (patientsData.length > 0) {
        console.log('🔍 Patients loaded:', patientsData.length);
        console.log('✅ SUCCESS: Today filter loaded', patientsData.length, 'patients for date:', dateRange === 'today' ? selectedDate : 'NOT TODAY');
      } else {
        console.log('⚠️ WARNING: No patients found for today filter');
      }

      // Calculate totalSpent based on selected date filter
      const filteredPatientsData = patientsData.map(patient => {
        const transactions = patient.transactions || [];
        let filteredTransactions = transactions.filter((t: any) => t.status !== 'CANCELLED');
        
        // Filter transactions based on the selected date range
        if (dateRange !== 'all') {
          filteredTransactions = filteredTransactions.filter((t: any) => {
            const transactionDate = t.transaction_date || new Date(t.created_at).toISOString().split('T')[0];
            
            if (dateRange === 'today') {
              const targetDate = selectedDate || getLocalDateString();
              return transactionDate === targetDate;
            } else if (dateRange === 'custom') {
              return transactionDate === startDate;
            } else if (dateRange === 'week' || dateRange === 'month') {
              return transactionDate >= startDate && transactionDate <= endDate;
            }
            return true;
          });
        }
        
        // Recalculate totalSpent based on filtered transactions
        const filteredTotalSpent = filteredTransactions.reduce((sum: number, t: any) => sum + (t.amount || 0), 0);
        
        return {
          ...patient,
          totalSpent: filteredTotalSpent // Override with filtered total
        };
      });
      
      setPatients(filteredPatientsData);
      
      // Force re-sorting after patients are loaded to ensure date-based order is correct
      // This is important when back-dated entries are loaded
      
      // Extract unique tags from patients for filter dropdown (check both patient_tag and notes)
      const uniqueTags = [...new Set([
        ...patientsData
          .map(p => p.patient_tag)
          .filter(tag => tag && tag.trim() !== ''),
        ...patientsData
          .map(p => p.notes)
          .filter(note => note && note.trim() !== ''),
        'Community', 'Camp'
      ])].sort();
      
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
      filtered = filtered.filter(patient => 
        patient.patient_tag === filterTag || patient.notes === filterTag
      );
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
        
        // Debug patient_tag data
        console.log(`📊 Excel Export Debug - Patient: ${patient.first_name} ${patient.last_name}`, {
          patient_tag: patient.patient_tag,
          patient_tag_type: typeof patient.patient_tag,
          patient_tag_exists: patient.patient_tag !== undefined,
          patient_tag_value: patient.patient_tag || 'EMPTY/NULL'
        });
        
        // Debug registration date formatting
        const regDate = patient.created_at || '';
        const formattedRegDate = formatDate(regDate);
        
        // Get doctor information
        const doctorName = patient.assigned_doctor || 
                          (patient.assigned_doctors && patient.assigned_doctors.length > 0 ? 
                           patient.assigned_doctors[0].name : '') || '';
        const department = patient.assigned_department || 
                          (patient.assigned_doctors && patient.assigned_doctors.length > 0 ? 
                           patient.assigned_doctors[0].department : '') || '';

        // Format dates with better handling
        const lastVisitDate = patient.lastVisit || patient.date_of_entry || patient.created_at || '';
        const registrationDate = patient.created_at || patient.date_of_entry || '';

        return {
          patient_id: patient.patient_id,
          first_name: patient.first_name,
          last_name: patient.last_name || "",
          phone: patient.phone || "",
          doctor_name: doctorName,
          department: department,
          gender: patient.gender === 'MALE' ? 'Male' : patient.gender === 'FEMALE' ? 'Female' : patient.gender || "",
          age: patient.age || "",
          address: patient.address || "",
          patient_tag: patient.patient_tag || patient.notes || "",
          visit_count: patient.visitCount || 0,
          department_status: (() => {
            const deptStatus = getDepartmentStatus(patient);
            return deptStatus.status;
          })(),
          total_spent: patient.totalSpent || 0,
          last_visit: lastVisitDate ? formatDate(lastVisitDate) : "No visits",
          registration_date: registrationDate ? formatDate(registrationDate) : "Unknown",
        };
      });
      
      // Debug final export data
      console.log('📊 Final Excel Export Data Sample:', exportData.slice(0, 2));

      const success = exportToExcel({
        filename: `Patient_List_${getLocalDateString()}`,
        headers: [
          "Patient ID",
          "First Name", 
          "Last Name",
          "Phone",
          "Doctor Name",
          "Department",
          "Gender",
          "Age",
          "Address", 
          "Patient Tag",
          "Visit Count",
          "Department Status",
          "Total Spent",
          "Last Visit",
          "Registration Date"
        ],
        data: exportData,
        formatters: {
          total_spent: (value) => formatCurrencyForExcel(value),
          last_visit: (value) => value ? formatDate(value) : "Never",
          registration_date: (value) => value ? formatDate(value) : "N/A"
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
    <div className="max-w-7xl mx-auto p-6 bg-gray-50 min-h-screen">
      {/* Header with Title and Stats Cards */}
      <div className="mb-8">
        {/* Title */}
        <div className="mb-6">
          <h1 className="text-4xl font-bold mb-2" style={{ color: '#0056B3' }}>Comprehensive Patient List</h1>
          {dateRange !== 'all' && (
            <div className="mt-3 text-sm text-blue-600 bg-blue-50 px-4 py-2 rounded-full inline-block">
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

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-xl shadow-lg border-l-4 border-blue-500">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-3xl font-bold text-blue-700">{patients.length}</div>
                <div className="text-blue-600 font-medium">Total Patients</div>
              </div>
              <div className="bg-blue-100 p-3 rounded-full">
                <span className="text-2xl">👥</span>
              </div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-lg border-l-4 border-green-500">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-3xl font-bold text-green-700">{filteredPatients.length}</div>
                <div className="text-green-600 font-medium">Filtered Results</div>
              </div>
              <div className="bg-green-100 p-3 rounded-full">
                <span className="text-2xl">🔍</span>
              </div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-lg border-l-4 border-purple-500">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-3xl font-bold text-purple-700">
                  ₹{patients.reduce((sum, p) => {
                    // Exclude ORTHO/DR. HEMANT patients from revenue
                    if (p.assigned_department === 'ORTHO' || p.assigned_doctor === 'DR. HEMANT') {
                      return sum;
                    }
                    return sum + (p.totalSpent || 0);
                  }, 0).toLocaleString()}
                </div>
                <div className="text-purple-600 font-medium">Total Revenue</div>
              </div>
              <div className="bg-purple-100 p-3 rounded-full">
                <span className="text-2xl">💰</span>
              </div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-lg border-l-4 border-orange-500">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-3xl font-bold text-orange-700">
                  {patients.reduce((sum, p) => sum + (p.visitCount || 0), 0)}
                </div>
                <div className="text-orange-600 font-medium">Total Visits</div>
              </div>
              <div className="bg-orange-100 p-3 rounded-full">
                <span className="text-2xl">📊</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white p-6 rounded-xl shadow-lg mb-8">
        <div className="flex justify-between items-start mb-4">
          <h2 className="text-xl font-semibold" style={{ color: '#0056B3' }}>Search & Filter Patients</h2>
          {/* Action Buttons - Moved to top right */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => {
                console.log('🔄 REFRESH BUTTON CLICKED - Patient list refresh: reloading page...');
                console.log('📊 Current state before refresh:', {
                  dateRange,
                  selectedDate,
                  startDate,
                  endDate,
                  patientsCount: filteredPatients.length
                });
                window.location.reload();
              }}
              className="px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all duration-200 flex items-center gap-1"
            >
              🔄 Refresh Data
            </button>
            <button
              onClick={exportPatientsToExcel}
              disabled={filteredPatients.length === 0}
              className="px-2 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700 focus:outline-none focus:ring-1 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
              title="Export to Excel"
            >
              📊 Export
            </button>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
          {/* Search */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
            <input
              type="text"
              placeholder="Name, phone, email, or patient ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Gender Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Gender</label>
            <select
              value={filterGender}
              onChange={(e) => setFilterGender(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Genders</option>
              <option value="M">M</option>
              <option value="F">F</option>
              <option value="OTHER">Other</option>
            </select>
          </div>

          {/* TAG Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Tags</label>
            <select
              value={filterTag}
              onChange={(e) => setFilterTag(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Tags</option>
              {availableTags.map((tag) => (
                <option key={tag} value={tag}>
                  {tag}
                </option>
              ))}
            </select>
          </div>

          {/* Date Range Filter - Button Style */}
          <div className="md:col-span-6">
            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex items-center gap-2">
                🔽 <span className="text-sm font-medium text-gray-700">Filter by Date:</span>
              </div>
              <div className="flex gap-2 flex-wrap items-center">
                <button
                  onClick={() => setDateRange('all')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    dateRange === 'all' 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  All Time
                </button>
                <button
                  onClick={() => setDateRange('today')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    dateRange === 'today' 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Today
                </button>
                <button
                  onClick={() => setDateRange('week')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    dateRange === 'week' 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Last 7 Days
                </button>
                <button
                  onClick={() => setDateRange('month')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    dateRange === 'month' 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  This Month
                </button>
                <button
                  onClick={() => setDateRange('custom')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    dateRange === 'custom' 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Custom Range
                </button>

                {/* Inline Date Picker for Today */}
                {dateRange === 'today' && (
                  <>
                    <div className="flex items-center gap-2">
                      <ModernDatePicker
                        label=""
                        value={selectedDate}
                        onChange={(date) => setSelectedDate(date)}
                        placeholder="DD/MM/YYYY"
                      />
                      <button
                        onClick={() => {
                          const todayDate = getLocalDateString();
                          setSelectedDate(todayDate);
                          setTimeout(() => {
                            loadPatients();
                          }, 100);
                        }}
                        className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 whitespace-nowrap"
                        title="Set to today's date"
                      >
                        📅 Today
                      </button>
                    </div>
                  </>
                )}

                {/* Inline Date Picker for Custom */}
                {dateRange === 'custom' && (
                  <div className="flex items-center">
                    <ModernDatePicker
                      label=""
                      value={startDate}
                      onChange={(date) => {
                        setStartDate(date);
                        setEndDate(date);
                      }}
                      placeholder="DD/MM/YYYY"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Patient List */}
      {filteredPatients.length > 0 ? (
        <div>
          {/* Sort Options */}
          <div className="mb-6 bg-white p-4 rounded-xl shadow-sm">
            <div className="flex flex-wrap items-center gap-4">
              <span className="font-medium text-gray-700">Sort by:</span>
              <button
                onClick={() => handleSort('name')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  sortBy === 'name' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Patient Name {getSortIcon('name')}
              </button>
              <button
                onClick={() => handleSort('date')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  sortBy === 'date' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Last Visit {getSortIcon('date')}
              </button>
              <button
                onClick={() => handleSort('visits')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  sortBy === 'visits' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Visits {getSortIcon('visits')}
              </button>
              <button
                onClick={() => handleSort('spent')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  sortBy === 'spent' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Total Spent {getSortIcon('spent')}
              </button>
            </div>
          </div>

          {/* Patient Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPatients.map((patient) => (
              <div
                key={patient.id}
                className="bg-white rounded-xl shadow-lg border hover:shadow-xl transition-shadow duration-300 cursor-pointer"
                onClick={() => handlePatientClick(patient)}
              >
                <div className="p-6">
                  {/* Patient Header */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                        {patient.first_name.charAt(0)}{patient.last_name ? patient.last_name.charAt(0) : ''}
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold" style={{ color: '#0056B3' }}>
                          {patient.first_name} {patient.last_name}
                        </h3>
                        <p className="text-sm text-gray-500">ID: {patient.patient_id}</p>
                      </div>
                    </div>
                    <div className="flex flex-col items-end space-y-1">
                      <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-xs font-medium">
                        {patient.visitCount || 0} visits
                      </span>
                      {(() => {
                        const deptStatus = getDepartmentStatus(patient);
                        return (
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${deptStatus.style}`}>
                            {deptStatus.status}
                          </span>
                        );
                      })()}
                      {(() => {
                        const paymentMode = getRecentPaymentMode(patient);
                        return paymentMode && (
                          <span className="bg-orange-100 text-orange-800 px-3 py-1 rounded-full text-xs font-medium">
                            {paymentMode}
                          </span>
                        );
                      })()}
                    </div>
                  </div>

                  {/* Patient Details */}
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center text-sm text-gray-600">
                      <span className="w-16">Age:</span>
                      <span>{patient.age || 'N/A'} yrs • {patient.gender === 'MALE' ? 'M' : patient.gender === 'FEMALE' ? 'F' : patient.gender || 'N/A'}</span>
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <span className="w-16">Phone:</span>
                      <span>{patient.phone || 'Not provided'}</span>
                    </div>
                    {patient.email && (
                      <div className="flex items-center text-sm text-gray-600">
                        <span className="w-16">Email:</span>
                        <span>{patient.email}</span>
                      </div>
                    )}
                    <div className="flex items-center text-sm text-purple-600">
                      <span className="w-16">Doctor:</span>
                      <div>
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
                            {patient.assigned_department && (
                              <div className="text-xs text-gray-600 mt-1 bg-gray-100 px-2 py-0.5 rounded inline-block">
                                {patient.assigned_department}
                              </div>
                            )}
                          </div>
                        ) : patient.assigned_doctor ? (
                          <div>
                            <span className="font-medium">👨‍⚕️ {patient.assigned_doctor}</span>
                            {patient.assigned_department && (
                              <div className="text-xs text-gray-600 mt-1 bg-gray-100 px-2 py-0.5 rounded inline-block">
                                {patient.assigned_department}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-gray-400">No doctor assigned</span>
                        )}
                      </div>
                    </div>
                    {(patient.patient_tag || patient.notes) && (
                      <div className="flex items-center text-sm">
                        <span className="w-16">Tag:</span>
                        <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-medium">
                          {patient.patient_tag || patient.notes}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Financial Info */}
                  <div className="flex justify-between items-center mb-4 p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="text-sm text-gray-600">Total Spent</p>
                      <p className="text-lg font-bold text-green-600">₹{(patient.totalSpent || 0).toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Last Visit</p>
                      <p className="text-sm font-medium text-gray-800">
                        {(() => {
                          let lastVisitDate = null;
                          
                          // Same date logic as before
                          if (patient.date_of_entry && patient.date_of_entry.trim() !== '') {
                            lastVisitDate = patient.date_of_entry;
                          } else if (patient.transactions && patient.transactions.length > 0) {
                            const activeTransactions = patient.transactions
                              .filter(t => t.status !== 'CANCELLED' && t.created_at)
                              .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
                            if (activeTransactions.length > 0) {
                              lastVisitDate = activeTransactions[0].created_at;
                            }
                          } else if (patient.lastVisit) {
                            lastVisitDate = patient.lastVisit;
                          } else if (patient.created_at) {
                            lastVisitDate = patient.created_at;
                          }
                          
                          if (lastVisitDate) {
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
                          }
                          return 'Never';
                        })()}
                      </p>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-wrap gap-2">
                    {/* Prescription */}
                    <div className="relative">
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
                          e.target.value = '';
                        }}
                        className="bg-white text-blue-600 border border-blue-200 px-3 py-2 rounded-lg text-xs hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer font-medium"
                        title="Generate Prescription"
                      >
                        <option value="">📝 Presc.</option>
                        <option value="valant">Valant Template</option>
                        <option value="vh">V+H Template</option>
                      </select>
                    </div>
                    
                    {/* Services */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleManageServices(patient);
                      }}
                      className="bg-white text-blue-600 border border-blue-200 px-3 py-2 rounded-lg text-xs hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                      title="Manage Medical Services"
                    >
                      🔬 Services
                    </button>
                    
                    {/* Edit */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEditPatient(patient);
                      }}
                      className="bg-white text-blue-600 border border-blue-200 px-3 py-2 rounded-lg text-xs hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                      title="Edit Patient Details"
                    >
                      ✏️ Edit
                    </button>
                    
                    {/* IPD */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleShiftToIPD(patient);
                      }}
                      className="bg-white text-blue-600 border border-blue-200 px-3 py-2 rounded-lg text-xs hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium disabled:opacity-50"
                      title="Shift Patient to IPD"
                      disabled={patient.ipd_status === 'ADMITTED'}
                    >
                      🏥 IPD
                    </button>
                    
                    {/* History */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePatientClick(patient);
                      }}
                      className="bg-white text-blue-600 border border-blue-200 px-3 py-2 rounded-lg text-xs hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                      title="View Patient History"
                    >
                      📋 History
                    </button>
                    
                    {/* Receipt */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleViewReceipt(patient);
                      }}
                      className="bg-white text-blue-600 border border-blue-200 px-3 py-2 rounded-lg text-xs hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                      title="View Receipt"
                    >
                      🧾 Receipt
                    </button>
                    
                    {/* Delete - Hidden for frontdesk users */}
                    {user?.email !== 'frontdesk@valant.com' && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deletePatient(patient.id, `${patient.first_name} ${patient.last_name}`);
                        }}
                        className="bg-white text-red-600 border border-red-200 px-3 py-2 rounded-lg text-xs hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500 font-medium disabled:opacity-50"
                        title="Delete patient permanently"
                        disabled={loading}
                      >
                        🗑️ Delete
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-lg border p-16 text-center">
          <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="text-4xl">👥</span>
          </div>
          <h3 className="text-2xl font-bold mb-3" style={{ color: '#0056B3' }}>No patients found</h3>
          <p className="text-lg text-gray-600 mb-6 max-w-md mx-auto">
            {searchTerm || filterGender !== 'all' || filterTag !== 'all' || dateRange !== 'all'
              ? 'Try adjusting your search criteria or filters to find more patients'
              : 'No patients have been registered yet. Start by adding your first patient'
            }
          </p>
          <div className="flex justify-center space-x-4">
            <button
              onClick={() => window.location.reload()}
              className="bg-blue-600 text-white px-6 py-3 rounded-xl hover:bg-blue-700 font-medium shadow-lg transition-all duration-200"
            >
              🔄 Refresh List
            </button>
            {searchTerm || filterGender !== 'all' || filterTag !== 'all' || dateRange !== 'all' ? (
              <button
                onClick={() => {
                  setSearchTerm('');
                  setFilterGender('all');
                  setFilterTag('all');
                  setDateRange('all');
                }}
                className="bg-gray-600 text-white px-6 py-3 rounded-xl hover:bg-gray-700 font-medium shadow-lg transition-all duration-200"
              >
                🗑️ Clear Filters
              </button>
            ) : null}
          </div>
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
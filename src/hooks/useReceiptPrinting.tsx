import React from 'react';
import { createRoot } from 'react-dom/client';
import ReceiptTemplate from '../components/receipts/ReceiptTemplate';
import type { ReceiptData } from '../components/receipts/ReceiptTemplate';
import HospitalService from '../services/hospitalService';
import { supabase } from '../config/supabaseNew';

export const useReceiptPrinting = () => {
  // Default hospital information
  const DEFAULT_HOSPITAL_INFO = {
    name: 'Healthcare Management System',
    address: 'Medical Center, Healthcare District, City - 400001',
    phone: '+91 98765 43210',
    email: 'info@healthcarecms.com',
    registration: 'MH/HC/2024/001',
    gst: '27ABCDE1234F1Z5'
  };

  const generateReceiptNumber = (type: string): string => {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    const typeCode = type.substring(0, 3).toUpperCase();
    return `${typeCode}${timestamp}${random}`;
  };

  const printReceipt = (data: ReceiptData, preview = false) => {
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

    // Render modal with receipt
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

        {/* Receipt Content with ID for print targeting */}
        <div className="p-8 print:p-6" id="receipt-content">
          <ReceiptTemplate data={data} />
        </div>
      </div>
    );
  };

  // Consultation Receipt
  const printConsultationReceipt = async (patientId: string, transactionId?: string) => {
    try {
      // Load patient data
      const patient = await HospitalService.getPatientById(patientId);
      if (!patient) throw new Error('Patient not found');

      // Load transaction data if provided
      let transaction = null;
      if (transactionId) {
        const { data, error } = await supabase
          .from('patient_transactions')
          .select('*')
          .eq('id', transactionId)
          .single();
        
        if (!error) transaction = data;
      }

      const receiptData: ReceiptData = {
        type: 'CONSULTATION',
        receiptNumber: generateReceiptNumber('CONS'),
        date: new Date().toLocaleDateString('en-IN'),
        time: new Date().toLocaleTimeString('en-IN'),
        hospital: DEFAULT_HOSPITAL_INFO,
        patient: {
          id: patient.patient_id,
          name: `${patient.first_name} ${patient.last_name || ''}`,
          age: patient.age,
          gender: patient.gender,
          phone: patient.phone,
          address: patient.address,
          bloodGroup: patient.blood_group
        },
        charges: [
          {
            description: 'Consultation Fee',
            amount: transaction?.amount || 500,
            quantity: 1
          }
        ],
        payments: transaction ? [{
          mode: transaction.payment_mode || 'CASH',
          amount: transaction.amount,
          reference: transaction.id
        }] : [],
        totals: {
          subtotal: transaction?.amount || 500,
          discount: 0,
          insurance: 0,
          netAmount: transaction?.amount || 500,
          amountPaid: transaction?.amount || 0,
          balance: transaction ? 0 : (transaction?.amount || 500)
        },
        staff: {
          processedBy: 'System User'
        },
        notes: 'Please keep this receipt for future reference.',
        isOriginal: true
      };

      printReceipt(receiptData);
    } catch (error) {
      console.error('Error printing consultation receipt:', error);
      alert('Failed to print consultation receipt. Please try again.');
    }
  };

  // Admission Receipt - DISABLED
  const printAdmissionReceipt = async (admissionId: string, receiptType: 'ADMISSION' | 'IP_STICKER' = 'ADMISSION') => {
    try {
      console.log('📋 Admission receipt printing - DISABLED (patient_admissions table removed)');
      alert('Admission receipts are temporarily disabled. The IPD system is being updated.');
      return;
      
      // DISABLED: patient_admissions table was removed during emergency rollback
      // This functionality will be restored when IPD system is fixed

      const receiptData: ReceiptData = {
        type: receiptType,
        receiptNumber: generateReceiptNumber('ADM'),
        date: new Date().toLocaleDateString('en-IN'),
        time: new Date().toLocaleTimeString('en-IN'),
        hospital: DEFAULT_HOSPITAL_INFO,
        patient: {
          id: admission.patient?.patient_id || 'N/A',
          name: `${admission.patient?.first_name || ''} ${admission.patient?.last_name || ''}`,
          age: admission.patient?.age,
          gender: admission.patient?.gender,
          phone: admission.patient?.phone,
          bloodGroup: admission.patient?.blood_group,
          history_present_illness: admission.history_present_illness,
          past_medical_history: admission.past_medical_history,
          procedure_planned: admission.procedure_planned
        },
        charges: [
          {
            description: `Bed Assignment - ${admission.bed?.bed_number || admission.bed_number || 'N/A'} (${admission.bed?.room_type || admission.room_type || 'N/A'})`,
            amount: admission.bed?.daily_rate || admission.daily_rate || 1000,
            quantity: 1
          },
          {
            description: 'Admission Fee',
            amount: 1000,
            quantity: 1
          }
        ],
        payments: [{
          mode: 'CASH',
          amount: admission.amount_paid || admission.total_amount || 0
        }],
        totals: {
          subtotal: (admission.bed?.daily_rate || admission.daily_rate || 1000) + 1000,
          discount: 0,
          insurance: 0,
          netAmount: (admission.bed?.daily_rate || admission.daily_rate || 1000) + 1000,
          amountPaid: admission.amount_paid || admission.total_amount || 0,
          balance: ((admission.bed?.daily_rate || admission.daily_rate || 1000) + 1000) - (admission.amount_paid || admission.total_amount || 0)
        },
        staff: {
          processedBy: 'IPD Staff'
        },
        notes: `Admission Date: ${admission.admission_date}\nBed: ${admission.bed?.bed_number || admission.bed_number || 'N/A'}\nRoom Type: ${admission.bed?.room_type || admission.room_type || 'N/A'}`,
        isOriginal: true
      };

      printReceipt(receiptData);
    } catch (error) {
      console.error('Error printing admission receipt:', error);
      
      // Show more specific error message
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      alert(`Failed to print admission receipt: ${errorMessage}\n\nPlease check the console for more details and try again.`);
    }
  };

  // Discharge Receipt
  const printDischargeReceipt = async (admissionId: string) => {
    try {
      console.log('🖨️ Starting discharge receipt print for admission:', admissionId);
      
      const dischargeSummary = await HospitalService.getDischargeSummaryWithBill(admissionId);
      console.log('📋 Discharge summary data received:', dischargeSummary);
      
      if (!dischargeSummary) {
        console.error('❌ No discharge summary found for admission:', admissionId);
        throw new Error('Discharge summary not found for this admission');
      }

      const receiptData: ReceiptData = {
        type: 'DISCHARGE',
        receiptNumber: generateReceiptNumber('DISCH'),
        date: new Date().toLocaleDateString('en-IN'),
        time: new Date().toLocaleTimeString('en-IN'),
        hospital: DEFAULT_HOSPITAL_INFO,
        patient: {
          id: dischargeSummary.patient?.patient_id || 'N/A',
          name: `${dischargeSummary.patient?.first_name || ''} ${dischargeSummary.patient?.last_name || ''}`,
          age: dischargeSummary.patient?.age,
          gender: dischargeSummary.patient?.gender,
          phone: dischargeSummary.patient?.phone,
          bloodGroup: dischargeSummary.patient?.blood_group
        },
        medical: {
          // Legacy fields for backward compatibility
          diagnosis: dischargeSummary.final_diagnosis,
          treatment: dischargeSummary.treatment_summary,
          condition: dischargeSummary.discharge_condition,
          followUp: dischargeSummary.follow_up_instructions,
          doctor: dischargeSummary.doctor_name,
          admissionDate: dischargeSummary.admission?.admission_date,
          dischargeDate: dischargeSummary.admission?.actual_discharge_date,
          stayDuration: dischargeSummary.bill?.stay_duration,
          
          // New comprehensive fields
          final_diagnosis: dischargeSummary.final_diagnosis,
          primary_consultant: dischargeSummary.primary_consultant,
          chief_complaints: dischargeSummary.chief_complaints,
          hopi: dischargeSummary.hopi,
          past_history: dischargeSummary.past_history,
          investigations: dischargeSummary.investigations,
          course_of_stay: dischargeSummary.course_of_stay,
          treatment_during_hospitalization: dischargeSummary.treatment_during_hospitalization,
          discharge_medication: dischargeSummary.discharge_medication,
          follow_up_on: dischargeSummary.follow_up_on,
          medications: dischargeSummary.discharge_medication
        },
        charges: [
          { description: 'Bed Charges', amount: dischargeSummary.bill?.nursing_charges || 0 },
          { description: 'Doctor Fees', amount: dischargeSummary.bill?.doctor_fees || 0 },
          { description: 'Medicine Charges', amount: dischargeSummary.bill?.medicine_charges || 0 },
          { description: 'Diagnostic Charges', amount: dischargeSummary.bill?.diagnostic_charges || 0 },
          { description: 'Operation Charges', amount: dischargeSummary.bill?.operation_charges || 0 },
          { description: 'Other Charges', amount: dischargeSummary.bill?.other_charges || 0 }
        ].filter(charge => charge.amount > 0),
        payments: [{
          mode: dischargeSummary.bill?.payment_mode || 'CASH',
          amount: dischargeSummary.bill?.amount_paid || 0
        }],
        totals: {
          subtotal: dischargeSummary.bill?.total_charges || 0,
          discount: dischargeSummary.bill?.discount_amount || 0,
          insurance: dischargeSummary.bill?.insurance_covered || 0,
          netAmount: dischargeSummary.bill?.net_amount || 0,
          amountPaid: dischargeSummary.bill?.amount_paid || 0,
          balance: (dischargeSummary.bill?.net_amount || 0) - (dischargeSummary.bill?.amount_paid || 0)
        },
        staff: {
          processedBy: dischargeSummary.created_by_user?.email || 'System'
        },
        notes: dischargeSummary.discharge_notes || 'Discharge completed successfully.',
        isOriginal: true
      };

      console.log('🎯 Prepared receipt data:', receiptData);
      console.log('🖨️ Calling printReceipt...');
      
      printReceipt(receiptData);
      console.log('✅ Print receipt call completed');
      
    } catch (error) {
      console.error('❌ Error printing discharge receipt:', error);
      console.error('Error details:', JSON.stringify(error, null, 2));
      
      // More specific error message
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      alert(`Failed to print discharge receipt: ${errorMessage}\n\nCheck the console for details.`);
    }
  };

  // Service Receipt
  const printServiceReceipt = async (transactionId: string) => {
    try {
      const { data: transaction, error } = await supabase
        .from('patient_transactions')
        .select(`
          *,
          patient:patients(*)
        `)
        .eq('id', transactionId)
        .single();

      if (error || !transaction) throw new Error('Transaction not found');

      const receiptData: ReceiptData = {
        type: 'SERVICE',
        receiptNumber: generateReceiptNumber('SERV'),
        date: new Date(transaction.created_at).toLocaleDateString('en-IN'),
        time: new Date(transaction.created_at).toLocaleTimeString('en-IN'),
        hospital: DEFAULT_HOSPITAL_INFO,
        patient: {
          id: transaction.patient?.patient_id || 'N/A',
          name: `${transaction.patient?.first_name || ''} ${transaction.patient?.last_name || ''}`,
          age: transaction.patient?.age,
          gender: transaction.patient?.gender,
          phone: transaction.patient?.phone
        },
        charges: [{
          description: transaction.description || transaction.transaction_type,
          amount: transaction.amount,
          quantity: 1
        }],
        payments: [{
          mode: transaction.payment_mode || 'CASH',
          amount: transaction.amount,
          reference: transaction.id
        }],
        totals: {
          subtotal: transaction.amount,
          discount: 0,
          insurance: 0,
          netAmount: transaction.amount,
          amountPaid: transaction.amount,
          balance: 0
        },
        staff: {
          processedBy: 'Service Staff'
        },
        isOriginal: true
      };

      printReceipt(receiptData);
    } catch (error) {
      console.error('Error printing service receipt:', error);
      alert('Failed to print service receipt. Please try again.');
    }
  };

  // Daily Summary Receipt
  const printDailySummary = async (date: string = new Date().toISOString().split('T')[0]) => {
    try {
      // Load daily transactions
      const { data: transactions, error } = await supabase
        .from('patient_transactions')
        .select('*')
        .gte('created_at', `${date}T00:00:00`)
        .lte('created_at', `${date}T23:59:59`)
        .eq('status', 'COMPLETED')
        .order('created_at', { ascending: true });

      if (error) throw error;

      const totalRevenue = transactions?.reduce((sum, t) => sum + t.amount, 0) || 0;
      const cashRevenue = transactions?.filter(t => t.payment_mode === 'CASH').reduce((sum, t) => sum + t.amount, 0) || 0;
      const onlineRevenue = transactions?.filter(t => t.payment_mode === 'ONLINE').reduce((sum, t) => sum + t.amount, 0) || 0;

      const receiptData: ReceiptData = {
        type: 'DAILY_SUMMARY',
        receiptNumber: generateReceiptNumber('DAILY'),
        date: new Date(date).toLocaleDateString('en-IN'),
        time: new Date().toLocaleTimeString('en-IN'),
        hospital: DEFAULT_HOSPITAL_INFO,
        patient: {
          id: 'SYSTEM',
          name: 'Daily Operations Summary'
        },
        charges: [
          { description: `Total Transactions (${transactions?.length || 0})`, amount: totalRevenue },
          { description: 'Cash Payments', amount: cashRevenue },
          { description: 'Online Payments', amount: onlineRevenue }
        ],
        payments: [],
        totals: {
          subtotal: totalRevenue,
          discount: 0,
          insurance: 0,
          netAmount: totalRevenue,
          amountPaid: totalRevenue,
          balance: 0
        },
        staff: {
          processedBy: 'System Generated'
        },
        notes: `Daily summary for ${new Date(date).toLocaleDateString('en-IN')}\nTotal Transactions: ${transactions?.length || 0}`,
        isOriginal: true
      };

      printReceipt(receiptData);
    } catch (error) {
      console.error('Error printing daily summary:', error);
      alert('Failed to print daily summary. Please try again.');
    }
  };

  return {
    printConsultationReceipt,
    printAdmissionReceipt,
    printDischargeReceipt,
    printServiceReceipt,
    printDailySummary,
    printReceipt // For custom receipts
  };
};

export default useReceiptPrinting;
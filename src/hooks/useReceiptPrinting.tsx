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
    const printContainer = document.createElement('div');
    document.body.appendChild(printContainer);
    
    const root = createRoot(printContainer);
    
    const handlePrint = () => {
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(`
          <!DOCTYPE html>
          <html>
            <head>
              <title>Receipt - ${data.receiptNumber}</title>
              <style>
                body { 
                  font-family: 'Courier New', monospace; 
                  margin: 0; 
                  padding: 20px;
                  font-size: 12px;
                  line-height: 1.4;
                }
                .receipt-template { 
                  max-width: 800px; 
                  margin: 0 auto; 
                }
                @media print {
                  body { padding: 0; }
                  .no-print { display: none !important; }
                  .receipt-template { 
                    box-shadow: none; 
                    border: none; 
                  }
                }
                @page {
                  size: A4;
                  margin: 0.5in;
                }
              </style>
            </head>
            <body>
              <div id="receipt-content">${printContainer.innerHTML}</div>
              <div class="no-print" style="text-align: center; margin-top: 20px;">
                <button onclick="window.print()" style="padding: 10px 20px; font-size: 16px; background: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer; margin-right: 10px;">Print</button>
                <button onclick="window.close()" style="padding: 10px 20px; font-size: 16px; background: #6c757d; color: white; border: none; border-radius: 4px; cursor: pointer;">Close</button>
              </div>
            </body>
          </html>
        `);
        printWindow.document.close();
        
        if (!preview) {
          printWindow.onload = () => {
            printWindow.print();
            printWindow.close();
          };
        }
      }
      
      // Cleanup
      setTimeout(() => {
        root.unmount();
        document.body.removeChild(printContainer);
      }, 100);
    };

    root.render(
      <div>
        <ReceiptTemplate data={data} />
        <div style={{ display: 'none' }}>
          {setTimeout(handlePrint, 100)}
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

  // Admission Receipt
  const printAdmissionReceipt = async (admissionId: string) => {
    try {
      const { data: admission, error } = await supabase
        .from('patient_admissions')
        .select(`
          *,
          patient:patients(*),
          bed:beds(*)
        `)
        .eq('id', admissionId)
        .single();

      if (error || !admission) throw new Error('Admission not found');

      const receiptData: ReceiptData = {
        type: 'ADMISSION',
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
          bloodGroup: admission.patient?.blood_group
        },
        charges: [
          {
            description: `Bed Assignment - ${admission.bed?.bed_number || 'N/A'} (${admission.bed?.room_type || 'N/A'})`,
            amount: admission.bed?.daily_rate || 0,
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
          amount: admission.amount_paid || 0
        }],
        totals: {
          subtotal: (admission.bed?.daily_rate || 0) + 1000,
          discount: 0,
          insurance: 0,
          netAmount: (admission.bed?.daily_rate || 0) + 1000,
          amountPaid: admission.amount_paid || 0,
          balance: ((admission.bed?.daily_rate || 0) + 1000) - (admission.amount_paid || 0)
        },
        staff: {
          processedBy: 'IPD Staff'
        },
        notes: `Admission Date: ${admission.admission_date}\nBed: ${admission.bed?.bed_number || 'N/A'}\nRoom Type: ${admission.bed?.room_type || 'N/A'}`,
        isOriginal: true
      };

      printReceipt(receiptData);
    } catch (error) {
      console.error('Error printing admission receipt:', error);
      alert('Failed to print admission receipt. Please try again.');
    }
  };

  // Discharge Receipt
  const printDischargeReceipt = async (admissionId: string) => {
    try {
      const dischargeSummary = await HospitalService.getDischargeSummaryWithBill(admissionId);
      
      if (!dischargeSummary) throw new Error('Discharge summary not found');

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
          diagnosis: dischargeSummary.final_diagnosis,
          treatment: dischargeSummary.treatment_summary,
          condition: dischargeSummary.discharge_condition,
          followUp: dischargeSummary.follow_up_instructions,
          doctor: dischargeSummary.doctor_name,
          admissionDate: dischargeSummary.admission?.admission_date,
          dischargeDate: dischargeSummary.admission?.actual_discharge_date,
          stayDuration: dischargeSummary.bill?.stay_duration
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

      printReceipt(receiptData);
    } catch (error) {
      console.error('Error printing discharge receipt:', error);
      alert('Failed to print discharge receipt. Please try again.');
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
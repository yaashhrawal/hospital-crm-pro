import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { Search, Download, Printer, DollarSign, Calendar, Eye, Trash2 } from 'lucide-react';
import { supabase } from '../../config/supabaseNew';
import { logger } from '../../utils/logger';
import ReceiptTemplate, { type ReceiptData } from '../receipts/ReceiptTemplate';

interface Deposit {
  id: string;
  patient_id: string;
  patientName: string;
  patientPhone: string;
  patientAge?: number;
  patientGender?: string;
  patient_id_number?: string;
  amount: number;
  transaction_reference: string;
  payment_mode: string;
  transaction_date: string;
  created_at: string;
  description: string;
  patient?: {
    id: string;
    patient_id: string;
    first_name: string;
    last_name: string;
    phone: string;
    age?: number;
    gender?: string;
    assigned_doctor?: string;
    patient_admissions?: Array<{
      admission_date: string;
      discharge_date?: string;
    }>;
  };
}

const CombinedBillingModule: React.FC = () => {
  const [deposits, setDeposits] = useState<Deposit[]>([]);
  const [filteredDeposits, setFilteredDeposits] = useState<Deposit[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadDeposits();
  }, []);

  useEffect(() => {
    filterDeposits();
  }, [deposits, searchTerm]);

  const loadDeposits = async () => {
    try {
      setLoading(true);
      logger.log('💰 Loading all deposits...');

      // Load all deposit transactions from Supabase using patient_transactions table
      const { data: transactions, error } = await supabase
        .from('patient_transactions')
        .select(`
          id,
          transaction_date,
          created_at,
          description,
          amount,
          payment_mode,
          transaction_reference,
          status,
          patient_id,
          patients (
            id,
            patient_id,
            first_name,
            last_name,
            phone,
            age,
            gender,
            assigned_doctor,
            patient_admissions (
              admission_date,
              discharge_date
            )
          )
        `)
        .in('transaction_type', ['ADMISSION_FEE', 'DEPOSIT', 'ADVANCE_PAYMENT'])
        .eq('status', 'COMPLETED')
        .order('created_at', { ascending: false });

      if (error) {
        logger.error('❌ Error loading deposits:', error);
        toast.error('Failed to load deposits');
        setLoading(false);
        return;
      }

      logger.log('✅ Loaded deposits:', transactions?.length || 0);

      // Log first transaction to see the structure
      if (transactions && transactions.length > 0) {
        logger.log('📋 Sample transaction data:', JSON.stringify(transactions[0], null, 2));
      }

      // Transform to deposit format
      const depositList: Deposit[] = (transactions || []).map(t => {
        // Handle both 'patient' and 'patients' keys (Supabase can return either)
        const patientData = t.patients || t.patient;

        logger.log('💳 Processing transaction:', {
          id: t.id,
          patient_id: t.patient_id,
          patients: t.patients,
          patient: t.patient,
          patientData: patientData,
          hasPatient: !!patientData,
          patientKeys: patientData ? Object.keys(patientData) : []
        });

        return {
          id: t.id,
          patient_id: t.patient_id,
          patientName: patientData ? `${patientData.first_name} ${patientData.last_name || ''}`.trim() : 'Unknown',
          patientPhone: patientData?.phone || 'N/A',
          patientAge: patientData?.age,
          patientGender: patientData?.gender,
          patient_id_number: patientData?.patient_id,
          amount: t.amount || 0,
          transaction_reference: t.transaction_reference || t.id,
          payment_mode: t.payment_mode || 'CASH',
          transaction_date: t.transaction_date || t.created_at?.split('T')[0],
          created_at: t.created_at,
          description: t.description || 'Advance Payment',
          patient: patientData
        };
      });

      setDeposits(depositList);
      setLoading(false);
    } catch (error) {
      logger.error('❌ Error in loadDeposits:', error);
      toast.error('Failed to load deposits');
      setLoading(false);
    }
  };

  const filterDeposits = () => {
    if (!searchTerm.trim()) {
      setFilteredDeposits(deposits);
      return;
    }

    const term = searchTerm.toLowerCase();
    const filtered = deposits.filter(deposit => {
      const patientName = (deposit.patientName || '').toLowerCase();
      const patientPhone = (deposit.patientPhone || '');
      const receiptNo = (deposit.transaction_reference || '').toLowerCase();
      const paymentMode = (deposit.payment_mode || '').toLowerCase();
      const description = (deposit.description || '').toLowerCase();

      return patientName.includes(term) ||
             patientPhone.includes(term) ||
             receiptNo.includes(term) ||
             paymentMode.includes(term) ||
             description.includes(term);
    });

    logger.log('🔍 Search results:', {
      searchTerm: term,
      totalDeposits: deposits.length,
      filteredCount: filtered.length
    });

    setFilteredDeposits(filtered);
  };

  const exportToCSV = () => {
    try {
      const headers = ['Date', 'Receipt No', 'Patient Name', 'Phone', 'Amount', 'Payment Mode', 'Description'];
      const rows = filteredDeposits.map(d => [
        new Date(d.transaction_date).toLocaleDateString('en-IN'),
        d.transaction_reference,
        d.patientName,
        d.patientPhone,
        d.amount.toFixed(2),
        d.payment_mode,
        d.description
      ]);

      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `deposits_${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);

      toast.success('Deposits exported successfully');
    } catch (error) {
      logger.error('❌ Error exporting deposits:', error);
      toast.error('Failed to export deposits');
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const printDepositReceipt = (deposit: Deposit) => {
    // Log deposit data for debugging
    logger.log('🖨️ Printing deposit:', {
      id: deposit.id,
      patient_id: deposit.patient_id,
      patient: deposit.patient,
      hasPatient: !!deposit.patient,
      patientData: deposit.patient ? {
        patient_id: deposit.patient.patient_id,
        first_name: deposit.patient.first_name,
        last_name: deposit.patient.last_name,
        phone: deposit.patient.phone,
        age: deposit.patient.age,
        gender: deposit.patient.gender,
        assigned_doctor: deposit.patient.assigned_doctor,
        patient_admissions: deposit.patient.patient_admissions
      } : null
    });

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast.error('Unable to open print window. Please check your browser popup settings.');
      return;
    }

    // Convert Receipt2.png to base64
    const convertImageToBase64 = () => {
      return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'Anonymous';
        img.onload = function() {
          const canvas = document.createElement('canvas');
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject('Could not get canvas context');
            return;
          }
          ctx.drawImage(img, 0, 0);
          const dataURL = canvas.toDataURL('image/png');
          resolve(dataURL);
        };
        img.onerror = function() {
          resolve(''); // Return empty string if image fails to load
        };
        img.src = '/Receipt2.png';
      });
    };

    const createPrintWindow = (backgroundImage: string) => {
      const convertToWords = (num: number) => {
        if (num === 0) return 'Zero Rupees Only';

        const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
        const teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
        const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

        const convertHundreds = (n: number) => {
          let result = '';
          if (n >= 100) {
            result += ones[Math.floor(n / 100)] + ' Hundred ';
            n %= 100;
          }
          if (n >= 20) {
            result += tens[Math.floor(n / 10)] + ' ';
            n %= 10;
          } else if (n >= 10) {
            result += teens[n - 10] + ' ';
            return result;
          }
          if (n > 0) {
            result += ones[n] + ' ';
          }
          return result;
        };

        let result = '';
        const crores = Math.floor(num / 10000000);
        if (crores > 0) {
          result += convertHundreds(crores) + 'Crore ';
          num %= 10000000;
        }

        const lakhs = Math.floor(num / 100000);
        if (lakhs > 0) {
          result += convertHundreds(lakhs) + 'Lakh ';
          num %= 100000;
        }

        const thousands = Math.floor(num / 1000);
        if (thousands > 0) {
          result += convertHundreds(thousands) + 'Thousand ';
          num %= 1000;
        }

        if (num > 0) {
          result += convertHundreds(num);
        }

        return result.trim() + ' Rupees Only';
      };

      const getCurrentTime = () => {
        return new Date().toLocaleTimeString('en-IN', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: true,
          timeZone: 'Asia/Kolkata'
        });
      };

      // Use the unique receipt number that was generated when the deposit was created
      const receiptNo = deposit.transaction_reference || deposit.id;

      const billHTML = `
        <!DOCTYPE html>
        <html>
          <head>
            <title>IPD Deposit Receipt - ${receiptNo}</title>
            <style>
              @media print {
                @page {
                  margin: 0 !important;
                  padding: 0 !important;
                  border: none !important;
                  size: A3 portrait;
                  width: 297mm;
                  height: 420mm;
                }
                body {
                  margin: 0 !important;
                  padding: 0 !important;
                  border: none !important;
                  width: 297mm;
                  height: 420mm;
                  -webkit-print-color-adjust: exact !important;
                  print-color-adjust: exact !important;
                  color-adjust: exact !important;
                  overflow: hidden !important;
                }
                .receipt-template * {
                  color: black !important;
                }
              }

              html, body {
                font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, 'Noto Sans', sans-serif;
                margin: 0 !important;
                padding: 0 !important;
                background: white;
                width: 297mm;
                height: 420mm;
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
                color-adjust: exact;
                overflow: hidden;
              }

              .receipt-template {
                ${backgroundImage ? `background: url('${backgroundImage}') no-repeat center top;` : ''}
                background-size: 297mm 420mm;
                width: 297mm;
                height: 420mm;
                padding: 0 !important;
                margin: 0 !important;
                position: relative;
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
                color-adjust: exact;
              }
            </style>
          </head>
          <body>
            <div class="receipt-template">

              <!-- Background Image -->
              ${backgroundImage ? `<img src="${backgroundImage}" style="
                position: absolute;
                top: 0;
                left: -10mm;
                width: 317mm;
                height: 420mm;
                z-index: 0;
                opacity: 1;
                object-fit: stretch;
              " />` : ''}

              <!-- Content positioned to align with template white area -->
              <div style="margin-top: 0; padding: 300px 30px 0 30px; position: relative; z-index: 2;">

              <!-- IPD DEPOSIT Title -->
              <div style="text-align: center; margin-bottom: 25px;">
                <h1 style="font-size: 28px; font-weight: bold; color: black; margin: 0; letter-spacing: 2px;">IPD DEPOSIT</h1>
              </div>

              <!-- Header Information -->
              <div style="display: grid; grid-template-columns: 1fr 1fr; margin-bottom: 25px; font-size: 16px; color: black;">
                <div>
                  <p style="margin: 5px 0;"><strong>RECEIPT NO:</strong> ${receiptNo}</p>
                  <p style="margin: 5px 0;"><strong>DATE:</strong> ${new Date().toLocaleDateString('en-IN')}</p>
                  <p style="margin: 5px 0;"><strong>TIME:</strong> ${getCurrentTime()}</p>
                </div>
                <div style="text-align: right;">
                  <p style="margin: 5px 0;"><strong>PAYMENT MODE:</strong> ${deposit.payment_mode || 'CASH'}</p>
                </div>
              </div>

              <!-- Patient Information -->
              <div style="margin-bottom: 30px;">
                <h3 style="font-weight: bold; margin-bottom: 15px; color: black; font-size: 18px; text-decoration: underline;">Patient Information</h3>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 25px; font-size: 16px;">
                  <div>
                    <p style="color: black; margin: 6px 0;"><strong>PATIENT ID:</strong> ${deposit.patient?.patient_id || 'N/A'}</p>
                    <p style="color: black; margin: 6px 0;"><strong>PATIENT NAME:</strong> ${deposit.patient?.first_name || ''} ${deposit.patient?.last_name || ''}</p>
                    <p style="color: black; margin: 6px 0;"><strong>AGE/SEX:</strong> ${deposit.patient?.age || 'N/A'} years / ${deposit.patient?.gender || 'N/A'}</p>
                    <p style="color: black; margin: 6px 0;"><strong>MOBILE:</strong> ${deposit.patient?.phone || 'N/A'}</p>
                    <p style="color: black; margin: 6px 0;"><strong>DR NAME:</strong> ${deposit.patient?.assigned_doctor || 'N/A'}</p>
                    <p style="color: black; margin: 6px 0;"><strong>ADMISSION DATE:</strong> ${deposit.patient?.patient_admissions?.[0]?.admission_date ? new Date(deposit.patient.patient_admissions[0].admission_date).toLocaleDateString('en-IN') : 'N/A'}</p>
                  </div>
                  <div>
                  </div>
                </div>
              </div>

              <!-- Deposit Details -->
              <div style="margin-bottom: 25px;">
                <h3 style="font-weight: bold; margin-bottom: 15px; color: black; font-size: 18px; text-decoration: underline;">Deposit Details</h3>
                <table style="width: 100%; border-collapse: collapse; border: 1px solid black;">
                  <thead>
                    <tr style="background-color: #f5f5f5;">
                      <th style="border: 1px solid black; padding: 12px; text-align: left; color: black; font-weight: bold; font-size: 16px;">Description</th>
                      <th style="border: 1px solid black; padding: 12px; text-align: center; color: black; font-weight: bold; font-size: 16px;">Payment Mode</th>
                      <th style="border: 1px solid black; padding: 12px; text-align: center; color: black; font-weight: bold; font-size: 16px;">Amount (₹)</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td style="border: 1px solid black; padding: 10px; color: black; font-size: 14px;">${deposit.description || 'IPD Advance Payment'}</td>
                      <td style="border: 1px solid black; padding: 10px; text-align: center; color: black; font-size: 14px;">${deposit.payment_mode || 'CASH'}</td>
                      <td style="border: 1px solid black; padding: 10px; text-align: center; color: black; font-size: 14px; font-weight: bold;">₹${deposit.amount?.toFixed(2) || '0.00'}</td>
                    </tr>
                    <tr style="background-color: #f0f0f0;">
                      <td colspan="3" style="border: 1px solid black; padding: 15px; text-align: center; color: black; font-weight: bold; font-size: 18px;">
                        Total Deposit: ₹${deposit.amount?.toFixed(2) || '0.00'}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <!-- Amount in Words -->
              <div style="text-align: center; margin-bottom: 25px; padding: 15px; background-color: #f9f9f9; border: 1px solid #ddd;">
                <p style="font-size: 16px; color: black; margin: 0;"><strong>Amount in Words:</strong> ${convertToWords(deposit.amount || 0)}</p>
              </div>

              <!-- Signature Section -->
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-top: 40px; margin-bottom: 30px;">
                <div style="text-align: center; border-top: 2px solid black; padding-top: 8px;">
                  <p style="font-size: 14px; color: black; margin: 0;">Patient/Guardian Signature</p>
                </div>
                <div style="text-align: center; border-top: 2px solid black; padding-top: 8px;">
                  <p style="font-size: 14px; color: black; margin: 0;">Authorized Signature</p>
                  <p style="font-size: 12px; color: black; margin: 4px 0 0 0;">Hospital Administrator</p>
                </div>
              </div>

              <!-- Footer -->
              <div style="text-align: center; margin-top: 25px;">
                <p style="font-size: 14px; color: black; margin: 4px 0;">Thank you for choosing VALANT HOSPITAL</p>
                <p style="font-size: 12px; color: black; margin: 4px 0;">A unit of Navratna Medicare Pvt Ltd</p>
              </div>

              </div>
            </div>

            <script>
              window.onload = function() {
                setTimeout(() => {
                  window.print();
                  window.onafterprint = function() {
                    window.close();
                  };
                }, 500);
              };
            </script>
          </body>
        </html>
      `;

      printWindow.document.write(billHTML);
      printWindow.document.close();
    };

    // Convert image and create print window
    convertImageToBase64().then((base64Image) => {
      createPrintWindow(base64Image as string);
    }).catch((error) => {
      logger.error('Failed to load Receipt2.png:', error);
      // Create print window without background image
      createPrintWindow('');
    });
  };

  // Delete deposit handler
  const handleDeleteDeposit = async (deposit: Deposit) => {
    const confirmDelete = window.confirm(
      `Are you sure you want to delete this deposit?\n\nReceipt No: ${deposit.transaction_reference}\nPatient: ${deposit.patientName}\nAmount: ₹${deposit.amount.toLocaleString()}\n\nThis action cannot be undone.`
    );

    if (!confirmDelete) return;

    try {
      logger.log('🗑️ Deleting deposit:', deposit.id);

      const { error } = await supabase
        .from('patient_transactions')
        .delete()
        .eq('id', deposit.id);

      if (error) {
        logger.error('❌ Error deleting deposit:', error);
        toast.error(`Failed to delete deposit: ${error.message}`);
        return;
      }

      logger.log('✅ Deposit deleted successfully:', deposit.id);
      toast.success(`Deposit ${deposit.transaction_reference} deleted successfully!`);

      // Reload deposits list
      await loadDeposits();
    } catch (error: any) {
      logger.error('❌ Error in handleDeleteDeposit:', error);
      toast.error(`Failed to delete deposit: ${error?.message || 'Unknown error'}`);
    }
  };

  const totalDeposits = filteredDeposits.reduce((sum, d) => sum + d.amount, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">💰 Deposits</h2>
          <p className="text-gray-600">View all patient deposits and advance payments</p>
        </div>
        <div className="flex space-x-3 mt-4 md:mt-0">
          <button
            onClick={exportToCSV}
            disabled={filteredDeposits.length === 0}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center space-x-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Download className="h-4 w-4" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={handlePrint}
            disabled={filteredDeposits.length === 0}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Printer className="h-4 w-4" />
            <span>Print</span>
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-r from-green-500 to-green-600 p-6 rounded-lg text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100">Total Deposits</p>
              <p className="text-2xl font-bold">₹{totalDeposits.toLocaleString()}</p>
            </div>
            <DollarSign className="h-8 w-8 text-green-200" />
          </div>
        </div>

        <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-6 rounded-lg text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100">Total Transactions</p>
              <p className="text-2xl font-bold">{filteredDeposits.length}</p>
            </div>
            <Calendar className="h-8 w-8 text-blue-200" />
          </div>
        </div>

        <div className="bg-gradient-to-r from-purple-500 to-purple-600 p-6 rounded-lg text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100">Average Deposit</p>
              <p className="text-2xl font-bold">
                ₹{filteredDeposits.length > 0 ? (totalDeposits / filteredDeposits.length).toLocaleString(undefined, {maximumFractionDigits: 0}) : 0}
              </p>
            </div>
            <DollarSign className="h-8 w-8 text-purple-200" />
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white p-4 rounded-lg shadow-sm border">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <input
            type="text"
            placeholder="Search by patient name, phone, receipt number, or payment mode..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>
      </div>

      {/* Deposits Table */}
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mr-3"></div>
            <span className="text-gray-600">Loading deposits...</span>
          </div>
        ) : filteredDeposits.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">💰</div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">No Deposits Found</h3>
            <p className="text-gray-600">
              {searchTerm ? 'Try adjusting your search' : 'No deposit transactions available'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Receipt No
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Patient Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Phone
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Payment Mode
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Description
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredDeposits.map((deposit) => (
                  <tr key={deposit.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(deposit.transaction_date).toLocaleDateString('en-IN')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-medium text-green-600">
                        {deposit.transaction_reference}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {deposit.patientName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {deposit.patientPhone}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-green-600">
                      ₹{deposit.amount.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                        {deposit.payment_mode}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {deposit.description}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => printDepositReceipt(deposit)}
                          className="inline-flex items-center px-3 py-1.5 bg-blue-600 text-white text-xs font-medium rounded hover:bg-blue-700 transition-colors"
                          title="Print Receipt"
                        >
                          <Printer className="h-3.5 w-3.5 mr-1" />
                          Print
                        </button>
                        <button
                          onClick={() => handleDeleteDeposit(deposit)}
                          className="inline-flex items-center px-3 py-1.5 bg-red-600 text-white text-xs font-medium rounded hover:bg-red-700 transition-colors"
                          title="Delete Deposit"
                        >
                          <Trash2 className="h-3.5 w-3.5 mr-1" />
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-gray-50">
                <tr>
                  <td colSpan={4} className="px-6 py-4 text-sm font-bold text-gray-900 text-right">
                    Total:
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-green-600">
                    ₹{totalDeposits.toLocaleString()}
                  </td>
                  <td colSpan={3}></td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>

      {/* Print Styles */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .space-y-6, .space-y-6 * {
            visibility: visible;
          }
          .space-y-6 {
            position: absolute;
            left: 0;
            top: 0;
          }
          button {
            display: none !important;
          }
          .bg-gradient-to-r {
            background: #f3f4f6 !important;
            color: #000 !important;
          }
        }
      `}</style>
    </div>
  );
};

export default CombinedBillingModule;

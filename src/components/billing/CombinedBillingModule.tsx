import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { Search, Download, Printer, Calendar, User, FileText, DollarSign, Clock, Calculator, X } from 'lucide-react';
import HospitalService from '../../services/hospitalService';
import DoctorService from '../../services/doctorService';
import BillingService from '../../services/billingService';
import type { PatientWithRelations } from '../../config/supabaseNew';
import BillingReceipt from './BillingReceipt';

// Using PatientWithRelations from config instead of local interface

interface OPDService {
  name: string;
  amount: number;
  date: string;
}

interface IPDService {
  name: string;
  amount: number;
}

interface StaySegment {
  roomType: string;
  startDate: string;
  endDate: string;
  days: number;
  totalCharge: number;
}

interface CombinedBill {
  patientId: string;
  patientName: string;
  patientPhone: string;
  
  // OPD Bills
  opdBills: {
    billId: string;
    date: string;
    doctorName: string;
    consultationFee: number;
    investigationCharges: number;
    medicineCharges: number;
    otherCharges: number;
    services: OPDService[];
    total: number;
  }[];
  
  // IPD Bills
  ipdBills: {
    billId: string;
    admissionDate: string;
    dischargeDate: string;
    admissionCharges: number;
    staySegments: StaySegment[];
    services: IPDService[];
    totalStayCharges: number;
    totalServiceCharges: number;
    total: number;
  }[];
  
  totalOPDAmount: number;
  totalIPDAmount: number;
  grandTotal: number;
  firstVisit: string;
  lastVisit: string;
  totalVisits: number;
}

const CombinedBillingModule: React.FC = () => {
  const [combinedBills, setCombinedBills] = useState<CombinedBill[]>([]);
  const [filteredBills, setFilteredBills] = useState<CombinedBill[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState<'all' | 'last_month' | 'last_3_months' | 'last_year'>('all');
  const [sortBy, setSortBy] = useState<'name' | 'total' | 'visits' | 'last_visit'>('last_visit');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [selectedPatient, setSelectedPatient] = useState<CombinedBill | null>(null);
  const [showBillingReceipt, setShowBillingReceipt] = useState(false);
  const [selectedBillForReceipt, setSelectedBillForReceipt] = useState<CombinedBill | null>(null);

  useEffect(() => {
    loadCombinedBillingData();
  }, []);

  useEffect(() => {
    filterAndSortBills();
  }, [combinedBills, searchTerm, dateFilter, sortBy, sortOrder]);

  const loadCombinedBillingData = async () => {
    try {
      setLoading(true);
      
      // Load actual patients from HospitalService
      const actualPatients = await HospitalService.getPatients(1000);
      console.log('📊 Loaded patients for combined billing:', actualPatients.length);
      console.log('👥 First few patients:', actualPatients.slice(0, 3));

      // Load OPD and IPD bills from BillingService
      const opdBills = BillingService.getOPDBills();
      const ipdBills = BillingService.getIPDBills();
      console.log('💰 Loaded bills - OPD:', opdBills.length, 'IPD:', ipdBills.length);
      console.log('🔍 IPD Bills:', ipdBills);
      console.log('🔍 OPD Bills:', opdBills);

      // Filter patients who have transactions, admissions, or bills
      const patientsWithBillingHistory = actualPatients.filter(patient => {
        if (!patient) return false;
        
        const hasTransactions = patient.transactions && patient.transactions.length > 0;
        const hasAdmissions = patient.admissions && patient.admissions.length > 0;
        const hasOPDBills = opdBills.some(bill => 
          bill && (bill.patientId === patient.id || bill.patientId === patient.patient_id)
        );
        const hasIPDBills = ipdBills.some(bill => 
          bill && (bill.patientId === patient.id || bill.patientId === patient.patient_id)
        );
        
        const result = hasTransactions || hasAdmissions || hasOPDBills || hasIPDBills;
        
        if (result) {
          console.log('✅ Found patient with billing:', patient.first_name, {
            id: patient.id,
            patient_id: patient.patient_id,
            hasTransactions,
            hasAdmissions,
            hasOPDBills,
            hasIPDBills
          });
        }
        
        return result;
      });
      
      console.log('🔍 Patients with billing history found:', patientsWithBillingHistory.length);
      
      // If no patients found, let's include ALL patients with valid data for debugging
      if (patientsWithBillingHistory.length === 0) {
        console.log('⚠️ No patients with billing history found. Including first 5 patients for debugging');
        const debugPatients = actualPatients.slice(0, 5).filter(p => p && p.first_name);
        
        const debugBills = debugPatients.map(patient => {
          return {
            patientId: patient.id,
            patientName: `${patient.first_name} ${patient.last_name || ''}`.trim(),
            patientPhone: patient.phone || 'N/A',
            opdBills: [],
            ipdBills: [],
            totalOPDAmount: 0,
            totalIPDAmount: 0,
            grandTotal: 0,
            firstVisit: patient.created_at,
            lastVisit: patient.updated_at || patient.created_at,
            totalVisits: (patient.transactions?.length || 0) + (patient.admissions?.length || 0)
          };
        });
        
        setCombinedBills(debugBills);
        return;
      }

      console.log('💰 Patients with billing history:', patientsWithBillingHistory.length);

      // Convert patient data to combined bills format
      const combinedBills: CombinedBill[] = patientsWithBillingHistory.map(patient => {
        // Processing patient (removed verbose logging)
        const transactions = patient.transactions || [];
        const admissions = patient.admissions || [];

        // Get OPD bills for this patient
        const patientOPDBills = opdBills.filter(bill => {
          if (!bill) return false;
          return bill.patientId === patient.id || bill.patientId === patient.patient_id;
        });
        const totalOPDAmount = patientOPDBills.reduce((sum, bill) => sum + (bill.totalAmount || 0), 0);

        // Get IPD bills for this patient
        const patientIPDBills = ipdBills.filter(bill => {
          if (!bill) return false;
          return bill.patientId === patient.id || bill.patientId === patient.patient_id;
        });
        const totalIPDAmount = patientIPDBills.reduce((sum, bill) => sum + (bill.totalAmount || 0), 0);

        // Get visit dates from transactions, admissions, and bills
        const allDates = [
          ...transactions.map(t => t.created_at),
          ...admissions.map(a => a.created_at),
          ...patientOPDBills.map(bill => bill.billDate),
          ...patientIPDBills.map(bill => bill.billDate)
        ].filter(Boolean).sort();

        const firstVisit = allDates.length > 0 ? allDates[0] : patient.created_at;
        const lastVisit = allDates.length > 0 ? allDates[allDates.length - 1] : patient.updated_at || patient.created_at;

        // Convert bills to the format expected by CombinedBill interface
        const formattedOPDBills = patientOPDBills.map(bill => ({
          billId: bill.billId || '',
          date: bill.billDate || new Date().toISOString(),
          doctorName: bill.doctorName || 'Unknown',
          consultationFee: bill.consultationFee || 0,
          investigationCharges: bill.investigationCharges || 0,
          medicineCharges: bill.medicineCharges || 0,
          otherCharges: bill.otherCharges || 0,
          services: (bill.services || []).map(service => ({ 
            name: typeof service === 'string' ? service : service.name || 'Service', 
            amount: 0, 
            date: bill.billDate || new Date().toISOString()
          })),
          total: bill.totalAmount || 0
        }));

        const formattedIPDBills = patientIPDBills.map(bill => ({
          billId: bill.billId || '',
          admissionDate: bill.admissionDate || new Date().toISOString(),
          dischargeDate: bill.dischargeDate || new Date().toISOString(),
          admissionCharges: bill.admissionCharges || 0,
          staySegments: (bill.staySegments || []).map(segment => ({
            roomType: segment.roomType || 'GENERAL_WARD',
            startDate: segment.startDate || bill.admissionDate || new Date().toISOString(),
            endDate: segment.endDate || bill.dischargeDate || new Date().toISOString(),
            days: segment.days || 1,
            totalCharge: segment.totalCharge || 0
          })),
          services: (bill.services || []).map(service => ({ 
            name: service.name || 'Service', 
            amount: service.amount || 0 
          })),
          totalStayCharges: bill.totalStayCharges || 0,
          totalServiceCharges: bill.totalServiceCharges || 0,
          total: bill.totalAmount || 0
        }));

        if (totalOPDAmount > 0 || totalIPDAmount > 0) {
          console.log('📊 Patient with bills:', patient.first_name, '- OPD: ₹' + totalOPDAmount, 'IPD: ₹' + totalIPDAmount);
        }
        
        return {
          patientId: patient.id,
          patientName: `${patient.first_name} ${patient.last_name}`,
          patientPhone: patient.phone || 'N/A',
          opdBills: formattedOPDBills,
          ipdBills: formattedIPDBills,
          totalOPDAmount,
          totalIPDAmount,
          grandTotal: totalOPDAmount + totalIPDAmount,
          firstVisit,
          lastVisit,
          totalVisits: transactions.length + admissions.length
        };
      });

      // Only show patients with actual billing amounts
      const filteredBills = combinedBills.filter(bill => bill.grandTotal > 0);

      setCombinedBills(filteredBills);
      
    } catch (error: any) {
      console.error('Failed to load combined billing data:', error);
      toast.error('Failed to load combined billing data: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const filterAndSortBills = () => {
    let filtered = [...combinedBills];

    // Apply search filter
    if (searchTerm.trim()) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(bill =>
        bill.patientName.toLowerCase().includes(search) ||
        bill.patientPhone.includes(search) ||
        bill.opdBills.some(opd => opd.billId.toLowerCase().includes(search)) ||
        bill.ipdBills.some(ipd => ipd.billId.toLowerCase().includes(search))
      );
    }

    // Apply date filter
    if (dateFilter !== 'all') {
      const now = new Date();
      let startDate: Date;

      switch (dateFilter) {
        case 'last_month':
          startDate = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
          break;
        case 'last_3_months':
          startDate = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate());
          break;
        case 'last_year':
          startDate = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
          break;
        default:
          startDate = new Date(0);
      }

      filtered = filtered.filter(bill => {
        const lastVisitDate = new Date(bill.lastVisit);
        return lastVisitDate >= startDate;
      });
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let comparison = 0;

      switch (sortBy) {
        case 'name':
          comparison = a.patientName.localeCompare(b.patientName);
          break;
        case 'total':
          comparison = a.grandTotal - b.grandTotal;
          break;
        case 'visits':
          comparison = a.totalVisits - b.totalVisits;
          break;
        case 'last_visit':
          comparison = new Date(a.lastVisit).getTime() - new Date(b.lastVisit).getTime();
          break;
      }

      return sortOrder === 'asc' ? comparison : -comparison;
    });

    setFilteredBills(filtered);
  };

  const handleSort = (column: typeof sortBy) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('desc');
    }
  };

  const getSortIcon = (column: typeof sortBy) => {
    if (sortBy !== column) return '↕️';
    return sortOrder === 'asc' ? '↑' : '↓';
  };

  const exportAllBills = () => {
    if (filteredBills.length === 0) {
      toast.error('No bills to export');
      return;
    }

    // Create comprehensive CSV content
    const csvContent = generateCombinedBillsCSV(filteredBills);
    
    // Create blob and download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Combined_Bills_Export_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    
    toast.success(`Exported ${filteredBills.length} combined bills to CSV`);
  };

  const printSummary = () => {
    if (filteredBills.length === 0) {
      toast.error('No bills to print');
      return;
    }

    // Generate comprehensive print content
    const printContent = generateSummaryPrintContent(filteredBills);
    
    // Open print dialog
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
      printWindow.focus();
      printWindow.print();
      printWindow.close();
      toast.success(`Printing summary of ${filteredBills.length} patient bills`);
    } else {
      toast.error('Unable to open print dialog. Please check popup settings.');
    }
  };

  const handlePrintBill = (bill: CombinedBill) => {
    setSelectedBillForReceipt(bill);
    setShowBillingReceipt(true);
  };

  const calculateDays = (startDate: string, endDate: string): number => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const generateCombinedBillsCSV = (bills: CombinedBill[]): string => {
    const headers = [
      'Patient Name',
      'Phone',
      'Total Visits',
      'First Visit',
      'Last Visit',
      'OPD Amount',
      'IPD Amount',
      'Grand Total',
      'OPD Bills Count',
      'IPD Bills Count'
    ];

    const csvRows = [headers.join(',')];

    bills.forEach(bill => {
      const row = [
        `"${bill.patientName}"`,
        `"${bill.patientPhone}"`,
        bill.totalVisits,
        `"${new Date(bill.firstVisit).toLocaleDateString('en-IN')}"`,
        `"${new Date(bill.lastVisit).toLocaleDateString('en-IN')}"`,
        bill.totalOPDAmount,
        bill.totalIPDAmount,
        bill.grandTotal,
        bill.opdBills.length,
        bill.ipdBills.length
      ];
      csvRows.push(row.join(','));
    });

    // Add summary row
    const totalRevenue = bills.reduce((sum, bill) => sum + bill.grandTotal, 0);
    const totalOPDRevenue = bills.reduce((sum, bill) => sum + bill.totalOPDAmount, 0);
    const totalIPDRevenue = bills.reduce((sum, bill) => sum + bill.totalIPDAmount, 0);
    
    csvRows.push('');
    csvRows.push('SUMMARY');
    csvRows.push(`Total Patients,${bills.length}`);
    csvRows.push(`Total OPD Revenue,${totalOPDRevenue}`);
    csvRows.push(`Total IPD Revenue,${totalIPDRevenue}`);
    csvRows.push(`Grand Total Revenue,${totalRevenue}`);
    csvRows.push(`Export Date,"${new Date().toLocaleDateString('en-IN')}"`);

    return csvRows.join('\n');
  };

  const generateSummaryPrintContent = (bills: CombinedBill[]): string => {
    const currentDate = new Date().toLocaleDateString('en-IN');
    const currentTime = new Date().toLocaleTimeString('en-IN');
    
    const totalRevenue = bills.reduce((sum, bill) => sum + bill.grandTotal, 0);
    const totalOPDRevenue = bills.reduce((sum, bill) => sum + bill.totalOPDAmount, 0);
    const totalIPDRevenue = bills.reduce((sum, bill) => sum + bill.totalIPDAmount, 0);
    const totalVisits = bills.reduce((sum, bill) => sum + bill.totalVisits, 0);
    
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Combined Billing Summary Report</title>
        <style>
          @media print {
            @page {
              margin: 0.5in;
              size: A4;
            }
            body * {
              visibility: hidden;
            }
            .receipt-template, .receipt-template * {
              visibility: visible;
            }
            .receipt-template {
              position: absolute;
              left: 0;
              top: 0;
              width: 100%;
            }
          }
          body { 
            font-family: Arial, sans-serif; 
            margin: 20px; 
            color: #333; 
            background: white;
          }
          .receipt-template {
            background: white;
            padding: 20px;
            max-width: 4xl;
            margin: 0 auto;
          }
          .header { 
            text-align: center; 
            border-bottom: 2px solid #333; 
            padding-bottom: 20px; 
            margin-bottom: 30px; 
          }
          .logo-section {
            display: flex;
            align-items: center;
            justify-content: center;
            margin-bottom: 16px;
          }
          .logo {
            height: 64px;
            max-height: 64px;
            width: auto;
          }
          .hospital-info {
            font-size: 14px;
            color: #374151;
            margin-top: 16px;
            line-height: 1.4;
          }
          .report-title {
            font-size: 24px;
            font-weight: bold;
            color: #2563eb;
            margin-bottom: 8px;
          }
          .report-subtitle {
            font-size: 16px;
            color: #6b7280;
            margin-bottom: 16px;
          }
          .summary-cards { 
            display: grid; 
            grid-template-columns: repeat(4, 1fr); 
            gap: 20px; 
            margin-bottom: 30px; 
          }
          .card { 
            background: #f8f9fa; 
            padding: 15px; 
            border-radius: 8px; 
            text-align: center; 
            border: 1px solid #ddd; 
          }
          .card-title { 
            font-size: 12px; 
            color: #666; 
            margin-bottom: 5px; 
          }
          .card-value { 
            font-size: 18px; 
            font-weight: bold; 
            color: #333; 
          }
          .patients-table { 
            width: 100%; 
            border-collapse: collapse; 
            margin-bottom: 30px; 
          }
          .patients-table th, .patients-table td { 
            border: 1px solid #ddd; 
            padding: 8px; 
            text-align: left; 
            font-size: 12px; 
          }
          .patients-table th { 
            background: #f5f5f5; 
            font-weight: bold; 
          }
          .patients-table .amount { 
            text-align: right; 
            font-weight: bold; 
          }
          .total-row { 
            background: #e3f2fd; 
            font-weight: bold; 
          }
          .statistics-section {
            margin-top: 20px;
            padding: 15px;
            background: #f8f9fa;
            border-radius: 8px;
            border: 1px solid #e5e7eb;
          }
          .statistics-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 15px;
            font-size: 12px;
          }
          .footer { 
            margin-top: 30px; 
            padding-top: 20px;
            text-align: center; 
            font-size: 12px; 
            color: #666; 
            border-top: 1px solid #ddd;
          }
          .signature-section {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 32px;
            margin-top: 40px;
            margin-bottom: 24px;
          }
          .signature-box {
            text-align: center;
          }
          .signature-line {
            border-top: 1px solid #6b7280;
            margin-top: 48px;
            padding-top: 8px;
            font-size: 12px;
          }
        </style>
      </head>
      <body>
        <div class="receipt-template">
          <!-- Header -->
          <div class="header">
            <div class="logo-section">
              <img 
                src="/logo.png" 
                alt="VALANT Hospital Logo" 
                class="logo"
              />
            </div>
            <div class="hospital-info">
              <p>Survey No. 92/1A, Near Akshar Marg, Rajkot-360001, Gujarat, India</p>
              <p>Phone: +91-281-2471101 | Email: info@valanthospital.com</p>
              <p>Reg. No: GJ/RJT/2023/001 | GST: 24ABCXY1234Z1Z5</p>
            </div>
          </div>

          <!-- Report Header -->
          <div style="margin-bottom: 24px;">
            <div style="text-align: center; margin-bottom: 16px;">
              <h2 class="report-title">COMBINED BILLING SUMMARY REPORT</h2>
              <p class="report-subtitle">Comprehensive Patient Billing Analysis</p>
            </div>
            <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; font-size: 14px;">
              <div>
                <p><strong>REPORT DATE:</strong> ${currentDate}</p>
                <p><strong>REPORT TIME:</strong> ${currentTime}</p>
                <p><strong>TOTAL PATIENTS:</strong> ${bills.length}</p>
              </div>
              <div style="text-align: right;">
                <p><strong>REPORT TYPE:</strong> Combined Billing</p>
                <p><strong>PERIOD:</strong> All Time</p>
                <p><strong>STATUS:</strong> Final</p>
              </div>
            </div>
          </div>

          <!-- Summary Cards -->
          <div class="summary-cards">
            <div class="card">
              <div class="card-title">Total Patients</div>
              <div class="card-value">${bills.length}</div>
            </div>
            <div class="card">
              <div class="card-title">OPD Revenue</div>
              <div class="card-value">₹${totalOPDRevenue.toLocaleString()}</div>
            </div>
            <div class="card">
              <div class="card-title">IPD Revenue</div>
              <div class="card-value">₹${totalIPDRevenue.toLocaleString()}</div>
            </div>
            <div class="card">
              <div class="card-title">Total Revenue</div>
              <div class="card-value">₹${totalRevenue.toLocaleString()}</div>
            </div>
          </div>
          
          <!-- Patient-wise Details Table -->
          <div style="margin-bottom: 24px;">
            <h3 style="margin-bottom: 15px; color: #374151; font-weight: 600;">Patient-wise Billing Details</h3>
            <table class="patients-table">
              <thead>
                <tr>
                  <th>Sr</th>
                  <th>Patient Name</th>
                  <th>Contact</th>
                  <th>Visits</th>
                  <th>Period</th>
                  <th>OPD Amount</th>
                  <th>IPD Amount</th>
                  <th>Total Amount</th>
                </tr>
              </thead>
              <tbody>
                ${bills.map((bill, index) => `
                  <tr>
                    <td>${index + 1}</td>
                    <td>${bill.patientName}</td>
                    <td>${bill.patientPhone}</td>
                    <td style="text-align: center;">${bill.totalVisits}</td>
                    <td style="font-size: 10px;">
                      ${new Date(bill.firstVisit).toLocaleDateString('en-IN')}<br/>
                      to ${new Date(bill.lastVisit).toLocaleDateString('en-IN')}
                    </td>
                    <td class="amount">₹${bill.totalOPDAmount.toLocaleString()}</td>
                    <td class="amount">₹${bill.totalIPDAmount.toLocaleString()}</td>
                    <td class="amount">₹${bill.grandTotal.toLocaleString()}</td>
                  </tr>
                `).join('')}
                <tr class="total-row">
                  <td colspan="5"><strong>GRAND TOTAL</strong></td>
                  <td class="amount"><strong>₹${totalOPDRevenue.toLocaleString()}</strong></td>
                  <td class="amount"><strong>₹${totalIPDRevenue.toLocaleString()}</strong></td>
                  <td class="amount"><strong>₹${totalRevenue.toLocaleString()}</strong></td>
                </tr>
              </tbody>
            </table>
          </div>
          
          <!-- Report Statistics -->
          <div class="statistics-section">
            <h4 style="margin-top: 0; color: #374151; font-weight: 600;">Report Analytics</h4>
            <div class="statistics-grid">
              <div>📊 <strong>Total Patients with Bills:</strong> ${bills.length}</div>
              <div>👥 <strong>Total Patient Visits:</strong> ${totalVisits}</div>
              <div>💰 <strong>Average Revenue per Patient:</strong> ₹${Math.round(totalRevenue / bills.length).toLocaleString()}</div>
              <div>📈 <strong>Average Visits per Patient:</strong> ${Math.round(totalVisits / bills.length)}</div>
              <div>🏥 <strong>OPD Revenue Share:</strong> ${Math.round((totalOPDRevenue / totalRevenue) * 100)}%</div>
              <div>🛏️ <strong>IPD Revenue Share:</strong> ${Math.round((totalIPDRevenue / totalRevenue) * 100)}%</div>
            </div>
          </div>

          <!-- Signature Section -->
          <div class="signature-section">
            <div class="signature-box">
              <div class="signature-line">
                <p>Finance Manager</p>
              </div>
            </div>
            <div class="signature-box">
              <div class="signature-line">
                <p>Hospital Administrator</p>
              </div>
            </div>
          </div>

          <!-- Footer -->
          <div class="footer">
            <p><strong>Thank you for choosing VALANT Hospital</strong></p>
            <p>A unit of Neuorth Medicare Pvt Ltd</p>
            <p style="font-weight: bold; margin-top: 8px;">** ORIGINAL COPY **</p>
            <p style="margin-top: 4px;">This is a computer generated report • Generated on ${currentDate} at ${currentTime}</p>
          </div>
        </div>
      </body>
      </html>
    `;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading combined billing data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Combined Billing Summary</h2>
          <p className="text-gray-600">Comprehensive view of OPD and IPD bills by patient</p>
        </div>
        <div className="flex space-x-3 mt-4 md:mt-0">
          <button
            onClick={exportAllBills}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center space-x-2 transition-colors"
          >
            <Download className="h-4 w-4" />
            <span>Export All</span>
          </button>
          <button
            onClick={printSummary}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2 transition-colors"
          >
            <Printer className="h-4 w-4" />
            <span>Print Summary</span>
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-blue-50 p-4 rounded-lg border-2 border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-600 text-sm font-medium">Total Patients</p>
              <p className="text-2xl font-bold text-blue-700">{filteredBills.length}</p>
            </div>
            <User className="h-8 w-8 text-blue-500" />
          </div>
        </div>

        <div className="bg-green-50 p-4 rounded-lg border-2 border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-600 text-sm font-medium">Total OPD Revenue</p>
              <p className="text-2xl font-bold text-green-700">
                ₹{filteredBills.reduce((sum, bill) => sum + bill.totalOPDAmount, 0).toLocaleString()}
              </p>
            </div>
            <FileText className="h-8 w-8 text-green-500" />
          </div>
        </div>

        <div className="bg-purple-50 p-4 rounded-lg border-2 border-purple-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-600 text-sm font-medium">Total IPD Revenue</p>
              <p className="text-2xl font-bold text-purple-700">
                ₹{filteredBills.reduce((sum, bill) => sum + bill.totalIPDAmount, 0).toLocaleString()}
              </p>
            </div>
            <DollarSign className="h-8 w-8 text-purple-500" />
          </div>
        </div>

        <div className="bg-orange-50 p-4 rounded-lg border-2 border-orange-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-600 text-sm font-medium">Grand Total</p>
              <p className="text-2xl font-bold text-orange-700">
                ₹{filteredBills.reduce((sum, bill) => sum + bill.grandTotal, 0).toLocaleString()}
              </p>
            </div>
            <Calculator className="h-8 w-8 text-orange-500" />
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white p-4 rounded-lg shadow-sm border">
        <div className="flex flex-col md:flex-row space-y-2 md:space-y-0 md:space-x-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              placeholder="Search by patient name, phone, or bill ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <select
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value as any)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Time</option>
            <option value="last_month">Last Month</option>
            <option value="last_3_months">Last 3 Months</option>
            <option value="last_year">Last Year</option>
          </select>

          <select
            value={`${sortBy}_${sortOrder}`}
            onChange={(e) => {
              const [column, order] = e.target.value.split('_');
              setSortBy(column as any);
              setSortOrder(order as any);
            }}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="last_visit_desc">Latest Visit</option>
            <option value="name_asc">Name A-Z</option>
            <option value="name_desc">Name Z-A</option>
            <option value="total_desc">Highest Amount</option>
            <option value="total_asc">Lowest Amount</option>
            <option value="visits_desc">Most Visits</option>
            <option value="visits_asc">Least Visits</option>
          </select>
        </div>
      </div>

      {/* Combined Bills Table */}
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Patient
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Visit Timeline
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  OPD Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  IPD Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredBills.map((bill) => (
                <tr key={bill.patientId} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{bill.patientName}</div>
                      <div className="text-sm text-gray-500">{bill.patientPhone}</div>
                      <div className="text-xs text-blue-600">{bill.totalVisits} visit{bill.totalVisits > 1 ? 's' : ''}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div className="flex items-center space-x-1">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      <span>{new Date(bill.firstVisit).toLocaleDateString('en-IN')}</span>
                    </div>
                    {bill.firstVisit !== bill.lastVisit && (
                      <div className="text-xs text-gray-500 mt-1">
                        to {new Date(bill.lastVisit).toLocaleDateString('en-IN')}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-green-600">
                      ₹{bill.totalOPDAmount.toLocaleString()}
                    </div>
                    <div className="text-xs text-gray-500">
                      {bill.opdBills.length} bill{bill.opdBills.length > 1 ? 's' : ''}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-purple-600">
                      ₹{bill.totalIPDAmount.toLocaleString()}
                    </div>
                    <div className="text-xs text-gray-500">
                      {bill.ipdBills.length} bill{bill.ipdBills.length > 1 ? 's' : ''}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-bold text-blue-600">
                      ₹{bill.grandTotal.toLocaleString()}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => setSelectedPatient(bill)}
                      className="text-blue-600 hover:text-blue-900 bg-blue-50 hover:bg-blue-100 px-3 py-1 rounded-md transition-colors"
                    >
                      View Details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredBills.length === 0 && (
            <div className="text-center py-12">
              <h3 className="text-lg font-medium text-gray-900 mb-2">No combined bills found</h3>
              <p className="text-gray-500">Try adjusting your search or filters</p>
            </div>
          )}
        </div>
      </div>

      {/* Patient Detail Modal */}
      {selectedPatient && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-gray-800">
                  Detailed Bill Breakdown - {selectedPatient.patientName}
                </h3>
                <button
                  onClick={() => setSelectedPatient(null)}
                  className="text-gray-400 hover:text-gray-600 p-1 rounded hover:bg-gray-100"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-6">
                {/* Patient Info */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-gray-800 mb-2">Patient Information</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">Name:</span>
                      <div className="font-medium">{selectedPatient.patientName}</div>
                    </div>
                    <div>
                      <span className="text-gray-500">Phone:</span>
                      <div className="font-medium">{selectedPatient.patientPhone}</div>
                    </div>
                    <div>
                      <span className="text-gray-500">Total Visits:</span>
                      <div className="font-medium">{selectedPatient.totalVisits}</div>
                    </div>
                  </div>
                </div>

                {/* OPD Bills Section */}
                {selectedPatient.opdBills.length > 0 && (
                  <div className="bg-green-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-green-800 mb-4 flex items-center">
                      <FileText className="h-5 w-5 mr-2" />
                      OPD Services (₹{selectedPatient.totalOPDAmount.toLocaleString()})
                    </h4>
                    
                    <div className="space-y-4">
                      {selectedPatient.opdBills.map((opdBill, index) => (
                        <div key={index} className="bg-white p-4 rounded-lg border border-green-200">
                          <div className="flex justify-between items-start mb-3">
                            <div>
                              <h5 className="font-medium text-gray-800">{opdBill.billId}</h5>
                              <p className="text-sm text-gray-600">{opdBill.doctorName}</p>
                              <p className="text-sm text-gray-500">{new Date(opdBill.date).toLocaleDateString('en-IN')}</p>
                            </div>
                            <div className="text-right">
                              <div className="text-lg font-bold text-green-600">₹{opdBill.total.toLocaleString()}</div>
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div>
                              <span className="text-gray-500">Consultation:</span>
                              <div className="font-medium">₹{opdBill.consultationFee.toLocaleString()}</div>
                            </div>
                            <div>
                              <span className="text-gray-500">Investigation:</span>
                              <div className="font-medium">₹{opdBill.investigationCharges.toLocaleString()}</div>
                            </div>
                            <div>
                              <span className="text-gray-500">Medicine:</span>
                              <div className="font-medium">₹{opdBill.medicineCharges.toLocaleString()}</div>
                            </div>
                            <div>
                              <span className="text-gray-500">Other:</span>
                              <div className="font-medium">₹{opdBill.otherCharges.toLocaleString()}</div>
                            </div>
                          </div>

                          {opdBill.services.length > 0 && (
                            <div className="mt-3">
                              <span className="text-sm text-gray-500">Services:</span>
                              <div className="flex flex-wrap gap-1 mt-1">
                                {opdBill.services.map((service, idx) => (
                                  <span key={idx} className="inline-flex px-2 py-1 text-xs bg-green-100 text-green-800 rounded">
                                    {service.name} (₹{service.amount})
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* IPD Bills Section */}
                {selectedPatient.ipdBills.length > 0 && (
                  <div className="bg-purple-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-purple-800 mb-4 flex items-center">
                      <DollarSign className="h-5 w-5 mr-2" />
                      IPD Services (₹{selectedPatient.totalIPDAmount.toLocaleString()})
                    </h4>
                    
                    <div className="space-y-4">
                      {selectedPatient.ipdBills.map((ipdBill, index) => (
                        <div key={index} className="bg-white p-4 rounded-lg border border-purple-200">
                          <div className="flex justify-between items-start mb-4">
                            <div>
                              <h5 className="font-medium text-gray-800">{ipdBill.billId}</h5>
                              <p className="text-sm text-gray-600">
                                {new Date(ipdBill.admissionDate).toLocaleDateString('en-IN')} - {new Date(ipdBill.dischargeDate).toLocaleDateString('en-IN')}
                              </p>
                              <p className="text-sm text-gray-500">
                                {calculateDays(ipdBill.admissionDate, ipdBill.dischargeDate)} days
                              </p>
                            </div>
                            <div className="text-right">
                              <div className="text-lg font-bold text-purple-600">₹{ipdBill.total.toLocaleString()}</div>
                            </div>
                          </div>

                          {/* Stay Segments */}
                          <div className="mb-4">
                            <h6 className="font-medium text-gray-700 mb-2">Stay Breakdown:</h6>
                            <div className="space-y-2">
                              {ipdBill.staySegments.map((segment, idx) => (
                                <div key={idx} className="flex justify-between items-center text-sm bg-gray-50 p-2 rounded">
                                  <div>
                                    <span className="font-medium">{segment.roomType}</span>
                                    <span className="text-gray-500 ml-2">
                                      ({segment.days} day{segment.days > 1 ? 's' : ''})
                                    </span>
                                  </div>
                                  <span className="font-medium">₹{segment.totalCharge.toLocaleString()}</span>
                                </div>
                              ))}
                              <div className="flex justify-between items-center text-sm font-medium border-t pt-2">
                                <span>Admission Charges:</span>
                                <span>₹{ipdBill.admissionCharges.toLocaleString()}</span>
                              </div>
                              <div className="flex justify-between items-center text-sm font-medium">
                                <span>Total Stay Charges:</span>
                                <span>₹{ipdBill.totalStayCharges.toLocaleString()}</span>
                              </div>
                            </div>
                          </div>

                          {/* Services */}
                          {ipdBill.services.length > 0 && (
                            <div>
                              <h6 className="font-medium text-gray-700 mb-2">Additional Services:</h6>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                {ipdBill.services.map((service, idx) => (
                                  <div key={idx} className="flex justify-between items-center text-sm bg-gray-50 p-2 rounded">
                                    <span>{service.name}</span>
                                    <span className="font-medium">₹{service.amount.toLocaleString()}</span>
                                  </div>
                                ))}
                              </div>
                              <div className="flex justify-between items-center text-sm font-medium mt-2 pt-2 border-t">
                                <span>Total Service Charges:</span>
                                <span>₹{ipdBill.totalServiceCharges.toLocaleString()}</span>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Grand Total */}
                <div className="bg-blue-50 p-4 rounded-lg border-2 border-blue-200">
                  <div className="flex justify-between items-center">
                    <div>
                      <h4 className="font-semibold text-blue-800">Grand Total</h4>
                      <p className="text-sm text-blue-600">
                        OPD: ₹{selectedPatient.totalOPDAmount.toLocaleString()} + 
                        IPD: ₹{selectedPatient.totalIPDAmount.toLocaleString()}
                      </p>
                    </div>
                    <div className="text-2xl font-bold text-blue-600">
                      ₹{selectedPatient.grandTotal.toLocaleString()}
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end space-x-3 pt-4 border-t">
                  <button
                    onClick={() => toast.success('Export patient bill - Feature coming soon!')}
                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center space-x-2"
                  >
                    <Download className="h-4 w-4" />
                    <span>Export</span>
                  </button>
                  <button
                    onClick={() => handlePrintBill(patient)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center space-x-2"
                  >
                    <Printer className="h-4 w-4" />
                    <span>Print</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Billing Receipt Modal */}
      {showBillingReceipt && selectedBillForReceipt && (
        <BillingReceipt
          bill={selectedBillForReceipt}
          onClose={() => {
            setShowBillingReceipt(false);
            setSelectedBillForReceipt(null);
          }}
        />
      )}
    </div>
  );
};

export default CombinedBillingModule;
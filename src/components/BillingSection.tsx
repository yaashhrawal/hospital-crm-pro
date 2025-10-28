import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import {
  DollarSign,
  FileText,
  Users,
  Clock,
  Search,
  Printer,
  Edit2,
  Trash2
} from 'lucide-react';
import NewIPDBillingModule from './billing/NewIPDBillingModule';
import IPDSummaryModule from './billing/IPDSummaryModule';
import CombinedBillingModule from './billing/CombinedBillingModule';
import HospitalService from '../services/hospitalService';
import { supabase } from '../config/supabaseNew';
import { logger } from '../utils/logger';

interface PatientBilling {
  patientId: string;
  patientName: string;
  totalDeposits: number;
  totalIPDBills: number;
  lastActivity: string;
  status: 'ACTIVE' | 'DISCHARGED';
}

interface PatientDepositDetail {
  id: string;
  amount: number;
  transaction_date: string;
  created_at: string;
  payment_mode: string;
  description: string;
  status: string;
  transaction_type: string;
}

interface BillingSummary {
  totalRevenue: number;
  opdBills: number;
  ipdBills: number;
  pendingBills: number;
  totalDeposits: number;
}

const BillingSection: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'ipd' | 'ipd-summary' | 'combined'>('dashboard');
  const [billingSummary, setBillingSummary] = useState<BillingSummary>({
    totalRevenue: 0,
    opdBills: 0,
    ipdBills: 0,
    pendingBills: 0,
    totalDeposits: 0
  });
  const [patientBillings, setPatientBillings] = useState<PatientBilling[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'DISCHARGED'>('ALL');
  const [sortBy, setSortBy] = useState<'date' | 'deposits' | 'patient'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [selectedPatient, setSelectedPatient] = useState<PatientBilling | null>(null);
  const [showPatientModal, setShowPatientModal] = useState(false);
  const [patientDepositDetails, setPatientDepositDetails] = useState<PatientDepositDetail[]>([]);
  const [patientIPDBills, setPatientIPDBills] = useState<any[]>([]);

  useEffect(() => {
    loadBillingData();
  }, []);

  const loadBillingData = async () => {
    try {
      setLoading(true);
      logger.log('🔍 Loading billing dashboard data...');

      // Load actual patients from HospitalService (same as other billing modules)
      const actualPatients = await HospitalService.getPatients(50000, true, true);
      logger.log('📊 Loaded patients for billing dashboard:', actualPatients.length);
      logger.log('👥 First few patients:', actualPatients.slice(0, 3));

      // Filter patients who have IPD-specific transactions (same logic as NewIPDBillingModule)
      const patientsWithIPDBillingHistory = actualPatients.filter(patient => {
        if (!patient) return false;

        const transactions = patient.transactions || [];

        // Look for IPD-specific transaction types: SERVICE, ADMISSION_FEE, DEPOSIT, ADVANCE_PAYMENT
        const hasIPDTransactions = transactions.some(transaction =>
          ['SERVICE', 'ADMISSION_FEE', 'DEPOSIT', 'ADVANCE_PAYMENT'].includes(transaction.transaction_type) &&
          (transaction.status !== 'DELETED' && transaction.status !== 'CANCELLED')
        );

        if (hasIPDTransactions) {
          logger.log('✅ Found patient with IPD billing:', patient.first_name || patient.name, {
            id: patient.id,
            patient_id: patient.patient_id,
            ipdTransactions: transactions.filter(t => ['SERVICE', 'ADMISSION_FEE', 'DEPOSIT', 'ADVANCE_PAYMENT'].includes(t.transaction_type)).length
          });
        }

        return hasIPDTransactions;
      });

      logger.log('🔍 Patients with IPD billing history found:', patientsWithIPDBillingHistory.length);

      // 🐛 DEBUG: Log first few patients with IPD transactions for debugging
      patientsWithIPDBillingHistory.slice(0, 3).forEach((patient, index) => {
        logger.log(`🔍 DEBUG Patient ${index + 1}:`, patient.first_name || patient.name, {
          id: patient.id,
          transactionCount: patient.transactions?.length || 0,
          transactionTypes: patient.transactions?.map(t => t.transaction_type) || []
        });
      });

      // Process the patient data
      const patientBillingsList: PatientBilling[] = [];
      let totalDeposits = 0;
      let totalRevenue = 0;

      patientsWithIPDBillingHistory.forEach((patient: any) => {
        const transactions = patient.transactions || [];

        let patientDeposits = 0;
        let patientIPDBills = 0;
        let lastActivity = patient.created_at;

        // Process each transaction for this patient (same logic as NewIPDBillingModule)
        transactions.forEach((transaction: any) => {
          if (transaction.status === 'DELETED' || transaction.status === 'CANCELLED') return; // Skip deleted/cancelled transactions

          // Count deposits (ADMISSION_FEE, DEPOSIT, ADVANCE_PAYMENT)
          if (['ADMISSION_FEE', 'DEPOSIT', 'ADVANCE_PAYMENT'].includes(transaction.transaction_type)) {
            patientDeposits += transaction.amount || 0;
            totalDeposits += transaction.amount || 0;
          }

          // Count ALL SERVICE transactions as IPD bills for now (to be less restrictive)
          if (transaction.transaction_type === 'SERVICE') {
            patientIPDBills += transaction.amount || 0;
          }

          // Update last activity
          if (transaction.created_at && new Date(transaction.created_at) > new Date(lastActivity)) {
            lastActivity = transaction.created_at;
          }
        });

        // 🐛 DEBUG: Log patient processing results
        logger.log(`🔍 Processing patient: ${patient.first_name || patient.name}`, {
          deposits: patientDeposits,
          ipdBills: patientIPDBills,
          willShow: (patientDeposits > 0 || patientIPDBills > 0)
        });

        // Add patient to billing list (only if they actually have deposits or IPD bills)
        if (patientDeposits > 0 || patientIPDBills > 0) {
          patientBillingsList.push({
            patientId: patient.id || patient.patient_id,
            patientName: patient.first_name ? `${patient.first_name} ${patient.last_name || ''}`.trim() : (patient.name || 'Unknown'),
            totalDeposits: patientDeposits,
            totalIPDBills: patientIPDBills,
            lastActivity: lastActivity,
            status: 'ACTIVE'
          });
        }
      });

      totalRevenue = totalDeposits;

      logger.log('📊 Billing summary:', {
        patients: patientBillingsList.length,
        totalDeposits,
        totalRevenue
      });

      setBillingSummary({
        totalRevenue,
        opdBills: 0,
        ipdBills: 0,
        pendingBills: 0,
        totalDeposits
      });

      setPatientBillings(patientBillingsList);

    } catch (error: any) {
      logger.error('Failed to load billing data:', error);
      toast.error('Failed to load billing data: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const loadPatientDetails = async (patient: PatientBilling) => {
    try {
      setSelectedPatient(patient);
      logger.log('🔍 Loading details for patient:', patient.patientName, 'ID:', patient.patientId);

      // Load deposits for this patient with patient details (same as CombinedBillingModule)
      const { data: depositsData, error: depositsError } = await supabase
        .from('patient_transactions')
        .select(`
          id,
          amount,
          transaction_date,
          created_at,
          payment_mode,
          description,
          status,
          transaction_type,
          transaction_reference,
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
        .eq('patient_id', patient.patientId)
        .in('transaction_type', ['ADMISSION_FEE', 'DEPOSIT', 'ADVANCE_PAYMENT'])
        .order('created_at', { ascending: false });

      if (depositsError) {
        logger.error('❌ Error loading patient deposits:', depositsError);
        toast.error('Failed to load patient deposits');
        return;
      }

      logger.log('✅ Loaded deposits for patient:', depositsData?.length || 0);

      // Load IPD bills for this patient (SERVICE transactions including pending ones)
      const { data: ipdBillsData, error: billsError } = await supabase
        .from('patient_transactions')
        .select('id, amount, transaction_date, created_at, payment_mode, description, status, transaction_type')
        .eq('patient_id', patient.patientId)
        .eq('transaction_type', 'SERVICE')
        .neq('status', 'DELETED') // Include PENDING, COMPLETED, etc.
        .order('created_at', { ascending: false });

      if (billsError) {
        logger.error('❌ Error loading patient IPD bills:', billsError);
        toast.error('Failed to load patient IPD bills');
        return;
      }

      logger.log('✅ Loaded IPD bills for patient:', ipdBillsData?.length || 0);

      setPatientDepositDetails(depositsData || []);
      setPatientIPDBills(ipdBillsData || []);
      setShowPatientModal(true);

    } catch (error: any) {
      logger.error('❌ Error loading patient details:', error);
      toast.error('Failed to load patient details: ' + error.message);
    }
  };

  // Deposit action handlers
  const handlePrintDeposit = (deposit: PatientDepositDetail) => {
    // Convert image to base64
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
          resolve('');
        };
        img.src = '/Receipt2.png';
      });
    };

    const createPrintWindow = (base64Image: string) => {
      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        toast.error('Please allow popups to print the receipt');
        return;
      }

      // Use the unique receipt number that was generated when the deposit was created
      const receiptNo = deposit.transaction_reference || deposit.id;

      // Get patient data from deposit (exactly as in CombinedBillingModule)
      const patientData = (deposit as any).patients || (deposit as any).patient;

      const billHTML = `
        <!DOCTYPE html>
        <html>
          <head>
            <title>Deposit Receipt - ${receiptNo}</title>
            <style>
              @page {
                margin: 0 !important;
                padding: 0 !important;
                border: none !important;
                size: A3 portrait;
                width: 297mm;
                height: 420mm;
              }
              body {
                margin: 0;
                padding: 0;
                font-family: Arial, sans-serif;
                width: 297mm;
                height: 420mm;
                position: relative;
                background: white;
              }
              .background-image {
                position: absolute;
                top: 0;
                left: -10mm;
                width: 317mm;
                height: 420mm;
                z-index: 0;
                pointer-events: none;
              }
              .content {
                position: relative;
                z-index: 1;
                padding: 300px 30px 0 30px;
                color: black;
              }
              @media print {
                body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
              }
            </style>
          </head>
          <body>
            ${base64Image ? `<img src="${base64Image}" class="background-image" />` : ''}
            <div class="content">
              <!-- Patient Information (exactly as in CombinedBillingModule) -->
              <div style="margin-bottom: 30px;">
                <h3 style="font-weight: bold; margin-bottom: 15px; color: black; font-size: 18px; text-decoration: underline;">Patient Information</h3>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 25px; font-size: 16px;">
                  <div>
                    <p style="color: black; margin: 6px 0;"><strong>PATIENT ID:</strong> ${patientData?.patient_id || 'N/A'}</p>
                    <p style="color: black; margin: 6px 0;"><strong>PATIENT NAME:</strong> ${patientData ? `${patientData.first_name} ${patientData.last_name || ''}`.trim() : 'N/A'}</p>
                    <p style="color: black; margin: 6px 0;"><strong>AGE/SEX:</strong> ${patientData?.age || 'N/A'} years / ${patientData?.gender || 'N/A'}</p>
                    <p style="color: black; margin: 6px 0;"><strong>MOBILE:</strong> ${patientData?.phone || 'N/A'}</p>
                    <p style="color: black; margin: 6px 0;"><strong>DR NAME:</strong> ${patientData?.assigned_doctor || 'N/A'}</p>
                    <p style="color: black; margin: 6px 0;"><strong>ADMISSION DATE:</strong> ${patientData?.patient_admissions?.[0]?.admission_date ? new Date(patientData.patient_admissions[0].admission_date).toLocaleDateString('en-IN') : 'N/A'}</p>
                  </div>
                </div>
              </div>

              <!-- Deposit Details (exactly as in CombinedBillingModule) -->
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
            </div>
          </body>
        </html>
      `;

      printWindow.document.write(billHTML);
      printWindow.document.close();
    };

    convertImageToBase64().then((base64Image) => {
      createPrintWindow(base64Image as string);
    }).catch((error) => {
      logger.error('Failed to load Receipt2.png:', error);
      createPrintWindow('');
    });
  };

  const handleDeleteDeposit = async (deposit: PatientDepositDetail) => {
    const confirmDelete = window.confirm(
      `Are you sure you want to delete this deposit?\n\nReceipt No: ${deposit.transaction_reference || deposit.id}\nAmount: ₹${deposit.amount.toLocaleString()}\n\nThis action cannot be undone.`
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
      toast.success(`Deposit deleted successfully!`);

      // Reload patient details to refresh the deposit list
      if (selectedPatient) {
        await loadPatientDetails(selectedPatient);
      }
    } catch (error: any) {
      logger.error('❌ Error in handleDeleteDeposit:', error);
      toast.error(`Failed to delete deposit: ${error?.message || 'Unknown error'}`);
    }
  };

  const handleEditDeposit = (deposit: PatientDepositDetail) => {
    // For now, show a message that edit functionality is coming
    toast.info('Edit functionality: You can edit amount, payment mode, and description for this deposit');
    logger.log('Edit deposit:', deposit);
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

  const filteredAndSortedPatients = patientBillings
    .filter(patient => {
      if (!patient) return false;
      const matchesSearch = (patient.patientName || '').toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'ALL' || patient.status === statusFilter;
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case 'date':
          comparison = new Date(a.lastActivity).getTime() - new Date(b.lastActivity).getTime();
          break;
        case 'deposits':
          comparison = (a.totalDeposits || 0) - (b.totalDeposits || 0);
          break;
        case 'patient':
          comparison = (a.patientName || '').localeCompare(b.patientName || '');
          break;
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading billing data...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">💳 Hospital Billing System</h1>
        <p className="text-gray-600">Comprehensive billing management for IPD services</p>
      </div>

      {/* Navigation Tabs */}
      <div className="mb-6 border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'dashboard', name: 'Dashboard', icon: DollarSign },
            { id: 'ipd', name: 'IPD Billing', icon: Users },
            { id: 'ipd-summary', name: 'IPD Summary', icon: FileText },
            { id: 'combined', name: 'Deposits', icon: Clock }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <tab.icon className="h-4 w-4" />
              <span>{tab.name}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Dashboard Content */}
      {activeTab === 'dashboard' && (
        <div className="space-y-6">
          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-6 rounded-lg text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100">Total Revenue</p>
                  <p className="text-2xl font-bold">₹{(billingSummary.totalRevenue || 0).toLocaleString()}</p>
                </div>
                <DollarSign className="h-8 w-8 text-blue-200" />
              </div>
            </div>

            <div className="bg-gradient-to-r from-green-500 to-green-600 p-6 rounded-lg text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100">Total Deposits</p>
                  <p className="text-2xl font-bold">₹{(billingSummary.totalDeposits || 0).toLocaleString()}</p>
                </div>
                <FileText className="h-8 w-8 text-green-200" />
              </div>
            </div>

            <div className="bg-gradient-to-r from-purple-500 to-purple-600 p-6 rounded-lg text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100">IPD Bills</p>
                  <p className="text-2xl font-bold">{billingSummary.ipdBills}</p>
                </div>
                <Users className="h-8 w-8 text-purple-200" />
              </div>
            </div>

            <div className="bg-gradient-to-r from-orange-500 to-orange-600 p-6 rounded-lg text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-orange-100">Pending Bills</p>
                  <p className="text-2xl font-bold">{billingSummary.pendingBills}</p>
                </div>
                <Clock className="h-8 w-8 text-orange-200" />
              </div>
            </div>
          </div>

          {/* Patient Billing Overview */}
          <div className="bg-white rounded-lg shadow-sm border">
            <div className="p-6 border-b border-gray-200">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                <h2 className="text-xl font-semibold text-gray-800 mb-4 md:mb-0">Patient Billing Overview</h2>

                {/* Search and Filters */}
                <div className="flex flex-col md:flex-row space-y-2 md:space-y-0 md:space-x-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <input
                      type="text"
                      placeholder="Search patients..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value as any)}
                    className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="ALL">All Patients</option>
                    <option value="ACTIVE">Active</option>
                    <option value="DISCHARGED">Discharged</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Patient Table */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort('patient')}
                    >
                      Patient Name {getSortIcon('patient')}
                    </th>
                    <th
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort('deposits')}
                    >
                      Total Deposits {getSortIcon('deposits')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      IPD Bills Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort('date')}
                    >
                      Last Activity {getSortIcon('date')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredAndSortedPatients.map((patient) => (
                    <tr key={patient.patientId} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          onClick={() => loadPatientDetails(patient)}
                          className="text-sm font-medium text-blue-600 hover:text-blue-900 cursor-pointer"
                        >
                          {patient.patientName}
                        </button>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">
                        ₹{(patient.totalDeposits || 0).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-purple-600">
                        ₹{(patient.totalIPDBills || 0).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          patient.status === 'ACTIVE' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {patient.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(patient.lastActivity).toLocaleDateString('en-IN')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => loadPatientDetails(patient)}
                          className="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-50"
                          title="View Details"
                        >
                          <FileText className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {filteredAndSortedPatients.length === 0 && (
                <div className="text-center py-12">
                  <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No patients found</h3>
                  <p className="text-gray-500">Try adjusting your search or filters</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* IPD Billing Module */}
      {activeTab === 'ipd' && <NewIPDBillingModule />}

      {/* IPD Summary Module */}
      {activeTab === 'ipd-summary' && <IPDSummaryModule />}

      {/* Deposits Module */}
      {activeTab === 'combined' && <CombinedBillingModule />}

      {/* Patient Detail Modal */}
      {showPatientModal && selectedPatient && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg max-w-6xl w-full mx-4 max-h-[90vh] overflow-hidden">
            {/* Header */}
            <div className="bg-blue-600 text-white p-6 flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold">{selectedPatient.patientName}</h2>
                <p className="text-blue-100">Patient Billing Details</p>
              </div>
              <button
                onClick={() => setShowPatientModal(false)}
                className="text-white hover:text-blue-200 text-2xl font-bold"
              >
                ×
              </button>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto" style={{ maxHeight: 'calc(90vh - 140px)' }}>
              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                  <h3 className="text-green-800 font-medium mb-1">Total Deposits</h3>
                  <p className="text-2xl font-bold text-green-600">
                    ₹{selectedPatient.totalDeposits.toLocaleString()}
                  </p>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                  <h3 className="text-purple-800 font-medium mb-1">IPD Bills</h3>
                  <p className="text-2xl font-bold text-purple-600">
                    ₹{selectedPatient.totalIPDBills.toLocaleString()}
                  </p>
                </div>
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <h3 className="text-blue-800 font-medium mb-1">Status</h3>
                  <p className={`text-lg font-medium ${
                    selectedPatient.status === 'ACTIVE' ? 'text-green-600' : 'text-gray-600'
                  }`}>
                    {selectedPatient.status}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Deposits Section */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                    <DollarSign className="h-5 w-5 text-green-600 mr-2" />
                    Deposit History
                  </h3>
                  <div className="bg-gray-50 rounded-lg p-4 max-h-80 overflow-y-auto">
                    {patientDepositDetails.length > 0 ? (
                      <div className="space-y-3">
                        {patientDepositDetails.map((deposit) => (
                          <div key={deposit.id} className="bg-white p-3 rounded border">
                            <div className="flex justify-between items-start mb-2">
                              <div>
                                <p className="font-medium text-green-600">
                                  ₹{deposit.amount.toLocaleString()}
                                </p>
                                <p className="text-sm text-gray-600">{deposit.description}</p>
                              </div>
                              <div className="text-right">
                                <p className="text-sm text-gray-500">
                                  {new Date(deposit.transaction_date || deposit.created_at).toLocaleDateString('en-IN')}
                                </p>
                                <p className="text-xs text-gray-400">{deposit.payment_mode || 'CASH'}</p>
                              </div>
                            </div>
                            <div className="flex space-x-2">
                              <button
                                onClick={() => handleEditDeposit(deposit)}
                                className="text-blue-600 hover:text-blue-800 text-xs px-2 py-1 bg-blue-50 rounded flex items-center gap-1"
                                title="Edit Deposit"
                              >
                                <Edit2 className="h-3 w-3" />
                                Edit
                              </button>
                              <button
                                onClick={() => handleDeleteDeposit(deposit)}
                                className="text-red-600 hover:text-red-800 text-xs px-2 py-1 bg-red-50 rounded flex items-center gap-1"
                                title="Delete Deposit"
                              >
                                <Trash2 className="h-3 w-3" />
                                Delete
                              </button>
                              <button
                                onClick={() => handlePrintDeposit(deposit)}
                                className="text-green-600 hover:text-green-800 text-xs px-2 py-1 bg-green-50 rounded flex items-center gap-1"
                                title="Print Receipt"
                              >
                                <Printer className="h-3 w-3" />
                                Print
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-500 text-center py-4">No deposits found</p>
                    )}
                  </div>
                </div>

                {/* IPD Bills Section */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                    <FileText className="h-5 w-5 text-purple-600 mr-2" />
                    IPD Bills
                  </h3>
                  <div className="bg-gray-50 rounded-lg p-4 max-h-80 overflow-y-auto">
                    {patientIPDBills.length > 0 ? (
                      <div className="space-y-3">
                        {patientIPDBills.map((bill: any) => (
                          <div key={bill.id} className="bg-white p-3 rounded border">
                            <div className="flex justify-between items-start mb-2">
                              <div>
                                <p className="font-medium text-purple-600">
                                  ₹{(bill.amount || 0).toLocaleString()}
                                </p>
                                <p className="text-sm text-gray-600">
                                  {bill.description || `Bill #${bill.id.substring(0, 8)}`}
                                </p>
                              </div>
                              <div className="text-right">
                                <p className="text-sm text-gray-500">
                                  {new Date(bill.transaction_date || bill.created_at).toLocaleDateString('en-IN')}
                                </p>
                                <span className={`text-xs px-2 py-1 rounded-full ${
                                  bill.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                                  bill.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                                  bill.status === 'CANCELLED' ? 'bg-red-100 text-red-800' :
                                  'bg-gray-100 text-gray-800'
                                }`}>
                                  {bill.status || 'PENDING'}
                                </span>
                              </div>
                            </div>
                            <div className="flex space-x-2">
                              <button
                                onClick={() => {
                                  setActiveTab('ipd');
                                  setShowPatientModal(false);
                                  toast.success('Navigated to IPD billing');
                                }}
                                className="text-blue-600 hover:text-blue-800 text-xs px-2 py-1 bg-blue-50 rounded"
                              >
                                Edit
                              </button>
                              <button className="text-red-600 hover:text-red-800 text-xs px-2 py-1 bg-red-50 rounded">
                                Delete
                              </button>
                              <button className="text-green-600 hover:text-green-800 text-xs px-2 py-1 bg-green-50 rounded">
                                Print
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-500 text-center py-4">No IPD bills found</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end space-x-3 mt-6 pt-4 border-t border-gray-200">
                <button
                  onClick={() => {
                    setActiveTab('ipd');
                    setShowPatientModal(false);
                    toast.success('Navigated to IPD billing section');
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Manage in IPD Billing
                </button>
                <button
                  onClick={() => setShowPatientModal(false)}
                  className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BillingSection;
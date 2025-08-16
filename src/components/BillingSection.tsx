import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { 
  DollarSign, 
  FileText, 
  Users, 
  Clock, 
  Plus, 
  Edit, 
  Printer, 
  Download,
  Search,
  Filter,
  Calendar,
  Trash2
} from 'lucide-react';
import HospitalService from '../services/hospitalService';
import BillingService, { type BillingSummary, type RecentBill } from '../services/billingService';
import OPDBillingModule from './billing/OPDBillingModule';
import NewIPDBillingModule from './billing/NewIPDBillingModule';
import CombinedBillingModule from './billing/CombinedBillingModule';

// Using interfaces from BillingService

const BillingSection: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'opd' | 'ipd' | 'combined'>('dashboard');
  const [billingSummary, setBillingSummary] = useState<BillingSummary>({
    totalRevenue: 0,
    opdBills: 0,
    ipdBills: 0,
    pendingBills: 0
  });
  const [recentBills, setRecentBills] = useState<RecentBill[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PAID' | 'PENDING' | 'CANCELLED'>('ALL');
  const [sortBy, setSortBy] = useState<'date' | 'amount' | 'patient'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    loadBillingData();
    
    // Subscribe to billing service updates
    const unsubscribe = BillingService.subscribe(() => {
      loadBillingData();
    });
    
    return unsubscribe;
  }, []);

  const loadBillingData = async () => {
    try {
      setLoading(true);
      
      // Load data from BillingService
      const summary = BillingService.getBillingSummary();
      const recentBills = BillingService.getAllRecentBills();

      console.log('📊 Dashboard loading - Summary:', summary);
      console.log('📋 Dashboard loading - Recent bills:', recentBills.length);

      setBillingSummary(summary);
      setRecentBills(recentBills);
      
    } catch (error: any) {
      console.error('Failed to load billing data:', error);
      toast.error('Failed to load billing data: ' + error.message);
    } finally {
      setLoading(false);
    }
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

  const filteredAndSortedBills = recentBills
    .filter(bill => {
      if (!bill) return false;
      const matchesSearch = (bill.patientName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                           (bill.billId || '').toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'ALL' || bill.status === statusFilter;
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case 'date':
          comparison = new Date(a.date).getTime() - new Date(b.date).getTime();
          break;
        case 'amount':
          comparison = (a.amount || 0) - (b.amount || 0);
          break;
        case 'patient':
          comparison = (a.patientName || '').localeCompare(b.patientName || '');
          break;
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });

  const handleEditBill = (billId: string) => {
    const bill = recentBills.find(b => b.billId === billId);
    if (!bill) {
      toast.error('Bill not found');
      return;
    }

    // Navigate to appropriate billing tab based on bill type
    if (bill.type === 'OPD') {
      setActiveTab('opd');
      toast.success(`Navigated to OPD billing to edit ${billId}`);
    } else if (bill.type === 'IPD') {
      setActiveTab('ipd');
      toast.success(`Navigated to IPD billing to edit ${billId}`);
    }
  };

  const handlePrintBill = (billId: string) => {
    const bill = recentBills.find(b => b.billId === billId);
    if (!bill) {
      toast.error('Bill not found');
      return;
    }

    // Create print content
    const printContent = generateBillPrintContent(bill);
    
    // Open print dialog
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
      printWindow.focus();
      printWindow.print();
      printWindow.close();
      toast.success(`Printing ${billId}`);
    } else {
      toast.error('Unable to open print dialog. Please check popup settings.');
    }
  };

  const handleDownloadBill = (billId: string) => {
    const bill = recentBills.find(b => b.billId === billId);
    if (!bill) {
      toast.error('Bill not found');
      return;
    }

    // Create PDF content (simplified version - you can enhance this)
    const pdfContent = generateBillPDFContent(bill);
    
    // Create blob and download
    const blob = new Blob([pdfContent], { type: 'text/html' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${billId}_bill.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    
    toast.success(`Downloaded ${billId} as HTML file`);
  };

  const handleDeleteBill = (billId: string) => {
    const bill = recentBills.find(b => b.billId === billId);
    if (!bill) {
      toast.error('Bill not found');
      return;
    }

    // Confirm deletion
    if (window.confirm(`Are you sure you want to delete bill ${billId}? This action cannot be undone. Note: This will only remove the bill, not the patient from the patient list.`)) {
      try {
        if (bill.type === 'OPD') {
          BillingService.deleteOPDBill(bill.id);
        } else if (bill.type === 'IPD') {
          BillingService.deleteIPDBill(bill.id);
        }
        toast.success(`Bill ${billId} deleted successfully`);
      } catch (error: any) {
        toast.error('Failed to delete bill: ' + error.message);
      }
    }
  };

  const generateBillPrintContent = (bill: RecentBill): string => {
    const currentDate = new Date().toLocaleDateString('en-IN');
    const currentTime = new Date().toLocaleTimeString('en-IN');
    
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Hospital Bill - ${bill.billId}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; color: #333; }
          .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 20px; margin-bottom: 30px; }
          .hospital-name { font-size: 24px; font-weight: bold; color: #2563eb; }
          .bill-info { display: flex; justify-content: space-between; margin-bottom: 30px; }
          .bill-details { background: #f8f9fa; padding: 15px; border-radius: 8px; }
          .amount { font-size: 20px; font-weight: bold; color: #16a34a; }
          .footer { margin-top: 50px; text-align: center; font-size: 12px; color: #666; }
          .status { padding: 5px 10px; border-radius: 15px; font-size: 12px; font-weight: bold; }
          .status-paid { background: #dcfce7; color: #166534; }
          .status-pending { background: #fef3c7; color: #d97706; }
          @media print { .no-print { display: none; } }
        </style>
      </head>
      <body>
        <div class="header">
          <img src="/logo.png" alt="Logo" style="height: 60px; margin: 0 auto;" />
          <div style="margin-top: 10px;">Advanced Healthcare Management</div>
        </div>
        
        <div class="bill-info">
          <div>
            <h3>Bill Information</h3>
            <p><strong>Bill ID:</strong> ${bill.billId}</p>
            <p><strong>Patient:</strong> ${bill.patientName}</p>
            <p><strong>Type:</strong> ${bill.type}</p>
            <p><strong>Date:</strong> ${new Date(bill.date).toLocaleDateString('en-IN')}</p>
          </div>
          
          <div class="bill-details">
            <h3>Payment Details</h3>
            <p class="amount">Amount: ₹${(bill.amount || 0).toLocaleString()}</p>
            <p>Status: <span class="status status-${bill.status.toLowerCase()}">${bill.status}</span></p>
          </div>
        </div>
        
        <div style="border-top: 1px solid #ddd; padding-top: 20px;">
          <p><strong>Bill Generated:</strong> ${currentDate} at ${currentTime}</p>
          <p><em>This is a computer generated bill.</em></p>
        </div>
        
        <div class="footer">
          <p>Thank you for choosing our healthcare services!</p>
          <p>Your Health, Our Priority</p>
        </div>
      </body>
      </html>
    `;
  };

  const generateBillPDFContent = (bill: RecentBill): string => {
    // Similar to print content but optimized for download
    return generateBillPrintContent(bill);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PAID':
        return 'bg-green-100 text-green-800';
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800';
      case 'CANCELLED':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

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
        <p className="text-gray-600">Comprehensive billing management for OPD and IPD services</p>
      </div>

      {/* Navigation Tabs */}
      <div className="mb-6 border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'dashboard', name: 'Dashboard', icon: DollarSign },
            { id: 'opd', name: 'OPD Billing', icon: FileText },
            { id: 'ipd', name: 'IPD Billing', icon: Users },
            { id: 'combined', name: 'Combined Bills', icon: Clock }
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
                  <p className="text-green-100">OPD Bills</p>
                  <p className="text-2xl font-bold">{billingSummary.opdBills}</p>
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

          {/* Recent Bills Section */}
          <div className="bg-white rounded-lg shadow-sm border">
            <div className="p-6 border-b border-gray-200">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                <h2 className="text-xl font-semibold text-gray-800 mb-4 md:mb-0">Recent Bills</h2>
                
                {/* Search and Filters */}
                <div className="flex flex-col md:flex-row space-y-2 md:space-y-0 md:space-x-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <input
                      type="text"
                      placeholder="Search bills..."
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
                    <option value="ALL">All Status</option>
                    <option value="PAID">Paid</option>
                    <option value="PENDING">Pending</option>
                    <option value="CANCELLED">Cancelled</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Bills Table */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort('patient')}
                    >
                      Bill ID / Patient {getSortIcon('patient')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort('amount')}
                    >
                      Amount {getSortIcon('amount')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort('date')}
                    >
                      Date {getSortIcon('date')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredAndSortedBills.map((bill) => (
                    <tr key={bill.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{bill.billId}</div>
                          <div className="text-sm text-gray-500">{bill.patientName}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          bill.type === 'OPD' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'
                        }`}>
                          {bill.type}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        ₹{(bill.amount || 0).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(bill.status)}`}>
                          {bill.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(bill.date).toLocaleDateString('en-IN')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleEditBill(bill.billId)}
                            className="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-50"
                            title="Edit Bill"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handlePrintBill(bill.billId)}
                            className="text-green-600 hover:text-green-900 p-1 rounded hover:bg-green-50"
                            title="Print Bill"
                          >
                            <Printer className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDownloadBill(bill.billId)}
                            className="text-purple-600 hover:text-purple-900 p-1 rounded hover:bg-purple-50"
                            title="Download Bill"
                          >
                            <Download className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteBill(bill.billId)}
                            className="text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-50"
                            title="Delete Bill"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {filteredAndSortedBills.length === 0 && (
                <div className="text-center py-12">
                  <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No bills found</h3>
                  <p className="text-gray-500">Try adjusting your search or filters</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* OPD Billing Module */}
      {activeTab === 'opd' && <OPDBillingModule />}

      {/* IPD Billing Module */}
      {activeTab === 'ipd' && <NewIPDBillingModule />}

      {/* Combined Billing Module */}
      {activeTab === 'combined' && <CombinedBillingModule />}
    </div>
  );
};

export default BillingSection;
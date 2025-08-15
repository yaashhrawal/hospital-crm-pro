import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import toast from 'react-hot-toast';
import { Plus, Search, Edit, Printer, Download, X, Calendar, User, Stethoscope, Trash2 } from 'lucide-react';
import HospitalService from '../../services/hospitalService';
import DoctorService, { type DoctorInfo } from '../../services/doctorService';
import BillingService, { type OPDBill } from '../../services/billingService';
import type { PatientWithRelations } from '../../config/supabaseNew';
import ReceiptTemplate, { type ReceiptData } from '../receipts/ReceiptTemplate';

// Using PatientWithRelations from config instead of local interface

// Using DoctorInfo from service instead of local interface

// Using OPDBill interface from BillingService

interface OPDBillFormData {
  patientId: string;
  doctorId: string;
  consultationFee: number;
  investigationCharges: number;
  medicineCharges: number;
  otherCharges: number;
  discount: number;
  discountReason: string;
  paymentMode: 'CASH' | 'CARD' | 'UPI' | 'BANK_TRANSFER';
  services: string[];
  notes: string;
}

const OPDBillingModule: React.FC = () => {
  const [showCreateBill, setShowCreateBill] = useState(false);
  const [opdBills, setOpdBills] = useState<OPDBill[]>([]);
  const [patients, setPatients] = useState<PatientWithRelations[]>([]);
  const [doctors, setDoctors] = useState<DoctorInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PAID' | 'PENDING' | 'CANCELLED'>('ALL');
  
  const [formData, setFormData] = useState<OPDBillFormData>({
    patientId: '',
    doctorId: '',
    consultationFee: 500,
    investigationCharges: 0,
    medicineCharges: 0,
    otherCharges: 0,
    discount: 0,
    discountReason: '',
    paymentMode: 'CASH',
    services: [],
    notes: ''
  });

  const [patientSearchTerm, setPatientSearchTerm] = useState('');
  const [showPatientDropdown, setShowPatientDropdown] = useState(false);
  const [doctorSearchTerm, setDoctorSearchTerm] = useState('');
  const [showDoctorDropdown, setShowDoctorDropdown] = useState(false);

  const commonServices = [
    'General Consultation',
    'Follow-up Consultation',
    'Blood Pressure Check',
    'Blood Sugar Test',
    'ECG',
    'X-Ray',
    'Ultrasound',
    'Blood Test',
    'Urine Test',
    'Prescription',
    'Dressing',
    'Injection',
    'Vaccination',
    'Health Checkup'
  ];

  useEffect(() => {
    loadData();
    
    // Subscribe to billing service updates
    const unsubscribe = BillingService.subscribe(() => {
      const updatedBills = BillingService.getOPDBills();
      setOpdBills(updatedBills);
    });
    
    return unsubscribe;
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Load actual patients from HospitalService
      const actualPatients = await HospitalService.getPatients(1000);
      console.log('📋 Loaded patients for OPD billing:', actualPatients.length);

      // Load actual doctors from DoctorService (same as patient entry)
      const actualDoctors = DoctorService.getAllDoctors();
      console.log('👨‍⚕️ Loaded doctors for OPD billing:', actualDoctors.length);

      // Load existing bills from BillingService
      const existingBills = BillingService.getOPDBills();
      console.log('💰 Loaded existing OPD bills:', existingBills.length);

      setPatients(actualPatients);
      setDoctors(actualDoctors);
      setOpdBills(existingBills);
      
    } catch (error: any) {
      console.error('Failed to load OPD billing data:', error);
      toast.error('Failed to load data: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const filteredPatients = patients.filter(patient =>
    `${patient.first_name} ${patient.last_name}`.toLowerCase().includes(patientSearchTerm.toLowerCase()) ||
    patient.patient_id.toLowerCase().includes(patientSearchTerm.toLowerCase()) ||
    patient.phone.includes(patientSearchTerm)
  );

  const filteredDoctors = doctors.filter(doctor =>
    doctor.name.toLowerCase().includes(doctorSearchTerm.toLowerCase()) ||
    (doctor.specialization || doctor.department).toLowerCase().includes(doctorSearchTerm.toLowerCase())
  );

  const filteredBills = opdBills.filter(bill => {
    const matchesSearch = bill.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         bill.billId.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         bill.doctorName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || bill.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const calculateTotal = () => {
    const subtotal = formData.consultationFee + formData.investigationCharges + 
                    formData.medicineCharges + formData.otherCharges;
    return subtotal - formData.discount;
  };

  const handleServiceToggle = (service: string) => {
    setFormData(prev => ({
      ...prev,
      services: prev.services.includes(service)
        ? prev.services.filter(s => s !== service)
        : [...prev.services, service]
    }));
  };

  const handlePatientSelect = (patient: PatientWithRelations) => {
    setFormData(prev => ({ ...prev, patientId: patient.id }));
    setPatientSearchTerm(`${patient.first_name} ${patient.last_name} (${patient.patient_id})`);
    setShowPatientDropdown(false);
    
    // Auto-fill consultation fee based on patient history or default
    if (patient.transactions && patient.transactions.length > 0) {
      // Use the most recent consultation fee as default
      const lastTransaction = patient.transactions
        .filter(t => t.transaction_type === 'CONSULTATION')
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];
      
      if (lastTransaction) {
        setFormData(prev => ({ 
          ...prev, 
          consultationFee: lastTransaction.consultation_fee || 500 
        }));
        toast.success(`Auto-filled consultation fee from last visit: ₹${lastTransaction.consultation_fee || 500}`);
      }
    }
  };

  const handleDoctorSelect = (doctor: DoctorInfo) => {
    setFormData(prev => ({ ...prev, doctorId: doctor.id || doctor.name }));
    setDoctorSearchTerm(`${doctor.name} - ${doctor.specialization || doctor.department}`);
    setShowDoctorDropdown(false);
    
    // Auto-fill default consultation fee based on department
    const departmentFees: { [key: string]: number } = {
      'ORTHOPAEDIC': 600,
      'NEUROLOGY': 800,
      'GASTRO': 700,
      'GYN.': 650,
      'UROLOGY': 600,
      'GENERAL PHYSICIAN': 400,
      'ENDOCRINOLOGY': 750,
      'MEDICAL ONCOLOGY': 900,
      'SURGICAL ONCOLOGY': 1000,
      'NEUROSURGERY': 1200,
      'DIETICIAN': 300
    };
    
    const suggestedFee = departmentFees[doctor.department] || 500;
    setFormData(prev => ({ 
      ...prev, 
      consultationFee: suggestedFee 
    }));
    
    toast.success(`Auto-filled consultation fee for ${doctor.department}: ₹${suggestedFee}`);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.patientId || !formData.doctorId) {
      toast.error('Please select patient and doctor');
      return;
    }

    try {
      // Create new bill using BillingService
      const newBill: OPDBill = {
        id: Date.now().toString(),
        billId: BillingService.generateOPDBillId(),
        patientId: formData.patientId,
        patientName: patientSearchTerm.split(' (')[0],
        doctorId: formData.doctorId,
        doctorName: doctorSearchTerm.split(' - ')[0],
        services: formData.services,
        consultationFee: formData.consultationFee,
        investigationCharges: formData.investigationCharges,
        medicineCharges: formData.medicineCharges,
        otherCharges: formData.otherCharges,
        discount: formData.discount,
        totalAmount: calculateTotal(),
        status: 'PAID',
        billDate: new Date().toISOString().split('T')[0],
        paymentMode: formData.paymentMode
      };

      // Save to BillingService - this will automatically update all components
      BillingService.saveOPDBill(newBill);
      
      toast.success(`OPD bill ${newBill.billId} created successfully!`);
      setShowCreateBill(false);
      resetForm();
      
    } catch (error: any) {
      toast.error('Failed to create bill: ' + error.message);
    }
  };

  const resetForm = () => {
    setFormData({
      patientId: '',
      doctorId: '',
      consultationFee: 500,
      investigationCharges: 0,
      medicineCharges: 0,
      otherCharges: 0,
      discount: 0,
      discountReason: '',
      paymentMode: 'CASH',
      services: [],
      notes: ''
    });
    setPatientSearchTerm('');
    setDoctorSearchTerm('');
  };

  const handleEditBill = (billId: string) => {
    const bill = opdBills.find(b => b.billId === billId);
    if (!bill) {
      toast.error('Bill not found');
      return;
    }

    // Find the patient and pre-fill the form
    const patient = patients.find(p => p.id === bill.patientId);
    if (patient) {
      setPatientSearchTerm(`${patient.first_name} ${patient.last_name} (${patient.patient_id})`);
      setFormData(prev => ({
        ...prev,
        patientId: bill.patientId,
        doctorId: bill.doctorId,
        consultationFee: bill.consultationFee,
        investigationCharges: bill.investigationCharges,
        medicineCharges: bill.medicineCharges,
        otherCharges: bill.otherCharges,
        discount: bill.discount,
        services: bill.services,
        paymentMode: bill.paymentMode || 'CASH'
      }));

      // Set doctor search term
      const doctor = doctors.find(d => d.id === bill.doctorId || d.name === bill.doctorId);
      if (doctor) {
        setDoctorSearchTerm(`${doctor.name} - ${doctor.specialization || doctor.department}`);
      }

      setShowCreateBill(true);
      toast.success(`Editing bill ${billId}`);
    }
  };

  const handlePrintBill = async (billId: string) => {
    const bill = opdBills.find(b => b.billId === billId);
    if (!bill) {
      toast.error('Bill not found');
      return;
    }

    // Fetch complete patient details
    let patientDetails = null;
    try {
      patientDetails = await HospitalService.getPatientById(bill.patientId);
    } catch (error) {
      console.warn('Could not fetch patient details:', error);
    }

    // Prepare receipt data in ReceiptTemplate format
    const receiptData: ReceiptData = {
      type: 'CONSULTATION',
      receiptNumber: bill.billId,
      date: new Date(bill.billDate).toLocaleDateString('en-IN'),
      time: new Date(bill.billDate).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      }),
      
      hospital: {
        name: 'VALANT HOSPITAL',
        address: 'Madhuban, Siwan, Bihar',
        phone: '+91 99999 99999',
        email: 'info@valanthospital.com',
        registration: 'REG/2024/001',
        gst: 'GST123456789'
      },
      
      patient: {
        id: patientDetails?.patient_id || bill.patientId.slice(-6).toUpperCase(),
        name: patientDetails ? `${patientDetails.first_name} ${patientDetails.last_name || ''}`.trim() : bill.patientName,
        phone: patientDetails?.phone || bill.patientPhone || 'N/A',
        age: patientDetails?.age,
        gender: patientDetails?.gender,
        address: patientDetails?.address,
        bloodGroup: patientDetails?.blood_group
      },
      
      charges: [],
      
      payments: [{
        mode: bill.paymentMode,
        amount: bill.totalAmount
      }],
      
      totals: {
        subtotal: (bill.totalAmount || 0) + (bill.discount || 0),
        discount: bill.discount || 0,
        insurance: 0,
        netAmount: bill.totalAmount || 0,
        amountPaid: bill.totalAmount || 0,
        balance: 0
      },
      
      staff: {
        processedBy: 'OPD Billing',
        authorizedBy: bill.doctorName
      },
      
      notes: bill.notes || '',
      isOriginal: true
    };

    // Add consultation fee
    receiptData.charges.push({
      description: `Consultation Fee - Dr. ${bill.doctorName}`,
      amount: bill.consultationFee,
      quantity: 1,
      rate: bill.consultationFee
    });

    // Add investigation charges
    if (bill.investigationCharges > 0) {
      receiptData.charges.push({
        description: 'Investigation Charges',
        amount: bill.investigationCharges,
        quantity: 1,
        rate: bill.investigationCharges
      });
    }

    // Add medicine charges
    if (bill.medicineCharges > 0) {
      receiptData.charges.push({
        description: 'Medicine Charges',
        amount: bill.medicineCharges,
        quantity: 1,
        rate: bill.medicineCharges
      });
    }

    // Add other charges
    if (bill.otherCharges > 0) {
      receiptData.charges.push({
        description: 'Other Charges',
        amount: bill.otherCharges,
        quantity: 1,
        rate: bill.otherCharges
      });
    }

    // Add services
    if (bill.services && bill.services.length > 0) {
      bill.services.forEach(service => {
        receiptData.charges.push({
          description: service,
          amount: 0, // Services are included in other charges
          quantity: 1,
          rate: 0
        });
      });
    }

    // Create temporary container for printing
    const printContainer = document.createElement('div');
    printContainer.style.position = 'fixed';
    printContainer.style.top = '0';
    printContainer.style.left = '0';
    printContainer.style.width = '100%';
    printContainer.style.height = '100%';
    printContainer.style.zIndex = '9999';
    printContainer.style.backgroundColor = 'white';
    document.body.appendChild(printContainer);

    // Render the ReceiptTemplate
    const root = createRoot(printContainer);
    root.render(<ReceiptTemplate data={receiptData} />);

    // Wait for render and then print
    setTimeout(() => {
      window.print();
      setTimeout(() => {
        root.unmount();
        document.body.removeChild(printContainer);
      }, 100);
    }, 100);

    toast.success(`Printing OPD bill ${billId}`);
  };

  const handleDownloadBill = (billId: string) => {
    const bill = opdBills.find(b => b.billId === billId);
    if (!bill) {
      toast.error('Bill not found');
      return;
    }

    const pdfContent = generateOPDBillPrint(bill);
    const blob = new Blob([pdfContent], { type: 'text/html' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${billId}_OPD_Bill.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    
    toast.success(`Downloaded ${billId} as HTML file`);
  };

  const handleDeleteBill = (billId: string) => {
    const bill = opdBills.find(b => b.billId === billId);
    if (!bill) {
      toast.error('Bill not found');
      return;
    }

    // Confirm deletion
    if (window.confirm(`Are you sure you want to delete OPD bill ${billId}? This action cannot be undone. Note: This will only remove the bill, not the patient from the patient list.`)) {
      try {
        BillingService.deleteOPDBill(bill.id);
        toast.success(`OPD bill ${billId} deleted successfully`);
      } catch (error: any) {
        toast.error('Failed to delete bill: ' + error.message);
      }
    }
  };

  const generateOPDBillPrint = (bill: OPDBill): string => {
    const currentDate = new Date().toLocaleDateString('en-IN');
    const currentTime = new Date().toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
    
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>OPD Bill - ${bill.billId}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; color: #333; }
          .header { text-align: center; border-bottom: 2px solid #2563eb; padding-bottom: 20px; margin-bottom: 30px; }
          .hospital-name { font-size: 28px; font-weight: bold; color: #2563eb; }
          .bill-type { background: #3b82f6; color: white; padding: 8px 16px; border-radius: 20px; display: inline-block; margin: 10px 0; }
          .bill-info { display: grid; grid-template-columns: 1fr 1fr; gap: 30px; margin-bottom: 30px; }
          .section { background: #f8f9fa; padding: 20px; border-radius: 8px; }
          .services-list { margin: 15px 0; }
          .service-item { padding: 8px; background: #e3f2fd; margin: 5px 0; border-radius: 4px; }
          .total-section { background: #16a34a; color: white; padding: 20px; border-radius: 8px; text-align: center; }
          .amount { font-size: 24px; font-weight: bold; }
          .breakdown { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin: 15px 0; }
          .breakdown-item { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #ddd; }
          .footer { margin-top: 40px; text-align: center; font-size: 12px; color: #666; border-top: 1px solid #ddd; padding-top: 20px; }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="hospital-name">🏥 Hospital CRM Pro</div>
          <div>Comprehensive Healthcare Management</div>
          <div class="bill-type">OPD BILL</div>
        </div>
        
        <div class="bill-info">
          <div class="section">
            <h3 style="color: #2563eb;">Bill Information</h3>
            <p><strong>Bill ID:</strong> ${bill.billId}</p>
            <p><strong>Patient:</strong> ${bill.patientName}</p>
            <p><strong>Date:</strong> ${new Date(bill.billDate).toLocaleDateString('en-IN')}</p>
            <p><strong>Status:</strong> <span style="color: #16a34a; font-weight: bold;">${bill.status}</span></p>
          </div>
          
          <div class="section">
            <h3 style="color: #2563eb;">Doctor Information</h3>
            <p><strong>Doctor:</strong> ${bill.doctorName}</p>
            <p><strong>Payment Mode:</strong> ${bill.paymentMode || 'CASH'}</p>
          </div>
        </div>

        <div class="section">
          <h3 style="color: #2563eb;">Services Provided</h3>
          <div class="services-list">
            ${bill.services.map(service => `<div class="service-item">✓ ${service}</div>`).join('')}
          </div>
        </div>

        <div class="section">
          <h3 style="color: #2563eb;">Bill Breakdown</h3>
          <div class="breakdown">
            <div class="breakdown-item">
              <span>Consultation Fee:</span>
              <span>₹${bill.consultationFee.toLocaleString()}</span>
            </div>
            <div class="breakdown-item">
              <span>Investigation Charges:</span>
              <span>₹${bill.investigationCharges.toLocaleString()}</span>
            </div>
            <div class="breakdown-item">
              <span>Medicine Charges:</span>
              <span>₹${bill.medicineCharges.toLocaleString()}</span>
            </div>
            <div class="breakdown-item">
              <span>Other Charges:</span>
              <span>₹${bill.otherCharges.toLocaleString()}</span>
            </div>
            ${bill.discount > 0 ? `
            <div class="breakdown-item" style="color: #dc2626;">
              <span>Discount:</span>
              <span>-₹${bill.discount.toLocaleString()}</span>
            </div>
            ` : ''}
          </div>
        </div>
        
        <div class="total-section">
          <div class="amount">Total Amount: ₹${bill.totalAmount.toLocaleString()}</div>
        </div>
        
        <div class="footer">
          <p><strong>Bill Generated:</strong> ${currentDate} at ${currentTime}</p>
          <p><em>This is a computer generated OPD bill.</em></p>
          <p>Thank you for choosing our healthcare services!</p>
          <p>Hospital CRM Pro - Your Health, Our Priority</p>
        </div>
      </body>
      </html>
    `;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PAID': return 'bg-green-100 text-green-800';
      case 'PENDING': return 'bg-yellow-100 text-yellow-800';
      case 'CANCELLED': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading OPD billing data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Create Button */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">OPD Billing</h2>
          <p className="text-gray-600">Manage outpatient department bills</p>
        </div>
        <button
          onClick={() => setShowCreateBill(true)}
          className="mt-4 md:mt-0 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2 transition-colors"
        >
          <Plus className="h-4 w-4" />
          <span>Create OPD Bill</span>
        </button>
      </div>

      {/* Search and Filters */}
      <div className="bg-white p-4 rounded-lg shadow-sm border">
        <div className="flex flex-col md:flex-row space-y-2 md:space-y-0 md:space-x-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              placeholder="Search by patient, bill ID, or doctor..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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

      {/* OPD Bills Table */}
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Bill ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Patient
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Doctor
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Services
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredBills.map((bill) => (
                <tr key={bill.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {bill.billId}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {bill.patientName}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {bill.doctorName}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    <div className="max-w-xs truncate" title={bill.services.join(', ')}>
                      {bill.services.join(', ')}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    ₹{bill.totalAmount.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(bill.status)}`}>
                      {bill.status}
                    </span>
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

          {filteredBills.length === 0 && (
            <div className="text-center py-12">
              <h3 className="text-lg font-medium text-gray-900 mb-2">No OPD bills found</h3>
              <p className="text-gray-500">Create your first OPD bill to get started</p>
            </div>
          )}
        </div>
      </div>

      {/* Create OPD Bill Modal */}
      {showCreateBill && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-gray-800">Create OPD Bill</h3>
                <button
                  onClick={() => setShowCreateBill(false)}
                  className="text-gray-400 hover:text-gray-600 p-1 rounded hover:bg-gray-100"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Patient and Doctor Selection */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Patient Selection */}
                  <div className="relative">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <User className="inline h-4 w-4 mr-1" />
                      Patient *
                    </label>
                    <input
                      type="text"
                      placeholder="Search patient by name, ID, or phone..."
                      value={patientSearchTerm}
                      onChange={(e) => {
                        setPatientSearchTerm(e.target.value);
                        setShowPatientDropdown(true);
                      }}
                      onFocus={() => setShowPatientDropdown(true)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                    {showPatientDropdown && filteredPatients.length > 0 && (
                      <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
                        {filteredPatients.map((patient) => (
                          <div
                            key={patient.id}
                            onClick={() => handlePatientSelect(patient)}
                            className="px-3 py-2 hover:bg-gray-100 cursor-pointer"
                          >
                            <div className="font-medium">{patient.first_name} {patient.last_name}</div>
                            <div className="text-sm text-gray-500">{patient.patient_id} • {patient.phone}</div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Doctor Selection */}
                  <div className="relative">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Stethoscope className="inline h-4 w-4 mr-1" />
                      Doctor *
                    </label>
                    <input
                      type="text"
                      placeholder="Search doctor by name or specialization..."
                      value={doctorSearchTerm}
                      onChange={(e) => {
                        setDoctorSearchTerm(e.target.value);
                        setShowDoctorDropdown(true);
                      }}
                      onFocus={() => setShowDoctorDropdown(true)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                    {showDoctorDropdown && filteredDoctors.length > 0 && (
                      <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
                        {filteredDoctors.map((doctor) => (
                          <div
                            key={doctor.id || doctor.name}
                            onClick={() => handleDoctorSelect(doctor)}
                            className="px-3 py-2 hover:bg-gray-100 cursor-pointer"
                          >
                            <div className="font-medium">{doctor.name}</div>
                            <div className="text-sm text-gray-500">{doctor.specialization || doctor.department}</div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Services Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Services Provided</label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-40 overflow-y-auto border border-gray-300 rounded-md p-3">
                    {commonServices.map((service) => (
                      <label key={service} className="flex items-center space-x-2 text-sm">
                        <input
                          type="checkbox"
                          checked={formData.services.includes(service)}
                          onChange={() => handleServiceToggle(service)}
                          className="rounded text-blue-600 focus:ring-blue-500"
                        />
                        <span>{service}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Bill Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Consultation Fee</label>
                    <input
                      type="number"
                      value={formData.consultationFee}
                      onChange={(e) => setFormData(prev => ({ ...prev, consultationFee: parseFloat(e.target.value) || 0 }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      min="0"
                      step="0.01"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Investigation Charges</label>
                    <input
                      type="number"
                      value={formData.investigationCharges}
                      onChange={(e) => setFormData(prev => ({ ...prev, investigationCharges: parseFloat(e.target.value) || 0 }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      min="0"
                      step="0.01"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Medicine Charges</label>
                    <input
                      type="number"
                      value={formData.medicineCharges}
                      onChange={(e) => setFormData(prev => ({ ...prev, medicineCharges: parseFloat(e.target.value) || 0 }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      min="0"
                      step="0.01"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Other Charges</label>
                    <input
                      type="number"
                      value={formData.otherCharges}
                      onChange={(e) => setFormData(prev => ({ ...prev, otherCharges: parseFloat(e.target.value) || 0 }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      min="0"
                      step="0.01"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Discount</label>
                    <input
                      type="number"
                      value={formData.discount}
                      onChange={(e) => setFormData(prev => ({ ...prev, discount: parseFloat(e.target.value) || 0 }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      min="0"
                      step="0.01"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Payment Mode</label>
                    <select
                      value={formData.paymentMode}
                      onChange={(e) => setFormData(prev => ({ ...prev, paymentMode: e.target.value as any }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="CASH">Cash</option>
                      <option value="CARD">Card</option>
                      <option value="UPI">UPI</option>
                      <option value="BANK_TRANSFER">Bank Transfer</option>
                    </select>
                  </div>
                </div>

                {/* Discount Reason */}
                {formData.discount > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Discount Reason</label>
                    <input
                      type="text"
                      value={formData.discountReason}
                      onChange={(e) => setFormData(prev => ({ ...prev, discountReason: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Reason for discount"
                    />
                  </div>
                )}

                {/* Notes */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={3}
                    placeholder="Additional notes..."
                  />
                </div>

                {/* Total Amount Display */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex justify-between items-center text-lg font-semibold">
                    <span>Total Amount:</span>
                    <span className="text-blue-600">₹{calculateTotal().toLocaleString()}</span>
                  </div>
                  <div className="text-sm text-gray-600 mt-1">
                    Subtotal: ₹{(formData.consultationFee + formData.investigationCharges + formData.medicineCharges + formData.otherCharges).toLocaleString()}
                    {formData.discount > 0 && ` - Discount: ₹${formData.discount.toLocaleString()}`}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end space-x-3 pt-4 border-t">
                  <button
                    type="button"
                    onClick={() => setShowCreateBill(false)}
                    className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                  >
                    Create Bill
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OPDBillingModule;
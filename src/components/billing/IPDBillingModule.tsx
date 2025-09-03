import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import toast from 'react-hot-toast';
import { Plus, Search, Edit, Printer, Download, X, Calendar, User, Bed, Trash2, Calculator } from 'lucide-react';
import HospitalService from '../../services/hospitalService';
import DoctorService from '../../services/doctorService';
import BillingService, { type IPDBill, type StaySegment, type IPDService } from '../../services/billingService';
import type { PatientWithRelations } from '../../config/supabaseNew';
import ReceiptTemplate, { type ReceiptData } from '../receipts/ReceiptTemplate';

// Using PatientWithRelations from config instead of local interface

// Using interfaces from BillingService

interface IPDBillFormData {
  patientId: string;
  admissionDate: string;
  dischargeDate: string;
  admissionCharges: number;
  staySegments: StaySegment[];
  services: IPDService[];
  paymentMode: 'CASH' | 'CARD' | 'UPI' | 'BANK_TRANSFER';
  notes: string;
}

const IPDBillingModule: React.FC = () => {
  const [showCreateBill, setShowCreateBill] = useState(false);
  const [ipdBills, setIpdBills] = useState<IPDBill[]>([]);
  const [patients, setPatients] = useState<PatientWithRelations[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PAID' | 'PENDING' | 'CANCELLED'>('ALL');
  
  const [formData, setFormData] = useState<IPDBillFormData>({
    patientId: '',
    admissionDate: '',
    dischargeDate: '',
    admissionCharges: 2000,
    staySegments: [],
    services: [],
    paymentMode: 'CASH',
    notes: ''
  });

  const [patientSearchTerm, setPatientSearchTerm] = useState('');
  const [showPatientDropdown, setShowPatientDropdown] = useState(false);

  const roomTypes = [
    { value: 'GENERAL_WARD', label: 'General Ward' },
    { value: 'ICU', label: 'ICU' },
    { value: 'DELUXE_ROOM', label: 'Deluxe Room' },
    { value: 'PRIVATE_ROOM', label: 'Private Room' },
    { value: 'SEMI_PRIVATE', label: 'Semi Private Room' }
  ];

  const ipdServices = [
    'Consultant Visits',
    'Physiotherapy Visits',
    'Anesthetist Charge',
    'Surgeon Fees',
    'OT Assistant Charge',
    'Implant Cost',
    'MRD Charge',
    'BMW Charge',
    'DRESSING MAJOR',
    'Dressing MINOR',
    'RT INSERTION',
    'FOLEYS CATH',
    'LUMBER PUNCTURE',
    'INTUBATION',
    'CHEMOTHERAPY',
    'ASCITC/PLURAL TAPPING',
    'TRACHEOSTOMY',
    'CENTRAL LINE INSERTION',
    'BLOOD TRANSFUSION',
    'TOTAL RBS PER DAY',
    'KNEE ASPIRATION',
    'TOTAL NEB. PER DAY',
    'DIALYSIS',
    'GASTRIC LAVAGE',
    'STEAM INHALATION',
    'SUPRA PUBIC CATH',
    'POP SLAB/CAST',
    'ARTERIAL LINE INSERTION',
    'ABG ANALYSIS',
    'Oxygen Charge',
    'Air Bed Charges',
    'Water Bed Charges',
    'Ventilator Charges',
    'C Pap Charges',
    'Bi Pap Charges',
    'Syringe Pump Charges',
    'Other',
    'PAC Charges'
  ];

  useEffect(() => {
    loadData();
    
    // Subscribe to billing service updates
    const unsubscribe = BillingService.subscribe(() => {
      const updatedBills = BillingService.getIPDBills();
      setIpdBills(updatedBills);
    });
    
    return unsubscribe;
  }, []);

  useEffect(() => {
    // Initialize services when component mounts
    if (formData.services.length === 0) {
      const initialServices = ipdServices.map(service => ({
        name: service,
        selected: false,
        amount: 0
      }));
      setFormData(prev => ({ ...prev, services: initialServices }));
    }
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Load actual patients from HospitalService
      const actualPatients = await HospitalService.getPatients(50000, true, true);
      console.log('🏥 Loaded patients for IPD billing:', actualPatients.length);

      // Filter patients who have IPD status or admissions
      const ipdPatients = actualPatients.filter(patient => 
        patient.ipd_status === 'ADMITTED' || 
        patient.ipd_status === 'DISCHARGED' ||
        (patient.admissions && patient.admissions.length > 0)
      );

      console.log('🛏️ Patients with IPD history:', ipdPatients.length);

      // Load existing bills from BillingService
      const existingBills = BillingService.getIPDBills();
      console.log('💰 Loaded existing IPD bills:', existingBills.length);

      setPatients(actualPatients); // Show all patients, not just IPD ones
      setIpdBills(existingBills);
      
    } catch (error: any) {
      console.error('Failed to load IPD billing data:', error);
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

  const filteredBills = ipdBills.filter(bill => {
    const matchesSearch = bill.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         bill.billId.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || bill.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const calculateDays = (startDate: string, endDate: string): number => {
    if (!startDate || !endDate) return 0;
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const calculateSegmentTotal = (segment: StaySegment): number => {
    const days = calculateDays(segment.startDate, segment.endDate);
    return (segment.bedCharge + segment.rmoCharge + segment.nursingCharge) * days;
  };

  const calculateTotalStayCharges = (): number => {
    return formData.staySegments.reduce((total, segment) => total + calculateSegmentTotal(segment), 0);
  };

  const calculateTotalServiceCharges = (): number => {
    return formData.services
      .filter(service => service.selected)
      .reduce((total, service) => total + service.amount, 0);
  };

  const calculateGrandTotal = (): number => {
    return formData.admissionCharges + calculateTotalStayCharges() + calculateTotalServiceCharges();
  };

  const addStaySegment = () => {
    const newSegment: StaySegment = {
      id: Date.now().toString(),
      roomType: 'GENERAL_WARD',
      startDate: '',
      endDate: '',
      bedCharge: 1000,
      rmoCharge: 200,
      nursingCharge: 300,
      days: 0,
      totalCharge: 0
    };
    
    setFormData(prev => ({
      ...prev,
      staySegments: [...prev.staySegments, newSegment]
    }));
  };

  const updateStaySegment = (segmentId: string, updates: Partial<StaySegment>) => {
    setFormData(prev => ({
      ...prev,
      staySegments: prev.staySegments.map(segment => {
        if (segment.id === segmentId) {
          const updated = { ...segment, ...updates };
          updated.days = calculateDays(updated.startDate, updated.endDate);
          updated.totalCharge = calculateSegmentTotal(updated);
          return updated;
        }
        return segment;
      })
    }));
  };

  const removeStaySegment = (segmentId: string) => {
    setFormData(prev => ({
      ...prev,
      staySegments: prev.staySegments.filter(segment => segment.id !== segmentId)
    }));
  };

  const updateService = (serviceName: string, updates: Partial<IPDService>) => {
    setFormData(prev => ({
      ...prev,
      services: prev.services.map(service =>
        service.name === serviceName ? { ...service, ...updates } : service
      )
    }));
  };

  const handlePatientSelect = (patient: PatientWithRelations) => {
    setFormData(prev => ({ ...prev, patientId: patient.id }));
    setPatientSearchTerm(`${patient.first_name} ${patient.last_name} (${patient.patient_id})`);
    setShowPatientDropdown(false);
    
    // Auto-fill admission data if patient has admission history
    if (patient.admissions && patient.admissions.length > 0) {
      const latestAdmission = patient.admissions
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];
      
      if (latestAdmission) {
        const admissionDate = latestAdmission.admission_date ? 
          new Date(latestAdmission.admission_date).toISOString().split('T')[0] : '';
        
        // For discharge date, use current date if patient is still admitted
        const dischargeDate = patient.ipd_status === 'DISCHARGED' && latestAdmission.updated_at ?
          new Date(latestAdmission.updated_at).toISOString().split('T')[0] :
          new Date().toISOString().split('T')[0];
        
        setFormData(prev => ({
          ...prev,
          admissionDate,
          dischargeDate
        }));
        
        // Auto-add a stay segment based on bed information
        if (latestAdmission.bed_number) {
          const autoSegment: StaySegment = {
            id: Date.now().toString(),
            roomType: 'GENERAL_WARD', // Default, user can change
            startDate: admissionDate,
            endDate: dischargeDate,
            bedCharge: 1000, // Default values
            rmoCharge: 200,
            nursingCharge: 300,
            days: calculateDays(admissionDate, dischargeDate),
            totalCharge: 0
          };
          
          autoSegment.totalCharge = calculateSegmentTotal(autoSegment);
          
          setFormData(prev => ({
            ...prev,
            staySegments: [autoSegment]
          }));
        }
        
        toast.success(`Auto-filled admission data from latest admission (${admissionDate})`);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.patientId || !formData.admissionDate || !formData.dischargeDate) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (formData.staySegments.length === 0) {
      toast.error('Please add at least one stay segment');
      return;
    }

    try {
      const newBill: IPDBill = {
        id: Date.now().toString(),
        billId: BillingService.generateIPDBillId(),
        patientId: formData.patientId,
        patientName: patientSearchTerm.split(' (')[0],
        admissionDate: formData.admissionDate,
        dischargeDate: formData.dischargeDate,
        admissionCharges: formData.admissionCharges,
        staySegments: formData.staySegments,
        services: formData.services.filter(service => service.selected),
        totalStayCharges: calculateTotalStayCharges(),
        totalServiceCharges: calculateTotalServiceCharges(),
        grandTotal: calculateGrandTotal(),
        status: 'PAID',
        billDate: new Date().toISOString().split('T')[0],
        paymentMode: formData.paymentMode
      };

      // Save to BillingService - this will automatically update all components
      BillingService.saveIPDBill(newBill);
      
      toast.success(`IPD bill ${newBill.billId} created successfully!`);
      setShowCreateBill(false);
      resetForm();
      
    } catch (error: any) {
      toast.error('Failed to create bill: ' + error.message);
    }
  };

  const resetForm = () => {
    setFormData({
      patientId: '',
      admissionDate: '',
      dischargeDate: '',
      admissionCharges: 2000,
      staySegments: [],
      services: ipdServices.map(service => ({
        name: service,
        selected: false,
        amount: 0
      })),
      paymentMode: 'CASH',
      notes: ''
    });
    setPatientSearchTerm('');
  };

  const handleEditIPDBill = (billId: string) => {
    const bill = ipdBills.find(b => b.billId === billId);
    if (!bill) {
      toast.error('IPD Bill not found');
      return;
    }

    // Find the patient and pre-fill the form
    const patient = patients.find(p => p.id === bill.patientId);
    if (patient) {
      setPatientSearchTerm(`${patient.first_name} ${patient.last_name} (${patient.patient_id})`);
      setFormData(prev => ({
        ...prev,
        patientId: bill.patientId,
        admissionDate: bill.admissionDate,
        dischargeDate: bill.dischargeDate,
        admissionCharges: bill.admissionCharges,
        staySegments: bill.staySegments,
        services: bill.services.map(service => ({
          name: service.name,
          selected: true,
          amount: service.amount
        })),
        paymentMode: bill.paymentMode || 'CASH'
      }));

      setShowCreateBill(true);
      toast.success(`Editing IPD bill ${billId}`);
    }
  };

  const handlePrintIPDBill = async (billId: string) => {
    const bill = ipdBills.find(b => b.billId === billId);
    if (!bill) {
      toast.error('IPD Bill not found');
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
      type: 'DISCHARGE',
      receiptNumber: bill.billId,
      date: new Date().toLocaleDateString('en-IN'),
      time: new Date().toLocaleTimeString([], {
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
      
      medical: {
        admissionDate: new Date(bill.admissionDate).toLocaleDateString('en-IN'),
        dischargeDate: new Date(bill.dischargeDate).toLocaleDateString('en-IN'),
        stayDuration: Math.ceil((new Date(bill.dischargeDate).getTime() - new Date(bill.admissionDate).getTime()) / (1000 * 60 * 60 * 24))
      },
      
      charges: [],
      
      payments: [{
        mode: bill.paymentMode || 'CASH',
        amount: bill.totalAmount
      }],
      
      totals: {
        subtotal: bill.totalAmount || 0,
        discount: bill.discount || 0,
        insurance: 0,
        netAmount: (bill.totalAmount || 0) - (bill.discount || 0),
        amountPaid: bill.totalAmount || 0,
        balance: 0
      },
      
      staff: {
        processedBy: 'IPD Billing',
        authorizedBy: 'Hospital Administrator'
      },
      
      notes: bill.notes || '',
      isOriginal: true
    };

    // Add admission charges
    if (bill.admissionCharges > 0) {
      receiptData.charges.push({
        description: 'Admission Charges',
        amount: bill.admissionCharges,
        quantity: 1,
        rate: bill.admissionCharges
      });
    }

    // Add stay charges
    bill.staySegments.forEach(segment => {
      receiptData.charges.push({
        description: `${segment.roomType} Room (${segment.days} days @ ₹${segment.dailyRate}/day)`,
        amount: segment.totalCharge,
        quantity: segment.days,
        rate: segment.dailyRate
      });
    });

    // Add services
    bill.services.forEach(service => {
      receiptData.charges.push({
        description: service.name,
        amount: service.amount,
        quantity: service.quantity || 1,
        rate: service.amount / (service.quantity || 1)
      });
    });

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

    toast.success(`Printing IPD bill ${billId}`);
  };

  const handleDownloadIPDBill = (billId: string) => {
    const bill = ipdBills.find(b => b.billId === billId);
    if (!bill) {
      toast.error('IPD Bill not found');
      return;
    }

    const pdfContent = generateIPDBillPrint(bill);
    const blob = new Blob([pdfContent], { type: 'text/html' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${billId}_IPD_Bill.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    
    toast.success(`Downloaded ${billId} as HTML file`);
  };

  const handleDeleteIPDBill = (billId: string) => {
    const bill = ipdBills.find(b => b.billId === billId);
    if (!bill) {
      toast.error('IPD Bill not found');
      return;
    }

    // Confirm deletion
    if (window.confirm(`Are you sure you want to delete IPD bill ${billId}? This action cannot be undone. Note: This will only remove the bill, not the patient from the patient list.`)) {
      try {
        BillingService.deleteIPDBill(bill.id);
        toast.success(`IPD bill ${billId} deleted successfully`);
      } catch (error: any) {
        toast.error('Failed to delete bill: ' + error.message);
      }
    }
  };

  const generateIPDBillPrint = (bill: IPDBill): string => {
    const currentDate = new Date().toLocaleDateString('en-IN');
    const currentTime = new Date().toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
    const stayDuration = calculateDays(bill.admissionDate, bill.dischargeDate);
    
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>IPD Bill - ${bill.billId}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; color: #333; }
          .header { text-align: center; border-bottom: 2px solid #7c3aed; padding-bottom: 20px; margin-bottom: 30px; }
          .hospital-name { font-size: 28px; font-weight: bold; color: #7c3aed; }
          .bill-type { background: #8b5cf6; color: white; padding: 8px 16px; border-radius: 20px; display: inline-block; margin: 10px 0; }
          .bill-info { display: grid; grid-template-columns: 1fr 1fr; gap: 30px; margin-bottom: 30px; }
          .section { background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
          .stay-segments { margin: 15px 0; }
          .segment-item { padding: 12px; background: #f3e8ff; margin: 8px 0; border-radius: 6px; border-left: 4px solid #8b5cf6; }
          .services-list { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 10px; }
          .service-item { padding: 8px; background: #ecfdf5; margin: 3px 0; border-radius: 4px; display: flex; justify-content: space-between; }
          .total-section { background: #7c3aed; color: white; padding: 20px; border-radius: 8px; text-align: center; }
          .amount { font-size: 24px; font-weight: bold; }
          .breakdown { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin: 15px 0; }
          .breakdown-item { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #ddd; }
          .footer { margin-top: 40px; text-align: center; font-size: 12px; color: #666; border-top: 1px solid #ddd; padding-top: 20px; }
          .highlight { background: #fef3c7; padding: 10px; border-radius: 6px; margin: 10px 0; }
        </style>
      </head>
      <body>
        <div class="header">
          <img src="/logo.png" alt="Logo" style="height: 60px; margin: 0 auto;" />
          <div style="margin-top: 10px;">Advanced Healthcare Management</div>
          <div class="bill-type">IPD BILL</div>
        </div>
        
        <div class="bill-info">
          <div class="section">
            <h3 style="color: #7c3aed;">Patient Information</h3>
            <p><strong>Bill ID:</strong> ${bill.billId}</p>
            <p><strong>Patient:</strong> ${bill.patientName}</p>
            <p><strong>Admission:</strong> ${new Date(bill.admissionDate).toLocaleDateString('en-IN')}</p>
            <p><strong>Discharge:</strong> ${new Date(bill.dischargeDate).toLocaleDateString('en-IN')}</p>
          </div>
          
          <div class="section">
            <h3 style="color: #7c3aed;">Stay Summary</h3>
            <p><strong>Duration:</strong> ${stayDuration} days</p>
            <p><strong>Status:</strong> <span style="color: #16a34a; font-weight: bold;">${bill.status}</span></p>
            <p><strong>Payment Mode:</strong> ${bill.paymentMode || 'CASH'}</p>
          </div>
        </div>

        <div class="section">
          <h3 style="color: #7c3aed;">Room/Ward Stay Details</h3>
          <div class="stay-segments">
            ${bill.staySegments.map((segment, index) => `
              <div class="segment-item">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                  <div>
                    <strong>Segment ${index + 1}: ${segment.roomType.replace('_', ' ')}</strong><br>
                    <small>${new Date(segment.startDate).toLocaleDateString('en-IN')} - ${new Date(segment.endDate).toLocaleDateString('en-IN')} (${segment.days} days)</small>
                  </div>
                  <div style="text-align: right;">
                    <strong>₹${segment.totalCharge.toLocaleString()}</strong><br>
                    <small>Bed: ₹${segment.bedCharge} | RMO: ₹${segment.rmoCharge} | Nursing: ₹${segment.nursingCharge}</small>
                  </div>
                </div>
              </div>
            `).join('')}
          </div>
          <div class="highlight">
            <strong>Admission Charges: ₹${bill.admissionCharges.toLocaleString()}</strong>
          </div>
        </div>

        ${bill.services.length > 0 ? `
        <div class="section">
          <h3 style="color: #7c3aed;">Additional Services</h3>
          <div class="services-list">
            ${bill.services.map(service => `
              <div class="service-item">
                <span>✓ ${service.name}</span>
                <strong>₹${service.amount.toLocaleString()}</strong>
              </div>
            `).join('')}
          </div>
        </div>
        ` : ''}

        <div class="section">
          <h3 style="color: #7c3aed;">Bill Summary</h3>
          <div class="breakdown">
            <div class="breakdown-item">
              <span>Admission Charges:</span>
              <span>₹${bill.admissionCharges.toLocaleString()}</span>
            </div>
            <div class="breakdown-item">
              <span>Total Stay Charges:</span>
              <span>₹${bill.totalStayCharges.toLocaleString()}</span>
            </div>
            <div class="breakdown-item">
              <span>Service Charges:</span>
              <span>₹${bill.totalServiceCharges.toLocaleString()}</span>
            </div>
          </div>
        </div>
        
        <div class="total-section">
          <div class="amount">Grand Total: ₹${bill.grandTotal.toLocaleString()}</div>
        </div>
        
        <div class="footer">
          <p><strong>Bill Generated:</strong> ${currentDate} at ${currentTime}</p>
          <p><em>This is a computer generated IPD bill.</em></p>
          <p>Thank you for choosing our healthcare services!</p>
          <p>Your Health, Our Priority</p>
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
          <p className="text-gray-600">Loading IPD billing data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Create Button */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">IPD Billing</h2>
          <p className="text-gray-600">Manage inpatient department bills with dynamic stay tracking</p>
        </div>
        <button
          onClick={() => setShowCreateBill(true)}
          className="mt-4 md:mt-0 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 flex items-center space-x-2 transition-colors"
        >
          <Plus className="h-4 w-4" />
          <span>Create IPD Bill</span>
        </button>
      </div>

      {/* Search and Filters */}
      <div className="bg-white p-4 rounded-lg shadow-sm border">
        <div className="flex flex-col md:flex-row space-y-2 md:space-y-0 md:space-x-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              placeholder="Search by patient or bill ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            <option value="ALL">All Status</option>
            <option value="PAID">Paid</option>
            <option value="PENDING">Pending</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </div>
      </div>

      {/* IPD Bills Table */}
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
                  Stay Duration
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Stay Charges
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Service Charges
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total Amount
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
                    {calculateDays(bill.admissionDate, bill.dischargeDate)} days
                    <div className="text-xs text-gray-500">
                      {new Date(bill.admissionDate).toLocaleDateString()} - {new Date(bill.dischargeDate).toLocaleDateString()}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    ₹{bill.totalStayCharges.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    ₹{bill.totalServiceCharges.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-purple-600">
                    ₹{bill.grandTotal.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(bill.status)}`}>
                      {bill.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button 
                        onClick={() => handleEditIPDBill(bill.billId)}
                        className="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-50" 
                        title="Edit IPD Bill"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button 
                        onClick={() => handlePrintIPDBill(bill.billId)}
                        className="text-green-600 hover:text-green-900 p-1 rounded hover:bg-green-50" 
                        title="Print IPD Bill"
                      >
                        <Printer className="h-4 w-4" />
                      </button>
                      <button 
                        onClick={() => handleDownloadIPDBill(bill.billId)}
                        className="text-purple-600 hover:text-purple-900 p-1 rounded hover:bg-purple-50" 
                        title="Download IPD Bill"
                      >
                        <Download className="h-4 w-4" />
                      </button>
                      <button 
                        onClick={() => handleDeleteIPDBill(bill.billId)}
                        className="text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-50" 
                        title="Delete IPD Bill"
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
              <h3 className="text-lg font-medium text-gray-900 mb-2">No IPD bills found</h3>
              <p className="text-gray-500">Create your first IPD bill to get started</p>
            </div>
          )}
        </div>
      </div>

      {/* Create IPD Bill Modal */}
      {showCreateBill && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-6xl w-full max-h-[95vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-gray-800">Create IPD Bill</h3>
                <button
                  onClick={() => setShowCreateBill(false)}
                  className="text-gray-400 hover:text-gray-600 p-1 rounded hover:bg-gray-100"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-8">
                {/* Patient and Stay Information */}
                <div className="bg-blue-50 p-6 rounded-lg">
                  <h4 className="text-lg font-semibold text-blue-800 mb-4 flex items-center">
                    <User className="h-5 w-5 mr-2" />
                    Patient and Stay Information
                  </h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Patient Selection */}
                    <div className="relative">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Patient *</label>
                      <input
                        type="text"
                        placeholder="Search patient by name, ID, or phone..."
                        value={patientSearchTerm}
                        onChange={(e) => {
                          setPatientSearchTerm(e.target.value);
                          setShowPatientDropdown(true);
                        }}
                        onFocus={() => setShowPatientDropdown(true)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                        required
                      />
                      {showPatientDropdown && filteredPatients.length > 0 && (
                        <div className="absolute z-20 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
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

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Admission Date *</label>
                      <input
                        type="date"
                        value={formData.admissionDate}
                        onChange={(e) => setFormData(prev => ({ ...prev, admissionDate: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Discharge Date *</label>
                      <input
                        type="date"
                        value={formData.dischargeDate}
                        onChange={(e) => setFormData(prev => ({ ...prev, dischargeDate: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                        required
                      />
                    </div>
                  </div>

                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Admission Charges</label>
                    <input
                      type="number"
                      value={formData.admissionCharges}
                      onChange={(e) => setFormData(prev => ({ ...prev, admissionCharges: parseFloat(e.target.value) || 0 }))}
                      className="w-full md:w-64 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                      min="0"
                      step="0.01"
                    />
                  </div>
                </div>

                {/* Dynamic Room/Ward Stay Tracking */}
                <div className="bg-green-50 p-6 rounded-lg">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-lg font-semibold text-green-800 flex items-center">
                      <Bed className="h-5 w-5 mr-2" />
                      Room/Ward Stay Segments
                    </h4>
                    <button
                      type="button"
                      onClick={addStaySegment}
                      className="bg-green-600 text-white px-3 py-1 rounded-md hover:bg-green-700 flex items-center space-x-1 text-sm"
                    >
                      <Plus className="h-4 w-4" />
                      <span>Add Segment</span>
                    </button>
                  </div>

                  {formData.staySegments.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      <Bed className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                      <p>No stay segments added yet. Click "Add Segment" to start.</p>
                    </div>
                  )}

                  <div className="space-y-4">
                    {formData.staySegments.map((segment, index) => (
                      <div key={segment.id} className="bg-white p-4 rounded-lg border border-green-200">
                        <div className="flex items-center justify-between mb-3">
                          <h5 className="font-medium text-gray-800">Segment {index + 1}</h5>
                          <button
                            type="button"
                            onClick={() => removeStaySegment(segment.id)}
                            className="text-red-600 hover:text-red-800 p-1 rounded hover:bg-red-50"
                            title="Remove Segment"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Room/Ward Type</label>
                            <select
                              value={segment.roomType}
                              onChange={(e) => updateStaySegment(segment.id, { roomType: e.target.value as any })}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                            >
                              {roomTypes.map((type) => (
                                <option key={type.value} value={type.value}>{type.label}</option>
                              ))}
                            </select>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                            <input
                              type="date"
                              value={segment.startDate}
                              onChange={(e) => updateStaySegment(segment.id, { startDate: e.target.value })}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                            <input
                              type="date"
                              value={segment.endDate}
                              onChange={(e) => updateStaySegment(segment.id, { endDate: e.target.value })}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Days</label>
                            <input
                              type="number"
                              value={calculateDays(segment.startDate, segment.endDate)}
                              readOnly
                              className="w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded-md text-sm text-center font-medium"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Total Charge</label>
                            <input
                              type="text"
                              value={`₹${calculateSegmentTotal(segment).toLocaleString()}`}
                              readOnly
                              className="w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded-md text-sm text-center font-bold text-green-600"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Bed Charge (per day)</label>
                            <input
                              type="number"
                              value={segment.bedCharge}
                              onChange={(e) => updateStaySegment(segment.id, { bedCharge: parseFloat(e.target.value) || 0 })}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                              min="0"
                              step="0.01"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">RMO Charge (per day)</label>
                            <input
                              type="number"
                              value={segment.rmoCharge}
                              onChange={(e) => updateStaySegment(segment.id, { rmoCharge: parseFloat(e.target.value) || 0 })}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                              min="0"
                              step="0.01"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Nursing Charge (per day)</label>
                            <input
                              type="number"
                              value={segment.nursingCharge}
                              onChange={(e) => updateStaySegment(segment.id, { nursingCharge: parseFloat(e.target.value) || 0 })}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                              min="0"
                              step="0.01"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Itemized Services Section */}
                <div className="bg-purple-50 p-6 rounded-lg">
                  <h4 className="text-lg font-semibold text-purple-800 mb-4 flex items-center">
                    <Calculator className="h-5 w-5 mr-2" />
                    Itemized Services
                  </h4>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-96 overflow-y-auto">
                    {ipdServices.map((serviceName) => {
                      const service = formData.services.find(s => s.name === serviceName);
                      return (
                        <div key={serviceName} className="flex items-center space-x-3 p-3 bg-white rounded-lg border">
                          <input
                            type="checkbox"
                            checked={service?.selected || false}
                            onChange={(e) => updateService(serviceName, { selected: e.target.checked })}
                            className="rounded text-purple-600 focus:ring-purple-500"
                          />
                          <div className="flex-1 min-w-0">
                            <label className="text-sm font-medium text-gray-700 block truncate" title={serviceName}>
                              {serviceName}
                            </label>
                            {service?.selected && (
                              <input
                                type="number"
                                value={service.amount}
                                onChange={(e) => updateService(serviceName, { amount: parseFloat(e.target.value) || 0 })}
                                className="w-full mt-1 px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-purple-500"
                                placeholder="Amount"
                                min="0"
                                step="0.01"
                              />
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Payment Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Payment Mode</label>
                    <select
                      value={formData.paymentMode}
                      onChange={(e) => setFormData(prev => ({ ...prev, paymentMode: e.target.value as any }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                    >
                      <option value="CASH">Cash</option>
                      <option value="CARD">Card</option>
                      <option value="UPI">UPI</option>
                      <option value="BANK_TRANSFER">Bank Transfer</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
                    <textarea
                      value={formData.notes}
                      onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                      rows={3}
                      placeholder="Additional notes..."
                    />
                  </div>
                </div>

                {/* Bill Summary */}
                <div className="bg-gray-50 p-6 rounded-lg border-2 border-gray-200">
                  <h4 className="text-lg font-semibold text-gray-800 mb-4">Bill Summary</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-sm">
                      <span>Admission Charges:</span>
                      <span className="font-medium">₹{formData.admissionCharges.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span>Total Stay Charges:</span>
                      <span className="font-medium">₹{calculateTotalStayCharges().toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span>Total Service Charges:</span>
                      <span className="font-medium">₹{calculateTotalServiceCharges().toLocaleString()}</span>
                    </div>
                    <hr className="my-2" />
                    <div className="flex justify-between items-center text-lg font-bold">
                      <span>Grand Total:</span>
                      <span className="text-purple-600">₹{calculateGrandTotal().toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end space-x-3 pt-4 border-t">
                  <button
                    type="button"
                    onClick={() => setShowCreateBill(false)}
                    className="px-6 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors"
                  >
                    Create IPD Bill
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

export default IPDBillingModule;
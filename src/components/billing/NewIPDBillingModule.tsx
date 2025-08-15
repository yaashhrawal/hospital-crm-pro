import React, { useState, useEffect } from 'react';
import { Printer, Search, X } from 'lucide-react';
import toast from 'react-hot-toast';
import HospitalService from '../../services/hospitalService';
import { supabase, HOSPITAL_ID } from '../../config/supabaseNew';
import type { PatientWithRelations } from '../../config/supabaseNew';

interface BillingRow {
  id: string;
  serviceType: string;
  particulars: string;
  emergency: string;
  doctor: string;
  date: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  taxes: number;
  total: number;
}

const NewIPDBillingModule: React.FC = () => {
  const [patients, setPatients] = useState<PatientWithRelations[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<PatientWithRelations | null>(null);
  const [loading, setLoading] = useState(true);
  const [billingDate, setBillingDate] = useState(new Date().toISOString().split('T')[0]);
  const [wardCategory, setWardCategory] = useState('Emergency');
  
  // Section navigation states
  const [activeSection, setActiveSection] = useState<'deposit' | 'billing'>('deposit');
  
  // Patient search states
  const [patientSearchTerm, setPatientSearchTerm] = useState('');
  const [showPatientDropdown, setShowPatientDropdown] = useState(false);
  const [showPatientModal, setShowPatientModal] = useState(false);
  
  // Payment and payer states
  const [paymentMode, setPaymentMode] = useState<'CASH' | 'INSURANCE' | 'CARD' | 'UPI'>('CASH');
  const [selectedPayer, setSelectedPayer] = useState('');
  const [showPayerModal, setShowPayerModal] = useState(false);
  
  // Deposit payment states
  const [advancePayments, setAdvancePayments] = useState(0.00);
  const [newPaymentAmount, setNewPaymentAmount] = useState('');
  const [newPaymentMode, setNewPaymentMode] = useState('Cash');
  const [depositHistory, setDepositHistory] = useState([]);
  const [receiptCounter, setReceiptCounter] = useState(1067);
  const [openCalendar, setOpenCalendar] = useState<{[key: string]: boolean}>({});
  const [showChangeCharges, setShowChangeCharges] = useState(false);
  const [showAddPharmacy, setShowAddPharmacy] = useState(false);
  const [showViewPharmacy, setShowViewPharmacy] = useState(false);
  const [pharmacyBills, setPharmacyBills] = useState([]);
  const [newPharmacyBill, setNewPharmacyBill] = useState({
    billNumber: '',
    date: new Date().toISOString().split('T')[0],
    items: [],
    total: 0
  }); // Starting receipt number

  // List of insurance payers
  const payersList = [
    'TATA AIG HEALTH INSURANCE',
    'ICICI LOMBARD GENERAL INSURANCE',
    'HDFC ERGO HEALTH INSURANCE',
    'BAJAJ ALLIANZ GENERAL INSURANCE',
    'NEW INDIA ASSURANCE',
    'ORIENTAL INSURANCE',
    'UNITED INDIA INSURANCE',
    'NATIONAL INSURANCE',
    'STAR HEALTH INSURANCE',
    'MAX BUPA HEALTH INSURANCE',
    'RELIANCE GENERAL INSURANCE',
    'IFFCO TOKIO GENERAL INSURANCE',
    'CHOLAMANDALAM MS GENERAL INSURANCE',
    'LIBERTY GENERAL INSURANCE',
    'APOLLO MUNICH HEALTH INSURANCE',
    'CIGNA TTK HEALTH INSURANCE',
    'ROYAL SUNDARAM GENERAL INSURANCE',
    'SBI GENERAL INSURANCE',
    'FUTURE GENERALI INDIA INSURANCE',
    'BHARTI AXA GENERAL INSURANCE'
  ];
  
  // Service type options
  const serviceTypeOptions = [
    'Room Charge',
    'Nursing Charge', 
    'Admission Fee',
    'Visit Charge',
    'Consultation Fee',
    'Pathology',
    'Radiology',
    'Laboratory',
    'Surgery',
    'Procedure',
    'Medicine',
    'Injection',
    'IV Fluids',
    'Blood Transfusion',
    'Dialysis',
    'Physiotherapy',
    'OT Charges',
    'ICU Charges',
    'Equipment Charges',
    'Other Services'
  ];

  const [billingRows, setBillingRows] = useState<BillingRow[]>([
    {
      id: '1',
      serviceType: 'Room Charge',
      particulars: 'Room Charge',
      emergency: 'Yes',
      doctor: '',
      date: new Date().toISOString().split('T')[0],
      quantity: 1,
      unitPrice: 0,
      discount: 0,
      taxes: 0,
      total: 0
    },
    {
      id: '2',
      serviceType: 'Nursing Charge',
      particulars: 'Nursing Charge',
      emergency: 'Yes',
      doctor: '',
      date: new Date().toISOString().split('T')[0],
      quantity: 1,
      unitPrice: 0,
      discount: 0,
      taxes: 0,
      total: 0
    },
    {
      id: '3',
      serviceType: 'Surgery',
      particulars: 'Surgery',
      emergency: 'No',
      doctor: '',
      date: new Date().toISOString().split('T')[0],
      quantity: 1,
      unitPrice: 0,
      discount: 0,
      taxes: 0,
      total: 0
    },
    {
      id: '4',
      serviceType: 'Admission Fee',
      particulars: 'Admission Fee',
      emergency: 'Yes',
      doctor: '',
      date: new Date().toISOString().split('T')[0],
      quantity: 1,
      unitPrice: 0,
      discount: 0,
      taxes: 0,
      total: 0
    },
    {
      id: '5',
      serviceType: 'Visit Charge',
      particulars: 'Visit Charge',
      emergency: 'Yes',
      doctor: '',
      date: new Date().toISOString().split('T')[0],
      quantity: 1,
      unitPrice: 0,
      discount: 0,
      taxes: 0,
      total: 0
    },
    {
      id: '6',
      serviceType: 'Pathology',
      particulars: 'CBC MP',
      emergency: 'Yes',
      doctor: 'Lab',
      date: new Date().toISOString().split('T')[0],
      quantity: 1,
      unitPrice: 0,
      discount: 0,
      taxes: 0,
      total: 0
    }
  ]);

  const [summary, setSummary] = useState({
    totalBill: 0,
    paidAmount: 0,
    refund: 0,
    netPayable: 0,
    totalDiscount: 0,
    totalTax: 0,
    totalPayable: 0,
    subtotal: 0
  });

  // Load patients on mount
  useEffect(() => {
    loadPatients();
  }, []);

  // Calculate totals whenever billing rows or advance payments change
  useEffect(() => {
    calculateSummary();
  }, [billingRows, advancePayments]);

  const loadPatients = async () => {
    try {
      setLoading(true);
      console.log('🔍 Loading patients with admission data for billing...');
      
      // Get all patients with admissions data using direct supabase query
      const { data: allPatients, error } = await supabase
        .from('patients')
        .select(`
          *,
          transactions:patient_transactions(*),
          admissions:patient_admissions(*)
        `)
        .eq('hospital_id', HOSPITAL_ID)
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(1000);
      
      if (error) {
        console.error('❌ Error loading patients with admissions:', error);
        toast.error('Failed to load patient data');
        return;
      }
      
      console.log('✅ Loaded patients with admissions:', allPatients?.length || 0);
      setPatients(allPatients || []);
    } catch (error) {
      console.error('Failed to load patients:', error);
      toast.error('Failed to load patient data');
    } finally {
      setLoading(false);
    }
  };

  const updateRow = (id: string, field: keyof BillingRow, value: number | string) => {
    setBillingRows(rows => {
      return rows.map(row => {
        if (row.id === id) {
          const updatedRow = { ...row, [field]: value };
          
          // Update doctor and particulars based on service type
          if (field === 'serviceType') {
            const serviceType = value as string;
            
            // Auto-populate particulars with service type name
            updatedRow.particulars = serviceType;
            
            // Update doctor based on service type
            if (serviceType === 'Pathology' || serviceType === 'Laboratory') {
              updatedRow.doctor = 'Lab';
            } else if (serviceType === 'Radiology') {
              updatedRow.doctor = 'Radiology Dept';
            } else if (selectedPatient) {
              // Use patient's doctor
              const latestAdmission = selectedPatient.admissions?.[0];
              let doctorName = 'N/A';
              
              if (selectedPatient.assigned_doctor) {
                doctorName = selectedPatient.assigned_doctor;
              } else if ((latestAdmission as any)?.doctor_name) {
                doctorName = (latestAdmission as any).doctor_name;
              } else if ((latestAdmission as any)?.treating_doctor) {
                doctorName = (latestAdmission as any).treating_doctor;
              } else if (selectedPatient.assigned_doctors && selectedPatient.assigned_doctors.length > 0) {
                doctorName = selectedPatient.assigned_doctors[0].name;
              }
              
              updatedRow.doctor = doctorName;
            } else {
              updatedRow.doctor = '';
            }
          }
          
          // Recalculate row total
          if (field === 'quantity' || field === 'unitPrice' || field === 'discount') {
            const subtotal = updatedRow.quantity * updatedRow.unitPrice;
            const discountAmount = (subtotal * updatedRow.discount) / 100;
            const total = subtotal - discountAmount;
            
            updatedRow.taxes = 0; // Remove tax calculation
            updatedRow.total = total;
          }
          
          return updatedRow;
        }
        return row;
      });
    });
  };

  const calculateSummary = () => {
    let totalBill = 0;
    let totalDiscount = 0;
    let subtotal = 0;

    billingRows.forEach(row => {
      const rowSubtotal = row.quantity * row.unitPrice;
      const discountAmount = (rowSubtotal * row.discount) / 100;
      
      subtotal += rowSubtotal;
      totalDiscount += discountAmount;
      totalBill += row.total;
    });

    // Calculate net payable after advance payments
    const netPayable = Math.max(0, totalBill - advancePayments);

    setSummary({
      totalBill,
      paidAmount: advancePayments,
      refund: Math.max(0, advancePayments - totalBill),
      netPayable,
      totalDiscount,
      totalTax: 0, // Remove tax from summary
      totalPayable: totalBill,
      subtotal
    });
  };

  // Add advance payment function
  const addAdvancePayment = () => {
    const amount = parseFloat(newPaymentAmount);
    
    if (!amount || amount <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }
    
    // Generate auto-incremented receipt number
    const nextReceiptCounter = receiptCounter + 1;
    const newReceiptNo = `Y${nextReceiptCounter}`;
    const today = new Date().toLocaleDateString('en-GB');
    
    const newPayment = {
      id: newReceiptNo,
      receiptNo: newReceiptNo,
      date: today,
      transactionType: 'Advance Payment',
      processBy: 'Reception Desk',
      amount: amount,
      paymentMode: newPaymentMode
    };
    
    // Update states
    setDepositHistory([...depositHistory, newPayment]);
    setAdvancePayments(advancePayments + amount);
    setReceiptCounter(nextReceiptCounter);
    setNewPaymentAmount('');
    setNewPaymentMode('Cash');
    
    toast.success(`Advance payment of ₹${amount.toFixed(2)} added successfully! Receipt: ${newReceiptNo}`);
  };

  // Delete advance payment function
  const deleteAdvancePayment = (paymentId: string) => {
    const paymentToDelete = depositHistory.find(payment => payment.id === paymentId);
    
    if (!paymentToDelete) {
      toast.error('Payment not found');
      return;
    }
    
    // Update states
    setDepositHistory(depositHistory.filter(payment => payment.id !== paymentId));
    setAdvancePayments(advancePayments - paymentToDelete.amount);
    
    toast.success(`Advance payment of ₹${paymentToDelete.amount.toFixed(2)} deleted successfully!`);
  };

  const handlePrint = () => {
    window.print();
    toast.success('Opening print dialog...');
  };

  // Patient search and selection functions
  const filteredPatients = patients.filter(patient =>
    `${patient.first_name} ${patient.last_name || ''}`.toLowerCase().includes(patientSearchTerm.toLowerCase()) ||
    patient.patient_id.toLowerCase().includes(patientSearchTerm.toLowerCase()) ||
    patient.phone.includes(patientSearchTerm)
  ).slice(0, 10);

  const handlePatientSelect = (patient: PatientWithRelations) => {
    setSelectedPatient(patient);
    setPatientSearchTerm(`${patient.first_name} ${patient.last_name || ''}`.trim());
    setShowPatientDropdown(false);
    setShowPatientModal(false);
    
    // Update doctor names in billing rows
    updateDoctorNamesForPatient(patient);
    
    toast.success(`Selected patient: ${patient.first_name} ${patient.last_name || ''}`);
  };

  const updateDoctorNamesForPatient = (patient: PatientWithRelations) => {
    console.log('🔍 DEBUG: Patient data for doctor name extraction:', patient);
    console.log('🔍 DEBUG: Patient assigned_doctor:', patient.assigned_doctor);
    console.log('🔍 DEBUG: Patient assigned_doctors:', patient.assigned_doctors);
    console.log('🔍 DEBUG: Patient admissions:', patient.admissions);
    
    const latestAdmission = patient.admissions?.[0];
    let doctorName = 'N/A';
    
    // Try multiple sources for doctor name
    if (patient.assigned_doctor) {
      doctorName = patient.assigned_doctor;
      console.log('✅ Found doctor in assigned_doctor:', doctorName);
    } else if (patient.assigned_doctors && patient.assigned_doctors.length > 0) {
      doctorName = patient.assigned_doctors[0].name;
      console.log('✅ Found doctor in assigned_doctors array:', doctorName);
    } else if ((latestAdmission as any)?.doctor_name) {
      doctorName = (latestAdmission as any).doctor_name;
      console.log('✅ Found doctor in admission doctor_name:', doctorName);
    } else if ((latestAdmission as any)?.treating_doctor) {
      doctorName = (latestAdmission as any).treating_doctor;
      console.log('✅ Found doctor in admission treating_doctor:', doctorName);
    } else {
      console.log('❌ No doctor name found in any field');
    }

    console.log('🏥 Final doctor name:', doctorName);

    // Update all billing rows with the correct doctor name based on service type
    setBillingRows(rows => 
      rows.map(row => {
        if (row.serviceType === 'Pathology' || row.serviceType === 'Laboratory') {
          return { ...row, doctor: 'Lab' };
        } else if (row.serviceType === 'Radiology') {
          return { ...row, doctor: 'Radiology Dept' };
        } else {
          return { ...row, doctor: doctorName };
        }
      })
    );
  };

  const clearPatientSelection = () => {
    setSelectedPatient(null);
    setPatientSearchTerm('');
    
    // Reset doctor names based on service type
    setBillingRows(rows => 
      rows.map(row => {
        if (row.serviceType === 'Pathology' || row.serviceType === 'Laboratory') {
          return { ...row, doctor: 'Lab' };
        } else if (row.serviceType === 'Radiology') {
          return { ...row, doctor: 'Radiology Dept' };
        } else {
          return { ...row, doctor: '' };
        }
      })
    );
  };

  // Payment mode and payer handling
  const handlePaymentModeChange = (mode: 'CASH' | 'INSURANCE' | 'CARD' | 'UPI') => {
    setPaymentMode(mode);
    if (mode === 'INSURANCE' && !selectedPayer) {
      setSelectedPayer('TATA AIG HEALTH INSURANCE'); // Default insurance
    } else if (mode !== 'INSURANCE') {
      setSelectedPayer('');
    }
  };

  const handlePayerSelect = (payer: string) => {
    setSelectedPayer(payer);
    setShowPayerModal(false);
    toast.success(`Selected payer: ${payer}`);
  };

  const getDisplayPayerName = () => {
    if (paymentMode === 'INSURANCE') {
      return selectedPayer || 'TATA AIG HEALTH INSURANCE';
    } else if (paymentMode === 'CASH') {
      return 'CASH PAYMENT';
    } else if (paymentMode === 'CARD') {
      return 'CARD PAYMENT';
    } else if (paymentMode === 'UPI') {
      return 'UPI PAYMENT';
    }
    return 'SELF PAY';
  };

  // Get patient display data
  const getPatientDisplayData = () => {
    if (!selectedPatient) {
      return {
        name: 'Select Patient',
        wardName: 'EMERGENCY',
        bedNo: 'Not Assigned',
        uhiid: '--',
        ipdNo: '--',
        refDoctor: 'Not Assigned',
        admittingDoctor: 'Not Assigned'
      };
    }

    const latestAdmission = selectedPatient.admissions?.[0];
    let roomNumber = selectedPatient.ipd_bed_number || 'N/A';
    if (roomNumber === 'N/A' && latestAdmission?.bed_id) {
      roomNumber = `Bed ${latestAdmission.bed_id.slice(-4)}`;
    }

    // Get doctor name using the same logic as billing rows
    let doctorName = 'N/A';
    if (selectedPatient.assigned_doctor) {
      doctorName = selectedPatient.assigned_doctor;
    } else if (selectedPatient.assigned_doctors && selectedPatient.assigned_doctors.length > 0) {
      doctorName = selectedPatient.assigned_doctors[0].name;
    } else if ((latestAdmission as any)?.doctor_name) {
      doctorName = (latestAdmission as any).doctor_name;
    } else if ((latestAdmission as any)?.treating_doctor) {
      doctorName = (latestAdmission as any).treating_doctor;
    }

    console.log('🏥 Header doctor name:', doctorName);

    return {
      name: `${selectedPatient.first_name} ${selectedPatient.last_name || ''}`.trim() + `, ${selectedPatient.age || '0'} ${selectedPatient.gender === 'MALE' ? 'M' : selectedPatient.gender === 'FEMALE' ? 'F' : 'U'}, ${selectedPatient.gender === 'MALE' ? 'M' : 'F'}`,
      wardName: wardCategory.toUpperCase(),
      bedNo: roomNumber,
      uhiid: selectedPatient.patient_id.slice(-6).toUpperCase(),
      ipdNo: selectedPatient.patient_id,
      refDoctor: doctorName,
      admittingDoctor: doctorName
    };
  };

  return (
    <div style={{ backgroundColor: '#f0f2f5', minHeight: '100vh', padding: '20px' }}>
      <div style={{ 
        maxWidth: '1400px', 
        margin: '0 auto', 
        backgroundColor: 'white',
        borderRadius: '8px',
        boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)',
        overflow: 'hidden'
      }}>
        {/* Title */}
        <div style={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          padding: '20px 30px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{ fontSize: '24px', fontWeight: '600' }}>
            Multi-Section IPD Billing
          </div>
          <button
            onClick={() => setShowPatientModal(true)}
            style={{
              background: 'rgba(255,255,255,0.2)',
              color: 'white',
              border: '1px solid rgba(255,255,255,0.3)',
              padding: '8px 16px',
              borderRadius: '6px',
              fontSize: '14px',
              fontWeight: '500',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <Search size={16} />
            {selectedPatient ? 'Change Patient' : 'Select Patient'}
          </button>
        </div>

        {/* Header Section */}
        <div style={{
          backgroundColor: '#e0e0e0',
          padding: '20px 30px',
          display: 'flex',
          justifyContent: 'space-between',
          borderBottom: '2px solid #d0d0d0'
        }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '13px', margin: '4px 0', fontWeight: '600', color: selectedPatient ? '#000' : '#666' }}>
              {getPatientDisplayData().name}
            </div>
            <div style={{ fontSize: '13px', margin: '4px 0' }}>
              WARD NAME: <strong>{getPatientDisplayData().wardName}</strong>
            </div>
            <div style={{ fontSize: '13px', margin: '4px 0' }}>
              BED NO: <strong>{getPatientDisplayData().bedNo}</strong>
            </div>
            <div style={{ fontSize: '13px', margin: '4px 0' }}>
              UHIID: <strong>{getPatientDisplayData().uhiid}</strong>
            </div>
            <div style={{ fontSize: '13px', margin: '4px 0' }}>
              IPD NO: <strong>{getPatientDisplayData().ipdNo}</strong>
            </div>
            <div style={{ fontSize: '13px', margin: '4px 0' }}>
              REF. DR: <strong>{getPatientDisplayData().refDoctor}</strong>
            </div>
            <div style={{ fontSize: '13px', margin: '4px 0' }}>
              ADMITTING DR: <strong>{getPatientDisplayData().admittingDoctor}</strong>
            </div>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '13px', margin: '4px 0' }}>
              PAYER NAME: <strong>{getDisplayPayerName()}</strong>
              {paymentMode === 'INSURANCE' && (
                <button
                  onClick={() => setShowPayerModal(true)}
                  style={{
                    background: 'none',
                    border: '1px solid #6c757d',
                    color: '#6c757d',
                    padding: '2px 8px',
                    borderRadius: '12px',
                    fontSize: '10px',
                    marginLeft: '8px',
                    cursor: 'pointer'
                  }}
                >
                  Change
                </button>
              )}
            </div>
            <div style={{ fontSize: '13px', margin: '4px 0' }}>
              DOA: <strong>{selectedPatient ? new Date(selectedPatient.admissions?.[0]?.admission_date || new Date()).toLocaleDateString('en-GB') + ' ' + new Date(selectedPatient.admissions?.[0]?.admission_date || new Date()).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
                hour12: true
              }) : new Date().toLocaleDateString('en-GB') + ' ' + new Date().toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
                hour12: true
              })}</strong>
            </div>
            <div style={{ fontSize: '13px', margin: '4px 0' }}>
              TOTAL DEP: <strong style={{ color: '#008000' }}>₹{advancePayments.toFixed(2)}</strong>
              <span style={{
                display: 'inline-block',
                width: '16px',
                height: '16px',
                backgroundColor: '#6c757d',
                color: 'white',
                borderRadius: '50%',
                textAlign: 'center',
                lineHeight: '16px',
                fontSize: '10px',
                marginLeft: '5px'
              }}>i</span>
            </div>
            <div style={{ fontSize: '13px', margin: '4px 0' }}>
              TOTAL DUE: <strong style={{ color: '#ff0000' }}>₹{summary.netPayable.toFixed(2)}</strong>
              <span style={{
                display: 'inline-block',
                width: '16px',
                height: '16px',
                backgroundColor: '#6c757d',
                color: 'white',
                borderRadius: '50%',
                textAlign: 'center',
                lineHeight: '16px',
                fontSize: '10px',
                marginLeft: '5px'
              }}>i</span>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div style={{
          display: 'flex',
          backgroundColor: '#f8f9fa',
          borderBottom: '1px solid #dee2e6'
        }}>
          <button 
            onClick={() => setActiveSection('deposit')}
            style={{
              flex: 1,
              padding: '15px 20px',
              background: 'none',
              border: 'none',
              fontSize: '16px',
              fontWeight: '500',
              color: activeSection === 'deposit' ? '#667eea' : '#6c757d',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              borderBottom: activeSection === 'deposit' ? '3px solid #667eea' : '3px solid transparent',
              backgroundColor: activeSection === 'deposit' ? 'white' : 'transparent'
            }}
          >
            Deposit Payment History
          </button>
          <button 
            onClick={() => setActiveSection('billing')}
            style={{
              flex: 1,
              padding: '15px 20px',
              background: 'none',
              border: 'none',
              fontSize: '16px',
              fontWeight: '500',
              color: activeSection === 'billing' ? '#667eea' : '#6c757d',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              borderBottom: activeSection === 'billing' ? '3px solid #667eea' : '3px solid transparent',
              backgroundColor: activeSection === 'billing' ? 'white' : 'transparent'
            }}
          >
            Billing History
          </button>
        </div>

        {/* Section 1: Deposit Payment History */}
        {activeSection === 'deposit' && (
          <div style={{ padding: '20px 30px' }}>
            <h3 style={{ color: '#495057', marginBottom: '20px', fontSize: '18px', fontWeight: '600' }}>
              Deposit Payment History
            </h3>
            
            {/* Deposit Table */}
            {depositHistory.length > 0 ? (
              <table style={{
                width: '100%',
                borderCollapse: 'collapse',
                marginBottom: '30px'
              }}>
              <thead>
                <tr>
                  <th style={{
                    padding: '12px 15px',
                    textAlign: 'left',
                    borderBottom: '1px solid #dee2e6',
                    backgroundColor: '#f8f9fa',
                    fontWeight: '600',
                    color: '#495057',
                    fontSize: '12px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                  }}>Payment Receipt No</th>
                  <th style={{
                    padding: '12px 15px',
                    textAlign: 'left',
                    borderBottom: '1px solid #dee2e6',
                    backgroundColor: '#f8f9fa',
                    fontWeight: '600',
                    color: '#495057',
                    fontSize: '12px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                  }}>Date</th>
                  <th style={{
                    padding: '12px 15px',
                    textAlign: 'left',
                    borderBottom: '1px solid #dee2e6',
                    backgroundColor: '#f8f9fa',
                    fontWeight: '600',
                    color: '#495057',
                    fontSize: '12px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                  }}>Transaction Type</th>
                  <th style={{
                    padding: '12px 15px',
                    textAlign: 'left',
                    borderBottom: '1px solid #dee2e6',
                    backgroundColor: '#f8f9fa',
                    fontWeight: '600',
                    color: '#495057',
                    fontSize: '12px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                  }}>Process By</th>
                  <th style={{
                    padding: '12px 15px',
                    textAlign: 'left',
                    borderBottom: '1px solid #dee2e6',
                    backgroundColor: '#f8f9fa',
                    fontWeight: '600',
                    color: '#495057',
                    fontSize: '12px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                  }}>Amount</th>
                  <th style={{
                    padding: '12px 15px',
                    textAlign: 'left',
                    borderBottom: '1px solid #dee2e6',
                    backgroundColor: '#f8f9fa',
                    fontWeight: '600',
                    color: '#495057',
                    fontSize: '12px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                  }}>Payment Mode</th>
                  <th style={{
                    padding: '12px 15px',
                    textAlign: 'center',
                    borderBottom: '1px solid #dee2e6',
                    backgroundColor: '#f8f9fa',
                    fontWeight: '600',
                    color: '#495057',
                    fontSize: '12px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                  }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {depositHistory.map((deposit) => (
                  <tr key={deposit.id}>
                    <td style={{
                      padding: '12px 15px',
                      borderBottom: '1px solid #dee2e6',
                      fontSize: '14px',
                      color: '#212529'
                    }}>{deposit.receiptNo}</td>
                    <td style={{
                      padding: '12px 15px',
                      borderBottom: '1px solid #dee2e6',
                      fontSize: '14px',
                      color: '#212529'
                    }}>{deposit.date}</td>
                    <td style={{
                      padding: '12px 15px',
                      borderBottom: '1px solid #dee2e6',
                      fontSize: '14px',
                      color: '#212529'
                    }}>{deposit.transactionType}</td>
                    <td style={{
                      padding: '12px 15px',
                      borderBottom: '1px solid #dee2e6',
                      fontSize: '14px',
                      color: '#212529'
                    }}>{deposit.processBy}</td>
                    <td style={{
                      padding: '12px 15px',
                      borderBottom: '1px solid #dee2e6',
                      fontSize: '14px',
                      color: '#212529'
                    }}>₹{deposit.amount.toFixed(2)}</td>
                    <td style={{
                      padding: '12px 15px',
                      borderBottom: '1px solid #dee2e6',
                      fontSize: '14px',
                      color: '#212529'
                    }}>{deposit.paymentMode}</td>
                    <td style={{
                      padding: '12px 15px',
                      borderBottom: '1px solid #dee2e6',
                      fontSize: '14px',
                      color: '#212529',
                      textAlign: 'center'
                    }}>
                      <button
                        onClick={() => deleteAdvancePayment(deposit.id)}
                        style={{
                          backgroundColor: '#dc3545',
                          color: 'white',
                          border: 'none',
                          padding: '4px 8px',
                          borderRadius: '4px',
                          fontSize: '12px',
                          cursor: 'pointer',
                          fontWeight: '500'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#c82333'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#dc3545'}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            ) : (
              <div style={{
                textAlign: 'center',
                padding: '40px',
                color: '#6c757d',
                fontSize: '16px',
                backgroundColor: '#f8f9fa',
                border: '1px solid #dee2e6',
                borderRadius: '6px',
                marginBottom: '30px'
              }}>
                No advance payments recorded yet.
              </div>
            )}

            {/* Advance Payment Summary */}
            <div style={{
              backgroundColor: '#e8f5e8',
              padding: '15px',
              borderRadius: '4px',
              marginBottom: '20px',
              borderLeft: '4px solid #28a745'
            }}>
              <div style={{ fontSize: '14px', color: '#495057', marginBottom: '5px' }}>
                Total Advance Payments:
              </div>
              <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#28a745' }}>
                ₹{advancePayments.toFixed(2)}
              </div>
            </div>

            {/* Add New Payment Form */}
            <div style={{
              backgroundColor: '#f8f9fa',
              padding: '20px',
              borderRadius: '6px',
              border: '1px solid #dee2e6'
            }}>
              <h4 style={{ color: '#495057', marginBottom: '15px', fontSize: '16px', fontWeight: '600' }}>
                Add New Advance Payment
              </h4>
              <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '15px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <label style={{ fontWeight: '500', color: '#495057', minWidth: '80px' }}>Amount:</label>
                  <input 
                    type="number" 
                    value={newPaymentAmount}
                    onChange={(e) => setNewPaymentAmount(e.target.value)}
                    placeholder="0.00" 
                    step="0.01" 
                    min="0"
                    style={{
                      padding: '8px 12px',
                      border: '1px solid #ced4da',
                      borderRadius: '4px',
                      fontSize: '14px',
                      minWidth: '150px'
                    }}
                  />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <label style={{ fontWeight: '500', color: '#495057', minWidth: '100px' }}>Payment Mode:</label>
                  <select 
                    value={newPaymentMode}
                    onChange={(e) => setNewPaymentMode(e.target.value)}
                    style={{
                      padding: '8px 12px',
                      border: '1px solid #ced4da',
                      borderRadius: '4px',
                      fontSize: '14px',
                      minWidth: '150px'
                    }}
                  >
                    <option value="Cash">Cash</option>
                    <option value="Card">Card</option>
                    <option value="UPI">UPI</option>
                    <option value="Bank Transfer">Bank Transfer</option>
                    <option value="Cheque">Cheque</option>
                  </select>
                </div>
                <button 
                  onClick={addAdvancePayment}
                  style={{
                    backgroundColor: '#667eea',
                    color: 'white',
                    border: 'none',
                    padding: '10px 20px',
                    borderRadius: '4px',
                    fontSize: '14px',
                    fontWeight: '500',
                    cursor: 'pointer'
                  }}
                >
                  Add Payment
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Section 2: Billing History */}
        {activeSection === 'billing' && (
          <>
            {/* Controls Section */}
        <div style={{
          padding: '20px 30px',
          display: 'flex',
          alignItems: 'center',
          gap: '20px',
          backgroundColor: '#f8f9fa',
          borderBottom: '1px solid #dee2e6'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <label style={{ fontSize: '14px', fontWeight: '500', color: '#495057' }}>
              Ward Category:
            </label>
            <select 
              value={wardCategory}
              onChange={(e) => setWardCategory(e.target.value)}
              style={{
                padding: '6px 12px',
                border: '1px solid #ced4da',
                borderRadius: '4px',
                fontSize: '14px',
                backgroundColor: 'white'
              }}
            >
              <option>General Ward</option>
              <option>Private Room</option>
              <option>ICU</option>
              <option>Emergency</option>
            </select>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <label style={{ fontSize: '14px', fontWeight: '500', color: '#495057' }}>
              Billing Date:
            </label>
            <input 
              type="date" 
              value={billingDate}
              onChange={(e) => setBillingDate(e.target.value)}
              style={{
                padding: '6px 12px',
                border: '1px solid #ced4da',
                borderRadius: '4px',
                fontSize: '14px'
              }}
            />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <label style={{ fontSize: '14px', fontWeight: '500', color: '#495057' }}>
              Payment Mode:
            </label>
            <select 
              value={paymentMode}
              onChange={(e) => handlePaymentModeChange(e.target.value as any)}
              style={{
                padding: '6px 12px',
                border: '1px solid #ced4da',
                borderRadius: '4px',
                fontSize: '14px',
                backgroundColor: 'white'
              }}
            >
              <option value="CASH">Cash</option>
              <option value="INSURANCE">Insurance</option>
              <option value="CARD">Card</option>
              <option value="UPI">UPI</option>
            </select>
          </div>
          {paymentMode === 'INSURANCE' && (
            <button
              onClick={() => setShowPayerModal(true)}
              style={{
                backgroundColor: '#28a745',
                color: 'white',
                border: 'none',
                padding: '8px 16px',
                borderRadius: '4px',
                fontSize: '13px',
                fontWeight: '500',
                cursor: 'pointer'
              }}
            >
              Select Payer
            </button>
          )}
          <button 
            onClick={() => setShowChangeCharges(true)}
            style={{
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            padding: '8px 16px',
            borderRadius: '4px',
            fontSize: '13px',
            fontWeight: '500',
            cursor: 'pointer',
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={(e) => e.target.style.backgroundColor = '#0056b3'}
          onMouseLeave={(e) => e.target.style.backgroundColor = '#007bff'}
          >
            Change Charges
          </button>
          <button 
            onClick={() => setShowAddPharmacy(true)}
            style={{
            backgroundColor: '#28a745',
            color: 'white',
            border: 'none',
            padding: '8px 16px',
            borderRadius: '4px',
            fontSize: '13px',
            fontWeight: '500',
            cursor: 'pointer',
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={(e) => e.target.style.backgroundColor = '#218838'}
          onMouseLeave={(e) => e.target.style.backgroundColor = '#28a745'}
          >
            Add Pharmacy Bill
          </button>
          <button 
            onClick={() => setShowViewPharmacy(true)}
            style={{
            backgroundColor: '#6f42c1',
            color: 'white',
            border: 'none',
            padding: '8px 16px',
            borderRadius: '4px',
            fontSize: '13px',
            fontWeight: '500',
            cursor: 'pointer',
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={(e) => e.target.style.backgroundColor = '#5a32a3'}
          onMouseLeave={(e) => e.target.style.backgroundColor = '#6f42c1'}
          >
            View Pharmacy Bill
          </button>
        </div>

        {/* Billing Table */}
        <div style={{ padding: '0 30px', overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '10px' }}>
            <thead style={{ backgroundColor: '#f8f9fa' }}>
              <tr>
                <th style={{ padding: '12px 8px', textAlign: 'left', fontSize: '11px', fontWeight: '600', color: '#495057', borderBottom: '2px solid #dee2e6' }}>
                  SERVICE TYPE
                </th>
                <th style={{ padding: '12px 8px', textAlign: 'left', fontSize: '11px', fontWeight: '600', color: '#495057', borderBottom: '2px solid #dee2e6' }}>
                  PARTICULARS
                </th>
                <th style={{ padding: '12px 8px', textAlign: 'left', fontSize: '11px', fontWeight: '600', color: '#495057', borderBottom: '2px solid #dee2e6' }}>
                  DATE
                </th>
                <th style={{ padding: '12px 8px', textAlign: 'center', fontSize: '11px', fontWeight: '600', color: '#495057', borderBottom: '2px solid #dee2e6' }}>
                  QTY
                </th>
                <th style={{ padding: '12px 8px', textAlign: 'right', fontSize: '11px', fontWeight: '600', color: '#495057', borderBottom: '2px solid #dee2e6' }}>
                  UNIT PRICE
                </th>
                <th style={{ padding: '12px 8px', textAlign: 'right', fontSize: '11px', fontWeight: '600', color: '#495057', borderBottom: '2px solid #dee2e6' }}>
                  DISCOUNT
                </th>
                <th style={{ padding: '12px 8px', textAlign: 'right', fontSize: '11px', fontWeight: '600', color: '#495057', borderBottom: '2px solid #dee2e6' }}>
                  TOTAL
                </th>
              </tr>
            </thead>
            <tbody>
              {billingRows.map((row) => (
                <tr key={row.id}>
                  <td style={{ padding: '10px 8px', fontSize: '13px', borderBottom: '1px solid #e9ecef' }}>
                    {row.serviceType === 'Other Services' || (row.serviceType && !serviceTypeOptions.includes(row.serviceType)) ? (
                      <div style={{ position: 'relative' }}>
                        <input
                          type="text"
                          value={row.serviceType === 'Other Services' ? '' : row.serviceType}
                          onChange={(e) => updateRow(row.id, 'serviceType', e.target.value)}
                          placeholder="Enter custom service type"
                          style={{
                            width: '100%',
                            padding: '8px 35px 8px 8px',
                            border: '2px solid #667eea',
                            borderRadius: '6px',
                            fontSize: '13px',
                            backgroundColor: '#f8f9ff',
                            outline: 'none',
                            fontWeight: '500',
                            color: '#2d3748'
                          }}
                          onFocus={(e) => {
                            e.target.style.backgroundColor = '#ffffff';
                            e.target.style.boxShadow = '0 0 0 3px rgba(102, 126, 234, 0.1)';
                          }}
                          onBlur={(e) => {
                            e.target.style.backgroundColor = '#f8f9ff';
                            e.target.style.boxShadow = 'none';
                          }}
                        />
                        <button
                          onClick={() => updateRow(row.id, 'serviceType', 'Room Charge')}
                          style={{
                            position: 'absolute',
                            right: '4px',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            background: '#dc3545',
                            border: 'none',
                            borderRadius: '4px',
                            color: 'white',
                            fontSize: '12px',
                            padding: '4px 6px',
                            cursor: 'pointer',
                            lineHeight: 1
                          }}
                          title="Switch back to dropdown"
                        >
                          ×
                        </button>
                      </div>
                    ) : (
                      <select
                        value={row.serviceType}
                        onChange={(e) => updateRow(row.id, 'serviceType', e.target.value)}
                        style={{
                          width: '100%',
                          padding: '5px 8px',
                          border: '1px solid #ced4da',
                          borderRadius: '3px',
                          fontSize: '13px',
                          backgroundColor: 'white'
                        }}
                      >
                        {serviceTypeOptions.map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                    )}
                  </td>
                  <td style={{ padding: '10px 8px', fontSize: '13px', borderBottom: '1px solid #e9ecef' }}>
                    <input
                      type="text"
                      value={row.particulars}
                      onChange={(e) => updateRow(row.id, 'particulars', e.target.value)}
                      style={{
                        width: '100%',
                        padding: '5px 8px',
                        border: '1px solid #ced4da',
                        borderRadius: '3px',
                        fontSize: '13px',
                        backgroundColor: 'white'
                      }}
                      placeholder="Enter particulars"
                    />
                  </td>
                  <td style={{ padding: '10px 8px', fontSize: '13px', borderBottom: '1px solid #e9ecef', position: 'relative' }}>
                    <div style={{ position: 'relative' }}>
                      <input
                        type="text"
                        value={row.date ? (() => {
                          if (row.date.includes('-') && row.date.length === 10) {
                            const [year, month, day] = row.date.split('-');
                            return `${day}-${month}-${year}`;
                          }
                          return row.date;
                        })() : ''}
                        onChange={(e) => {
                          let value = e.target.value.replace(/[^\d-]/g, '');
                          
                          // Format as DD-MM-YYYY
                          if (value.length >= 2 && !value.includes('-')) {
                            value = value.substring(0, 2) + '-' + value.substring(2);
                          }
                          if (value.length >= 5 && value.split('-').length === 2) {
                            const parts = value.split('-');
                            value = parts[0] + '-' + parts[1].substring(0, 2) + '-' + parts[1].substring(2);
                          }
                          
                          // Limit to DD-MM-YYYY format
                          if (value.length <= 10) {
                            // If complete date, convert to ISO format for storage
                            if (value.length === 10) {
                              const [day, month, year] = value.split('-');
                              if (day && month && year && day.length === 2 && month.length === 2 && year.length === 4) {
                                const dayNum = parseInt(day);
                                const monthNum = parseInt(month);
                                const yearNum = parseInt(year);
                                
                                if (dayNum >= 1 && dayNum <= 31 && monthNum >= 1 && monthNum <= 12 && yearNum >= 1900) {
                                  updateRow(row.id, 'date', `${year}-${month}-${day}`);
                                  return;
                                }
                              }
                            }
                            updateRow(row.id, 'date', value);
                          }
                        }}
                        placeholder="DD-MM-YYYY"
                        style={{
                          width: '100%',
                          padding: '12px 45px 12px 15px',
                          border: '2px solid #e1e5e9',
                          borderRadius: '12px',
                          fontSize: '14px',
                          backgroundColor: '#ffffff',
                          fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, sans-serif',
                          color: '#2d3748',
                          cursor: 'text',
                          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
                          outline: 'none',
                          transition: 'all 0.2s ease',
                          letterSpacing: '0.5px'
                        }}
                        onFocus={(e) => {
                          e.target.style.borderColor = '#667eea';
                          e.target.style.backgroundColor = '#fafbff';
                          e.target.style.boxShadow = '0 0 0 3px rgba(102, 126, 234, 0.1), 0 4px 12px rgba(0, 0, 0, 0.1)';
                        }}
                        onBlur={(e) => {
                          e.target.style.borderColor = '#e1e5e9';
                          e.target.style.backgroundColor = '#ffffff';
                          e.target.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.08)';
                        }}
                        onMouseEnter={(e) => {
                          if (e.target !== document.activeElement) {
                            e.target.style.borderColor = '#cbd5e0';
                            e.target.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.12)';
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (e.target !== document.activeElement) {
                            e.target.style.borderColor = '#e1e5e9';
                            e.target.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.08)';
                          }
                        }}
                      />
                      <div style={{
                        position: 'absolute',
                        right: '12px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        borderRadius: '8px',
                        padding: '6px',
                        cursor: 'pointer',
                        boxShadow: '0 2px 6px rgba(102, 126, 234, 0.3)',
                        transition: 'all 0.2s ease',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                      onClick={() => {
                        setOpenCalendar(prev => ({
                          ...prev,
                          [row.id]: !prev[row.id]
                        }));
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateY(-50%) scale(1.05)';
                        e.currentTarget.style.boxShadow = '0 4px 10px rgba(102, 126, 234, 0.4)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateY(-50%) scale(1)';
                        e.currentTarget.style.boxShadow = '0 2px 6px rgba(102, 126, 234, 0.3)';
                      }}
                      title="Open calendar">
                        <span style={{ color: 'white', fontSize: '16px', lineHeight: 1 }}>📅</span>
                      </div>
                      
                      {/* Custom Calendar Popup */}
                      {openCalendar[row.id] && (
                        <div style={{
                          position: 'absolute',
                          top: '100%',
                          left: 0,
                          zIndex: 1000,
                          backgroundColor: 'white',
                          border: '2px solid #e1e5e9',
                          borderRadius: '16px',
                          boxShadow: '0 10px 30px rgba(0, 0, 0, 0.15)',
                          padding: '20px',
                          minWidth: '320px',
                          animation: 'fadeIn 0.2s ease'
                        }}>
                          {(() => {
                            const today = new Date();
                            const currentDate = row.date ? new Date(row.date) : today;
                            const year = currentDate.getFullYear();
                            const month = currentDate.getMonth();
                            const firstDay = new Date(year, month, 1);
                            const lastDay = new Date(year, month + 1, 0);
                            const daysInMonth = lastDay.getDate();
                            const startingDay = firstDay.getDay();
                            
                            const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                                              'July', 'August', 'September', 'October', 'November', 'December'];
                            
                            const days = [];
                            
                            // Empty cells for days before month starts
                            for (let i = 0; i < startingDay; i++) {
                              days.push(<div key={`empty-${i}`} style={{ height: '40px' }}></div>);
                            }
                            
                            // Days of the month
                            for (let day = 1; day <= daysInMonth; day++) {
                              const isToday = day === today.getDate() && month === today.getMonth() && year === today.getFullYear();
                              const isSelected = row.date === `${year}-${(month + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
                              
                              days.push(
                                <div
                                  key={day}
                                  style={{
                                    height: '40px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    cursor: 'pointer',
                                    borderRadius: '8px',
                                    fontWeight: isSelected ? 'bold' : 'normal',
                                    backgroundColor: isSelected ? '#667eea' : isToday ? '#f0f4ff' : 'transparent',
                                    color: isSelected ? 'white' : isToday ? '#667eea' : '#2d3748',
                                    transition: 'all 0.2s ease',
                                    fontSize: '14px'
                                  }}
                                  onClick={() => {
                                    const selectedDate = `${year}-${(month + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
                                    updateRow(row.id, 'date', selectedDate);
                                    setOpenCalendar(prev => ({ ...prev, [row.id]: false }));
                                  }}
                                  onMouseEnter={(e) => {
                                    if (!isSelected) {
                                      e.currentTarget.style.backgroundColor = '#e6edff';
                                    }
                                  }}
                                  onMouseLeave={(e) => {
                                    if (!isSelected) {
                                      e.currentTarget.style.backgroundColor = isToday ? '#f0f4ff' : 'transparent';
                                    }
                                  }}
                                >
                                  {day}
                                </div>
                              );
                            }
                            
                            return (
                              <div>
                                <div style={{ 
                                  display: 'flex', 
                                  justifyContent: 'space-between', 
                                  alignItems: 'center', 
                                  marginBottom: '20px',
                                  padding: '0 5px'
                                }}>
                                  <button
                                    onClick={() => {
                                      const newDate = new Date(currentDate);
                                      newDate.setMonth(newDate.getMonth() - 1);
                                      updateRow(row.id, 'date', `${newDate.getFullYear()}-${(newDate.getMonth() + 1).toString().padStart(2, '0')}-${Math.min(newDate.getDate(), new Date(newDate.getFullYear(), newDate.getMonth() + 1, 0).getDate()).toString().padStart(2, '0')}`);
                                    }}
                                    style={{
                                      background: 'none',
                                      border: 'none',
                                      fontSize: '20px',
                                      cursor: 'pointer',
                                      padding: '5px 10px',
                                      borderRadius: '6px',
                                      color: '#667eea'
                                    }}
                                  >←</button>
                                  <h3 style={{ 
                                    margin: 0, 
                                    color: '#2d3748', 
                                    fontSize: '18px',
                                    fontWeight: '600'
                                  }}>
                                    {monthNames[month]} {year}
                                  </h3>
                                  <button
                                    onClick={() => {
                                      const newDate = new Date(currentDate);
                                      newDate.setMonth(newDate.getMonth() + 1);
                                      updateRow(row.id, 'date', `${newDate.getFullYear()}-${(newDate.getMonth() + 1).toString().padStart(2, '0')}-${Math.min(newDate.getDate(), new Date(newDate.getFullYear(), newDate.getMonth() + 1, 0).getDate()).toString().padStart(2, '0')}`);
                                    }}
                                    style={{
                                      background: 'none',
                                      border: 'none',
                                      fontSize: '20px',
                                      cursor: 'pointer',
                                      padding: '5px 10px',
                                      borderRadius: '6px',
                                      color: '#667eea'
                                    }}
                                  >→</button>
                                </div>
                                <div style={{
                                  display: 'grid',
                                  gridTemplateColumns: 'repeat(7, 1fr)',
                                  gap: '2px',
                                  marginBottom: '15px'
                                }}>
                                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                                    <div key={day} style={{
                                      textAlign: 'center',
                                      fontWeight: '600',
                                      color: '#6b7280',
                                      fontSize: '12px',
                                      padding: '8px 0'
                                    }}>
                                      {day}
                                    </div>
                                  ))}
                                </div>
                                <div style={{
                                  display: 'grid',
                                  gridTemplateColumns: 'repeat(7, 1fr)',
                                  gap: '2px'
                                }}>
                                  {days}
                                </div>
                                <div style={{ 
                                  textAlign: 'center', 
                                  marginTop: '15px',
                                  paddingTop: '15px',
                                  borderTop: '1px solid #e5e7eb'
                                }}>
                                  <button
                                    onClick={() => {
                                      const today = new Date();
                                      updateRow(row.id, 'date', `${today.getFullYear()}-${(today.getMonth() + 1).toString().padStart(2, '0')}-${today.getDate().toString().padStart(2, '0')}`);
                                      setOpenCalendar(prev => ({ ...prev, [row.id]: false }));
                                    }}
                                    style={{
                                      backgroundColor: '#667eea',
                                      color: 'white',
                                      border: 'none',
                                      padding: '8px 16px',
                                      borderRadius: '8px',
                                      fontSize: '13px',
                                      fontWeight: '500',
                                      cursor: 'pointer',
                                      marginRight: '10px',
                                      transition: 'all 0.2s ease'
                                    }}
                                  >
                                    Today
                                  </button>
                                  <button
                                    onClick={() => setOpenCalendar(prev => ({ ...prev, [row.id]: false }))}
                                    style={{
                                      backgroundColor: '#f3f4f6',
                                      color: '#374151',
                                      border: 'none',
                                      padding: '8px 16px',
                                      borderRadius: '8px',
                                      fontSize: '13px',
                                      fontWeight: '500',
                                      cursor: 'pointer'
                                    }}
                                  >
                                    Close
                                  </button>
                                </div>
                              </div>
                            );
                          })()}
                        </div>
                      )}
                    </div>
                    
                    {/* Click outside to close calendar */}
                    {openCalendar[row.id] && (
                      <div
                        style={{
                          position: 'fixed',
                          top: 0,
                          left: 0,
                          right: 0,
                          bottom: 0,
                          zIndex: 999
                        }}
                        onClick={() => setOpenCalendar(prev => ({ ...prev, [row.id]: false }))}
                      />
                    )}
                  </td>
                  <td style={{ padding: '10px 8px', borderBottom: '1px solid #e9ecef', textAlign: 'center' }}>
                    <input
                      type="number"
                      value={row.quantity}
                      onChange={(e) => updateRow(row.id, 'quantity', parseFloat(e.target.value) || 0)}
                      style={{
                        width: '50px',
                        padding: '5px',
                        border: '1px solid #ced4da',
                        borderRadius: '3px',
                        fontSize: '13px',
                        textAlign: 'center'
                      }}
                      min="1"
                    />
                  </td>
                  <td style={{ padding: '10px 8px', borderBottom: '1px solid #e9ecef' }}>
                    <input
                      type="number"
                      value={row.unitPrice || ''}
                      onChange={(e) => updateRow(row.id, 'unitPrice', parseFloat(e.target.value) || 0)}
                      placeholder="0.00"
                      style={{
                        width: '100%',
                        padding: '5px 8px',
                        border: '1px solid #ced4da',
                        borderRadius: '3px',
                        fontSize: '13px',
                        textAlign: 'right'
                      }}
                      step="0.01"
                    />
                  </td>
                  <td style={{ padding: '10px 8px', borderBottom: '1px solid #e9ecef' }}>
                    <div style={{ position: 'relative', display: 'inline-block', width: '80px' }}>
                      <input
                        type="number"
                        value={row.discount || ''}
                        onChange={(e) => updateRow(row.id, 'discount', parseFloat(e.target.value) || 0)}
                        placeholder="0"
                        style={{
                          width: '100%',
                          padding: '5px 18px 5px 8px',
                          border: '1px solid #ced4da',
                          borderRadius: '3px',
                          fontSize: '13px',
                          textAlign: 'right',
                          outline: 'none'
                        }}
                        step="1"
                        min="0"
                        max="100"
                        onFocus={(e) => {
                          e.target.style.borderColor = '#667eea';
                          e.target.style.boxShadow = '0 0 0 2px rgba(102, 126, 234, 0.1)';
                        }}
                        onBlur={(e) => {
                          e.target.style.borderColor = '#ced4da';
                          e.target.style.boxShadow = 'none';
                        }}
                      />
                      <span style={{
                        position: 'absolute',
                        right: '6px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        fontSize: '13px',
                        color: '#6c757d',
                        fontWeight: '600',
                        pointerEvents: 'none'
                      }}>%</span>
                    </div>
                  </td>
                  <td style={{ padding: '10px 8px', borderBottom: '1px solid #e9ecef', textAlign: 'right', fontSize: '13px', fontWeight: '600', color: '#212529' }}>
                    ₹{row.total.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Summary Section */}
        <div style={{
          display: 'flex',
          padding: '30px',
          gap: '40px',
          backgroundColor: '#f8f9fa',
          marginTop: '20px'
        }}>
          {/* Payment Status */}
          <div style={{ flex: 1 }}>
            <div style={{ marginBottom: '20px' }}>
              <div style={{ fontSize: '12px', color: '#6c757d', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '5px', fontWeight: '600' }}>
                TOTAL BILL
              </div>
              <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#212529' }}>
                ₹{summary.totalBill.toFixed(2)}
              </div>
            </div>
            <div style={{ marginBottom: '20px' }}>
              <div style={{ fontSize: '12px', color: '#6c757d', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '5px', fontWeight: '600' }}>
                ADVANCE PAYMENTS
              </div>
              <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#28a745' }}>
                ₹{advancePayments.toFixed(2)}
              </div>
            </div>
            <div style={{ marginBottom: '20px' }}>
              <div style={{ fontSize: '12px', color: '#6c757d', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '5px', fontWeight: '600' }}>
                NET PAYABLE
              </div>
              <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#212529' }}>
                ₹{summary.netPayable.toFixed(2)}
              </div>
            </div>
            <div style={{ marginBottom: '20px', opacity: 0.5 }}>
              <div style={{ fontSize: '12px', color: '#6c757d', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '5px', fontWeight: '600' }}>
                REFUND
              </div>
              <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#212529' }}>
                ₹{summary.refund.toFixed(2)}
              </div>
            </div>
          </div>

          {/* Final Bill Totals */}
          <div style={{
            flex: 1,
            background: 'white',
            padding: '20px',
            borderRadius: '6px',
            border: '1px solid #dee2e6'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', fontSize: '14px', borderBottom: '1px solid #e9ecef' }}>
              <span style={{ color: '#495057', fontWeight: '500' }}>SUBTOTAL</span>
              <span style={{ fontWeight: '600', color: '#212529' }}>₹{summary.subtotal.toFixed(2)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', fontSize: '14px', borderBottom: '1px solid #e9ecef' }}>
              <span style={{ color: '#495057', fontWeight: '500' }}>
                TOTAL DISCOUNT
              </span>
              <span style={{ fontWeight: '600', color: '#212529' }}>₹{summary.totalDiscount.toFixed(2)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', fontSize: '14px', borderBottom: '1px solid #e9ecef' }}>
              <span style={{ color: '#495057', fontWeight: '500' }}>TOTAL BILL</span>
              <span style={{ fontWeight: '600', color: '#212529' }}>₹{summary.totalBill.toFixed(2)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', fontSize: '14px', borderBottom: '1px solid #e9ecef' }}>
              <span style={{ color: '#495057', fontWeight: '500' }}>ADVANCE PAYMENTS (-)</span>
              <span style={{ fontWeight: '600', color: '#28a745' }}>₹{advancePayments.toFixed(2)}</span>
            </div>
            <div style={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              padding: '15px',
              borderRadius: '6px',
              marginTop: '15px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <span style={{ fontSize: '16px', fontWeight: '600' }}>NET PAYABLE</span>
              <span style={{ fontSize: '24px', fontWeight: 'bold' }}>₹{summary.netPayable.toFixed(2)}</span>
            </div>
          </div>
        </div>
          </>
        )}

        {/* Footer Actions */}
        <div style={{
          padding: '20px 30px',
          textAlign: 'right',
          borderTop: '1px solid #dee2e6'
        }}>
          <button
            onClick={handlePrint}
            style={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              border: 'none',
              padding: '12px 40px',
              borderRadius: '6px',
              fontSize: '16px',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <Printer size={20} />
            Print Bill
          </button>
        </div>
      </div>

      {/* Patient Selection Modal */}
      {showPatientModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '8px',
            width: '600px',
            maxHeight: '80vh',
            display: 'flex',
            flexDirection: 'column'
          }}>
            <div style={{
              padding: '20px',
              borderBottom: '1px solid #e5e7eb',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <h3 style={{ fontSize: '18px', fontWeight: '600', margin: 0 }}>
                Select Patient
              </h3>
              <button
                onClick={() => setShowPatientModal(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#6b7280',
                  cursor: 'pointer',
                  fontSize: '20px'
                }}
              >
                <X size={24} />
              </button>
            </div>

            <div style={{ padding: '20px', borderBottom: '1px solid #e5e7eb' }}>
              <div style={{ position: 'relative' }}>
                <Search style={{
                  position: 'absolute',
                  left: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: '#9ca3af'
                }} size={20} />
                <input
                  type="text"
                  placeholder="Search by name, ID, or phone..."
                  value={patientSearchTerm}
                  onChange={(e) => setPatientSearchTerm(e.target.value)}
                  style={{
                    width: '100%',
                    paddingLeft: '44px',
                    paddingRight: '16px',
                    paddingTop: '12px',
                    paddingBottom: '12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '14px'
                  }}
                  autoFocus
                />
              </div>
            </div>

            <div style={{
              flex: 1,
              overflowY: 'auto',
              maxHeight: '400px'
            }}>
              {loading ? (
                <div style={{ padding: '40px', textAlign: 'center' }}>
                  <div>Loading patients...</div>
                </div>
              ) : filteredPatients.length > 0 ? (
                filteredPatients.map((patient) => (
                  <div
                    key={patient.id}
                    onClick={() => handlePatientSelect(patient)}
                    style={{
                      padding: '16px 20px',
                      borderBottom: '1px solid #f3f4f6',
                      cursor: 'pointer',
                      transition: 'background-color 0.2s'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f9fafb'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    <div style={{ fontWeight: '600', fontSize: '16px', color: '#111827' }}>
                      {patient.first_name} {patient.last_name || ''}
                    </div>
                    <div style={{ fontSize: '14px', color: '#6b7280', marginTop: '4px' }}>
                      ID: {patient.patient_id} • Phone: {patient.phone} • Age: {patient.age || 'N/A'}
                    </div>
                    {patient.ipd_status && (
                      <div style={{
                        fontSize: '12px',
                        color: '#059669',
                        marginTop: '4px',
                        fontWeight: '500'
                      }}>
                        IPD Status: {patient.ipd_status}
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div style={{ padding: '40px', textAlign: 'center', color: '#6b7280' }}>
                  {patientSearchTerm ? 'No patients found matching your search' : 'No patients available'}
                </div>
              )}
            </div>

            {selectedPatient && (
              <div style={{
                padding: '16px 20px',
                borderTop: '1px solid #e5e7eb',
                backgroundColor: '#f9fafb'
              }}>
                <button
                  onClick={clearPatientSelection}
                  style={{
                    background: '#ef4444',
                    color: 'white',
                    border: 'none',
                    padding: '8px 16px',
                    borderRadius: '4px',
                    fontSize: '14px',
                    cursor: 'pointer'
                  }}
                >
                  Clear Selection
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Payer Selection Modal */}
      {showPayerModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '8px',
            width: '600px',
            maxHeight: '80vh',
            display: 'flex',
            flexDirection: 'column'
          }}>
            <div style={{
              padding: '20px',
              borderBottom: '1px solid #e5e7eb',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <h3 style={{ fontSize: '18px', fontWeight: '600', margin: 0 }}>
                Select Insurance Payer
              </h3>
              <button
                onClick={() => setShowPayerModal(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#6b7280',
                  cursor: 'pointer',
                  fontSize: '20px'
                }}
              >
                <X size={24} />
              </button>
            </div>

            <div style={{
              flex: 1,
              overflowY: 'auto',
              maxHeight: '500px'
            }}>
              {payersList.map((payer, index) => (
                <div
                  key={index}
                  onClick={() => handlePayerSelect(payer)}
                  style={{
                    padding: '16px 20px',
                    borderBottom: '1px solid #f3f4f6',
                    cursor: 'pointer',
                    transition: 'background-color 0.2s',
                    backgroundColor: selectedPayer === payer ? '#e0f2fe' : 'transparent'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = selectedPayer === payer ? '#e0f2fe' : '#f9fafb'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = selectedPayer === payer ? '#e0f2fe' : 'transparent'}
                >
                  <div style={{ 
                    fontWeight: selectedPayer === payer ? '600' : '500', 
                    fontSize: '16px', 
                    color: selectedPayer === payer ? '#0369a1' : '#111827' 
                  }}>
                    {payer}
                  </div>
                  {selectedPayer === payer && (
                    <div style={{
                      fontSize: '12px',
                      color: '#0369a1',
                      marginTop: '4px',
                      fontWeight: '500'
                    }}>
                      ✓ Currently Selected
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div style={{
              padding: '16px 20px',
              borderTop: '1px solid #e5e7eb',
              backgroundColor: '#f9fafb',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div style={{ fontSize: '14px', color: '#6b7280' }}>
                {selectedPayer ? `Selected: ${selectedPayer}` : 'No payer selected'}
              </div>
              <button
                onClick={() => setShowPayerModal(false)}
                style={{
                  background: '#10b981',
                  color: 'white',
                  border: 'none',
                  padding: '8px 16px',
                  borderRadius: '4px',
                  fontSize: '14px',
                  cursor: 'pointer'
                }}
              >
                Confirm Selection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Change Charges Modal */}
      {showChangeCharges && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '16px',
            padding: '30px',
            maxWidth: '800px',
            width: '90%',
            maxHeight: '80vh',
            overflowY: 'auto',
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.15)'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '25px',
              paddingBottom: '15px',
              borderBottom: '2px solid #e1e5e9'
            }}>
              <h2 style={{ margin: 0, color: '#2d3748', fontSize: '24px', fontWeight: '600' }}>Change Charges</h2>
              <button
                onClick={() => setShowChangeCharges(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '24px',
                  cursor: 'pointer',
                  color: '#6b7280',
                  padding: '5px'
                }}
              >×</button>
            </div>
            
            <div style={{ marginBottom: '20px' }}>
              <h3 style={{ color: '#374151', marginBottom: '15px' }}>Current Billing Rows</h3>
              <div style={{ maxHeight: '300px', overflowY: 'auto', border: '1px solid #e5e7eb', borderRadius: '8px' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead style={{ backgroundColor: '#f9fafb', position: 'sticky', top: 0 }}>
                    <tr>
                      <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #e5e7eb', fontSize: '13px', fontWeight: '600' }}>Service</th>
                      <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #e5e7eb', fontSize: '13px', fontWeight: '600' }}>Unit Price</th>
                      <th style={{ padding: '12px', textAlign: 'center', borderBottom: '1px solid #e5e7eb', fontSize: '13px', fontWeight: '600' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {billingRows.map((row) => (
                      <tr key={row.id}>
                        <td style={{ padding: '10px 12px', borderBottom: '1px solid #e5e7eb' }}>{row.serviceType}</td>
                        <td style={{ padding: '10px 12px', borderBottom: '1px solid #e5e7eb' }}>
                          <input
                            type="number"
                            value={row.unitPrice}
                            onChange={(e) => updateRow(row.id, 'unitPrice', parseFloat(e.target.value) || 0)}
                            style={{
                              width: '100px',
                              padding: '6px',
                              border: '1px solid #d1d5db',
                              borderRadius: '4px',
                              fontSize: '13px'
                            }}
                          />
                        </td>
                        <td style={{ padding: '10px 12px', borderBottom: '1px solid #e5e7eb', textAlign: 'center' }}>
                          <button
                            onClick={() => {
                              setBillingRows(billingRows.filter(r => r.id !== row.id));
                              toast.success('Row removed successfully!');
                            }}
                            style={{
                              backgroundColor: '#dc3545',
                              color: 'white',
                              border: 'none',
                              padding: '4px 8px',
                              borderRadius: '4px',
                              fontSize: '12px',
                              cursor: 'pointer'
                            }}
                          >
                            Remove
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              paddingTop: '20px',
              borderTop: '1px solid #e5e7eb'
            }}>
              <button
                onClick={() => {
                  const newId = Date.now().toString();
                  setBillingRows([...billingRows, {
                    id: newId,
                    serviceType: 'New Service',
                    particulars: 'New Service',
                    date: new Date().toISOString().split('T')[0],
                    quantity: 1,
                    unitPrice: 0,
                    discount: 0,
                    total: 0
                  }]);
                  toast.success('New billing row added!');
                }}
                style={{
                  backgroundColor: '#28a745',
                  color: 'white',
                  border: 'none',
                  padding: '10px 20px',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer'
                }}
              >
                Add New Row
              </button>
              <button
                onClick={() => setShowChangeCharges(false)}
                style={{
                  backgroundColor: '#007bff',
                  color: 'white',
                  border: 'none',
                  padding: '10px 20px',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer'
                }}
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Pharmacy Bill Modal */}
      {showAddPharmacy && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '16px',
            padding: '30px',
            maxWidth: '600px',
            width: '90%',
            maxHeight: '80vh',
            overflowY: 'auto',
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.15)'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '25px',
              paddingBottom: '15px',
              borderBottom: '2px solid #e1e5e9'
            }}>
              <h2 style={{ margin: 0, color: '#2d3748', fontSize: '24px', fontWeight: '600' }}>Add Pharmacy Bill</h2>
              <button
                onClick={() => setShowAddPharmacy(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '24px',
                  cursor: 'pointer',
                  color: '#6b7280',
                  padding: '5px'
                }}
              >×</button>
            </div>
            
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#374151' }}>
                Bill Number
              </label>
              <input
                type="text"
                value={newPharmacyBill.billNumber}
                onChange={(e) => setNewPharmacyBill({...newPharmacyBill, billNumber: e.target.value})}
                placeholder="Enter bill number"
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '2px solid #e1e5e9',
                  borderRadius: '8px',
                  fontSize: '14px',
                  outline: 'none'
                }}
              />
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#374151' }}>
                Date
              </label>
              <input
                type="date"
                value={newPharmacyBill.date}
                onChange={(e) => setNewPharmacyBill({...newPharmacyBill, date: e.target.value})}
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '2px solid #e1e5e9',
                  borderRadius: '8px',
                  fontSize: '14px',
                  outline: 'none'
                }}
              />
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#374151' }}>
                Total Amount
              </label>
              <input
                type="number"
                value={newPharmacyBill.total}
                onChange={(e) => setNewPharmacyBill({...newPharmacyBill, total: parseFloat(e.target.value) || 0})}
                placeholder="0.00"
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '2px solid #e1e5e9',
                  borderRadius: '8px',
                  fontSize: '14px',
                  outline: 'none'
                }}
              />
            </div>

            <div style={{
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '15px',
              paddingTop: '20px',
              borderTop: '1px solid #e5e7eb'
            }}>
              <button
                onClick={() => setShowAddPharmacy(false)}
                style={{
                  backgroundColor: '#6b7280',
                  color: 'white',
                  border: 'none',
                  padding: '10px 20px',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (!newPharmacyBill.billNumber || !newPharmacyBill.total) {
                    toast.error('Please fill in all fields');
                    return;
                  }
                  
                  const newBill = {
                    ...newPharmacyBill,
                    id: Date.now().toString(),
                    createdAt: new Date().toLocaleString()
                  };
                  
                  setPharmacyBills([...pharmacyBills, newBill]);
                  setNewPharmacyBill({
                    billNumber: '',
                    date: new Date().toISOString().split('T')[0],
                    items: [],
                    total: 0
                  });
                  setShowAddPharmacy(false);
                  toast.success('Pharmacy bill added successfully!');
                }}
                style={{
                  backgroundColor: '#28a745',
                  color: 'white',
                  border: 'none',
                  padding: '10px 20px',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer'
                }}
              >
                Add Bill
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Pharmacy Bill Modal */}
      {showViewPharmacy && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '16px',
            padding: '30px',
            maxWidth: '700px',
            width: '90%',
            maxHeight: '80vh',
            overflowY: 'auto',
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.15)'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '25px',
              paddingBottom: '15px',
              borderBottom: '2px solid #e1e5e9'
            }}>
              <h2 style={{ margin: 0, color: '#2d3748', fontSize: '24px', fontWeight: '600' }}>Pharmacy Bills</h2>
              <button
                onClick={() => setShowViewPharmacy(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '24px',
                  cursor: 'pointer',
                  color: '#6b7280',
                  padding: '5px'
                }}
              >×</button>
            </div>
            
            {pharmacyBills.length === 0 ? (
              <div style={{
                textAlign: 'center',
                padding: '40px',
                color: '#6b7280'
              }}>
                <div style={{ fontSize: '48px', marginBottom: '16px' }}>💊</div>
                <h3 style={{ margin: '0 0 8px 0', color: '#374151' }}>No Pharmacy Bills</h3>
                <p style={{ margin: 0 }}>No pharmacy bills have been added yet.</p>
              </div>
            ) : (
              <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead style={{ backgroundColor: '#f9fafb', position: 'sticky', top: 0 }}>
                    <tr>
                      <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #e5e7eb', fontSize: '13px', fontWeight: '600' }}>Bill #</th>
                      <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #e5e7eb', fontSize: '13px', fontWeight: '600' }}>Date</th>
                      <th style={{ padding: '12px', textAlign: 'right', borderBottom: '2px solid #e5e7eb', fontSize: '13px', fontWeight: '600' }}>Amount</th>
                      <th style={{ padding: '12px', textAlign: 'center', borderBottom: '2px solid #e5e7eb', fontSize: '13px', fontWeight: '600' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pharmacyBills.map((bill, index) => (
                      <tr key={bill.id} style={{ backgroundColor: index % 2 === 0 ? 'white' : '#f9fafb' }}>
                        <td style={{ padding: '12px', borderBottom: '1px solid #e5e7eb' }}>{bill.billNumber}</td>
                        <td style={{ padding: '12px', borderBottom: '1px solid #e5e7eb' }}>
                          {new Date(bill.date).toLocaleDateString('en-GB')}
                        </td>
                        <td style={{ padding: '12px', borderBottom: '1px solid #e5e7eb', textAlign: 'right', fontWeight: '600' }}>
                          ₹{bill.total.toFixed(2)}
                        </td>
                        <td style={{ padding: '12px', borderBottom: '1px solid #e5e7eb', textAlign: 'center' }}>
                          <button
                            onClick={() => {
                              setPharmacyBills(pharmacyBills.filter(b => b.id !== bill.id));
                              toast.success('Pharmacy bill deleted!');
                            }}
                            style={{
                              backgroundColor: '#dc3545',
                              color: 'white',
                              border: 'none',
                              padding: '4px 8px',
                              borderRadius: '4px',
                              fontSize: '12px',
                              cursor: 'pointer'
                            }}
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                
                <div style={{
                  marginTop: '20px',
                  padding: '15px',
                  backgroundColor: '#f0f9ff',
                  borderRadius: '8px',
                  borderLeft: '4px solid #0ea5e9'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: '600', color: '#0f172a' }}>Total Pharmacy Amount:</span>
                    <span style={{ fontSize: '18px', fontWeight: 'bold', color: '#0ea5e9' }}>
                      ₹{pharmacyBills.reduce((sum, bill) => sum + bill.total, 0).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            )}

            <div style={{
              display: 'flex',
              justifyContent: 'flex-end',
              paddingTop: '20px',
              borderTop: '1px solid #e5e7eb'
            }}>
              <button
                onClick={() => setShowViewPharmacy(false)}
                style={{
                  backgroundColor: '#007bff',
                  color: 'white',
                  border: 'none',
                  padding: '10px 20px',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer'
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NewIPDBillingModule;
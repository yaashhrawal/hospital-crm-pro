import React, { useState, useEffect } from 'react';
import { Printer, Search, X, Plus } from 'lucide-react';
import toast from 'react-hot-toast';
import HospitalService from '../../services/hospitalService';
import { supabase, HOSPITAL_ID } from '../../config/supabaseNew';
import type { PatientWithRelations } from '../../config/supabaseNew';
import { MEDICAL_SERVICES, searchServices, type MedicalService } from '../../data/medicalServices';

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
  // Main state for showing/hiding the IPD bill creation form
  const [showCreateBill, setShowCreateBill] = useState(false);
  
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
  const [referenceNo, setReferenceNo] = useState('');
  const [receivedBy, setReceivedBy] = useState('');

  // IPD Billing Form States
  // Room & Accommodation
  const [roomType, setRoomType] = useState('General Ward');
  const [roomRate, setRoomRate] = useState(500);
  const [stayDays, setStayDays] = useState(1);

  // Medical Professional Charges
  const [consultantFees, setConsultantFees] = useState(1000);
  const [visitingDoctorFees, setVisitingDoctorFees] = useState(500);
  const [nursingCharges, setNursingCharges] = useState(200);
  const [attendantCharges, setAttendantCharges] = useState(100);

  // Investigation & Diagnostic
  const [labTests, setLabTests] = useState(800);
  const [radiologyCharges, setRadiologyCharges] = useState(1200);
  const [ecgCharges, setEcgCharges] = useState(300);
  const [otherDiagnostics, setOtherDiagnostics] = useState(0);

  // Treatment & Operation
  const [operationTheaterCharges, setOperationTheaterCharges] = useState(0);
  const [surgeonFees, setSurgeonFees] = useState(0);
  const [anesthesiaCharges, setAnesthesiaCharges] = useState(0);
  const [equipmentCharges, setEquipmentCharges] = useState(0);

  // Medicine & Pharmacy
  const [pharmacyBills, setPharmacyBills] = useState(0);
  const [ivFluids, setIvFluids] = useState(0);
  const [bloodProducts, setBloodProducts] = useState(0);
  const [medicalSupplies, setMedicalSupplies] = useState(0);

  // Other Services
  const [physiotherapy, setPhysiotherapy] = useState(0);
  const [ambulanceServices, setAmbulanceServices] = useState(0);
  const [medicalCertificate, setMedicalCertificate] = useState(0);
  const [miscCharges, setMiscCharges] = useState(0);

  // Admission and Bill Summary
  const [admissionFee, setAdmissionFee] = useState(2000);
  const [discount, setDiscount] = useState(0);
  const [tax, setTax] = useState(0);
  const [finalPaymentMode, setFinalPaymentMode] = useState('CASH');

  // Custom Fields
  const [customFields, setCustomFields] = useState([
    { description: '', amount: 0, type: 'One-time', id: Date.now() }
  ]);

  // Services Management
  const [selectedServices, setSelectedServices] = useState<Array<{id: string, name: string, amount: number, selected: boolean}>>([]);
  
  // IPD Bills List State
  const [ipdBills, setIpdBills] = useState<any[]>([]);
  const [billsLoading, setBillsLoading] = useState(false);
  
  // Debug: Track state changes
  useEffect(() => {
    console.log('🔄 IPD BILLS STATE CHANGED:', ipdBills.length, 'bills');
    console.log('🔄 Bills data:', ipdBills);
  }, [ipdBills]);
  const [serviceSearchTerm, setServiceSearchTerm] = useState('');
  const [showServiceDropdown, setShowServiceDropdown] = useState(false);
  const [customServiceName, setCustomServiceName] = useState('');
  const [customServiceAmount, setCustomServiceAmount] = useState('');
  const [availableServices, setAvailableServices] = useState<MedicalService[]>(MEDICAL_SERVICES);

  // Stay Segment Management
  const [staySegments, setStaySegments] = useState([{
    id: Date.now(),
    roomType: 'General Ward',
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Default to tomorrow
    bedChargePerDay: 1000,
    nursingChargePerDay: 200,
    rmoChargePerDay: 100,
    doctorChargePerDay: 500
  }]);

  // Deposit Management
  const [newDepositAmount, setNewDepositAmount] = useState('');
  const [newDepositMode, setNewDepositMode] = useState('CASH');
  const [newDepositReference, setNewDepositReference] = useState('');
  const [newDepositReceivedBy, setNewDepositReceivedBy] = useState('');
  const [receiptCounter, setReceiptCounter] = useState(1067);
  const [openCalendar, setOpenCalendar] = useState<{[key: string]: boolean}>({});
  const [showChangeCharges, setShowChangeCharges] = useState(false);
  const [showAddPharmacy, setShowAddPharmacy] = useState(false);

  // Calculate automatic stay duration when patient is selected
  useEffect(() => {
    if (selectedPatient?.admissions?.[0]?.admission_date) {
      const admissionDate = new Date(selectedPatient.admissions[0].admission_date);
      const currentDate = new Date();
      const diffTime = Math.abs(currentDate.getTime() - admissionDate.getTime());
      const diffDays = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
      setStayDays(diffDays);
    }
  }, [selectedPatient]);

  // Auto-recalculate totals whenever any billing amount changes
  useEffect(() => {
    // This will trigger re-renders with updated calculations
    // The calculations are already live through the calculation functions
  }, [
    roomRate, stayDays, consultantFees, visitingDoctorFees, nursingCharges, attendantCharges,
    labTests, radiologyCharges, ecgCharges, otherDiagnostics,
    operationTheaterCharges, surgeonFees, anesthesiaCharges, equipmentCharges,
    pharmacyBills, ivFluids, bloodProducts, medicalSupplies,
    physiotherapy, ambulanceServices, medicalCertificate, miscCharges,
    customFields, discount, tax, advancePayments
  ]);

  // Calculation functions
  const calculateRoomCharges = () => roomRate * stayDays;
  const calculateMedicalCharges = () => consultantFees + visitingDoctorFees + nursingCharges + attendantCharges;
  const calculateDiagnosticCharges = () => labTests + radiologyCharges + ecgCharges + otherDiagnostics;
  const calculateTreatmentCharges = () => operationTheaterCharges + surgeonFees + anesthesiaCharges + equipmentCharges;
  const calculatePharmacyCharges = () => pharmacyBills + ivFluids + bloodProducts + medicalSupplies;
  const calculateOtherCharges = () => physiotherapy + ambulanceServices + medicalCertificate + miscCharges;
  
  const calculateCustomCharges = () => {
    return customFields.reduce((total, field) => {
      if (field.type === 'Per day') {
        return total + (field.amount * stayDays);
      }
      return total + field.amount;
    }, 0);
  };

  const calculateGrossTotal = () => {
    return calculateRoomCharges() + 
           calculateMedicalCharges() + 
           calculateDiagnosticCharges() + 
           calculateTreatmentCharges() + 
           calculatePharmacyCharges() + 
           calculateOtherCharges() + 
           calculateCustomCharges();
  };

  const calculateNetPayable = () => {
    const gross = calculateGrossTotal();
    return Math.max(0, gross - discount + tax);
  };

  const calculateBalanceAfterDeposits = () => {
    return calculateNetPayable() - advancePayments;
  };

  // Custom field management functions
  const addCustomField = () => {
    const newField = {
      description: '',
      amount: 0,
      type: 'One-time',
      id: Date.now()
    };
    setCustomFields([...customFields, newField]);
  };

  const updateCustomField = (id: number, field: string, value: string | number) => {
    setCustomFields(customFields.map(item => 
      item.id === id ? { ...item, [field]: value } : item
    ));
  };

  const removeCustomField = (id: number) => {
    setCustomFields(customFields.filter(item => item.id !== id));
  };

  // Stay segment calculation functions
  const calculateDays = (startDate: string, endDate: string): number => {
    if (!startDate || !endDate) return 0;
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays === 0 ? 1 : diffDays; // Minimum 1 day
  };

  const calculateSegmentTotal = (segment: any): number => {
    const days = calculateDays(segment.startDate, segment.endDate);
    return (segment.bedChargePerDay + segment.nursingChargePerDay + segment.rmoChargePerDay + segment.doctorChargePerDay) * days;
  };

  const calculateTotalStayCharges = (): number => {
    return staySegments.reduce((total, segment) => total + calculateSegmentTotal(segment), 0);
  };

  const updateStaySegment = (id: number, field: string, value: any) => {
    setStaySegments(staySegments.map(segment => 
      segment.id === id ? { ...segment, [field]: value } : segment
    ));
  };

  const addStaySegment = () => {
    const newSegment = {
      id: Date.now(),
      roomType: 'General Ward',
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      bedChargePerDay: 1000,
      nursingChargePerDay: 200,
      rmoChargePerDay: 100,
      doctorChargePerDay: 500
    };
    setStaySegments([...staySegments, newSegment]);
  };

  const removeStaySegment = (id: number) => {
    if (staySegments.length > 1) {
      setStaySegments(staySegments.filter(segment => segment.id !== id));
    }
  };

  // Service management functions
  const addServiceFromDropdown = (service: MedicalService) => {
    const existingService = selectedServices.find(s => s.id === service.id);
    if (!existingService) {
      const newService = {
        id: service.id,
        name: service.name,
        amount: service.basePrice,
        selected: true
      };
      setSelectedServices([...selectedServices, newService]);
      toast.success(`Added ${service.name} to bill`);
    } else {
      toast(`${service.name} is already in the bill`);
    }
    setServiceSearchTerm('');
    setShowServiceDropdown(false);
  };

  const removeService = (serviceId: string) => {
    setSelectedServices(selectedServices.filter(s => s.id !== serviceId));
  };

  const updateServiceAmount = (serviceId: string, amount: number) => {
    setSelectedServices(selectedServices.map(s => 
      s.id === serviceId ? { ...s, amount } : s
    ));
  };

  const saveCustomService = async () => {
    if (!customServiceName.trim() || !customServiceAmount) {
      toast.error('Please enter service name and amount');
      return;
    }

    try {
      // Create custom service object
      const customService: MedicalService = {
        id: `custom_${Date.now()}`,
        name: customServiceName.trim(),
        code: `CUSTOM-${Date.now()}`,
        category: 'PROCEDURES',
        department: 'Custom Services',
        description: `Custom service: ${customServiceName.trim()}`,
        basePrice: parseFloat(customServiceAmount),
        duration: 30,
        preparationRequired: false,
        fastingRequired: false,
        isActive: true
      };

      // Add to available services
      setAvailableServices([...availableServices, customService]);
      
      // Auto-add to selected services
      const newSelectedService = {
        id: customService.id,
        name: customService.name,
        amount: customService.basePrice,
        selected: true
      };
      setSelectedServices([...selectedServices, newSelectedService]);

      // Save to database (placeholder - implement actual database save)
      try {
        const { error } = await supabase
          .from('custom_services')
          .insert([{
            hospital_id: HOSPITAL_ID,
            service_name: customService.name,
            service_code: customService.code,
            category: customService.category,
            department: customService.department,
            description: customService.description,
            base_price: customService.basePrice,
            is_active: true,
            created_at: new Date().toISOString()
          }]);

        if (error) {
          console.error('Error saving custom service:', error);
          toast.error('Service added to current bill but not saved permanently');
        } else {
          toast.success('Custom service saved and added to bill!');
        }
      } catch (dbError) {
        console.error('Database save error:', dbError);
        toast.error('Service added to current bill only');
      }

      // Reset form
      setCustomServiceName('');
      setCustomServiceAmount('');
      
    } catch (error) {
      console.error('Error creating custom service:', error);
      toast.error('Failed to add custom service');
    }
  };

  const calculateSelectedServicesTotal = () => {
    return selectedServices
      .filter(service => service.selected)
      .reduce((total, service) => total + service.amount, 0);
  };

  const filteredAvailableServices = availableServices.filter(service =>
    service.name.toLowerCase().includes(serviceSearchTerm.toLowerCase()) ||
    service.code.toLowerCase().includes(serviceSearchTerm.toLowerCase()) ||
    service.category.toLowerCase().includes(serviceSearchTerm.toLowerCase())
  ).slice(0, 10);

  // Deposit management functions
  const addDeposit = () => {
    if (newDepositAmount && parseFloat(newDepositAmount) > 0) {
      const newDeposit = {
        receiptNo: `ADV-${Date.now()}-${depositHistory.length + 1}`,
        date: new Date().toLocaleDateString('en-IN') + ' ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        amount: parseFloat(newDepositAmount),
        paymentMode: newDepositMode,
        reference: newDepositReference || '-',
        receivedBy: newDepositReceivedBy || 'System',
        timestamp: Date.now()
      };

      setDepositHistory([...depositHistory, newDeposit]);
      setAdvancePayments(prev => prev + parseFloat(newDepositAmount));
      
      // Reset form
      setNewDepositAmount('');
      setNewDepositReference('');
      setNewDepositReceivedBy('');
      
      // You can add toast notification here
      console.log('Deposit added successfully');
    }
  };

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
    console.log('🚀 IPD BILLING: Component mounted, loading data...');
    loadPatients();
    loadIPDBills();
    
  }, []);

  // Calculate totals whenever billing rows or advance payments change
  useEffect(() => {
    calculateSummary();
  }, [billingRows, advancePayments]);

  const loadPatients = async () => {
    try {
      setLoading(true);
      console.log('🔍 IPD BILLING: Loading patients with admission data for billing...');
      console.log('🔍 IPD BILLING: Hospital ID:', HOSPITAL_ID);
      
      // Get all patients with admissions data using direct supabase query
      const { data: allPatients, error } = await supabase
        .from('patients')
        .select(`
          *,
          transactions:patient_transactions(*),
          admissions:patient_admissions(*)
        `)
        // .eq('hospital_id', HOSPITAL_ID) // Removed as hospital may not exist
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(1000);
      
      if (error) {
        console.error('❌ IPD BILLING: Error loading patients with admissions:', error);
        toast.error('Failed to load patient data: ' + error.message);
        return;
      }
      
      console.log('✅ IPD BILLING: Loaded patients with admissions:', allPatients?.length || 0);
      if (allPatients && allPatients.length > 0) {
        console.log('✅ IPD BILLING: Sample patient data:', allPatients[0]);
      }
      setPatients(allPatients || []);
    } catch (error) {
      console.error('❌ IPD BILLING: Failed to load patients:', error);
      toast.error('Failed to load patient data: ' + (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const loadIPDBills = async () => {
    try {
      setBillsLoading(true);
      console.log('💵 Loading IPD bills and deposits from transactions...');
      
      // Test database connection first
      const { data: connectionTest, error: connectionError } = await supabase
        .from('patient_transactions')
        .select('count(*)')
        .single();
        
      console.log('🔗 Database connection test:', { count: connectionTest, error: connectionError });
      
      // Load all IPD-related transactions (both bills and deposits)
      console.log('🔍 Loading IPD transactions (SERVICE and ADMISSION_FEE types)...');
      
      const { data: ipdTransactions, error: transactionError } = await supabase
        .from('patient_transactions')
        .select('*')
        .in('transaction_type', ['SERVICE', 'ADMISSION_FEE']) // Include both bills and deposits
        .neq('status', 'DELETED')
        .order('created_at', { ascending: false })
        .limit(100);
      
      if (transactionError) {
        console.error('❌ Error loading IPD transactions:', transactionError);
        setIpdBills([]);
        toast.error('Failed to load IPD transactions');
        return;
      }

      console.log('✅ Loaded IPD transactions:', ipdTransactions?.length || 0);
      console.log('📊 Transaction breakdown:', {
        total: ipdTransactions?.length || 0,
        services: ipdTransactions?.filter(t => t.transaction_type === 'SERVICE').length || 0,
        deposits: ipdTransactions?.filter(t => t.transaction_type === 'ADMISSION_FEE').length || 0
      });

      if (ipdTransactions && ipdTransactions.length > 0) {
        // Enrich transactions with patient data
        const enrichedTransactions = await Promise.all(
          ipdTransactions.map(async (transaction) => {
            try {
              const { data: patientData } = await supabase
                .from('patients')
                .select('id, patient_id, first_name, last_name, phone')
                .eq('id', transaction.patient_id)
                .single();
              
              return {
                ...transaction,
                patients: patientData,
                // Add display type for UI
                display_type: transaction.transaction_type === 'SERVICE' ? 'IPD Bill' : 'Deposit',
                display_icon: transaction.transaction_type === 'SERVICE' ? '🧾' : '💰'
              };
            } catch (patientError) {
              console.warn('⚠️ Could not load patient data for transaction:', transaction.id);
              return {
                ...transaction,
                patients: null,
                display_type: transaction.transaction_type === 'SERVICE' ? 'IPD Bill' : 'Deposit',
                display_icon: transaction.transaction_type === 'SERVICE' ? '🧾' : '💰'
              };
            }
          })
        );
        
        console.log('💾 Enriched IPD transactions with patient data:', enrichedTransactions);
        console.log('🔄 Setting IPD bills state with:', enrichedTransactions.length, 'transactions');
        setIpdBills([...enrichedTransactions]); // Include both bills and deposits
        toast.success(`Loaded ${enrichedTransactions.length} IPD transactions (${enrichedTransactions.filter(t => t.transaction_type === 'SERVICE').length} bills, ${enrichedTransactions.filter(t => t.transaction_type === 'ADMISSION_FEE').length} deposits)`);
      } else {
        console.log('ℹ️ No IPD transactions found');
        setIpdBills([]);
        toast.info('No IPD transactions found');
      }
      
    } catch (error: any) {
      console.error('❌ CATCH: Failed to load IPD bills:', error);
      setIpdBills([]); // Set empty array as fallback
      toast.error(`Failed to load IPD bills: ${error.message || error}`);
    } finally {
      setBillsLoading(false);
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
  const addAdvancePayment = async () => {
    console.log('🏥 DEPOSIT: addAdvancePayment function called');
    console.log('🏥 DEPOSIT: newPaymentAmount:', newPaymentAmount);
    console.log('🏥 DEPOSIT: selectedPatient:', selectedPatient);
    
    const amount = parseFloat(newPaymentAmount);
    console.log('🏥 DEPOSIT: parsed amount:', amount);
    
    if (!amount || amount <= 0) {
      console.log('🏥 DEPOSIT: Invalid amount error');
      toast.error('Please enter a valid amount');
      return;
    }
    
    if (!selectedPatient) {
      console.log('🏥 DEPOSIT: No patient selected error');
      toast.error('Please select a patient first');
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
      paymentMode: newPaymentMode,
      reference: referenceNo || '-',
      receivedBy: receivedBy || 'System',
      status: 'RECEIVED'
    };
    
    try {
      // Validate patient ID
      if (!selectedPatient?.id) {
        console.error('❌ No patient ID found');
        toast.error('Invalid patient selection');
        return;
      }

      // Save to database - patient_transactions table
      // Note: Removing hospital_id as it may not exist in the database
      const transactionData = {
        patient_id: selectedPatient.id,
        transaction_type: 'ADMISSION_FEE', // Changed to uppercase to match database constraint
        description: `IPD Advance Payment - Receipt: ${newReceiptNo}${referenceNo ? ` - Ref: ${referenceNo}` : ''}`,
        amount: amount,
        payment_mode: newPaymentMode.toUpperCase(),
        doctor_id: null,
        doctor_name: null,
        status: 'COMPLETED',
        transaction_reference: referenceNo || newReceiptNo,
        transaction_date: billingDate
        // Removed hospital_id to avoid foreign key constraint issues
      };

      console.log('💾 Attempting to save transaction:', transactionData);

      const { data, error: dbError } = await supabase
        .from('patient_transactions')
        .insert([transactionData])
        .select();

      if (dbError) {
        console.error('❌ Database save error:', dbError);
        console.error('❌ Error details:', {
          message: dbError.message,
          details: dbError.details,
          hint: dbError.hint,
          code: dbError.code
        });
        
        // More specific error messages
        if (dbError.code === '23503') {
          toast.error('Invalid patient or hospital reference. Please refresh and try again.');
        } else if (dbError.code === '23505') {
          toast.error('Duplicate transaction reference. Please try again.');
        } else if (dbError.message?.includes('violates foreign key')) {
          toast.error('Invalid reference data. Please check patient selection.');
        } else {
          toast.error(`Database error: ${dbError.message || 'Payment could not be saved'}`);
        }
      } else {
        console.log('✅ Payment saved to database successfully:', data);
        toast.success('Payment saved successfully!');
      }
    } catch (error) {
      console.error('❌ Database connection error:', error);
      toast.error('Database connection failed. Please check your connection.');
    }
    
    // Update local states regardless of database result
    setDepositHistory([...depositHistory, newPayment]);
    setAdvancePayments(advancePayments + amount);
    setReceiptCounter(nextReceiptCounter);
    setNewPaymentAmount('');
    setNewPaymentMode('Cash');
    setReferenceNo('');
    setReceivedBy('');
    
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
    console.log('🖨️ Print function called');
    console.log('💰 Deposit history length:', depositHistory.length);
    console.log('💳 Deposit history data:', depositHistory);
    
    try {
      // Simple approach - just use window.print with CSS media queries
      window.print();
      toast.success('Opening print dialog...');
    } catch (error) {
      console.error('Print error:', error);
      toast.error('Print failed - please try again');
    }
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

  // Handler for Generate IPD Bill button
  const handleGenerateIPDBill = async () => {
    if (!selectedPatient) {
      toast.error('Please select a patient first');
      return;
    }

    const grossTotal = calculateGrossTotal();
    const netPayable = calculateNetPayable();
    const balanceAfterDeposits = calculateBalanceAfterDeposits();

    console.log('💵 Generating IPD Bill:', {
      patient: selectedPatient.first_name + ' ' + (selectedPatient.last_name || ''),
      grossTotal,
      netPayable,
      balanceAfterDeposits
    });

    try {
      // Validate patient selection
      if (!selectedPatient?.id) {
        console.error('❌ No patient selected or invalid patient ID');
        toast.error('Please select a valid patient');
        return;
      }

      // Create a transaction record for the IPD bill
      const billReceiptNo = `IPD-${Date.now().toString().slice(-6)}`;
      const transactionData = {
        patient_id: selectedPatient.id,
        transaction_type: 'SERVICE', // Changed to uppercase to match database constraint
        description: `IPD Bill - ${billReceiptNo} | Room: ₹${calculateRoomCharges()} | Medical: ₹${calculateMedicalCharges()} | Diagnostics: ₹${calculateDiagnosticCharges()} | Treatment: ₹${calculateTreatmentCharges()} | Pharmacy: ₹${calculatePharmacyCharges()} | Other: ₹${calculateOtherCharges()}`,
        amount: netPayable,
        payment_mode: finalPaymentMode.toUpperCase(),
        doctor_id: null,
        doctor_name: null,
        status: balanceAfterDeposits <= 0 ? 'PAID' : 'PENDING',
        transaction_reference: billReceiptNo,
        transaction_date: billingDate
        // Removed hospital_id to avoid foreign key constraint issues
      };

      console.log('💾 Saving IPD bill transaction to Supabase:', transactionData);
      console.log('🔍 Transaction details:', {
        patient_id: transactionData.patient_id,
        transaction_type: transactionData.transaction_type,
        hospital_id: transactionData.hospital_id,
        amount: transactionData.amount,
        billingDate: transactionData.transaction_date,
        payment_mode: transactionData.payment_mode
      });

      const { data: savedTransaction, error } = await supabase
        .from('patient_transactions')
        .insert([transactionData])
        .select()
        .single();

      console.log('📊 Supabase insert result:', { data: savedTransaction, error });

      if (error) {
        console.error('❌ Bill transaction save error:', error);
        console.error('❌ Error details:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });
        
        // More specific error messages based on error code
        if (error.code === '23503') {
          toast.error('Invalid patient or hospital reference. Please refresh and try again.');
        } else if (error.code === '23505') {
          toast.error('Duplicate bill reference. Please try again.');
        } else if (error.message?.includes('violates foreign key')) {
          toast.error('Invalid reference data. Please check patient selection.');
        } else if (error.message?.includes('null value')) {
          toast.error('Missing required information. Please fill all required fields.');
        } else {
          toast.error(`Database error: ${error.message || 'Bill could not be saved'}`);
        }
        
        // Don't proceed if save failed
        return;
      }

      console.log('✅ IPD bill transaction saved:', savedTransaction);
      toast.success(`IPD Bill generated successfully! Bill #${billReceiptNo}`);
      
      // Refresh the IPD bills list
      await loadIPDBills();
      
      // Print the bill
      setTimeout(() => {
        handlePrint();
      }, 500);

      // Reset form or redirect
      setShowCreateBill(false);
      
    } catch (error) {
      console.error('❌ Error generating bill:', error);
      console.error('❌ Full error object:', JSON.stringify(error, null, 2));
      toast.error(`Failed to generate bill: ${error?.message || 'Unknown error'}`);
    }
  };

  // Handler for Add Deposit button
  const [showAddDepositModal, setShowAddDepositModal] = useState(false);
  
  const handleAddDeposit = () => {
    if (!selectedPatient) {
      toast.error('Please select a patient first');
      return;
    }
    setShowAddDepositModal(true);
  };

  const handleSaveDeposit = async () => {
    console.log('💰 MODAL: Save Deposit clicked!');
    console.log('💰 MODAL: Current values:', {
      amount: newPaymentAmount,
      mode: newPaymentMode,
      reference: referenceNo,
      receivedBy: receivedBy,
      patient: selectedPatient?.first_name
    });
    
    try {
      // Use the existing addAdvancePayment function
      await addAdvancePayment();
      
      // Close the modal after successful save
      setShowAddDepositModal(false);
      
    } catch (error) {
      console.error('❌ Error in handleSaveDeposit:', error);
      toast.error('Failed to save deposit. Please try again.');
    }
  };

  // Handler for View Receipt button
  const handleViewReceipt = (receiptId: string) => {
    // TODO: Implement view receipt functionality
    toast('Opening receipt...');
    console.log('View receipt for:', receiptId);
  };

  // Handler for View Bill button
  const handleViewBill = (bill: any) => {
    const transactionType = bill.display_type || (bill.transaction_type === 'SERVICE' ? 'IPD Bill' : 'Deposit');
    const billDetails = `
${transactionType} Details:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Reference: ${bill.transaction_reference || bill.id}
Type: ${transactionType} ${bill.display_icon || (bill.transaction_type === 'SERVICE' ? '🧾' : '💰')}
Patient: ${bill.patients?.first_name || ''} ${bill.patients?.last_name || ''}
Amount: ₹${bill.amount?.toLocaleString() || '0'}
Status: ${bill.status || 'UNKNOWN'}
Date: ${bill.transaction_date ? new Date(bill.transaction_date).toLocaleDateString() : 'N/A'}
Payment Mode: ${bill.payment_mode || 'N/A'}
Doctor: ${bill.doctor_name || 'N/A'}
Description: ${bill.description || 'N/A'}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    `.trim();
    
    alert(billDetails);
    console.log('View transaction:', bill);
  };

  // Handler for Print Bill button
  const handlePrintBill = (bill: any) => {
    const printWindow = window.open('', '_blank');
    const billHTML = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>IPD Bill - ${bill.transaction_reference || bill.id}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 10px; }
            .details { margin: 20px 0; }
            .row { display: flex; justify-content: space-between; margin: 5px 0; }
            .amount { font-size: 18px; font-weight: bold; color: #2563eb; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>IPD Bill</h1>
            <p>Bill Reference: ${bill.transaction_reference || bill.id}</p>
          </div>
          <div class="details">
            <div class="row">
              <span><strong>Patient:</strong></span>
              <span>${bill.patients?.first_name || ''} ${bill.patients?.last_name || ''}</span>
            </div>
            <div class="row">
              <span><strong>Date:</strong></span>
              <span>${bill.transaction_date ? new Date(bill.transaction_date).toLocaleDateString() : 'N/A'}</span>
            </div>
            <div class="row">
              <span><strong>Doctor:</strong></span>
              <span>${bill.doctor_name || 'N/A'}</span>
            </div>
            <div class="row">
              <span><strong>Status:</strong></span>
              <span>${bill.status || 'UNKNOWN'}</span>
            </div>
            <div class="row">
              <span><strong>Description:</strong></span>
              <span>${bill.description || 'N/A'}</span>
            </div>
            <div class="row amount">
              <span><strong>Total Amount:</strong></span>
              <span>₹${bill.amount?.toLocaleString() || '0'}</span>
            </div>
          </div>
        </body>
      </html>
    `;
    
    if (printWindow) {
      printWindow.document.write(billHTML);
      printWindow.document.close();
      printWindow.print();
    } else {
      toast.error('Unable to open print window');
    }
    
    console.log('Print bill:', bill);
  };

  // Handler for Delete Bill button
  const handleDeleteBill = async (bill: any) => {
    const billRef = bill.transaction_reference || bill.id;
    const patientName = `${bill.patients?.first_name || ''} ${bill.patients?.last_name || ''}`.trim() || 'Unknown Patient';
    
    console.log('🗑️ BEFORE DELETE - Bill details:', {
      id: bill.id,
      transaction_reference: bill.transaction_reference,
      patient_name: patientName,
      amount: bill.amount,
      status: bill.status,
      hospital_id: bill.hospital_id
    });
    
    const confirmDelete = window.confirm(
      `Are you sure you want to delete this IPD bill?\n\nBill: ${billRef}\nPatient: ${patientName}\nAmount: ₹${bill.amount?.toLocaleString() || '0'}\nStatus: ${bill.status}\n\nThis action cannot be undone.`
    );
    
    if (!confirmDelete) {
      console.log('🚫 Delete cancelled by user');
      return;
    }
    
    try {
      console.log('🗑️ Attempting to delete bill with ID:', bill.id);
      console.log('🗑️ Delete query conditions:', {
        table: 'patient_transactions',
        where_id: bill.id,
        where_hospital_id: HOSPITAL_ID
      });
      
      // First, let's check if the record exists before deletion
      const { data: existingRecord, error: checkError } = await supabase
        .from('patient_transactions')
        .select('id, status, hospital_id')
        .eq('id', bill.id)
        .single();
        
      console.log('🔍 Record check before deletion:', { data: existingRecord, error: checkError });
      
      if (checkError || !existingRecord) {
        console.error('❌ Record not found before deletion:', checkError);
        toast.error('Bill not found in database');
        await loadIPDBills(); // Refresh to sync with actual database state
        return;
      }
      
      // Try deletion with just ID first (more permissive)
      const { data: deleteResult, error: deleteError } = await supabase
        .from('patient_transactions')
        .delete()
        .eq('id', bill.id)
        .select(); // Return deleted records to confirm
        
      // If deletion failed, try alternative approach (update status to DELETED)
      if (deleteError && deleteError.code) {
        console.log('🔄 Direct deletion failed, trying soft delete (status update)...');
        
        const { data: updateResult, error: updateError } = await supabase
          .from('patient_transactions')
          .update({ 
            status: 'DELETED',
            description: (bill.description || '') + ' [DELETED]'
          })
          .eq('id', bill.id)
          .select();
          
        console.log('🔄 Soft delete result:', { data: updateResult, error: updateError });
        
        if (!updateError && updateResult && updateResult.length > 0) {
          console.log('✅ Bill marked as deleted (soft delete)');
          toast.success(`IPD bill ${billRef} deleted successfully`);
          await loadIPDBills();
          return;
        }
      }
        
      console.log('🗑️ Delete operation result:', { data: deleteResult, error: deleteError });
      
      if (deleteError) {
        console.error('❌ Delete operation failed:', deleteError);
        console.error('❌ Delete error details:', {
          message: deleteError.message,
          details: deleteError.details,
          hint: deleteError.hint,
          code: deleteError.code
        });
        throw deleteError;
      }
      
      if (!deleteResult || deleteResult.length === 0) {
        console.warn('⚠️ Delete operation returned no results - record may not exist');
        toast.error('Bill may have already been deleted');
      } else {
        console.log('✅ Bill deleted successfully:', deleteResult);
        toast.success(`IPD bill ${billRef} deleted successfully`);
      }
      
      // Always refresh the bills list to get current state
      console.log('🔄 Refreshing bills list after delete operation...');
      await loadIPDBills();
      
    } catch (error: any) {
      console.error('❌ Failed to delete bill:', error);
      console.error('❌ Full error object:', JSON.stringify(error, null, 2));
      toast.error(`Failed to delete bill: ${error.message || error}`);
      
      // Still refresh to sync with database state
      await loadIPDBills();
    }
  };

  // Handler for Print Receipt button
  const handlePrintReceipt = (receiptId: string) => {
    // TODO: Implement print receipt functionality
    window.print();
    toast.success('Opening print dialog...');
  };

  // Handler for Export History button
  const handleExportHistory = () => {
    if (depositHistory.length === 0) {
      toast.error('No deposit history to export');
      return;
    }

    // Convert deposit history to CSV
    const headers = ['Receipt No', 'Date', 'Amount', 'Payment Mode', 'Reference', 'Status'];
    const csvContent = [
      headers.join(','),
      ...depositHistory.map(deposit => [
        deposit.receiptNo || `ADV-${Date.now()}`,
        deposit.date || new Date().toLocaleDateString('en-IN'),
        deposit.amount || '0.00',
        deposit.paymentMode || 'CASH',
        deposit.reference || '-',
        deposit.status || 'RECEIVED'
      ].join(','))
    ].join('\n');

    // Create and download the CSV file
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `deposit_history_${selectedPatient?.patient_id || 'unknown'}_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);

    toast.success('Deposit history exported successfully!');
  };

  // Handler for Print Summary button
  const handlePrintSummary = () => {
    if (depositHistory.length === 0) {
      toast.error('No deposit history to print');
      return;
    }

    // Use the browser's print function
    window.print();
    toast.success('Opening print dialog for deposit summary...');
  };

  // If not showing create bill form, show the initial interface
  if (!showCreateBill) {
    return (
      <div className="space-y-6">
        {/* Header with Create Button */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">IPD Billing</h2>
            <p className="text-gray-600">Manage inpatient department bills</p>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={handlePrint}
              className="mt-4 md:mt-0 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center space-x-2 transition-colors"
            >
              <Printer className="h-4 w-4" />
              <span>Test Print</span>
            </button>
            <button
              onClick={() => setShowCreateBill(true)}
              className="mt-4 md:mt-0 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2 transition-colors"
            >
              <Plus className="h-4 w-4" />
              <span>Create IPD Bill</span>
            </button>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="flex flex-col md:flex-row space-y-2 md:space-y-0 md:space-x-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Search by patient, bill ID, or doctor..."
                className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <select className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
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
                    Admission Date
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
                {(() => {
                  console.log('🎯 MAIN VIEW RENDER: billsLoading:', billsLoading, 'ipdBills.length:', ipdBills.length);
                  return null;
                })()}
                
                {billsLoading ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                      <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mr-3"></div>
                        Loading IPD bills...
                      </div>
                    </td>
                  </tr>
                ) : ipdBills && ipdBills.length > 0 ? (
                  ipdBills.map((bill, index) => (
                      <tr key={bill.id || index} className="hover:bg-gray-50 border-t">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <div className="flex items-center">
                            <span className="mr-2">{bill.display_icon || (bill.transaction_type === 'SERVICE' ? '🧾' : '💰')}</span>
                            {bill.transaction_reference || bill.id || `BILL-${index + 1}`}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {bill.patients ? 
                            `${bill.patients.first_name || ''} ${bill.patients.last_name || ''}`.trim() || 'Unknown Patient'
                            : 'Loading...'
                          }
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <div className="flex items-center">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full mr-2 ${
                              bill.transaction_type === 'SERVICE' 
                                ? 'bg-blue-100 text-blue-800' 
                                : 'bg-green-100 text-green-800'
                            }`}>
                              {bill.display_type || (bill.transaction_type === 'SERVICE' ? 'IPD Bill' : 'Deposit')}
                            </span>
                            ₹{bill.amount?.toLocaleString() || '0'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            bill.status === 'PAID' 
                              ? 'bg-green-100 text-green-800' 
                              : bill.status === 'PENDING'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {bill.status || 'UNKNOWN'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {bill.transaction_date ? new Date(bill.transaction_date).toLocaleDateString() : 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button 
                            className="text-blue-600 hover:text-blue-900 mr-3"
                            onClick={() => handleViewBill(bill)}
                          >
                            View
                          </button>
                          <button 
                            className="text-green-600 hover:text-green-900 mr-3"
                            onClick={() => handlePrintBill(bill)}
                          >
                            Print
                          </button>
                          <button 
                            className="text-red-600 hover:text-red-900"
                            onClick={() => handleDeleteBill(bill)}
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))
                ) : (
                  <tr>
                    <td className="px-6 py-4 whitespace-nowrap text-center text-gray-500" colSpan={6}>
                      No IPD bills found. Click "Create IPD Bill" to get started.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  // Show the IPD billing form modal
  return (
    <div className="space-y-6">
      {/* Print CSS */}
      <style>{`
        @media print {
          /* Hide everything except printable content */
          body * {
            visibility: hidden;
          }
          #printable-bill-content, #printable-bill-content * {
            visibility: visible;
            display: block !important;
          }
          #printable-bill-content {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            font-family: Arial, sans-serif;
            font-size: 11px;
            line-height: 1.2;
            color: #000;
            background: white;
          }
          .print-header {
            text-align: center;
            border-bottom: 1px solid #000;
            padding-bottom: 5px;
            margin-bottom: 8px;
          }
          .print-header h1 {
            font-size: 16px;
            margin: 0 0 2px 0;
          }
          .print-header h2 {
            font-size: 14px;
            margin: 0 0 2px 0;
          }
          .print-header p {
            font-size: 10px;
            margin: 1px 0;
          }
          .print-section {
            margin-bottom: 6px;
            padding: 4px 6px;
            border: 1px solid #ccc;
            page-break-inside: avoid;
          }
          .print-section h3 {
            font-size: 12px;
            margin: 0 0 4px 0;
            font-weight: bold;
          }
          .print-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 1px;
            padding: 1px 0;
            font-size: 10px;
          }
          .print-total {
            font-weight: bold;
            font-size: 11px;
            border-top: 1px solid #000;
            padding-top: 3px;
            margin-top: 3px;
          }
          .stay-segment {
            margin-bottom: 4px;
            border-bottom: 1px solid #eee;
            padding-bottom: 2px;
          }
          @page { 
            margin: 0.4in; 
            size: A4;
          }
        }
      `}</style>
      {/* Initial IPD Billing List Interface */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">IPD Billing</h2>
          <p className="text-gray-600">Manage inpatient department bills</p>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white p-4 rounded-lg shadow-sm border">
        <div className="flex flex-col md:flex-row space-y-2 md:space-y-0 md:space-x-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              placeholder="Search by patient, bill ID, or doctor..."
              className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <select className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
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
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Bill ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Patient</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Doctor</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {(() => {
                console.log('🎯 RENDER: billsLoading:', billsLoading, 'ipdBills.length:', ipdBills.length);
                console.log('🎯 RENDER: ipdBills array:', ipdBills);
                return null;
              })()}
              
              {/* Force render bills for debugging */}
              {ipdBills && ipdBills.length > 0 ? (
                <>
                  <tr>
                    <td colSpan={7} className="px-6 py-2 text-center text-green-600 font-medium">
                      ✅ Found {ipdBills.length} IPD bills - Displaying below:
                    </td>
                  </tr>
                  {ipdBills.map((bill, index) => (
                    <tr key={bill.id || index} className="hover:bg-gray-50 border-t">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div className="flex items-center">
                          <span className="mr-2">{bill.display_icon || (bill.transaction_type === 'SERVICE' ? '🧾' : '💰')}</span>
                          {bill.transaction_reference || bill.id || `BILL-${index + 1}`}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div>
                          <div>{bill.patients ? 
                            `${bill.patients.first_name || ''} ${bill.patients.last_name || ''}`.trim() || 'Unknown Patient'
                            : 'Loading...'
                          }</div>
                          <div className="text-xs text-gray-500">
                            <span className={`inline-flex px-1 py-0.5 rounded text-xs ${
                              bill.transaction_type === 'SERVICE' 
                                ? 'bg-blue-100 text-blue-700' 
                                : 'bg-green-100 text-green-700'
                            }`}>
                              {bill.display_type || (bill.transaction_type === 'SERVICE' ? 'IPD Bill' : 'Deposit')}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {bill.doctor_name || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        ₹{bill.amount?.toLocaleString() || '0'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          bill.status === 'PAID' 
                            ? 'bg-green-100 text-green-800' 
                            : bill.status === 'PENDING'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {bill.status || 'UNKNOWN'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {bill.transaction_date ? new Date(bill.transaction_date).toLocaleDateString() : 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button 
                          className="text-blue-600 hover:text-blue-900 mr-3"
                          onClick={() => handleViewBill(bill)}
                        >
                          View
                        </button>
                        <button 
                          className="text-green-600 hover:text-green-900 mr-3"
                          onClick={() => handlePrintBill(bill)}
                        >
                          Print
                        </button>
                        <button 
                          className="text-red-600 hover:text-red-900"
                          onClick={() => handleDeleteBill(bill)}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </>
              ) : billsLoading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mr-3"></div>
                      Loading IPD bills...
                    </div>
                  </td>
                </tr>
              ) : (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                    No IPD bills found. Click "Create IPD Bill" to get started.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* IPD Billing Form Modal */}
      {showCreateBill && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
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

              {/* Simplified IPD Billing Form */}
              <div className="space-y-6">
                {/* Patient Selection */}
                <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg border">
                  <button
                    onClick={() => setShowPatientModal(true)}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md flex items-center space-x-2 transition-colors"
                  >
                    <Search className="h-4 w-4" />
                    <span>{selectedPatient ? 'Change Patient' : 'Select Patient'}</span>
                  </button>
                  
                  {selectedPatient && (
                    <div className="text-sm text-gray-700">
                      <strong>{selectedPatient.name}</strong> - {selectedPatient.phone}
                    </div>
                  )}
                </div>

                {/* Patient Details */}
                {selectedPatient && (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="text-md font-semibold text-gray-800 mb-3">Patient Information</h4>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                      <div><span className="font-medium">Ward:</span> {getPatientDisplayData().wardName}</div>
                      <div><span className="font-medium">Bed:</span> {getPatientDisplayData().bedNo}</div>
                      <div><span className="font-medium">UHIID:</span> {getPatientDisplayData().uhiid}</div>
                      <div><span className="font-medium">IPD No:</span> {getPatientDisplayData().ipdNo}</div>
                      <div><span className="font-medium">Ref. Doctor:</span> {getPatientDisplayData().refDoctor}</div>
                      <div><span className="font-medium">Admitting Doctor:</span> {getPatientDisplayData().admittingDoctor}</div>
                    </div>
                    
                    <div className="mt-4 flex justify-between items-center pt-3 border-t border-gray-200">
                      <div className="text-sm">
                        <span className="font-medium text-green-600">Total Deposits: ₹{advancePayments.toFixed(2)}</span>
                      </div>
                      <div className="text-sm">
                        <span className="font-medium text-red-600">Total Due: ₹{summary.netPayable.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Billing Sections */}
                <div className="border-b border-gray-200">
                  <nav className="-mb-px flex space-x-8">
                    <button 
                      onClick={() => setActiveSection('billing')}
                      className={`py-2 px-1 border-b-2 font-medium text-sm ${
                        activeSection === 'billing'
                          ? 'border-blue-500 text-blue-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      Create Bill
                    </button>
                    <button 
                      onClick={() => setActiveSection('deposit')}
                      className={`py-2 px-1 border-b-2 font-medium text-sm ${
                        activeSection === 'deposit'
                          ? 'border-blue-500 text-blue-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      Payment History
                    </button>
                  </nav>
                </div>

                {/* Original IPD Billing Format with Enhanced UI */}
                {activeSection === 'billing' && (
                  <div className="space-y-6">
                    {/* Billing Header */}
                    <div className="flex items-center justify-between">
                      <h4 className="text-lg font-semibold text-gray-800">IPD Billing Services</h4>
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          <label className="text-sm font-medium text-gray-700">Billing Date:</label>
                          <input 
                            type="date" 
                            value={billingDate}
                            onChange={(e) => setBillingDate(e.target.value)}
                            className="px-3 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                          />
                        </div>
                        <div className="text-sm text-gray-600 bg-blue-50 px-3 py-1 rounded-lg">
                          Total Stay: {selectedPatient ? Math.ceil((new Date().getTime() - new Date(selectedPatient.admissions?.[0]?.admission_date || new Date()).getTime()) / (1000 * 60 * 60 * 24)) : 0} days
                        </div>
                      </div>
                    </div>

                    {/* Admission Charges */}
                    <div className="bg-white p-4 rounded-lg border-l-4 border-l-blue-500 shadow-sm">
                      <h5 className="font-medium text-gray-700 mb-3 flex items-center">
                        <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
                        Admission Charges
                      </h5>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Admission Fee (₹)</label>
                          <input 
                            type="number" 
                            value={admissionFee}
                            onChange={(e) => setAdmissionFee(parseFloat(e.target.value) || 0)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" 
                            placeholder="2000.00" 
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Room Type</label>
                          <select className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                            <option value="GENERAL_WARD">General Ward</option>
                            <option value="ICU">ICU</option>
                            <option value="DELUXE_ROOM">Deluxe Room</option>
                            <option value="PRIVATE_ROOM">Private Room</option>
                            <option value="SEMI_PRIVATE">Semi Private Room</option>
                          </select>
                        </div>
                      </div>
                    </div>

                    {/* Stay Segments */}
                    <div className="bg-white p-4 rounded-lg border-l-4 border-l-green-500 shadow-sm">
                      <div className="flex items-center justify-between mb-4">
                        <h5 className="font-medium text-gray-700 flex items-center">
                          <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                          Room Stay Charges
                          <span className="ml-2 text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                            Total: ₹{calculateTotalStayCharges().toFixed(2)}
                          </span>
                        </h5>
                        <button 
                          onClick={addStaySegment}
                          className="px-3 py-1 bg-green-100 text-green-700 rounded-md hover:bg-green-200 transition-colors text-sm"
                        >
                          + Add Stay Period
                        </button>
                      </div>
                      
                      {/* Dynamic Stay Segments */}
                      {staySegments.map((segment, index) => (
                        <div key={segment.id} className="bg-gray-50 p-4 rounded-lg mb-4 relative">
                          {staySegments.length > 1 && (
                            <button
                              onClick={() => removeStaySegment(segment.id)}
                              className="absolute top-2 right-2 text-red-500 hover:text-red-700 p-1"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          )}
                          
                          <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Room Type</label>
                              <select 
                                value={segment.roomType}
                                onChange={(e) => {
                                  const newRoomType = e.target.value;
                                  // Auto-update rates based on room type
                                  const rates = {
                                    'General Ward': { bed: 1000, nursing: 200, rmo: 100, doctor: 500 },
                                    'ICU': { bed: 3000, nursing: 500, rmo: 300, doctor: 1000 },
                                    'Private Room': { bed: 2000, nursing: 300, rmo: 150, doctor: 750 },
                                    'Deluxe Room': { bed: 2500, nursing: 400, rmo: 200, doctor: 800 },
                                    'Semi Private': { bed: 1500, nursing: 250, rmo: 125, doctor: 600 }
                                  };
                                  const rate = rates[newRoomType as keyof typeof rates] || rates['General Ward'];
                                  
                                  // Update all fields in a single state change
                                  setStaySegments(staySegments.map(seg => 
                                    seg.id === segment.id ? { 
                                      ...seg, 
                                      roomType: newRoomType,
                                      bedChargePerDay: rate.bed,
                                      nursingChargePerDay: rate.nursing,
                                      rmoChargePerDay: rate.rmo,
                                      doctorChargePerDay: rate.doctor
                                    } : seg
                                  ));
                                }}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                              >
                                <option value="General Ward">General Ward</option>
                                <option value="ICU">ICU</option>
                                <option value="Private Room">Private Room</option>
                                <option value="Deluxe Room">Deluxe Room</option>
                                <option value="Semi Private">Semi Private</option>
                              </select>
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                              <input 
                                type="date" 
                                value={segment.startDate}
                                onChange={(e) => updateStaySegment(segment.id, 'startDate', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-green-500" 
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                              <input 
                                type="date" 
                                value={segment.endDate}
                                onChange={(e) => updateStaySegment(segment.id, 'endDate', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-green-500" 
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Bed Charge/Day</label>
                              <input 
                                type="number" 
                                value={segment.bedChargePerDay}
                                onChange={(e) => updateStaySegment(segment.id, 'bedChargePerDay', parseFloat(e.target.value) || 0)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-green-500" 
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Nursing/Day</label>
                              <input 
                                type="number" 
                                value={segment.nursingChargePerDay}
                                onChange={(e) => updateStaySegment(segment.id, 'nursingChargePerDay', parseFloat(e.target.value) || 0)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-green-500" 
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">RMO/Day</label>
                              <input 
                                type="number" 
                                value={segment.rmoChargePerDay}
                                onChange={(e) => updateStaySegment(segment.id, 'rmoChargePerDay', parseFloat(e.target.value) || 0)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-green-500" 
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Doctor/Day</label>
                              <input 
                                type="number" 
                                value={segment.doctorChargePerDay}
                                onChange={(e) => updateStaySegment(segment.id, 'doctorChargePerDay', parseFloat(e.target.value) || 0)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-green-500" 
                              />
                            </div>
                          </div>
                          <div className="mt-3 text-sm text-gray-600 bg-blue-50 px-3 py-2 rounded flex justify-between items-center">
                            <span>
                              Days: {calculateDays(segment.startDate, segment.endDate)} | 
                              Per Day: ₹{(segment.bedChargePerDay + segment.nursingChargePerDay + segment.rmoChargePerDay + segment.doctorChargePerDay).toFixed(2)}
                            </span>
                            <span className="font-semibold text-blue-700">
                              Total: ₹{calculateSegmentTotal(segment).toFixed(2)}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* IPD Services with Dropdown */}
                    <div className="bg-white p-4 rounded-lg border-l-4 border-l-purple-500 shadow-sm">
                      <div className="flex items-center justify-between mb-4">
                        <h5 className="font-medium text-gray-700 flex items-center">
                          <div className="w-2 h-2 bg-purple-500 rounded-full mr-2"></div>
                          IPD Services & Procedures
                          <span className="ml-2 text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                            Total: ₹{calculateSelectedServicesTotal().toFixed(2)}
                          </span>
                        </h5>
                      </div>

                      {/* Service Search Dropdown */}
                      <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Add Service</label>
                        <div className="relative">
                          <input
                            type="text"
                            placeholder="Search and select services (Radiology, Laboratory, Procedures, etc.)..."
                            value={serviceSearchTerm}
                            onChange={(e) => {
                              setServiceSearchTerm(e.target.value);
                              setShowServiceDropdown(true);
                            }}
                            onFocus={() => setShowServiceDropdown(true)}
                            className="w-full px-3 py-2 border border-purple-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 pl-10"
                          />
                          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-purple-400 h-4 w-4" />
                          
                          {/* Services Dropdown */}
                          {showServiceDropdown && (
                            <div className="absolute z-10 w-full mt-1 bg-white border border-purple-300 rounded-md shadow-lg max-h-64 overflow-y-auto">
                              {serviceSearchTerm.length === 0 ? (
                                <div className="p-3 text-sm text-gray-500">
                                  Start typing to search services or browse by category below...
                                </div>
                              ) : filteredAvailableServices.length > 0 ? (
                                filteredAvailableServices.map((service) => (
                                  <div
                                    key={service.id}
                                    onClick={() => addServiceFromDropdown(service)}
                                    className="px-3 py-2 hover:bg-purple-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                                  >
                                    <div className="flex items-center justify-between">
                                      <div className="flex-1">
                                        <div className="text-sm font-medium text-gray-800">{service.name}</div>
                                        <div className="text-xs text-gray-500">{service.category} • {service.department}</div>
                                        {service.description && (
                                          <div className="text-xs text-gray-400 mt-1 truncate">{service.description}</div>
                                        )}
                                      </div>
                                      <div className="text-sm font-semibold text-purple-600">₹{service.basePrice}</div>
                                    </div>
                                  </div>
                                ))
                              ) : (
                                <div className="p-3 text-sm text-gray-500">
                                  No services found matching "{serviceSearchTerm}"
                                </div>
                              )}
                              
                              {/* Quick Categories */}
                              {serviceSearchTerm.length === 0 && (
                                <div className="border-t border-gray-200 bg-gray-50">
                                  <div className="p-2">
                                    <div className="text-xs font-medium text-gray-600 mb-2">Quick Categories:</div>
                                    <div className="flex flex-wrap gap-1">
                                      {['RADIOLOGY', 'LABORATORY', 'CARDIOLOGY', 'PROCEDURES', 'PHYSIOTHERAPY', 'DENTAL'].map((category) => (
                                        <button
                                          key={category}
                                          onClick={() => setServiceSearchTerm(category.toLowerCase())}
                                          className="px-2 py-1 text-xs bg-white border border-gray-300 rounded hover:bg-purple-50 hover:border-purple-300 transition-colors"
                                        >
                                          {category}
                                        </button>
                                      ))}
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                        
                        {/* Click outside to close dropdown */}
                        {showServiceDropdown && (
                          <div 
                            className="fixed inset-0 z-5" 
                            onClick={() => setShowServiceDropdown(false)}
                          />
                        )}
                      </div>

                      {/* Selected Services List */}
                      {selectedServices.length > 0 && (
                        <div className="mb-4">
                          <h6 className="text-sm font-medium text-gray-700 mb-3">Selected Services ({selectedServices.length})</h6>
                          <div className="space-y-2">
                            {selectedServices.map((service) => (
                              <div key={service.id} className="flex items-center justify-between p-3 bg-purple-50 rounded-lg border border-purple-200">
                                <div className="flex-1">
                                  <div className="text-sm font-medium text-gray-800">{service.name}</div>
                                </div>
                                <div className="flex items-center space-x-3">
                                  <div className="flex items-center space-x-2">
                                    <span className="text-xs text-gray-600">₹</span>
                                    <input
                                      type="number"
                                      value={service.amount}
                                      onChange={(e) => updateServiceAmount(service.id, parseFloat(e.target.value) || 0)}
                                      className="w-20 px-2 py-1 text-xs border border-purple-300 rounded focus:outline-none focus:ring-1 focus:ring-purple-500"
                                    />
                                  </div>
                                  <button
                                    onClick={() => removeService(service.id)}
                                    className="text-red-500 hover:text-red-700 p-1"
                                  >
                                    <X className="h-4 w-4" />
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Add Custom Service */}
                      <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-200">
                        <h6 className="text-sm font-medium text-indigo-800 mb-3">Add Custom Service</h6>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                          <input 
                            type="text" 
                            placeholder="Service name..." 
                            value={customServiceName}
                            onChange={(e) => setCustomServiceName(e.target.value)}
                            className="px-3 py-2 border border-indigo-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          />
                          <input 
                            type="number" 
                            placeholder="Amount (₹)" 
                            value={customServiceAmount}
                            onChange={(e) => setCustomServiceAmount(e.target.value)}
                            className="px-3 py-2 border border-indigo-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          />
                          <button 
                            onClick={saveCustomService}
                            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
                          >
                            Save & Add Service
                          </button>
                        </div>
                        <div className="text-xs text-indigo-600 mt-2">
                          💾 Custom services are automatically saved to database for future use
                        </div>
                      </div>
                    </div>

                    {/* Bill Summary */}
                    <div className="bg-gray-50 p-6 rounded-lg border-l-4 border-l-yellow-500 shadow-sm">
                      <h5 className="font-medium text-gray-700 mb-4 flex items-center">
                        <div className="w-2 h-2 bg-yellow-500 rounded-full mr-2"></div>
                        Bill Summary
                      </h5>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                        <div className="bg-white p-4 rounded-lg border">
                          <div className="text-sm text-gray-600">Admission Charges</div>
                          <div className="text-xl font-semibold text-gray-800">₹{admissionFee.toFixed(2)}</div>
                        </div>
                        <div className="bg-white p-4 rounded-lg border">
                          <div className="text-sm text-gray-600">Stay Charges</div>
                          <div className="text-xl font-semibold text-gray-800">₹{calculateTotalStayCharges().toFixed(2)}</div>
                        </div>
                        <div className="bg-white p-4 rounded-lg border">
                          <div className="text-sm text-gray-600">Service Charges</div>
                          <div className="text-xl font-semibold text-gray-800">₹{calculateSelectedServicesTotal().toFixed(2)}</div>
                        </div>
                        <div className="bg-blue-100 p-4 rounded-lg border border-blue-300">
                          <div className="text-sm text-blue-700">Grand Total</div>
                          <div className="text-xl font-bold text-blue-800">₹{(admissionFee + calculateTotalStayCharges() + calculateSelectedServicesTotal()).toFixed(2)}</div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Discount (₹)</label>
                          <input 
                            type="number" 
                            value={discount}
                            onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" 
                            placeholder="0.00" 
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Additional Charges (₹)</label>
                          <input 
                            type="number" 
                            value={tax}
                            onChange={(e) => setTax(parseFloat(e.target.value) || 0)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" 
                            placeholder="0.00" 
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Payment Mode</label>
                          <select 
                            value={finalPaymentMode}
                            onChange={(e) => setFinalPaymentMode(e.target.value as 'CASH' | 'CARD' | 'UPI' | 'BANK_TRANSFER')}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="CASH">Cash</option>
                            <option value="CARD">Card</option>
                            <option value="UPI">UPI</option>
                            <option value="BANK_TRANSFER">Bank Transfer</option>
                          </select>
                        </div>
                      </div>

                      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg border border-blue-200">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="text-lg font-semibold text-blue-800">Net Payable Amount</div>
                            <div className="text-sm text-blue-600">After discount and additional charges</div>
                          </div>
                          <div className="text-3xl font-bold text-blue-800">₹{(admissionFee + calculateTotalStayCharges() + calculateSelectedServicesTotal() - discount + tax).toFixed(2)}</div>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex justify-between items-center pt-6 border-t">
                      <div className="flex space-x-3">
                        <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors flex items-center space-x-2">
                          <span>Save as Draft</span>
                        </button>
                        <button 
                          onClick={handlePrint}
                          className="px-4 py-2 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors flex items-center space-x-2"
                        >
                          <Printer className="h-4 w-4" />
                          <span>Print Bill</span>
                        </button>
                      </div>
                      <div className="flex space-x-3">
                        <button
                          onClick={() => setShowCreateBill(false)}
                          className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                        >
                          Cancel
                        </button>
                        <button 
                          onClick={handleGenerateIPDBill}
                          className="px-6 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-md hover:from-blue-700 hover:to-indigo-700 transition-colors font-semibold">
                          Generate IPD Bill
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Enhanced Deposit History Section */}
                {activeSection === 'deposit' && (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <h4 className="text-lg font-semibold text-gray-800">Advance Deposit Management</h4>
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          <label className="text-sm font-medium text-gray-700">Date:</label>
                          <input 
                            type="date" 
                            value={billingDate}
                            onChange={(e) => setBillingDate(e.target.value)}
                            className="px-3 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500 text-sm"
                          />
                        </div>
                        <button 
                          onClick={handleAddDeposit}
                          className="px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 transition-colors">
                          + Add New Deposit
                        </button>
                      </div>
                    </div>

                    {/* Deposit Summary Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                        <div className="text-sm font-medium text-green-700">Total Deposits</div>
                        <div className="text-xl font-bold text-green-800">₹{advancePayments.toFixed(2)}</div>
                      </div>
                      <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                        <div className="text-sm font-medium text-blue-700">Number of Deposits</div>
                        <div className="text-xl font-bold text-blue-800">{depositHistory.length}</div>
                      </div>
                      <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                        <div className="text-sm font-medium text-purple-700">Latest Deposit</div>
                        <div className="text-xl font-bold text-purple-800">
                          ₹{depositHistory.length > 0 ? depositHistory[depositHistory.length - 1]?.amount || '0.00' : '0.00'}
                        </div>
                      </div>
                      <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                        <div className="text-sm font-medium text-orange-700">Available Balance</div>
                        <div className="text-xl font-bold text-orange-800">₹{Math.max(0, advancePayments - summary.netPayable).toFixed(2)}</div>
                      </div>
                    </div>

                    {/* Deposit History Table */}
                    {depositHistory.length > 0 ? (
                      <div className="bg-white rounded-lg border overflow-hidden">
                        <div className="px-6 py-4 bg-gray-50 border-b">
                          <h5 className="font-medium text-gray-800">Payment History</h5>
                        </div>
                        <div className="overflow-x-auto">
                          <table className="w-full">
                            <thead className="bg-gray-50">
                              <tr>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Receipt No</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date & Time</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Payment Mode</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Reference</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Received By</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                              {depositHistory.map((deposit, index) => (
                                <tr key={index} className="hover:bg-gray-50">
                                  <td className="px-4 py-3 text-sm font-mono">{deposit.receiptNo || `ADV-${Date.now()}-${index + 1}`}</td>
                                  <td className="px-4 py-3 text-sm">{deposit.date || new Date().toLocaleDateString('en-IN')}</td>
                                  <td className="px-4 py-3 text-sm font-semibold text-green-600">₹{deposit.amount || '0.00'}</td>
                                  <td className="px-4 py-3 text-sm">
                                    <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">
                                      {deposit.paymentMode || 'CASH'}
                                    </span>
                                  </td>
                                  <td className="px-4 py-3 text-sm text-gray-600">{deposit.reference || '-'}</td>
                                  <td className="px-4 py-3 text-sm">{deposit.receivedBy || 'System'}</td>
                                  <td className="px-4 py-3 text-sm">
                                    <div className="flex space-x-2">
                                      <button 
                                        onClick={() => handleViewReceipt(deposit.receiptNo || `ADV-${Date.now()}-${index + 1}`)}
                                        className="text-blue-600 hover:text-blue-800 text-xs">View Receipt</button>
                                      <button 
                                        onClick={() => handlePrintReceipt(deposit.receiptNo || `ADV-${Date.now()}-${index + 1}`)}
                                        className="text-green-600 hover:text-green-800 text-xs">Print</button>
                                    </div>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-gray-50 rounded-lg p-8 text-center">
                        <div className="text-gray-500 mb-2">No advance payments recorded yet</div>
                        <div className="text-sm text-gray-400">Use the form above to record the first advance payment</div>
                      </div>
                    )}

                    {/* Deposit Actions */}
                    <div className="flex justify-between items-center">
                      <div className="text-sm text-gray-600">
                        All deposit transactions are recorded with timestamps and receipt numbers
                      </div>
                      <div className="flex space-x-3">
                        <button 
                          onClick={handleExportHistory}
                          className="px-4 py-2 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors">
                          Export History
                        </button>
                        <button 
                          onClick={handlePrintSummary}
                          className="px-4 py-2 bg-green-100 text-green-700 rounded-md hover:bg-green-200 transition-colors">
                          Print Summary
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Patient Modal */}
      {showPatientModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[80vh] overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Select Patient for IPD Billing</h3>
              <button onClick={() => setShowPatientModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </div>
            
            {/* Search Input */}
            <div className="mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <input
                  type="text"
                  placeholder="Search patients by name, phone, or patient ID..."
                  value={patientSearchTerm}
                  onChange={(e) => {
                    setPatientSearchTerm(e.target.value);
                    setShowPatientDropdown(true);
                  }}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Patient List */}
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="text-gray-500 mt-2">Loading patients...</p>
                </div>
              ) : filteredPatients.length > 0 ? (
                filteredPatients.map((patient) => {
                  const latestAdmission = patient.admissions?.[0];
                  const isAdmitted = latestAdmission && !latestAdmission.discharge_date;
                  
                  return (
                    <div 
                      key={patient.patient_id}
                      onClick={() => handlePatientSelect(patient)}
                      className="p-4 border border-gray-200 rounded-lg hover:bg-blue-50 hover:border-blue-300 cursor-pointer transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3">
                            <div className="flex-1">
                              <h4 className="font-medium text-gray-900">
                                {patient.first_name} {patient.last_name || ''}
                              </h4>
                              <p className="text-sm text-gray-600">
                                ID: {patient.patient_id} | Phone: {patient.phone}
                              </p>
                              <p className="text-sm text-gray-500">
                                Age: {patient.age || 'N/A'} | Gender: {patient.gender || 'N/A'}
                              </p>
                            </div>
                            <div className="text-right">
                              {isAdmitted ? (
                                <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">
                                  Currently Admitted
                                </span>
                              ) : (
                                <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-600">
                                  Not Admitted
                                </span>
                              )}
                              {latestAdmission && (
                                <p className="text-xs text-gray-500 mt-1">
                                  {isAdmitted ? 'Admitted:' : 'Last admission:'} {new Date(latestAdmission.admission_date).toLocaleDateString()}
                                </p>
                              )}
                            </div>
                          </div>
                          
                          {/* Show admission details if available */}
                          {latestAdmission && (
                            <div className="mt-2 pt-2 border-t border-gray-100">
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs text-gray-600">
                                {latestAdmission.bed_id && (
                                  <div><span className="font-medium">Bed:</span> {latestAdmission.bed_id}</div>
                                )}
                                {patient.assigned_doctor && (
                                  <div><span className="font-medium">Doctor:</span> {patient.assigned_doctor}</div>
                                )}
                                {latestAdmission.admission_type && (
                                  <div><span className="font-medium">Type:</span> {latestAdmission.admission_type}</div>
                                )}
                                {latestAdmission.chief_complaint && (
                                  <div><span className="font-medium">Complaint:</span> {latestAdmission.chief_complaint}</div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : patientSearchTerm.length > 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">No patients found matching "{patientSearchTerm}"</p>
                  <p className="text-sm text-gray-400 mt-1">Try searching by name, phone number, or patient ID</p>
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500">Start typing to search for patients</p>
                  <p className="text-sm text-gray-400 mt-1">Showing recently admitted patients by default</p>
                  
                  {/* Show recent patients */}
                  <div className="mt-4 space-y-2">
                    {patients.slice(0, 10).map((patient) => {
                      const latestAdmission = patient.admissions?.[0];
                      const isAdmitted = latestAdmission && !latestAdmission.discharge_date;
                      
                      return (
                        <div 
                          key={patient.patient_id}
                          onClick={() => handlePatientSelect(patient)}
                          className="p-3 border border-gray-200 rounded-lg hover:bg-blue-50 hover:border-blue-300 cursor-pointer transition-colors text-left"
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <h4 className="font-medium text-gray-900 text-sm">
                                {patient.first_name} {patient.last_name || ''}
                              </h4>
                              <p className="text-xs text-gray-600">
                                {patient.patient_id} | {patient.phone}
                              </p>
                            </div>
                            {isAdmitted && (
                              <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">
                                Admitted
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="mt-6 pt-4 border-t border-gray-200 flex justify-between items-center">
              <p className="text-sm text-gray-500">
                {patients.length} total patients loaded
              </p>
              <button
                onClick={() => setShowPatientModal(false)}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Printable Bill Content (Hidden from screen, visible in print) */}
      <div 
        id="printable-bill-content" 
        style={{ display: 'none' }}
        className="print-only"
      >
        <div className="print-header">
          <h1>HOSPITAL IPD BILL</h1>
          <h2>Raj Hospital & Maternity Center</h2>
          <p>123 Medical Street, Healthcare City - 123456</p>
          <p>Phone: +91 9876543210 | Email: info@rajhospital.com</p>
        </div>

        <div className="print-section">
          <h3>Patient Information & Charges</h3>
          <div className="print-row">
            <span><strong>{getPatientDisplayData().name}</strong> | UHI: {getPatientDisplayData().uhiid} | IPD: {getPatientDisplayData().ipdNo?.slice(-6) || 'N/A'}</span>
            <span>Dr. {getPatientDisplayData().refDoctor}</span>
          </div>
          <div className="print-row">
            <span>{getPatientDisplayData().wardName} - Bed {getPatientDisplayData().bedNo}</span>
            <span><strong>Admission Fee: ₹{admissionFee.toFixed(2)}</strong></span>
          </div>
        </div>

        <div className="print-section">
          <h3>Room Stay Charges</h3>
          {staySegments.map((segment, index) => (
            <div key={segment.id} className="stay-segment">
              <div className="print-row" style={{ fontWeight: 'bold' }}>
                <span>{segment.roomType} ({segment.startDate} to {segment.endDate}):</span>
                <span>{calculateDays(segment.startDate, segment.endDate)} days - ₹{calculateSegmentTotal(segment).toFixed(2)}</span>
              </div>
            </div>
          ))}
          <div className="print-row print-total">
            <span>Total Stay Charges:</span>
            <span>₹{calculateTotalStayCharges().toFixed(2)}</span>
          </div>
        </div>

        <div className="print-section">
          <h3>Services & Bill Summary</h3>
          {selectedServices.filter(s => s.selected).length > 0 && (
            <div>
              {selectedServices.filter(s => s.selected).map(service => (
                <div key={service.id} className="print-row">
                  <span>{service.name}:</span>
                  <span>₹{service.amount.toFixed(2)}</span>
                </div>
              ))}
              <div className="print-row" style={{ fontWeight: 'bold', borderTop: '1px solid #ccc', paddingTop: '2px', marginBottom: '4px' }}>
                <span>Total Service Charges:</span>
                <span>₹{calculateSelectedServicesTotal().toFixed(2)}</span>
              </div>
            </div>
          )}
          <div className="print-row" style={{ fontWeight: 'bold' }}>
            <span>Gross Total (Admission + Stay + Services):</span>
            <span>₹{(admissionFee + calculateTotalStayCharges() + calculateSelectedServicesTotal()).toFixed(2)}</span>
          </div>
          <div className="print-row">
            <span>Less: Discount</span>
            <span>- ₹{discount.toFixed(2)}</span>
          </div>
          <div className="print-row">
            <span>Add: Tax</span>
            <span>+ ₹{tax.toFixed(2)}</span>
          </div>
          {depositHistory.length > 0 && (
            <div style={{ borderTop: '1px solid #ccc', paddingTop: '4px', marginTop: '4px', marginBottom: '4px' }}>
              <div className="print-row" style={{ fontWeight: 'bold', fontSize: '11px', marginBottom: '2px' }}>
                <span>Payment History Details:</span>
                <span></span>
              </div>
              {depositHistory.map((payment, index) => (
                <div key={payment.id || index} className="print-row" style={{ fontSize: '9px', paddingLeft: '8px', marginBottom: '1px' }}>
                  <span>{payment.paymentMode || 'Cash'} - {payment.date || new Date().toLocaleDateString()} - Receipt: {payment.receiptNo || `REC-${index + 1}`}</span>
                  <span>₹{(payment.amount || 0).toFixed(2)}</span>
                </div>
              ))}
              <div className="print-row" style={{ fontWeight: 'bold', borderTop: '1px solid #ddd', paddingTop: '2px', fontSize: '10px' }}>
                <span>Total Payments ({depositHistory.length} transactions):</span>
                <span>₹{advancePayments.toFixed(2)}</span>
              </div>
            </div>
          )}
          {depositHistory.length === 0 && (
            <div className="print-row" style={{ fontSize: '9px', fontStyle: 'italic', color: '#666' }}>
              <span>No advance payments made</span>
              <span></span>
            </div>
          )}
          <div className="print-row">
            <span>Less: Total Advance Paid ({depositHistory.length} payments)</span>
            <span>- ₹{advancePayments.toFixed(2)}</span>
          </div>
          <div className="print-total print-row" style={{ borderTop: '2px solid #000', fontSize: '12px' }}>
            <span><strong>FINAL AMOUNT DUE:</strong></span>
            <span><strong>₹{Math.max(0, (admissionFee + calculateTotalStayCharges() + calculateSelectedServicesTotal() - discount + tax - advancePayments)).toFixed(2)}</strong></span>
          </div>
        </div>

        <div className="print-section">
          <div className="print-row">
            <span><strong>Payment Mode:</strong> {getDisplayPayerName()}</span>
            <span><strong>Generated:</strong> {new Date().toLocaleDateString()}</span>
          </div>
        </div>

        <div style={{ marginTop: '8px', textAlign: 'center', fontSize: '9px', color: '#666' }}>
          <p>Thank you for choosing Raj Hospital & Maternity Center | For queries: Billing Dept</p>
        </div>
      </div>

      {/* Add Deposit Modal */}
      {showAddDepositModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center z-50">
          <div className="bg-white p-8 rounded-lg shadow-xl max-w-md w-full">
            <h3 className="text-xl font-bold text-gray-800 mb-4">Add New Deposit</h3>
            
            {selectedPatient && (
              <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                <p className="text-sm text-gray-700">
                  <strong>Patient:</strong> {selectedPatient.first_name} {selectedPatient.last_name || ''}
                </p>
                <p className="text-sm text-gray-600">
                  <strong>ID:</strong> {selectedPatient.patient_id}
                </p>
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Deposit Amount (₹)
                </label>
                <input
                  type="number"
                  value={newPaymentAmount}
                  onChange={(e) => setNewPaymentAmount(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter amount"
                  min="0"
                  step="0.01"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Payment Mode
                </label>
                <select
                  value={newPaymentMode}
                  onChange={(e) => setNewPaymentMode(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Cash">Cash</option>
                  <option value="Card">Card</option>
                  <option value="UPI">UPI</option>
                  <option value="Bank Transfer">Bank Transfer</option>
                  <option value="Cheque">Cheque</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Reference No. (Optional)
                </label>
                <input
                  type="text"
                  value={referenceNo}
                  onChange={(e) => setReferenceNo(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Transaction ID or reference"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Received By (Optional)
                </label>
                <input
                  type="text"
                  value={receivedBy}
                  onChange={(e) => setReceivedBy(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Staff member name"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  onClick={() => {
                    setShowAddDepositModal(false);
                    setNewPaymentAmount('');
                    setNewPaymentMode('Cash');
                    setReferenceNo('');
                    setReceivedBy('');
                  }}
                  className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveDeposit}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  Save Deposit
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Other modals can be added here as needed */}
    </div>
  );
};

export default NewIPDBillingModule;

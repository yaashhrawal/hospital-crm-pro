import React, { useState, useEffect, useRef } from 'react';
import { Printer, Search, X, Plus } from 'lucide-react';
import toast from 'react-hot-toast';
import HospitalService from '../../services/hospitalService';
import { supabase, HOSPITAL_ID } from '../../config/supabaseNew';
import type { PatientWithRelations } from '../../config/supabaseNew';
import { MEDICAL_SERVICES, searchServices, type MedicalService } from '../../data/medicalServices';
import { logger } from '../../utils/logger';

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

// Helper function to get correct local date without timezone issues
const getLocalDateString = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const dateString = `${year}-${month}-${day}`;


  return dateString;
};

// Helper function to ensure date is in YYYY-MM-DD format for HTML date inputs
const ensureDateFormat = (dateInput: string): string => {
  if (!dateInput) return getLocalDateString();

  // If already in YYYY-MM-DD format, return as is
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateInput)) {
    return dateInput;
  }

  // Try to parse various date formats
  try {
    const date = new Date(dateInput);
    if (isNaN(date.getTime())) {
      logger.warn('⚠️ Invalid date, using today:', dateInput);
      return getLocalDateString();
    }

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const formatted = `${year}-${month}-${day}`;

    return formatted;
  } catch (error) {
    logger.error('❌ Date parsing error:', error, 'Input:', dateInput);
    return getLocalDateString();
  }
};

const NewIPDBillingModule: React.FC = () => {

  // Main state for showing/hiding the IPD bill creation form
  const [showCreateBill, setShowCreateBill] = useState(false);
  const [editingBill, setEditingBill] = useState<any>(null);
  const [activeSection, setActiveSection] = useState<'bill' | 'deposit'>('bill');

  const [patients, setPatients] = useState<PatientWithRelations[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<PatientWithRelations | null>(null);
  const [loading, setLoading] = useState(true);
  const [billingDate, setBillingDate] = useState(getLocalDateString());

  const [wardCategory, setWardCategory] = useState('Emergency');

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
  const [newPaymentDate, setNewPaymentDate] = useState('');
  const [depositHistory, setDepositHistory] = useState([]);
  const [referenceNo, setReferenceNo] = useState('');
  const [receivedBy, setReceivedBy] = useState('');

  // Local mapping to ensure correct dates are shown
  const [depositDateOverrides, setDepositDateOverrides] = useState({});

  // Deposit editing states
  const [editingDeposit, setEditingDeposit] = useState(null);
  const [showEditDepositModal, setShowEditDepositModal] = useState(false);
  const [editDepositAmount, setEditDepositAmount] = useState('');
  const [editDepositDate, setEditDepositDate] = useState('');
  const [editDepositPaymentMode, setEditDepositPaymentMode] = useState('CASH');
  const [editDepositReference, setEditDepositReference] = useState('');
  const [editDepositReceivedBy, setEditDepositReceivedBy] = useState('');

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
  const [selectedServices, setSelectedServices] = useState<Array<{id: string, name: string, amount: number, quantity: number, selected: boolean}>>([]);
  
  // IPD Bills List State
  const [ipdBills, setIpdBills] = useState<any[]>([]);
  const [billsLoading, setBillsLoading] = useState(false);
  
  // Patient IPD History State
  const [patientHistory, setPatientHistory] = useState<any[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  
  // Debug: Track state changes
  useEffect(() => {
  }, [ipdBills]);
  const [serviceSearchTerm, setServiceSearchTerm] = useState('');
  const [showServiceDropdown, setShowServiceDropdown] = useState(false);
  const [customServiceName, setCustomServiceName] = useState('');
  const [customServiceAmount, setCustomServiceAmount] = useState('');
  const [availableServices, setAvailableServices] = useState<MedicalService[]>(MEDICAL_SERVICES);

  // Stay Segment Management
  const [_staySegments, _setStaySegments] = useState([{
    id: Date.now(),
    roomType: 'General Ward',
    startDate: billingDate,
    endDate: (() => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const year = tomorrow.getFullYear();
      const month = String(tomorrow.getMonth() + 1).padStart(2, '0');
      const day = String(tomorrow.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    })(), // Default to tomorrow
    bedChargePerDay: 1000,
    nursingChargePerDay: 200,
    rmoChargePerDay: 100,
    doctorChargePerDay: 500
  }]);

  // CRITICAL DEBUG: Wrapper to track all setStaySegments calls with aggressive monitoring
  const setStaySegments = (value: any) => {
    const stack = new Error().stack;
    logger.log('🚨🚨🚨 setStaySegments CALLED FROM:', stack?.split('\n')[2]?.trim());
    logger.log('🚨 Setting stay segments to:', value);

    // Log the current vs new values
    if (Array.isArray(value)) {
      value.forEach((segment, index) => {
        logger.log(`   New Segment ${index}: ${segment.roomType} - Bed: ₹${segment.bedChargePerDay}/day`);
      });
    }

    _setStaySegments(value);

    // AGGRESSIVE STATE MONITORING: Check what happens after state update
    setTimeout(() => {
      logger.log('🔍 POST-UPDATE CHECK (immediate):', _staySegments.map((s, i) => `Segment ${i}: ${s.roomType} - ₹${s.bedChargePerDay}`));
    }, 0);

    setTimeout(() => {
      logger.log('🔍 POST-UPDATE CHECK (10ms delay):', _staySegments.map((s, i) => `Segment ${i}: ${s.roomType} - ₹${s.bedChargePerDay}`));
    }, 10);

    setTimeout(() => {
      logger.log('🔍 POST-UPDATE CHECK (100ms delay):', _staySegments.map((s, i) => `Segment ${i}: ${s.roomType} - ₹${s.bedChargePerDay}`));
    }, 100);
  };

  const staySegments = _staySegments;

  // Add a ref to track if we're in editing mode to prevent interference
  const isEditingRef = useRef(false);

  // AGGRESSIVE PROTECTION: Backup system for reconstructed state
  const correctStateBackupRef = useRef(null);
  const stateProtectionActiveRef = useRef(false);

  // AGGRESSIVE STATE MONITORING: Monitor all stay segment changes
  useEffect(() => {
    logger.log('🔍🔍🔍 STATE MONITOR: staySegments changed to:', staySegments.map((s, i) => `Segment ${i}: ${s.roomType} - ₹${s.bedChargePerDay}`));
    logger.log('🔍 STATE MONITOR: editingBill:', editingBill);
    logger.log('🔍 STATE MONITOR: isEditingRef.current:', isEditingRef.current);

    // Log the stack trace to see what caused this change
    const stack = new Error().stack;
    logger.log('🔍 STATE CHANGE CALLED FROM:', stack?.split('\n')[2]?.trim());

    // If we're in editing mode and see a reset to default values, log an alert and restore
    if (editingBill && staySegments.length > 0 && stateProtectionActiveRef.current) {
      const firstSegment = staySegments[0];
      if (firstSegment.roomType === 'General Ward' && firstSegment.bedChargePerDay === 1000) {
        logger.error('🚨🚨🚨 ALERT: STATE WAS RESET TO DEFAULT VALUES DURING EDITING!');
        logger.error('🚨 This means something is overriding our reconstructed state');
        logger.error('🚨 Current state:', firstSegment);

        // RESTORE from backup if available
        if (correctStateBackupRef.current) {
          logger.log('🔄 ATTEMPTING AUTOMATIC STATE RESTORATION...');
          logger.log('🔄 Restoring from backup:', correctStateBackupRef.current);

          // Use functional update to bypass any interference
          _setStaySegments(prev => {
            logger.log('🔄 FUNCTIONAL RESTORE: Previous:', prev.map((s, i) => `${s.roomType} - ₹${s.bedChargePerDay}`));
            logger.log('🔄 FUNCTIONAL RESTORE: Restoring to:', correctStateBackupRef.current.map((s, i) => `${s.roomType} - ₹${s.bedChargePerDay}`));
            return [...correctStateBackupRef.current];
          });
        }
      }
    }
  }, [staySegments, editingBill]);

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

  // CRITICAL: Auto-sync deposit date whenever billing date changes
  useEffect(() => {
    setNewPaymentDate(billingDate);

    // Also reload deposits to sync with new billing date
    // CRITICAL FIX: Don't reload deposits during bill editing to avoid state conflicts
    if (selectedPatient && !editingBill && !isEditingRef.current) {
      loadPatientDeposits();
    } else if (selectedPatient && (editingBill || isEditingRef.current)) {
      logger.log('💰 Skipping deposit reload during bill editing (ref check)');
    }
  }, [billingDate, selectedPatient, editingBill]);

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
    // Use the UI calculation system instead of the old pharmacy-based system
    const correctNetPayable = Math.max(0, (admissionFee + calculateTotalStayCharges() + calculateSelectedServicesTotal()) - discount + tax);
    return correctNetPayable - advancePayments;
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

  // Reset form function for new bills
  const resetForm = () => {
    // CRITICAL FIX: Check editing state BEFORE clearing editingBill to preserve stay segments
    const isCurrentlyEditing = editingBill !== null || isEditingRef.current;

    setSelectedPatient(null);
    setPatientSearchTerm('');
    setEditingBill(null);
    setBillingDate(getLocalDateString());
    setWardCategory('Emergency');
    setPaymentMode('CASH');
    setSelectedPayer('');
    setAdvancePayments(0.00);
    setNewPaymentAmount('');
    setNewPaymentMode('Cash');
    setDepositHistory([]);
    setReferenceNo('');
    setReceivedBy('');

    // Reset room & accommodation
    setRoomType('General Ward');
    setRoomRate(500);
    setStayDays(1);

    // Reset medical professional charges
    setConsultantFees(1000);
    setVisitingDoctorFees(500);
    setNursingCharges(200);
    setAttendantCharges(100);

    // Reset investigation & diagnostic
    setLabTests(800);
    setRadiologyCharges(1200);
    setEcgCharges(300);
    setOtherDiagnostics(0);

    // Reset treatment & operation
    setOperationTheaterCharges(0);
    setSurgeonFees(0);
    setAnesthesiaCharges(0);
    setEquipmentCharges(0);

    // Reset medicine & pharmacy
    setPharmacyBills(0);
    setIvFluids(0);
    setBloodProducts(0);
    setMedicalSupplies(0);

    // Reset other services
    setPhysiotherapy(0);
    setAmbulanceServices(0);
    setMedicalCertificate(0);
    setMiscCharges(0);

    // Reset admission and bill summary
    setAdmissionFee(2000);
    setDiscount(0);
    setTax(0);
    setFinalPaymentMode('CASH');

    // Reset custom fields
    setCustomFields([{ description: '', amount: 0, type: 'One-time', id: Date.now() }]);

    // IMPORTANT: Reset selected services to prevent cross-patient contamination
    setSelectedServices([]);

    // CRITICAL FIX: Only reset stay segments if NOT editing a bill
    // This prevents overriding the correctly reconstructed ICU data during editing
    if (!isCurrentlyEditing) {
      logger.log('🔄 resetForm: Resetting stay segments to defaults (new bill)');
      setStaySegments([{
        id: Date.now(),
        roomType: 'General Ward',
        startDate: billingDate,
        endDate: (() => {
          const tomorrow = new Date();
          tomorrow.setDate(tomorrow.getDate() + 1);
          const year = tomorrow.getFullYear();
          const month = String(tomorrow.getMonth() + 1).padStart(2, '0');
          const day = String(tomorrow.getDate()).padStart(2, '0');
          return `${year}-${month}-${day}`;
        })(),
        bedChargePerDay: 1000,
        nursingChargePerDay: 200,
        rmoChargePerDay: 100,
        doctorChargePerDay: 500
      }]);
    } else {
      logger.log('🛡️ resetForm: Preserving stay segments during bill editing');
    }

    // Reset service search
    setServiceSearchTerm('');
    setShowServiceDropdown(false);
    setCustomServiceName('');
    setCustomServiceAmount('');

  };

  // Stay segment calculation functions
  const calculateDays = (startDate: string, endDate: string): number => {
    if (!startDate || !endDate) return 1; // Default to 1 day if dates are missing

    const start = new Date(startDate);
    const end = new Date(endDate);

    // Check for invalid dates
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      logger.warn('⚠️ Invalid dates provided to calculateDays:', { startDate, endDate });
      return 1; // Default to 1 day for invalid dates
    }

    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(1, diffDays); // Minimum 1 day
  };

  const calculateSegmentTotal = (segment: any): number => {
    const days = calculateDays(segment.startDate, segment.endDate);
    const bedCharge = parseFloat(segment.bedChargePerDay) || 0;
    const nursingCharge = parseFloat(segment.nursingChargePerDay) || 0;
    const rmoCharge = parseFloat(segment.rmoChargePerDay) || 0;
    const doctorCharge = parseFloat(segment.doctorChargePerDay) || 0;

    const total = (bedCharge + nursingCharge + rmoCharge + doctorCharge) * days;

    // Debug logging for NaN issues
    if (isNaN(total)) {
      logger.error('❌ NaN detected in calculateSegmentTotal:', {
        segment,
        days,
        bedCharge,
        nursingCharge,
        rmoCharge,
        doctorCharge,
        total
      });
      return 0;
    }

    return total;
  };

  const calculateTotalStayCharges = (): number => {
    return staySegments.reduce((total, segment) => {
      const segmentTotal = calculateSegmentTotal(segment);
      return total + (isNaN(segmentTotal) ? 0 : segmentTotal);
    }, 0);
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
      startDate: billingDate,
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
        quantity: 1, // Default quantity
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

  const updateServiceQuantity = (serviceId: string, quantity: number) => {
    setSelectedServices(selectedServices.map(s =>
      s.id === serviceId ? { ...s, quantity: Math.max(1, quantity) } : s // Minimum quantity of 1
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
        quantity: 1, // Default quantity
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
          logger.error('Error saving custom service:', error);
          toast.error('Service added to current bill but not saved permanently');
        } else {
          toast.success('Custom service saved and added to bill!');
        }
      } catch (dbError) {
        logger.error('Database save error:', dbError);
        toast.error('Service added to current bill only');
      }

      // Reset form
      setCustomServiceName('');
      setCustomServiceAmount('');
      
    } catch (error) {
      logger.error('Error creating custom service:', error);
      toast.error('Failed to add custom service');
    }
  };

  const calculateSelectedServicesTotal = () => {
    return selectedServices
      .filter(service => service.selected)
      .reduce((total, service) => {
        const amount = parseFloat(service.amount) || 0;
        const quantity = parseInt(service.quantity) || 1;
        return total + (isNaN(amount) ? 0 : amount * quantity);
      }, 0);
  };

  const filteredAvailableServices = availableServices.filter(service =>
    service.name.toLowerCase().includes(serviceSearchTerm.toLowerCase()) ||
    service.code.toLowerCase().includes(serviceSearchTerm.toLowerCase()) ||
    service.category.toLowerCase().includes(serviceSearchTerm.toLowerCase())
  ).slice(0, 10);

  // Deposit management functions
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
      date: billingDate,
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
      date: billingDate,
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
      date: billingDate,
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
      date: billingDate,
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
      date: billingDate,
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
      date: billingDate,
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
    loadIPDBills();
    
  }, []);

  // Calculate totals whenever charges, stay segments, services, or advance payments change
  useEffect(() => {
    calculateSummary();
  }, [admissionFee, staySegments, selectedServices, discount, tax, advancePayments]);
  
  // Load patient history and deposits when patient is selected
  useEffect(() => {
    // CRITICAL FIX: Don't load patient data during bill editing to avoid state conflicts
    if (selectedPatient && !editingBill && !isEditingRef.current) {
      loadPatientIPDHistory();
      loadPatientDeposits(); // CRITICAL FIX: Load deposits from database with correct dates
    } else if (selectedPatient && (editingBill || isEditingRef.current)) {
      logger.log('📋 Skipping patient data reload during bill editing (ref check)');
    } else {
      setPatientHistory([]);
      setDepositHistory([]); // Clear deposit history when no patient selected
      setDepositDateOverrides({}); // Clear date overrides when changing patients
      setAdvancePayments(0);
    }
  }, [selectedPatient, editingBill]);

  // CRITICAL FIX: Update all billing row dates when billing date changes
  useEffect(() => {
    if (billingRows.length > 0) {
      logger.log('📅 Updating billing row dates to:', billingDate);
      setBillingRows(rows =>
        rows.map(row => ({
          ...row,
          date: billingDate
        }))
      );
    }
  }, [billingDate]);

  // CRITICAL DEBUG: Monitor staySegments changes
  useEffect(() => {
    logger.log('🔄 STAY SEGMENTS STATE CHANGED:', staySegments);
    staySegments.forEach((segment, index) => {
      logger.log(`   Segment ${index}: ${segment.roomType} - Bed: ₹${segment.bedChargePerDay}/day`);
    });
  }, [staySegments]);

  // CRITICAL FIX: Update stay segment start dates when billing date changes
  useEffect(() => {
    // CRITICAL FIX: Don't override stay segments when editing a bill
    if (staySegments.length > 0 && !editingBill && !isEditingRef.current) {
      logger.log('📅 Updating stay segment start dates to:', billingDate);
      setStaySegments(segments =>
        segments.map(segment => ({
          ...segment,
          startDate: billingDate
        }))
      );
    } else if (editingBill || isEditingRef.current) {
      logger.log('📅 Skipping start date update during bill editing (ref check)');
    }
  }, [billingDate, editingBill]);

  const loadPatients = async () => {
    try {
      setLoading(true);
      logger.log('🔍 IPD BILLING: Loading patients with admission data for billing...');
      logger.log('🔍 IPD BILLING: Hospital ID:', HOSPITAL_ID);
      
      // Get all patients with admissions data using direct supabase query
      // SOLUTION: Use pagination approach to bypass PostgREST's 1000 record limit
      let allPatients: any[] = [];
      let fromIndex = 0;
      const pageSize = 1000;
      let hasMoreData = true;

      while (hasMoreData) {
        logger.log(`🔍 Loading patients batch: ${fromIndex} to ${fromIndex + pageSize - 1}`);

        const { data: batch, error } = await supabase
          .from('patients')
          .select(`
            *,
            transactions:patient_transactions(*),
            admissions:patient_admissions(*)
          `)
          // .eq('hospital_id', HOSPITAL_ID) // Removed as hospital may not exist
          .eq('is_active', true)
          .order('created_at', { ascending: false })
          .range(fromIndex, fromIndex + pageSize - 1);

        if (error) {
          logger.error('❌ IPD BILLING: Error loading patients batch:', error);
          break;
        }

        if (!batch || batch.length === 0) {
          hasMoreData = false;
          break;
        }

        allPatients = [...allPatients, ...batch];

        // If we got less than pageSize records, we've reached the end
        if (batch.length < pageSize) {
          hasMoreData = false;
        } else {
          fromIndex += pageSize;
        }
      }

      logger.log('✅ IPD BILLING: Loaded patients with admissions:', allPatients?.length || 0);
      if (allPatients && allPatients.length > 0) {
        logger.log('✅ IPD BILLING: Sample patient data:', allPatients[0]);
      }
      setPatients(allPatients || []);
    } catch (error) {
      logger.error('❌ IPD BILLING: Failed to load patients:', error);
      toast.error('Failed to load patient data: ' + (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  // Load patient deposits from database to ensure correct dates
  const loadPatientDeposits = async () => {
    if (!selectedPatient) return;

    try {


      const result = await supabase
        .from('patient_transactions')
        .select('id, transaction_date, created_at, description, amount, payment_mode, transaction_reference, status')
        .eq('patient_id', selectedPatient.id)
        .in('transaction_type', ['ADMISSION_FEE', 'DEPOSIT', 'ADVANCE_PAYMENT'])
        .eq('status', 'COMPLETED')
        .order('created_at', { ascending: false });

      const deposits = result.data;
      const error = result.error;

      logger.log('🔍 RAW DATABASE RESPONSE:', {
        depositCount: deposits?.length || 0,
        deposits: deposits?.map(d => ({
          id: d.id,
          transaction_date: d.transaction_date,
          created_at: d.created_at,
          amount: d.amount,
          has_transaction_date: !!d.transaction_date
        }))
      });

      if (error) {
        logger.error('❌ Error loading deposits:', error);
        return;
      }

      if (deposits && deposits.length > 0) {

        // CRITICAL FIX: Update any deposits that don't have transaction_date set
        const depositsNeedingUpdate = deposits.filter(d => !d.transaction_date);
        if (depositsNeedingUpdate.length > 0) {
          logger.log(`🔧 FIXING ${depositsNeedingUpdate.length} deposits missing transaction_date`);

          for (const deposit of depositsNeedingUpdate) {
            const fallbackDate = deposit.created_at.split('T')[0];
            logger.log(`🔧 Updating deposit ${deposit.id}: setting transaction_date to ${fallbackDate}`);

            await supabase
              .from('patient_transactions')
              .update({ transaction_date: fallbackDate })
              .eq('id', deposit.id);

            // Update local data
            deposit.transaction_date = fallbackDate;
          }

          logger.log('✅ Finished updating deposits with missing transaction_date');
        }

        // AUTO-UPDATE: Sync existing deposits with current billing date if different
        if (billingDate && billingDate !== getLocalDateString().split('T')[0]) {
          logger.log('🔄 AUTO-SYNC: Updating existing deposits to match billing date:', billingDate);

          for (const deposit of deposits) {
            if (deposit.transaction_date && deposit.transaction_date !== billingDate) {
              logger.log(`🔄 Syncing deposit ${deposit.id}: ${deposit.transaction_date} → ${billingDate}`);

              await supabase
                .from('patient_transactions')
                .update({ transaction_date: billingDate })
                .eq('id', deposit.id);

              // Update local data
              deposit.transaction_date = billingDate;
            }
          }

          logger.log('✅ Finished syncing deposits with billing date');
        }

        // Transform database deposits to match local state format
        const formattedDeposits = deposits.map(deposit => {
          // CRITICAL FIX: Prioritize user-entered dates properly
          let displayDate;

          // 1. First priority: Manual overrides from current session
          if (depositDateOverrides[deposit.id]) {
            displayDate = depositDateOverrides[deposit.id];
            logger.log(`💰 Using override date for ${deposit.id}: ${displayDate}`);
          }
          // 2. Second priority: Database transaction_date (user-entered date)
          else if (deposit.transaction_date) {
            // Ensure it's in YYYY-MM-DD format
            displayDate = deposit.transaction_date.split('T')[0];
            logger.log(`💰 ✅ SUCCESS: Using transaction_date for ${deposit.id}: ${displayDate} (from DB: ${deposit.transaction_date})`);
          }
          // 3. Third priority: Extract date from created_at (admission date) - ONLY as fallback
          else if (deposit.created_at) {
            displayDate = deposit.created_at.split('T')[0];
            logger.log(`💰 FALLBACK: Using created_at for ${deposit.id}: ${displayDate} (original: ${deposit.created_at})`);
          }
          // 4. Final fallback: Today's date
          else {
            displayDate = new Date().toISOString().split('T')[0];
            logger.log(`💰 FINAL FALLBACK: Using today for ${deposit.id}: ${displayDate}`);
          }

          const formattedDeposit = {
            id: deposit.id,
            receiptNo: deposit.transaction_reference || `REC-${deposit.id}`,
            date: displayDate,
            amount: deposit.amount,
            paymentMode: deposit.payment_mode,
            reference: deposit.transaction_reference || '-',
            receivedBy: 'IPD Billing Department',
            transactionType: 'Advance Payment',
            processBy: 'Reception Desk',
            timestamp: new Date(deposit.created_at).getTime()
          };

          logger.log('💰 🚨 ULTRA DEBUG - Raw deposit from DB:', {
            id: deposit.id,
            'DB transaction_date': deposit.transaction_date,
            'DB created_at': deposit.created_at,
            'Override exists': !!depositDateOverrides[deposit.id],
            'Override value': depositDateOverrides[deposit.id],
            'Calculated displayDate': displayDate,
            'Final formattedDeposit.date': formattedDeposit.date,
            'Date calculation used':
              depositDateOverrides[deposit.id] ? 'OVERRIDE' :
              deposit.transaction_date ? 'TRANSACTION_DATE' :
              deposit.created_at ? 'CREATED_AT' : 'TODAY'
          });

          return formattedDeposit;
        });

        // Update local state with database deposits
        setDepositHistory(formattedDeposits);

        // Calculate total advances from database
        const totalAdvances = deposits.reduce((sum, deposit) => sum + (deposit.amount || 0), 0);
        setAdvancePayments(totalAdvances);

        logger.log('💰 Deposits loaded successfully:', {
          count: formattedDeposits.length,
          total: totalAdvances
        });
      } else {
        logger.log('💰 No deposits found for patient');
        setDepositHistory([]);
        setAdvancePayments(0);
      }

    } catch (error) {
      logger.error('❌ Error loading patient deposits:', error);
      setDepositHistory([]);
      setAdvancePayments(0);
    }
  };

  // Load patient IPD history since admission
  const loadPatientIPDHistory = async () => {
    if (!selectedPatient) return;
    
    try {
      setHistoryLoading(true);
      logger.log('📋 Loading patient IPD history for:', selectedPatient.patient_id);
      
      // Get patient's admission date to filter transactions
      const admissionDate = selectedPatient.admissions?.[0]?.admission_date;
      logger.log('📅 Patient admission date:', admissionDate);
      
      if (!admissionDate) {
        logger.log('⚠️ No admission date found, loading all transactions');
      }
      
      // Load all transactions for this patient since admission
      const { data: transactions, error } = await supabase
        .from('patient_transactions')
        .select(`
          *,
          patient:patients(
            first_name,
            last_name,
            patient_id
          )
        `)
        .eq('patient_id', selectedPatient.id)
        .neq('status', 'DELETED')
        .gte('created_at', admissionDate || '1970-01-01') // Filter from admission date (using created_at as fallback)
        .order('created_at', { ascending: false })
        .limit(100);
        
      if (error) {
        logger.error('❌ Error loading patient history:', error);
        setPatientHistory([]);
        return;
      }
      
      logger.log(`✅ Loaded ${transactions?.length || 0} transactions since admission`);
      setPatientHistory(transactions || []);
      
    } catch (error: any) {
      logger.error('❌ Error loading patient IPD history:', error);
      setPatientHistory([]);
    } finally {
      setHistoryLoading(false);
    }
  };

  const loadIPDBills = async () => {
    try {
      setBillsLoading(true);
      logger.log('🚨🚨🚨 LOAD IPD BILLS FUNCTION CALLED 🚨🚨🚨');
      logger.log('💵 Loading IPD bills and deposits from transactions...');
      
      // Test database connection first
      const { data: connectionTest, error: connectionError, count } = await supabase
        .from('patient_transactions')
        .select('*', { count: 'exact', head: true });
        
      logger.log('🔗 Database connection test:', { count: count, error: connectionError });
      
      // Load all IPD-related transactions (bills, deposits, and services)
      logger.log('🔍 Loading IPD transactions (all deposit and service types)...');

      const { data: ipdTransactions, error: transactionError } = await supabase
        .from('patient_transactions')
        .select(`
          *,
          patients(
            *,
            admissions:patient_admissions(*)
          )
        `)
        .in('transaction_type', ['SERVICE', 'ADMISSION_FEE', 'DEPOSIT', 'ADVANCE_PAYMENT']) // Include all possible deposit and service types
        .neq('status', 'DELETED')
        // Temporarily removing hospital_id filter to show all deposits
        // .eq('hospital_id', HOSPITAL_ID)
        .order('created_at', { ascending: false })
        .limit(200);

      // Also load IPD bed data to get admission details
      logger.log('🔍 Loading IPD bed information...');
      const { data: bedData, error: bedError } = await supabase
        .from('beds')
        .select(`
          *,
          patients(
            id,
            patient_id,
            first_name,
            last_name,
            assigned_doctor,
            ipd_number
          )
        `)
        .not('patient_id', 'is', null); // Get all beds that have patients, regardless of status
      
      if (transactionError) {
        logger.error('❌ Error loading IPD transactions:', transactionError);
        setIpdBills([]);
        toast.error('Failed to load IPD transactions');
        return;
      }

      if (bedError) {
        logger.error('❌ Error loading IPD bed data:', bedError);
        // Continue without bed data - it's not critical
      }

      logger.log('✅ Loaded IPD transactions:', ipdTransactions?.length || 0);
      logger.log('✅ Loaded IPD bed data:', bedData?.length || 0);
      logger.log('📊 Transaction breakdown:', {
        total: ipdTransactions?.length || 0,
        ipdBills: ipdTransactions?.filter(t => t.transaction_type === 'SERVICE' && t.description?.includes('[IPD_BILL]')).length || 0,
        services: ipdTransactions?.filter(t => t.transaction_type === 'SERVICE' && !t.description?.includes('[IPD_BILL]')).length || 0,
        deposits: ipdTransactions?.filter(t => t.transaction_type === 'ADMISSION_FEE').length || 0
      });

      // Create a mapping of patient_id to bed information
      const bedInfoMap = new Map();
      const bedInfoByPatientDbId = new Map(); // Map by database ID too
      if (bedData) {
        logger.log('🛏️ RAW BED DATA:', bedData);
        bedData.forEach((bed, index) => {
          logger.log(`🛏️ Bed ${index}:`, {
            bed_number: bed.bed_number,
            patient_id: bed.patient_id,
            patient_db_id: bed.patients?.id,
            patient_id_string: bed.patients?.patient_id,
            ipd_number: bed.ipd_number,
            room_type: bed.room_type,
            admission_date: bed.admission_date,
            assigned_doctor: bed.patients?.assigned_doctor,
            full_bed: bed
          });

          const bedInfo = {
            bed_number: bed.bed_number,
            room_type: bed.room_type,
            admission_date: bed.admission_date,
            ipd_number: bed.ipd_number || bed.patients?.ipd_number, // ✅ FIX: Fallback to patient's ipd_number if bed's is cleared
            assigned_doctor: bed.patients?.assigned_doctor
          };

          // Map by both patient_id (string) and database ID
          if (bed.patient_id) {
            bedInfoMap.set(bed.patient_id, bedInfo);
          }
          if (bed.patients?.id) {
            bedInfoByPatientDbId.set(bed.patients.id, bedInfo);
          }
          if (bed.patients?.patient_id) {
            bedInfoMap.set(bed.patients.patient_id, bedInfo);
          }
        });
      }
      logger.log('🛏️ Bed info mapping created for', bedInfoMap.size, 'patients (by string)');
      logger.log('🛏️ Bed info mapping created for', bedInfoByPatientDbId.size, 'patients (by db ID)');
      logger.log('🛏️ Bed info map contents:', Array.from(bedInfoMap.entries()));

      // 🔍 DEBUG: Check admission data structure in first few transactions
      if (ipdTransactions && ipdTransactions.length > 0) {
        logger.log('🏥 ADMISSION DATA DEBUG - First transaction sample:', {
          transaction_id: ipdTransactions[0].id,
          has_patients: !!ipdTransactions[0].patients,
          patient_data: ipdTransactions[0].patients,
          admissions_exist: ipdTransactions[0].patients?.admissions,
          admissions_count: ipdTransactions[0].patients?.admissions?.length || 0,
          first_admission: ipdTransactions[0].patients?.admissions?.[0]
        });
      }

      if (ipdTransactions && ipdTransactions.length > 0) {
        logger.log('🔍 RAW TRANSACTION DATA (first 2):', ipdTransactions.slice(0, 2));

        // Process transactions with patient data already joined
        const enrichedTransactions = ipdTransactions.map((transaction, index) => {
          // Try to get bed info using multiple approaches
          let bedInfo = bedInfoMap.get(transaction.patient_id); // Try by patient_id string
          if (!bedInfo && transaction.patients?.id) {
            bedInfo = bedInfoByPatientDbId.get(transaction.patients.id); // Try by database ID
          }
          if (!bedInfo && transaction.patients?.patient_id) {
            bedInfo = bedInfoMap.get(transaction.patients.patient_id); // Try by patient.patient_id
          }

          if (index < 3) { // Debug first 3 transactions
            logger.log(`🔄 Transaction ${index} enrichment:`, {
              transaction_id: transaction.id,
              transaction_patient_id: transaction.patient_id,
              patients_db_id: transaction.patients?.id,
              patients_patient_id: transaction.patients?.patient_id,
              bed_info_found: !!bedInfo,
              bed_info: bedInfo,
              original_patients: transaction.patients
            });
          }

          return {
            ...transaction,
            patients: {
              ...transaction.patients,
              // Enrich with bed information and admissions data
              ipd_bed_number: bedInfo?.bed_number || transaction.patients?.ipd_bed_number,
              room_type: bedInfo?.room_type || transaction.patients?.room_type,
              admission_date: bedInfo?.admission_date || transaction.patients?.admission_date,
              // ✅ FIX: Try multiple sources for IPD number
              ipd_number: bedInfo?.ipd_number ||
                         transaction.patients?.ipd_number ||
                         transaction.patients?.admissions?.[0]?.ipd_number ||
                         'N/A',
              assigned_doctor: bedInfo?.assigned_doctor || transaction.patients?.assigned_doctor
            },
            // Add display type for UI - check description for IPD bills
            display_type: (transaction.transaction_type === 'SERVICE' && transaction.description?.includes('[IPD_BILL]')) ? 'IPD Bill' :
                         transaction.transaction_type === 'SERVICE' ? 'Service Bill' : 'Deposit',
            display_icon: transaction.transaction_type === 'SERVICE' ? '🧾' : '💰'
          };
        });

        logger.log('💾 Processed IPD transactions with patient data:', enrichedTransactions.length);
        logger.log('🔍 ENRICHED TRANSACTION DATA (first 2):', enrichedTransactions.slice(0, 2));
        logger.log('🔍 FIRST ENRICHED PATIENT DATA:', enrichedTransactions[0]?.patients);

        // 🔍 DEBUG: Check if patient age and gender are loaded
        const firstTransaction = enrichedTransactions[0];
        if (firstTransaction?.patients) {
          logger.log('🔍 PATIENT DATA DEBUG - First transaction patient info:', {
            'Patient name': `${firstTransaction.patients.first_name} ${firstTransaction.patients.last_name}`,
            'Patient age': firstTransaction.patients.age,
            'Patient gender': firstTransaction.patients.gender,
            'Patient phone': firstTransaction.patients.phone,
            'Patient ID': firstTransaction.patients.patient_id,
            'Has age data?': firstTransaction.patients.age ? '✅ YES' : '❌ NO',
            'Has gender data?': firstTransaction.patients.gender ? '✅ YES' : '❌ NO'
          });
        }


        logger.log('🔄 Setting IPD bills state with:', enrichedTransactions.length, 'transactions');
        
        // Sort by date descending to show latest first - CRITICAL FIX: Use transaction_date (user billing date) not created_at
        enrichedTransactions.sort((a, b) => {
          // Use transaction_date if available (user's billing date), otherwise fall back to created_at
          const dateA = a.transaction_date || a.created_at;
          const dateB = b.transaction_date || b.created_at;
          return new Date(dateB).getTime() - new Date(dateA).getTime();
        });

        // Filter out deposit transactions - they belong in the Deposit Module only
        const billsOnly = enrichedTransactions.filter(t =>
          t.transaction_type === 'SERVICE' &&
          !['ADMISSION_FEE', 'DEPOSIT', 'ADVANCE_PAYMENT'].includes(t.transaction_type)
        );

        setIpdBills([...billsOnly]); // Only include SERVICE bills, exclude deposits
        const ipdBillCount = billsOnly.filter(t => t.description?.includes('[IPD_BILL]')).length;
        const serviceBillCount = billsOnly.filter(t => !t.description?.includes('[IPD_BILL]')).length;
        const depositCount = enrichedTransactions.filter(t => ['ADMISSION_FEE', 'DEPOSIT', 'ADVANCE_PAYMENT'].includes(t.transaction_type)).length;

        logger.log('📋 Final transaction counts:', { ipdBillCount, serviceBillCount, depositCount, depositsSeparated: depositCount });
      } else {
        logger.log('ℹ️ No IPD transactions found');
        setIpdBills([]);
        toast('No IPD transactions found', {
          icon: 'ℹ️',
          duration: 3000
        });
      }
      
    } catch (error: any) {
      logger.error('❌ CATCH: Failed to load IPD bills:', error);
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
    // Use the same calculation system as the main bill display
    const admissionAmount = parseFloat(admissionFee) || 0;
    const stayChargesAmount = calculateTotalStayCharges();
    const servicesAmount = calculateSelectedServicesTotal();
    const discountAmount = parseFloat(discount) || 0;
    const taxAmount = parseFloat(tax) || 0;

    const totalBill = admissionAmount + stayChargesAmount + servicesAmount;
    const netAfterDiscountAndTax = Math.max(0, totalBill - discountAmount + taxAmount);
    const netPayable = Math.max(0, netAfterDiscountAndTax - advancePayments);

    logger.log('🧮 Summary calculation breakdown:', {
      admissionAmount,
      stayChargesAmount,
      servicesAmount,
      totalBill,
      discountAmount,
      taxAmount,
      netAfterDiscountAndTax,
      advancePayments,
      netPayable
    });

    setSummary({
      totalBill,
      paidAmount: advancePayments,
      refund: Math.max(0, advancePayments - netAfterDiscountAndTax),
      netPayable,
      totalDiscount: discountAmount,
      totalTax: taxAmount,
      totalPayable: netAfterDiscountAndTax,
      subtotal: totalBill
    });
  };

  // Add advance payment function
  const addAdvancePayment = async () => {
    logger.log('🏥 DEPOSIT: addAdvancePayment function called');
    logger.log('🏥 DEPOSIT: newPaymentAmount:', newPaymentAmount);
    logger.log('🏥 DEPOSIT: selectedPatient:', selectedPatient);
    
    const amount = parseFloat(newPaymentAmount);
    logger.log('🏥 DEPOSIT: parsed amount:', amount);
    
    if (!amount || amount <= 0) {
      logger.log('🏥 DEPOSIT: Invalid amount error');
      toast.error('Please enter a valid amount');
      return;
    }
    
    if (!selectedPatient) {
      logger.log('🏥 DEPOSIT: No patient selected error');
      toast.error('Please select a patient first');
      return;
    }
    
    // Generate auto-incremented receipt number
    const nextReceiptCounter = receiptCounter + 1;
    const newReceiptNo = `Y${nextReceiptCounter}`;
    // CRITICAL FIX: FORCE TODAY'S ACTUAL DATE for display
    const todayForDisplay = new Date().toISOString().split('T')[0];
    const depositDate = newPaymentDate || todayForDisplay;

    logger.log('🚨 LOCAL PAYMENT DATE FIX:', {
      newPaymentDate,
      billingDate,
      todayForDisplay,
      finalDepositDate: depositDate
    });

    // Deposit object will be created by database and loaded via loadPatientDeposits()
    
    try {
      // Validate patient ID
      if (!selectedPatient?.id) {
        logger.error('❌ No patient ID found');
        toast.error('Invalid patient selection');
        return;
      }

      // Save to database - patient_transactions table
      // CRITICAL: Use user-entered date from deposit modal
      const todayActual = new Date().toISOString().split('T')[0];
      const formattedDepositDate = newPaymentDate || billingDate || todayActual;

      logger.log('🚨 COMPREHENSIVE DATE DEBUG:', {
        'User entered newPaymentDate': newPaymentDate,
        'Billing screen billingDate': billingDate,
        'System todayActual': todayActual,
        'FINAL formattedDepositDate': formattedDepositDate,
        'Priority': newPaymentDate ? 'User Modal Input' : billingDate ? 'Billing Screen Date' : 'System Today'
      });
      
      const transactionData = {
        patient_id: selectedPatient.id,
        hospital_id: HOSPITAL_ID,
        transaction_type: 'ADMISSION_FEE',
        description: `IPD Advance Payment - Receipt: ${newReceiptNo}${referenceNo ? ` - Ref: ${referenceNo}` : ''}`,
        amount: amount,
        payment_mode: newPaymentMode.toUpperCase(),
        doctor_id: null,
        doctor_name: null,
        status: 'COMPLETED',
        transaction_reference: referenceNo || newReceiptNo,
        transaction_date: formattedDepositDate,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      logger.log('💾 DEPOSIT: Saving transaction data:', {
        ...transactionData,
        formattedDepositDate,
        originalNewPaymentDate: newPaymentDate,
        originalBillingDate: billingDate
      });

      logger.log('🚨 FINAL DATABASE INSERT VALUES:', {
        'transaction_date in DB': transactionData.transaction_date,
        'created_at in DB': transactionData.created_at,
        'user_entered_date': newPaymentDate,
        'billing_screen_date': billingDate,
        'CRITICAL_CHECK': transactionData.transaction_date === formattedDepositDate ? '✅ CORRECT' : '❌ WRONG'
      });

      logger.log('💾 Attempting to save transaction:', transactionData);

      const { data, error: dbError } = await supabase
        .from('patient_transactions')
        .insert([transactionData])
        .select();

      // CRITICAL: Verify what was actually saved to database
      logger.log('📊 DATABASE SAVE VERIFICATION:');
      logger.log('   - Data object sent to DB:', transactionData);
      logger.log('   - Description length:', transactionData.description.length);
      logger.log('   - Returned data:', data);
      logger.log('   - Error (if any):', dbError);

      // Verify the saved description contains our BILLING_ROWS data
      if (data && data.length > 0) {
        const savedData = data[0];
        logger.log('✅ VERIFICATION OF SAVED DATA:');
        logger.log('   - Saved description length:', savedData.description?.length || 0);
        logger.log('   - Contains BILLING_ROWS?', savedData.description?.includes('BILLING_ROWS:') || false);

        if (savedData.description?.includes('BILLING_ROWS:')) {
          const match = savedData.description.match(/BILLING_ROWS:\s*(\[[\s\S]*?)(?:\s*$|$)/);
          if (match) {
            logger.log('   - BILLING_ROWS length in saved data:', match[1].length);
            logger.log('   - First 200 chars of saved BILLING_ROWS:', match[1].substring(0, 200));

            // Try to parse the saved BILLING_ROWS to check for chargeBreakdown
            try {
              const parsedData = JSON.parse(match[1]);
              logger.log('   - Successfully parsed saved BILLING_ROWS');
              logger.log('   - Number of items in parsed data:', parsedData.length);

              parsedData.forEach((item, index) => {
                if (item.chargeBreakdown) {
                  logger.log(`   - Item ${index} has chargeBreakdown in DB:`, item.chargeBreakdown);
                }
              });
            } catch (parseError) {
              logger.error('❌ Failed to parse saved BILLING_ROWS:', parseError);
            }
          }
        }

        logger.log('🚨 VERIFICATION: What was actually saved to DB:', {
          'Inserted record ID': data[0].id,
          'DB transaction_date': data[0].transaction_date,
          'DB created_at': data[0].created_at,
          'DB amount': data[0].amount,
          'Original input date': newPaymentDate,
          'MATCH CHECK': data[0].transaction_date === formattedDepositDate ? '✅ MATCH' : '❌ MISMATCH'
        });

        // Double-check by querying back immediately
        const { data: verifyData, error: verifyError } = await supabase
          .from('patient_transactions')
          .select('id, transaction_date, created_at, amount, description')
          .eq('id', data[0].id)
          .single();

        if (verifyData) {
          logger.log('🔍 IMMEDIATE QUERY BACK:', {
            'Query result transaction_date': verifyData.transaction_date,
            'Query result created_at': verifyData.created_at,
            'Matches inserted?': verifyData.transaction_date === data[0].transaction_date ? '✅ YES' : '❌ NO'
          });
        }
      }

      if (dbError) {
        logger.error('❌ Database save error:', dbError);
        logger.error('❌ Error details:', {
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
        logger.log('✅ Payment saved to database successfully:', data);

        // Store the correct date override for this deposit ID
        if (data && data.length > 0) {
          const savedDepositId = data[0].id;
          setDepositDateOverrides(prev => ({
            ...prev,
            [savedDepositId]: formattedDepositDate
          }));
          logger.log(`💰 Stored date override for deposit ${savedDepositId}: ${formattedDepositDate}`);
        }

        toast.success('Payment saved successfully!');
      }
    } catch (error) {
      logger.error('❌ Database connection error:', error);
      toast.error('Database connection failed. Please check your connection.');
    }
    
    // CRITICAL FIX: Only reload from database - don't add to local state with potentially wrong dates
    toast.success('Deposit saved to database! Reloading...');

    // Immediately reload from database to get the correct data
    await loadPatientDeposits();

    setReceiptCounter(nextReceiptCounter);
    setNewPaymentAmount('');
    setNewPaymentMode('Cash');
    setNewPaymentDate('');
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

  // Edit deposit functions
  const handleEditDeposit = (deposit) => {
    logger.log('✏️ Editing deposit:', deposit);
    setEditingDeposit(deposit);
    setEditDepositAmount(deposit.amount?.toString() || '');
    setEditDepositDate(deposit.date?.split(' ')[0] || billingDate); // Extract date part if date includes time
    setEditDepositPaymentMode(deposit.paymentMode || 'CASH');
    setEditDepositReference(deposit.reference || '');
    setEditDepositReceivedBy(deposit.receivedBy || 'IPD Billing Department');
    setShowEditDepositModal(true);
  };

  const handleUpdateDeposit = async () => {
    if (!editingDeposit) {
      toast.error('No deposit selected for editing');
      return;
    }

    const amount = parseFloat(editDepositAmount);
    if (!amount || amount <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    if (!editDepositDate) {
      toast.error('Please select a date');
      return;
    }

    try {
      logger.log('💾 Updating deposit in database:', editingDeposit.id);

      // Update in database if the deposit has a database ID
      if (editingDeposit.id && !editingDeposit.id.toString().startsWith('Y')) {
        const updateData = {
          amount: amount,
          transaction_date: editDepositDate,
          payment_mode: editDepositPaymentMode.toUpperCase(),
          transaction_reference: editDepositReference || editingDeposit.receiptNo,
          updated_at: new Date().toISOString()
        };

        const { error } = await supabase
          .from('patient_transactions')
          .update(updateData)
          .eq('id', editingDeposit.id);

        if (error) {
          logger.error('❌ Error updating deposit:', error);
          toast.error('Failed to update deposit in database');
          return;
        }

        logger.log('✅ Deposit updated in database successfully');
      }

      // Reload deposits from database to get updated data
      await loadPatientDeposits();

      // Reset edit form
      setEditingDeposit(null);
      setShowEditDepositModal(false);
      setEditDepositAmount('');
      setEditDepositDate('');
      setEditDepositPaymentMode('CASH');
      setEditDepositReference('');
      setEditDepositReceivedBy('');

      toast.success('Deposit updated successfully!');

    } catch (error) {
      logger.error('❌ Error updating deposit:', error);
      toast.error('Failed to update deposit');
    }
  };

  const handleCancelEditDeposit = () => {
    setEditingDeposit(null);
    setShowEditDepositModal(false);
    setEditDepositAmount('');
    setEditDepositDate('');
    setEditDepositPaymentMode('CASH');
    setEditDepositReference('');
    setEditDepositReceivedBy('');
  };

  const handlePrint = () => {
    logger.log('🖨️ Print function called');
    logger.log('💰 Deposit history length:', depositHistory.length);
    logger.log('💳 Deposit history data:', depositHistory);
    
    try {
      // Simple approach - just use window.print with CSS media queries
      window.print();
      toast.success('Opening print dialog...');
    } catch (error) {
      logger.error('Print error:', error);
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
    
    // Keep the current billing date when selecting a patient (don't override user's date selection)
    // setBillingDate(getLocalDateString()); // Removed to preserve user's selected date
    
    // Update doctor names in billing rows
    updateDoctorNamesForPatient(patient);
    
    toast.success(`Selected patient: ${patient.first_name} ${patient.last_name || ''}`);
  };

  const updateDoctorNamesForPatient = (patient: PatientWithRelations) => {
    logger.log('🔍 DEBUG: Patient data for doctor name extraction:', patient);
    logger.log('🔍 DEBUG: Patient assigned_doctor:', patient.assigned_doctor);
    logger.log('🔍 DEBUG: Patient assigned_doctors:', patient.assigned_doctors);
    logger.log('🔍 DEBUG: Patient admissions:', patient.admissions);
    
    const latestAdmission = patient.admissions?.[0];
    let doctorName = 'N/A';
    
    // Try multiple sources for doctor name
    if (patient.assigned_doctor) {
      doctorName = patient.assigned_doctor;
      logger.log('✅ Found doctor in assigned_doctor:', doctorName);
    } else if (patient.assigned_doctors && patient.assigned_doctors.length > 0) {
      doctorName = patient.assigned_doctors[0].name;
      logger.log('✅ Found doctor in assigned_doctors array:', doctorName);
    } else if ((latestAdmission as any)?.doctor_name) {
      doctorName = (latestAdmission as any).doctor_name;
      logger.log('✅ Found doctor in admission doctor_name:', doctorName);
    } else if ((latestAdmission as any)?.treating_doctor) {
      doctorName = (latestAdmission as any).treating_doctor;
      logger.log('✅ Found doctor in admission treating_doctor:', doctorName);
    } else {
      logger.log('❌ No doctor name found in any field');
    }

    logger.log('🏥 Final doctor name:', doctorName);

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

    logger.log('🏥 Header doctor name:', doctorName);

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

    // Use the same calculation system as UI display (not the old pharmacy system)
    const grossTotal = admissionFee + calculateTotalStayCharges() + calculateSelectedServicesTotal();
    const netPayable = Math.max(0, grossTotal - discount + tax);
    const balanceAfterDeposits = netPayable - advancePayments;

    logger.log('💵 Generating IPD Bill (CORRECTED CALCULATION):', {
      patient: selectedPatient.first_name + ' ' + (selectedPatient.last_name || ''),
      admissionFee,
      stayCharges: calculateTotalStayCharges(),
      serviceCharges: calculateSelectedServicesTotal(),
      grossTotal,
      discount,
      tax,
      netPayable,
      advancePayments,
      balanceAfterDeposits
    });

    try {
      // Validate patient selection
      if (!selectedPatient?.id) {
        logger.error('❌ No patient selected or invalid patient ID');
        toast.error('Please select a valid patient');
        return;
      }

      // Check if we're editing or creating a new bill
      const isEditing = editingBill !== null;
      const billReceiptNo = isEditing
        ? editingBill.transaction_reference || `IPD-${Date.now().toString().slice(-6)}`
        : `IPD-${Date.now().toString().slice(-6)}`;

      // Use the billing date directly to avoid timezone issues
      const formattedBillingDate = billingDate || getLocalDateString();

      
      // Store ACTUAL services data that are being billed
      const actualServicesData = [];

      // Add admission fee if set
      if (admissionFee > 0) {
        actualServicesData.push({
          id: 'admission-fee',
          serviceType: 'Admission Fee',
          particulars: 'Hospital Admission Charges',
          quantity: 1,
          unitPrice: admissionFee,
          discount: 0,
          taxes: 0,
          total: admissionFee,
          emergency: 'Yes',
          doctor: '',
          date: formattedBillingDate
        });
      }

      // Add stay segments charges
      if (staySegments && staySegments.length > 0) {
        staySegments.forEach((segment, index) => {
          const segmentTotal = calculateSegmentTotal(segment);
          if (segmentTotal > 0) {
            actualServicesData.push({
              id: `stay-${segment.id || index}`,
              serviceType: 'Room & Stay Charges',
              particulars: `${segment.roomType} - Room Stay (${calculateDays(segment.startDate, segment.endDate)} days)`,
              quantity: calculateDays(segment.startDate, segment.endDate),
              unitPrice: (segment.bedChargePerDay + segment.nursingChargePerDay + segment.rmoChargePerDay + segment.doctorChargePerDay),
              discount: 0,
              taxes: 0,
              total: segmentTotal,
              emergency: 'Yes',
              doctor: '',
              date: formattedBillingDate,
              // Save detailed charge breakdown for accurate editing
              chargeBreakdown: {
                bedChargePerDay: segment.bedChargePerDay,
                nursingChargePerDay: segment.nursingChargePerDay,
                rmoChargePerDay: segment.rmoChargePerDay,
                doctorChargePerDay: segment.doctorChargePerDay,
                roomType: segment.roomType,
                startDate: segment.startDate,
                endDate: segment.endDate
              }
            });
          }
        });
      }

      // Add selected services - EACH SERVICE AS SEPARATE ITEM
      if (selectedServices && selectedServices.length > 0) {
        selectedServices.filter(service => service.selected && service.amount > 0).forEach((service, index) => {
          const serviceQuantity = parseInt(service.quantity) || 1;
          const serviceUnitPrice = parseFloat(service.amount) || 0;
          const serviceTotal = serviceUnitPrice * serviceQuantity;

          actualServicesData.push({
            id: `service-${service.id || index}`,
            serviceType: service.name, // Use actual service name as service type
            particulars: service.name, // Service name as particulars
            quantity: serviceQuantity,
            unitPrice: serviceUnitPrice,
            discount: 0,
            taxes: 0,
            total: serviceTotal,
            emergency: 'Yes',
            doctor: '',
            date: formattedBillingDate
          });
          logger.log(`📋 Added individual service: ${service.name} - Qty: ${serviceQuantity}, Unit: ₹${serviceUnitPrice}, Total: ₹${serviceTotal}`);
        });
      }

      // If no actual services found, try to use billingRows as fallback
      if (actualServicesData.length === 0 && billingRows && billingRows.length > 0) {
        const filteredBillingRows = billingRows.filter(row =>
          (row.serviceType && row.serviceType.trim() !== '') ||
          (row.particulars && row.particulars.trim() !== '') ||
          row.unitPrice > 0 ||
          row.total > 0
        );
        actualServicesData.push(...filteredBillingRows);
      }

      const billingRowsData = JSON.stringify(actualServicesData);

      logger.log('💾 ACTUAL services being stored:');
      logger.log('   - Admission Fee:', admissionFee);
      logger.log('   - Stay Segments:', staySegments?.length || 0);
      logger.log('   - Selected Services count:', selectedServices?.filter(s => s.selected)?.length || 0);
      logger.log('🔍 BILLING ROWS DATA DETAILS:');
      logger.log('   - actualServicesData length:', actualServicesData.length);
      logger.log('   - billingRowsData length:', billingRowsData.length);
      logger.log('   - First 500 chars of billingRowsData:', billingRowsData.substring(0, 500));

      // Check if any stay segments have chargeBreakdown
      actualServicesData.forEach((item, index) => {
        if (item.chargeBreakdown) {
          logger.log(`   - Item ${index} has chargeBreakdown:`, item.chargeBreakdown);
        }
      });
      logger.log('   - Selected Services details:');
      selectedServices?.filter(s => s.selected)?.forEach(service => {
        logger.log(`     * ${service.name}: ₹${service.amount}`);
      });
      logger.log('   - Total services to store:', actualServicesData.length);
      logger.log('💾 Complete services data being stored:');
      actualServicesData.forEach((service, index) => {
        logger.log(`   ${index + 1}. ${service.particulars} (${service.serviceType}) - ₹${service.total}`);
      });
      logger.log('💾 Services JSON length:', billingRowsData.length, 'characters');

      const transactionData = {
        patient_id: selectedPatient.id,
        hospital_id: HOSPITAL_ID,
        transaction_type: 'SERVICE',
        description: `[IPD_BILL] IPD Comprehensive Bill - ${billReceiptNo} | Admission: ₹${admissionFee} | Stay: ₹${calculateTotalStayCharges()} | Services: ₹${calculateSelectedServicesTotal()} | Discount: ₹${discount} | Tax: ₹${tax} | Net: ₹${netPayable} | BILLING_ROWS: ${billingRowsData}`,
        amount: netPayable,
        payment_mode: finalPaymentMode.toUpperCase(),
        doctor_id: null,
        doctor_name: null,
        status: 'PENDING',
        transaction_reference: billReceiptNo,
        transaction_date: formattedBillingDate,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      logger.log(`💾 ${isEditing ? 'Updating' : 'Saving'} IPD bill transaction to Supabase:`, transactionData);

      logger.log('🔍 Transaction details:', {
        patient_id: transactionData.patient_id,
        transaction_type: transactionData.transaction_type,
        hospital_id: transactionData.hospital_id,
        amount: transactionData.amount,
        billingDate: transactionData.transaction_date,
        originalBillingDate: billingDate,
        formattedBillingDate: formattedBillingDate,
        payment_mode: transactionData.payment_mode,
        isEditing: isEditing
      });

      let savedTransaction, error;

      if (isEditing) {
        // Update existing transaction
        const { data, error: updateError } = await supabase
          .from('patient_transactions')
          .update(transactionData)
          .eq('id', editingBill.id)
          .select()
          .single();
        savedTransaction = data;
        error = updateError;
      } else {
        // Create new transaction
        const { data, error: insertError } = await supabase
          .from('patient_transactions')
          .insert([transactionData])
          .select()
          .single();
        savedTransaction = data;
        error = insertError;
      }

      logger.log('📊 Supabase insert result:', { data: savedTransaction, error });

      if (error) {
        logger.error('❌ Bill transaction save error:', error);
        logger.error('❌ Error details:', {
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

      logger.log(`✅ IPD bill transaction ${isEditing ? 'updated' : 'saved'}:`, savedTransaction);
      toast.success(`IPD Bill ${isEditing ? 'updated' : 'generated'} successfully! Bill #${billReceiptNo}`);
      
      // Refresh the IPD bills list
      await loadIPDBills();
      
      // Reset form or redirect
      setShowCreateBill(false);
      setEditingBill(null);
      resetForm();
      
      // Show success message with print option
      toast.success(
        <div>
          <p>IPD Bill saved successfully!</p>
          <button 
            onClick={() => handlePrintBill(savedTransaction)}
            className="mt-2 px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
          >
            Print Bill
          </button>
        </div>,
        { duration: 5000 }
      );
      
    } catch (error) {
      logger.error('❌ Error generating bill:', error);
      logger.error('❌ Full error object:', JSON.stringify(error, null, 2));
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

    // CRITICAL: Use the billing date selected by user, or today's date
    const userSelectedDate = ensureDateFormat(billingDate);
    logger.log('🚨 DEPOSIT MODAL DATE SETUP:', {
      'Current billingDate from UI': billingDate,
      'getLocalDateString()': getLocalDateString(),
      'ensureDateFormat result': userSelectedDate,
      'Will use in modal': userSelectedDate
    });


    setNewPaymentDate(userSelectedDate);
    setShowAddDepositModal(true);

  };

  const handleSaveDeposit = async () => {
    logger.log('💰 MODAL: Save Deposit clicked!');
    logger.log('💰 MODAL: Current values:', {
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
      logger.error('❌ Error in handleSaveDeposit:', error);
      toast.error('Failed to save deposit. Please try again.');
    }
  };

  // Handler for View Receipt button
  const handleViewReceipt = (receiptId: string) => {
    // Find the deposit by receipt ID
    const deposit = depositHistory.find(d => d.receiptNo === receiptId);
    if (!deposit) {
      toast.error('Deposit not found');
      return;
    }

    // Open receipt in new window for viewing
    const viewDepositReceipt = () => {
      const getCurrentTime = () => {
        const now = new Date();
        return now.toLocaleTimeString('en-IN', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: true
        });
      };

      const convertToWords = (amount: number): string => {
        if (amount === 0) return 'Zero';
        const units = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
        const teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
        const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

        if (amount < 10) return units[amount];
        if (amount < 20) return teens[amount - 10];
        if (amount < 100) return tens[Math.floor(amount / 10)] + (amount % 10 ? ' ' + units[amount % 10] : '');
        if (amount < 1000) return units[Math.floor(amount / 100)] + ' Hundred' + (amount % 100 ? ' ' + convertToWords(amount % 100) : '');
        if (amount < 100000) return convertToWords(Math.floor(amount / 1000)) + ' Thousand' + (amount % 1000 ? ' ' + convertToWords(amount % 1000) : '');
        return 'Amount Too Large';
      };

      const viewContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>View Advance Deposit Receipt - ${deposit.receiptNo}</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              margin: 20px;
              background: white;
            }
            .receipt-view {
              max-width: 800px;
              margin: 0 auto;
              padding: 20px;
              border: 1px solid #ddd;
              border-radius: 5px;
            }
            .print-button {
              position: fixed;
              top: 20px;
              right: 20px;
              background: #0056B3;
              color: white;
              border: none;
              padding: 10px 20px;
              border-radius: 5px;
              cursor: pointer;
              font-size: 14px;
            }
            .print-button:hover {
              background: #004494;
            }
          </style>
        </head>
        <body>
          <button class="print-button" onclick="window.print()">🖨️ Print Receipt</button>
          <div class="receipt-view">
            <!-- Header -->
            <div style="text-align: center; margin-bottom: 30px; border-bottom: 3px solid #0056B3; padding-bottom: 20px;">
              <h1 style="color: #0056B3; font-size: 32px; font-weight: bold; margin: 0;">HOSPITAL CRM PRO</h1>
              <p style="color: black; font-size: 16px; margin: 8px 0;">Complete Healthcare Management System</p>
              <p style="color: black; font-size: 14px; margin: 0;">📍 Your Hospital Address | 📞 Contact Number | 📧 Email</p>
            </div>

            <!-- IPD DEPOSIT Title at Top Center -->
            <div style="text-align: center; margin-bottom: 25px;">
              <h1 style="font-size: 28px; font-weight: bold; color: black; margin: 0; letter-spacing: 2px;">IPD DEPOSIT</h1>
            </div>

            <!-- Receipt Title -->
            <div style="text-align: center; margin-bottom: 25px;">
              <h2 style="color: black; font-size: 20px; font-weight: bold; margin: 0;">Advance Deposit Receipt</h2>
              <p style="color: black; font-size: 16px; margin: 10px 0;">Receipt No: <strong>${deposit.receiptNo}</strong></p>
            </div>

            <!-- Date and Time -->
            <div style="display: grid; grid-template-columns: 1fr 1fr; margin-bottom: 25px; font-size: 16px; color: black;">
              <div>
                <p style="margin: 5px 0;"><strong>DATE:</strong> ${new Date().toLocaleDateString('en-IN')}</p>
                <p style="margin: 5px 0;"><strong>TIME:</strong> ${getCurrentTime()}</p>
              </div>
              <div style="text-align: right;">
                <p style="margin: 5px 0;"><strong>RECEIPT DATE:</strong> ${deposit.date}</p>
                <p style="margin: 5px 0;"><strong>PAYMENT MODE:</strong> ${deposit.paymentMode || 'CASH'}</p>
              </div>
            </div>

            <!-- Patient Information -->
            <div style="margin-bottom: 30px; border: 2px solid #ddd; padding: 20px; background-color: #f9f9f9;">
              <h3 style="color: black; font-size: 18px; font-weight: bold; margin-bottom: 15px; border-bottom: 1px solid #ddd; padding-bottom: 8px;">PATIENT DETAILS</h3>
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                <div>
                  <p style="color: black; margin: 6px 0;"><strong>NAME:</strong> ${bill.patients?.first_name || ''} ${bill.patients?.last_name || ''}</p>
                  <p style="color: black; margin: 6px 0;"><strong>AGE/SEX:</strong> ${bill.patients?.age || 'N/A'} years / ${bill.patients?.gender || 'N/A'}</p>
                  <p style="color: black; margin: 6px 0;"><strong>MOBILE:</strong> ${bill.patients?.phone || 'N/A'}</p>
                </div>
                <div>
                  <p style="color: black; margin: 6px 0;"><strong>PATIENT ID:</strong> ${bill.patients?.patient_id || 'N/A'}</p>
                  <p style="color: black; margin: 6px 0;"><strong>ADMISSION DATE:</strong> ${bill.patients?.admissions?.[0]?.admission_date ? new Date(bill.patients.admissions[0].admission_date).toLocaleDateString('en-IN') : 'N/A'}</p>
                  <p style="color: black; margin: 6px 0;"><strong>ROOM/BED:</strong> ${bill.patients?.admissions?.[0]?.bed_number || 'N/A'}</p>
                </div>
              </div>
            </div>

            <!-- Deposit Details -->
            <div style="margin-bottom: 30px;">
              <h3 style="color: black; font-size: 18px; font-weight: bold; margin-bottom: 15px; border-bottom: 1px solid #ddd; padding-bottom: 8px;">ADVANCE DEPOSIT DETAILS</h3>
              <table style="width: 100%; border-collapse: collapse; font-size: 16px;">
                <thead>
                  <tr style="background-color: #f0f0f0;">
                    <th style="border: 1px solid black; padding: 12px; text-align: left; color: black;">Description</th>
                    <th style="border: 1px solid black; padding: 12px; text-align: center; color: black;">Payment Mode</th>
                    <th style="border: 1px solid black; padding: 12px; text-align: center; color: black;">Reference</th>
                    <th style="border: 1px solid black; padding: 12px; text-align: right; color: black;">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td style="border: 1px solid black; padding: 12px; color: black;">IPD Advance Payment</td>
                    <td style="border: 1px solid black; padding: 12px; text-align: center; color: black;">${deposit.paymentMode || 'CASH'}</td>
                    <td style="border: 1px solid black; padding: 12px; text-align: center; color: black;">${deposit.reference || '-'}</td>
                    <td style="border: 1px solid black; padding: 12px; text-align: right; color: black; font-weight: bold;">₹${deposit.amount?.toFixed(2) || '0.00'}</td>
                  </tr>
                  <tr style="background-color: #f0f0f0;">
                    <td colspan="3" style="border: 1px solid black; padding: 15px; text-align: center; color: black; font-weight: bold; font-size: 18px;">TOTAL ADVANCE DEPOSIT</td>
                    <td style="border: 1px solid black; padding: 15px; text-align: right; color: black; font-weight: bold; font-size: 18px;">₹${deposit.amount?.toFixed(2) || '0.00'}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <!-- Amount in Words -->
            <div style="text-align: center; margin-bottom: 25px; padding: 15px; background-color: #f9f9f9; border: 1px solid #ddd;">
              <p style="font-size: 16px; color: black; margin: 0;"><strong>Amount in Words:</strong> ${convertToWords(deposit.amount || 0)} Rupees Only</p>
            </div>

            <!-- Important Notice -->
            <div style="margin-bottom: 30px; padding: 15px; background-color: #fff3cd; border: 1px solid #ffeaa7; border-radius: 5px;">
              <h4 style="color: black; font-size: 16px; font-weight: bold; margin-bottom: 8px;">Important Notice:</h4>
              <ul style="color: black; font-size: 14px; margin: 0; padding-left: 20px;">
                <li>This advance payment will be adjusted against your final bill</li>
                <li>Please keep this receipt for your records</li>
                <li>This receipt is valid for all insurance and reimbursement claims</li>
                <li>For any queries, please contact the billing department</li>
              </ul>
            </div>

            <!-- Signature Section -->
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-top: 40px; margin-bottom: 30px;">
              <div style="text-align: center; border-top: 2px solid black; padding-top: 8px;">
                <p style="font-size: 14px; color: black; margin: 0;">Patient/Guardian Signature</p>
              </div>
              <div style="text-align: center; border-top: 2px solid black; padding-top: 8px;">
                <p style="font-size: 14px; color: black; margin: 0;">Authorized Signature</p>
                <p style="font-size: 12px; color: black; margin: 5px 0 0 0;">Billing Department</p>
              </div>
            </div>

            <!-- Footer -->
            <div style="text-align: center; font-size: 12px; color: #666; border-top: 1px solid #ddd; padding-top: 15px; margin-top: 30px;">
              <p style="margin: 0;">This is a computer-generated receipt and does not require a physical signature.</p>
              <p style="margin: 5px 0 0 0;">Generated on ${new Date().toLocaleDateString('en-IN')} at ${getCurrentTime()}</p>
            </div>
          </div>
        </body>
        </html>
      `;

      const viewWindow = window.open('', '_blank');
      if (viewWindow) {
        viewWindow.document.write(viewContent);
        viewWindow.document.close();
      }
    };

    viewDepositReceipt();
    toast.success('Opening deposit receipt...');
  };

  // Handler for Mark Bill as Completed
  const handleMarkCompleted = async (bill: any) => {
    if (!bill?.id) {
      toast.error('Invalid bill selected');
      return;
    }

    try {
      logger.log('✅ Marking bill as completed:', bill.id);
      
      const { data: updatedBill, error } = await supabase
        .from('patient_transactions')
        .update({ 
          status: 'COMPLETED',
          updated_at: new Date().toISOString()
        })
        .eq('id', bill.id)
        .select()
        .single();

      if (error) {
        logger.error('❌ Error updating bill status:', error);
        toast.error(`Failed to mark bill as completed: ${error.message}`);
        return;
      }

      logger.log('✅ Bill marked as completed:', updatedBill);
      toast.success(`Bill #${bill.transaction_reference || bill.id} marked as completed!`);
      
      // Refresh the bills list
      await loadIPDBills();
      
    } catch (error: any) {
      logger.error('❌ Error in handleMarkCompleted:', error);
      toast.error(`Failed to mark bill as completed: ${error?.message || 'Unknown error'}`);
    }
  };

  // Handler for View Bill button
  const handleViewBill = (bill: any) => {
    const transactionType = bill.display_type || 
      ((bill.transaction_type === 'SERVICE' && bill.description?.includes('[IPD_BILL]')) ? 'IPD Bill' : 
       bill.transaction_type === 'SERVICE' ? 'Service Bill' : 'Deposit');
    const billDetails = `
${transactionType} Details:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Reference: ${bill.transaction_reference || bill.id}
Type: ${transactionType} ${bill.display_icon || (bill.transaction_type === 'SERVICE' ? '🧾' : '💰')}
Patient: ${bill.patients?.first_name || ''} ${bill.patients?.last_name || ''}
Amount: ₹${bill.amount?.toLocaleString() || '0'}
Status: ${bill.status || 'UNKNOWN'}
Date: ${bill.transaction_date ? new Date(bill.transaction_date).toLocaleDateString() : (bill.created_at ? new Date(bill.created_at).toLocaleDateString() : 'N/A')}
Payment Mode: ${bill.payment_mode || 'N/A'}
Doctor: ${bill.doctor_name || 'N/A'}
Description: ${bill.description || 'N/A'}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    `.trim();
    
  };

  // Handler for Edit Bill button
  const handleEditBill = (bill: any) => {
    logger.log('🚨🚨🚨 CRITICAL DEBUG - EDIT BILL CALLED 🚨🚨🚨');

    // CRITICAL: Set editing flag to prevent state interference
    isEditingRef.current = true;
    logger.log('🔒 EDITING REF SET TO TRUE');

    // CRITICAL: Let's see what the ACTUAL saved data looks like
    if (bill.description && bill.description.includes('BILLING_ROWS:')) {
      const billingRowsMatch = bill.description.match(/BILLING_ROWS:\s*(\[[\s\S]*)/);
      if (billingRowsMatch) {
        try {
          let rawJson = billingRowsMatch[1];
          const lastBracket = rawJson.lastIndexOf(']');
          if (lastBracket !== -1) {
            rawJson = rawJson.substring(0, lastBracket + 1);
          }
          const parsedRows = JSON.parse(rawJson);

          logger.log('🔍 CRITICAL: ACTUAL SAVED BILLING DATA:');
          parsedRows.forEach((row, index) => {
            if (row.serviceType?.includes('Room') || row.particulars?.includes('Room')) {
              logger.log(`🏨 ACTUAL Room/Stay row ${index}:`, {
                serviceType: row.serviceType,
                particulars: row.particulars,
                unitPrice: row.unitPrice,
                total: row.total,
                quantity: row.quantity,
                chargeBreakdown: row.chargeBreakdown,
                hasChargeBreakdown: !!row.chargeBreakdown
              });

              // This is the critical test - what will our regex extract?
              const testParticulars = row.particulars || row.serviceType || '';
              const testUpper = testParticulars.toUpperCase();
              const testMatch = testUpper.match(/^(.+?)\s*-\s*ROOM STAY/);
              logger.log(`🧪 REGEX TEST for "${testParticulars}":`, {
                input: testParticulars,
                regexMatch: testMatch,
                expectedRoomType: testMatch ? testMatch[1].trim() : 'NO MATCH - WILL DEFAULT TO GENERAL WARD'
              });
            }
          });
        } catch (e) {
          logger.error('❌ Failed to parse saved billing data:', e);
        }
      }
    } else {
      logger.log('⚠️ NO BILLING_ROWS found in description - this is the problem!');
    }

    try {
      // Parse billing rows from the saved bill data
      let savedBillingRows = [];

      logger.log('🔍 Checking bill description for edit:', bill.description?.length ? 'Found description' : 'No description');

      if (bill.description && bill.description.includes('BILLING_ROWS:')) {
        try {
          // Try multiple regex patterns to match billing rows
          let billingRowsMatch = bill.description.match(/BILLING_ROWS:\s*(\[.*\])$/);
          if (!billingRowsMatch) {
            billingRowsMatch = bill.description.match(/BILLING_ROWS:\s*(\[[\s\S]*?\])(?:\s|$)/);
          }
          if (!billingRowsMatch) {
            // More liberal match for any array structure after BILLING_ROWS:
            billingRowsMatch = bill.description.match(/BILLING_ROWS:\s*(\[[\s\S]*)/);
          }

          if (billingRowsMatch) {
            let billingRowsJson = billingRowsMatch[1];
            logger.log('🔍 RAW BILLING ROWS JSON:', billingRowsJson);

            // Clean up the JSON string if it has trailing content
            const lastBracket = billingRowsJson.lastIndexOf(']');
            if (lastBracket !== -1) {
              billingRowsJson = billingRowsJson.substring(0, lastBracket + 1);
            }
            logger.log('🔍 CLEANED BILLING ROWS JSON:', billingRowsJson);

            savedBillingRows = JSON.parse(billingRowsJson);
            logger.log('📝 Successfully parsed billing rows:', savedBillingRows);
            logger.log('🔍 PARSED BILLING ROWS DETAILS:');
            savedBillingRows.forEach((row, index) => {
              logger.log(`   Row ${index}:`, {
                serviceType: row.serviceType,
                particulars: row.particulars,
                chargeBreakdown: row.chargeBreakdown,
                hasChargeBreakdown: !!row.chargeBreakdown,
                unitPrice: row.unitPrice,
                quantity: row.quantity,
                total: row.total
              });
            });
          } else {
            logger.warn('⚠️ No billing rows match found in description');
            logger.log('🔍 Description content:', bill.description);
          }
        } catch (parseError) {
          logger.error('❌ Error parsing billing rows JSON:', parseError);
        }
      } else {
        logger.warn('⚠️ No BILLING_ROWS found in description, using default structure');
      }

      // If no saved billing rows, try to reconstruct from bill description or create exact structure
      if (savedBillingRows.length === 0) {
        const billAmount = bill.amount || 0;
        const descriptionText = bill.description || '';

        logger.log('📋 No billing rows found, reconstructing from bill data. Amount:', billAmount);
        logger.log('📝 Description text:', descriptionText);

        // Try to extract exact values from description
        const admissionMatch = descriptionText.match(/Admission:\s*₹(\d+(?:\.\d{2})?)/);
        const stayMatch = descriptionText.match(/Stay:\s*₹(\d+(?:\.\d{2})?)/);
        const serviceMatch = descriptionText.match(/Services:\s*₹(\d+(?:\.\d{2})?)/);
        const discountMatch = descriptionText.match(/Discount:\s*₹(\d+(?:\.\d{2})?)/);
        const taxMatch = descriptionText.match(/Tax:\s*₹(\d+(?:\.\d{2})?)/);

        const extractedAdmission = admissionMatch ? (parseFloat(admissionMatch[1]) || 0) : 0;
        const extractedStay = stayMatch ? (parseFloat(stayMatch[1]) || 0) : 0;
        const extractedServices = serviceMatch ? (parseFloat(serviceMatch[1]) || 0) : 0;
        const extractedDiscount = discountMatch ? (parseFloat(discountMatch[1]) || 0) : 0;
        const extractedTax = taxMatch ? (parseFloat(taxMatch[1]) || 0) : 0;

        logger.log('💰 Extracted values:', {
          admission: extractedAdmission,
          stay: extractedStay,
          services: extractedServices,
          discount: extractedDiscount,
          tax: extractedTax,
          total: billAmount
        });
        logger.log('🔍 AMOUNT DEBUGGING - Description parsing:');
        logger.log('   - Original bill amount:', billAmount);
        logger.log('   - Admission match:', admissionMatch);
        logger.log('   - Stay match:', stayMatch);
        logger.log('   - Services match:', serviceMatch);

        // Create billing rows based on extracted or calculated values
        savedBillingRows = [];

        if (extractedAdmission > 0 || extractedStay > 0 || extractedServices > 0) {
          // Use extracted values
          if (extractedStay > 0) {
            savedBillingRows.push({
              id: '1',
              serviceType: 'Room & Stay Charges',
              particulars: 'Room & Stay Charges',
              emergency: 'Yes',
              doctor: '',
              date: billingDate,
              quantity: 1,
              unitPrice: extractedStay,
              discount: 0,
              taxes: 0,
              total: extractedStay
            });
          }

          // Individual services should be stored separately in BILLING_ROWS

          // If we have admission fee extracted, we'll set it later in the main extraction
          // Don't set it here to avoid duplication
        } else {
          // Fall back to creating a single service entry with the total amount
          savedBillingRows = [
            {
              id: '1',
              serviceType: 'IPD Services & Treatment',
              particulars: 'IPD Services & Treatment (Complete Bill)',
              emergency: 'Yes',
              doctor: '',
              date: billingDate,
              quantity: 1,
              unitPrice: billAmount,
              discount: 0,
              taxes: 0,
              total: billAmount
            }
          ];
        }
      }

      // Find the patient from the current patients list
      logger.log('👤 Looking for patient with ID:', bill.patient_id);
      const patient = patients.find(p => p.id === bill.patient_id);

      if (patient) {
        setSelectedPatient(patient);
        const patientName = `${patient.first_name} ${patient.last_name} (${patient.patient_id})`;
        setPatientSearchTerm(patientName);
        logger.log('✅ Patient found and set:', patientName);
      } else {
        logger.warn('⚠️ Patient not found in current patients list');
        // Still proceed, but show warning
        toast.error('Patient not found in current list, but bill will load');
      }

      // Set the billing date - use original date from bill, but allow user to change it
      // CRITICAL FIX: Use transaction_date if available, otherwise fall back to created_at date
      const originalBillingDate = bill.transaction_date?.split('T')[0] ||
                                  bill.created_at?.split('T')[0] ||
                                  getLocalDateString();
      setBillingDate(originalBillingDate);
      logger.log('📅 Billing date set to original (editable):', originalBillingDate);
      logger.log('🔍 Date sources - transaction_date:', bill.transaction_date, 'created_at:', bill.created_at);

      // Populate the billing rows
      setBillingRows(savedBillingRows);
      logger.log('📋 Billing rows populated:', savedBillingRows.length, 'rows');

      // Map billing rows back to the correct state variables for calculations
      logger.log('🔄 Mapping billing rows to state variables...');

      // Create stay segments from billing rows
      const newStaySegments = [];
      const newSelectedServices = [];

      savedBillingRows.forEach((row, index) => {
        const serviceType = (row.serviceType || '').toLowerCase();
        const particulars = (row.particulars || '').toLowerCase();

        // Check if this is a stay/room related charge
        if (serviceType.includes('room') || serviceType.includes('stay') || serviceType.includes('nursing') ||
            particulars.includes('room') || particulars.includes('stay') || particulars.includes('nursing')) {

          // Add to stay segments
          const totalAmount = parseFloat(row.total) || 0;
          const days = Math.max(1, parseInt(row.quantity) || 1);

          // Calculate proper start and end dates based on the number of days
          const startDate = row.date || billingDate;
          const endDateObj = new Date(startDate);
          endDateObj.setDate(endDateObj.getDate() + days);
          const endDate = endDateObj.toISOString().split('T')[0];

          // Smart room type extraction from particulars
          const extractRoomType = (particulars: string): string => {
            const particularsUpper = particulars.toUpperCase();

            // First try to extract room type from the specific format: "ROOM_TYPE - Room Stay (X days)"
            const roomStayMatch = particularsUpper.match(/^(.+?)\s*-\s*ROOM STAY/);
            if (roomStayMatch) {
              // Found the exact format, return the room type part
              const roomType = roomStayMatch[1].trim();

              // CRITICAL FIX: Normalize room types to match dropdown options exactly
              const normalizedRoomType = roomType.toUpperCase();

              // Map to exact dropdown option values
              if (normalizedRoomType === 'ICU' || normalizedRoomType === 'INTENSIVE CARE UNIT') {
                return 'ICU';
              } else if (normalizedRoomType === 'CRITICAL CARE') {
                return 'ICU';  // Map to ICU for consistency
              } else if (normalizedRoomType === 'PRIVATE ROOM' || normalizedRoomType === 'PRIVATE') {
                return 'Private Room';
              } else if (normalizedRoomType === 'DELUXE ROOM' || normalizedRoomType === 'DELUXE') {
                return 'Deluxe';
              } else if (normalizedRoomType === 'SEMI PRIVATE' || normalizedRoomType === 'SEMI-PRIVATE') {
                return 'Semi Private';
              } else if (normalizedRoomType === 'GENERAL WARD' || normalizedRoomType === 'GENERAL') {
                return 'General Ward';
              } else {
                // For unknown room types, use proper title case with space handling
                return roomType.split(' ')
                  .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
                  .join(' ');
              }
            }

            // Fallback: Check for specific room types in the particulars text
            if (particularsUpper.includes('ICU')) return 'ICU';
            if (particularsUpper.includes('CRITICAL CARE')) return 'ICU';
            if (particularsUpper.includes('INTENSIVE CARE')) return 'ICU';
            if (particularsUpper.includes('PRIVATE ROOM') || particularsUpper.includes('PRIVATE')) return 'Private Room';
            if (particularsUpper.includes('DELUXE')) return 'Deluxe';
            if (particularsUpper.includes('AC ROOM') || particularsUpper.includes('A/C ROOM')) return 'AC Room';
            if (particularsUpper.includes('NON-AC') || particularsUpper.includes('NON AC')) return 'Non-AC Room';
            if (particularsUpper.includes('SEMI-PRIVATE') || particularsUpper.includes('SEMI PRIVATE')) return 'Semi Private';
            if (particularsUpper.includes('GENERAL WARD')) return 'General Ward';
            if (particularsUpper.includes('WARD')) return 'General Ward';

            // Default fallback
            return 'General Ward';
          };

          // Extract room type from the saved billing data
          const detectedRoomType = extractRoomType(row.particulars || row.serviceType || '');
          logger.log('🏨 Detected room type:', detectedRoomType, 'from:', row.particulars || row.serviceType);

          // Try to extract original individual charges if available in saved data
          // Look for detailed charge information in the bill description or additional fields
          let bedChargePerDay, nursingChargePerDay, rmoChargePerDay, doctorChargePerDay;

          const dailyTotal = totalAmount / days;

          // COMPREHENSIVE CHARGE RECONSTRUCTION LOGIC
          // Handle both new bills (with chargeBreakdown) and old bills (without chargeBreakdown)

          if (row.chargeBreakdown) {
            // NEW BILLS: Use saved detailed breakdown
            bedChargePerDay = parseFloat(row.chargeBreakdown.bedChargePerDay) || 0;
            nursingChargePerDay = parseFloat(row.chargeBreakdown.nursingChargePerDay) || 0;
            rmoChargePerDay = parseFloat(row.chargeBreakdown.rmoChargePerDay) || 0;
            doctorChargePerDay = parseFloat(row.chargeBreakdown.doctorChargePerDay) || 0;

            logger.log('✅ Using saved chargeBreakdown for accurate reconstruction');
          } else {
            // OLD BILLS: Smart reconstruction based on room type and saved data
            logger.log('⚠️ No chargeBreakdown found, using intelligent reconstruction');

            const effectiveDailyRate = parseFloat(row.unitPrice) || dailyTotal;

            // Enhanced room type specific charges (more realistic hospital rates)
            const roomTypeCharges = {
              'ICU': { bed: 3000, nursing: 800, rmo: 300, doctor: 1000 },
              'Critical Care': { bed: 3000, nursing: 800, rmo: 300, doctor: 1000 },
              'Private Room': { bed: 2000, nursing: 400, rmo: 200, doctor: 800 },
              'Deluxe': { bed: 2500, nursing: 500, rmo: 250, doctor: 900 },
              'AC Room': { bed: 1500, nursing: 300, rmo: 150, doctor: 600 },
              'Semi Private': { bed: 1200, nursing: 250, rmo: 120, doctor: 500 },
              'General Ward': { bed: 1000, nursing: 200, rmo: 100, doctor: 500 }
            };

            const defaultCharges = roomTypeCharges[detectedRoomType] || roomTypeCharges['General Ward'];

            // If the daily rate matches or is close to our standard rates, use them
            const standardTotal = defaultCharges.bed + defaultCharges.nursing + defaultCharges.rmo + defaultCharges.doctor;
            const rateDifference = Math.abs(effectiveDailyRate - standardTotal);

            if (rateDifference < standardTotal * 0.1) {
              // Rate is close to standard, use predefined charges
              bedChargePerDay = defaultCharges.bed;
              nursingChargePerDay = defaultCharges.nursing;
              rmoChargePerDay = defaultCharges.rmo;
              doctorChargePerDay = defaultCharges.doctor;
            } else {
              // Rate is different, scale proportionally
              const scaleFactor = effectiveDailyRate / standardTotal;
              bedChargePerDay = Math.round(defaultCharges.bed * scaleFactor * 100) / 100;
              nursingChargePerDay = Math.round(defaultCharges.nursing * scaleFactor * 100) / 100;
              rmoChargePerDay = Math.round(defaultCharges.rmo * scaleFactor * 100) / 100;
              doctorChargePerDay = Math.round(defaultCharges.doctor * scaleFactor * 100) / 100;
            }

            logger.log('📊 Reconstructed charges based on room type:', {
              roomType: detectedRoomType,
              effectiveDailyRate,
              standardTotal,
              scaleFactor: effectiveDailyRate / standardTotal,
              charges: { bedChargePerDay, nursingChargePerDay, rmoChargePerDay, doctorChargePerDay }
            });
          }

          const reconstructedSegment = {
            id: row.id || `stay-${index}`,
            roomType: detectedRoomType, // Extracted from billing data
            startDate: startDate,
            endDate: endDate,
            bedChargePerDay: bedChargePerDay,
            nursingChargePerDay: nursingChargePerDay,
            rmoChargePerDay: rmoChargePerDay,
            doctorChargePerDay: doctorChargePerDay
          };

          logger.log('🏗️ RECONSTRUCTED STAY SEGMENT:', reconstructedSegment);

          // CRITICAL: Alert if room type is wrong
          if (detectedRoomType === 'General Ward' && (
            row.particulars?.toUpperCase().includes('ICU') ||
            row.serviceType?.toUpperCase().includes('ICU')
          )) {
            logger.error('🚨 CRITICAL ISSUE: ICU room detected in particulars/serviceType but roomType defaulted to General Ward!');
            logger.error('🚨 This suggests room type extraction failed!');
            logger.error('🚨 Raw data:', { particulars: row.particulars, serviceType: row.serviceType });
          }

          newStaySegments.push(reconstructedSegment);

          logger.log('🏨 ✅ SUCCESSFULLY CREATED STAY SEGMENT:', reconstructedSegment);
          logger.log('🏨 📋 Segment details:', {
            roomType: reconstructedSegment.roomType,
            bedChargePerDay: reconstructedSegment.bedChargePerDay,
            nursingChargePerDay: reconstructedSegment.nursingChargePerDay,
            rmoChargePerDay: reconstructedSegment.rmoChargePerDay,
            doctorChargePerDay: reconstructedSegment.doctorChargePerDay
          });

        } else {
          // Add to selected services
          const serviceQuantity = parseInt(row.quantity) || 1;
          const serviceUnitPrice = parseFloat(row.unitPrice) || (parseFloat(row.total) || 0) / serviceQuantity;

          newSelectedServices.push({
            id: row.id || `service-${index}`,
            name: row.serviceType || row.particulars || 'Medical Service',
            selected: true,
            quantity: serviceQuantity,
            amount: serviceUnitPrice
          });

          logger.log('🩺 Mapped to service:', {
            name: row.serviceType || row.particulars,
            quantity: serviceQuantity,
            unitPrice: serviceUnitPrice,
            total: row.total
          });
        }
      });

      // CRITICAL FIX: Use functional update to ensure state integrity
      logger.log('🔄 ABOUT TO SET STAY SEGMENTS WITH FUNCTIONAL UPDATE:', newStaySegments);

      setStaySegments((prevSegments) => {
        logger.log('🔄 FUNCTIONAL UPDATE: Previous segments:', prevSegments);
        logger.log('🔄 FUNCTIONAL UPDATE: New segments:', newStaySegments);

        // AGGRESSIVE PROTECTION: Create backup and activate protection
        correctStateBackupRef.current = [...newStaySegments];
        stateProtectionActiveRef.current = true;
        logger.log('🛡️ STATE PROTECTION ACTIVATED: Backup created');
        logger.log('🛡️ Backup contains:', newStaySegments.map((s, i) => `${s.roomType} - ₹${s.bedChargePerDay}`));

        // Start periodic state monitoring
        const protectionInterval = setInterval(() => {
          if (!stateProtectionActiveRef.current) {
            clearInterval(protectionInterval);
            return;
          }

          // Check if state got corrupted and restore immediately
          if (staySegments.length > 0 && correctStateBackupRef.current) {
            const currentFirst = staySegments[0];
            const backupFirst = correctStateBackupRef.current[0];

            if (currentFirst.roomType === 'General Ward' && currentFirst.bedChargePerDay === 1000 &&
                backupFirst.roomType !== 'General Ward' && backupFirst.bedChargePerDay !== 1000) {
              logger.log('🚨 PERIODIC CHECK: State corruption detected, restoring immediately!');
              _setStaySegments([...correctStateBackupRef.current]);
            }
          }
        }, 100); // Check every 100ms

        return newStaySegments;
      });

      setSelectedServices(newSelectedServices);

      logger.log('✅ State mapping completed:');
      logger.log('   - Stay segments:', newStaySegments.length);
      logger.log('   - Selected services:', newSelectedServices.length);

      // CRITICAL: Set a flag to prevent other state updates
      const preserveStateTimer = setTimeout(() => {
        logger.log('🔒 State preservation period ended');
      }, 1000);

      // CRITICAL: Multiple verifications to catch when state gets overridden
      setTimeout(() => {
        logger.log('🔍 VERIFICATION 1 (50ms): Stay segments after setState:', JSON.stringify(staySegments, null, 2));
      }, 50);

      setTimeout(() => {
        logger.log('🔍 VERIFICATION 2 (200ms): Stay segments after setState:', JSON.stringify(staySegments, null, 2));
      }, 200);

      setTimeout(() => {
        logger.log('🔍 VERIFICATION 3 (500ms): Stay segments after setState:', JSON.stringify(staySegments, null, 2));
      }, 500);

      // Populate other bill details for editing using exact extracted values
      const totalAmount = bill.amount || 0;
      const descriptionText = bill.description || '';

      // Extract payment mode from the bill data
      const paymentMode = bill.payment_mode || 'CASH';
      setFinalPaymentMode(paymentMode);
      logger.log('💳 Payment mode set to:', paymentMode);

      // Set ward category from description if available, otherwise default
      if (descriptionText.includes('ICU')) {
        setWardCategory('ICU');
      } else if (descriptionText.includes('DELUXE')) {
        setWardCategory('Deluxe');
      } else if (descriptionText.includes('PRIVATE')) {
        setWardCategory('Private');
      } else {
        setWardCategory('Emergency'); // Default
      }
      logger.log('🏥 Ward category set from description');

      // Extract exact values from bill description (same extraction as billing rows)
      const admissionMatch = descriptionText.match(/Admission:\s*₹(\d+(?:\.\d{2})?)/);
      const discountMatch = descriptionText.match(/Discount:\s*₹(\d+(?:\.\d{2})?)/);
      const taxMatch = descriptionText.match(/Tax:\s*₹(\d+(?:\.\d{2})?)/);

      // Check if this is a comprehensive bill to handle admission fee correctly
      const billingRowsTotal = savedBillingRows.reduce((sum, row) => sum + (parseFloat(row.total) || 0), 0);
      const isComprehensiveBill = savedBillingRows.length === 1 && Math.abs(billingRowsTotal - (totalAmount || 0)) < 1;

      // Set exact admission fee from description
      if (isComprehensiveBill) {
        logger.log('🔍 COMPREHENSIVE BILL - Setting admission fee to 0 (total is in service)');
        setAdmissionFee(0);
      } else if (admissionMatch) {
        const extractedAdmissionFee = parseFloat(admissionMatch[1]) || 0;
        setAdmissionFee(extractedAdmissionFee);
        logger.log('🏨 Admission fee extracted exactly:', extractedAdmissionFee);
      } else {
        // Calculate admission fee to balance the total
        // Total = Admission + Stay + Services - Discount + Tax
        // So Admission = Total - Stay - Services + Discount - Tax
        const stayTotal = savedBillingRows.reduce((sum, row) => sum + (parseFloat(row.total) || 0), 0);
        const extractedDiscount = discountMatch ? (parseFloat(discountMatch[1]) || 0) : 0;
        const extractedTax = taxMatch ? (parseFloat(taxMatch[1]) || 0) : 0;

        const calculatedAdmission = Math.max(0, (totalAmount || 0) - stayTotal + extractedDiscount - extractedTax);
        setAdmissionFee(calculatedAdmission);
        logger.log('🏨 Admission fee calculated to balance total:', calculatedAdmission);
        logger.log('🔍 CALCULATION BREAKDOWN:');
        logger.log('   - Total amount:', totalAmount);
        logger.log('   - Stay/Services total:', stayTotal);
        logger.log('   - Extracted discount:', extractedDiscount);
        logger.log('   - Extracted tax:', extractedTax);
        logger.log('   - Formula: ', totalAmount, '-', stayTotal, '+', extractedDiscount, '-', extractedTax, '=', calculatedAdmission);
      }

      // Set exact discount from description
      if (discountMatch) {
        const extractedDiscount = parseFloat(discountMatch[1]) || 0;
        setDiscount(extractedDiscount);
        logger.log('💸 Discount extracted exactly:', extractedDiscount);
      } else {
        setDiscount(0);
        logger.log('💸 No discount found in description, set to 0');
      }

      // Set exact tax from description
      if (taxMatch) {
        const extractedTax = parseFloat(taxMatch[1]) || 0;
        setTax(extractedTax);
        logger.log('📊 Tax extracted exactly:', extractedTax);
      } else {
        setTax(0);
        logger.log('📊 No tax found in description, set to 0');
      }

      logger.log('💰 Bill total amount:', totalAmount, '(exact values extracted for editing)');

      // Set the editing state
      setEditingBill(bill);
      logger.log('✏️ Editing state set');

      // Open the create/edit form
      setShowCreateBill(true);
      logger.log('📝 Form opened for editing');

      // CRITICAL: Clear editing flag after a delay to allow state to settle
      setTimeout(() => {
        isEditingRef.current = false;
        stateProtectionActiveRef.current = false;
        logger.log('🔓 EDITING REF SET TO FALSE - State should now be stable');
        logger.log('🛡️ STATE PROTECTION DEACTIVATED');
      }, 2000);

      // Final summary of what was set
      logger.log('🎯 FINAL EDIT STATE SUMMARY:');
      logger.log('   - Original bill amount:', bill.amount);
      logger.log('   - Billing rows loaded:', savedBillingRows.length);
      logger.log('   - Current admission fee state will be:', admissionMatch ? parseFloat(admissionMatch[1]) : 'calculated');
      logger.log('   - Current discount state will be:', discountMatch ? parseFloat(discountMatch[1]) : 0);
      logger.log('   - Current tax state will be:', taxMatch ? parseFloat(taxMatch[1]) : 0);
      logger.log('   - Expected total calculation will be: admission + services - discount + tax');

      toast.success('Bill loaded for editing successfully!');

    } catch (error) {
      logger.error('❌ Detailed error in handleEditBill:', error);
      logger.error('❌ Error stack:', error.stack);
      toast.error(`Failed to load bill for editing: ${error.message}`);

      // Even if there's an error, try to open the form with basic data
      try {
        setEditingBill(bill);
        // Set the original billing date, but user can change it via the date input field
        setBillingDate(bill.transaction_date?.split('T')[0] || bill.created_at?.split('T')[0] || getLocalDateString());
        // Note: Total will be calculated dynamically from billing rows
        setShowCreateBill(true);
        toast.error('Bill loaded with limited data due to parsing error');
      } catch (fallbackError) {
        logger.error('❌ Even fallback failed:', fallbackError);
      }
    }
  };


  // Handler for Print Bill button with exact ReceiptTemplate format
  const handlePrintBill = async (bill: any) => {

    logger.log('🚨🚨🚨 PRINT BILL FUNCTION CALLED 🚨🚨🚨');
    logger.log('🚨 RAW BILL OBJECT:', bill);

    // 🔍 ENHANCEMENT: Fetch discharge date if patient has been discharged
    if (bill.patients?.id && bill.patients?.ipd_status === 'DISCHARGED') {
      try {
        // Try to get discharge date from patient_admissions table
        const { data: admissionData, error: admissionError } = await supabase
          .from('patient_admissions')
          .select('discharge_date, updated_at, status')
          .eq('patient_id', bill.patients.id)
          .eq('status', 'DISCHARGED')
          .order('updated_at', { ascending: false })
          .limit(1)
          .single();

        if (!admissionError && admissionData?.discharge_date) {
          bill.patients.discharge_date = admissionData.discharge_date;
          logger.log('✅ Fetched discharge date from admissions:', admissionData.discharge_date);
        } else if (!admissionError && admissionData?.updated_at) {
          // Use updated_at as fallback
          bill.patients.discharge_date = admissionData.updated_at;
          logger.log('✅ Using admission updated_at as discharge date:', admissionData.updated_at);
        }

        // Also try to get from discharge_summaries table as alternative
        if (!bill.patients.discharge_date) {
          const { data: dischargeSummary, error: summaryError } = await supabase
            .from('discharge_summaries')
            .select('created_at, discharge_date')
            .eq('patient_id', bill.patients.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

          if (!summaryError && dischargeSummary) {
            bill.patients.discharge_date = dischargeSummary.discharge_date || dischargeSummary.created_at;
            logger.log('✅ Fetched discharge date from discharge_summaries:', bill.patients.discharge_date);
          }
        }
      } catch (error) {
        logger.error('❌ Error fetching discharge date:', error);
      }
    }

    // 🔍 ENHANCEMENT: Fetch ipd_number if missing from patient admissions
    if (bill.patients?.id && (!bill.patients?.ipd_number || bill.patients?.ipd_number === 'N/A')) {
      try {
        const { data: admissionData, error: admissionError } = await supabase
          .from('patient_admissions')
          .select('ipd_number')
          .eq('patient_id', bill.patients.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        if (!admissionError && admissionData?.ipd_number) {
          bill.patients.ipd_number = admissionData.ipd_number;
          logger.log('✅ Fetched ipd_number from patient_admissions:', admissionData.ipd_number);
        } else {
          // Fallback: try to get ipd_number from patients table directly
          const { data: patientData, error: patientError } = await supabase
            .from('patients')
            .select('ipd_number')
            .eq('id', bill.patients.id)
            .single();

          if (!patientError && patientData?.ipd_number) {
            bill.patients.ipd_number = patientData.ipd_number;
            logger.log('✅ Fetched ipd_number from patients table:', patientData.ipd_number);
          }
        }
      } catch (error) {
        logger.error('❌ Error fetching ipd_number:', error);
      }
    }

    // 🔍 DEBUG: Check patient data available for printing
    logger.log('🖨️ PRINT BILL DEBUG - Patient data available:', {
      'Bill ID': bill.id,
      'Patient object exists?': !!bill.patients,
      'Patient name': bill.patients ? `${bill.patients.first_name} ${bill.patients.last_name}` : 'N/A',
      'Patient age': bill.patients?.age || 'MISSING',
      'Patient gender': bill.patients?.gender || 'MISSING',
      'Assigned doctor': bill.patients?.assigned_doctor || 'MISSING',
      'Doctor name': bill.patients?.doctor_name || 'MISSING',
      'IPD bed number': bill.patients?.ipd_bed_number || 'MISSING',
      'Direct admission date': bill.patients?.admission_date || 'MISSING',
      'Direct discharge date': bill.patients?.discharge_date || 'MISSING',
      'Direct room type': bill.patients?.room_type || 'MISSING',
      'IPD number': bill.patients?.ipd_number || 'MISSING',
      'IPD Status': bill.patients?.ipd_status || 'MISSING',
      'Admissions array exists?': !!bill.patients?.admissions,
      'Admissions length': bill.patients?.admissions?.length || 0,
      'First admission data': bill.patients?.admissions?.[0],
      'Full patient object': bill.patients
    });

    // Check if we can extract services from description directly
    if (bill.description?.includes('BILLING_ROWS:')) {
      const match = bill.description.match(/BILLING_ROWS:\s*(\[[\s\S]*?\])/);
      if (match) {
        logger.log('🔍 Raw BILLING_ROWS in description:');
        logger.log(match[1].substring(0, 500) + '...');
      }
    }
    // Create a temporary canvas to load and convert the image to base64
    const convertImageToBase64 = () => {
      return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          canvas.width = img.width;
          canvas.height = img.height;
          ctx?.drawImage(img, 0, 0);
          const dataURL = canvas.toDataURL('image/png');
          resolve(dataURL);
        };
        img.onerror = () => reject('Failed to load image');
        img.src = '/Receipt2.png';
      });
    };

    // Use actual billing rows data for services breakdown
    const printServices = [];

    // Check if this is a deposit transaction
    const isDepositTransaction = ['ADMISSION_FEE', 'DEPOSIT', 'ADVANCE_PAYMENT'].includes(bill.transaction_type);

    // Extract the exact services data from the saved bill
    let billRows = [];

    logger.log('🔍 Extracting services from saved bill data...');
    logger.log('🔍 Bill description preview:', bill.description?.substring(0, 300));

    // Parse BILLING_ROWS from description
    if (bill.description && bill.description.includes('BILLING_ROWS:')) {
      try {
        // Multiple regex patterns to extract BILLING_ROWS
        let billingRowsMatch = bill.description.match(/BILLING_ROWS:\s*(\[[\s\S]*?\])(?:\s*$|$)/);
        if (!billingRowsMatch) {
          billingRowsMatch = bill.description.match(/BILLING_ROWS:\s*(\[[\s\S]*)/);
          if (billingRowsMatch) {
            let rawJson = billingRowsMatch[1];
            const lastBracket = rawJson.lastIndexOf(']');
            if (lastBracket !== -1) {
              rawJson = rawJson.substring(0, lastBracket + 1);
            }
            billingRowsMatch[1] = rawJson;
          }
        }

        if (billingRowsMatch) {
          billRows = JSON.parse(billingRowsMatch[1]);
        }
      } catch (error) {
        logger.error('❌ Failed to parse BILLING_ROWS:', error);
      }
    }

    // If no billing rows found, try to extract basic amounts from description
    if (billRows.length === 0) {
      const descriptionText = bill.description || '';
      const admissionMatch = descriptionText.match(/Admission:\s*₹(\d+(?:\.\d{2})?)/);
      const stayMatch = descriptionText.match(/Stay:\s*₹(\d+(?:\.\d{2})?)/);

      if (admissionMatch && parseFloat(admissionMatch[1]) > 0) {
        billRows.push({
          serviceType: 'Admission Fee',
          particulars: 'Hospital Admission Charges',
          quantity: 1,
          unitPrice: parseFloat(admissionMatch[1]),
          total: parseFloat(admissionMatch[1])
        });
      }

      if (stayMatch && parseFloat(stayMatch[1]) > 0) {
        billRows.push({
          serviceType: 'Room & Stay Charges',
          particulars: 'Room & Stay Charges',
          quantity: 1,
          unitPrice: parseFloat(stayMatch[1]),
          total: parseFloat(stayMatch[1])
        });
      }
    }

    // Handle deposit transactions differently - override services display
    if (isDepositTransaction) {
      const paymentMode = bill.payment_mode || 'CASH';
      printServices.push({
        sr: 1,
        service: `Advance Payment (${paymentMode})`,
        qty: 1,
        rate: bill.amount || 0,
        amount: bill.amount || 0
      });
    }
    // Process all individual services from BILLING_ROWS for non-deposit transactions
    else if (billRows && billRows.length > 0) {
      billRows.forEach((row, index) => {
        const serviceName = row.particulars || row.serviceType || `Service ${index + 1}`;
        const quantity = parseInt(row.quantity) || 1;
        const unitPrice = parseFloat(row.unitPrice) || 0;
        const total = parseFloat(row.total) || (quantity * unitPrice);

        // Special handling for grouped "Medical Services & Treatment"
        if ((serviceName === 'Medical Services & Treatment' ||
             serviceName.includes('Medical Services')) && total === 1500) {

          // Look for actual individual services in the BILLING_ROWS
          const actualIndividualServices = billRows.filter(billRow => {
            const rowService = (billRow.serviceType || billRow.particulars || '').toLowerCase();
            const isNotGrouped = !rowService.includes('medical services') &&
                                !rowService.includes('admission') &&
                                !rowService.includes('room') &&
                                !rowService.includes('stay');
            const hasAmount = billRow.total > 0;
            return isNotGrouped && hasAmount;
          });

          if (actualIndividualServices.length > 0) {
            actualIndividualServices.forEach((service, serviceIndex) => {
              printServices.push({
                sr: printServices.length + 1,
                service: service.particulars || service.serviceType,
                qty: service.quantity || 1,
                rate: service.unitPrice || service.total,
                amount: service.total
              });
            });
          } else {
            // Keep as grouped service since we don't have real data
            printServices.push({
              sr: printServices.length + 1,
              service: serviceName,
              qty: quantity,
              rate: unitPrice,
              amount: total
            });
          }

        } else {
          // Regular service processing
          if (total > 0 || unitPrice > 0) {
            printServices.push({
              sr: printServices.length + 1,
              service: serviceName,
              qty: quantity,
              rate: unitPrice,
              amount: total
            });
          }
        }
      });
    } else if (!isDepositTransaction) {
      // Fallback: Try to extract basic amounts from description (only for non-deposit transactions)
      const descriptionText = bill.description || '';
      let serviceIndex = 1;

      const admissionMatch = descriptionText.match(/Admission:\s*₹(\d+(?:\.\d{2})?)/);
      const stayMatch = descriptionText.match(/Stay:\s*₹(\d+(?:\.\d{2})?)/);
      const servicesMatch = descriptionText.match(/Services:\s*₹(\d+(?:\.\d{2})?)/);

      if (admissionMatch && parseFloat(admissionMatch[1]) > 0) {
        printServices.push({
          sr: serviceIndex++,
          service: 'Hospital Admission Charges',
          qty: 1,
          rate: parseFloat(admissionMatch[1]),
          amount: parseFloat(admissionMatch[1])
        });
      }

      if (stayMatch && parseFloat(stayMatch[1]) > 0) {
        printServices.push({
          sr: serviceIndex++,
          service: 'Room & Stay Charges',
          qty: 1,
          rate: parseFloat(stayMatch[1]),
          amount: parseFloat(stayMatch[1])
        });
      }

      if (servicesMatch && parseFloat(servicesMatch[1]) > 0) {
        printServices.push({
          sr: serviceIndex++,
          service: 'Medical Services (Details Not Available)',
          qty: 1,
          rate: parseFloat(servicesMatch[1]),
          amount: parseFloat(servicesMatch[1])
        });
      }
    }

    // Calculate correct totals from printServices, not from bill.amount
    const servicesTotal = printServices.reduce((sum, service) => sum + (parseFloat(service.amount) || 0), 0);

    // Convert image and create print window
    convertImageToBase64().then((base64Image) => {
      createPrintWindow(base64Image as string);
    }).catch((error) => {
      logger.error('Failed to load Receipt.png:', error);
      // Create print window without background image
      createPrintWindow('');
    });

    const createPrintWindow = (backgroundImage: string) => {
      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        toast.error('Unable to open print window');
        return;
      }
    
    // Function to convert number to words
    const convertToWords = (num) => {
      if (num === 0) return 'Zero Rupees Only';
      
      const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
      const teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
      const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
      
      const convertHundreds = (n) => {
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

    // Extract actual discount and tax from bill description
    const descriptionText = bill.description || '';
    const discountMatch = descriptionText.match(/Discount:\s*₹(\d+(?:\.\d{2})?)/);
    const taxMatch = descriptionText.match(/Tax:\s*₹(\d+(?:\.\d{2})?)/);
    const netMatch = descriptionText.match(/Net:\s*₹(\d+(?:\.\d{2})?)/);

    const actualDiscount = discountMatch ? parseFloat(discountMatch[1]) : 0;
    const actualTax = taxMatch ? parseFloat(taxMatch[1]) : 0;
    const actualNetAmount = netMatch ? parseFloat(netMatch[1]) : bill.amount;

    // Calculate totals based on actual printServices and charges from bill
    const calculatedServicesTotal = printServices.reduce((sum, service) => sum + (parseFloat(service.amount) || 0), 0);

    const totals = {
      subtotal: calculatedServicesTotal,
      discount: actualDiscount,
      insurance: 0,
      netAmount: actualNetAmount || calculatedServicesTotal,
      amountPaid: actualNetAmount || calculatedServicesTotal,
      balance: 0
    };

    // Paginate services - 13 entries per page
    const SERVICES_PER_PAGE = 13;
    const servicePages: typeof printServices[] = [];
    for (let i = 0; i < printServices.length; i += SERVICES_PER_PAGE) {
      servicePages.push(printServices.slice(i, i + SERVICES_PER_PAGE));
    }

    // Generate individual page HTML
    const generateServicePage = (services: typeof printServices, pageIndex: number, isLastPage: boolean) => {
      const startSr = pageIndex * SERVICES_PER_PAGE + 1;

      return `
        <div class="receipt-template" style="
          width: 297mm;
          height: 420mm;
          padding: 0 !important;
          margin: 0 !important;
          border: none !important;
          position: relative;
        ">

          <!-- Background Image - positioned absolutely -->
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

          <!-- Content starts after header -->
          <div style="margin-top: 0; padding: 300px 30px 0 30px; position: relative; z-index: 2;">

          ${pageIndex === 0 ? `
            <!-- IPD BILL/DEPOSIT Title at Top Center (only on first page) -->
            <div style="text-align: center; margin-bottom: 25px;">
              <h1 style="font-size: 28px; font-weight: bold; color: black; margin: 0; letter-spacing: 2px;">${isDepositTransaction ? 'IPD DEPOSIT' : 'IPD BILL'}</h1>
            </div>

            <!-- Header Information (only on first page) -->
            <div style="display: grid; grid-template-columns: 1fr 1fr; margin-bottom: 25px; font-size: 16px; color: black;">
              <div>
                <p style="margin: 5px 0;"><strong>DATE:</strong> ${new Date().toLocaleDateString('en-IN')}</p>
                <p style="margin: 5px 0;"><strong>TIME:</strong> ${getCurrentTime()}</p>
              </div>
              <div style="text-align: right;">
                <p style="margin: 5px 0;"><strong>PAYMENT MODE:</strong> ${bill.payment_mode || 'UPI'}</p>
              </div>
            </div>

            <!-- Patient Information Section (only on first page) -->
            <div style="margin-bottom: 30px;">
              <h3 style="
                font-weight: bold;
                margin-bottom: 15px;
                color: black;
                font-size: 18px;
                text-decoration: underline;
              ">Patient & IPD Information</h3>
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 25px; font-size: 16px;">
                <div>
                  <p style="color: black; margin: 6px 0;"><strong>BILL NO.:</strong> ${bill.transaction_reference || bill.id}</p>
                  <p style="color: black; margin: 6px 0;"><strong>BILL DATE:</strong> ${bill.transaction_date ? new Date(bill.transaction_date).toLocaleDateString('en-IN') : (bill.created_at ? new Date(bill.created_at).toLocaleDateString('en-IN') : 'N/A')}</p>
                  <p style="color: black; margin: 6px 0;"><strong>PATIENT ID:</strong> ${bill.patients?.patient_id || 'N/A'}</p>
                  <p style="color: black; margin: 6px 0;"><strong>PATIENT NAME:</strong> ${bill.patients?.first_name || ''} ${bill.patients?.last_name || ''}</p>
                  <p style="color: black; margin: 6px 0;"><strong>AGE/SEX:</strong> ${bill.patients?.age || 'N/A'} years / ${bill.patients?.gender || 'N/A'}</p>
                  <p style="color: black; margin: 6px 0;"><strong>MOBILE:</strong> ${bill.patients?.phone || 'N/A'}</p>
                </div>
                <div>
                  <p style="color: black; margin: 6px 0;"><strong>DR NAME:</strong> ${bill.patients?.assigned_doctor || bill.patients?.doctor_name || bill.doctor_name || 'N/A'}</p>
                  <p style="color: black; margin: 6px 0;"><strong>IPD NO.:</strong> ${bill.patients?.ipd_number || 'N/A'}</p>
                  <p style="color: black; margin: 6px 0;"><strong>ADMISSION DATE:</strong> ${(bill.patients?.admission_date) ? new Date(bill.patients.admission_date).toLocaleDateString('en-IN') : ((bill.patients?.admissions && bill.patients.admissions[0]?.admission_date) ? new Date(bill.patients.admissions[0].admission_date).toLocaleDateString('en-IN') : 'N/A')}</p>
                  <p style="color: black; margin: 6px 0;"><strong>DISCHARGE DATE:</strong> ${(bill.patients?.discharge_date) ? new Date(bill.patients.discharge_date).toLocaleDateString('en-IN') : ((bill.patients?.admissions && bill.patients.admissions[0]?.discharge_date) ? new Date(bill.patients.admissions[0].discharge_date).toLocaleDateString('en-IN') : 'Not Discharged')}</p>
                  <p style="color: black; margin: 6px 0;"><strong>ROOM TYPE:</strong> ${bill.patients?.room_type || (bill.patients?.admissions && bill.patients.admissions[0]?.room_type) || 'N/A'}</p>
                  <p style="color: black; margin: 6px 0;"><strong>BED NO.:</strong> ${bill.patients?.ipd_bed_number || bill.patients?.bed_number || 'N/A'}</p>
                </div>
              </div>
            </div>
          ` : `
            <!-- Continuation header for subsequent pages -->
            <div style="margin-bottom: 25px;">
              <h3 style="
                font-weight: bold;
                color: black;
                font-size: 18px;
                text-align: center;
              ">Bill Continued - Page ${pageIndex + 1}</h3>
              <p style="text-align: center; color: black; margin: 10px 0;">
                <strong>BILL NO.:</strong> ${bill.transaction_reference || bill.id} |
                <strong>PATIENT:</strong> ${bill.patients?.first_name || ''} ${bill.patients?.last_name || ''}
              </p>
            </div>
          `}

          <!-- Services & Charges Section -->
          <div style="margin-bottom: 25px;">
            <h3 style="
              font-weight: bold;
              margin-bottom: 15px;
              color: black;
              font-size: 18px;
              text-decoration: underline;
            ">Services & Charges ${pageIndex > 0 ? '(Continued)' : ''}</h3>
            <table style="width: 100%; border-collapse: collapse; border: 1px solid black;">
              <thead>
                <tr style="background-color: #f5f5f5;">
                  <th style="border: 1px solid black; padding: 12px; text-align: center; color: black; font-weight: bold; font-size: 16px;">Sr</th>
                  <th style="border: 1px solid black; padding: 12px; text-align: left; color: black; font-weight: bold; font-size: 16px;">Service</th>
                  <th style="border: 1px solid black; padding: 12px; text-align: center; color: black; font-weight: bold; font-size: 16px;">Qty</th>
                  <th style="border: 1px solid black; padding: 12px; text-align: center; color: black; font-weight: bold; font-size: 16px;">Rate (₹)</th>
                  <th style="border: 1px solid black; padding: 12px; text-align: center; color: black; font-weight: bold; font-size: 16px;">Discount</th>
                  <th style="border: 1px solid black; padding: 12px; text-align: center; color: black; font-weight: bold; font-size: 16px;">Amount (₹)</th>
                  <th style="border: 1px solid black; padding: 12px; text-align: center; color: black; font-weight: bold; font-size: 16px;">Payment Mode</th>
                </tr>
              </thead>
              <tbody>
                ${services.map((service, index) => `
                  <tr>
                    <td style="border: 1px solid black; padding: 10px; text-align: center; color: black; font-size: 14px;">${startSr + index}</td>
                    <td style="border: 1px solid black; padding: 10px; color: black; font-size: 14px;">${service.service}</td>
                    <td style="border: 1px solid black; padding: 10px; text-align: center; color: black; font-size: 14px;">${service.qty}</td>
                    <td style="border: 1px solid black; padding: 10px; text-align: center; color: black; font-size: 14px;">₹${service.rate.toFixed(2)}</td>
                    <td style="border: 1px solid black; padding: 10px; text-align: center; color: black; font-size: 14px;">-</td>
                    <td style="border: 1px solid black; padding: 10px; text-align: center; color: black; font-size: 14px;">₹${service.amount.toFixed(2)}</td>
                    <td style="border: 1px solid black; padding: 10px; text-align: center; color: black; font-size: 14px;">${bill.payment_mode || 'UPI'}</td>
                  </tr>
                `).join('')}
                ${isLastPage ? `
                  <!-- Net Amount Paid Row (only on last page) -->
                  <tr style="background-color: #f0f0f0;">
                    <td colspan="7" style="border: 1px solid black; padding: 15px; text-align: center; color: black; font-weight: bold; font-size: 18px;">
                      Net Amount Paid: ₹${totals.netAmount.toFixed(2)}
                    </td>
                  </tr>
                ` : ''}
              </tbody>
            </table>
            ${!isLastPage ? `
              <p style="text-align: right; margin-top: 10px; font-style: italic; color: black;">
                Continued on next page...
              </p>
            ` : ''}
          </div>

          ${isLastPage ? `
            <!-- Amount in Words (only on last page) -->
            <div style="text-align: center; margin-bottom: 25px; padding: 15px; background-color: #f9f9f9; border: 1px solid #ddd;">
              <p style="font-size: 16px; color: black; margin: 0;"><strong>Amount in Words:</strong> ${convertToWords(totals.netAmount)}</p>
            </div>

            <!-- Signature Section (only on last page) -->
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-top: 40px; margin-bottom: 30px;">
              <div style="text-align: center; border-top: 2px solid black; padding-top: 8px;">
                <p style="font-size: 14px; color: black; margin: 0;">Patient/Guardian Signature</p>
              </div>
              <div style="text-align: center; border-top: 2px solid black; padding-top: 8px;">
                <p style="font-size: 14px; color: black; margin: 0;">Authorized Signature</p>
                <p style="font-size: 12px; color: black; margin: 4px 0 0 0;">Hospital Administrator</p>
              </div>
            </div>

            <!-- Footer (only on last page) -->
            <div style="text-align: center; margin-top: 25px;">
            </div>
          ` : `
            <!-- Page indicator -->
            <div style="text-align: center; margin-top: 20px;">
              <p style="font-size: 12px; color: #666;">Page ${pageIndex + 1} of ${servicePages.length}</p>
            </div>
          `}

          </div>
        </div>
      `;
    };

    const billHTML = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>IPD Bill - ${bill.transaction_reference || bill.id}</title>
          <style>
            @page {
              margin: 0 !important;
              padding: 0 !important;
              border: none !important;
              size: A3 portrait;
              width: 297mm;
              height: 420mm;
            }

            @media print {
              body {
                margin: 0 !important;
                padding: 0 !important;
                border: none !important;
                width: 297mm;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
                color-adjust: exact !important;
              }
              html {
                margin: 0 !important;
                padding: 0 !important;
                border: none !important;
              }
              .receipt-template {
                width: 297mm !important;
                height: 420mm !important;
                margin: 0 !important;
                padding: 0 !important;
                border: none !important;
                page-break-after: always !important;
                break-after: page !important;
                page-break-inside: avoid !important;
                break-inside: avoid !important;
                position: relative !important;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
                color-adjust: exact !important;
              }
              .receipt-template:last-child {
                page-break-after: auto !important;
                break-after: auto !important;
              }
              .receipt-template img {
                display: block !important;
                visibility: visible !important;
                opacity: 1 !important;
                width: 297mm !important;
                height: 420mm !important;
                position: absolute !important;
                top: 0 !important;
                left: 0 !important;
                z-index: 0 !important;
                object-fit: stretch !important;
              }
              .print\\:hidden {
                display: none !important;
              }
              .receipt-template p, 
              .receipt-template span, 
              .receipt-template div, 
              .receipt-template h1, 
              .receipt-template h2, 
              .receipt-template h3, 
              .receipt-template h4,
              .receipt-template table, 
              .receipt-template td, 
              .receipt-template th {
                color: black !important;
                border-color: #333 !important;
              }
              .receipt-template table, 
              .receipt-template th, 
              .receipt-template td {
                border: 1px solid black !important;
              }
              .receipt-template .text-right {
                text-align: right !important;
              }
              .receipt-template p,
              .receipt-template strong {
                color: black !important;
              }
              .receipt-template * {
                color: black !important;
              }
              /* Force background colors and images to print */
              * {
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
                color-adjust: exact !important;
              }
              /* Ensure background images are not filtered out */
              @media print {
                body {
                  background-attachment: scroll !important;
                }
                .receipt-template {
                  background-attachment: scroll !important;
                }
              }
            }
            
            html, body {
              font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, 'Noto Sans', sans-serif;
              margin: 0 !important;
              padding: 0 !important;
              border: none !important;
              background: white;
              width: 297mm;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
              color-adjust: exact;
            }

            .receipt-template {
              ${backgroundImage ? `background: url('${backgroundImage}') no-repeat center top;` : ''}
              background-size: 297mm 420mm;
              margin: 0 !important;
              padding: 0 !important;
              border: none !important;
              width: 297mm;
              height: 420mm;
              position: relative;
              page-break-after: always;
              break-after: page;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
              color-adjust: exact;
            }

            .receipt-template:last-child {
              page-break-after: auto;
              break-after: auto;
            }
          </style>
        </head>
        <body>
          ${servicePages.map((pageServices, pageIndex) =>
            generateServicePage(pageServices, pageIndex, pageIndex === servicePages.length - 1)
          ).join('')}
        </body>
      </html>
    `;
    
      printWindow.document.write(billHTML);
      printWindow.document.close();
      
      // Wait a moment for rendering then print
      setTimeout(() => {
        printWindow.print();
      }, 1000);
      
      logger.log('Print bill with proper receipt format:', bill);
    };
  };

  // Handler for Delete Bill button
  const handleDeleteBill = async (bill: any) => {
    const billRef = bill.transaction_reference || bill.id;
    const patientName = `${bill.patients?.first_name || ''} ${bill.patients?.last_name || ''}`.trim() || 'Unknown Patient';
    
    logger.log('🗑️ BEFORE DELETE - Bill details:', {
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
      logger.log('🚫 Delete cancelled by user');
      return;
    }
    
    try {
      logger.log('🗑️ Attempting to delete bill with ID:', bill.id);
      logger.log('🗑️ Delete query conditions:', {
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
        
      logger.log('🔍 Record check before deletion:', { data: existingRecord, error: checkError });
      
      if (checkError || !existingRecord) {
        logger.error('❌ Record not found before deletion:', checkError);
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
        logger.log('🔄 Direct deletion failed, trying soft delete (status update)...');
        
        const { data: updateResult, error: updateError } = await supabase
          .from('patient_transactions')
          .update({ 
            status: 'DELETED',
            description: (bill.description || '') + ' [DELETED]'
          })
          .eq('id', bill.id)
          .select();
          
        logger.log('🔄 Soft delete result:', { data: updateResult, error: updateError });
        
        if (!updateError && updateResult && updateResult.length > 0) {
          logger.log('✅ Bill marked as deleted (soft delete)');
          toast.success(`IPD bill ${billRef} deleted successfully`);
          await loadIPDBills();
          return;
        }
      }
        
      logger.log('🗑️ Delete operation result:', { data: deleteResult, error: deleteError });
      
      if (deleteError) {
        logger.error('❌ Delete operation failed:', deleteError);
        logger.error('❌ Delete error details:', {
          message: deleteError.message,
          details: deleteError.details,
          hint: deleteError.hint,
          code: deleteError.code
        });
        throw deleteError;
      }
      
      if (!deleteResult || deleteResult.length === 0) {
        logger.warn('⚠️ Delete operation returned no results - record may not exist');
        toast.error('Bill may have already been deleted');
      } else {
        logger.log('✅ Bill deleted successfully:', deleteResult);
        toast.success(`IPD bill ${billRef} deleted successfully`);
      }
      
      // Always refresh the bills list to get current state
      logger.log('🔄 Refreshing bills list after delete operation...');
      await loadIPDBills();
      
    } catch (error: any) {
      logger.error('❌ Failed to delete bill:', error);
      logger.error('❌ Full error object:', JSON.stringify(error, null, 2));
      toast.error(`Failed to delete bill: ${error.message || error}`);
      
      // Still refresh to sync with database state
      await loadIPDBills();
    }
  };

  // Handler for Print Bill List - 13 bills per page
  const handlePrintBillList = () => {
    if (!ipdBills || ipdBills.length === 0) {
      toast.error('No bills to print');
      return;
    }

    const BILLS_PER_PAGE = 13;
    const billPages: any[][] = [];

    // Split bills into pages of 13
    for (let i = 0; i < ipdBills.length; i += BILLS_PER_PAGE) {
      billPages.push(ipdBills.slice(i, i + BILLS_PER_PAGE));
    }

    // Generate separate page HTML for each page
    const generatePageHTML = (pageBills: any[], pageIndex: number) => {
      const rowsHTML = pageBills.map((bill, index) => {
        const globalIndex = pageIndex * BILLS_PER_PAGE + index + 1;
        const patientName = bill.patients ?
          `${bill.patients.first_name || ''} ${bill.patients.last_name || ''}`.trim() || 'Unknown Patient'
          : 'Loading...';
        const billId = bill.transaction_reference || bill.id || `BILL-${globalIndex}`;
        const doctor = bill.doctor_name || 'N/A';
        const amount = bill.amount || 0;
        const status = bill.status || 'UNKNOWN';
        const date = bill.transaction_date ?
          new Date(bill.transaction_date).toLocaleDateString('en-IN') :
          (bill.created_at ? new Date(bill.created_at).toLocaleDateString('en-IN') : 'N/A');

        let statusClass = 'status-badge ';
        if (status === 'COMPLETED') statusClass += 'status-completed';
        else if (status === 'PAID') statusClass += 'status-paid';
        else if (status === 'PENDING') statusClass += 'status-pending';
        else statusClass += 'status-cancelled';

        return `
          <tr>
            <td style="text-align: center;">${globalIndex}</td>
            <td>${billId}</td>
            <td>${patientName}</td>
            <td>${doctor}</td>
            <td style="text-align: right;">₹${amount.toLocaleString('en-IN')}</td>
            <td><span class="${statusClass}">${status}</span></td>
            <td>${date}</td>
          </tr>
        `;
      }).join('');

      // Add total row only on last page
      const totalRowHTML = pageIndex === billPages.length - 1 ? `
        <tr class="total-row">
          <td colspan="4" style="text-align: right; padding-right: 15px;">Total Amount:</td>
          <td style="text-align: right;">₹${ipdBills.reduce((sum, bill) => sum + (bill.amount || 0), 0).toLocaleString('en-IN')}</td>
          <td colspan="2">Total Bills: ${ipdBills.length}</td>
        </tr>
      ` : '';

      return `
        <div class="page">
          <div class="header">
            <h1>IPD BILL</h1>
            <h2 style="margin: 5px 0; font-size: 18px; color: #0056B3;">VALANT HOSPITAL</h2>
            <div class="subtitle">IPD Bill List</div>
          </div>

          <div class="print-date">
            Printed on: ${new Date().toLocaleDateString('en-IN')} at ${new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
          </div>

          <table>
            <thead>
              <tr>
                <th style="width: 8%;">Sr No.</th>
                <th style="width: 15%;">Bill ID</th>
                <th style="width: 22%;">Patient Name</th>
                <th style="width: 18%;">Doctor</th>
                <th style="width: 12%;">Amount</th>
                <th style="width: 12%;">Status</th>
                <th style="width: 13%;">Date</th>
              </tr>
            </thead>
            <tbody>
              ${rowsHTML}
              ${totalRowHTML}
            </tbody>
          </table>

          <div class="page-number">
            Page ${pageIndex + 1} of ${billPages.length}
            ${pageIndex < billPages.length - 1 ? ` (Bills ${pageIndex * BILLS_PER_PAGE + 1} to ${(pageIndex + 1) * BILLS_PER_PAGE})` : ` (Bills ${pageIndex * BILLS_PER_PAGE + 1} to ${ipdBills.length})`}
          </div>
        </div>
        ${pageIndex < billPages.length - 1 ? '<div class="page-break"></div>' : ''}
      `;
    };

    // Generate print HTML
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast.error('Failed to open print window. Please check popup blocker.');
      return;
    }

    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>IPD Bill List - ${new Date().toLocaleDateString()}</title>
        <style>
          @page {
            size: A4 portrait;
            margin: 15mm;
          }

          * {
            box-sizing: border-box;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }

          body {
            margin: 0;
            padding: 0;
            font-family: Arial, sans-serif;
            font-size: 12px;
            color: #333;
          }

          .page {
            padding: 20px;
          }

          .page-break {
            page-break-before: always;
            break-before: page;
            page-break-after: always;
            break-after: page;
            height: 0;
            margin: 0;
            padding: 0;
            border: none;
          }

          .header {
            text-align: center;
            margin-bottom: 20px;
            padding-bottom: 15px;
            border-bottom: 2px solid #0056B3;
          }

          .header h1 {
            margin: 0;
            color: #0056B3;
            font-size: 24px;
          }

          .header .subtitle {
            margin: 5px 0;
            color: #666;
            font-size: 14px;
          }

          .print-date {
            text-align: right;
            margin-bottom: 15px;
            color: #666;
            font-size: 11px;
          }

          table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
          }

          thead {
            background-color: #f0f0f0;
          }

          th {
            padding: 10px 8px;
            text-align: left;
            font-weight: 600;
            border: 1px solid #ddd;
            font-size: 11px;
            color: #333;
          }

          td {
            padding: 8px;
            border: 1px solid #ddd;
            font-size: 11px;
          }

          tbody tr:nth-child(even) {
            background-color: #f9f9f9;
          }

          .status-badge {
            padding: 3px 8px;
            border-radius: 12px;
            font-size: 10px;
            font-weight: 600;
            display: inline-block;
          }

          .status-completed {
            background-color: #dbeafe;
            color: #1e40af;
          }

          .status-paid {
            background-color: #dcfce7;
            color: #166534;
          }

          .status-pending {
            background-color: #fef3c7;
            color: #92400e;
          }

          .status-cancelled {
            background-color: #fee2e2;
            color: #991b1b;
          }

          .total-row {
            font-weight: 600;
            background-color: #e0e7ff !important;
          }

          .page-number {
            text-align: center;
            margin-top: 15px;
            color: #666;
            font-size: 11px;
          }

          @media screen {
            .page-break {
              display: block;
              height: 2px;
              background: #ddd;
              margin: 30px 0;
              position: relative;
            }

            .page-break::after {
              content: '--- Page Break ---';
              position: absolute;
              left: 50%;
              top: 50%;
              transform: translate(-50%, -50%);
              background: white;
              padding: 0 10px;
              color: #666;
              font-size: 10px;
            }
          }

          @media print {
            body {
              margin: 0;
              padding: 0;
            }

            .page-break {
              page-break-before: always !important;
              break-before: page !important;
              display: block !important;
              height: 0 !important;
            }
          }
        </style>
      </head>
      <body>
        ${billPages.map((pageBills, pageIndex) => generatePageHTML(pageBills, pageIndex)).join('')}
      </body>
      </html>
    `;

    printWindow.document.write(printContent);
    printWindow.document.close();

    // Wait for content to load then print
    setTimeout(() => {
      printWindow.print();
    }, 250);

    toast.success(`Printing ${ipdBills.length} bills (${billPages.length} pages)`);
  };

  // Handler for Print Receipt button
  const handlePrintReceipt = (receiptId: string) => {
    // Find the deposit by receipt ID
    const deposit = depositHistory.find(d => d.receiptNo === receiptId);
    if (!deposit) {
      toast.error('Deposit not found');
      return;
    }

    // Generate deposit receipt print
    const printDepositReceipt = () => {
      const getCurrentTime = () => {
        const now = new Date();
        return now.toLocaleTimeString('en-IN', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: true
        });
      };

      const convertToWords = (amount: number): string => {
        // Simple number to words conversion
        if (amount === 0) return 'Zero';

        const units = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
        const teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
        const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

        if (amount < 10) return units[amount];
        if (amount < 20) return teens[amount - 10];
        if (amount < 100) return tens[Math.floor(amount / 10)] + (amount % 10 ? ' ' + units[amount % 10] : '');
        if (amount < 1000) return units[Math.floor(amount / 100)] + ' Hundred' + (amount % 100 ? ' ' + convertToWords(amount % 100) : '');
        if (amount < 100000) return convertToWords(Math.floor(amount / 1000)) + ' Thousand' + (amount % 1000 ? ' ' + convertToWords(amount % 1000) : '');

        return 'Amount Too Large';
      };

      const printContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Advance Deposit Receipt - ${deposit.receiptNo}</title>
          <style>
            @media print {
              @page {
                size: A4;
                margin: 15mm;
              }
              body * {
                visibility: hidden;
              }
              .receipt-template, .receipt-template * {
                visibility: visible !important;
                opacity: 1 !important;
              }
              .receipt-template {
                position: absolute;
                left: 0 !important;
                top: 0 !important;
                width: 100% !important;
                page-break-inside: avoid;
              }
              .print\\:hidden {
                display: none !important;
              }
              .receipt-template * {
                color: black !important;
                border-color: #333 !important;
              }
            }

            body {
              font-family: Arial, sans-serif;
              margin: 0;
              padding: 0;
              background: white;
            }

            .receipt-template {
              width: 100%;
              max-width: 800px;
              margin: 0 auto;
              padding: 20px;
              background: white;
            }
          </style>
        </head>
        <body>
          <div class="receipt-template">
            <!-- Header -->
            <div style="text-align: center; margin-bottom: 30px; border-bottom: 3px solid #0056B3; padding-bottom: 20px;">
              <h1 style="color: #0056B3; font-size: 32px; font-weight: bold; margin: 0;">HOSPITAL CRM PRO</h1>
              <p style="color: black; font-size: 16px; margin: 8px 0;">Complete Healthcare Management System</p>
              <p style="color: black; font-size: 14px; margin: 0;">📍 Your Hospital Address | 📞 Contact Number | 📧 Email</p>
            </div>

            <!-- IPD DEPOSIT Title at Top Center -->
            <div style="text-align: center; margin-bottom: 25px;">
              <h1 style="font-size: 28px; font-weight: bold; color: black; margin: 0; letter-spacing: 2px;">IPD DEPOSIT</h1>
            </div>

            <!-- Receipt Title -->
            <div style="text-align: center; margin-bottom: 25px;">
              <h2 style="color: black; font-size: 20px; font-weight: bold; margin: 0;">Advance Deposit Receipt</h2>
              <p style="color: black; font-size: 16px; margin: 10px 0;">Receipt No: <strong>${deposit.receiptNo}</strong></p>
            </div>

            <!-- Date and Time -->
            <div style="display: grid; grid-template-columns: 1fr 1fr; margin-bottom: 25px; font-size: 16px; color: black;">
              <div>
                <p style="margin: 5px 0;"><strong>DATE:</strong> ${new Date().toLocaleDateString('en-IN')}</p>
                <p style="margin: 5px 0;"><strong>TIME:</strong> ${getCurrentTime()}</p>
              </div>
              <div style="text-align: right;">
                <p style="margin: 5px 0;"><strong>RECEIPT DATE:</strong> ${deposit.date}</p>
                <p style="margin: 5px 0;"><strong>PAYMENT MODE:</strong> ${deposit.paymentMode || 'CASH'}</p>
              </div>
            </div>

            <!-- Patient Information -->
            <div style="margin-bottom: 30px; border: 2px solid #ddd; padding: 20px; background-color: #f9f9f9;">
              <h3 style="color: black; font-size: 18px; font-weight: bold; margin-bottom: 15px; border-bottom: 1px solid #ddd; padding-bottom: 8px;">PATIENT DETAILS</h3>
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                <div>
                  <p style="color: black; margin: 6px 0;"><strong>NAME:</strong> ${bill.patients?.first_name || ''} ${bill.patients?.last_name || ''}</p>
                  <p style="color: black; margin: 6px 0;"><strong>AGE/SEX:</strong> ${bill.patients?.age || 'N/A'} years / ${bill.patients?.gender || 'N/A'}</p>
                  <p style="color: black; margin: 6px 0;"><strong>MOBILE:</strong> ${bill.patients?.phone || 'N/A'}</p>
                </div>
                <div>
                  <p style="color: black; margin: 6px 0;"><strong>PATIENT ID:</strong> ${bill.patients?.patient_id || 'N/A'}</p>
                  <p style="color: black; margin: 6px 0;"><strong>ADMISSION DATE:</strong> ${bill.patients?.admissions?.[0]?.admission_date ? new Date(bill.patients.admissions[0].admission_date).toLocaleDateString('en-IN') : 'N/A'}</p>
                  <p style="color: black; margin: 6px 0;"><strong>ROOM/BED:</strong> ${bill.patients?.admissions?.[0]?.bed_number || 'N/A'}</p>
                </div>
              </div>
            </div>

            <!-- Deposit Details -->
            <div style="margin-bottom: 30px;">
              <h3 style="color: black; font-size: 18px; font-weight: bold; margin-bottom: 15px; border-bottom: 1px solid #ddd; padding-bottom: 8px;">ADVANCE DEPOSIT DETAILS</h3>
              <table style="width: 100%; border-collapse: collapse; font-size: 16px;">
                <thead>
                  <tr style="background-color: #f0f0f0;">
                    <th style="border: 1px solid black; padding: 12px; text-align: left; color: black;">Description</th>
                    <th style="border: 1px solid black; padding: 12px; text-align: center; color: black;">Payment Mode</th>
                    <th style="border: 1px solid black; padding: 12px; text-align: center; color: black;">Reference</th>
                    <th style="border: 1px solid black; padding: 12px; text-align: right; color: black;">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td style="border: 1px solid black; padding: 12px; color: black;">IPD Advance Payment</td>
                    <td style="border: 1px solid black; padding: 12px; text-align: center; color: black;">${deposit.paymentMode || 'CASH'}</td>
                    <td style="border: 1px solid black; padding: 12px; text-align: center; color: black;">${deposit.reference || '-'}</td>
                    <td style="border: 1px solid black; padding: 12px; text-align: right; color: black; font-weight: bold;">₹${deposit.amount?.toFixed(2) || '0.00'}</td>
                  </tr>
                  <tr style="background-color: #f0f0f0;">
                    <td colspan="3" style="border: 1px solid black; padding: 15px; text-align: center; color: black; font-weight: bold; font-size: 18px;">TOTAL ADVANCE DEPOSIT</td>
                    <td style="border: 1px solid black; padding: 15px; text-align: right; color: black; font-weight: bold; font-size: 18px;">₹${deposit.amount?.toFixed(2) || '0.00'}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <!-- Amount in Words -->
            <div style="text-align: center; margin-bottom: 25px; padding: 15px; background-color: #f9f9f9; border: 1px solid #ddd;">
              <p style="font-size: 16px; color: black; margin: 0;"><strong>Amount in Words:</strong> ${convertToWords(deposit.amount || 0)} Rupees Only</p>
            </div>

            <!-- Important Notice -->
            <div style="margin-bottom: 30px; padding: 15px; background-color: #fff3cd; border: 1px solid #ffeaa7; border-radius: 5px;">
              <h4 style="color: black; font-size: 16px; font-weight: bold; margin-bottom: 8px;">Important Notice:</h4>
              <ul style="color: black; font-size: 14px; margin: 0; padding-left: 20px;">
                <li>This advance payment will be adjusted against your final bill</li>
                <li>Please keep this receipt for your records</li>
                <li>This receipt is valid for all insurance and reimbursement claims</li>
                <li>For any queries, please contact the billing department</li>
              </ul>
            </div>

            <!-- Signature Section -->
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-top: 40px; margin-bottom: 30px;">
              <div style="text-align: center; border-top: 2px solid black; padding-top: 8px;">
                <p style="font-size: 14px; color: black; margin: 0;">Patient/Guardian Signature</p>
              </div>
              <div style="text-align: center; border-top: 2px solid black; padding-top: 8px;">
                <p style="font-size: 14px; color: black; margin: 0;">Authorized Signature</p>
                <p style="font-size: 12px; color: black; margin: 5px 0 0 0;">Billing Department</p>
              </div>
            </div>

            <!-- Footer -->
            <div style="text-align: center; font-size: 12px; color: #666; border-top: 1px solid #ddd; padding-top: 15px; margin-top: 30px;">
              <p style="margin: 0;">This is a computer-generated receipt and does not require a physical signature.</p>
              <p style="margin: 5px 0 0 0;">Generated on ${new Date().toLocaleDateString('en-IN')} at ${getCurrentTime()}</p>
            </div>
          </div>
        </body>
        </html>
      `;

      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(printContent);
        printWindow.document.close();

        printWindow.onload = () => {
          setTimeout(() => {
            printWindow.print();
            printWindow.close();
          }, 250);
        };
      }
    };

    printDepositReceipt();
    toast.success('Opening deposit receipt for printing...');
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
              onClick={() => {
                resetForm();
                setShowCreateBill(true);
              }}
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
                  logger.log('🎯 MAIN VIEW RENDER: billsLoading:', billsLoading, 'ipdBills.length:', ipdBills.length);
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
                              {bill.display_type || 
                               ((bill.transaction_type === 'SERVICE' && bill.description?.includes('[IPD_BILL]')) ? 'IPD Bill' : 
                                bill.transaction_type === 'SERVICE' ? 'Service Bill' : 
                                ['ADMISSION_FEE', 'DEPOSIT', 'ADVANCE_PAYMENT'].includes(bill.transaction_type) ? 'Deposit' : bill.transaction_type)}
                            </span>
                            ₹{bill.amount?.toLocaleString() || '0'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            bill.status === 'COMPLETED' 
                              ? 'bg-blue-100 text-blue-800' 
                              : bill.status === 'PAID' 
                              ? 'bg-green-100 text-green-800' 
                              : bill.status === 'PENDING'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {bill.status || 'UNKNOWN'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {bill.transaction_date ? new Date(bill.transaction_date).toLocaleDateString() : (bill.created_at ? new Date(bill.created_at).toLocaleDateString() : 'N/A')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button
                            className="text-blue-600 hover:text-blue-900 mr-3"
                            onClick={() => handleViewBill(bill)}
                          >
                            View
                          </button>
                          <button
                            className="text-orange-600 hover:text-orange-900 mr-3"
                            onClick={() => handleEditBill(bill)}
                            title="Edit Bill"
                          >
                            Edit
                          </button>
                          <button
                            className="text-green-600 hover:text-green-900 mr-3"
                            onClick={() => handlePrintBill(bill)}
                          >
                            Print
                          </button>
                          {(bill.status === 'PENDING' || bill.status === 'PAID') && bill.status !== 'COMPLETED' && (
                            <button 
                              className="text-blue-600 hover:text-blue-900 mr-3"
                              onClick={() => handleMarkCompleted(bill)}
                              title="Mark as Completed"
                            >
                              ✓ Complete
                            </button>
                          )}
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

      {/* Tab Navigation */}
      <div className="bg-white rounded-lg shadow-sm border mb-6">
        <div className="flex border-b">
          <button
            onClick={() => setActiveSection('bill')}
            className={`flex-1 px-6 py-4 text-center font-medium transition-colors ${
              activeSection === 'bill'
                ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
            }`}
          >
            <div className="flex items-center justify-center space-x-2">
              <span className="text-2xl">📋</span>
              <span className="text-lg">IPD Billing</span>
            </div>
          </button>
          <button
            onClick={() => setActiveSection('deposit')}
            className={`flex-1 px-6 py-4 text-center font-medium transition-colors ${
              activeSection === 'deposit'
                ? 'text-green-600 border-b-2 border-green-600 bg-green-50'
                : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
            }`}
          >
            <div className="flex items-center justify-center space-x-2">
              <span className="text-2xl">💰</span>
              <span className="text-lg">Deposit Management</span>
            </div>
          </button>
        </div>
      </div>

      {/* IPD Billing Section */}
      {activeSection === 'bill' && (
        <>
          {/* Initial IPD Billing List Interface */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">IPD Billing</h2>
          <p className="text-gray-600">Manage inpatient department bills</p>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={() => {
              resetForm();
              setShowCreateBill(true);
            }}
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
          <button
            onClick={handlePrintBillList}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center space-x-2 transition-colors whitespace-nowrap"
          >
            <Printer className="h-4 w-4" />
            <span>Print Bill List</span>
          </button>
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
                logger.log('🎯 RENDER: billsLoading:', billsLoading, 'ipdBills.length:', ipdBills.length);
                logger.log('🎯 RENDER: ipdBills array:', ipdBills);
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
                              {bill.display_type || 
                               ((bill.transaction_type === 'SERVICE' && bill.description?.includes('[IPD_BILL]')) ? 'IPD Bill' : 
                                bill.transaction_type === 'SERVICE' ? 'Service Bill' : 
                                ['ADMISSION_FEE', 'DEPOSIT', 'ADVANCE_PAYMENT'].includes(bill.transaction_type) ? 'Deposit' : bill.transaction_type)}
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
                          bill.status === 'COMPLETED' 
                            ? 'bg-blue-100 text-blue-800' 
                            : bill.status === 'PAID' 
                            ? 'bg-green-100 text-green-800' 
                            : bill.status === 'PENDING'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {bill.status || 'UNKNOWN'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {bill.transaction_date ? new Date(bill.transaction_date).toLocaleDateString() : (bill.created_at ? new Date(bill.created_at).toLocaleDateString() : 'N/A')}
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
                        {(bill.status === 'PENDING' || bill.status === 'PAID') && bill.status !== 'COMPLETED' && (
                          <button 
                            className="text-blue-600 hover:text-blue-900 mr-3"
                            onClick={() => handleMarkCompleted(bill)}
                            title="Mark as Completed"
                          >
                            ✓ Complete
                          </button>
                        )}
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
                <h3 className="text-xl font-semibold text-gray-800">
                  {editingBill ? 'Edit IPD Bill' : 'Create IPD Bill'}
                </h3>
                <button
                  onClick={() => {
                    setShowCreateBill(false);
                    setEditingBill(null);
                    resetForm();
                  }}
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

                {/* IPD Patient History - Hidden when editing */}
                {selectedPatient && !editingBill && (
                  <div className="bg-white rounded-lg border border-gray-200">
                    <div className="px-4 py-3 border-b border-gray-200 bg-blue-50">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="text-md font-semibold text-gray-800">
                            📈 IPD History - {selectedPatient.first_name} {selectedPatient.last_name}
                          </h4>
                          <p className="text-sm text-gray-600">
                            IPD No: {getPatientDisplayData().ipdNo} | 
                            Admitted: {selectedPatient.admissions?.[0]?.admission_date ? new Date(selectedPatient.admissions[0].admission_date).toLocaleDateString() : 'N/A'}
                          </p>
                        </div>
                        <div className="text-right flex items-center space-x-4">
                          <div className="text-sm">
                            <div className="text-green-600 font-medium">Deposits: ₹{advancePayments.toFixed(2)}</div>
                            <div className="text-red-600 font-medium">Due: ₹{summary.netPayable.toFixed(2)}</div>
                          </div>
                          <button
                            onClick={() => setShowAddDepositModal(true)}
                            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors shadow-md font-semibold"
                          >
                            <Plus className="h-4 w-4" />
                            <span>Create Deposit</span>
                          </button>
                        </div>
                      </div>
                    </div>
                    
                    <div className="p-4">
                      {historyLoading ? (
                        <div className="flex items-center justify-center py-8">
                          <div className="text-gray-500">Loading IPD history...</div>
                        </div>
                      ) : patientHistory.length > 0 ? (
                        <div className="space-y-2">
                          <div className="text-sm font-medium text-gray-700 mb-3">
                            All Services & Transactions Since IPD Admission ({patientHistory.length} records)
                          </div>
                          <div className="max-h-60 overflow-y-auto border rounded-md">
                            <table className="min-w-full divide-y divide-gray-200">
                              <thead className="bg-gray-50 sticky top-0">
                                <tr>
                                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Service/Description</th>
                                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                                  <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                                  <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                </tr>
                              </thead>
                              <tbody className="bg-white divide-y divide-gray-200">
                                {patientHistory.map((transaction, index) => (
                                  <tr key={transaction.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                                    <td className="px-3 py-2 text-xs text-gray-900">
                                      {transaction.transaction_date ? new Date(transaction.transaction_date).toLocaleDateString() : (transaction.created_at ? new Date(transaction.created_at).toLocaleDateString() : 'N/A')}
                                    </td>
                                    <td className="px-3 py-2 text-xs">
                                      <div className="font-medium text-gray-900">
                                        {transaction.description || 'Service/Transaction'}
                                      </div>
                                      {transaction.transaction_reference && (
                                        <div className="text-gray-500 text-xs">Ref: {transaction.transaction_reference}</div>
                                      )}
                                    </td>
                                    <td className="px-3 py-2 text-xs">
                                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                        transaction.transaction_type === 'SERVICE' || (transaction.transaction_type === 'SERVICE' && transaction.description?.includes('[IPD_BILL]')) 
                                          ? 'bg-blue-100 text-blue-800' 
                                          : transaction.transaction_type === 'ADMISSION_FEE'
                                          ? 'bg-green-100 text-green-800'
                                          : 'bg-gray-100 text-gray-800'
                                      }`}>
                                        {transaction.transaction_type === 'SERVICE' && transaction.description?.includes('[IPD_BILL]') ? 'IPD Bill' :
                                         transaction.transaction_type === 'SERVICE' ? 'Service' :
                                         transaction.transaction_type === 'ADMISSION_FEE' ? 'Deposit' :
                                         transaction.transaction_type}
                                      </span>
                                    </td>
                                    <td className="px-3 py-2 text-xs text-right font-medium">
                                      ₹{transaction.amount?.toLocaleString() || '0'}
                                    </td>
                                    <td className="px-3 py-2 text-center">
                                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                        transaction.status === 'COMPLETED' 
                                          ? 'bg-blue-100 text-blue-800' 
                                          : transaction.status === 'PAID' 
                                          ? 'bg-green-100 text-green-800' 
                                          : transaction.status === 'PENDING'
                                          ? 'bg-yellow-100 text-yellow-800'
                                          : 'bg-red-100 text-red-800'
                                      }`}>
                                        {transaction.status || 'UNKNOWN'}
                                      </span>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                          
                          {/* Summary Footer */}
                          <div className="mt-3 pt-3 border-t border-gray-200">
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                              <div className="bg-blue-50 px-3 py-2 rounded">
                                <div className="font-medium text-blue-800">
                                  Total Services: {patientHistory.filter(t => t.transaction_type === 'SERVICE').length}
                                </div>
                              </div>
                              <div className="bg-green-50 px-3 py-2 rounded">
                                <div className="font-medium text-green-800">
                                  Total Deposits: {patientHistory.filter(t => t.transaction_type === 'ADMISSION_FEE').length}
                                </div>
                              </div>
                              <div className="bg-purple-50 px-3 py-2 rounded">
                                <div className="font-medium text-purple-800">
                                  Total Amount: ₹{patientHistory.reduce((sum, t) => sum + (t.amount || 0), 0).toLocaleString()}
                                </div>
                              </div>
                              <div className="bg-orange-50 px-3 py-2 rounded">
                                <div className="font-medium text-orange-800">
                                  Pending: {patientHistory.filter(t => t.status === 'PENDING').length} items
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center py-8 text-gray-500">
                          <div className="text-center">
                            <div className="text-4xl mb-2">📊</div>
                            <div>No IPD services recorded yet</div>
                            <div className="text-sm mt-1">Services and transactions will appear here once recorded</div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* IPD Billing Format with Enhanced UI */}
                {!editingBill && (
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
                          <select
                            value={(() => {
                              const roomType = staySegments[0]?.roomType || 'General Ward';
                              // Normalize any case mismatches to match dropdown options
                              const mappings = {
                                // ICU variations
                                'Icu': 'ICU',
                                'icu': 'ICU',
                                'ICU': 'ICU',

                                // Private Room variations
                                'Private room': 'Private Room',
                                'private room': 'Private Room',
                                'Private Room': 'Private Room',
                                'PRIVATE ROOM': 'Private Room',
                                'Private': 'Private Room',
                                'private': 'Private Room',

                                // Deluxe Room variations
                                'Deluxe room': 'Deluxe Room',
                                'deluxe room': 'Deluxe Room',
                                'Deluxe Room': 'Deluxe Room',
                                'DELUXE ROOM': 'Deluxe Room',
                                'Deluxe': 'Deluxe Room',
                                'deluxe': 'Deluxe Room',

                                // Semi Private variations
                                'Semi private': 'Semi Private',
                                'semi private': 'Semi Private',
                                'Semi Private': 'Semi Private',
                                'SEMI PRIVATE': 'Semi Private',
                                'Semi-private': 'Semi Private',
                                'semi-private': 'Semi Private',

                                // General Ward variations
                                'General ward': 'General Ward',
                                'general ward': 'General Ward',
                                'General Ward': 'General Ward',
                                'GENERAL WARD': 'General Ward',
                                'General': 'General Ward',
                                'general': 'General Ward'
                              };
                              const finalValue = mappings[roomType] || roomType;

                              // Alert if we have an unmapped room type
                              if (!mappings[roomType] && roomType !== 'General Ward') {
                                logger.warn('🚨 UNMAPPED ROOM TYPE DETECTED:', roomType);
                              }

                              logger.log('🔍🔍🔍 SUMMARY DROPDOWN VALUE:', {
                                originalRoomType: roomType,
                                finalValue: finalValue,
                                hasMappingMatch: !!mappings[roomType],
                                staySegments: staySegments
                              });
                              return finalValue;
                            })()}
                            onChange={(e) => {
                              const newRoomType = e.target.value;
                              logger.log('🏨🏨🏨 SUMMARY DROPDOWN: Room type changed to:', newRoomType);
                              logger.log('🏨 Current stay segments before change:', staySegments);
                              // Update the first stay segment's room type
                              setStaySegments(segments =>
                                segments.map((seg, index) =>
                                  index === 0 ? {
                                    ...seg,
                                    roomType: newRoomType,
                                    // Auto-update rates based on room type
                                    bedChargePerDay: {
                                      'General Ward': 1000,
                                      'ICU': 3000,
                                      'Deluxe Room': 2500,
                                      'Private Room': 2000,
                                      'Semi Private': 1500
                                    }[newRoomType] || 1000,
                                    nursingChargePerDay: {
                                      'General Ward': 200,
                                      'ICU': 800,
                                      'Deluxe Room': 500,
                                      'Private Room': 400,
                                      'Semi Private': 300
                                    }[newRoomType] || 200,
                                    rmoChargePerDay: {
                                      'General Ward': 100,
                                      'ICU': 300,
                                      'Deluxe Room': 250,
                                      'Private Room': 200,
                                      'Semi Private': 150
                                    }[newRoomType] || 100,
                                    doctorChargePerDay: {
                                      'General Ward': 500,
                                      'ICU': 1000,
                                      'Deluxe Room': 900,
                                      'Private Room': 800,
                                      'Semi Private': 600
                                    }[newRoomType] || 500
                                  } : seg
                                )
                              );
                            }}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="General Ward">General Ward</option>
                            <option value="ICU">ICU</option>
                            <option value="Deluxe Room">Deluxe Room</option>
                            <option value="Private Room">Private Room</option>
                            <option value="Semi Private">Semi Private Room</option>
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
                                value={(() => {
                                  const roomType = segment.roomType;
                                  // Normalize any case mismatches to match dropdown options
                                  const mappings = {
                                    // ICU variations
                                    'Icu': 'ICU',
                                    'icu': 'ICU',
                                    'ICU': 'ICU',

                                    // Private Room variations
                                    'Private room': 'Private Room',
                                    'private room': 'Private Room',
                                    'Private Room': 'Private Room',
                                    'PRIVATE ROOM': 'Private Room',
                                    'Private': 'Private Room',
                                    'private': 'Private Room',

                                    // Deluxe Room variations
                                    'Deluxe room': 'Deluxe Room',
                                    'deluxe room': 'Deluxe Room',
                                    'Deluxe Room': 'Deluxe Room',
                                    'DELUXE ROOM': 'Deluxe Room',
                                    'Deluxe': 'Deluxe Room',
                                    'deluxe': 'Deluxe Room',

                                    // Semi Private variations
                                    'Semi private': 'Semi Private',
                                    'semi private': 'Semi Private',
                                    'Semi Private': 'Semi Private',
                                    'SEMI PRIVATE': 'Semi Private',
                                    'Semi-private': 'Semi Private',
                                    'semi-private': 'Semi Private',

                                    // General Ward variations
                                    'General ward': 'General Ward',
                                    'general ward': 'General Ward',
                                    'General Ward': 'General Ward',
                                    'GENERAL WARD': 'General Ward',
                                    'General': 'General Ward',
                                    'general': 'General Ward'
                                  };
                                  const finalValue = mappings[roomType] || roomType;

                                  // Alert if we have an unmapped room type
                                  if (!mappings[roomType] && roomType !== 'General Ward') {
                                    logger.warn('🚨 UNMAPPED ROOM TYPE DETECTED IN DETAILED:', roomType);
                                  }

                                  logger.log('🏠🏠🏠 DETAILED DROPDOWN VALUE:', {
                                    segmentId: segment.id,
                                    originalRoomType: roomType,
                                    finalValue: finalValue,
                                    hasMappingMatch: !!mappings[roomType]
                                  });
                                  return finalValue;
                                })()}
                                onChange={(e) => {
                                  const newRoomType = e.target.value;
                                  logger.log('🏠🏠🏠 DETAILED DROPDOWN: Room type changed to:', newRoomType);
                                  logger.log('🏠 Current segment before change:', segment);
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
                                    <span className="text-xs text-gray-600">Qty:</span>
                                    <input
                                      type="number"
                                      value={service.quantity}
                                      onChange={(e) => updateServiceQuantity(service.id, parseInt(e.target.value) || 1)}
                                      className="w-16 px-2 py-1 text-xs border border-purple-300 rounded focus:outline-none focus:ring-1 focus:ring-purple-500"
                                      min="1"
                                      step="1"
                                    />
                                  </div>
                                  <div className="flex items-center space-x-2">
                                    <span className="text-xs text-gray-600">₹</span>
                                    <input
                                      type="number"
                                      value={service.amount}
                                      onChange={(e) => updateServiceAmount(service.id, parseFloat(e.target.value) || 0)}
                                      className="w-20 px-2 py-1 text-xs border border-purple-300 rounded focus:outline-none focus:ring-1 focus:ring-purple-500"
                                    />
                                  </div>
                                  <div className="text-xs font-medium text-gray-700">
                                    = ₹{(service.amount * service.quantity).toFixed(2)}
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
                          <div className="text-xl font-bold text-blue-800">₹{((parseFloat(admissionFee) || 0) + calculateTotalStayCharges() + calculateSelectedServicesTotal()).toFixed(2)}</div>
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
                          <div className="text-3xl font-bold text-blue-800">₹{((parseFloat(admissionFee) || 0) + calculateTotalStayCharges() + calculateSelectedServicesTotal() - (parseFloat(discount) || 0) + (parseFloat(tax) || 0)).toFixed(2)}</div>
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
                          onClick={() => {
                            setShowCreateBill(false);
                            setEditingBill(null);
                            resetForm();
                          }}
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

              </div>
            </div>
          </div>
        </div>
      )}
        </>
      )}

      {/* Deposit Management Section */}
      {activeSection === 'deposit' && (
        <>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between bg-gradient-to-r from-green-50 to-blue-50 p-6 rounded-lg shadow-md border-2 border-green-200">
            <div>
              <h2 className="text-3xl font-bold text-gray-900">💰 Deposit Management</h2>
              <p className="text-lg text-gray-700 mt-1">Manage patient advance deposits and payments</p>
            </div>
            <div className="flex flex-wrap gap-3 mt-4 md:mt-0">
              <button
                onClick={handleExportHistory}
                disabled={!selectedPatient || depositHistory.length === 0}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 transition-all shadow-lg hover:shadow-xl font-semibold text-base"
              >
                <span>📊 Export CSV</span>
              </button>
              <button
                onClick={handlePrintSummary}
                disabled={!selectedPatient || depositHistory.length === 0}
                className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 transition-all shadow-lg hover:shadow-xl font-semibold text-base"
              >
                <Printer className="h-5 w-5" />
                <span>Print Summary</span>
              </button>
              <button
                onClick={() => {
                  if (!selectedPatient) {
                    toast.error('Please select a patient first');
                    return;
                  }
                  setShowAddDepositModal(true);
                }}
                className="bg-green-600 text-white px-8 py-3 rounded-lg hover:bg-green-700 flex items-center space-x-2 transition-all shadow-lg hover:shadow-xl font-bold text-lg border-2 border-green-400"
              >
                <Plus className="h-6 w-6" />
                <span>CREATE DEPOSIT</span>
              </button>
            </div>
          </div>

      {/* Deposit Search and Filters */}
      <div className="bg-white p-4 rounded-lg shadow-sm border">
        <div className="flex flex-col md:flex-row space-y-2 md:space-y-0 md:space-x-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              placeholder="Search by patient name, ID, or receipt number..."
              value={patientSearchTerm}
              onChange={(e) => setPatientSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
          <button
            onClick={() => setShowPatientModal(true)}
            className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 flex items-center space-x-2 transition-colors whitespace-nowrap"
          >
            <Search className="h-4 w-4" />
            <span>Select Patient</span>
          </button>
        </div>
      </div>

      {/* Deposits Table */}
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        {!selectedPatient ? (
          <div className="text-center py-16 bg-gray-50">
            <div className="text-6xl mb-4">💰</div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">No Patient Selected</h3>
            <p className="text-gray-600 mb-4">Please select a patient to view and manage their deposits</p>
            <button
              onClick={() => setShowPatientModal(true)}
              className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 inline-flex items-center space-x-2 transition-colors"
            >
              <Search className="h-5 w-5" />
              <span>Select Patient</span>
            </button>
          </div>
        ) : (
          <>
            {/* Selected Patient Info */}
            <div className="bg-gradient-to-r from-green-50 to-blue-50 p-4 border-b">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-lg font-semibold text-gray-800">
                    {selectedPatient.first_name} {selectedPatient.last_name}
                  </h4>
                  <p className="text-sm text-gray-600">
                    Patient ID: {selectedPatient.patient_id} | Phone: {selectedPatient.phone} | Age: {selectedPatient.age} | Gender: {selectedPatient.gender}
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-green-600">₹{advancePayments.toFixed(2)}</div>
                  <div className="text-xs text-gray-600">Total Deposits ({depositHistory.length})</div>
                </div>
              </div>
            </div>

            {depositHistory.length === 0 ? (
              <div className="text-center py-16 bg-gray-50">
                <div className="text-6xl mb-4">📋</div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">No Deposits Found</h3>
                <p className="text-gray-600 mb-4">This patient has no advance deposits recorded</p>
                <button
                  onClick={() => setShowAddDepositModal(true)}
                  className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 inline-flex items-center space-x-2 transition-colors"
                >
                  <Plus className="h-5 w-5" />
                  <span>Create First Deposit</span>
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Receipt No</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Payment Mode</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reference</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {depositHistory.map((deposit, index) => (
                      <tr key={deposit.id || index} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">{deposit.receiptNo}</td>
                        <td className="px-4 py-3 text-sm text-gray-700">{deposit.date}</td>
                        <td className="px-4 py-3 text-sm font-semibold text-green-600">₹{deposit.amount?.toFixed(2)}</td>
                        <td className="px-4 py-3 text-sm text-gray-700">{deposit.paymentMode || 'CASH'}</td>
                        <td className="px-4 py-3 text-sm text-gray-500">{deposit.reference || '-'}</td>
                        <td className="px-4 py-3 text-center">
                          <div className="flex items-center justify-center space-x-2">
                            <button
                              onClick={() => handleViewReceipt(deposit.receiptNo)}
                              className="text-blue-600 hover:text-blue-900 px-2 py-1 rounded hover:bg-blue-50 transition-colors text-xs"
                              title="View Receipt"
                            >
                              View
                            </button>
                            <button
                              onClick={() => handlePrintReceipt(deposit.receiptNo)}
                              className="text-green-600 hover:text-green-900 px-2 py-1 rounded hover:bg-green-50 transition-colors text-xs flex items-center space-x-1"
                              title="Print Receipt"
                            >
                              <Printer className="h-3 w-3" />
                              <span>Print</span>
                            </button>
                            <button
                              onClick={() => handleEditDeposit(deposit)}
                              className="text-orange-600 hover:text-orange-900 px-2 py-1 rounded hover:bg-orange-50 transition-colors text-xs"
                              title="Edit Deposit"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => {
                                if (window.confirm(`Are you sure you want to delete deposit ${deposit.receiptNo}?`)) {
                                  deleteAdvancePayment(deposit.id);
                                }
                              }}
                              className="text-red-600 hover:text-red-900 px-2 py-1 rounded hover:bg-red-50 transition-colors text-xs"
                              title="Delete Deposit"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-gray-50">
                    <tr>
                      <td colSpan={2} className="px-4 py-3 text-sm font-bold text-gray-700">
                        Total Deposits ({depositHistory.length})
                      </td>
                      <td className="px-4 py-3 text-sm font-bold text-green-700">
                        ₹{advancePayments.toFixed(2)}
                      </td>
                      <td colSpan={3}></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </>
        )}
      </div>
        </>
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
          <h1>{activeSection === 'deposit' ? 'IPD DEPOSIT' : 'IPD BILL'}</h1>
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
                  <span>{service.name} (Qty: {service.quantity}):</span>
                  <span>₹{service.amount.toFixed(2)} × {service.quantity} = ₹{(service.amount * service.quantity).toFixed(2)}</span>
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


      {/* Other modals can be added here as needed */}

      {/* Create Deposit Modal */}
      {showAddDepositModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800">Create New Deposit</h3>
              <button
                onClick={() => setShowAddDepositModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Amount (₹) *</label>
                <input
                  type="number"
                  value={newPaymentAmount}
                  onChange={(e) => setNewPaymentAmount(e.target.value)}
                  placeholder="Enter amount"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Payment Date *</label>
                <input
                  type="date"
                  value={newPaymentDate}
                  onChange={(e) => setNewPaymentDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Payment Mode *</label>
                <select
                  value={newPaymentMode}
                  onChange={(e) => setNewPaymentMode(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="CASH">Cash</option>
                  <option value="CARD">Card</option>
                  <option value="UPI">UPI</option>
                  <option value="BANK_TRANSFER">Bank Transfer</option>
                  <option value="CHEQUE">Cheque</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Reference Number</label>
                <input
                  type="text"
                  value={referenceNo}
                  onChange={(e) => setReferenceNo(e.target.value)}
                  placeholder="Transaction/Cheque reference"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Received By</label>
                <input
                  type="text"
                  value={receivedBy}
                  onChange={(e) => setReceivedBy(e.target.value)}
                  placeholder="Staff name"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={() => setShowAddDepositModal(false)}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={addAdvancePayment}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
              >
                Save Deposit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Deposit Modal */}
      {showEditDepositModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800">Edit Deposit</h3>
              <button
                onClick={() => {
                  setShowEditDepositModal(false);
                  setEditingDeposit(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Amount (₹) *</label>
                <input
                  type="number"
                  value={editDepositAmount}
                  onChange={(e) => setEditDepositAmount(e.target.value)}
                  placeholder="Enter amount"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Payment Date *</label>
                <input
                  type="date"
                  value={editDepositDate}
                  onChange={(e) => setEditDepositDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Payment Mode *</label>
                <select
                  value={editDepositPaymentMode}
                  onChange={(e) => setEditDepositPaymentMode(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  <option value="CASH">Cash</option>
                  <option value="CARD">Card</option>
                  <option value="UPI">UPI</option>
                  <option value="BANK_TRANSFER">Bank Transfer</option>
                  <option value="CHEQUE">Cheque</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Reference Number</label>
                <input
                  type="text"
                  value={editDepositReference}
                  onChange={(e) => setEditDepositReference(e.target.value)}
                  placeholder="Transaction/Cheque reference"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Received By</label>
                <input
                  type="text"
                  value={editDepositReceivedBy}
                  onChange={(e) => setEditDepositReceivedBy(e.target.value)}
                  placeholder="Staff name"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowEditDepositModal(false);
                  setEditingDeposit(null);
                }}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateDeposit}
                className="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 transition-colors"
              >
                Update Deposit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NewIPDBillingModule;

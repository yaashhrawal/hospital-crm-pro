import React, { useState, useEffect } from 'react';
import { Search, Bed, User, Users, Activity, AlertCircle, Plus, Clock, Play, Square } from 'lucide-react';
import toast from 'react-hot-toast';
import HospitalService from '../services/hospitalService';
import type { PatientWithRelations, PatientAdmissionWithRelations } from '../config/supabaseNew';
import { HOSPITAL_ID } from '../config/supabaseNew';
import ProcedureConsentForm from './ProcedureConsentForm';
import IPDConsentForm from './IPDConsentForm';
import ClinicalRecordForm from './ClinicalRecordForm';
import DoctorProgressSheet from './DoctorProgressSheet';
import VitalChartsForm from './VitalChartsForm';
import IntakeOutputForm from './IntakeOutputForm';
import MedicationChartForm from './MedicationChartForm';
import CarePlanForm from './CarePlanForm';
import DiabeticChartForm from './DiabeticChartForm';
import NursesNotesForm from './NursesNotesForm';
import TatForm from './TatForm';
import PACRecordForm from './PACRecordForm';
import PreOperativeOrdersForm from './PreOperativeOrdersForm';
import PreOpChecklistForm from './PreOpChecklistForm';
import SurgicalSafetyChecklist from './SurgicalSafetyChecklist';
import AnaesthesiaNotesForm from './AnaesthesiaNotesForm';
import IntraOperativeNotesForm from './IntraOperativeNotesForm';
import PostOperativeOrdersForm from './PostOperativeOrdersForm';
import PhysiotherapyNotesForm from './PhysiotherapyNotesForm';
import BloodTransfusionMonitoringForm from './BloodTransfusionMonitoringForm';
import DischargePatientModal from './DischargePatientModal';
import PatientAdmissionForm from './PatientAdmissionForm';
import IPDConsentsSection from './IPDConsentsSection';
import BedService, { type BedData as DBBedData } from '../services/bedService';

interface BedData extends DBBedData {
  number: number; // Add number for compatibility
  patient?: PatientWithRelations; // Add patient for compatibility
  admissionDate?: string;
  tatStartTime?: number;
  ipdNumber?: string;
  consentFormData?: any;
  clinicalRecordData?: any;
  progressSheetData?: any;
  nursesOrdersData?: any;
  tatFormData?: any;
  pacRecordData?: any;
  preOpOrdersData?: any;
  preOpChecklistData?: any;
  surgicalSafetyData?: any;
  anaesthesiaNotesData?: any;
  intraOperativeNotesData?: any;
  postOperativeOrdersData?: any;
  physiotherapyNotesData?: any;
  bloodTransfusionData?: any;
  ipdConsentsData?: any;
}

interface PatientSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectPatient: (patient: PatientWithRelations) => void;
  customAdmissionDate: string;
  setCustomAdmissionDate: (date: string) => void;
  useCustomDate: boolean;
  setUseCustomDate: (use: boolean) => void;
}


const PatientSelectionModal: React.FC<PatientSelectionModalProps> = ({ 
  isOpen, 
  onClose, 
  onSelectPatient, 
  customAdmissionDate, 
  setCustomAdmissionDate, 
  useCustomDate, 
  setUseCustomDate 
}) => {
  const [patients, setPatients] = useState<PatientWithRelations[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (isOpen) {
      loadPatients();
    }
  }, [isOpen]);

  const loadPatients = async () => {
    try {
      setLoading(true);
      const patientData = await HospitalService.getPatients(200);
      // Filter to show all patients (since IPD status tracking may not be implemented yet)
      // TODO: Once IPD status columns are added, filter out already admitted patients
      const opdPatients = patientData; // Show all patients for now
      setPatients(opdPatients);
    } catch (error) {
      toast.error('Failed to load patients');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const filteredPatients = patients.filter(patient =>
    `${patient.first_name} ${patient.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    patient.patient_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    patient.phone?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800">Select Patient for IPD Admission</h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
            >
              ×
            </button>
          </div>

          {/* Search */}
          <div className="relative mb-6">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by name, ID, or phone..."
              className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Admission Date Selection */}
          <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <h3 className="text-lg font-semibold text-blue-800 mb-4">📅 Admission Date</h3>
            
            <div className="space-y-3">
              <div className="flex items-center">
                <input
                  type="radio"
                  id="today"
                  name="admissionDate"
                  checked={!useCustomDate}
                  onChange={() => setUseCustomDate(false)}
                  className="mr-3 h-4 w-4 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="today" className="text-sm font-medium text-gray-700">
                  Use Today's Date ({new Date().toLocaleDateString()})
                </label>
              </div>
              
              <div className="flex items-center">
                <input
                  type="radio"
                  id="custom"
                  name="admissionDate"
                  checked={useCustomDate}
                  onChange={() => setUseCustomDate(true)}
                  className="mr-3 h-4 w-4 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="custom" className="text-sm font-medium text-gray-700">
                  Use Custom Date (Backdate)
                </label>
              </div>
              
              {useCustomDate && (
                <div className="ml-7">
                  <input
                    type="date"
                    value={customAdmissionDate}
                    onChange={(e) => {
                      console.log('📅 Date changed to:', e.target.value);
                      setCustomAdmissionDate(e.target.value);
                    }}
                    max={new Date().toISOString().split('T')[0]} // Prevent future dates
                    min="2020-01-01" // Set a reasonable minimum date
                    className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="text-xs text-gray-600 mt-1">
                    Select a past date for backdated admission
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Patient List */}
          {loading ? (
            <div className="text-center py-8">Loading patients...</div>
          ) : filteredPatients.length === 0 ? (
            <div className="text-center py-8 text-gray-600">
              No available patients found for IPD admission.
            </div>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {filteredPatients.map((patient) => (
                <div
                  key={patient.id}
                  onClick={() => onSelectPatient(patient)}
                  className="p-4 border border-gray-200 rounded-lg hover:bg-blue-50 cursor-pointer transition-colors"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-medium text-gray-900">
                        {patient.first_name} {patient.last_name}
                      </div>
                      <div className="text-sm text-gray-600">
                        ID: {patient.patient_id} | Phone: {patient.phone || 'N/A'}
                      </div>
                      <div className="text-sm text-gray-600">
                        Age: {patient.age || 'N/A'} | Gender: {patient.gender}
                      </div>
                    </div>
                    <button className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
                      Select
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Utility functions for automatic IPD number generation
const getNextIPDNumber = (): string => {
  // Get current date in YYYYMMDD format
  const today = new Date();
  const dateString = today.getFullYear().toString() + 
                    (today.getMonth() + 1).toString().padStart(2, '0') + 
                    today.getDate().toString().padStart(2, '0');
  
  // Get or initialize the IPD counter for today
  const counterKey = `ipd-counter-${dateString}`;
  const currentCounter = parseInt(localStorage.getItem(counterKey) || '0');
  const nextCounter = currentCounter + 1;
  
  console.log(`🔢 IPD Counter Debug - Date: ${dateString}, Counter Key: ${counterKey}`);
  console.log(`🔢 Current Counter: ${currentCounter}, Next Counter: ${nextCounter}`);
  
  // Save the updated counter
  localStorage.setItem(counterKey, nextCounter.toString());
  console.log(`💾 Saved counter to localStorage: ${nextCounter}`);
  
  // Generate IPD number: IPD-YYYYMMDD-XXX (where XXX is sequential number)
  const ipdNumber = `IPD-${dateString}-${nextCounter.toString().padStart(3, '0')}`;
  
  console.log(`🏥 Auto-generated IPD Number: ${ipdNumber} (Counter: ${nextCounter})`);
  return ipdNumber;
};

// Function to get current IPD stats for today
const getIPDStats = (): { date: string; count: number; lastIPD: string } => {
  const today = new Date();
  const dateString = today.getFullYear().toString() + 
                    (today.getMonth() + 1).toString().padStart(2, '0') + 
                    today.getDate().toString().padStart(2, '0');
  
  const counterKey = `ipd-counter-${dateString}`;
  const count = parseInt(localStorage.getItem(counterKey) || '0');
  const lastIPD = count > 0 ? `IPD-${dateString}-${count.toString().padStart(3, '0')}` : 'None';
  
  
  return { date: dateString, count, lastIPD };
};

const IPDBedManagement: React.FC = () => {
  const [beds, setBeds] = useState<BedData[]>([]);
  const [filteredBeds, setFilteredBeds] = useState<BedData[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'occupied' | 'vacant'>('all');
  const [showPatientSelection, setShowPatientSelection] = useState(false);
  const [selectedBedForAdmission, setSelectedBedForAdmission] = useState<string | null>(null);
  const [customAdmissionDate, setCustomAdmissionDate] = useState<string>('');
  const [useCustomDate, setUseCustomDate] = useState(false);
  const [showProcedureConsent, setShowProcedureConsent] = useState(false);
  const [selectedPatientForConsent, setSelectedPatientForConsent] = useState<PatientWithRelations | null>(null);
  const [showIPDConsentForm, setShowIPDConsentForm] = useState(false);
  const [selectedPatientForIPDConsent, setSelectedPatientForIPDConsent] = useState<PatientWithRelations | null>(null);
  const [selectedBedForIPDConsent, setSelectedBedForIPDConsent] = useState<BedData | null>(null);
  const [showClinicalRecordForm, setShowClinicalRecordForm] = useState(false);
  const [selectedPatientForClinicalRecord, setSelectedPatientForClinicalRecord] = useState<PatientWithRelations | null>(null);
  const [selectedBedForClinicalRecord, setSelectedBedForClinicalRecord] = useState<BedData | null>(null);
  const [expandedConsultationOrdersBed, setExpandedConsultationOrdersBed] = useState<string | null>(null);
  const [expandedNursesOrdersBed, setExpandedNursesOrdersBed] = useState<string | null>(null);
  const [showProgressSheet, setShowProgressSheet] = useState(false);
  const [selectedPatientForProgressSheet, setSelectedPatientForProgressSheet] = useState<PatientWithRelations | null>(null);
  const [selectedBedForProgressSheet, setSelectedBedForProgressSheet] = useState<BedData | null>(null);
  // Individual Nursing Forms State
  const [showVitalCharts, setShowVitalCharts] = useState(false);
  const [showIntakeOutput, setShowIntakeOutput] = useState(false);
  const [showMedicationChart, setShowMedicationChart] = useState(false);
  const [showCarePlan, setShowCarePlan] = useState(false);
  const [showDiabeticChart, setShowDiabeticChart] = useState(false);
  const [showNursesNotes, setShowNursesNotes] = useState(false);
  const [showTatForm, setShowTatForm] = useState(false);
  const [selectedPatientForTat, setSelectedPatientForTat] = useState<PatientWithRelations | null>(null);
  const [selectedBedForTat, setSelectedBedForTat] = useState<BedData | null>(null);
  
  // PAC Record Form state
  const [showPACRecord, setShowPACRecord] = useState(false);
  const [selectedPatientForPAC, setSelectedPatientForPAC] = useState<PatientWithRelations | null>(null);
  const [selectedBedForPAC, setSelectedBedForPAC] = useState<BedData | null>(null);
  
  // Pre-Operative Orders Form state
  const [showPreOpOrders, setShowPreOpOrders] = useState(false);
  const [selectedPatientForPreOpOrders, setSelectedPatientForPreOpOrders] = useState<PatientWithRelations | null>(null);
  const [selectedBedForPreOpOrders, setSelectedBedForPreOpOrders] = useState<BedData | null>(null);
  
  // Pre-OP-Check List Form state
  const [showPreOpChecklist, setShowPreOpChecklist] = useState(false);
  const [selectedPatientForPreOpChecklist, setSelectedPatientForPreOpChecklist] = useState<PatientWithRelations | null>(null);
  const [selectedBedForPreOpChecklist, setSelectedBedForPreOpChecklist] = useState<BedData | null>(null);
  
  // Surgical Safety Checklist Form state
  const [showSurgicalSafety, setShowSurgicalSafety] = useState(false);
  const [selectedPatientForSurgicalSafety, setSelectedPatientForSurgicalSafety] = useState<PatientWithRelations | null>(null);
  const [selectedBedForSurgicalSafety, setSelectedBedForSurgicalSafety] = useState<BedData | null>(null);
  
  // Anaesthesia Notes Form state
  const [showAnaesthesiaNotes, setShowAnaesthesiaNotes] = useState(false);
  const [selectedPatientForAnaesthesiaNotes, setSelectedPatientForAnaesthesiaNotes] = useState<PatientWithRelations | null>(null);
  const [selectedBedForAnaesthesiaNotes, setSelectedBedForAnaesthesiaNotes] = useState<BedData | null>(null);
  
  // Intra Operative Notes Form state
  const [showIntraOperativeNotes, setShowIntraOperativeNotes] = useState(false);
  const [selectedPatientForIntraOperativeNotes, setSelectedPatientForIntraOperativeNotes] = useState<PatientWithRelations | null>(null);
  const [selectedBedForIntraOperativeNotes, setSelectedBedForIntraOperativeNotes] = useState<BedData | null>(null);
  
  // Post Operative Orders Form state
  const [showPostOperativeOrders, setShowPostOperativeOrders] = useState(false);
  const [selectedPatientForPostOperativeOrders, setSelectedPatientForPostOperativeOrders] = useState<PatientWithRelations | null>(null);
  const [selectedBedForPostOperativeOrders, setSelectedBedForPostOperativeOrders] = useState<BedData | null>(null);
  
  // Physiotherapy Notes Form state
  const [showPhysiotherapyNotes, setShowPhysiotherapyNotes] = useState(false);
  const [selectedPatientForPhysiotherapyNotes, setSelectedPatientForPhysiotherapyNotes] = useState<PatientWithRelations | null>(null);
  const [selectedBedForPhysiotherapyNotes, setSelectedBedForPhysiotherapyNotes] = useState<BedData | null>(null);
  
  // Blood Transfusion Monitoring Form state
  const [showBloodTransfusion, setShowBloodTransfusion] = useState(false);
  const [selectedPatientForBloodTransfusion, setSelectedPatientForBloodTransfusion] = useState<Patient | null>(null);
  const [selectedBedForBloodTransfusion, setSelectedBedForBloodTransfusion] = useState<BedData | null>(null);
  
  // Discharge Modal state
  const [showDischargeModal, setShowDischargeModal] = useState(false);
  const [selectedAdmissionForDischarge, setSelectedAdmissionForDischarge] = useState<PatientAdmissionWithRelations | null>(null);
  
  // Patient Admission Form state
  const [showPatientAdmissionForm, setShowPatientAdmissionForm] = useState(false);
  const [selectedPatientForAdmissionForm, setSelectedPatientForAdmissionForm] = useState<PatientWithRelations | null>(null);
  const [selectedBedForAdmissionForm, setSelectedBedForAdmissionForm] = useState<BedData | null>(null);
  
  // Surgical Record expansion state
  const [expandedSurgicalRecordBed, setExpandedSurgicalRecordBed] = useState<string | null>(null);
  
  // IPD Consents state
  const [showIPDConsents, setShowIPDConsents] = useState(false);
  const [selectedPatientForConsents, setSelectedPatientForConsents] = useState<PatientWithRelations | null>(null);
  const [selectedBedForConsents, setSelectedBedForConsents] = useState<BedData | null>(null);
  
  // IPD Statistics state
  const [ipdStats, setIPDStats] = useState(() => getIPDStats());
  const [selectedPatientForNursing, setSelectedPatientForNursing] = useState<PatientWithRelations | null>(null);
  const [selectedBedForNursing, setSelectedBedForNursing] = useState<BedData | null>(null);
  const [expandedAdmissionHistoryBed, setExpandedAdmissionHistoryBed] = useState<string | null>(null);

  // TAT timer management
  useEffect(() => {
    const interval = setInterval(() => {
      setBeds(prevBeds => 
        prevBeds.map(bed => {
          if (bed.status === 'occupied' && bed.tatStatus === 'running' && bed.tatStartTime) {
            const now = Date.now();
            const elapsed = Math.floor((now - bed.tatStartTime) / 1000);
            const remaining = Math.max(0, (30 * 60) - elapsed); // 30 minutes in seconds
            
            if (remaining === 0 && bed.tatStatus === 'running') {
              // TAT expired
              toast.error(`TAT expired for patient in Bed ${bed.number}!`, {
                duration: 5000,
                style: { background: '#FEE2E2', color: '#DC2626' }
              });
              return {
                ...bed,
                tatStatus: 'expired' as const,
                tatRemainingSeconds: 0
              };
            }
            
            return {
              ...bed,
              tatRemainingSeconds: remaining
            };
          }
          return bed;
        })
      );
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Load beds from database on component mount
  useEffect(() => {
    loadBedsFromDatabase();
  }, []);

  // Subscribe to real-time bed changes
  useEffect(() => {
    const subscription = BedService.subscribeToBedsChanges(async (payload) => {
      console.log('🔄 Real-time bed change detected:', payload);
      // Reload beds when changes occur
      await loadBedsFromDatabase();
    });

    return () => {
      BedService.unsubscribeFromBedsChanges(subscription);
    };
  }, []);

  // Filter beds when search term or filter status changes
  useEffect(() => {
    filterBeds();
  }, [beds, searchTerm, filterStatus]);

  // DEBUG: Show exact database contents
  const debugDatabaseBeds = async () => {
    try {
      console.log('🔍 DEBUGGING: Checking database contents...');
      const dbBeds = await BedService.getAllBeds();
      console.log('🔍 TOTAL BEDS IN DATABASE:', dbBeds.length);
      console.log('🔍 BED NUMBERS:', dbBeds.map(bed => bed.bed_number).sort());
      
      const bedNumbers = dbBeds.map(bed => parseInt(bed.bed_number)).filter(num => !isNaN(num));
      const duplicates = bedNumbers.filter((num, index) => bedNumbers.indexOf(num) !== index);
      
      if (duplicates.length > 0) {
        console.log('🚨 DUPLICATE BED NUMBERS FOUND:', duplicates);
        alert(`Found ${duplicates.length} duplicate beds in DATABASE: ${duplicates.join(', ')}\n\nThe issue is in your main Supabase database, not local!`);
      } else {
        alert(`Database contains ${dbBeds.length} beds. No duplicates found locally.`);
      }
      
    } catch (error) {
      console.error('❌ Debug failed:', error);
    }
  };

  // Clear local state and force fresh load
  const clearLocalStateAndReload = async () => {
    try {
      console.log('🧹 Clearing local state and forcing fresh reload...');
      
      // Clear any localStorage remnants
      Object.keys(localStorage).forEach(key => {
        if (key.includes('bed') || key.includes('ipd') || key.includes('hospital')) {
          console.log('🗑️ Removing localStorage key:', key);
          localStorage.removeItem(key);
        }
      });
      
      // Clear current state
      setBeds([]);
      setFilteredBeds([]);
      
      // Force reload from database
      await loadBedsFromDatabase();
      
    } catch (error) {
      console.error('❌ Error clearing local state:', error);
      toast.error('Failed to clear local state');
    }
  };

  // Load beds from database
  const loadBedsFromDatabase = async () => {
    try {
      console.log('🏥 Loading beds from MAIN database (not local)...');
      
      // Get all beds with patient information directly from main database
      console.log('🔍 Fetching beds from database...');
      const dbBeds = await BedService.getAllBeds();
      console.log('📋 Raw beds data from database:', dbBeds);
      console.log('📊 Loaded beds from database:', dbBeds?.length || 0, 'beds');
      
      // Transform database beds to match component interface
      const transformedBeds: BedData[] = dbBeds.map(dbBed => {
        console.log(`🔍 Bed ${dbBed.bed_number} - IPD Number from DB:`, dbBed.ipd_number);
        return {
          ...dbBed,
          number: parseInt(dbBed.bed_number),
          status: (dbBed.status === 'OCCUPIED' || dbBed.status === 'occupied') ? 'occupied' : 'vacant',
          patient: dbBed.patients as PatientWithRelations,
          admissionDate: dbBed.admission_date,
          ipdNumber: dbBed.ipd_number,
        tatStartTime: dbBed.tat_start_time,
        tatStatus: dbBed.tat_status || 'idle',
        tatRemainingSeconds: dbBed.tat_remaining_seconds || 1800,
        consentFormData: dbBed.consent_form_data,
        consentFormSubmitted: dbBed.consent_form_submitted || false,
        clinicalRecordData: dbBed.clinical_record_data,
        clinicalRecordSubmitted: dbBed.clinical_record_submitted || false,
        progressSheetData: dbBed.progress_sheet_data,
        progressSheetSubmitted: dbBed.progress_sheet_submitted || false,
        nursesOrdersData: dbBed.nurses_orders_data,
        nursesOrdersSubmitted: dbBed.nurses_orders_submitted || false,
        ipdConsentsData: dbBed.ipd_consents_data,
        physiotherapyNotesSubmitted: false, // Default values for missing fields
        bloodTransfusionSubmitted: false
        };
      });
      
      // Sort beds numerically by bed number
      const sortedBeds = transformedBeds.sort((a, b) => a.number - b.number);
      
      setBeds(sortedBeds);
      console.log('✅ Beds loaded and transformed successfully, total beds:', sortedBeds.length);
      
      // Update stats
      const stats = await BedService.getIPDStats();
      setIPDStats(stats);
      
    } catch (error) {
      console.error('❌ Error loading beds from database:', error);
      console.error('❌ Error details:', {
        message: error?.message,
        code: error?.code,
        details: error?.details,
        hint: error?.hint,
        stack: error?.stack
      });
      toast.error(`Failed to load bed data: ${error?.message || 'Unknown error'}`);
    }
  };

  const initializeBeds = async () => {
    await loadBedsFromDatabase();
  };

  const filterBeds = () => {
    let filtered = beds;

    // Apply status filter
    if (filterStatus !== 'all') {
      filtered = filtered.filter(bed => bed.status === filterStatus);
    }

    // Apply search filter
    if (searchTerm.trim()) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(bed => 
        `bed ${bed.number}`.toLowerCase().includes(search) ||
        bed.patient?.first_name?.toLowerCase().includes(search) ||
        bed.patient?.last_name?.toLowerCase().includes(search) ||
        bed.patient?.patient_id?.toLowerCase().includes(search)
      );
    }

    setFilteredBeds(filtered);
  };

  const getStatistics = () => {
    const totalBeds = beds.length;
    const occupiedBeds = beds.filter(bed => bed.status === 'occupied').length;
    const vacantBeds = totalBeds - occupiedBeds;
    const occupancyRate = totalBeds > 0 ? (occupiedBeds / totalBeds) * 100 : 0;

    return { totalBeds, occupiedBeds, vacantBeds, occupancyRate };
  };

  const handleAdmitClick = (bedId: string) => {
    setSelectedBedForAdmission(bedId);
    // Set default date to today
    const today = new Date().toISOString().split('T')[0];
    setCustomAdmissionDate(today);
    setUseCustomDate(false);
    setShowPatientSelection(true);
  };

  const handlePatientSelection = async (patient: PatientWithRelations) => {
    if (!selectedBedForAdmission) return;

    // Debug logging
    console.log('🔍 Admission validation:');
    console.log('- useCustomDate:', useCustomDate);
    console.log('- customAdmissionDate:', customAdmissionDate);
    console.log('- selectedBedForAdmission:', selectedBedForAdmission);

    // Validate custom date if selected
    if (useCustomDate && (!customAdmissionDate || !customAdmissionDate.trim())) {
      console.error('❌ Custom date validation failed');
      toast.error('Please select a custom admission date or use today\'s date');
      return;
    }

    // Get the bed for admission
    const selectedBed = beds.find(b => b.id === selectedBedForAdmission);
    if (!selectedBed) return;

    // Use custom date if provided, otherwise use current date (declare outside try block)
    let admissionDateToUse;
    if (useCustomDate && customAdmissionDate && customAdmissionDate.trim()) {
      try {
        // Parse the date and set to start of day in local timezone
        const customDate = new Date(customAdmissionDate + 'T00:00:00');
        admissionDateToUse = customDate.toISOString();
      } catch (error) {
        console.error('❌ Invalid custom date format:', customAdmissionDate, error);
        toast.error('Invalid date format. Using today\'s date instead.');
        admissionDateToUse = new Date().toISOString();
      }
    } else {
      admissionDateToUse = new Date().toISOString();
    }

    try {
      
      console.log('📅 Using admission date:', admissionDateToUse);
      
      // Use BedService to admit patient (this handles IPD generation and database updates)
      const updatedBed = await BedService.admitPatientToBed(selectedBed.id, patient, admissionDateToUse);
      
      console.log('✅ Patient admitted successfully via BedService');
      console.log('💾 Updated bed with IPD:', updatedBed.ipd_number);
      
      console.log('💾 Updated bed from BedService:', updatedBed);
      console.log('💾 IPD Number in updated bed:', updatedBed.ipd_number);
      
      // Refresh beds from database to get latest state
      await loadBedsFromDatabase();
      
      // Update patient's IPD status (if columns exist)
      try {
        await HospitalService.updatePatient(patient.id, {
          ipd_status: 'ADMITTED',
          ipd_bed_number: selectedBed.number.toString()
        });
      } catch (updateError) {
        console.warn('⚠️ Patient IPD status update failed (columns may not exist):', updateError);
        // Continue with admission even if IPD status update fails
      }

      toast.success(`Patient ${patient.first_name} ${patient.last_name} admitted to bed ${selectedBed.number}`);
      
      // Close patient selection and immediately show IPD consent form
      setShowPatientSelection(false);
      
      // Use the updated bed data directly from BedService (has the correct IPD number)
      const bedForConsents = {
        ...selectedBed,
        ipdNumber: updatedBed.ipd_number,
        ipd_number: updatedBed.ipd_number,
        patient: updatedBed.patients as PatientWithRelations,
        status: 'occupied' as const,
        admissionDate: updatedBed.admission_date
      };
      
      console.log('🏥 Bed data for IPD consents:', bedForConsents);
      console.log('🏥 IPD Number being passed to consent forms:', bedForConsents.ipdNumber);
      
      setSelectedPatientForIPDConsent(patient);
      setSelectedBedForIPDConsent(bedForConsents);
      setShowIPDConsentForm(true);
      
      setSelectedBedForAdmission(null);
    } catch (error: any) {
      console.error('❌ Failed to admit patient:');
      console.log(error); // Use console.log to expand the full error
      console.error('❌ Error message:', error?.message);
      console.error('❌ Error code:', error?.code);
      console.error('❌ Error details:', error?.details);
      console.error('❌ Full error JSON:', JSON.stringify(error, null, 2));
      
      // Show detailed error message
      let errorMessage = 'Failed to admit patient. ';
      
      if (error?.message) {
        errorMessage += error.message;
      } else if (error?.code === '23502') {
        errorMessage += 'Missing required field in database.';
      } else {
        errorMessage += 'Please check console for details.';
      }
      
      toast.error(errorMessage);
      
      // Also log the context data
      console.error('❌ Context data:');
      console.log({
        patient: patient,
        selectedBedForAdmission: selectedBedForAdmission,
        admissionDateToUse: admissionDateToUse
      });
    }
  };

  const handleShowConsentForm = (bed: BedData) => {
    if (bed.patient) {
      setSelectedPatientForIPDConsent(bed.patient);
      setSelectedBedForIPDConsent(bed);
      setShowIPDConsentForm(true);
    }
  };

  const handleShowTatForm = (bed: BedData) => {
    if (bed.patient) {
      setSelectedPatientForTat(bed.patient);
      setSelectedBedForTat(bed);
      setShowTatForm(true);
    }
  };

  const handleShowPatientAdmissionForm = (bed: BedData) => {
    if (bed.patient) {
      setSelectedPatientForAdmissionForm(bed.patient);
      setSelectedBedForAdmissionForm(bed);
      setShowPatientAdmissionForm(true);
    }
  };

  const handleIPDConsentSubmit = (consentData: any) => {
    if (!selectedBedForIPDConsent) return;

    // Save consent data to the bed
    setBeds(prevBeds =>
      prevBeds.map(bed => {
        if (bed.id === selectedBedForIPDConsent.id) {
          return {
            ...bed,
            consentFormData: consentData,
            consentFormSubmitted: true
          };
        }
        return bed;
      })
    );

    // Close the form
    setShowIPDConsentForm(false);
    setSelectedPatientForIPDConsent(null);
    setSelectedBedForIPDConsent(null);
    
    toast.success('IPD Consent form submitted and saved successfully');
  };

  const handleTatFormSubmit = (tatData: any) => {
    if (!selectedBedForTat) return;

    // Save TAT data to the bed
    setBeds(prevBeds =>
      prevBeds.map(bed => {
        if (bed.id === selectedBedForTat.id) {
          return {
            ...bed,
            tatFormData: tatData,
            tatFormSubmitted: true
          };
        }
        return bed;
      })
    );

    // Close the form
    setShowTatForm(false);
    setSelectedPatientForTat(null);
    setSelectedBedForTat(null);
    toast.success('Initial Nursing Assessment submitted successfully');
  };

  const handlePACRecordSubmit = (pacData: any) => {
    if (!selectedBedForPAC) return;

    // Save PAC record data to the bed
    setBeds(prevBeds =>
      prevBeds.map(bed => {
        if (bed.id === selectedBedForPAC.id) {
          return {
            ...bed,
            pacRecordData: pacData,
            pacRecordSubmitted: true
          };
        }
        return bed;
      })
    );

    // Close the form
    setShowPACRecord(false);
    setSelectedPatientForPAC(null);
    setSelectedBedForPAC(null);
    toast.success('PAC Record saved successfully!');
  };

  const handlePreOpOrdersSubmit = (preOpData: any) => {
    if (!selectedBedForPreOpOrders) return;

    // Save Pre-Operative Orders data to the bed
    setBeds(prevBeds =>
      prevBeds.map(bed => {
        if (bed.id === selectedBedForPreOpOrders.id) {
          return {
            ...bed,
            preOpOrdersData: preOpData,
            preOpOrdersSubmitted: true
          };
        }
        return bed;
      })
    );

    // Close the form
    setShowPreOpOrders(false);
    setSelectedPatientForPreOpOrders(null);
    setSelectedBedForPreOpOrders(null);
    toast.success('Pre-Operative Orders saved successfully!');
  };

  const handlePreOpChecklistSubmit = (checklistData: any) => {
    if (!selectedBedForPreOpChecklist) return;

    // Save Pre-OP-Check List data to the bed
    setBeds(prevBeds =>
      prevBeds.map(bed => {
        if (bed.id === selectedBedForPreOpChecklist.id) {
          return {
            ...bed,
            preOpChecklistData: checklistData,
            preOpChecklistSubmitted: true
          };
        }
        return bed;
      })
    );

    // Close the form
    setShowPreOpChecklist(false);
    setSelectedPatientForPreOpChecklist(null);
    setSelectedBedForPreOpChecklist(null);
    toast.success('Pre-OP-Check List saved successfully!');
  };

  const handleSurgicalSafetySubmit = (safetyData: any) => {
    if (!selectedBedForSurgicalSafety) return;

    // Save Surgical Safety Checklist data to the bed
    setBeds(prevBeds =>
      prevBeds.map(bed => {
        if (bed.id === selectedBedForSurgicalSafety.id) {
          return {
            ...bed,
            surgicalSafetyData: safetyData,
            surgicalSafetySubmitted: true
          };
        }
        return bed;
      })
    );

    // Close the form
    setShowSurgicalSafety(false);
    setSelectedPatientForSurgicalSafety(null);
    setSelectedBedForSurgicalSafety(null);
    toast.success('Surgical Safety Checklist saved successfully!');
  };

  const handleAnaesthesiaNotesSubmit = (anaesthesiaData: any) => {
    if (!selectedBedForAnaesthesiaNotes) return;

    // Save Anaesthesia Notes data to the bed
    setBeds(prevBeds =>
      prevBeds.map(bed => {
        if (bed.id === selectedBedForAnaesthesiaNotes.id) {
          return {
            ...bed,
            anaesthesiaNotesData: anaesthesiaData,
            anaesthesiaNotesSubmitted: true
          };
        }
        return bed;
      })
    );

    // Close the form
    setShowAnaesthesiaNotes(false);
    setSelectedPatientForAnaesthesiaNotes(null);
    setSelectedBedForAnaesthesiaNotes(null);
    toast.success('Anaesthesia Notes saved successfully!');
  };

  const handleIntraOperativeNotesSubmit = (intraOperativeData: any) => {
    if (!selectedBedForIntraOperativeNotes) return;

    // Save Intra Operative Notes data to the bed
    setBeds(prevBeds =>
      prevBeds.map(bed => {
        if (bed.id === selectedBedForIntraOperativeNotes.id) {
          return {
            ...bed,
            intraOperativeNotesData: intraOperativeData,
            intraOperativeNotesSubmitted: true
          };
        }
        return bed;
      })
    );

    // Close the form
    setShowIntraOperativeNotes(false);
    setSelectedPatientForIntraOperativeNotes(null);
    setSelectedBedForIntraOperativeNotes(null);
    toast.success('Intra Operative Notes saved successfully!');
  };

  const handlePostOperativeOrdersSubmit = (postOperativeData: any) => {
    if (!selectedBedForPostOperativeOrders) return;

    // Save Post Operative Orders data to the bed
    setBeds(prevBeds =>
      prevBeds.map(bed => {
        if (bed.id === selectedBedForPostOperativeOrders.id) {
          return {
            ...bed,
            postOperativeOrdersData: postOperativeData,
            postOperativeOrdersSubmitted: true
          };
        }
        return bed;
      })
    );

    // Close the form
    setShowPostOperativeOrders(false);
    setSelectedPatientForPostOperativeOrders(null);
    setSelectedBedForPostOperativeOrders(null);
    toast.success('Post Operative Orders saved successfully!');
  };

  const handlePhysiotherapyNotesSubmit = (physiotherapyData: any) => {
    if (!selectedBedForPhysiotherapyNotes) return;
    // Save Physiotherapy Notes data to the bed
    setBeds(prevBeds =>
      prevBeds.map(bed => {
        if (bed.id === selectedBedForPhysiotherapyNotes.id) {
          return {
            ...bed,
            physiotherapyNotesData: physiotherapyData,
            physiotherapyNotesSubmitted: true
          };
        }
        return bed;
      })
    );
    // Close the form
    setShowPhysiotherapyNotes(false);
    setSelectedPatientForPhysiotherapyNotes(null);
    setSelectedBedForPhysiotherapyNotes(null);
    toast.success('Physiotherapy Notes saved successfully!');
  };

  const handleShowClinicalRecord = (bed: BedData) => {
    if (bed.patient) {
      setSelectedPatientForClinicalRecord(bed.patient);
      setSelectedBedForClinicalRecord(bed);
      setShowClinicalRecordForm(true);
    }
  };

  const handleToggleConsultationOrders = (bedId: string) => {
    setExpandedConsultationOrdersBed(expandedConsultationOrdersBed === bedId ? null : bedId);
  };

  const handleToggleNursesOrders = (bedId: string) => {
    setExpandedNursesOrdersBed(expandedNursesOrdersBed === bedId ? null : bedId);
  };

  const handleToggleAdmissionHistory = (bedId: string) => {
    setExpandedAdmissionHistoryBed(expandedAdmissionHistoryBed === bedId ? null : bedId);
  };

  const handleToggleSurgicalRecord = (bedId: string) => {
    setExpandedSurgicalRecordBed(expandedSurgicalRecordBed === bedId ? null : bedId);
  };

  const handleShowIPDConsents = (bed: BedData) => {
    if (bed.patient) {
      // Get the latest bed data from current state to ensure we have updated consent data
      const latestBed = beds.find(b => b.id === bed.id) || bed;
      console.log('Opening IPD consents for bed:', latestBed);
      console.log('Bed has consent data:', latestBed.ipdConsentsData);
      
      setSelectedPatientForConsents(bed.patient);
      setSelectedBedForConsents(latestBed);
      setShowIPDConsents(true);
    }
  };

  const handleCloseIPDConsents = () => {
    setShowIPDConsents(false);
    setSelectedPatientForConsents(null);
    setSelectedBedForConsents(null);
  };

  const handleIPDConsentsSubmit = (formId: string, data: any) => {
    if (!selectedBedForConsents) return;

    console.log('Saving IPD consent:', { formId, data, bedId: selectedBedForConsents.id });

    // Save IPD consents data to the bed
    setBeds(prevBeds =>
      prevBeds.map(bed => {
        if (bed.id === selectedBedForConsents.id) {
          const newBed = {
            ...bed,
            ipdConsentsData: {
              ...(bed.ipdConsentsData || {}),
              [formId]: data
            },
            ipdConsentsSubmitted: true
          };
          console.log('Updated bed with consent data:', newBed);
          return newBed;
        }
        return bed;
      })
    );

    toast.success(`${formId.charAt(0).toUpperCase() + formId.slice(1)} consent form saved successfully!`);
  };

  const handleShowPACRecord = (bed: BedData) => {
    if (bed.patient) {
      setSelectedPatientForPAC(bed.patient);
      setSelectedBedForPAC(bed);
      setShowPACRecord(true);
    }
  };

  const handleShowPreOpOrders = (bed: BedData) => {
    if (bed.patient) {
      setSelectedPatientForPreOpOrders(bed.patient);
      setSelectedBedForPreOpOrders(bed);
      setShowPreOpOrders(true);
    }
  };

  const handleShowPreOpChecklist = (bed: BedData) => {
    if (bed.patient) {
      setSelectedPatientForPreOpChecklist(bed.patient);
      setSelectedBedForPreOpChecklist(bed);
      setShowPreOpChecklist(true);
    }
  };

  const handleShowSurgicalSafety = (bed: BedData) => {
    if (bed.patient) {
      setSelectedPatientForSurgicalSafety(bed.patient);
      setSelectedBedForSurgicalSafety(bed);
      setShowSurgicalSafety(true);
    }
  };

  const handleShowAnaesthesiaNotes = (bed: BedData) => {
    if (bed.patient) {
      setSelectedPatientForAnaesthesiaNotes(bed.patient);
      setSelectedBedForAnaesthesiaNotes(bed);
      setShowAnaesthesiaNotes(true);
    }
  };

  const handleShowIntraOperativeNotes = (bed: BedData) => {
    if (bed.patient) {
      setSelectedPatientForIntraOperativeNotes(bed.patient);
      setSelectedBedForIntraOperativeNotes(bed);
      setShowIntraOperativeNotes(true);
    }
  };

  const handleShowPostOperativeOrders = (bed: BedData) => {
    if (bed.patient) {
      setSelectedPatientForPostOperativeOrders(bed.patient);
      setSelectedBedForPostOperativeOrders(bed);
      setShowPostOperativeOrders(true);
    }
  };

  const handleShowPhysiotherapyNotes = (bed: BedData) => {
    if (bed.patient) {
      setSelectedPatientForPhysiotherapyNotes(bed.patient);
      setSelectedBedForPhysiotherapyNotes(bed);
      setShowPhysiotherapyNotes(true);
    }
  };

  const handleBloodTransfusionSubmit = (bloodTransfusionData: any) => {
    if (!selectedBedForBloodTransfusion) return;
    // Save Blood Transfusion Monitoring data to the bed
    setBeds(prevBeds =>
      prevBeds.map(bed => {
        if (bed.id === selectedBedForBloodTransfusion.id) {
          return {
            ...bed,
            bloodTransfusionData: bloodTransfusionData,
            bloodTransfusionSubmitted: true
          };
        }
        return bed;
      })
    );
    // Close the form
    setShowBloodTransfusion(false);
    setSelectedPatientForBloodTransfusion(null);
    setSelectedBedForBloodTransfusion(null);
  };

  const handleShowBloodTransfusion = (bed: BedData) => {
    if (bed.patient) {
      setSelectedPatientForBloodTransfusion(bed.patient);
      setSelectedBedForBloodTransfusion(bed);
      setShowBloodTransfusion(true);
    }
  };

  const handleShowProgressSheet = (bed: BedData) => {
    if (bed.patient) {
      setSelectedPatientForProgressSheet(bed.patient);
      setSelectedBedForProgressSheet(bed);
      setShowProgressSheet(true);
    }
  };

  // Individual Nursing Form Handlers
  const handleShowVitalCharts = (bed: BedData) => {
    if (bed.patient) {
      console.log(`📊 Opening VitalCharts for bed ${bed.number}`);
      console.log(`📊 Bed data:`, bed);
      console.log(`📊 IPD Number in bed: ${bed.ipdNumber}`);
      setSelectedPatientForNursing(bed.patient);
      setSelectedBedForNursing(bed);
      setShowVitalCharts(true);
    }
  };

  const handleShowIntakeOutput = (bed: BedData) => {
    if (bed.patient) {
      console.log(`💧 Opening IntakeOutput for bed ${bed.number}, IPD Number: ${bed.ipdNumber}`);
      setSelectedPatientForNursing(bed.patient);
      setSelectedBedForNursing(bed);
      setShowIntakeOutput(true);
    }
  };

  const handleShowMedicationChart = (bed: BedData) => {
    if (bed.patient) {
      setSelectedPatientForNursing(bed.patient);
      setSelectedBedForNursing(bed);
      setShowMedicationChart(true);
    }
  };

  const handleShowCarePlan = (bed: BedData) => {
    if (bed.patient) {
      setSelectedPatientForNursing(bed.patient);
      setSelectedBedForNursing(bed);
      setShowCarePlan(true);
    }
  };

  const handleShowDiabeticChart = (bed: BedData) => {
    if (bed.patient) {
      setSelectedPatientForNursing(bed.patient);
      setSelectedBedForNursing(bed);
      setShowDiabeticChart(true);
    }
  };

  const handleShowNursesNotes = (bed: BedData) => {
    if (bed.patient) {
      setSelectedPatientForNursing(bed.patient);
      setSelectedBedForNursing(bed);
      setShowNursesNotes(true);
    }
  };

  const handleClinicalRecordSubmit = (clinicalData: any) => {
    if (!selectedBedForClinicalRecord) return;

    // Save clinical record data to the bed
    setBeds(prevBeds =>
      prevBeds.map(bed => {
        if (bed.id === selectedBedForClinicalRecord.id) {
          return {
            ...bed,
            clinicalRecordData: clinicalData,
            clinicalRecordSubmitted: true
          };
        }
        return bed;
      })
    );

    // Close the form
    setShowClinicalRecordForm(false);
    setSelectedPatientForClinicalRecord(null);
    setSelectedBedForClinicalRecord(null);
    
    toast.success('Initial RMO Assessment submitted and saved successfully');
  };

  const handleProgressSheetSubmit = (progressData: any) => {
    if (!selectedBedForProgressSheet) return;

    // Save progress sheet data to the bed
    setBeds(prevBeds =>
      prevBeds.map(bed => {
        if (bed.id === selectedBedForProgressSheet.id) {
          return {
            ...bed,
            progressSheetData: progressData,
            progressSheetSubmitted: true
          };
        }
        return bed;
      })
    );

    // Close the form
    setShowProgressSheet(false);
    setSelectedPatientForProgressSheet(null);
    setSelectedBedForProgressSheet(null);
    
    toast.success('Doctor\'s Progress Sheet submitted and saved successfully');
  };

  // Individual Nursing Form Submit Handlers
  const handleVitalChartsSubmit = (vitalChartsData: any) => {
    if (!selectedBedForNursing) return;
    
    setBeds(prevBeds =>
      prevBeds.map(bed => {
        if (bed.id === selectedBedForNursing.id) {
          return {
            ...bed,
            nursesOrdersData: { ...bed.nursesOrdersData, vitalCharts: vitalChartsData },
            nursesOrdersSubmitted: true
          };
        }
        return bed;
      })
    );

    setShowVitalCharts(false);
    setSelectedPatientForNursing(null);
    setSelectedBedForNursing(null);
  };

  const handleIntakeOutputSubmit = (intakeOutputData: any) => {
    if (!selectedBedForNursing) return;
    
    setBeds(prevBeds =>
      prevBeds.map(bed => {
        if (bed.id === selectedBedForNursing.id) {
          return {
            ...bed,
            nursesOrdersData: { ...bed.nursesOrdersData, intakeOutput: intakeOutputData },
            nursesOrdersSubmitted: true
          };
        }
        return bed;
      })
    );

    setShowIntakeOutput(false);
    setSelectedPatientForNursing(null);
    setSelectedBedForNursing(null);
  };

  const handleMedicationChartSubmit = (medicationData: any) => {
    if (!selectedBedForNursing) return;
    
    setBeds(prevBeds =>
      prevBeds.map(bed => {
        if (bed.id === selectedBedForNursing.id) {
          return {
            ...bed,
            nursesOrdersData: { ...bed.nursesOrdersData, medicationChart: medicationData },
            nursesOrdersSubmitted: true
          };
        }
        return bed;
      })
    );

    setShowMedicationChart(false);
    setSelectedPatientForNursing(null);
    setSelectedBedForNursing(null);
  };

  const handleCarePlanSubmit = (carePlanData: any) => {
    if (!selectedBedForNursing) return;
    
    setBeds(prevBeds =>
      prevBeds.map(bed => {
        if (bed.id === selectedBedForNursing.id) {
          return {
            ...bed,
            nursesOrdersData: { ...bed.nursesOrdersData, carePlan: carePlanData },
            nursesOrdersSubmitted: true
          };
        }
        return bed;
      })
    );

    setShowCarePlan(false);
    setSelectedPatientForNursing(null);
    setSelectedBedForNursing(null);
  };

  const handleDiabeticChartSubmit = (diabeticData: any) => {
    if (!selectedBedForNursing) return;
    
    setBeds(prevBeds =>
      prevBeds.map(bed => {
        if (bed.id === selectedBedForNursing.id) {
          return {
            ...bed,
            nursesOrdersData: { ...bed.nursesOrdersData, diabeticChart: diabeticData },
            nursesOrdersSubmitted: true
          };
        }
        return bed;
      })
    );

    setShowDiabeticChart(false);
    setSelectedPatientForNursing(null);
    setSelectedBedForNursing(null);
  };

  const handleNursesNotesSubmit = (nursesNotesData: any) => {
    if (!selectedBedForNursing) return;
    
    setBeds(prevBeds =>
      prevBeds.map(bed => {
        if (bed.id === selectedBedForNursing.id) {
          return {
            ...bed,
            nursesOrdersData: { ...bed.nursesOrdersData, nursesNotes: nursesNotesData },
            nursesOrdersSubmitted: true
          };
        }
        return bed;
      })
    );

    setShowNursesNotes(false);
    setSelectedPatientForNursing(null);
    setSelectedBedForNursing(null);
  };

  const handleConsentSubmit = async (consentData: any) => {
    // Just close the form - consent is submitted and handled by ProcedureConsentForm
    setShowProcedureConsent(false);
    setSelectedPatientForConsent(null);
    toast.success('Consent form submitted successfully');
  };

  // TAT Management Functions
  const startTAT = (bedId: string) => {
    setBeds(prevBeds =>
      prevBeds.map(bed => {
        if (bed.id === bedId && bed.status === 'occupied') {
          toast.success(`TAT started for Bed ${bed.number} - 30 minutes timer activated`);
          return {
            ...bed,
            tatStatus: 'running' as const,
            tatStartTime: Date.now(),
            tatRemainingSeconds: 30 * 60
          };
        }
        return bed;
      })
    );
  };

  const stopTAT = (bedId: string) => {
    setBeds(prevBeds =>
      prevBeds.map(bed => {
        if (bed.id === bedId) {
          toast.success(`TAT completed for Bed ${bed.number}`);
          return {
            ...bed,
            tatStatus: 'completed' as const,
            tatStartTime: undefined
          };
        }
        return bed;
      })
    );
  };

  const resetTAT = (bedId: string) => {
    setBeds(prevBeds =>
      prevBeds.map(bed => {
        if (bed.id === bedId) {
          return {
            ...bed,
            tatStatus: 'idle' as const,
            tatStartTime: undefined,
            tatRemainingSeconds: 30 * 60
          };
        }
        return bed;
      })
    );
  };

  // Format remaining time for display
  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Clear all bed data (for testing/reset purposes)
  const clearAllBedData = () => {
    localStorage.removeItem('hospital-ipd-beds');
    initializeBeds();
    setIPDStats(getIPDStats()); // Refresh stats after clearing
    toast.success('All bed data cleared and reset');
  };

  // Refresh IPD statistics
  const refreshIPDStats = () => {
    setIPDStats(getIPDStats());
    toast.info('IPD statistics refreshed');
  };



  const handleDischarge = (bedId: string) => {
    const bed = beds.find(b => b.id === bedId);
    if (!bed || !bed.patient) return;

    // Create admission object using the real admission ID stored in bed
    const admissionId = bed.admissionId || bed.patient.id; // Fallback to patient ID if no admission ID
    console.log('🔍 Using admission ID for discharge:', admissionId);
    
    const admissionForDischarge: PatientAdmissionWithRelations = {
      id: admissionId,
      patient_id: bed.patient.id,
      bed_id: bedId,
      admission_date: bed.admissionDate || new Date().toISOString(),
      status: 'ADMITTED' as const,
      hospital_id: HOSPITAL_ID,
      patient: bed.patient,
      bed: {
        id: bedId,
        bed_number: bed.number.toString(),
        status: 'OCCUPIED' as const,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        hospital_id: HOSPITAL_ID
      },
      created_at: bed.admissionDate || new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    setSelectedAdmissionForDischarge(admissionForDischarge);
    setShowDischargeModal(true);
  };

  const handleDischargeSuccess = async () => {
    // Refresh the beds data after successful discharge
    const bedId = selectedAdmissionForDischarge?.bed_id;
    const patientId = selectedAdmissionForDischarge?.patient_id;
    
    if (bedId) {
      // Update bed status to vacant
      setBeds(prevBeds => 
        prevBeds.map(b => {
          if (b.id === bedId) {
            return {
              ...b,
              status: 'vacant' as const,
              patient: undefined,
              admissionDate: undefined,
              tatStatus: 'idle' as const,
              tatStartTime: undefined,
              tatRemainingSeconds: 30 * 60,
              consentFormSubmitted: false,
              clinicalRecordSubmitted: false,
              progressSheetSubmitted: false,
              consentFormData: undefined,
              clinicalRecordData: undefined,
              progressSheetData: undefined,
              preOpChecklistSubmitted: false,
              preOpChecklistData: undefined,
              surgicalSafetySubmitted: false,
              surgicalSafetyData: undefined
            };
          }
          return b;
        })
      );
      
      // Update patient's IPD status to DISCHARGED in database
      if (patientId) {
        try {
          await HospitalService.updatePatient(patientId, {
            ipd_status: 'DISCHARGED',
            ipd_bed_number: null
          });
          console.log('✅ Patient IPD status updated to DISCHARGED after discharge');
          toast.success('Patient discharged and status updated successfully');
        } catch (updateError) {
          console.warn('⚠️ Patient IPD status update failed after discharge:', updateError);
          toast.warning('Patient discharged but status update failed - please refresh patient list');
        }
      }
    }
    
    // Close the modal
    setShowDischargeModal(false);
    setSelectedAdmissionForDischarge(null);
  };

  // Function to sync patient database with actual bed occupancy
  const syncPatientIPDStatus = async () => {
    try {
      // Get all patients with IPD status = ADMITTED (using high limit to get all)
      const admittedPatients = await HospitalService.getPatients(1000);
      const ipdPatients = admittedPatients.filter(p => p.ipd_status === 'ADMITTED');
      
      // Get all patients actually in beds
      const occupiedBeds = beds.filter(bed => bed.status === 'occupied' && bed.patient);
      const bedsPatientIds = occupiedBeds.map(bed => bed.patient?.id).filter(Boolean);
      
      // Find patients marked as IPD but not in any bed
      const orphanedPatients = ipdPatients.filter(patient => !bedsPatientIds.includes(patient.id));
      
      if (orphanedPatients.length > 0) {
        console.log(`🔄 Found ${orphanedPatients.length} patients marked as IPD but not in beds, fixing...`);
        
        // Update their status to DISCHARGED
        const updatePromises = orphanedPatients.map(patient => 
          HospitalService.updatePatient(patient.id, {
            ipd_status: 'DISCHARGED',
            ipd_bed_number: null
          })
        );
        
        await Promise.all(updatePromises);
        
        toast.success(`Fixed ${orphanedPatients.length} patients with inconsistent IPD status`);
        console.log('✅ IPD status sync completed');
      } else {
        console.log('✅ All IPD patient statuses are consistent');
      }
    } catch (error) {
      console.error('❌ Failed to sync IPD patient status:', error);
      toast.error('Failed to sync patient IPD status');
    }
  };

  // Function to clear all IPD entries from database (reset all patients to OPD)
  const clearAllIPDEntries = async () => {
    try {
      // Get all patients with any IPD status
      const allPatients = await HospitalService.getPatients(1000);
      const ipdPatients = allPatients.filter(p => 
        p.ipd_status === 'ADMITTED' || 
        p.ipd_status === 'DISCHARGED' || 
        p.ipd_bed_number
      );
      
      if (ipdPatients.length === 0) {
        toast.info('No IPD entries found in database');
        return;
      }

      console.log(`🗑️ Clearing IPD entries for ${ipdPatients.length} patients...`);
      
      // Clear IPD status and bed number for all patients
      const updatePromises = ipdPatients.map(patient => 
        HospitalService.updatePatient(patient.id, {
          ipd_status: null,
          ipd_bed_number: null
        })
      );
      
      await Promise.all(updatePromises);
      
      toast.success(`Cleared IPD entries for ${ipdPatients.length} patients`);
      console.log('✅ All IPD entries cleared from database');
      
    } catch (error) {
      console.error('❌ Failed to clear IPD entries:', error);
      toast.error('Failed to clear IPD entries from database');
    }
  };

  const statistics = getStatistics();

  return (
    <div className="max-w-7xl mx-auto p-6 bg-gray-50 min-h-screen">
      {/* Header Section */}
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">🏥 IPD Bed Management</h1>
          <p className="text-gray-600">Real-time hospital bed occupancy tracking</p>
        </div>
        <div className="flex gap-4">
          {/* IPD Statistics */}
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-sm font-semibold text-blue-800">📊 Today's IPD Statistics</h3>
              <button
                onClick={refreshIPDStats}
                className="text-xs px-2 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
                title="Refresh Statistics"
              >
                🔄
              </button>
            </div>
            <div className="text-sm space-y-1">
              <div><span className="font-medium">Date:</span> {ipdStats.date}</div>
              <div><span className="font-medium">Total Admissions:</span> {ipdStats.count}</div>
              <div><span className="font-medium">Last IPD No:</span> {ipdStats.lastIPD}</div>
              <div><span className="font-medium">Next IPD No:</span> IPD-{ipdStats.date}-{(ipdStats.count + 1).toString().padStart(3, '0')}</div>
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <button
              onClick={syncPatientIPDStatus}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"
            >
              🔄 Sync IPD Status
            </button>
          </div>
        </div>
      </div>

      {/* Search and Filter Bar */}
      <div className="bg-white rounded-lg shadow-sm border p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search Input */}
          <div className="flex-1 relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by bed number or patient name..."
              className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Filter Buttons */}
          <div className="flex rounded-lg overflow-hidden">
            <button
              onClick={() => setFilterStatus('all')}
              className={`px-6 py-3 text-sm font-medium transition-colors ${
                filterStatus === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilterStatus('occupied')}
              className={`px-6 py-3 text-sm font-medium border-l transition-colors ${
                filterStatus === 'occupied'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Occupied
            </button>
            <button
              onClick={() => setFilterStatus('vacant')}
              className={`px-6 py-3 text-sm font-medium border-l transition-colors ${
                filterStatus === 'vacant'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Vacant
            </button>
          </div>
        </div>
      </div>

      {/* Summary Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        {/* Total Beds */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Beds</p>
              <p className="text-3xl font-bold text-gray-900">{statistics.totalBeds}</p>
            </div>
            <Bed className="w-8 h-8 text-gray-400" />
          </div>
        </div>

        {/* Occupied */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Occupied</p>
              <p className="text-3xl font-bold text-green-600">{statistics.occupiedBeds}</p>
            </div>
            <User className="w-8 h-8 text-green-500" />
          </div>
        </div>

        {/* Vacant */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Vacant</p>
              <p className="text-3xl font-bold text-blue-600">{statistics.vacantBeds}</p>
            </div>
            <Users className="w-8 h-8 text-blue-500" />
          </div>
        </div>

        {/* Occupancy Rate */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between mb-2">
            <div>
              <p className="text-sm font-medium text-gray-600">Occupancy Rate</p>
              <p className="text-3xl font-bold text-gray-900">{statistics.occupancyRate.toFixed(1)}%</p>
            </div>
            <AlertCircle className="w-8 h-8 text-gray-400" />
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-green-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${statistics.occupancyRate}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Bed Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {filteredBeds.map((bed) => (
          <div
            key={bed.id}
            className={`rounded-lg shadow-sm border p-4 transition-all duration-200 ${
              bed.status === 'occupied'
                ? 'bg-green-100 border-green-200'
                : 'bg-white border-gray-200'
            }`}
          >
            {/* Bed Number */}
            <div className="text-sm font-medium text-gray-700 mb-3">
              Bed {bed.number}
            </div>

            {/* Icon and Status */}
            <div className="flex flex-col items-center mb-4">
              {bed.status === 'occupied' ? (
                <div className="text-4xl mb-2">🤒</div>
              ) : (
                <Bed className="w-12 h-12 text-gray-400 mb-2" />
              )}
              <span className={`text-sm font-medium ${
                bed.status === 'occupied' ? 'text-green-700' : 'text-gray-600'
              }`}>
                {bed.status === 'occupied' ? 'Occupied' : 'Vacant'}
              </span>
              {bed.patient && (
                <div className="text-center mt-2">
                  <div className="text-xs text-gray-600 font-medium">
                    {bed.patient.first_name} {bed.patient.last_name}
                  </div>
                  <div className="text-xs text-gray-500">
                    ID: {bed.patient.patient_id}
                  </div>
                  {bed.admissionDate && (
                    <div className="text-xs text-gray-500">
                      Admitted: {new Date(bed.admissionDate).toLocaleDateString('en-IN')}
                    </div>
                  )}
                  {/* Admission History Section - Above TAT Timer */}
                  <div className="mt-3 mb-2 p-2 bg-gradient-to-r from-cyan-50 to-blue-50 rounded-lg border border-cyan-200">
                    <div className="flex items-center justify-center mb-2">
                      <span className="text-xs font-medium text-cyan-700">📚 ADMISSION HISTORY</span>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleToggleAdmissionHistory(bed.id)}
                        className={`flex-1 text-white px-2 py-1 rounded text-xs flex items-center justify-center gap-1 ${
                          bed.consentFormSubmitted
                            ? "bg-green-500 hover:bg-green-600" 
                            : "bg-cyan-500 hover:bg-cyan-600"
                        }`}
                        disabled={false}
                        title="View admission history"
                      >
                        <span>{bed.consentFormSubmitted ? "📚✅" : "📚"}</span>
                        <span>View History</span>
                        <span className={`ml-1 transition-transform ${expandedAdmissionHistoryBed === bed.id ? "rotate-90" : ""}`}>
                          ▶
                        </span>
                        {bed.consentFormSubmitted && (
                          <span className="bg-white text-green-600 rounded-full text-xs px-1 min-w-[16px] h-4 flex items-center justify-center ml-1">
                            ✓
                          </span>
                        )}
                      </button>
                    </div>
                    
                    {/* Expanded Admission History Options */}
                    {expandedAdmissionHistoryBed === bed.id && (
                      <div className="mt-2 bg-white bg-opacity-80 p-2 rounded space-y-1">
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleShowConsentForm(bed)}
                            className={`flex-1 text-white px-2 py-1 rounded text-xs flex items-center justify-center gap-1 ${
                              bed.consentFormSubmitted 
                                ? "bg-orange-500 hover:bg-orange-600" 
                                : "bg-orange-400 hover:bg-orange-500"
                            }`}
                            disabled={false}
                            title="Access consent form"
                          >
                            <span>{bed.consentFormSubmitted ? "✅" : "📋"}</span>
                            <span>IPD Consent Form</span>
                            
                            {bed.consentFormSubmitted && (
                              <span className="bg-white text-green-600 rounded-full text-xs px-1 min-w-[16px] h-4 flex items-center justify-center">
                                ✓
                              </span>
                            )}
                          </button>
                        </div>
                        
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleShowPatientAdmissionForm(bed)}
                            className="flex-1 text-white px-2 py-1 rounded text-xs flex items-center justify-center gap-1 bg-purple-500 hover:bg-purple-600 font-medium border-2 border-purple-300"
                            disabled={false}
                            title="Access patient admission form"
                          >
                            <span>📝</span>
                            <span>Patient Admission Form</span>
                            <span>🏥</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  
                  {/* TAT Section */}
                  <div className="mt-3 p-2 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200">
                    <div className="flex items-center justify-center mb-2">
                      <Clock className="w-3 h-3 text-blue-500 mr-1" />
                      <span className="text-xs font-medium text-blue-700">TAT TIMER</span>
                    </div>
                    
                    {/* TAT Timer Display */}
                    <div className={`text-lg font-mono font-bold mb-2 text-center ${
                      bed.tatStatus === 'running' 
                        ? bed.tatRemainingSeconds && bed.tatRemainingSeconds < 300 
                          ? 'text-red-600' 
                          : 'text-blue-600'
                        : bed.tatStatus === 'expired' 
                          ? 'text-red-600' 
                          : bed.tatStatus === 'completed'
                            ? 'text-green-600'
                            : 'text-gray-500'
                    }`}>
                      {bed.tatRemainingSeconds !== undefined ? formatTime(bed.tatRemainingSeconds) : '30:00'}
                    </div>
                    
                    {/* TAT Status Indicator */}
                    <div className={`text-xs mb-2 font-medium text-center ${
                      bed.tatStatus === 'running' ? 'text-blue-600' :
                      bed.tatStatus === 'expired' ? 'text-red-600' :
                      bed.tatStatus === 'completed' ? 'text-green-600' :
                      'text-gray-500'
                    }`}>
                      {bed.tatStatus === 'running' && '⏱️ Running'}
                      {bed.tatStatus === 'expired' && '⚠️ Expired'}
                      {bed.tatStatus === 'completed' && '✅ Completed'}
                      {bed.tatStatus === 'idle' && '⏸️ Ready'}
                    </div>
                    
                    {/* TAT Controls */}
                    <div className="flex gap-1 mb-3">
                      {bed.tatStatus === 'idle' && (
                        <button
                          onClick={() => startTAT(bed.id)}
                          className="flex-1 bg-blue-500 text-white px-2 py-1 rounded text-xs hover:bg-blue-600 flex items-center justify-center"
                        >
                          <Play className="w-3 h-3 mr-1" />
                          Start TAT
                        </button>
                      )}
                      
                      {bed.tatStatus === 'running' && (
                        <button
                          onClick={() => stopTAT(bed.id)}
                          className="flex-1 bg-green-500 text-white px-2 py-1 rounded text-xs hover:bg-green-600 flex items-center justify-center"
                        >
                          <Square className="w-3 h-3 mr-1" />
                          Complete TAT
                        </button>
                      )}
                      
                      {(bed.tatStatus === 'completed' || bed.tatStatus === 'expired') && (
                        <button
                          onClick={() => resetTAT(bed.id)}
                          className="flex-1 bg-gray-500 text-white px-2 py-1 rounded text-xs hover:bg-gray-600 flex items-center justify-center"
                        >
                          <Clock className="w-3 h-3 mr-1" />
                          Reset TAT
                        </button>
                      )}
                    </div>
                    
                  {/* NEW: Admission History Section - Above TAT Timer */}
                  <div className="mt-3 mb-2 p-2 bg-gradient-to-r from-cyan-50 to-blue-50 rounded-lg border border-cyan-200">
                    <div className="flex items-center justify-center mb-2">
                        <button
                          onClick={() => handleToggleAdmissionHistory(bed.id)}
                          className={`flex-1 text-white px-2 py-1 rounded text-xs flex items-center justify-center gap-1 ${
                            bed.consentFormSubmitted && bed.clinicalRecordSubmitted && bed.tatFormSubmitted
                              ? 'bg-green-500 hover:bg-green-600' 
                              : 'bg-cyan-500 hover:bg-cyan-600'
                          }`}
                          disabled={bed.tatStatus === 'idle'}
                          title={bed.tatStatus === 'idle' ? 'Start TAT timer first to access admission history' : ''}
                        >
                          <span>{bed.consentFormSubmitted && bed.clinicalRecordSubmitted && bed.tatFormSubmitted ? '📚✅' : '📚'}</span>
                          <span>TAT Forms</span>
                          <span className={`ml-1 transition-transform ${expandedAdmissionHistoryBed === bed.id ? 'rotate-90' : ''}`}>
                            ▶
                          </span>
                          {bed.consentFormSubmitted && bed.clinicalRecordSubmitted && bed.tatFormSubmitted && (
                            <span className="bg-white text-green-600 rounded-full text-xs px-1 min-w-[16px] h-4 flex items-center justify-center ml-1">
                              ✓
                            </span>
                          )}
                        </button>
                      </div>
                      
                      {/* Expanded Admission History Options - Now includes Initial Nursing Assessment */}
                      {expandedAdmissionHistoryBed === bed.id && (
                        <div className="mt-2 bg-white bg-opacity-80 p-2 rounded space-y-1">
                          {/* Initial Nursing Assessment - Now inside Admission History */}
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleShowTatForm(bed)}
                              className={`flex-1 text-white px-2 py-1 rounded text-xs flex items-center justify-center gap-1 ${
                                bed.tatFormSubmitted 
                                  ? 'bg-green-500 hover:bg-green-600' 
                                  : 'bg-blue-500 hover:bg-blue-600'
                              }`}
                              disabled={bed.tatStatus === 'idle' || bed.tatStatus === 'expired'}
                              title={bed.tatStatus === 'idle' ? 'Start TAT timer first' : bed.tatStatus === 'expired' ? 'TAT timer expired - reset to continue' : ''}
                            >
                              <span>{bed.tatFormSubmitted ? '✅' : '📋'}</span>
                              <span>Initial Nursing Assessment</span>
                              {bed.tatStatus === 'expired' && <span className="text-red-200 ml-1">⚠️</span>}
                              {bed.tatFormSubmitted && (
                                <span className="bg-white text-green-600 rounded-full text-xs px-1 min-w-[16px] h-4 flex items-center justify-center">
                                  ✓
                                </span>
                              )}
                            </button>
                          </div>
                          
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleShowClinicalRecord(bed)}
                              className={`flex-1 text-white px-2 py-1 rounded text-xs flex items-center justify-center gap-1 ${
                                bed.clinicalRecordSubmitted 
                                  ? 'bg-blue-500 hover:bg-blue-600' 
                                  : 'bg-indigo-500 hover:bg-indigo-600'
                              }`}
                              disabled={bed.tatStatus === 'idle' || bed.tatStatus === 'expired'}
                              title={bed.tatStatus === 'idle' ? 'Start TAT timer first' : bed.tatStatus === 'expired' ? 'TAT timer expired - reset to continue' : ''}
                            >
                              <span>{bed.clinicalRecordSubmitted ? '📋✅' : '📋'}</span>
                              <span>Initial RMO Assessment</span>
                              {bed.tatStatus === 'expired' && <span className="text-red-200 ml-1">⚠️</span>}
                              {bed.clinicalRecordSubmitted && (
                                <span className="bg-white text-blue-600 rounded-full text-xs px-1 min-w-[16px] h-4 flex items-center justify-center">
                                  ✓
                                </span>
                              )}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Notes and Consent Buttons - Only show for occupied beds */}
            {bed.status === 'occupied' && (
              <div className="mb-3 space-y-3">


                {/* Consultation Orders Section */}
                <div className="border-t border-gray-200 pt-2">
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleToggleConsultationOrders(bed.id)}
                      className={`flex-1 text-white px-2 py-1 rounded text-xs flex items-center justify-center gap-1 ${
                        bed.progressSheetSubmitted
                          ? 'bg-green-500 hover:bg-green-600' 
                          : 'bg-purple-500 hover:bg-purple-600'
                      }`}
                    >
                      <span>{bed.progressSheetSubmitted ? '👨‍⚕️✅' : '👨‍⚕️'}</span>
                      <span>Consultation Orders</span>
                      <span className={`ml-1 transition-transform ${expandedConsultationOrdersBed === bed.id ? 'rotate-90' : ''}`}>
                        ▶
                      </span>
                      {bed.progressSheetSubmitted && (
                        <span className="bg-white text-green-600 rounded-full text-xs px-1 min-w-[16px] h-4 flex items-center justify-center ml-1">
                          ✓
                        </span>
                      )}
                    </button>
                  </div>
                  
                  {/* Expanded Consultation Orders Options */}
                  {expandedConsultationOrdersBed === bed.id && (
                    <div className="mt-2 bg-gray-50 p-2 rounded space-y-1">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleShowProgressSheet(bed)}
                          className={`flex-1 text-white px-2 py-1 rounded text-xs flex items-center justify-center gap-1 ${
                            bed.progressSheetSubmitted 
                              ? 'bg-green-500 hover:bg-green-600' 
                              : 'bg-orange-500 hover:bg-orange-600'
                          }`}
                        >
                          <span>{bed.progressSheetSubmitted ? '📊✅' : '📊'}</span>
                          <span>Progress Sheet</span>
                          {bed.progressSheetSubmitted && (
                            <span className="bg-white text-green-600 rounded-full text-xs px-1 min-w-[16px] h-4 flex items-center justify-center">
                              ✓
                            </span>
                          )}
                        </button>
                        <button
                          onClick={() => handleShowPhysiotherapyNotes(bed)}
                          className={`flex-1 text-white px-2 py-1 rounded text-xs flex items-center justify-center gap-1 ${
                            bed.physiotherapyNotesSubmitted 
                              ? 'bg-green-500 hover:bg-green-600' 
                              : 'bg-indigo-500 hover:bg-indigo-600'
                          }`}
                        >
                          <span>{bed.physiotherapyNotesSubmitted ? '🏃✅' : '🏃'}</span>
                          <span>Physiotherapy</span>
                          {bed.physiotherapyNotesSubmitted && (
                            <span className="bg-white text-green-600 rounded-full text-xs px-1 min-w-[16px] h-4 flex items-center justify-center">
                              ✓
                            </span>
                          )}
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Nurses Orders Section */}
                <div className="border-t border-gray-200 pt-2">
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleToggleNursesOrders(bed.id)}
                      className={`flex-1 text-white px-2 py-1 rounded text-xs flex items-center justify-center gap-1 bg-teal-500 hover:bg-teal-600`}
                    >
                      <span>👩‍⚕️</span>
                      <span>Nurses Orders</span>
                      <span className={`ml-1 transition-transform ${expandedNursesOrdersBed === bed.id ? 'rotate-90' : ''}`}>
                        ▶
                      </span>
                    </button>
                  </div>
                  
                  {/* Expanded Nurses Orders Options */}
                  {expandedNursesOrdersBed === bed.id && (
                    <div className="mt-2 bg-gray-50 p-2 rounded space-y-1">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleShowVitalCharts(bed)}
                          className="flex-1 text-white px-2 py-1 rounded text-xs flex items-center justify-center gap-1 bg-blue-500 hover:bg-blue-600"
                        >
                          <span>🩺</span>
                          <span>Vital Charts</span>
                        </button>
                        <button
                          onClick={() => handleShowIntakeOutput(bed)}
                          className="flex-1 text-white px-2 py-1 rounded text-xs flex items-center justify-center gap-1 bg-cyan-500 hover:bg-cyan-600"
                        >
                          <span>💧</span>
                          <span>Intake & Output</span>
                        </button>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleShowMedicationChart(bed)}
                          className="flex-1 text-white px-2 py-1 rounded text-xs flex items-center justify-center gap-1 bg-pink-500 hover:bg-pink-600"
                        >
                          <span>💊</span>
                          <span>Medication Chart</span>
                        </button>
                        <button
                          onClick={() => handleShowCarePlan(bed)}
                          className="flex-1 text-white px-2 py-1 rounded text-xs flex items-center justify-center gap-1 bg-green-500 hover:bg-green-600"
                        >
                          <span>📋</span>
                          <span>Care Plan</span>
                        </button>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleShowDiabeticChart(bed)}
                          className="flex-1 text-white px-2 py-1 rounded text-xs flex items-center justify-center gap-1 bg-red-500 hover:bg-red-600"
                        >
                          <span>🩸</span>
                          <span>Diabetic Chart</span>
                        </button>
                        <button
                          onClick={() => handleShowNursesNotes(bed)}
                          className="flex-1 text-white px-2 py-1 rounded text-xs flex items-center justify-center gap-1 bg-gray-500 hover:bg-gray-600"
                        >
                          <span>📝</span>
                          <span>Nurses Notes</span>
                        </button>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleShowBloodTransfusion(bed)}
                          className={`flex-1 text-white px-2 py-1 rounded text-xs flex items-center justify-center gap-1 ${
                            bed.bloodTransfusionSubmitted 
                              ? 'bg-green-500 hover:bg-green-600' 
                              : 'bg-purple-500 hover:bg-purple-600'
                          }`}
                        >
                          <span>{bed.bloodTransfusionSubmitted ? '🩸✅' : '🩸'}</span>
                          <span>Blood Transfusion</span>
                          {bed.bloodTransfusionSubmitted && (
                            <span className="bg-white text-green-600 rounded-full text-xs px-1 min-w-[16px] h-4 flex items-center justify-center ml-1">
                              ✓
                            </span>
                          )}
                        </button>
                        {/* Add more buttons here if needed */}
                      </div>
                    </div>
                  )}
                </div>

                {/* Surgical Record Section */}
                <div className="border-t border-gray-200 pt-2">
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleToggleSurgicalRecord(bed.id)}
                      className={`flex-1 text-white px-2 py-1 rounded text-xs flex items-center justify-center gap-1 ${
                        bed.pacRecordSubmitted
                          ? 'bg-green-500 hover:bg-green-600' 
                          : 'bg-red-500 hover:bg-red-600'
                      }`}
                    >
                      <span>{bed.pacRecordSubmitted ? '🏥✅' : '🏥'}</span>
                      <span>Surgical Record</span>
                      <span className={`ml-1 transition-transform ${expandedSurgicalRecordBed === bed.id ? 'rotate-90' : ''}`}>
                        ▶
                      </span>
                      {bed.pacRecordSubmitted && (
                        <span className="bg-white text-green-600 rounded-full text-xs px-1 min-w-[16px] h-4 flex items-center justify-center ml-1">
                          ✓
                        </span>
                      )}
                    </button>
                  </div>
                  
                  {/* Expanded Surgical Record Options */}
                  {expandedSurgicalRecordBed === bed.id && (
                    <div className="mt-2 bg-gray-50 p-2 rounded space-y-1">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleShowPACRecord(bed)}
                          className={`flex-1 text-white px-2 py-1 rounded text-xs flex items-center justify-center gap-1 ${
                            bed.pacRecordSubmitted 
                              ? 'bg-green-500 hover:bg-green-600' 
                              : 'bg-red-500 hover:bg-red-600'
                          }`}
                        >
                          <span>{bed.pacRecordSubmitted ? '💉✅' : '💉'}</span>
                          <span>PAC Record</span>
                          {bed.pacRecordSubmitted && (
                            <span className="bg-white text-green-600 rounded-full text-xs px-1 min-w-[16px] h-4 flex items-center justify-center">
                              ✓
                            </span>
                          )}
                        </button>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleShowPreOpOrders(bed)}
                          className={`flex-1 text-white px-2 py-1 rounded text-xs flex items-center justify-center gap-1 ${
                            bed.preOpOrdersSubmitted 
                              ? 'bg-green-500 hover:bg-green-600' 
                              : 'bg-purple-500 hover:bg-purple-600'
                          }`}
                        >
                          <span>{bed.preOpOrdersSubmitted ? '🔧✅' : '🔧'}</span>
                          <span>Pre-Op Orders</span>
                          {bed.preOpOrdersSubmitted && (
                            <span className="bg-white text-green-600 rounded-full text-xs px-1 min-w-[16px] h-4 flex items-center justify-center">
                              ✓
                            </span>
                          )}
                        </button>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleShowPreOpChecklist(bed)}
                          className={`flex-1 text-white px-2 py-1 rounded text-xs flex items-center justify-center gap-1 ${
                            bed.preOpChecklistSubmitted 
                              ? 'bg-green-500 hover:bg-green-600' 
                              : 'bg-indigo-500 hover:bg-indigo-600'
                          }`}
                        >
                          <span>{bed.preOpChecklistSubmitted ? '📋✅' : '📋'}</span>
                          <span>Pre-OP-Check List</span>
                          {bed.preOpChecklistSubmitted && (
                            <span className="bg-white text-green-600 rounded-full text-xs px-1 min-w-[16px] h-4 flex items-center justify-center">
                              ✓
                            </span>
                          )}
                        </button>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleShowSurgicalSafety(bed)}
                          className={`flex-1 text-white px-2 py-1 rounded text-xs flex items-center justify-center gap-1 ${
                            bed.surgicalSafetySubmitted 
                              ? 'bg-green-500 hover:bg-green-600' 
                              : 'bg-orange-500 hover:bg-orange-600'
                          }`}
                        >
                          <span>{bed.surgicalSafetySubmitted ? '🛡️✅' : '🛡️'}</span>
                          <span>Safety Checklist</span>
                          {bed.surgicalSafetySubmitted && (
                            <span className="bg-white text-green-600 rounded-full text-xs px-1 min-w-[16px] h-4 flex items-center justify-center">
                              ✓
                            </span>
                          )}
                        </button>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleShowAnaesthesiaNotes(bed)}
                          className={`flex-1 text-white px-2 py-1 rounded text-xs flex items-center justify-center gap-1 ${
                            bed.anaesthesiaNotesSubmitted 
                              ? 'bg-green-500 hover:bg-green-600' 
                              : 'bg-teal-500 hover:bg-teal-600'
                          }`}
                        >
                          <span>{bed.anaesthesiaNotesSubmitted ? '💊✅' : '💊'}</span>
                          <span>Anaesthesia Notes</span>
                          {bed.anaesthesiaNotesSubmitted && (
                            <span className="bg-white text-green-600 rounded-full text-xs px-1 min-w-[16px] h-4 flex items-center justify-center">
                              ✓
                            </span>
                          )}
                        </button>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleShowIntraOperativeNotes(bed)}
                          className={`flex-1 text-white px-2 py-1 rounded text-xs flex items-center justify-center gap-1 ${
                            bed.intraOperativeNotesSubmitted 
                              ? 'bg-green-500 hover:bg-green-600' 
                              : 'bg-blue-500 hover:bg-blue-600'
                          }`}
                        >
                          <span>{bed.intraOperativeNotesSubmitted ? '🏥✅' : '🏥'}</span>
                          <span>OT Notes</span>
                          {bed.intraOperativeNotesSubmitted && (
                            <span className="bg-white text-green-600 rounded-full text-xs px-1 min-w-[16px] h-4 flex items-center justify-center">
                              ✓
                            </span>
                          )}
                        </button>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleShowPostOperativeOrders(bed)}
                          className={`flex-1 text-white px-2 py-1 rounded text-xs flex items-center justify-center gap-1 ${
                            bed.postOperativeOrdersSubmitted 
                              ? 'bg-green-500 hover:bg-green-600' 
                              : 'bg-cyan-500 hover:bg-cyan-600'
                          }`}
                        >
                          <span>{bed.postOperativeOrdersSubmitted ? '📋✅' : '📋'}</span>
                          <span>Post-Op Orders</span>
                          {bed.postOperativeOrdersSubmitted && (
                            <span className="bg-white text-green-600 rounded-full text-xs px-1 min-w-[16px] h-4 flex items-center justify-center">
                              ✓
                            </span>
                          )}
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* IPD Consents Section */}
                <div className="border-t border-gray-200 pt-2">
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleShowIPDConsents(bed)}
                      className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white px-2 py-1 rounded text-xs flex items-center justify-center gap-1 transition-colors"
                    >
                      <span>📋</span>
                      <span>IPD Consents</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Action Button */}
            <button
              onClick={() => bed.status === 'occupied' ? handleDischarge(bed.id) : handleAdmitClick(bed.id)}
              className={`w-full py-2 px-4 rounded-lg text-sm font-medium transition-colors flex items-center justify-center space-x-1 ${
                bed.status === 'occupied'
                  ? 'bg-red-500 text-white hover:bg-red-600'
                  : 'bg-blue-500 text-white hover:bg-blue-600'
              }`}
            >
              {bed.status === 'occupied' ? (
                <>
                  <span>Discharge</span>
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  <span>Admit</span>
                </>
              )}
            </button>
          </div>
        ))}
      </div>

      {/* No Results Message */}
      {filteredBeds.length === 0 && (
        <div className="text-center py-12">
          <Bed className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-600 mb-2">No beds found</h3>
          <p className="text-gray-500">
            {searchTerm || filterStatus !== 'all'
              ? 'Try adjusting your search or filters'
              : 'No beds available'
            }
          </p>
        </div>
      )}

      {/* Patient Selection Modal */}
      <PatientSelectionModal
        isOpen={showPatientSelection}
        onClose={() => {
          setShowPatientSelection(false);
          setSelectedBedForAdmission(null);
        }}
        onSelectPatient={handlePatientSelection}
        customAdmissionDate={customAdmissionDate}
        setCustomAdmissionDate={setCustomAdmissionDate}
        useCustomDate={useCustomDate}
        setUseCustomDate={setUseCustomDate}
      />

      {/* Procedure Consent Form Modal */}
      {showProcedureConsent && selectedPatientForConsent && selectedBedForIPDConsent && (
        <ProcedureConsentForm
          patient={selectedPatientForConsent}
          isOpen={showProcedureConsent}
          onClose={() => {
            setShowProcedureConsent(false);
            setSelectedPatientForConsent(null);
          }}
          onSubmit={handleConsentSubmit}
          ipdNumber={selectedBedForIPDConsent.ipdNumber}
          bedNumber={selectedBedForIPDConsent.number}
        />
      )}


      {/* IPD Consent Form Modal */}
      {showIPDConsentForm && selectedPatientForIPDConsent && (
        <IPDConsentForm
          isOpen={showIPDConsentForm}
          onClose={() => {
            setShowIPDConsentForm(false);
            setSelectedPatientForIPDConsent(null);
          }}
          patient={selectedPatientForIPDConsent}
          bedNumber={selectedBedForIPDConsent?.number || 0}
          ipdNumber={selectedBedForIPDConsent?.ipdNumber}
          savedData={selectedBedForIPDConsent?.consentFormData}
          onSubmit={handleIPDConsentSubmit}
        />
      )}

      {/* Initial RMO Assessment Form Modal */}
      {showClinicalRecordForm && selectedPatientForClinicalRecord && selectedBedForClinicalRecord && (
        <ClinicalRecordForm
          isOpen={showClinicalRecordForm}
          onClose={() => {
            setShowClinicalRecordForm(false);
            setSelectedPatientForClinicalRecord(null);
            setSelectedBedForClinicalRecord(null);
          }}
          patient={selectedPatientForClinicalRecord}
          bedNumber={selectedBedForClinicalRecord.number}
          ipdNumber={selectedBedForClinicalRecord?.ipdNumber}
          savedData={selectedBedForClinicalRecord?.clinicalRecordData}
          onSubmit={handleClinicalRecordSubmit}
        />
      )}

      {/* Doctor's Progress Sheet Modal */}
      {showProgressSheet && selectedPatientForProgressSheet && selectedBedForProgressSheet && (
        <DoctorProgressSheet
          isOpen={showProgressSheet}
          onClose={() => {
            setShowProgressSheet(false);
            setSelectedPatientForProgressSheet(null);
            setSelectedBedForProgressSheet(null);
          }}
          patient={selectedPatientForProgressSheet}
          bedNumber={selectedBedForProgressSheet.number}
          ipdNumber={selectedBedForProgressSheet?.ipdNumber}
          savedData={selectedBedForProgressSheet?.progressSheetData}
          onSubmit={handleProgressSheetSubmit}
        />
      )}

      {/* Individual Nursing Form Modals */}
      {/* Vital Charts Modal */}
      {showVitalCharts && selectedPatientForNursing && selectedBedForNursing && (
        <VitalChartsForm
          isOpen={showVitalCharts}
          onClose={() => {
            setShowVitalCharts(false);
            setSelectedPatientForNursing(null);
            setSelectedBedForNursing(null);
          }}
          patient={selectedPatientForNursing}
          bedNumber={selectedBedForNursing.number}
          ipdNumber={selectedBedForNursing?.ipdNumber}
          savedData={selectedBedForNursing?.nursesOrdersData?.vitalCharts}
          onSubmit={handleVitalChartsSubmit}
        />
      )}

      {/* Intake Output Modal */}
      {showIntakeOutput && selectedPatientForNursing && selectedBedForNursing && (
        <IntakeOutputForm
          isOpen={showIntakeOutput}
          onClose={() => {
            setShowIntakeOutput(false);
            setSelectedPatientForNursing(null);
            setSelectedBedForNursing(null);
          }}
          patient={selectedPatientForNursing}
          bedNumber={selectedBedForNursing.number}
          ipdNumber={selectedBedForNursing?.ipdNumber}
          savedData={selectedBedForNursing?.nursesOrdersData?.intakeOutput}
          onSubmit={handleIntakeOutputSubmit}
        />
      )}

      {/* Medication Chart Modal */}
      {showMedicationChart && selectedPatientForNursing && selectedBedForNursing && (
        <MedicationChartForm
          isOpen={showMedicationChart}
          onClose={() => {
            setShowMedicationChart(false);
            setSelectedPatientForNursing(null);
            setSelectedBedForNursing(null);
          }}
          patient={selectedPatientForNursing}
          bedNumber={selectedBedForNursing.number}
          ipdNumber={selectedBedForNursing?.ipdNumber}
          savedData={selectedBedForNursing?.nursesOrdersData?.medicationChart}
          onSubmit={handleMedicationChartSubmit}
        />
      )}

      {/* Care Plan Modal */}
      {showCarePlan && selectedPatientForNursing && selectedBedForNursing && (
        <CarePlanForm
          isOpen={showCarePlan}
          onClose={() => {
            setShowCarePlan(false);
            setSelectedPatientForNursing(null);
            setSelectedBedForNursing(null);
          }}
          patient={selectedPatientForNursing}
          bedNumber={selectedBedForNursing.number}
          ipdNumber={selectedBedForNursing?.ipdNumber}
          savedData={selectedBedForNursing?.nursesOrdersData?.carePlan}
          onSubmit={handleCarePlanSubmit}
        />
      )}

      {/* Diabetic Chart Modal */}
      {showDiabeticChart && selectedPatientForNursing && selectedBedForNursing && (
        <DiabeticChartForm
          isOpen={showDiabeticChart}
          onClose={() => {
            setShowDiabeticChart(false);
            setSelectedPatientForNursing(null);
            setSelectedBedForNursing(null);
          }}
          patient={selectedPatientForNursing}
          bedNumber={selectedBedForNursing.number}
          ipdNumber={selectedBedForNursing?.ipdNumber}
          savedData={selectedBedForNursing?.nursesOrdersData?.diabeticChart}
          onSubmit={handleDiabeticChartSubmit}
        />
      )}

      {/* Nurses Notes Modal */}
      {showNursesNotes && selectedPatientForNursing && selectedBedForNursing && (
        <NursesNotesForm
          isOpen={showNursesNotes}
          onClose={() => {
            setShowNursesNotes(false);
            setSelectedPatientForNursing(null);
            setSelectedBedForNursing(null);
          }}
          patient={selectedPatientForNursing}
          bedNumber={selectedBedForNursing.number}
          ipdNumber={selectedBedForNursing?.ipdNumber}
          savedData={selectedBedForNursing?.nursesOrdersData?.nursesNotes}
          onSubmit={handleNursesNotesSubmit}
        />
      )}

      {/* Initial Nursing Assessment Modal */}
      {showTatForm && selectedPatientForTat && selectedBedForTat && (
        <TatForm
          patientId={selectedPatientForTat.id}
          bedNumber={selectedBedForTat.number.toString()}
          patient={selectedPatientForTat}
          onClose={() => {
            setShowTatForm(false);
            setSelectedPatientForTat(null);
            setSelectedBedForTat(null);
          }}
          onSave={handleTatFormSubmit}
          savedData={selectedBedForTat.tatFormData}
        />
      )}

      {/* PAC Record Form Modal */}
      {showPACRecord && selectedPatientForPAC && selectedBedForPAC && (
        <PACRecordForm
          isOpen={showPACRecord}
          onClose={() => {
            setShowPACRecord(false);
            setSelectedPatientForPAC(null);
            setSelectedBedForPAC(null);
          }}
          patientData={{
            name: `${selectedPatientForPAC.first_name || ''} ${selectedPatientForPAC.last_name || ''}`.trim(),
            age: selectedPatientForPAC.age || '',
            gender: selectedPatientForPAC.gender || '',
            ipdNo: selectedBedForPAC.ipdNumber || '',
            roomWardNo: `Bed ${selectedBedForPAC.number}`
          }}
          savedData={selectedBedForPAC.pacRecordData}
          onSave={handlePACRecordSubmit}
        />
      )}

      {/* Pre-Operative Orders Form Modal */}
      {showPreOpOrders && selectedPatientForPreOpOrders && selectedBedForPreOpOrders && (
        <PreOperativeOrdersForm
          isOpen={showPreOpOrders}
          onClose={() => {
            setShowPreOpOrders(false);
            setSelectedPatientForPreOpOrders(null);
            setSelectedBedForPreOpOrders(null);
          }}
          patientData={{
            name: `${selectedPatientForPreOpOrders.first_name || ''} ${selectedPatientForPreOpOrders.last_name || ''}`.trim(),
            age: selectedPatientForPreOpOrders.age || '',
            gender: selectedPatientForPreOpOrders.gender || '',
            ipdNo: selectedBedForPreOpOrders.ipdNumber || '',
            roomWardNo: `Bed ${selectedBedForPreOpOrders.number}`,
            patientId: selectedPatientForPreOpOrders.patient_id || '',
            doctorName: selectedPatientForPreOpOrders.assigned_doctor || ''
          }}
          savedData={selectedBedForPreOpOrders.preOpOrdersData}
          onSave={handlePreOpOrdersSubmit}
        />
      )}

      {/* Pre-OP-Check List Form Modal */}
      {showPreOpChecklist && selectedPatientForPreOpChecklist && selectedBedForPreOpChecklist && (
        <PreOpChecklistForm
          isOpen={showPreOpChecklist}
          onClose={() => {
            setShowPreOpChecklist(false);
            setSelectedPatientForPreOpChecklist(null);
            setSelectedBedForPreOpChecklist(null);
          }}
          patientData={{
            name: `${selectedPatientForPreOpChecklist.first_name || ''} ${selectedPatientForPreOpChecklist.last_name || ''}`.trim(),
            age: selectedPatientForPreOpChecklist.age || '',
            gender: selectedPatientForPreOpChecklist.gender || '',
            ipdNo: selectedBedForPreOpChecklist.ipdNumber || '',
            roomWardNo: `Bed ${selectedBedForPreOpChecklist.number}`,
            patientId: selectedPatientForPreOpChecklist.patient_id || '',
            doctorName: selectedPatientForPreOpChecklist.assigned_doctor || ''
          }}
          savedData={selectedBedForPreOpChecklist.preOpChecklistData}
          onSave={handlePreOpChecklistSubmit}
        />
      )}

      {/* Surgical Safety Checklist Modal */}
      {showSurgicalSafety && selectedPatientForSurgicalSafety && selectedBedForSurgicalSafety && (
        <SurgicalSafetyChecklist
          isOpen={showSurgicalSafety}
          onClose={() => {
            setShowSurgicalSafety(false);
            setSelectedPatientForSurgicalSafety(null);
            setSelectedBedForSurgicalSafety(null);
          }}
          patientData={{
            name: `${selectedPatientForSurgicalSafety.first_name || ''} ${selectedPatientForSurgicalSafety.last_name || ''}`.trim(),
            age: selectedPatientForSurgicalSafety.age || '',
            gender: selectedPatientForSurgicalSafety.gender || '',
            ipdNo: selectedBedForSurgicalSafety.ipdNumber || '',
            roomWardNo: `Bed ${selectedBedForSurgicalSafety.number}`,
            patientId: selectedPatientForSurgicalSafety.patient_id || '',
            doctorName: selectedPatientForSurgicalSafety.assigned_doctor || ''
          }}
          savedData={selectedBedForSurgicalSafety.surgicalSafetyData}
          onSave={handleSurgicalSafetySubmit}
        />
      )}

      {/* Anaesthesia Notes Modal */}
      {showAnaesthesiaNotes && selectedPatientForAnaesthesiaNotes && selectedBedForAnaesthesiaNotes && (
        <AnaesthesiaNotesForm
          isOpen={showAnaesthesiaNotes}
          onClose={() => {
            setShowAnaesthesiaNotes(false);
            setSelectedPatientForAnaesthesiaNotes(null);
            setSelectedBedForAnaesthesiaNotes(null);
          }}
          patientData={{
            name: `${selectedPatientForAnaesthesiaNotes.first_name || ''} ${selectedPatientForAnaesthesiaNotes.last_name || ''}`.trim(),
            age: selectedPatientForAnaesthesiaNotes.age || '',
            gender: selectedPatientForAnaesthesiaNotes.gender || '',
            ipdNo: selectedBedForAnaesthesiaNotes.ipdNumber || '',
            roomWardNo: `Bed ${selectedBedForAnaesthesiaNotes.number}`,
            patientId: selectedPatientForAnaesthesiaNotes.patient_id || '',
            doctorName: selectedPatientForAnaesthesiaNotes.assigned_doctor || ''
          }}
          savedData={selectedBedForAnaesthesiaNotes.anaesthesiaNotesData}
          onSave={handleAnaesthesiaNotesSubmit}
        />
      )}

      {/* Intra Operative Notes Modal */}
      {showIntraOperativeNotes && selectedPatientForIntraOperativeNotes && selectedBedForIntraOperativeNotes && (
        <IntraOperativeNotesForm
          isOpen={showIntraOperativeNotes}
          onClose={() => {
            setShowIntraOperativeNotes(false);
            setSelectedPatientForIntraOperativeNotes(null);
            setSelectedBedForIntraOperativeNotes(null);
          }}
          patientData={{
            name: `${selectedPatientForIntraOperativeNotes.first_name || ''} ${selectedPatientForIntraOperativeNotes.last_name || ''}`.trim(),
            age: selectedPatientForIntraOperativeNotes.age || '',
            gender: selectedPatientForIntraOperativeNotes.gender || '',
            ipdNo: selectedBedForIntraOperativeNotes.ipdNumber || '',
            roomWardNo: `Bed ${selectedBedForIntraOperativeNotes.number}`,
            patientId: selectedPatientForIntraOperativeNotes.patient_id || '',
            doctorName: selectedPatientForIntraOperativeNotes.assigned_doctor || ''
          }}
          savedData={selectedBedForIntraOperativeNotes.intraOperativeNotesData}
          onSave={handleIntraOperativeNotesSubmit}
        />
      )}

      {/* Post Operative Orders Modal */}
      {showPostOperativeOrders && selectedPatientForPostOperativeOrders && selectedBedForPostOperativeOrders && (
        <PostOperativeOrdersForm
          isOpen={showPostOperativeOrders}
          onClose={() => {
            setShowPostOperativeOrders(false);
            setSelectedPatientForPostOperativeOrders(null);
            setSelectedBedForPostOperativeOrders(null);
          }}
          patientData={{
            name: `${selectedPatientForPostOperativeOrders.first_name || ''} ${selectedPatientForPostOperativeOrders.last_name || ''}`.trim(),
            age: selectedPatientForPostOperativeOrders.age || '',
            gender: selectedPatientForPostOperativeOrders.gender || '',
            ipdNo: selectedBedForPostOperativeOrders.ipdNumber || '',
            roomWardNo: `Bed ${selectedBedForPostOperativeOrders.number}`,
            patientId: selectedPatientForPostOperativeOrders.patient_id || '',
            doctorName: selectedPatientForPostOperativeOrders.assigned_doctor || ''
          }}
          savedData={selectedBedForPostOperativeOrders.postOperativeOrdersData}
          onSave={handlePostOperativeOrdersSubmit}
        />
      )}

      {/* Physiotherapy Notes Modal */}
      {showPhysiotherapyNotes && selectedPatientForPhysiotherapyNotes && selectedBedForPhysiotherapyNotes && (
        <PhysiotherapyNotesForm
          isOpen={showPhysiotherapyNotes}
          onClose={() => {
            setShowPhysiotherapyNotes(false);
            setSelectedPatientForPhysiotherapyNotes(null);
            setSelectedBedForPhysiotherapyNotes(null);
          }}
          patient={selectedPatientForPhysiotherapyNotes}
          patientName={`${selectedPatientForPhysiotherapyNotes.first_name || ''} ${selectedPatientForPhysiotherapyNotes.last_name || ''}`.trim()}
          bedNumber={`Bed ${selectedBedForPhysiotherapyNotes.number}`}
          initialData={selectedBedForPhysiotherapyNotes.physiotherapyNotesData}
          onSubmit={handlePhysiotherapyNotesSubmit}
        />
      )}

      {/* Blood Transfusion Monitoring Modal */}
      {showBloodTransfusion && selectedPatientForBloodTransfusion && selectedBedForBloodTransfusion && (
        <BloodTransfusionMonitoringForm
          isOpen={showBloodTransfusion}
          onClose={() => {
            setShowBloodTransfusion(false);
            setSelectedPatientForBloodTransfusion(null);
            setSelectedBedForBloodTransfusion(null);
          }}
          patient={selectedPatientForBloodTransfusion}
          bedNumber={selectedBedForBloodTransfusion.number}
          ipdNumber={selectedBedForBloodTransfusion.ipdNumber}
          initialData={selectedBedForBloodTransfusion.bloodTransfusionData}
          onSubmit={handleBloodTransfusionSubmit}
        />
      )}

      {/* Discharge Patient Modal */}
      <DischargePatientModal
        admission={selectedAdmissionForDischarge}
        isOpen={showDischargeModal}
        onClose={() => {
          setShowDischargeModal(false);
          setSelectedAdmissionForDischarge(null);
        }}
        onDischargeSuccess={handleDischargeSuccess}
      />

      {/* Patient Admission Form Modal */}
      <PatientAdmissionForm
        isOpen={showPatientAdmissionForm}
        onClose={() => {
          setShowPatientAdmissionForm(false);
          setSelectedPatientForAdmissionForm(null);
          setSelectedBedForAdmissionForm(null);
        }}
        patient={selectedPatientForAdmissionForm}
        bedNumber={selectedBedForAdmissionForm?.number}
        ipdNumber={selectedBedForAdmissionForm?.ipdNumber}
        onSubmit={(formData) => {
          console.log('Patient Admission Form submitted:', formData);
          toast.success('Patient admission form saved successfully!');
        }}
      />

      {/* IPD Consents Section Modal */}
      <IPDConsentsSection
        isOpen={showIPDConsents}
        onClose={handleCloseIPDConsents}
        patient={selectedPatientForConsents}
        bedNumber={selectedBedForConsents?.number}
        ipdNumber={selectedBedForConsents?.ipdNumber}
        savedData={selectedBedForConsents?.ipdConsentsData}
        onSubmit={handleIPDConsentsSubmit}
      />
    </div>
  );
};

export default IPDBedManagement;
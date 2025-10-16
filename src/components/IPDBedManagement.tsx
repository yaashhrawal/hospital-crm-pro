import React, { useState, useEffect } from 'react';
import { Search, Bed, User, Users, Activity, AlertCircle, Plus, Clock, Play, Square } from 'lucide-react';
import toast from 'react-hot-toast';
import HospitalService from '../services/hospitalService';
import type { PatientWithRelations, PatientAdmissionWithRelations, Patient } from '../config/supabaseNew';
import { HOSPITAL_ID, supabase } from '../config/supabaseNew';
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
      const patientData = await HospitalService.getPatients(50000, true, true);
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
  
  // Patient History State for each bed
  const [bedPatientHistory, setBedPatientHistory] = useState<Record<string, any[]>>({});
  const [historyLoading, setHistoryLoading] = useState<Record<string, boolean>>({});
  const [showHistoryForBed, setShowHistoryForBed] = useState<string | null>(null);
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
  const [selectedPatientForBloodTransfusion, setSelectedPatientForBloodTransfusion] = useState<PatientWithRelations | null>(null);
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

  // NEW: Admission workflow states
  const [showAdmissionConsentForm, setShowAdmissionConsentForm] = useState(false);
  const [selectedBedForAdmissionConsent, setSelectedBedForAdmissionConsent] = useState<BedData | null>(null);
  const [isAdmissionConsentFormClosing, setIsAdmissionConsentFormClosing] = useState(false);
  const [showPatientRecordsModal, setShowPatientRecordsModal] = useState(false);
  const [selectedBedForRecords, setSelectedBedForRecords] = useState<BedData | null>(null);
  const [selectedPatientForRecords, setSelectedPatientForRecords] = useState<PatientWithRelations | null>(null);
  const [isPatientRecordsModalClosing, setIsPatientRecordsModalClosing] = useState(false);
  
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
  
  // Reset history when beds change (but don't auto-load)
  useEffect(() => {
    // Only close history if the currently shown bed is no longer occupied
    const occupiedBedIds = beds.filter(bed => bed.status === 'occupied').map(bed => bed.id);
    
    // Close history only if the currently open history bed is no longer occupied
    if (showHistoryForBed && !occupiedBedIds.includes(showHistoryForBed)) {
      console.log('📖 Closing history for bed that is no longer occupied:', showHistoryForBed);
      setShowHistoryForBed(null);
    }
    
    // Clear history for beds that are no longer occupied
    setBedPatientHistory(prev => {
      const filtered: Record<string, any[]> = {};
      occupiedBedIds.forEach(bedId => {
        if (prev[bedId]) filtered[bedId] = prev[bedId];
      });
      return filtered;
    });
  }, [beds, showHistoryForBed]);

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
        console.log(`🔍 Bed ${dbBed.bed_number} - Status: ${dbBed.status}, Patient: ${dbBed.patient_id ? 'Yes' : 'No'}, IPD: ${dbBed.ipd_number || 'None'}`);
        
        // Determine actual status based on both status field and patient presence
        let actualStatus: 'occupied' | 'vacant' = 'vacant';
        if (dbBed.status === 'OCCUPIED' || dbBed.status === 'occupied') {
          actualStatus = 'occupied';
        }
        // Double-check: if status is vacant but there's still patient data, clear it
        if (actualStatus === 'vacant' && dbBed.patient_id) {
          console.warn(`⚠️ Bed ${dbBed.bed_number} marked as vacant but has patient data - will be treated as vacant`);
          dbBed.patients = null;
          dbBed.patient_id = null;
        }
        
        return {
          ...dbBed,
          number: parseInt(dbBed.bed_number),
          status: actualStatus,
          patient: actualStatus === 'occupied' ? (dbBed.patients as PatientWithRelations) : undefined,
          admissionDate: actualStatus === 'occupied' ? dbBed.admission_date : undefined,
          ipdNumber: actualStatus === 'occupied' ? dbBed.ipd_number : undefined,
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
  
  // Load patient history for a specific bed/patient
  const loadPatientHistoryForBed = async (bed: BedData) => {
    if (!bed.patient || !bed.patient.id) return;
    
    const bedKey = bed.id;
    setHistoryLoading(prev => ({ ...prev, [bedKey]: true }));
    
    try {
      console.log(`📊 Loading IPD history for bed ${bed.bed_number}, patient:`, bed.patient.patient_id);
      
      // Get patient's admission date to filter transactions
      const admissionDate = bed.patient.admissions?.[0]?.admission_date || bed.admissionDate;
      console.log('📅 Patient admission date:', admissionDate);
      
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
        .eq('patient_id', bed.patient.id)
        .neq('status', 'DELETED')
        .gte('transaction_date', admissionDate || '1970-01-01')
        .order('transaction_date', { ascending: false })
        .limit(50);
        
      if (error) {
        console.error('❌ Error loading patient history:', error);
        setBedPatientHistory(prev => ({ ...prev, [bedKey]: [] }));
        return;
      }
      
      console.log(`✅ Loaded ${transactions?.length || 0} transactions for bed ${bed.bed_number}`);
      setBedPatientHistory(prev => ({ ...prev, [bedKey]: transactions || [] }));
      
    } catch (error: any) {
      console.error('❌ Error loading patient history for bed:', error);
      setBedPatientHistory(prev => ({ ...prev, [bedKey]: [] }));
    } finally {
      setHistoryLoading(prev => ({ ...prev, [bedKey]: false }));
    }
  };
  
  // Handle history button click
  const handleHistoryClick = async (bed: BedData, event: React.MouseEvent) => {
    // Prevent event from bubbling up to the parent bed card
    event.stopPropagation();
    
    console.log('🔍 History button clicked for bed:', bed.id, 'bed number:', bed.bed_number);
    console.log('🔍 Current showHistoryForBed:', showHistoryForBed);
    console.log('🔍 Is currently loading:', historyLoading[bed.id]);
    
    // Prevent action if already loading
    if (historyLoading[bed.id]) {
      console.log('📖 History is loading, ignoring click');
      return;
    }
    
    if (showHistoryForBed === bed.id) {
      // Close if already open
      console.log('📖 Closing history for bed:', bed.id);
      setShowHistoryForBed(null);
    } else {
      console.log('📖 Opening history for bed:', bed.id);
      // First show the history section immediately
      setShowHistoryForBed(bed.id);
      
      // Then load history if not already loaded
      if (!bedPatientHistory[bed.id] || bedPatientHistory[bed.id].length === 0) {
        console.log('📖 Loading history for bed:', bed.id);
        await loadPatientHistoryForBed(bed);
      } else {
        console.log('📖 History already loaded for bed:', bed.id, 'count:', bedPatientHistory[bed.id].length);
      }
    }
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
      filtered = filtered.filter(bed => {
        // Only search in patient data if bed is actually occupied
        if (bed.status === 'occupied' && bed.patient) {
          return `bed ${bed.number}`.toLowerCase().includes(search) ||
            bed.patient.first_name?.toLowerCase().includes(search) ||
            bed.patient.last_name?.toLowerCase().includes(search) ||
            bed.patient.patient_id?.toLowerCase().includes(search);
        } else {
          return `bed ${bed.number}`.toLowerCase().includes(search);
        }
      });
    }

    console.log(`🔍 Filtered ${filtered.length} beds from ${beds.length} total beds`);
    setFilteredBeds(filtered);
  };

  const getStatistics = () => {
    const totalBeds = beds.length;
    const occupiedBeds = beds.filter(bed => bed.status === 'occupied').length;
    const vacantBeds = totalBeds - occupiedBeds;
    const occupancyRate = totalBeds > 0 ? (occupiedBeds / totalBeds) * 100 : 0;

    return { totalBeds, occupiedBeds, vacantBeds, occupancyRate };
  };

  // Handle admit click - shows patient selection modal first
  const handleAdmitClick = (bedId: string) => {
    setSelectedBedForAdmission(bedId);
    // Set default date to today
    const today = new Date().toISOString().split('T')[0];
    setCustomAdmissionDate(today);
    setUseCustomDate(false);
    setShowPatientSelection(true);
  };

  // NEW: Handle smooth closing animation for patient records modal
  const handleClosePatientRecordsModal = () => {
    setIsPatientRecordsModalClosing(true);
    
    // Wait for animation to complete before actually closing
    setTimeout(() => {
      setShowPatientRecordsModal(false);
      setSelectedBedForRecords(null);
      setSelectedPatientForRecords(null);
      setIsPatientRecordsModalClosing(false);
    }, 300); // Match the animation duration
  };

  // NEW: Handle smooth closing animation for admission consent form
  const handleCloseAdmissionConsentForm = () => {
    setIsAdmissionConsentFormClosing(true);
    
    // Wait for animation to complete before actually closing
    setTimeout(() => {
      setShowAdmissionConsentForm(false);
      setSelectedBedForAdmissionConsent(null);
      setIsAdmissionConsentFormClosing(false);
    }, 300); // Match the animation duration
  };

  // NEW: Handle admission consent form submission
  const handleAdmissionConsentSubmit = async (consentData: any, patientData: PatientWithRelations) => {
    if (!selectedBedForAdmissionConsent) return;

    try {
      // Admit the patient to the bed
      const admissionData = {
        bedId: selectedBedForAdmissionConsent.id,
        patientId: patientData.id,
        admissionDate: new Date().toISOString(),
        consentData
      };

      // Update bed status and patient information
      await BedService.admitPatientToBed(
        selectedBedForAdmissionConsent.id,
        patientData.id,
        admissionData.admissionDate
      );

      // Update local state
      setBeds(prevBeds => 
        prevBeds.map(bed => 
          bed.id === selectedBedForAdmissionConsent.id
            ? {
                ...bed,
                status: 'occupied',
                patient: patientData,
                admissionDate: new Date().toISOString().split('T')[0],
                consentFormData: consentData
              }
            : bed
        )
      );

      toast.success(`Patient ${patientData.first_name} ${patientData.last_name} admitted successfully to Bed ${selectedBedForAdmissionConsent.number}`);
      
      // Close the consent form
      setShowAdmissionConsentForm(false);
      setSelectedBedForAdmissionConsent(null);
      
    } catch (error) {
      console.error('Error during admission:', error);
      toast.error('Failed to admit patient');
    }
  };

  // NEW: Handle bed card click for occupied beds
  const handleBedCardClick = (bed: BedData) => {
    if (bed.status === 'occupied' && bed.patient) {
      setSelectedBedForRecords(bed);
      setSelectedPatientForRecords(bed.patient);
      setIsPatientRecordsModalClosing(true); // Start in closed state
      setShowPatientRecordsModal(true);
      
      // Immediately trigger opening animation
      setTimeout(() => {
        setIsPatientRecordsModalClosing(false);
      }, 10); // Very short delay to ensure initial state is applied
    }
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
    toast('IPD statistics refreshed', { icon: 'ℹ️' });
  };



  const handleDischarge = (bedId: string) => {
    const bed = beds.find(b => b.id === bedId);
    if (!bed || !bed.patient) return;

    // Create admission object using the real admission ID stored in bed
    const admissionId = bed.admissionId || bed.patient.id; // Fallback to patient ID if no admission ID
    console.log('🔍 Using admission ID for discharge:', admissionId);
    console.log('🏥 IPD Number for discharge:', bed.ipdNumber);

    const admissionForDischarge: PatientAdmissionWithRelations = {
      id: admissionId,
      patient_id: bed.patient.id,
      bed_id: bedId,
      admission_date: bed.admissionDate || new Date().toISOString(),
      status: 'ADMITTED' as const,
      hospital_id: HOSPITAL_ID,
      ipd_number: bed.ipdNumber, // ✅ FIX: Include IPD number in discharge admission object
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
    console.log('🚪 handleDischargeSuccess called');
    
    // Refresh the beds data after successful discharge
    const bedId = selectedAdmissionForDischarge?.bed_id;
    const patientId = selectedAdmissionForDischarge?.patient_id;
    
    console.log('📋 Discharge details:', { bedId, patientId });
    
    try {
      // Ensure bed is properly cleared using BedService
      if (bedId) {
        console.log('🛏️ Ensuring bed is properly cleared using BedService...');
        await BedService.dischargePatientFromBed(bedId);
        console.log('✅ Bed cleared using BedService');
      }
    } catch (bedError) {
      console.warn('⚠️ BedService discharge failed, bed might already be cleared:', bedError);
      // Continue with the process even if bed service fails
    }
    
    // Update patient's IPD status to DISCHARGED in database
    if (patientId) {
      try {
        await HospitalService.updatePatient(patientId, {
          ipd_status: 'DISCHARGED',
          ipd_bed_number: null
        });
        console.log('✅ Patient IPD status updated to DISCHARGED after discharge');
      } catch (updateError) {
        console.warn('⚠️ Patient IPD status update failed after discharge:', updateError);
      }
    }
    
    // Close the modal first
    setShowDischargeModal(false);
    setSelectedAdmissionForDischarge(null);
    
    // Clear the current beds state to force a complete refresh
    console.log('🔄 Clearing beds state before reload...');
    setBeds([]);
    setFilteredBeds([]);
    
    // Add a small delay to ensure state is cleared
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Reload beds from database to get the updated status
    console.log('📥 Reloading beds from database...');
    await loadBedsFromDatabase();
    
    console.log('✅ Discharge process completed and beds reloaded');
    toast.success('Patient discharged successfully and bed is now available');
  };

  // Function to sync patient database with actual bed occupancy
  const syncPatientIPDStatus = async () => {
    try {
      // Get all patients with IPD status = ADMITTED (using high limit to get all)
      const admittedPatients = await HospitalService.getPatients(50000, true, true);
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
      const allPatients = await HospitalService.getPatients(50000, true, true);
      const ipdPatients = allPatients.filter(p => 
        p.ipd_status === 'ADMITTED' || 
        p.ipd_status === 'DISCHARGED' || 
        p.ipd_bed_number
      );
      
      if (ipdPatients.length === 0) {
        toast('No IPD entries found in database', { icon: 'ℹ️' });
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
            className={`rounded-lg shadow-sm border p-4 transition-all duration-300 ease-in-out ${
              bed.status === 'occupied'
                ? 'bg-green-100 border-green-200 cursor-pointer hover:bg-green-200 hover:shadow-lg hover:scale-105 transform hover:border-green-300'
                : 'bg-white border-gray-200 hover:shadow-md hover:border-gray-300'
            }`}
            onClick={() => bed.status === 'occupied' ? handleBedCardClick(bed) : undefined}
            title={bed.status === 'occupied' ? 'Click to view patient records' : ''}
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
                  <div className="text-sm font-semibold text-gray-800">
                    {bed.patient.first_name} {bed.patient.last_name}
                  </div>
                  <div className="text-xs text-gray-600 font-medium">
                    ID: {bed.patient.patient_id}
                  </div>
                  {bed.admissionDate && (
                    <div className="text-xs text-gray-500">
                      Admitted: {new Date(bed.admissionDate).toLocaleDateString('en-IN')}
                    </div>
                  )}
                  {bed.status === 'occupied' && bed.patient && (
                    <div className="mt-3">
                      {/* History Button */}
                      <button
                        onClick={(e) => handleHistoryClick(bed, e)}
                        className="w-full p-2 bg-gradient-to-r from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100 rounded-lg border border-blue-200 transition-all duration-300 hover:shadow-md"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-sm">📊</span>
                            <span className="text-xs font-medium text-blue-800">IPD History</span>
                            {bedPatientHistory[bed.id] && bedPatientHistory[bed.id].length > 0 && (
                              <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full text-xs font-medium">
                                {bedPatientHistory[bed.id].length}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-1">
                            {historyLoading[bed.id] && (
                              <div className="animate-spin w-3 h-3 border-2 border-blue-600 border-t-transparent rounded-full"></div>
                            )}
                            <span className={`transform transition-transform duration-200 text-blue-600 ${
                              showHistoryForBed === bed.id ? 'rotate-180' : ''
                            }`}>
                              ▼
                            </span>
                          </div>
                        </div>
                      </button>
                      
                      {/* Collapsible History Content */}
                      {showHistoryForBed === bed.id && (
                        <div className="mt-2 bg-white rounded-lg border border-gray-200 shadow-sm animate-fade-in">
                          <div className="p-3">
                            <div className="flex items-center justify-between mb-3">
                              <h4 className="text-sm font-semibold text-gray-800">Service History</h4>
                              <div className="text-xs text-gray-500">
                                Since: {bed.admissionDate ? new Date(bed.admissionDate).toLocaleDateString() : 'N/A'}
                              </div>
                            </div>
                            
                            {historyLoading[bed.id] ? (
                              <div className="flex items-center justify-center py-6 text-sm text-gray-500">
                                <div className="animate-spin w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full mr-2"></div>
                                Loading history...
                              </div>
                            ) : bedPatientHistory[bed.id] && bedPatientHistory[bed.id].length > 0 ? (
                              <div className="space-y-2">
                                <div className="max-h-48 overflow-y-auto border rounded">
                                  <table className="w-full text-xs">
                                    <thead className="bg-gray-50 sticky top-0">
                                      <tr>
                                        <th className="px-2 py-2 text-left font-medium text-gray-500">Date</th>
                                        <th className="px-2 py-2 text-left font-medium text-gray-500">Service</th>
                                        <th className="px-2 py-2 text-center font-medium text-gray-500">Type</th>
                                        <th className="px-2 py-2 text-right font-medium text-gray-500">Amount</th>
                                        <th className="px-2 py-2 text-center font-medium text-gray-500">Status</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {bedPatientHistory[bed.id].map((transaction, index) => (
                                        <tr key={transaction.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                                          <td className="px-2 py-2 text-gray-700">
                                            {transaction.transaction_date ? new Date(transaction.transaction_date).toLocaleDateString() : 'N/A'}
                                          </td>
                                          <td className="px-2 py-2">
                                            <div className="font-medium text-gray-800 truncate max-w-32" title={transaction.description}>
                                              {transaction.description?.length > 30 
                                                ? transaction.description.substring(0, 30) + '...' 
                                                : transaction.description || 'Service'}
                                            </div>
                                            {transaction.transaction_reference && (
                                              <div className="text-gray-400 text-xs">Ref: {transaction.transaction_reference}</div>
                                            )}
                                          </td>
                                          <td className="px-2 py-2 text-center">
                                            <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                                              transaction.transaction_type === 'SERVICE' && transaction.description?.includes('[IPD_BILL]') 
                                                ? 'bg-purple-100 text-purple-700' 
                                                : transaction.transaction_type === 'SERVICE' 
                                                ? 'bg-blue-100 text-blue-700'
                                                : transaction.transaction_type === 'ADMISSION_FEE' 
                                                ? 'bg-green-100 text-green-700'
                                                : 'bg-gray-100 text-gray-700'
                                            }`}>
                                              {transaction.transaction_type === 'SERVICE' && transaction.description?.includes('[IPD_BILL]') ? 'Bill' :
                                               transaction.transaction_type === 'SERVICE' ? 'Service' :
                                               transaction.transaction_type === 'ADMISSION_FEE' ? 'Deposit' :
                                               transaction.transaction_type}
                                            </span>
                                          </td>
                                          <td className="px-2 py-2 text-right font-semibold text-gray-900">
                                            ₹{transaction.amount?.toLocaleString() || '0'}
                                          </td>
                                          <td className="px-2 py-2 text-center">
                                            <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                                              transaction.status === 'COMPLETED' 
                                                ? 'bg-blue-100 text-blue-700' 
                                                : transaction.status === 'PAID' 
                                                ? 'bg-green-100 text-green-700' 
                                                : transaction.status === 'PENDING'
                                                ? 'bg-yellow-100 text-yellow-700'
                                                : 'bg-red-100 text-red-700'
                                            }`}>
                                              {transaction.status || 'N/A'}
                                            </span>
                                          </td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                                
                                {/* Summary Footer */}
                                <div className="grid grid-cols-4 gap-2 mt-3 text-xs">
                                  <div className="bg-blue-50 text-blue-700 px-2 py-2 rounded text-center">
                                    <div className="font-semibold">{bedPatientHistory[bed.id].filter(t => t.transaction_type === 'SERVICE').length}</div>
                                    <div>Services</div>
                                  </div>
                                  <div className="bg-green-50 text-green-700 px-2 py-2 rounded text-center">
                                    <div className="font-semibold">{bedPatientHistory[bed.id].filter(t => t.transaction_type === 'ADMISSION_FEE').length}</div>
                                    <div>Deposits</div>
                                  </div>
                                  <div className="bg-purple-50 text-purple-700 px-2 py-2 rounded text-center">
                                    <div className="font-semibold">₹{bedPatientHistory[bed.id].reduce((sum, t) => sum + (t.amount || 0), 0).toLocaleString()}</div>
                                    <div>Total</div>
                                  </div>
                                  <div className="bg-orange-50 text-orange-700 px-2 py-2 rounded text-center">
                                    <div className="font-semibold">{bedPatientHistory[bed.id].filter(t => t.status === 'PENDING').length}</div>
                                    <div>Pending</div>
                                  </div>
                                </div>
                              </div>
                            ) : (
                              <div className="text-center py-6 text-gray-500">
                                <div className="text-2xl mb-2">📊</div>
                                <div className="text-sm font-medium">No services recorded yet</div>
                                <div className="text-xs mt-1">Services will appear here once recorded</div>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                  {/* Simplified view - complex sections moved to modal */}
                </div>
              )}
            </div>

            {/* Action Button */}
            <button
              onClick={() => bed.status === 'occupied' ? handleDischarge(bed.id) : handleAdmitClick(bed.id)}
              className={`w-full py-2 px-4 rounded-lg text-sm font-medium transition-all duration-300 ease-in-out transform hover:scale-105 active:scale-95 flex items-center justify-center space-x-1 ${
                bed.status === 'occupied'
                  ? 'bg-red-500 text-white hover:bg-red-600 hover:shadow-lg'
                  : 'bg-blue-500 text-white hover:bg-blue-600 hover:shadow-lg'
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

      {/* NEW: IPD Consent Form Modal for Admission */}
      {showAdmissionConsentForm && selectedBedForAdmissionConsent && (
        <IPDConsentForm
          isOpen={showAdmissionConsentForm}
          onClose={handleCloseAdmissionConsentForm}
          onSubmit={handleAdmissionConsentSubmit}
          bedNumber={selectedBedForAdmissionConsent.number}
          showPatientSelection={true}
        />
      )}

      {/* NEW: Patient Records Modal */}
      {showPatientRecordsModal && selectedBedForRecords && selectedPatientForRecords && (
        <div 
          className={`fixed inset-0 bg-black flex items-center justify-center z-50 p-4 transition-all duration-300 ease-out ${
            isPatientRecordsModalClosing 
              ? 'bg-opacity-0' 
              : 'bg-opacity-50'
          }`}
          onClick={handleClosePatientRecordsModal}
        >
          <div 
            className={`bg-white rounded-lg shadow-lg max-w-6xl w-full max-h-[90vh] overflow-y-auto transition-all duration-300 ease-out transform ${
              isPatientRecordsModalClosing 
                ? 'scale-95 opacity-0' 
                : 'scale-100 opacity-100'
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-white border-b p-4 flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold text-gray-800">Patient Records - Bed {selectedBedForRecords.number}</h2>
                <p className="text-gray-600">
                  {selectedPatientForRecords.first_name} {selectedPatientForRecords.last_name} • ID: {selectedPatientForRecords.patient_id}
                </p>
              </div>
              <button
                onClick={handleClosePatientRecordsModal}
                className="text-gray-500 hover:text-gray-700 text-2xl font-bold transition-all duration-200 hover:scale-110 active:scale-95 rounded-full w-8 h-8 flex items-center justify-center hover:bg-gray-100"
              >
                ×
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Admission History Section */}
              <div className="bg-cyan-50 rounded-lg p-4 border border-cyan-200">
                <h3 className="text-lg font-semibold text-cyan-800 mb-4">📚 Admission History</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <button
                    onClick={() => handleShowConsentForm(selectedBedForRecords)}
                    className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-3 rounded-lg flex items-center justify-center gap-2"
                  >
                    <span>📋</span>
                    <span>IPD Consent Form</span>
                  </button>
                  <button
                    onClick={() => handleShowPatientAdmissionForm(selectedBedForRecords)}
                    className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-3 rounded-lg flex items-center justify-center gap-2"
                  >
                    <span>📝</span>
                    <span>Patient Admission Form</span>
                  </button>
                </div>
              </div>

              {/* TAT Timer Section */}
              <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                <h3 className="text-lg font-semibold text-blue-800 mb-4">⏱️ TAT Timer</h3>
                <div className="flex items-center justify-between mb-4">
                  <div className="text-2xl font-mono font-bold">
                    {selectedBedForRecords.tatRemainingSeconds !== undefined ? formatTime(selectedBedForRecords.tatRemainingSeconds) : '30:00'}
                  </div>
                  <div className="flex gap-2">
                    {selectedBedForRecords.tatStatus === 'idle' && (
                      <button onClick={() => startTAT(selectedBedForRecords.id)} className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
                        Start TAT
                      </button>
                    )}
                    {selectedBedForRecords.tatStatus === 'running' && (
                      <button onClick={() => stopTAT(selectedBedForRecords.id)} className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600">
                        Complete TAT
                      </button>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => handleShowTatForm(selectedBedForRecords)}
                  className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-3 rounded-lg w-full"
                >
                  Initial Nursing Assessment
                </button>
              </div>

              {/* Consultation Orders Section */}
              <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
                <h3 className="text-lg font-semibold text-purple-800 mb-4">👨‍⚕️ Consultation Orders</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <button
                    onClick={() => handleShowProgressSheet(selectedBedForRecords)}
                    className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-3 rounded-lg"
                  >
                    Progress Sheet
                  </button>
                  <button
                    onClick={() => handleShowClinicalRecord(selectedBedForRecords)}
                    className="bg-indigo-500 hover:bg-indigo-600 text-white px-4 py-3 rounded-lg"
                  >
                    Clinical Record
                  </button>
                </div>
              </div>

              {/* Nurses Orders Section */}
              <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                <h3 className="text-lg font-semibold text-green-800 mb-4">👩‍⚕️ Nurses Orders</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  <button onClick={() => handleShowVitalCharts(selectedBedForRecords)} className="bg-red-500 hover:bg-red-600 text-white px-3 py-2 rounded text-sm">
                    Vital Charts
                  </button>
                  <button onClick={() => handleShowIntakeOutput(selectedBedForRecords)} className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-2 rounded text-sm">
                    Intake/Output
                  </button>
                  <button onClick={() => handleShowMedicationChart(selectedBedForRecords)} className="bg-purple-500 hover:bg-purple-600 text-white px-3 py-2 rounded text-sm">
                    Medication Chart
                  </button>
                  <button onClick={() => handleShowCarePlan(selectedBedForRecords)} className="bg-teal-500 hover:bg-teal-600 text-white px-3 py-2 rounded text-sm">
                    Care Plan
                  </button>
                  <button onClick={() => handleShowDiabeticChart(selectedBedForRecords)} className="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-2 rounded text-sm">
                    Diabetic Chart
                  </button>
                  <button onClick={() => handleShowNursesNotes(selectedBedForRecords)} className="bg-pink-500 hover:bg-pink-600 text-white px-3 py-2 rounded text-sm">
                    Nurses Notes
                  </button>
                </div>
              </div>

              {/* Surgical Record Section */}
              <div className="bg-red-50 rounded-lg p-4 border border-red-200">
                <h3 className="text-lg font-semibold text-red-800 mb-4">🏥 Surgical Record</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  <button onClick={() => handleShowPACRecord(selectedBedForRecords)} className="bg-indigo-500 hover:bg-indigo-600 text-white px-3 py-2 rounded text-sm">
                    PAC Record
                  </button>
                  <button onClick={() => handleShowPreOpOrders(selectedBedForRecords)} className="bg-purple-500 hover:bg-purple-600 text-white px-3 py-2 rounded text-sm">
                    Pre-Op Orders
                  </button>
                  <button onClick={() => handleShowPreOpChecklist(selectedBedForRecords)} className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-2 rounded text-sm">
                    Pre-Op Checklist
                  </button>
                  <button onClick={() => handleShowSurgicalSafety(selectedBedForRecords)} className="bg-red-500 hover:bg-red-600 text-white px-3 py-2 rounded text-sm">
                    Surgical Safety
                  </button>
                  <button onClick={() => handleShowAnaesthesiaNotes(selectedBedForRecords)} className="bg-green-500 hover:bg-green-600 text-white px-3 py-2 rounded text-sm">
                    Anaesthesia Notes
                  </button>
                  <button onClick={() => handleShowIntraOperativeNotes(selectedBedForRecords)} className="bg-teal-500 hover:bg-teal-600 text-white px-3 py-2 rounded text-sm">
                    Intra-Op Notes
                  </button>
                  <button onClick={() => handleShowPostOperativeOrders(selectedBedForRecords)} className="bg-orange-500 hover:bg-orange-600 text-white px-3 py-2 rounded text-sm">
                    Post-Op Orders
                  </button>
                  <button onClick={() => handleShowPhysiotherapyNotes(selectedBedForRecords)} className="bg-cyan-500 hover:bg-cyan-600 text-white px-3 py-2 rounded text-sm">
                    Physiotherapy
                  </button>
                  <button onClick={() => handleShowBloodTransfusion(selectedBedForRecords)} className="bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded text-sm">
                    Blood Transfusion
                  </button>
                </div>
              </div>

              {/* IPD Consents Section */}
              <div className="bg-indigo-50 rounded-lg p-4 border border-indigo-200">
                <h3 className="text-lg font-semibold text-indigo-800 mb-4">📋 IPD Consents</h3>
                <button
                  onClick={() => handleShowIPDConsents(selectedBedForRecords)}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-3 rounded-lg w-full"
                >
                  IPD Consents
                </button>
              </div>

              {/* Discharge Section */}
              <div className="bg-red-50 rounded-lg p-4 border border-red-200">
                <h3 className="text-lg font-semibold text-red-800 mb-4">🚪 Discharge</h3>
                <button
                  onClick={() => handleDischarge(selectedBedForRecords.id)}
                  className="bg-red-600 hover:bg-red-700 text-white px-4 py-3 rounded-lg w-full"
                >
                  Discharge Patient
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Existing Modals */}
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

      {/* IPD Consent Form Modal */}
      {showIPDConsentForm && selectedPatientForIPDConsent && (
        <IPDConsentForm
          isOpen={showIPDConsentForm}
          onClose={() => {
            setShowIPDConsentForm(false);
            setSelectedPatientForIPDConsent(null);
            setSelectedBedForIPDConsent(null);
          }}
          patient={selectedPatientForIPDConsent}
          bedNumber={selectedBedForIPDConsent?.number || 0}
          ipdNumber={selectedBedForIPDConsent?.ipdNumber}
          savedData={selectedBedForIPDConsent?.consentFormData}
          onSubmit={handleIPDConsentSubmit}
        />
      )}

      {/* Clinical Record Form Modal */}
      {showClinicalRecordForm && selectedPatientForClinicalRecord && selectedBedForClinicalRecord && (
        <ClinicalRecordForm
          isOpen={showClinicalRecordForm}
          onClose={() => {
            setShowClinicalRecordForm(false);
            setSelectedPatientForClinicalRecord(null);
            setSelectedBedForClinicalRecord(null);
          }}
          patient={selectedPatientForClinicalRecord}
          bedNumber={selectedBedForClinicalRecord.number.toString()}
          ipdNumber={selectedBedForClinicalRecord.ipdNumber || ''}
          savedData={selectedBedForClinicalRecord.clinicalRecordData}
          onSubmit={(data: any) => {
            console.log('Clinical record form data:', data);
            setBeds(prevBeds => 
              prevBeds.map(b => 
                b.id === selectedBedForClinicalRecord.id 
                  ? { ...b, clinicalRecordData: data, clinicalRecordSubmitted: true }
                  : b
              )
            );
            setShowClinicalRecordForm(false);
            setSelectedPatientForClinicalRecord(null);
            setSelectedBedForClinicalRecord(null);
          }}
        />
      )}

      {/* Progress Sheet Modal */}
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
          onSubmit={(data) => {
            console.log('Vital charts data submitted:', data);
            setShowVitalCharts(false);
            setSelectedPatientForNursing(null);
            setSelectedBedForNursing(null);
          }}
        />
      )}

      {/* Intake/Output Modal */}
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
          onSubmit={(data) => {
            console.log('Intake/Output data submitted:', data);
            setShowIntakeOutput(false);
            setSelectedPatientForNursing(null);
            setSelectedBedForNursing(null);
            toast.success('Intake/Output chart saved successfully');
          }}
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
          onSubmit={(data) => {
            console.log('Medication chart data submitted:', data);
            setShowMedicationChart(false);
            setSelectedPatientForNursing(null);
            setSelectedBedForNursing(null);
            toast.success('Medication chart saved successfully');
          }}
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
          onSubmit={(data) => {
            console.log('Care plan data submitted:', data);
            setShowCarePlan(false);
            setSelectedPatientForNursing(null);
            setSelectedBedForNursing(null);
            toast.success('Care plan saved successfully');
          }}
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
          onSubmit={(data) => {
            console.log('Diabetic chart data submitted:', data);
            setShowDiabeticChart(false);
            setSelectedPatientForNursing(null);
            setSelectedBedForNursing(null);
            toast.success('Diabetic chart saved successfully');
          }}
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
          onSubmit={(data) => {
            console.log('Nurses notes data submitted:', data);
            setShowNursesNotes(false);
            setSelectedPatientForNursing(null);
            setSelectedBedForNursing(null);
            toast.success('Nurses notes saved successfully');
          }}
        />
      )}

      {/* TAT Form Modal */}
      {showTatForm && selectedPatientForTat && selectedBedForTat && (
        <TatForm
          isOpen={showTatForm}
          onClose={() => {
            setShowTatForm(false);
            setSelectedPatientForTat(null);
            setSelectedBedForTat(null);
          }}
          patient={selectedPatientForTat}
          bedNumber={selectedBedForTat.number}
          ipdNumber={selectedBedForTat?.ipdNumber}
          savedData={selectedBedForTat?.tatFormData}
          onSubmit={handleTatFormSubmit}
        />
      )}

      {/* PAC Record Modal */}
      {showPACRecord && selectedPatientForPAC && selectedBedForPAC && (
        <PACRecordForm
          isOpen={showPACRecord}
          onClose={() => {
            setShowPACRecord(false);
            setSelectedPatientForPAC(null);
            setSelectedBedForPAC(null);
          }}
          patient={selectedPatientForPAC}
          bedNumber={selectedBedForPAC.number}
          ipdNumber={selectedBedForPAC?.ipdNumber}
          savedData={selectedBedForPAC?.pacRecordData}
          onSubmit={handlePACRecordSubmit}
        />
      )}

      {/* Pre-Operative Orders Modal */}
      {showPreOpOrders && selectedPatientForPreOpOrders && selectedBedForPreOpOrders && (
        <PreOperativeOrdersForm
          isOpen={showPreOpOrders}
          onClose={() => {
            setShowPreOpOrders(false);
            setSelectedPatientForPreOpOrders(null);
            setSelectedBedForPreOpOrders(null);
          }}
          patient={selectedPatientForPreOpOrders}
          bedNumber={selectedBedForPreOpOrders.number}
          ipdNumber={selectedBedForPreOpOrders?.ipdNumber}
          savedData={selectedBedForPreOpOrders?.preOpOrdersData}
          onSubmit={handlePreOpOrdersSubmit}
        />
      )}

      {/* Pre-OP Checklist Modal */}
      {showPreOpChecklist && selectedPatientForPreOpChecklist && selectedBedForPreOpChecklist && (
        <PreOpChecklistForm
          isOpen={showPreOpChecklist}
          onClose={() => {
            setShowPreOpChecklist(false);
            setSelectedPatientForPreOpChecklist(null);
            setSelectedBedForPreOpChecklist(null);
          }}
          patient={selectedPatientForPreOpChecklist}
          bedNumber={selectedBedForPreOpChecklist.number}
          ipdNumber={selectedBedForPreOpChecklist?.ipdNumber}
          savedData={selectedBedForPreOpChecklist?.preOpChecklistData}
          onSubmit={handlePreOpChecklistSubmit}
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
          patient={selectedPatientForSurgicalSafety}
          bedNumber={selectedBedForSurgicalSafety.number}
          ipdNumber={selectedBedForSurgicalSafety?.ipdNumber}
          savedData={selectedBedForSurgicalSafety?.surgicalSafetyData}
          onSubmit={handleSurgicalSafetySubmit}
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
          patient={selectedPatientForAnaesthesiaNotes}
          bedNumber={selectedBedForAnaesthesiaNotes.number}
          ipdNumber={selectedBedForAnaesthesiaNotes?.ipdNumber}
          savedData={selectedBedForAnaesthesiaNotes?.anaesthesiaNotesData}
          onSubmit={handleAnaesthesiaNotesSubmit}
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
          patient={selectedPatientForIntraOperativeNotes}
          bedNumber={selectedBedForIntraOperativeNotes.number}
          ipdNumber={selectedBedForIntraOperativeNotes?.ipdNumber}
          savedData={selectedBedForIntraOperativeNotes?.intraOperativeNotesData}
          onSubmit={handleIntraOperativeNotesSubmit}
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
          patient={selectedPatientForPostOperativeOrders}
          bedNumber={selectedBedForPostOperativeOrders.number}
          ipdNumber={selectedBedForPostOperativeOrders?.ipdNumber}
          savedData={selectedBedForPostOperativeOrders?.postOperativeOrdersData}
          onSubmit={handlePostOperativeOrdersSubmit}
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
          bedNumber={selectedBedForPhysiotherapyNotes.number}
          ipdNumber={selectedBedForPhysiotherapyNotes?.ipdNumber}
          savedData={selectedBedForPhysiotherapyNotes?.physiotherapyNotesData}
          onSubmit={handlePhysiotherapyNotesSubmit}
        />
      )}

      {/* Blood Transfusion Modal */}
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
          ipdNumber={selectedBedForBloodTransfusion?.ipdNumber}
          savedData={selectedBedForBloodTransfusion?.bloodTransfusionData}
          onSubmit={handleBloodTransfusionSubmit}
        />
      )}

      {/* Patient Admission Form Modal */}
      {showPatientAdmissionForm && selectedPatientForAdmissionForm && selectedBedForAdmissionForm && (
        <PatientAdmissionForm
          isOpen={showPatientAdmissionForm}
          onClose={() => {
            setShowPatientAdmissionForm(false);
            setSelectedPatientForAdmissionForm(null);
            setSelectedBedForAdmissionForm(null);
          }}
          patient={selectedPatientForAdmissionForm}
          bedNumber={selectedBedForAdmissionForm.number}
          ipdNumber={selectedBedForAdmissionForm?.ipdNumber}
          onSubmit={(data) => {
            console.log('Patient admission form data:', data);
            setShowPatientAdmissionForm(false);
            setSelectedPatientForAdmissionForm(null);
            setSelectedBedForAdmissionForm(null);
            toast.success('Patient admission form saved successfully');
          }}
        />
      )}

      {/* IPD Consents Modal */}
      {showIPDConsents && selectedPatientForConsents && selectedBedForConsents && (
        <IPDConsentsSection
          isOpen={showIPDConsents}
          onClose={() => {
            setShowIPDConsents(false);
            setSelectedPatientForConsents(null);
            setSelectedBedForConsents(null);
          }}
          patient={selectedPatientForConsents}
          bedNumber={selectedBedForConsents.number}
          ipdNumber={selectedBedForConsents?.ipdNumber}
        />
      )}

      {/* Discharge Modal */}
      {showDischargeModal && selectedAdmissionForDischarge && (
        <DischargePatientModal
          isOpen={showDischargeModal}
          onClose={() => {
            setShowDischargeModal(false);
            setSelectedAdmissionForDischarge(null);
          }}
          admission={selectedAdmissionForDischarge}
          onSuccess={handleDischargeSuccess}
        />
      )}
    </div>
  );
};

export default IPDBedManagement;

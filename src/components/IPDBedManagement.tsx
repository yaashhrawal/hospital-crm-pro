import React, { useState, useEffect } from 'react';
import { Search, Bed, User, Users, Activity, Shuffle, AlertCircle, Plus, Clock, Play, Square } from 'lucide-react';
import toast from 'react-hot-toast';
import HospitalService from '../services/hospitalService';
import type { PatientWithRelations } from '../config/supabaseNew';
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
import { storeIPDNumberForBed } from '../utils/ipdUtils';

interface BedData {
  id: string;
  number: number;
  status: 'occupied' | 'vacant';
  patient?: PatientWithRelations;
  admissionDate?: string;
  ipdNumber?: string; // Store the IPD number generated at admission
  tatStartTime?: number; // TAT start timestamp
  tatStatus?: 'idle' | 'running' | 'completed' | 'expired';
  tatRemainingSeconds?: number; // Remaining seconds for TAT
  consultantNotes?: Array<{
    id: string;
    note: string;
    addedBy: string;
    timestamp: string;
  }>;
  consentFormData?: any; // Store consent form data
  consentFormSubmitted?: boolean; // Track if consent form was submitted
  clinicalRecordData?: any; // Store clinical record data
  clinicalRecordSubmitted?: boolean; // Track if clinical record was submitted
  progressSheetData?: any; // Store doctor's progress sheet data
  progressSheetSubmitted?: boolean; // Track if progress sheet was submitted
  nursesOrdersData?: any; // Store nurses orders data
  nursesOrdersSubmitted?: boolean; // Track if nurses orders was submitted
  tatFormData?: any; // Store TAT form data
  tatFormSubmitted?: boolean; // Track if TAT form was submitted
}

interface PatientSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectPatient: (patient: PatientWithRelations) => void;
}

interface NotesModalProps {
  isOpen: boolean;
  onClose: () => void;
  bedData: BedData | null;
  noteType: 'consultant' | 'nursing';
  onAddNote: (note: string) => void;
}

const NotesModal: React.FC<NotesModalProps> = ({ isOpen, onClose, bedData, noteType, onAddNote }) => {
  const [newNote, setNewNote] = useState('');

  if (!isOpen || !bedData) return null;

  const notes = bedData.consultantNotes || [];
  const title = 'Consultant Notes';
  const icon = '👨‍⚕️';

  const handleAddNote = () => {
    if (newNote.trim()) {
      onAddNote(newNote.trim());
      setNewNote('');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full max-h-[90vh] overflow-hidden">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
              <span>{icon}</span>
              {title} - Bed {bedData.number}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
            >
              ×
            </button>
          </div>

          {bedData.patient && (
            <div className="bg-blue-50 p-3 rounded-lg mb-4">
              <p className="text-sm text-gray-700">
                <strong>Patient:</strong> {bedData.patient.first_name} {bedData.patient.last_name} 
                ({bedData.patient.patient_id})
              </p>
            </div>
          )}

          {/* Add new note */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Add New Note
            </label>
            <div className="flex gap-2">
              <textarea
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                placeholder={`Enter ${noteType} note...`}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 resize-none"
                rows={3}
              />
              <button
                onClick={handleAddNote}
                disabled={!newNote.trim()}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Add Note
              </button>
            </div>
          </div>

          {/* Notes list */}
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {notes.length === 0 ? (
              <p className="text-center text-gray-500 py-8">No notes added yet</p>
            ) : (
              notes.map((note) => (
                <div key={note.id} className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex justify-between items-start mb-2">
                    <p className="text-sm font-medium text-gray-700">{note.addedBy}</p>
                    <p className="text-xs text-gray-500">
                      {new Date(note.timestamp).toLocaleString()}
                    </p>
                  </div>
                  <p className="text-gray-800 whitespace-pre-wrap">{note.note}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const PatientSelectionModal: React.FC<PatientSelectionModalProps> = ({ isOpen, onClose, onSelectPatient }) => {
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
  const [showProcedureConsent, setShowProcedureConsent] = useState(false);
  const [selectedPatientForConsent, setSelectedPatientForConsent] = useState<PatientWithRelations | null>(null);
  const [showNotesModal, setShowNotesModal] = useState(false);
  const [selectedBedForNotes, setSelectedBedForNotes] = useState<BedData | null>(null);
  const [noteType, setNoteType] = useState<'consultant' | 'nursing'>('consultant');
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

  // Load beds from localStorage on component mount, or initialize if none saved
  useEffect(() => {
    const savedBeds = localStorage.getItem('hospital-ipd-beds');
    if (savedBeds) {
      try {
        const parsedBeds = JSON.parse(savedBeds);
        console.log('📋 Loading saved bed data from localStorage:', parsedBeds.length, 'beds');
        setBeds(parsedBeds);
      } catch (error) {
        console.error('❌ Failed to parse saved bed data:', error);
        initializeBeds();
      }
    } else {
      console.log('🏥 No saved bed data found, initializing fresh beds');
      initializeBeds();
    }
  }, []);

  // Save beds to localStorage whenever beds state changes
  useEffect(() => {
    if (beds.length > 0) {
      console.log('💾 Saving bed data to localStorage');
      localStorage.setItem('hospital-ipd-beds', JSON.stringify(beds));
    }
  }, [beds]);

  // Filter beds when search term or filter status changes
  useEffect(() => {
    filterBeds();
  }, [beds, searchTerm, filterStatus]);

  const initializeBeds = () => {
    const initialBeds: BedData[] = [];
    for (let i = 1; i <= 40; i++) {
      initialBeds.push({
        id: `bed-${i}`,
        number: i,
        status: 'vacant',
        tatStatus: 'idle',
        tatRemainingSeconds: 30 * 60, // 30 minutes
        consultantNotes: [],
        consentFormSubmitted: false,
        clinicalRecordSubmitted: false,
        progressSheetSubmitted: false
      });
    }
    setBeds(initialBeds);
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
    setShowPatientSelection(true);
  };

  const handlePatientSelection = async (patient: PatientWithRelations) => {
    if (!selectedBedForAdmission) return;

    try {
      // Get the bed number for the selected bed
      const selectedBed = beds.find(b => b.id === selectedBedForAdmission);
      if (!selectedBed) return;

      // Generate automatic unique IPD number
      const ipdNumber = getNextIPDNumber();
      console.log(`🏥 Assigned IPD Number: ${ipdNumber} to patient ${patient.patient_id} in bed ${selectedBed.number}`);
      
      // Update IPD statistics
      setIPDStats(getIPDStats());
      
      // Update bed with patient data directly
      setBeds(prevBeds => {
        const updatedBeds = prevBeds.map(bed => {
          if (bed.id === selectedBedForAdmission) {
            const updatedBed = {
              ...bed,
              status: 'occupied' as const,
              patient: patient,
              admissionDate: new Date().toISOString(),
              ipdNumber: ipdNumber, // Store the generated IPD number
              tatStatus: 'idle' as const,
              tatRemainingSeconds: 30 * 60, // Reset to 30 minutes
              consentFormSubmitted: false
            };
            console.log(`💾 Updated bed data:`, updatedBed);
            console.log(`💾 IPD Number in updated bed: ${updatedBed.ipdNumber}`);
            
            // Also store in localStorage for persistence using utility
            storeIPDNumberForBed(bed.id, ipdNumber);
            
            return updatedBed;
          }
          return bed;
        });
        
        console.log(`💾 All beds after update:`, updatedBeds);
        return updatedBeds;
      });

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
      setSelectedPatientForIPDConsent(patient);
      setSelectedBedForIPDConsent(selectedBed);
      setShowIPDConsentForm(true);
      setSelectedBedForAdmission(null);
    } catch (error) {
      toast.error('Failed to admit patient');
      console.error(error);
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
    toast.success('TAT Form submitted successfully');
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
    
    toast.success('Clinical record submitted and saved successfully');
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

  const handleShowNotes = (bed: BedData) => {
    setSelectedBedForNotes(bed);
    setNoteType('consultant');
    setShowNotesModal(true);
  };

  const handleAddNote = (note: string) => {
    if (!selectedBedForNotes) return;

    const newNote = {
      id: Date.now().toString(),
      note,
      addedBy: 'Current User', // In a real app, this would come from the logged-in user
      timestamp: new Date().toISOString()
    };

    setBeds(prevBeds =>
      prevBeds.map(bed => {
        if (bed.id === selectedBedForNotes.id) {
          return {
            ...bed,
            consultantNotes: [...(bed.consultantNotes || []), newNote]
          };
        }
        return bed;
      })
    );

    // Update the selected bed for notes modal
    setSelectedBedForNotes(prev => {
      if (!prev) return null;
      return {
        ...prev,
        consultantNotes: [...(prev.consultantNotes || []), newNote]
      };
    });

    toast.success('Consultant note added successfully');
  };

  const handleDischarge = async (bedId: string) => {
    const bed = beds.find(b => b.id === bedId);
    if (!bed || !bed.patient) return;

    try {
      // Update patient's IPD status (if columns exist)
      try {
        await HospitalService.updatePatient(bed.patient.id, {
          ipd_status: 'OPD',
          ipd_bed_number: null
        });
      } catch (updateError) {
        console.warn('⚠️ Patient IPD status update failed (columns may not exist):', updateError);
        // Continue with discharge even if IPD status update fails
      }

      // Update bed status
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
              consultantNotes: [],
              consentFormSubmitted: false,
              clinicalRecordSubmitted: false,
              progressSheetSubmitted: false,
              consentFormData: undefined,
              clinicalRecordData: undefined,
              progressSheetData: undefined
            };
          }
          return b;
        })
      );

      toast.success(`Patient ${bed.patient.first_name} ${bed.patient.last_name} discharged successfully`);
    } catch (error) {
      toast.error('Failed to discharge patient');
      console.error(error);
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
              onClick={clearAllBedData}
              className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 text-sm"
            >
              🗑️ Reset All Beds
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
                      Admitted: {new Date(bed.admissionDate).toLocaleDateString()}
                    </div>
                  )}
                  
                  {/* TAT Section */}
                  <div className="mt-3 p-2 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-center mb-2">
                      <Clock className="w-3 h-3 text-gray-500 mr-1" />
                      <span className="text-xs font-medium text-gray-600">TAT</span>
                    </div>
                    
                    {/* TAT Timer Display */}
                    <div className={`text-lg font-mono font-bold mb-2 ${
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
                    <div className={`text-xs mb-2 font-medium ${
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
                    <div className="flex gap-1">
                      {bed.tatStatus === 'idle' && (
                        <button
                          onClick={() => startTAT(bed.id)}
                          className="flex-1 bg-blue-500 text-white px-2 py-1 rounded text-xs hover:bg-blue-600 flex items-center justify-center"
                        >
                          <Play className="w-3 h-3 mr-1" />
                          Start
                        </button>
                      )}
                      
                      {bed.tatStatus === 'running' && (
                        <button
                          onClick={() => stopTAT(bed.id)}
                          className="flex-1 bg-green-500 text-white px-2 py-1 rounded text-xs hover:bg-green-600 flex items-center justify-center"
                        >
                          <Square className="w-3 h-3 mr-1" />
                          Complete
                        </button>
                      )}
                      
                      {(bed.tatStatus === 'completed' || bed.tatStatus === 'expired') && (
                        <button
                          onClick={() => resetTAT(bed.id)}
                          className="flex-1 bg-gray-500 text-white px-2 py-1 rounded text-xs hover:bg-gray-600 flex items-center justify-center"
                        >
                          <Clock className="w-3 h-3 mr-1" />
                          Reset
                        </button>
                      )}
                    </div>
                    
                    {/* TAT Form Button */}
                    <div className="mt-2">
                      <button
                        onClick={() => handleShowTatForm(bed)}
                        className={`w-full text-white px-2 py-1 rounded text-xs flex items-center justify-center gap-1 ${
                          bed.tatFormSubmitted 
                            ? 'bg-green-500 hover:bg-green-600' 
                            : 'bg-blue-500 hover:bg-blue-600'
                        }`}
                      >
                        <span>{bed.tatFormSubmitted ? '✅' : '📋'}</span>
                        <span>TAT Form</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Notes and Consent Buttons - Only show for occupied beds */}
            {bed.status === 'occupied' && (
              <div className="mb-3 space-y-3">
                {/* Notes Section */}
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleShowNotes(bed)}
                      className="flex-1 bg-purple-500 text-white px-2 py-1 rounded text-xs hover:bg-purple-600 flex items-center justify-center gap-1"
                    >
                      <span>👨‍⚕️</span>
                      <span>Consultant Notes</span>
                      {bed.consultantNotes && bed.consultantNotes.length > 0 && (
                        <span className="bg-white text-purple-600 rounded-full text-xs px-1 min-w-[16px] h-4 flex items-center justify-center">
                          {bed.consultantNotes.length}
                        </span>
                      )}
                    </button>
                  </div>
                </div>

                {/* Admission History Section */}
                <div className="border-t border-gray-200 pt-2">
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleToggleAdmissionHistory(bed.id)}
                      className={`flex-1 text-white px-2 py-1 rounded text-xs flex items-center justify-center gap-1 ${
                        bed.consentFormSubmitted && bed.clinicalRecordSubmitted
                          ? 'bg-blue-500 hover:bg-blue-600' 
                          : 'bg-cyan-500 hover:bg-cyan-600'
                      }`}
                    >
                      <span>{bed.consentFormSubmitted && bed.clinicalRecordSubmitted ? '📚✅' : '📚'}</span>
                      <span>Admission History</span>
                      <span className={`ml-1 transition-transform ${expandedAdmissionHistoryBed === bed.id ? 'rotate-90' : ''}`}>
                        ▶
                      </span>
                      {bed.consentFormSubmitted && bed.clinicalRecordSubmitted && (
                        <span className="bg-white text-blue-600 rounded-full text-xs px-1 min-w-[16px] h-4 flex items-center justify-center ml-1">
                          ✓
                        </span>
                      )}
                    </button>
                  </div>
                  
                  {/* Expanded Admission History Options */}
                  {expandedAdmissionHistoryBed === bed.id && (
                    <div className="mt-2 bg-gray-50 p-2 rounded space-y-1">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleShowConsentForm(bed)}
                          className={`flex-1 text-white px-2 py-1 rounded text-xs flex items-center justify-center gap-1 ${
                            bed.consentFormSubmitted 
                              ? 'bg-green-500 hover:bg-green-600' 
                              : 'bg-orange-500 hover:bg-orange-600'
                          }`}
                        >
                          <span>{bed.consentFormSubmitted ? '✅' : '📋'}</span>
                          <span>Consent Form</span>
                          {bed.consentFormSubmitted && (
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
                        >
                          <span>{bed.clinicalRecordSubmitted ? '📋✅' : '📋'}</span>
                          <span>Clinical Record</span>
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
                    </div>
                  )}
                </div>

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
                      </div>
                    </div>
                  )}
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
      />

      {/* Procedure Consent Form Modal */}
      {showProcedureConsent && selectedPatientForConsent && (
        <ProcedureConsentForm
          patient={selectedPatientForConsent}
          isOpen={showProcedureConsent}
          onClose={() => {
            setShowProcedureConsent(false);
            setSelectedPatientForConsent(null);
          }}
          onSubmit={handleConsentSubmit}
        />
      )}

      {/* Notes Modal */}
      <NotesModal
        isOpen={showNotesModal}
        onClose={() => {
          setShowNotesModal(false);
          setSelectedBedForNotes(null);
        }}
        bedData={selectedBedForNotes}
        noteType={noteType}
        onAddNote={handleAddNote}
      />

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
          bedNumber={selectedBedForClinicalRecord.number}
          ipdNumber={selectedBedForClinicalRecord?.ipdNumber}
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
          onSubmit={handleNursesNotesSubmit}
        />
      )}

      {/* TAT Form Modal */}
      {showTatForm && selectedPatientForTat && selectedBedForTat && (
        <TatForm
          patientId={selectedPatientForTat.id}
          bedNumber={selectedBedForTat.number.toString()}
          onClose={() => {
            setShowTatForm(false);
            setSelectedPatientForTat(null);
            setSelectedBedForTat(null);
          }}
          onSave={handleTatFormSubmit}
        />
      )}
    </div>
  );
};

export default IPDBedManagement;
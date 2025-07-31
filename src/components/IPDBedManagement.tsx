import React, { useState, useEffect } from 'react';
import { Search, Bed, User, Users, Activity, Shuffle, AlertCircle, Plus, Clock, Play, Square } from 'lucide-react';
import toast from 'react-hot-toast';
import HospitalService from '../services/hospitalService';
import type { PatientWithRelations } from '../config/supabaseNew';
import ProcedureConsentForm from './ProcedureConsentForm';

interface BedData {
  id: string;
  number: number;
  status: 'occupied' | 'vacant';
  patient?: PatientWithRelations;
  admissionDate?: string;
  tatStartTime?: number; // TAT start timestamp
  tatStatus?: 'idle' | 'running' | 'completed' | 'expired';
  tatRemainingSeconds?: number; // Remaining seconds for TAT
}

interface PatientSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectPatient: (patient: PatientWithRelations) => void;
}

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

const IPDBedManagement: React.FC = () => {
  const [beds, setBeds] = useState<BedData[]>([]);
  const [filteredBeds, setFilteredBeds] = useState<BedData[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'occupied' | 'vacant'>('all');
  const [showPatientSelection, setShowPatientSelection] = useState(false);
  const [selectedBedForAdmission, setSelectedBedForAdmission] = useState<string | null>(null);
  const [showProcedureConsent, setShowProcedureConsent] = useState(false);
  const [selectedPatientForConsent, setSelectedPatientForConsent] = useState<PatientWithRelations | null>(null);

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
        tatRemainingSeconds: 30 * 60 // 30 minutes
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

  const handlePatientSelection = (patient: PatientWithRelations) => {
    setSelectedPatientForConsent(patient);
    setShowPatientSelection(false);
    setShowProcedureConsent(true);
  };

  const handleConsentSubmit = async (consentData: any) => {
    if (!selectedPatientForConsent || !selectedBedForAdmission) return;

    try {
      // Update bed with patient data
      setBeds(prevBeds => 
        prevBeds.map(bed => {
          if (bed.id === selectedBedForAdmission) {
            return {
              ...bed,
              status: 'occupied' as const,
              patient: selectedPatientForConsent,
              admissionDate: new Date().toISOString(),
              tatStatus: 'idle' as const,
              tatRemainingSeconds: 30 * 60 // Reset to 30 minutes
            };
          }
          return bed;
        })
      );

      // Update patient's IPD status (if columns exist)
      try {
        await HospitalService.updatePatient(selectedPatientForConsent.id, {
          ipd_status: 'ADMITTED',
          ipd_bed_number: beds.find(b => b.id === selectedBedForAdmission)?.number.toString()
        });
      } catch (updateError) {
        console.warn('⚠️ Patient IPD status update failed (columns may not exist):', updateError);
        // Continue with admission even if IPD status update fails
      }

      toast.success(`Patient ${selectedPatientForConsent.first_name} ${selectedPatientForConsent.last_name} admitted to bed ${beds.find(b => b.id === selectedBedForAdmission)?.number}`);
      
      // Reset state
      setSelectedPatientForConsent(null);
      setSelectedBedForAdmission(null);
    } catch (error) {
      toast.error('Failed to admit patient');
      console.error(error);
    }
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
    toast.success('All bed data cleared and reset');
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
              tatRemainingSeconds: 30 * 60
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
        <div className="flex gap-2">
          <button
            onClick={clearAllBedData}
            className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 text-sm"
          >
            🗑️ Reset All Beds
          </button>
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
                  </div>
                </div>
              )}
            </div>

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
            setSelectedBedForAdmission(null);
          }}
          onSubmit={handleConsentSubmit}
        />
      )}
    </div>
  );
};

export default IPDBedManagement;
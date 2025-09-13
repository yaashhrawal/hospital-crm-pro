import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import DoctorService from '../services/doctorService';
import HospitalService from '../services/hospitalService';
import * as CompletePatientRecordService from '../services/completePatientRecordService';
import type { PatientWithRelations } from '../config/supabaseNew';

interface SimpleEnhancedPatientRecordProps {
  patient: PatientWithRelations;
  onClose: () => void;
}

interface HighRiskData {
  condition: string;
  identifiedDate: string;
  notes: string;
}

interface ChiefComplaintData {
  complaint: string;
  period: string;
  presentHistory: string;
  performingDoctor: string;
  notes: string;
}

interface ExaminationData {
  examinationType: string;
  problemSince: string;
  severity: string;
  performingDoctor: string;
  performingNurse: string;
  notes: string;
}

interface InvestigationData {
  service: string;
  testResults: string;
  outsideTest: boolean;
  performingDoctor: string;
  performingNurse: string;
  notes: string;
}

interface DiagnosisData {
  diagnosis: string;
  isHighRisk: boolean;
  performingDoctor: string;
  performingNurse: string;
  treatmentGiven: string;
}

interface PrescriptionMedicine {
  medicineName: string;
  genericName: string;
  medicineCategory: string;
  unit: string;
  dosage: string;
  frequency: string;
  mor: boolean;
  noon: boolean;
  eve: boolean;
  night: boolean;
  whenTaken: string;
  duration: string;
  dispenseQty: string;
  route: string;
  instructions: string;
  specialInstructions: string;
  performingDoctor: string;
  performingNurse: string;
  rate: number;
  amount: number;
  discType: string;
  netAmt: number;
}

const SimpleEnhancedPatientRecord: React.FC<SimpleEnhancedPatientRecordProps> = ({ 
  patient, 
  onClose 
}) => {
  const [activeTab, setActiveTab] = useState('highRisk');
  
  // State for each section
  const [highRisks, setHighRisks] = useState<HighRiskData[]>([]);
  const [chiefComplaints, setChiefComplaints] = useState<ChiefComplaintData[]>([]);
  const [examinations, setExaminations] = useState<ExaminationData[]>([]);
  const [investigations, setInvestigations] = useState<InvestigationData[]>([]);
  const [diagnoses, setDiagnoses] = useState<DiagnosisData[]>([]);
  const [prescriptions, setPrescriptions] = useState<PrescriptionMedicine[]>([]);
  
  // Current form data
  const [currentHighRisk, setCurrentHighRisk] = useState<HighRiskData>({
    condition: '',
    identifiedDate: '',
    notes: ''
  });
  
  const [currentChiefComplaint, setCurrentChiefComplaint] = useState<ChiefComplaintData>({
    complaint: '',
    period: '',
    presentHistory: '',
    performingDoctor: '',
    notes: ''
  });

  const [currentExamination, setCurrentExamination] = useState<ExaminationData>({
    examinationType: '',
    problemSince: '',
    severity: '',
    performingDoctor: '',
    performingNurse: '',
    notes: ''
  });

  const [currentInvestigation, setCurrentInvestigation] = useState<InvestigationData>({
    service: '',
    testResults: '',
    outsideTest: false,
    performingDoctor: '',
    performingNurse: '',
    notes: ''
  });
  
  const [currentDiagnosis, setCurrentDiagnosis] = useState<DiagnosisData>({
    diagnosis: '',
    isHighRisk: false,
    performingDoctor: '',
    performingNurse: '',
    treatmentGiven: ''
  });
  
  const [currentPrescription, setCurrentPrescription] = useState<PrescriptionMedicine>({
    medicineName: '',
    genericName: '',
    medicineCategory: '',
    unit: '',
    dosage: '',
    frequency: '',
    mor: false,
    noon: false,
    eve: false,
    night: false,
    whenTaken: '',
    duration: '',
    dispenseQty: '',
    route: '',
    instructions: '',
    specialInstructions: '',
    performingDoctor: 'VARUN VEMULAPALLY',
    performingNurse: '',
    rate: 0,
    amount: 0,
    discType: '',
    netAmt: 0
  });

  // Data constants
  const HIGH_RISK_CONDITIONS = [
    'COVID19', 'Dengue', 'HIV', 'HbsAg', 'Thalassemia', 
    'Rh negative mother', 'Heart disease', 'Polio', 'Hyper thyroid', 'Envron'
  ];

  const CHIEF_COMPLAINTS = [
    'Abdominal Aortic Aneurysm', 'Acute Bronchitis', 'Abdominal pain', 
    'Angina Pectoris', 'Dyspnea', 'Fever on and off', 'Hand Pain', 
    'Knee Pain', 'Long Back Pain', 'Obesity', 'Restlessness', 
    'Rheumatic Arthritis', 'Sinusitis', 'Snoring', 'Difficulty to walk', 
    'Urinary tract infection', 'Ventricular Fibrillation'
  ];

  const EXAMINATION_TYPES = [
    'Abdominal palpation', 'EBC', 'Inspection', 'Left foot', 
    'MSE', 'Physical Examination', 'Right knee'
  ];

  const INVESTIGATION_SERVICES = [
    'ICU profile', 'Surgical profile', 'Hospital packages', 'General ward male',
    'registration fee', 'ALPHA BED', '1st consultation', '1339 IQRA',
    'Anesthesia', 'AC wash', 'COVID-19 profile', 'Lipid profile',
    'Homocystein-Serum', 'LDL Cholesterol', 'Urine Spot Protein',
    'Alkaline Phosphatase', 'Blood Sugar(F)(CBG)', 'Cholesterol', 'Procalcitonin'
  ];

  const DIAGNOSES_LIST = [
    'Anemia', 'Atrial Fibrillation', 'Abdominal pain', 'Fever', 
    'Fracture mandible condyle of femur', 'Inter vertebral disc prolapse', 
    'Urinary tract infection', 'Diabetes', 'Hypertension', 'Pneumonia'
  ];

  const MEDICINES_LIST = [
    'NEORELAX SP', 'VELOZ 20 MG TAB', 'BECOUSULES CAP', 
    'Paracetamol', 'Ibuprofen', 'Amoxicillin', 'Metformin'
  ];

  const DOCTORS_LIST = ['Dr. Smith', 'Dr. Johnson', 'Dr. Williams', 'Dr. Brown', 'VARUN VEMULAPALLY'];
  const NURSES_LIST = ['Nurse Mary', 'Nurse Sarah', 'Nurse Jennifer', 'Nurse Patricia'];

  // Dynamic data from database/services
  const [doctorsList, setDoctorsList] = useState<string[]>([]);
  const [complaintsList, setComplaintsList] = useState<any[]>([]);
  
  // Custom add states
  const [showCustomComplaint, setShowCustomComplaint] = useState(false);
  const [showCustomDoctor, setShowCustomDoctor] = useState(false);
  const [newComplaint, setNewComplaint] = useState('');
  const [newDoctor, setNewDoctor] = useState('');
  const [addingComplaint, setAddingComplaint] = useState(false);
  const [addingDoctor, setAddingDoctor] = useState(false);

  // Handlers
  const addHighRisk = () => {
    if (!currentHighRisk.condition) {
      toast.error('Please select a condition');
      return;
    }
    setHighRisks([...highRisks, { ...currentHighRisk }]);
    setCurrentHighRisk({ condition: '', identifiedDate: '', notes: '' });
    toast.success('High risk condition added');
  };

  const addChiefComplaint = () => {
    if (!currentChiefComplaint.complaint) {
      toast.error('Please select a complaint');
      return;
    }
    setChiefComplaints([...chiefComplaints, { ...currentChiefComplaint }]);
    setCurrentChiefComplaint({ complaint: '', period: '', presentHistory: '', performingDoctor: '', notes: '' });
    toast.success('Chief complaint added');
  };

  const addExamination = () => {
    if (!currentExamination.examinationType) {
      toast.error('Please select examination type');
      return;
    }
    setExaminations([...examinations, { ...currentExamination }]);
    setCurrentExamination({ examinationType: '', problemSince: '', severity: '', performingDoctor: '', performingNurse: '', notes: '' });
    toast.success('Examination added');
  };

  const addInvestigation = () => {
    if (!currentInvestigation.service) {
      toast.error('Please select service');
      return;
    }
    setInvestigations([...investigations, { ...currentInvestigation }]);
    setCurrentInvestigation({ service: '', testResults: '', outsideTest: false, performingDoctor: '', performingNurse: '', notes: '' });
    toast.success('Investigation added');
  };

  const addDiagnosis = () => {
    if (!currentDiagnosis.diagnosis) {
      toast.error('Please select a diagnosis');
      return;
    }
    setDiagnoses([...diagnoses, { ...currentDiagnosis }]);
    setCurrentDiagnosis({ diagnosis: '', isHighRisk: false, performingDoctor: '', performingNurse: '', treatmentGiven: '' });
    toast.success('Diagnosis added');
  };

  const addPrescription = () => {
    if (!currentPrescription.medicineName || !currentPrescription.unit || !currentPrescription.dosage || !currentPrescription.frequency || !currentPrescription.whenTaken || !currentPrescription.duration || !currentPrescription.dispenseQty) {
      toast.error('Please fill all required fields (marked with *)');
      return;
    }
    const netAmt = currentPrescription.amount; // Calculated from rate after discount
    const newPrescription = { ...currentPrescription, netAmt };
    setPrescriptions([...prescriptions, newPrescription]);
    setCurrentPrescription({
      medicineName: '', genericName: '', medicineCategory: '', unit: '', dosage: '',
      frequency: '', mor: false, noon: false, eve: false, night: false,
      whenTaken: '', duration: '', dispenseQty: '', route: '', instructions: '',
      specialInstructions: '', performingDoctor: 'VARUN VEMULAPALLY', performingNurse: '',
      rate: 0, amount: 0, discType: '', netAmt: 0
    });
    toast.success('Medicine added to prescription');
  };

  // Test localStorage functionality
  const testLocalStorage = () => {
    try {
      const testKey = 'localStorage_test';
      const testData = { test: 'data', timestamp: Date.now() };
      localStorage.setItem(testKey, JSON.stringify(testData));
      const retrieved = localStorage.getItem(testKey);
      if (retrieved) {
        const parsed = JSON.parse(retrieved);
        console.log('✅ localStorage test passed:', parsed);
        localStorage.removeItem(testKey);
        return true;
      }
      return false;
    } catch (error) {
      console.error('❌ localStorage test failed:', error);
      return false;
    }
  };

  const saveRecord = async () => {
    console.log('💾 Saving patient record:', {
      patientId: patient.patient_id,
      dataCount: {
        highRisks: highRisks.length,
        chiefComplaints: chiefComplaints.length,
        examinations: examinations.length,
        investigations: investigations.length,
        diagnoses: diagnoses.length,
        prescriptions: prescriptions.length
      }
    });
    
    
    try {
      // Transform data to match database schema
      const recordData = {
        highRisk: highRisks.length > 0 ? {
          risk_factors: highRisks.map(hr => hr.condition),
          notes: highRisks.map(hr => hr.notes).join('; ')
        } : null,
        
        chiefComplaints: chiefComplaints.map(cc => ({
          complaint: cc.complaint,
          duration: cc.presentHistory,
          period: cc.period,
          performing_doctor: cc.performingDoctor,
          notes: cc.notes,
          complaint_date: new Date().toISOString().split('T')[0]
        })),
        
        examination: examinations.length > 0 ? {
          general_appearance: examinations.map(e => `${e.examinationType}: ${e.notes}`).join('; '),
          examined_by: examinations[0]?.performingDoctor,
          examination_date: new Date().toISOString().split('T')[0],
          notes: examinations.map(e => e.notes).join('; ')
        } : null,
        
        investigation: investigations.length > 0 ? {
          laboratory_tests: investigations.map(i => `${i.service}: ${i.testResults}`).join('; '),
          requested_by: investigations[0]?.performingDoctor,
          investigation_date: new Date().toISOString().split('T')[0],
          notes: investigations.map(i => i.notes).join('; ')
        } : null,
        
        diagnosis: diagnoses.length > 0 ? {
          primary_diagnosis: diagnoses[0]?.diagnosis || '',
          secondary_diagnosis: diagnoses.slice(1).map(d => d.diagnosis).join('; '),
          diagnosed_by: diagnoses[0]?.performingDoctor,
          diagnosis_date: new Date().toISOString().split('T')[0],
          notes: diagnoses.map(d => d.treatmentGiven).join('; ')
        } : null,
        
        prescription: prescriptions.length > 0 ? {
          medications: prescriptions,
          prescribed_by: prescriptions[0]?.performingDoctor,
          prescription_date: new Date().toISOString().split('T')[0],
          notes: prescriptions.map(p => p.instructions).join('; ')
        } : null,
        
        summary: {
          summary: `Complete patient record with ${highRisks.length + chiefComplaints.length + examinations.length + investigations.length + diagnoses.length + prescriptions.length} total entries`,
          created_by: 'system',
          record_date: new Date().toISOString().split('T')[0]
        }
      };

      await CompletePatientRecordService.saveCompletePatientRecord(patient.patient_id, recordData);
      console.log('✅ Record saved to database successfully');
      toast.success('Patient record saved to database successfully!');
    } catch (error) {
      console.error('❌ Failed to save record to database:', error);
      toast.error('Failed to save record to database');
    }
  };

  const printRecord = () => {
    window.print();
    toast.success('Print dialog opened');
  };

  // Load dynamic data and existing saved record on component mount and when patient changes
  useEffect(() => {
    console.log('🔄 useEffect triggered for patient:', patient.patient_id);
    const loadData = async () => {
      try {
        // Load doctors from service
        const doctors = DoctorService.getAllDoctors();
        setDoctorsList(doctors.map(doc => doc.name));
        
        // Load pain complaints from database
        const complaints = await HospitalService.getPainComplaints();
        setComplaintsList(complaints);

        // Load existing saved medical record from database
        console.log(`🔍 Loading saved record for patient: ${patient.patient_id}`);
        
        const savedRecord = await CompletePatientRecordService.getCompletePatientRecord(patient.patient_id);
        console.log(`📄 Saved record found:`, !!savedRecord);
        
        if (savedRecord) {
          console.log('✅ Loading existing medical record from database:', savedRecord);
          
          // Transform database data back to component format
          const loadedHighRisks: HighRiskData[] = [];
          const loadedChiefComplaints: ChiefComplaintData[] = [];
          const loadedExaminations: ExaminationData[] = [];
          const loadedInvestigations: InvestigationData[] = [];
          const loadedDiagnoses: DiagnosisData[] = [];
          const loadedPrescriptions: PrescriptionMedicine[] = [];
            
          // Load high risk data
          if (savedRecord.highRisk?.risk_factors) {
            savedRecord.highRisk.risk_factors.forEach((factor: string, index: number) => {
              loadedHighRisks.push({
                condition: factor,
                identifiedDate: savedRecord.highRisk?.created_at?.split('T')[0] || '',
                notes: savedRecord.highRisk?.notes || ''
              });
            });
          }
          
          // Load chief complaints
          if (savedRecord.chiefComplaints?.length > 0) {
            savedRecord.chiefComplaints.forEach((cc: any) => {
              loadedChiefComplaints.push({
                complaint: cc.complaint || '',
                period: cc.period || '',
                presentHistory: cc.duration || '',
                performingDoctor: cc.performing_doctor || '',
                notes: cc.notes || ''
              });
            });
          }
          
          // Load examinations
          if (savedRecord.examination) {
            loadedExaminations.push({
              examinationType: 'General Examination',
              problemSince: savedRecord.examination.examination_date || '',
              severity: 'Normal',
              performingDoctor: savedRecord.examination.examined_by || '',
              performingNurse: '',
              notes: savedRecord.examination.general_appearance || ''
            });
          }
          
          // Load investigations
          if (savedRecord.investigation) {
            loadedInvestigations.push({
              service: 'Laboratory Tests',
              testResults: savedRecord.investigation.laboratory_tests || '',
              outsideTest: false,
              performingDoctor: savedRecord.investigation.requested_by || '',
              performingNurse: '',
              notes: savedRecord.investigation.notes || ''
            });
          }
          
          // Load diagnoses
          if (savedRecord.diagnosis) {
            loadedDiagnoses.push({
              diagnosis: savedRecord.diagnosis.primary_diagnosis || '',
              isHighRisk: false,
              performingDoctor: savedRecord.diagnosis.diagnosed_by || '',
              performingNurse: '',
              treatmentGiven: savedRecord.diagnosis.notes || ''
            });
            
            if (savedRecord.diagnosis.secondary_diagnosis) {
              loadedDiagnoses.push({
                diagnosis: savedRecord.diagnosis.secondary_diagnosis,
                isHighRisk: false,
                performingDoctor: savedRecord.diagnosis.diagnosed_by || '',
                performingNurse: '',
                treatmentGiven: ''
              });
            }
          }
          
          // Load prescriptions
          if (savedRecord.prescription?.medications?.length > 0) {
            savedRecord.prescription.medications.forEach((med: any) => {
              loadedPrescriptions.push(med);
            });
          }
          
          setHighRisks(loadedHighRisks);
          setChiefComplaints(loadedChiefComplaints);
          setExaminations(loadedExaminations);
          setInvestigations(loadedInvestigations);
          setDiagnoses(loadedDiagnoses);
          setPrescriptions(loadedPrescriptions);
          
          const totalRecords = loadedHighRisks.length + loadedChiefComplaints.length + 
                             loadedExaminations.length + loadedInvestigations.length +
                             loadedDiagnoses.length + loadedPrescriptions.length;
          
          console.log(`📋 Successfully loaded ${totalRecords} medical records from database`);
          toast.success(`Loaded existing medical record from database! (${totalRecords} total entries)`);
        } else {
          console.log('📝 No previous medical record found for this patient');
        }
        
      } catch (error) {
        console.error('Failed to load dynamic data:', error);
        toast.error('Failed to load doctors and complaints');
      }
    };
    
    loadData();
  }, [patient.patient_id]);

  // Load custom doctors and complaints from database on mount
  useEffect(() => {
    const loadCustomData = async () => {
      try {
        const customDoctors = await CompletePatientRecordService.getCustomDoctors();
        if (customDoctors.length > 0) {
          setDoctorsList(prev => [...prev, ...customDoctors]);
        }

        const customComplaints = await CompletePatientRecordService.getCustomComplaints();
        if (customComplaints.length > 0) {
          setComplaintsList(prev => [...prev, ...customComplaints]);
        }
      } catch (error) {
        console.error('Error loading custom data:', error);
      }
    };

    loadCustomData();
  }, []);

  // Add custom complaint
  const addCustomComplaint = async () => {
    if (!newComplaint.trim()) {
      toast.error('Please enter a complaint');
      return;
    }
    
    setAddingComplaint(true);
    try {
      await CompletePatientRecordService.addCustomComplaint(newComplaint.trim());
      
      // Add to local state
      setComplaintsList(prev => [...prev, newComplaint.trim()]);
      
      // Set in current complaint
      setCurrentChiefComplaint(prev => ({ ...prev, complaint: newComplaint.trim() }));
      
      // Clear and hide
      setNewComplaint('');
      setShowCustomComplaint(false);
      
      toast.success('Custom complaint added to database successfully!');
    } catch (error) {
      console.error('Failed to add custom complaint:', error);
      toast.error('Failed to add custom complaint');
    } finally {
      setAddingComplaint(false);
    }
  };

  // Add custom doctor
  const addCustomDoctor = async () => {
    if (!newDoctor.trim()) {
      toast.error('Please enter a doctor name');
      return;
    }
    
    setAddingDoctor(true);
    try {
      const doctorName = newDoctor.trim();
      
      await CompletePatientRecordService.addCustomDoctor(doctorName);
      
      // Add to local doctors list
      setDoctorsList(prev => [...prev, doctorName]);
      
      // Set in current complaint
      setCurrentChiefComplaint(prev => ({ ...prev, performingDoctor: doctorName }));
      
      // Clear and hide
      setNewDoctor('');
      setShowCustomDoctor(false);
      
      toast.success('Custom doctor added to database successfully!');
    } catch (error) {
      console.error('Failed to add custom doctor:', error);
      toast.error('Failed to add custom doctor');
    } finally {
      setAddingDoctor(false);
    }
  };

  const tabs = [
    { key: 'highRisk', label: 'High Risk', icon: '🚨' },
    { key: 'chiefComplaints', label: 'Chief Complaints', icon: '💭' },
    { key: 'examination', label: 'Examination', icon: '🔍' },
    { key: 'investigation', label: 'Investigation', icon: '🧪' },
    { key: 'diagnosis', label: 'Diagnosis', icon: '🔬' },
    { key: 'prescription', label: 'Prescription', icon: '💊' }
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-7xl w-full max-h-[90vh] overflow-auto">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b" style={{ backgroundColor: '#0056B3', color: 'white' }}>
          <div>
            <h2 className="text-2xl font-bold">Complete Patient Record</h2>
            <p className="opacity-90">
              {patient.prefix} {patient.first_name} {patient.last_name} - ID: {patient.patient_id}
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={saveRecord}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
            >
              💾 Save
            </button>
            <button
              onClick={printRecord}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              🖨️ Print
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
            >
              ✕ Close
            </button>
          </div>
        </div>


        {/* Tabs */}
        <div className="flex border-b overflow-x-auto">
          {tabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-6 py-3 font-medium whitespace-nowrap ${
                activeTab === tab.key
                  ? 'border-b-2 text-blue-600'
                  : 'text-gray-600 hover:text-blue-600'
              }`}
              style={{ borderBottomColor: activeTab === tab.key ? '#0056B3' : 'transparent' }}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="p-6">
          {/* High Risk Tab */}
          {activeTab === 'highRisk' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold">High Risk Conditions</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Select High Risk</label>
                  <select
                    value={currentHighRisk.condition}
                    onChange={(e) => setCurrentHighRisk({ ...currentHighRisk, condition: e.target.value })}
                    className="w-full p-2 border rounded"
                  >
                    <option value="">Select condition...</option>
                    {HIGH_RISK_CONDITIONS.map(condition => (
                      <option key={condition} value={condition}>{condition}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">Identified Date</label>
                  <input
                    type="date"
                    value={currentHighRisk.identifiedDate}
                    onChange={(e) => setCurrentHighRisk({ ...currentHighRisk, identifiedDate: e.target.value })}
                    className="w-full p-2 border rounded"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">Notes</label>
                  <input
                    type="text"
                    value={currentHighRisk.notes}
                    onChange={(e) => setCurrentHighRisk({ ...currentHighRisk, notes: e.target.value })}
                    className="w-full p-2 border rounded"
                    placeholder="Additional notes..."
                  />
                </div>
              </div>
              
              <div className="flex gap-2">
                <button
                  onClick={addHighRisk}
                  className="px-4 py-2 text-white rounded"
                  style={{ backgroundColor: '#0056B3' }}
                >
                  Add HighRisk
                </button>
                <button
                  onClick={() => setCurrentHighRisk({ condition: '', identifiedDate: '', notes: '' })}
                  className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
                >
                  Reset
                </button>
              </div>
              
              {/* Display added high risks */}
              {highRisks.length > 0 && (
                <div className="mt-6">
                  <h4 className="font-medium mb-3">Added High Risk Conditions:</h4>
                  <div className="space-y-2">
                    {highRisks.map((risk, index) => (
                      <div key={index} className="p-3 bg-red-50 border-l-4 border-red-500 rounded">
                        <div className="flex justify-between items-center">
                          <div>
                            <span className="font-medium">{risk.condition}</span>
                            {risk.identifiedDate && <span className="text-sm text-gray-600 ml-2">({risk.identifiedDate})</span>}
                          </div>
                          <button
                            onClick={() => setHighRisks(highRisks.filter((_, i) => i !== index))}
                            className="text-red-600 hover:text-red-800"
                          >
                            Remove
                          </button>
                        </div>
                        {risk.notes && <p className="text-sm text-gray-600 mt-1">{risk.notes}</p>}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Chief Complaints Tab */}
          {activeTab === 'chiefComplaints' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold">Chief Complaints</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Select Complaint</label>
                  <div className="space-y-2">
                    <select
                      value={currentChiefComplaint.complaint}
                      onChange={(e) => setCurrentChiefComplaint({ ...currentChiefComplaint, complaint: e.target.value })}
                      className="w-full p-2 border rounded"
                    >
                      <option value="">Select complaint...</option>
                      {complaintsList.map(complaint => (
                        <option key={complaint.id} value={complaint.name}>{complaint.name}</option>
                      ))}
                      {CHIEF_COMPLAINTS.map(complaint => (
                        <option key={complaint} value={complaint}>{complaint}</option>
                      ))}
                    </select>
                    
                    {/* Add Custom Complaint */}
                    {!showCustomComplaint ? (
                      <button
                        type="button"
                        onClick={() => setShowCustomComplaint(true)}
                        className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center gap-1"
                      >
                        <span>+</span> Add Custom Complaint
                      </button>
                    ) : (
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={newComplaint}
                          onChange={(e) => setNewComplaint(e.target.value)}
                          onKeyPress={(e) => e.key === 'Enter' && addCustomComplaint()}
                          placeholder="Enter new complaint..."
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          autoFocus
                        />
                        <button
                          type="button"
                          onClick={addCustomComplaint}
                          disabled={addingComplaint}
                          className="px-3 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700 disabled:opacity-50"
                        >
                          {addingComplaint ? '...' : 'Add'}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setShowCustomComplaint(false);
                            setNewComplaint('');
                          }}
                          className="px-3 py-2 bg-gray-300 text-gray-700 rounded-md text-sm hover:bg-gray-400"
                        >
                          Cancel
                        </button>
                      </div>
                    )}
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">Period</label>
                  <div className="flex gap-2">
                    {/* Number dropdown (1-30) */}
                    <select
                      value={currentChiefComplaint.period.split(' ')[0] || ''}
                      onChange={(e) => {
                        const number = e.target.value;
                        const unit = currentChiefComplaint.period.split(' ')[1] || 'D';
                        const newPeriod = number && unit ? `${number} ${unit}` : '';
                        setCurrentChiefComplaint({ ...currentChiefComplaint, period: newPeriod });
                      }}
                      className="flex-1 p-2 border rounded"
                    >
                      <option value="">Num</option>
                      {Array.from({ length: 30 }, (_, i) => i + 1).map(num => (
                        <option key={num} value={num}>{num}</option>
                      ))}
                    </select>
                    
                    {/* Unit dropdown (D,W,M,Y) */}
                    <select
                      value={currentChiefComplaint.period.split(' ')[1] || ''}
                      onChange={(e) => {
                        const number = currentChiefComplaint.period.split(' ')[0] || '';
                        const unit = e.target.value;
                        const newPeriod = number && unit ? `${number} ${unit}` : '';
                        setCurrentChiefComplaint({ ...currentChiefComplaint, period: newPeriod });
                      }}
                      className="flex-1 p-2 border rounded"
                    >
                      <option value="">Unit</option>
                      <option value="D">D</option>
                      <option value="W">W</option>
                      <option value="M">M</option>
                      <option value="Y">Y</option>
                    </select>
                  </div>
                  
                  {/* Display selected period */}
                  {currentChiefComplaint.period && (
                    <div className="mt-1 text-sm text-gray-600">
                      Selected: {currentChiefComplaint.period}
                    </div>
                  )}
                </div>
                
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-2">Present History</label>
                  <textarea
                    value={currentChiefComplaint.presentHistory}
                    onChange={(e) => setCurrentChiefComplaint({ ...currentChiefComplaint, presentHistory: e.target.value })}
                    className="w-full p-2 border rounded"
                    rows={3}
                    placeholder="Describe present history..."
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-2">Performing Doctor</label>
                  <div className="space-y-2">
                    <select
                      value={currentChiefComplaint.performingDoctor}
                      onChange={(e) => setCurrentChiefComplaint({ ...currentChiefComplaint, performingDoctor: e.target.value })}
                      className="w-full p-2 border rounded"
                    >
                      <option value="">Select doctor...</option>
                      {doctorsList.map(doctor => (
                        <option key={doctor} value={doctor}>{doctor}</option>
                      ))}
                    </select>
                    
                    {/* Add Custom Doctor */}
                    {!showCustomDoctor ? (
                      <button
                        type="button"
                        onClick={() => setShowCustomDoctor(true)}
                        className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center gap-1"
                      >
                        <span>+</span> Add Custom Doctor
                      </button>
                    ) : (
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={newDoctor}
                          onChange={(e) => setNewDoctor(e.target.value)}
                          onKeyPress={(e) => e.key === 'Enter' && addCustomDoctor()}
                          placeholder="Enter doctor name..."
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          autoFocus
                        />
                        <button
                          type="button"
                          onClick={addCustomDoctor}
                          disabled={addingDoctor}
                          className="px-3 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700 disabled:opacity-50"
                        >
                          {addingDoctor ? '...' : 'Add'}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setShowCustomDoctor(false);
                            setNewDoctor('');
                          }}
                          className="px-3 py-2 bg-gray-300 text-gray-700 rounded-md text-sm hover:bg-gray-400"
                        >
                          Cancel
                        </button>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-2">Notes</label>
                  <textarea
                    value={currentChiefComplaint.notes}
                    onChange={(e) => setCurrentChiefComplaint({ ...currentChiefComplaint, notes: e.target.value })}
                    className="w-full p-2 border rounded"
                    rows={2}
                    placeholder="Additional notes..."
                  />
                </div>
              </div>
              
              <button
                onClick={addChiefComplaint}
                className="px-4 py-2 text-white rounded"
                style={{ backgroundColor: '#0056B3' }}
              >
                Add Chief Complaint
              </button>
              
              {/* Display added complaints */}
              {chiefComplaints.length > 0 && (
                <div className="mt-6">
                  <h4 className="font-medium mb-3">Added Chief Complaints:</h4>
                  <div className="space-y-3">
                    {chiefComplaints.map((complaint, index) => (
                      <div key={index} className="p-4 bg-blue-50 border rounded">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="font-medium">{complaint.complaint}</div>
                            {complaint.period && <div className="text-sm text-gray-600">Period: {complaint.period}</div>}
                            {complaint.presentHistory && <div className="text-sm mt-2">{complaint.presentHistory}</div>}
                            {complaint.performingDoctor && <div className="text-sm text-gray-600">Doctor: {complaint.performingDoctor}</div>}
                            {complaint.notes && <div className="text-sm text-gray-600 mt-1">Notes: {complaint.notes}</div>}
                          </div>
                          <button
                            onClick={() => setChiefComplaints(chiefComplaints.filter((_, i) => i !== index))}
                            className="text-red-600 hover:text-red-800 ml-4"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Examination Tab */}
          {activeTab === 'examination' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold">Examination</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Select Examination</label>
                  <select
                    value={currentExamination.examinationType}
                    onChange={(e) => setCurrentExamination({ ...currentExamination, examinationType: e.target.value })}
                    className="w-full p-2 border rounded"
                  >
                    <option value="">Select examination...</option>
                    {EXAMINATION_TYPES.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">Problem Since</label>
                  <input
                    type="text"
                    value={currentExamination.problemSince}
                    onChange={(e) => setCurrentExamination({ ...currentExamination, problemSince: e.target.value })}
                    className="w-full p-2 border rounded"
                    placeholder="Duration of problem..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Severity</label>
                  <select
                    value={currentExamination.severity}
                    onChange={(e) => setCurrentExamination({ ...currentExamination, severity: e.target.value })}
                    className="w-full p-2 border rounded"
                  >
                    <option value="">Select severity...</option>
                    <option value="High">High</option>
                    <option value="Moderate">Moderate</option>
                    <option value="Low">Low</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Performing Doctor</label>
                  <select
                    value={currentExamination.performingDoctor}
                    onChange={(e) => setCurrentExamination({ ...currentExamination, performingDoctor: e.target.value })}
                    className="w-full p-2 border rounded"
                  >
                    <option value="">Select doctor...</option>
                    {DOCTORS_LIST.map(doctor => (
                      <option key={doctor} value={doctor}>{doctor}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Performing Nurse</label>
                  <select
                    value={currentExamination.performingNurse}
                    onChange={(e) => setCurrentExamination({ ...currentExamination, performingNurse: e.target.value })}
                    className="w-full p-2 border rounded"
                  >
                    <option value="">Select nurse...</option>
                    {NURSES_LIST.map(nurse => (
                      <option key={nurse} value={nurse}>{nurse}</option>
                    ))}
                  </select>
                </div>
                
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-2">Notes</label>
                  <textarea
                    value={currentExamination.notes}
                    onChange={(e) => setCurrentExamination({ ...currentExamination, notes: e.target.value })}
                    className="w-full p-2 border rounded"
                    rows={3}
                    placeholder="Examination findings..."
                  />
                </div>
              </div>
              
              <button
                onClick={addExamination}
                className="px-4 py-2 text-white rounded"
                style={{ backgroundColor: '#0056B3' }}
              >
                Add Examination
              </button>
              
              {/* Display added examinations */}
              {examinations.length > 0 && (
                <div className="mt-6">
                  <h4 className="font-medium mb-3">Added Examinations:</h4>
                  <div className="space-y-3">
                    {examinations.map((exam, index) => (
                      <div key={index} className="p-4 bg-yellow-50 border rounded">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="font-medium flex items-center gap-2">
                              {exam.examinationType}
                              <span className={`px-2 py-1 rounded text-xs ${
                                exam.severity === 'High' ? 'bg-red-100 text-red-700' :
                                exam.severity === 'Moderate' ? 'bg-yellow-100 text-yellow-700' :
                                'bg-green-100 text-green-700'
                              }`}>
                                {exam.severity}
                              </span>
                            </div>
                            {exam.problemSince && <div className="text-sm text-gray-600">Problem Since: {exam.problemSince}</div>}
                            {exam.performingDoctor && <div className="text-sm text-gray-600">Doctor: {exam.performingDoctor}</div>}
                            {exam.notes && <div className="text-sm mt-2">{exam.notes}</div>}
                          </div>
                          <button
                            onClick={() => setExaminations(examinations.filter((_, i) => i !== index))}
                            className="text-red-600 hover:text-red-800 ml-4"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Investigation Tab */}
          {activeTab === 'investigation' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold">Investigation</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Service</label>
                  <select
                    value={currentInvestigation.service}
                    onChange={(e) => setCurrentInvestigation({ ...currentInvestigation, service: e.target.value })}
                    className="w-full p-2 border rounded"
                  >
                    <option value="">Select service...</option>
                    {INVESTIGATION_SERVICES.map(service => (
                      <option key={service} value={service}>{service}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">Test Results</label>
                  <input
                    type="text"
                    value={currentInvestigation.testResults}
                    onChange={(e) => setCurrentInvestigation({ ...currentInvestigation, testResults: e.target.value })}
                    className="w-full p-2 border rounded"
                    placeholder="Test results..."
                  />
                </div>

                <div className="flex items-center">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={currentInvestigation.outsideTest}
                      onChange={(e) => setCurrentInvestigation({ ...currentInvestigation, outsideTest: e.target.checked })}
                      className="mr-2"
                    />
                    Outside Test
                  </label>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Performing Doctor</label>
                  <select
                    value={currentInvestigation.performingDoctor}
                    onChange={(e) => setCurrentInvestigation({ ...currentInvestigation, performingDoctor: e.target.value })}
                    className="w-full p-2 border rounded"
                  >
                    <option value="">Select doctor...</option>
                    {DOCTORS_LIST.map(doctor => (
                      <option key={doctor} value={doctor}>{doctor}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Performing Nurse</label>
                  <select
                    value={currentInvestigation.performingNurse}
                    onChange={(e) => setCurrentInvestigation({ ...currentInvestigation, performingNurse: e.target.value })}
                    className="w-full p-2 border rounded"
                  >
                    <option value="">Select nurse...</option>
                    {NURSES_LIST.map(nurse => (
                      <option key={nurse} value={nurse}>{nurse}</option>
                    ))}
                  </select>
                </div>
                
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-2">Notes</label>
                  <textarea
                    value={currentInvestigation.notes}
                    onChange={(e) => setCurrentInvestigation({ ...currentInvestigation, notes: e.target.value })}
                    className="w-full p-2 border rounded"
                    rows={3}
                    placeholder="Investigation notes..."
                  />
                </div>
              </div>
              
              <button
                onClick={addInvestigation}
                className="px-4 py-2 text-white rounded"
                style={{ backgroundColor: '#0056B3' }}
              >
                Add Investigation
              </button>
              
              {/* Display added investigations */}
              {investigations.length > 0 && (
                <div className="mt-6">
                  <h4 className="font-medium mb-3">Added Investigations:</h4>
                  <div className="space-y-3">
                    {investigations.map((investigation, index) => (
                      <div key={index} className="p-4 bg-purple-50 border rounded">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="font-medium flex items-center gap-2">
                              {investigation.service}
                              {investigation.outsideTest && <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs">OUTSIDE</span>}
                            </div>
                            {investigation.testResults && <div className="text-sm text-gray-600">Results: {investigation.testResults}</div>}
                            {investigation.performingDoctor && <div className="text-sm text-gray-600">Doctor: {investigation.performingDoctor}</div>}
                            {investigation.notes && <div className="text-sm mt-2">{investigation.notes}</div>}
                          </div>
                          <button
                            onClick={() => setInvestigations(investigations.filter((_, i) => i !== index))}
                            className="text-red-600 hover:text-red-800 ml-4"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Diagnosis Tab */}
          {activeTab === 'diagnosis' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold">Diagnosis</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Diagnosis Name</label>
                  <select
                    value={currentDiagnosis.diagnosis}
                    onChange={(e) => setCurrentDiagnosis({ ...currentDiagnosis, diagnosis: e.target.value })}
                    className="w-full p-2 border rounded"
                  >
                    <option value="">Select diagnosis...</option>
                    {DIAGNOSES_LIST.map(diagnosis => (
                      <option key={diagnosis} value={diagnosis}>{diagnosis}</option>
                    ))}
                  </select>
                </div>
                
                <div className="flex items-center">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={currentDiagnosis.isHighRisk}
                      onChange={(e) => setCurrentDiagnosis({ ...currentDiagnosis, isHighRisk: e.target.checked })}
                      className="mr-2"
                    />
                    High Risk Diagnosis
                  </label>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Performing Doctor</label>
                  <select
                    value={currentDiagnosis.performingDoctor}
                    onChange={(e) => setCurrentDiagnosis({ ...currentDiagnosis, performingDoctor: e.target.value })}
                    className="w-full p-2 border rounded"
                  >
                    <option value="">Select doctor...</option>
                    {DOCTORS_LIST.map(doctor => (
                      <option key={doctor} value={doctor}>{doctor}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Performing Nurse</label>
                  <select
                    value={currentDiagnosis.performingNurse}
                    onChange={(e) => setCurrentDiagnosis({ ...currentDiagnosis, performingNurse: e.target.value })}
                    className="w-full p-2 border rounded"
                  >
                    <option value="">Select nurse...</option>
                    {NURSES_LIST.map(nurse => (
                      <option key={nurse} value={nurse}>{nurse}</option>
                    ))}
                  </select>
                </div>
                
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-2">Treatment Given</label>
                  <textarea
                    value={currentDiagnosis.treatmentGiven}
                    onChange={(e) => setCurrentDiagnosis({ ...currentDiagnosis, treatmentGiven: e.target.value })}
                    className="w-full p-2 border rounded"
                    rows={3}
                    placeholder="Describe treatment given..."
                  />
                </div>
              </div>
              
              <button
                onClick={addDiagnosis}
                className="px-4 py-2 text-white rounded"
                style={{ backgroundColor: '#0056B3' }}
              >
                Add Diagnosis
              </button>
              
              {/* Display added diagnoses */}
              {diagnoses.length > 0 && (
                <div className="mt-6">
                  <h4 className="font-medium mb-3">Added Diagnoses:</h4>
                  <div className="space-y-3">
                    {diagnoses.map((diagnosis, index) => (
                      <div key={index} className={`p-4 border rounded ${diagnosis.isHighRisk ? 'bg-red-50 border-red-200' : 'bg-gray-50'}`}>
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="font-medium flex items-center gap-2">
                              {diagnosis.diagnosis}
                              {diagnosis.isHighRisk && <span className="bg-red-500 text-white px-2 py-1 rounded text-xs">HIGH RISK</span>}
                            </div>
                            {diagnosis.performingDoctor && <div className="text-sm text-gray-600">Doctor: {diagnosis.performingDoctor}</div>}
                            {diagnosis.treatmentGiven && <div className="text-sm mt-2">{diagnosis.treatmentGiven}</div>}
                          </div>
                          <button
                            onClick={() => setDiagnoses(diagnoses.filter((_, i) => i !== index))}
                            className="text-red-600 hover:text-red-800 ml-4"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Prescription Tab - New Format */}
          {activeTab === 'prescription' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Add Prescription</h3>
              </div>
              
              {/* Medication Details */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="text-md font-medium mb-4">Medication Details</h4>
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Medicine Name <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={currentPrescription.medicineName}
                      onChange={(e) => setCurrentPrescription({ ...currentPrescription, medicineName: e.target.value })}
                      className="w-full p-2 border rounded"
                    >
                      <option value="">Select</option>
                      {MEDICINES_LIST.map(medicine => (
                        <option key={medicine} value={medicine}>{medicine}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-2">Generic Name</label>
                    <input
                      type="text"
                      value={currentPrescription.genericName}
                      onChange={(e) => setCurrentPrescription({ ...currentPrescription, genericName: e.target.value })}
                      className="w-full p-2 border rounded"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Medicine Category</label>
                    <input
                      type="text"
                      value={currentPrescription.medicineCategory}
                      onChange={(e) => setCurrentPrescription({ ...currentPrescription, medicineCategory: e.target.value })}
                      className="w-full p-2 border rounded"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Unit <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={currentPrescription.unit}
                      onChange={(e) => setCurrentPrescription({ ...currentPrescription, unit: e.target.value })}
                      className="w-full p-2 border rounded"
                    >
                      <option value="">Select</option>
                      <option value="Tablet">Tablet</option>
                      <option value="Capsule">Capsule</option>
                      <option value="ml">ml</option>
                      <option value="mg">mg</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Dosage <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={currentPrescription.dosage}
                      onChange={(e) => setCurrentPrescription({ ...currentPrescription, dosage: e.target.value })}
                      className="w-full p-2 border rounded"
                    >
                      <option value="">Select</option>
                      <option value="1-0-0">1-0-0</option>
                      <option value="1-0-1">1-0-1</option>
                      <option value="1-1-1">1-1-1</option>
                      <option value="0-0-1">0-0-1</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Frequency and Timing */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="text-md font-medium mb-4">Frequency and Timing</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Frequency/Routine <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={currentPrescription.frequency}
                      onChange={(e) => setCurrentPrescription({ ...currentPrescription, frequency: e.target.value })}
                      className="w-full p-2 border rounded"
                    >
                      <option value="">Select</option>
                      <option value="Once Daily">Once Daily</option>
                      <option value="Twice Daily">Twice Daily</option>
                      <option value="Three Times Daily">Three Times Daily</option>
                      <option value="Four Times Daily">Four Times Daily</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Time of Day</label>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setCurrentPrescription({ ...currentPrescription, mor: !currentPrescription.mor })}
                        className={`px-3 py-2 rounded text-sm ${currentPrescription.mor ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
                      >
                        Mor
                      </button>
                      <button
                        type="button"
                        onClick={() => setCurrentPrescription({ ...currentPrescription, noon: !currentPrescription.noon })}
                        className={`px-3 py-2 rounded text-sm ${currentPrescription.noon ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
                      >
                        Noon
                      </button>
                      <button
                        type="button"
                        onClick={() => setCurrentPrescription({ ...currentPrescription, eve: !currentPrescription.eve })}
                        className={`px-3 py-2 rounded text-sm ${currentPrescription.eve ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
                      >
                        Eve
                      </button>
                      <button
                        type="button"
                        onClick={() => setCurrentPrescription({ ...currentPrescription, night: !currentPrescription.night })}
                        className={`px-3 py-2 rounded text-sm ${currentPrescription.night ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
                      >
                        Night
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      When to Taken <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={currentPrescription.whenTaken}
                      onChange={(e) => setCurrentPrescription({ ...currentPrescription, whenTaken: e.target.value })}
                      className="w-full p-2 border rounded"
                    >
                      <option value="">Select</option>
                      <option value="Before Food">Before Food</option>
                      <option value="After Food">After Food</option>
                      <option value="With Food">With Food</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Duration <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={currentPrescription.duration}
                      onChange={(e) => setCurrentPrescription({ ...currentPrescription, duration: e.target.value })}
                      className="w-full p-2 border rounded"
                    >
                      <option value="">Select</option>
                      <option value="3 Days">3 Days</option>
                      <option value="5 Days">5 Days</option>
                      <option value="7 Days">7 Days</option>
                      <option value="14 Days">14 Days</option>
                      <option value="1 Month">1 Month</option>
                    </select>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium mb-2">
                      Dispense/Qty <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={currentPrescription.dispenseQty}
                      onChange={(e) => setCurrentPrescription({ ...currentPrescription, dispenseQty: e.target.value })}
                      className="w-full p-2 border rounded"
                      placeholder="e.g., 10 tablets"
                    />
                  </div>
                </div>
              </div>

              {/* Instructions and Notes */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="text-md font-medium mb-4">Instructions and Notes</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Route</label>
                    <select
                      value={currentPrescription.route}
                      onChange={(e) => setCurrentPrescription({ ...currentPrescription, route: e.target.value })}
                      className="w-full p-2 border rounded"
                    >
                      <option value="">Select</option>
                      <option value="Oral">Oral</option>
                      <option value="IV">IV</option>
                      <option value="IM">IM</option>
                      <option value="Topical">Topical</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Instructions</label>
                    <select
                      value={currentPrescription.instructions}
                      onChange={(e) => setCurrentPrescription({ ...currentPrescription, instructions: e.target.value })}
                      className="w-full p-2 border rounded"
                    >
                      <option value="">Select</option>
                      <option value="Take as directed">Take as directed</option>
                      <option value="Complete the course">Complete the course</option>
                      <option value="If needed">If needed</option>
                    </select>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium mb-2">Specify area/Notes/Special instructions</label>
                    <textarea
                      value={currentPrescription.specialInstructions}
                      onChange={(e) => setCurrentPrescription({ ...currentPrescription, specialInstructions: e.target.value })}
                      className="w-full p-2 border rounded"
                      rows={3}
                      placeholder="Special instructions..."
                    />
                  </div>
                </div>
              </div>

              {/* Personnel and Financial Information */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="text-md font-medium mb-4">Personnel and Financial Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Performing Doctor</label>
                    <div className="flex items-center">
                      <input
                        type="text"
                        value={currentPrescription.performingDoctor}
                        onChange={(e) => setCurrentPrescription({ ...currentPrescription, performingDoctor: e.target.value })}
                        className="flex-1 p-2 border rounded"
                      />
                      <button
                        type="button"
                        onClick={() => setCurrentPrescription({ ...currentPrescription, performingDoctor: '' })}
                        className="ml-2 text-gray-500 hover:text-gray-700"
                      >
                        ✕
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Performing Nurse</label>
                    <select
                      value={currentPrescription.performingNurse}
                      onChange={(e) => setCurrentPrescription({ ...currentPrescription, performingNurse: e.target.value })}
                      className="w-full p-2 border rounded"
                    >
                      <option value="">Select</option>
                      {NURSES_LIST.map(nurse => (
                        <option key={nurse} value={nurse}>{nurse}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Rate</label>
                    <input
                      type="number"
                      value={currentPrescription.rate}
                      onChange={(e) => {
                        const rate = parseFloat(e.target.value) || 0;
                        setCurrentPrescription({ 
                          ...currentPrescription, 
                          rate,
                          amount: rate // Amount equals rate initially
                        });
                      }}
                      className="w-full p-2 border rounded"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Amount</label>
                    <input
                      type="number"
                      value={currentPrescription.amount}
                      onChange={(e) => setCurrentPrescription({ ...currentPrescription, amount: parseFloat(e.target.value) || 0 })}
                      className="w-full p-2 border rounded"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Disc Type</label>
                    <select
                      value={currentPrescription.discType}
                      onChange={(e) => setCurrentPrescription({ ...currentPrescription, discType: e.target.value })}
                      className="w-full p-2 border rounded"
                    >
                      <option value="">Select</option>
                      <option value="Percentage">Percentage</option>
                      <option value="Fixed">Fixed Amount</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Net Amt</label>
                    <input
                      type="number"
                      value={currentPrescription.amount}
                      className="w-full p-2 border rounded bg-gray-100"
                      readOnly
                    />
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-4">
                <button
                  onClick={addPrescription}
                  className="px-6 py-3 text-white rounded-lg text-lg font-medium"
                  style={{ backgroundColor: '#FF8C00' }}
                >
                  Add Medicine
                </button>
                <button
                  onClick={() => toast.success('Added to saved prescriptions')}
                  className="px-6 py-3 bg-purple-600 text-white rounded-lg text-lg font-medium hover:bg-purple-700"
                >
                  Add This Prescriptions saved list
                </button>
                <button
                  onClick={onClose}
                  className="px-6 py-3 bg-gray-500 text-white rounded-lg text-lg font-medium hover:bg-gray-600"
                >
                  Cancel
                </button>
                <button
                  onClick={() => setCurrentPrescription({
                    medicineName: '', genericName: '', medicineCategory: '', unit: '', dosage: '',
                    frequency: '', mor: false, noon: false, eve: false, night: false,
                    whenTaken: '', duration: '', dispenseQty: '', route: '', instructions: '',
                    specialInstructions: '', performingDoctor: 'VARUN VEMULAPALLY', performingNurse: '',
                    rate: 0, amount: 0, discType: '', netAmt: 0
                  })}
                  className="px-6 py-3 bg-gray-400 text-white rounded-lg text-lg font-medium hover:bg-gray-500"
                >
                  Reset
                </button>
              </div>
              
              {/* Prescription List */}
              {prescriptions.length > 0 && (
                <div className="mt-8">
                  <h4 className="text-lg font-medium mb-4">Added Prescriptions:</h4>
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse border border-gray-300">
                      <thead>
                        <tr className="bg-gray-50">
                          <th className="border border-gray-300 px-3 py-2 text-left">Medicine</th>
                          <th className="border border-gray-300 px-3 py-2 text-left">Dosage</th>
                          <th className="border border-gray-300 px-3 py-2 text-left">Frequency</th>
                          <th className="border border-gray-300 px-3 py-2 text-left">Duration</th>
                          <th className="border border-gray-300 px-3 py-2 text-left">When</th>
                          <th className="border border-gray-300 px-3 py-2 text-right">Rate</th>
                          <th className="border border-gray-300 px-3 py-2 text-right">Net</th>
                          <th className="border border-gray-300 px-3 py-2 text-center">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {prescriptions.map((prescription, index) => (
                          <tr key={index}>
                            <td className="border border-gray-300 px-3 py-2">
                              <div className="font-medium">{prescription.medicineName}</div>
                              {prescription.genericName && <div className="text-sm text-gray-600">{prescription.genericName}</div>}
                            </td>
                            <td className="border border-gray-300 px-3 py-2">{prescription.dosage}</td>
                            <td className="border border-gray-300 px-3 py-2">
                              <div>{prescription.frequency}</div>
                              <div className="text-sm text-gray-600">
                                {prescription.mor && 'Mor '}{prescription.noon && 'Noon '}{prescription.eve && 'Eve '}{prescription.night && 'Night'}
                              </div>
                            </td>
                            <td className="border border-gray-300 px-3 py-2">{prescription.duration}</td>
                            <td className="border border-gray-300 px-3 py-2">{prescription.whenTaken}</td>
                            <td className="border border-gray-300 px-3 py-2 text-right">₹{prescription.rate}</td>
                            <td className="border border-gray-300 px-3 py-2 text-right">₹{prescription.amount}</td>
                            <td className="border border-gray-300 px-3 py-2 text-center">
                              <button
                                onClick={() => setPrescriptions(prescriptions.filter((_, i) => i !== index))}
                                className="text-red-600 hover:text-red-800"
                              >
                                Remove
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr className="bg-gray-50 font-medium">
                          <td colSpan={6} className="border border-gray-300 px-3 py-2 text-right">Total:</td>
                          <td className="border border-gray-300 px-3 py-2 text-right">
                            ₹{prescriptions.reduce((sum, p) => sum + p.amount, 0).toFixed(2)}
                          </td>
                          <td className="border border-gray-300 px-3 py-2"></td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SimpleEnhancedPatientRecord;
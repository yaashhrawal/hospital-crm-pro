import React, { useState, useEffect } from 'react';
import type { PatientWithRelations } from '../config/supabaseNew';
import { getDoctorWithDegree } from '../data/doctorDegrees';
import { supabase } from '../config/supabaseNew';
import { MEDICAL_SERVICES, type MedicalService } from '../data/medicalServices';
import HospitalService from '../services/hospitalService';
import MedicineDropdown from './MedicineDropdown';
import toast from 'react-hot-toast';

interface ValantPrescriptionProps {
  patient: PatientWithRelations;
  onClose: () => void;
}

interface PrescriptionData {
  chiefComplaints: {
    painComplaint: string;
    location: string;
    duration: string;
  };
  presentHistory: string;
  pastHistory: string;
  drugHistory: string;
  localExamination: string;
  investigation: string[];
  investigationReference: string;
  generalAdvise: string;
  medicalAdvise: string[];
}

const ValantPrescription: React.FC<ValantPrescriptionProps> = ({ patient, onClose }) => {
  const [doctorDetails, setDoctorDetails] = useState<{specialty?: string, hospital_experience?: string}>({});
  const [showTypingInterface, setShowTypingInterface] = useState(false);
  const [prescriptionData, setPrescriptionData] = useState<PrescriptionData>({
    chiefComplaints: {
      painComplaint: '',
      location: '',
      duration: ''
    },
    presentHistory: '',
    pastHistory: '',
    drugHistory: '',
    localExamination: '',
    investigation: [],
    investigationReference: '',
    generalAdvise: '',
    medicalAdvise: []
  });
  
  // Custom investigations state
  const [customInvestigations, setCustomInvestigations] = useState<any[]>([]);
  const [newCustomInvestigation, setNewCustomInvestigation] = useState('');
  const [showCustomInput, setShowCustomInput] = useState(false);
  
  // Custom complaints and locations state
  const [painComplaints, setPainComplaints] = useState<any[]>([]);
  const [locations, setLocations] = useState<any[]>([]);
  const [newPainComplaint, setNewPainComplaint] = useState('');
  const [newLocation, setNewLocation] = useState('');
  const [showPainComplaintInput, setShowPainComplaintInput] = useState(false);
  const [showLocationInput, setShowLocationInput] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [savedPrescriptions, setSavedPrescriptions] = useState<any[]>([]);
  
  const getCurrentDate = () => {
    return new Date().toLocaleDateString('en-IN');
  };

  // Helper function to convert duration format for display
  const formatDuration = (duration: string) => {
    if (!duration) return '';
    
    const parts = duration.split(' ');
    if (parts.length !== 2) return duration;
    
    const [number, unit] = parts;
    const unitMap: Record<string, string> = {
      'D': 'Days',
      'W': 'Weeks', 
      'M': 'Months',
      'Y': 'Years'
    };
    
    const fullUnit = unitMap[unit] || unit;
    return `${number} ${fullUnit}`;
  };

  // Get the correct doctor name and degree from patient data
  const getDoctorInfo = () => {
    const doctorName = patient.assigned_doctor || '';
    const localDoctorInfo = getDoctorWithDegree(doctorName);
    
    // Prioritize database specialty over local degree if available
    const degree = doctorDetails.specialty || localDoctorInfo.degree;
    
    const result = {
      name: localDoctorInfo.name,
      degree: degree,
      specialty: '', // Don't show specialty separately since it's now the degree
      hospital_experience: doctorDetails.hospital_experience || ''
    };
    return result;
  };

  const getDepartmentName = () => {
    let dept = patient.assigned_department || 'GENERAL PHYSICIAN';
    
    // Fix any ORTHOPEDIC spelling issues
    if (dept.toUpperCase().includes('ORTHOPEDIC')) {
      dept = dept.replace(/ORTHOPEDIC/gi, 'ORTHOPAEDIC');
    }
    
    return dept;
  };

  const getTotalPaidAmount = () => {
    // If this is a transaction-specific prescription, show only that transaction's amount
    if ((patient as any).currentTransactionAmount !== undefined) {
      return (patient as any).currentTransactionAmount;
    }
    
    // Otherwise, show total of all completed transactions (original behavior)
    if (!patient.transactions || patient.transactions.length === 0) {
      return 0;
    }
    
    return patient.transactions
      .filter(transaction => transaction.status === 'COMPLETED')
      .reduce((total, transaction) => total + transaction.amount, 0);
  };

  // Load custom data and saved prescriptions on component mount
  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        
        // Load custom investigations from localStorage
        const storedInvestigations = localStorage.getItem('custom_investigations');
        if (storedInvestigations) {
          setCustomInvestigations(JSON.parse(storedInvestigations));
        }
        
        // Load pain complaints from database
        const complaints = await HospitalService.getPainComplaints();
        setPainComplaints(complaints);
        
        // Load locations from database
        const locationsList = await HospitalService.getLocations();
        setLocations(locationsList);
        
        // Load saved prescriptions for this patient
        const prescriptions = await HospitalService.getPrescriptions(patient.patient_id);
        setSavedPrescriptions(prescriptions);
        
        // If there are saved prescriptions, load the most recent one
        if (prescriptions && prescriptions.length > 0) {
          const latestPrescription = prescriptions[0]; // First item is most recent due to ordering
          setPrescriptionData({
            chiefComplaints: latestPrescription.chief_complaints || { painComplaint: '', location: '', duration: '' },
            presentHistory: latestPrescription.present_history || '',
            pastHistory: latestPrescription.past_history || '',
            drugHistory: latestPrescription.drug_history || '',
            localExamination: latestPrescription.local_examination || '',
            investigation: latestPrescription.investigations || [],
            investigationReference: latestPrescription.investigation_reference || '',
            generalAdvise: latestPrescription.general_advise || '',
            medicalAdvise: Array.isArray(latestPrescription.medical_advise) ? latestPrescription.medical_advise : 
                            latestPrescription.medical_advise ? [latestPrescription.medical_advise] : []
          });
          console.log('✅ Loaded latest prescription data for patient:', patient.patient_id);
        }
        
      } catch (error) {
        console.error('Failed to load data:', error);
        toast.error('Failed to load prescription data');
      } finally {
        setIsLoading(false);
      }
    };
    
    loadData();
  }, [patient.patient_id]);

  // Function to add custom investigation
  const handleAddCustomInvestigation = async () => {
    if (!newCustomInvestigation.trim()) {
      toast.error('Please enter an investigation name');
      return;
    }

    try {
      const investigationName = newCustomInvestigation.trim();
      
      // Check if already exists
      const existingInvestigation = customInvestigations.find(inv => 
        inv.name.toLowerCase() === investigationName.toLowerCase()
      );
      
      if (existingInvestigation) {
        // Add to prescription if not already there
        if (!prescriptionData.investigation.includes(existingInvestigation.name)) {
          setPrescriptionData(prev => ({
            ...prev,
            investigation: [...prev.investigation, existingInvestigation.name]
          }));
        }
        setNewCustomInvestigation('');
        setShowCustomInput(false);
        toast.success('Investigation added to prescription!');
        return;
      }

      const newInvestigation = {
        id: `custom_${Date.now()}`,
        name: investigationName,
        description: '',
        category: 'Custom Investigation',
        created_at: new Date().toISOString()
      };
      
      // Add to local state
      const updatedInvestigations = [...customInvestigations, newInvestigation];
      setCustomInvestigations(updatedInvestigations);
      
      // Save to localStorage
      localStorage.setItem('custom_investigations', JSON.stringify(updatedInvestigations));
      
      // Add to prescription
      if (!prescriptionData.investigation.includes(newInvestigation.name)) {
        setPrescriptionData(prev => ({
          ...prev,
          investigation: [...prev.investigation, newInvestigation.name]
        }));
      }
      
      // Clear input and hide
      setNewCustomInvestigation('');
      setShowCustomInput(false);
      
      toast.success('Custom investigation added and saved!');
    } catch (error) {
      console.error('Failed to add custom investigation:', error);
      toast.error('Failed to add custom investigation');
    }
  };

  // Function to add custom pain complaint
  const handleAddPainComplaint = async () => {
    if (!newPainComplaint.trim()) {
      toast.error('Please enter a pain complaint');
      return;
    }

    try {
      const complaint = await HospitalService.addPainComplaint(newPainComplaint.trim());
      
      // Add to local state
      setPainComplaints(prev => [...prev, complaint]);
      
      // Set in prescription data
      setPrescriptionData(prev => ({
        ...prev,
        chiefComplaints: { ...prev.chiefComplaints, painComplaint: complaint.name }
      }));
      
      // Clear input and hide
      setNewPainComplaint('');
      setShowPainComplaintInput(false);
      
      toast.success('Pain complaint added and saved!');
    } catch (error) {
      console.error('Failed to add pain complaint:', error);
      toast.error('Failed to add pain complaint');
    }
  };

  // Function to add custom location
  const handleAddLocation = async () => {
    if (!newLocation.trim()) {
      toast.error('Please enter a location');
      return;
    }

    try {
      const location = await HospitalService.addLocation(newLocation.trim());
      
      // Add to local state
      setLocations(prev => [...prev, location]);
      
      // Set in prescription data
      setPrescriptionData(prev => ({
        ...prev,
        chiefComplaints: { ...prev.chiefComplaints, location: location.name }
      }));
      
      // Clear input and hide
      setNewLocation('');
      setShowLocationInput(false);
      
      toast.success('Location added and saved!');
    } catch (error) {
      console.error('Failed to add location:', error);
      toast.error('Failed to add location');
    }
  };

  // Function to save prescription
  const handleSavePrescription = async () => {
    if (isSaving) return;
    
    try {
      setIsSaving(true);
      
      // Validate that at least one field is filled
      const hasContent = 
        prescriptionData.chiefComplaints.painComplaint ||
        prescriptionData.chiefComplaints.location ||
        prescriptionData.chiefComplaints.duration ||
        prescriptionData.presentHistory ||
        prescriptionData.pastHistory ||
        prescriptionData.drugHistory ||
        prescriptionData.localExamination ||
        prescriptionData.investigation.length > 0 ||
        prescriptionData.investigationReference ||
        prescriptionData.generalAdvise ||
        prescriptionData.medicalAdvise.length > 0;
      
      if (!hasContent) {
        toast.error('Please fill at least one field before saving');
        return;
      }
      
      const doctorInfo = getDoctorInfo();
      const departmentName = getDepartmentName();
      
      const prescriptionPayload = {
        patient_id: patient.patient_id,
        patient_name: `${patient.prefix ? `${patient.prefix} ` : ''}${patient.first_name} ${patient.last_name}`,
        doctor_name: doctorInfo.name,
        department: departmentName,
        chief_complaints: prescriptionData.chiefComplaints,
        present_history: prescriptionData.presentHistory || null,
        past_history: prescriptionData.pastHistory || null,
        drug_history: prescriptionData.drugHistory || null,
        local_examination: prescriptionData.localExamination || null,
        investigations: prescriptionData.investigation,
        investigation_reference: prescriptionData.investigationReference || null,
        general_advise: prescriptionData.generalAdvise || null,
        medical_advise: prescriptionData.medicalAdvise.length > 0 ? prescriptionData.medicalAdvise : null
      };
      
      const savedPrescription = await HospitalService.savePrescription(prescriptionPayload);
      
      // Update the saved prescriptions list
      setSavedPrescriptions(prev => [savedPrescription, ...prev]);
      
      toast.success('Prescription saved successfully!');
      
    } catch (error) {
      console.error('Failed to save prescription:', error);
      toast.error('Failed to save prescription');
    } finally {
      setIsSaving(false);
    }
  };
  
  const handlePrint = () => {
    // Calculate values before generating HTML
    const doctorInfo = getDoctorInfo();
    const departmentName = getDepartmentName();
    const currentDate = getCurrentDate();
    const ageText = patient.age && patient.age.trim() !== '' ? `${patient.age} years` : 'N/A';
    const genderText = patient.gender === 'MALE' ? 'M' : patient.gender === 'FEMALE' ? 'F' : patient.gender;
    const totalPaid = getTotalPaidAmount();
    
    // Check if this is a transaction-specific prescription
    const isTransactionSpecific = (patient as any).currentTransactionAmount !== undefined;
    const transactionType = isTransactionSpecific ? (patient as any).currentTransactionType : '';
    const transactionDate = isTransactionSpecific ? (patient as any).currentTransactionDate : '';
    
    const printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Valant Prescription - Print</title>
          <style>
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            
            body {
              font-family: Arial, sans-serif;
              background: white;
              width: 297mm;
              height: 420mm;
              margin: 0;
              padding: 0;
            }
            
            .prescription-container {
              position: relative;
              width: 297mm;
              height: 420mm;
              background-image: url('/valant-prescription-template.png?t=${Date.now()}');
              background-size: 100% 100%;
              background-position: center;
              background-repeat: no-repeat;
            }

            .doctor-details {
              position: absolute;
              top: 40px;
              right: 60px;
              text-align: left;
              max-width: 500px;
              padding-left: 20px;
            }

            .doctor-name {
              font-family: 'Canva Sans', sans-serif;
              font-weight: bold;
              font-size: 30px;
              text-transform: uppercase;
              line-height: 1.2;
              color: #4E1BB2;
              white-space: nowrap;
              overflow: hidden;
              text-overflow: ellipsis;
            }

            .doctor-degree {
              font-family: 'Canva Sans', sans-serif;
              font-size: 18px;
              font-weight: 500;
              color: #374151;
              margin-top: 8px;
            }

            .doctor-specialty {
              font-family: 'Canva Sans', sans-serif;
              font-size: 18px;
              font-weight: bold;
              color: #4B5563;
              margin-top: 4px;
            }

            .doctor-experience {
              font-family: 'Canva Sans', sans-serif;
              font-size: 18px;
              font-weight: bold;
              color: #4B5563;
              margin-top: 4px;
            }

            .patient-details {
              position: absolute;
              top: 240px;
              left: 48px;
            }

            .patient-row {
              display: flex;
              margin-bottom: 12px;
            }

            .patient-left {
              flex: 1;
              max-width: 350px;
              white-space: nowrap;
            }

            .patient-right {
              flex: 1;
              margin-left: 200px;
              max-width: 250px;
              white-space: nowrap;
            }

            .patient-details .label {
              display: inline-block;
              font-size: 18px;
              font-weight: bold;
              color: #374151;
              margin-right: 8px;
            }

            .patient-details .value {
              font-size: 20px;
              font-weight: normal;
              color: #111827;
              white-space: nowrap;
            }

            .right-details {
              position: absolute;
              top: 240px;
              right: 48px;
              text-align: right;
            }

            .right-details > div {
              margin-bottom: 12px;
            }

            .right-details .label {
              font-size: 18px;
              font-weight: bold;
              color: #374151;
              margin-right: 8px;
            }

            .right-details .value {
              font-size: 20px;
              font-weight: normal;
              color: #111827;
            }

            .vitals-section {
              margin-top: 8px;
              margin-left: 16px;
            }

            .vitals-section > div {
              margin-bottom: 6px;
              font-size: 16px;
              color: #374151;
            }

            .text-area {
              margin-top: 8px;
              margin-left: 16px;
              min-height: 40px;
              font-size: 16px;
              color: #374151;
              line-height: 1.4;
              border-bottom: 1px solid #E5E7EB;
              padding-bottom: 8px;
              white-space: pre-wrap;
            }

            .prescription-content {
              position: absolute;
              top: 420px;
              left: 48px;
              right: 48px;
              bottom: 80px;
              overflow: hidden;
              font-family: Arial, sans-serif;
            }

            .section {
              margin-bottom: 32px;
            }

            .section-title {
              font-size: 24px;
              font-weight: bold;
              color: #374151;
              margin-bottom: 16px;
            }

            .section-content {
              font-size: 18px;
              color: #4B5563;
              line-height: 1.6;
            }

            .section-content .label {
              font-weight: 700;
            }

            .section-content div {
              margin-bottom: 8px;
            }

            @page {
              margin: 0;
              size: A3;
            }

            @media print {
              body {
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
              }
            }
          </style>
        </head>
        <body>
          <div class="prescription-container">
            <div class="doctor-details">
              <div class="doctor-name">${doctorInfo.name}</div>
              ${doctorInfo.degree ? `<div class="doctor-degree">${doctorInfo.degree.replace(/\n/g, '<br>')}</div>` : ''}
              <div class="doctor-specialty">${departmentName}</div>
              ${doctorInfo.specialty && doctorInfo.specialty !== doctorInfo.degree ? `<div class="doctor-specialty">Specialty: ${doctorInfo.specialty}</div>` : ''}
              ${doctorInfo.hospital_experience ? `<div class="doctor-experience">${doctorInfo.hospital_experience}</div>` : ''}
            </div>

            <div class="patient-details">
              <div class="patient-row">
                <div class="patient-left">
                  <span class="label">Name:</span>
                  <span class="value">${patient.prefix ? `${patient.prefix} ` : ''}${patient.first_name} ${patient.last_name}</span>
                </div>
                <div class="patient-right">
                  <span class="label">Age/Sex:</span>
                  <span class="value">${ageText} / ${genderText}</span>
                </div>
              </div>
              <div class="patient-row">
                <div class="patient-left">
                  <span class="label">Patient No:</span>
                  <span class="value">${patient.patient_id}</span>
                </div>
                <div class="patient-right">
                  <span class="label">Department:</span>
                  <span class="value">${departmentName}</span>
                </div>
              </div>
            </div>

            <div class="right-details">
              <div>
                <span class="label">Date:</span>
                <span class="value">${currentDate}</span>
              </div>
              <div>
                <span class="label">Paid Amount:</span>
                <span class="value">₹${totalPaid.toLocaleString()}</span>
              </div>
            </div>

            <!-- Prescription Content Area -->
            <div class="prescription-content">
              ${(prescriptionData.chiefComplaints.painComplaint || prescriptionData.chiefComplaints.location || prescriptionData.chiefComplaints.duration) ? `
                <div class="section">
                  <div class="section-title">Chief Complaints:</div>
                  <div class="section-content">
                    ${prescriptionData.chiefComplaints.painComplaint ? `<div>${prescriptionData.chiefComplaints.painComplaint}</div>` : ''}
                    ${prescriptionData.chiefComplaints.location ? `<div>${prescriptionData.chiefComplaints.location}</div>` : ''}
                    ${prescriptionData.chiefComplaints.duration ? `<div><span class="label">Duration:</span> ${formatDuration(prescriptionData.chiefComplaints.duration)}</div>` : ''}
                  </div>
                </div>
              ` : ''}
              
              ${prescriptionData.presentHistory ? `
                <div class="section">
                  <div class="section-title">2. Present History:</div>
                  <div class="section-content">${prescriptionData.presentHistory}</div>
                </div>
              ` : ''}
              
              ${prescriptionData.pastHistory ? `
                <div class="section">
                  <div class="section-title">3. Past History:</div>
                  <div class="section-content">${prescriptionData.pastHistory}</div>
                </div>
              ` : ''}
              
              ${prescriptionData.drugHistory ? `
                <div class="section">
                  <div class="section-title">4. Drug History:</div>
                  <div class="section-content">${prescriptionData.drugHistory}</div>
                </div>
              ` : ''}
              
              ${prescriptionData.localExamination ? `
                <div class="section">
                  <div class="section-title">5. Local Examination:</div>
                  <div class="section-content">${prescriptionData.localExamination}</div>
                </div>
              ` : ''}
              
              ${(prescriptionData.investigation.length > 0 || prescriptionData.investigationReference) ? `
                <div class="section">
                  <div class="section-title">6. Investigation:</div>
                  <div class="section-content">
                    ${prescriptionData.investigation.map(item => `<div>• ${item}</div>`).join('')}
                    ${prescriptionData.investigationReference ? `<div style="margin-top: 12px;"><strong>Reference:</strong> ${prescriptionData.investigationReference}</div>` : ''}
                  </div>
                </div>
              ` : ''}
              
              ${prescriptionData.generalAdvise ? `
                <div class="section">
                  <div class="section-title">7. General Advise:</div>
                  <div class="section-content">${prescriptionData.generalAdvise}</div>
                </div>
              ` : ''}
              
              ${prescriptionData.medicalAdvise.length > 0 ? `
                <div class="section">
                  <div class="section-title">8. Medical Advise:</div>
                  <div class="section-content">${prescriptionData.medicalAdvise.map(medicine => `<div>• ${medicine}</div>`).join('')}</div>
                </div>
              ` : ''}
              
            </div>
          </div>

          <script>
            window.onload = function() {
              setTimeout(function() {
                window.focus();
                window.print();
              }, 500);
            };
          </script>
        </body>
      </html>
    `;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
    }
  };

  // Fetch department details from database
  useEffect(() => {
    const fetchDepartmentDetails = async () => {
      console.log('🚀 Valant fetchDepartmentDetails called');
      console.log('🏥 Patient assigned_department:', patient.assigned_department);
      
      if (patient.assigned_department) {
        try {
          console.log('🔍 Valant Searching for department:', patient.assigned_department);
          
          // Simple exact match query first
          const { data: departments, error } = await supabase
            .from('departments')
            .select('name, specialty, hospital_experience')
            .eq('name', patient.assigned_department);
          
          console.log('📋 Valant Department query result:', departments);
          console.log('📋 Valant Query error:', error);
          
          if (departments && departments.length > 0) {
            const department = departments[0];
            console.log('✅ Valant Found department data:', department);
            
            const newDetails = {
              specialty: department.specialty || '',
              hospital_experience: department.hospital_experience || ''
            };
            
            console.log('📋 Valant Setting new state:', newDetails);
            console.log('🏥 Department hospital_experience:', department.hospital_experience);
            setDoctorDetails(newDetails);
            
            // Force re-render
            setTimeout(() => {
              console.log('📋 Valant State after update:', doctorDetails);
              console.log('🏥 Hospital experience in state:', doctorDetails.hospital_experience);
            }, 100);
          } else {
            console.log('❌ Valant No exact match, trying partial match');
            
            // Try alternative spelling for ORTHOPEDIC/ORTHOPAEDIC
            let searchTerm = patient.assigned_department;
            if (patient.assigned_department === 'ORTHOPEDIC') {
              searchTerm = 'ORTHOPAEDIC';
            } else if (patient.assigned_department === 'ORTHOPAEDIC') {
              searchTerm = 'ORTHOPEDIC';
            }
            
            console.log('🔍 Valant Trying alternative spelling:', searchTerm);
            
            const { data: altDepts, error: altError } = await supabase
              .from('departments')
              .select('name, specialty, hospital_experience')
              .eq('name', searchTerm);
            
            console.log('📋 Valant Alternative spelling result:', altDepts);
            
            if (altDepts && altDepts.length > 0) {
              const department = altDepts[0];
              setDoctorDetails({
                specialty: department.specialty || '',
                hospital_experience: department.hospital_experience || ''
              });
              console.log('✅ Valant Found with alternative spelling:', department);
            } else {
              // Finally try partial match
              const { data: partialDepts, error: partialError } = await supabase
                .from('departments')
                .select('name, specialty, hospital_experience')
                .ilike('name', `%${patient.assigned_department}%`);
              
              console.log('📋 Valant Partial match result:', partialDepts);
              
              if (partialDepts && partialDepts.length > 0) {
                const department = partialDepts[0];
                setDoctorDetails({
                  specialty: department.specialty || '',
                  hospital_experience: department.hospital_experience || ''
                });
                console.log('✅ Valant Found partial match:', department);
              }
            }
          }
          
        } catch (error) {
          console.error('❌ Valant Database error:', error);
        }
      }
    };
    
    fetchDepartmentDetails();
  }, [patient.assigned_department, doctorDetails.specialty, doctorDetails.hospital_experience]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      {/* Print-specific styles */}
      <style dangerouslySetInnerHTML={{
        __html: `
          @media print {
            @page {
              margin: 0;
              size: A3;
            }
            body * {
              visibility: hidden;
            }
            #prescription-content, #prescription-content * {
              visibility: visible;
            }
            #prescription-content {
              position: absolute;
              left: 0;
              top: 0;
              width: 297mm;
              height: 420mm;
            }
            #prescription-content > div {
              width: 297mm;
              height: 420mm;
            }
          }
        `
      }} />
      
      <div className="bg-white rounded-lg max-w-6xl w-full max-h-[90vh] overflow-auto">
        {/* Print, Type, Save, and Close buttons */}
        <div className="flex justify-end gap-2 p-4 border-b print:hidden">
          <button
            onClick={() => setShowTypingInterface(!showTypingInterface)}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 flex items-center gap-2"
          >
            <span>✏️</span> {showTypingInterface ? 'Hide' : 'Type'} Prescription
          </button>
          <button
            onClick={handleSavePrescription}
            disabled={isSaving}
            className={`px-4 py-2 text-white rounded flex items-center gap-2 ${
              isSaving 
                ? 'bg-purple-400 cursor-not-allowed' 
                : 'bg-purple-600 hover:bg-purple-700'
            }`}
          >
            <span>💾</span> {isSaving ? 'Saving...' : 'Save Prescription'}
          </button>
          <button
            onClick={handlePrint}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center gap-2"
          >
            <span>🖨️</span> Print Prescription
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
          >
            Close
          </button>
        </div>

        {/* Typing Interface */}
        {showTypingInterface && (
          <div className="p-6 border-b bg-gray-50 print:hidden">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-800">Prescription Details</h3>
              
              {/* Saved Prescriptions Dropdown */}
              {savedPrescriptions.length > 0 && (
                <div className="flex items-center gap-2">
                  <label className="text-sm font-medium text-gray-600">Load Previous:</label>
                  <select
                    onChange={(e) => {
                      if (e.target.value) {
                        const selectedPrescription = savedPrescriptions.find(p => p.id === e.target.value);
                        if (selectedPrescription) {
                          setPrescriptionData({
                            chiefComplaints: selectedPrescription.chief_complaints || { painComplaint: '', location: '', duration: '' },
                            presentHistory: selectedPrescription.present_history || '',
                            pastHistory: selectedPrescription.past_history || '',
                            drugHistory: selectedPrescription.drug_history || '',
                            localExamination: selectedPrescription.local_examination || '',
                            investigation: selectedPrescription.investigations || [],
                            investigationReference: selectedPrescription.investigation_reference || '',
                            generalAdvise: selectedPrescription.general_advise || '',
                            medicalAdvise: Array.isArray(selectedPrescription.medical_advise) ? selectedPrescription.medical_advise :
                                      selectedPrescription.medical_advise ? [selectedPrescription.medical_advise] : []
                          });
                          toast.success('Prescription loaded successfully!');
                        }
                      }
                      e.target.value = '';
                    }}
                    className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select previous prescription...</option>
                    {savedPrescriptions.map(prescription => (
                      <option key={prescription.id} value={prescription.id}>
                        {new Date(prescription.created_at).toLocaleDateString()} - {prescription.doctor_name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
            
            {isLoading && (
              <div className="text-center py-4">
                <div className="text-gray-600">Loading prescription data...</div>
              </div>
            )}
            
            {/* Chief Complaints Section */}
            {!isLoading && (
              <>
            <div className="mb-6">
              <h4 className="text-md font-medium mb-3 text-gray-700">1. Chief Complaints</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                
                {/* a. Pain Complaint with dropdown */}
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">a.</label>
                  <div className="space-y-2">
                    <select
                      value={prescriptionData.chiefComplaints.painComplaint}
                      onChange={(e) => setPrescriptionData(prev => ({
                        ...prev,
                        chiefComplaints: { ...prev.chiefComplaints, painComplaint: e.target.value }
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select pain complaint...</option>
                      {painComplaints.map(complaint => (
                        <option key={complaint.id} value={complaint.name}>
                          {complaint.name}
                        </option>
                      ))}
                    </select>
                    
                    {/* Add Custom Pain Complaint */}
                    <div>
                      {!showPainComplaintInput ? (
                        <button
                          onClick={() => setShowPainComplaintInput(true)}
                          className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center gap-1"
                        >
                          <span>+</span> Add Custom
                        </button>
                      ) : (
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={newPainComplaint}
                            onChange={(e) => setNewPainComplaint(e.target.value)}
                            onKeyPress={(e) => {
                              if (e.key === 'Enter') {
                                handleAddPainComplaint();
                              }
                            }}
                            placeholder="Enter new pain complaint..."
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            autoFocus
                          />
                          <button
                            onClick={handleAddPainComplaint}
                            className="px-3 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700"
                          >
                            Add
                          </button>
                          <button
                            onClick={() => {
                              setShowPainComplaintInput(false);
                              setNewPainComplaint('');
                            }}
                            className="px-3 py-2 bg-gray-300 text-gray-700 rounded-md text-sm hover:bg-gray-400"
                          >
                            Cancel
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* b. Location with dropdown */}
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">b.</label>
                  <div className="space-y-2">
                    <select
                      value={prescriptionData.chiefComplaints.location}
                      onChange={(e) => setPrescriptionData(prev => ({
                        ...prev,
                        chiefComplaints: { ...prev.chiefComplaints, location: e.target.value }
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select location...</option>
                      {locations.map(location => (
                        <option key={location.id} value={location.name}>
                          {location.name}
                        </option>
                      ))}
                    </select>
                    
                    {/* Add Custom Location */}
                    <div>
                      {!showLocationInput ? (
                        <button
                          onClick={() => setShowLocationInput(true)}
                          className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center gap-1"
                        >
                          <span>+</span> Add Custom
                        </button>
                      ) : (
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={newLocation}
                            onChange={(e) => setNewLocation(e.target.value)}
                            onKeyPress={(e) => {
                              if (e.key === 'Enter') {
                                handleAddLocation();
                              }
                            }}
                            placeholder="Enter new location..."
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            autoFocus
                          />
                          <button
                            onClick={handleAddLocation}
                            className="px-3 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700"
                          >
                            Add
                          </button>
                          <button
                            onClick={() => {
                              setShowLocationInput(false);
                              setNewLocation('');
                            }}
                            className="px-3 py-2 bg-gray-300 text-gray-700 rounded-md text-sm hover:bg-gray-400"
                          >
                            Cancel
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* c. Duration with dropdowns */}
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">c. Duration</label>
                  <div className="flex gap-2">
                    {/* Number dropdown (1-30) */}
                    <select
                      value={prescriptionData.chiefComplaints.duration.split(' ')[0] || ''}
                      onChange={(e) => {
                        const number = e.target.value;
                        const unit = prescriptionData.chiefComplaints.duration.split(' ')[1] || 'D';
                        const newDuration = number && unit ? `${number} ${unit}` : '';
                        setPrescriptionData(prev => ({
                          ...prev,
                          chiefComplaints: { ...prev.chiefComplaints, duration: newDuration }
                        }));
                      }}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Number</option>
                      {Array.from({ length: 30 }, (_, i) => i + 1).map(num => (
                        <option key={num} value={num}>
                          {num}
                        </option>
                      ))}
                    </select>
                    
                    {/* Unit dropdown (D,W,M,Y) */}
                    <select
                      value={prescriptionData.chiefComplaints.duration.split(' ')[1] || ''}
                      onChange={(e) => {
                        const number = prescriptionData.chiefComplaints.duration.split(' ')[0] || '';
                        const unit = e.target.value;
                        const newDuration = number && unit ? `${number} ${unit}` : '';
                        setPrescriptionData(prev => ({
                          ...prev,
                          chiefComplaints: { ...prev.chiefComplaints, duration: newDuration }
                        }));
                      }}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Unit</option>
                      <option value="D">Days</option>
                      <option value="W">Weeks</option>
                      <option value="M">Months</option>
                      <option value="Y">Years</option>
                    </select>
                  </div>
                  
                  {/* Display selected duration */}
                  {prescriptionData.chiefComplaints.duration && (
                    <div className="mt-2 text-sm text-gray-600">
                      Selected: {prescriptionData.chiefComplaints.duration}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* 2. Present History */}
            <div className="mb-6">
              <label className="block text-md font-medium text-gray-700 mb-2">2. Present History</label>
              <textarea
                value={prescriptionData.presentHistory}
                onChange={(e) => setPrescriptionData(prev => ({ ...prev, presentHistory: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={4}
                placeholder="Describe the present history..."
              />
            </div>

            {/* 3. Past History */}
            <div className="mb-6">
              <label className="block text-md font-medium text-gray-700 mb-2">3. Past History</label>
              <textarea
                value={prescriptionData.pastHistory}
                onChange={(e) => setPrescriptionData(prev => ({ ...prev, pastHistory: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={4}
                placeholder="Describe the past history..."
              />
            </div>

            {/* 4. Drug History */}
            <div className="mb-6">
              <label className="block text-md font-medium text-gray-700 mb-2">4. Drug History</label>
              <textarea
                value={prescriptionData.drugHistory}
                onChange={(e) => setPrescriptionData(prev => ({ ...prev, drugHistory: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={4}
                placeholder="Describe the drug history..."
              />
            </div>

            {/* 5. Local Examination */}
            <div className="mb-6">
              <label className="block text-md font-medium text-gray-700 mb-2">5. Local Examination</label>
              <textarea
                value={prescriptionData.localExamination}
                onChange={(e) => setPrescriptionData(prev => ({ ...prev, localExamination: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={4}
                placeholder="Describe the local examination..."
              />
            </div>

            {/* 6. Investigation */}
            <div className="mb-6">
              <label className="block text-md font-medium text-gray-700 mb-2">6. Investigation</label>
              <div className="space-y-4">
                <select
                  onChange={(e) => {
                    const selectedService = e.target.value;
                    if (selectedService && !prescriptionData.investigation.includes(selectedService)) {
                      setPrescriptionData(prev => ({
                        ...prev,
                        investigation: [...prev.investigation, selectedService]
                      }));
                    }
                    e.target.value = '';
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select Investigation/Service...</option>
                  
                  {/* Medical Services */}
                  <optgroup label="Medical Services">
                    {MEDICAL_SERVICES
                      .filter(service => service.isActive)
                      .map(service => (
                        <option key={service.id} value={service.name}>
                          {service.name} - {service.category} (₹{service.basePrice})
                        </option>
                      ))
                    }
                  </optgroup>
                  
                  {/* Custom Investigations */}
                  {customInvestigations.length > 0 && (
                    <optgroup label="Custom Investigations">
                      {customInvestigations.map(investigation => (
                        <option key={investigation.id} value={investigation.name}>
                          {investigation.name} - {investigation.category}
                        </option>
                      ))}
                    </optgroup>
                  )}
                </select>
                
                {/* Add Custom Investigation Button */}
                <div className="mt-2">
                  {!showCustomInput ? (
                    <button
                      onClick={() => setShowCustomInput(true)}
                      className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center gap-1"
                    >
                      <span>+</span> Add Custom Investigation
                    </button>
                  ) : (
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newCustomInvestigation}
                        onChange={(e) => setNewCustomInvestigation(e.target.value)}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            handleAddCustomInvestigation();
                          }
                        }}
                        placeholder="Enter custom investigation name..."
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        autoFocus
                      />
                      <button
                        onClick={handleAddCustomInvestigation}
                        className="px-3 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700"
                      >
                        Add
                      </button>
                      <button
                        onClick={() => {
                          setShowCustomInput(false);
                          setNewCustomInvestigation('');
                        }}
                        className="px-3 py-2 bg-gray-300 text-gray-700 rounded-md text-sm hover:bg-gray-400"
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                </div>
                
                {/* Selected Investigations */}
                {prescriptionData.investigation.length > 0 && (
                  <div className="mt-2">
                    <div className="flex flex-wrap gap-2">
                      {prescriptionData.investigation.map((item, index) => (
                        <div key={index} className="flex items-center gap-1 bg-blue-100 text-blue-800 px-2 py-1 rounded-md text-sm">
                          <span>{item}</span>
                          <button
                            onClick={() => {
                              setPrescriptionData(prev => ({
                                ...prev,
                                investigation: prev.investigation.filter((_, i) => i !== index)
                              }));
                            }}
                            className="text-blue-600 hover:text-blue-800 font-bold"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Investigation Reference */}
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-600 mb-1">Reference Notes</label>
                  <textarea
                    value={prescriptionData.investigationReference}
                    onChange={(e) => setPrescriptionData(prev => ({ ...prev, investigationReference: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={3}
                    placeholder="Reference notes for investigations..."
                  />
                </div>
              </div>
            </div>

            {/* 7. General Advise */}
            <div className="mb-6">
              <label className="block text-md font-medium text-gray-700 mb-2">7. General Advise</label>
              <textarea
                value={prescriptionData.generalAdvise}
                onChange={(e) => setPrescriptionData(prev => ({ ...prev, generalAdvise: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={4}
                placeholder="General advice for the patient..."
              />
            </div>

            {/* 8. Medical Advise */}
            <div className="mb-6">
              <MedicineDropdown
                selectedMedicines={prescriptionData.medicalAdvise}
                onChange={(medicines) => setPrescriptionData(prev => ({ ...prev, medicalAdvise: medicines }))}
                placeholder="Select Medicine..."
                label="8. Medical Advise"
              />
            </div>


            {/* Save and Clear Buttons */}
            <div className="flex justify-between items-center">
              <button
                onClick={handleSavePrescription}
                disabled={isSaving}
                className={`px-6 py-2 text-white rounded flex items-center gap-2 ${
                  isSaving 
                    ? 'bg-purple-400 cursor-not-allowed' 
                    : 'bg-purple-600 hover:bg-purple-700'
                }`}
              >
                <span>💾</span> {isSaving ? 'Saving...' : 'Save Prescription'}
              </button>
              
              <button
                onClick={() => setPrescriptionData({
                  chiefComplaints: { painComplaint: '', location: '', duration: '' },
                  presentHistory: '',
                  pastHistory: '',
                  drugHistory: '',
                  localExamination: '',
                  investigation: [],
                  investigationReference: '',
                  generalAdvise: '',
                  medicalAdvise: []
                })}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 text-sm"
              >
                Clear All
              </button>
            </div>
              </>
            )}
          </div>
        )}

        {/* Prescription Content */}
        <div 
          id="prescription-content" 
          className="relative w-full h-[842px] bg-cover bg-center bg-no-repeat print:w-[297mm] print:h-[420mm]"
          style={{ 
            backgroundImage: `url(/valant-prescription-template.png?t=${Date.now()})`,
            backgroundSize: '100% 100%',
            backgroundPosition: 'center'
          }}
        >
          {/* Doctor Details - Top Right */}
          <div className="absolute top-10 right-16 text-left max-w-md" style={{ paddingLeft: '1rem' }}>
            {/* Doctor Name */}
            <div className="font-bold text-3xl uppercase leading-tight break-words" style={{ fontFamily: 'Canva Sans, sans-serif', color: '#4E1BB2' }}>
              {getDoctorInfo().name}
            </div>
            
            {/* Doctor Degree - Just below name */}
            {getDoctorInfo().degree && (
              <div className="text-lg mt-2 font-medium text-gray-700" style={{ fontFamily: 'Canva Sans, sans-serif', whiteSpace: 'pre-line' }}>
                {getDoctorInfo().degree}
              </div>
            )}
            
            {/* Department - Below degree */}
            <div className="text-lg mt-1 font-bold text-gray-600" style={{ fontFamily: 'Canva Sans, sans-serif' }}>
              {getDepartmentName()}
            </div>
            
            {/* Specialty - Below department (only show if different from degree) */}
            {getDoctorInfo().specialty && getDoctorInfo().specialty !== getDoctorInfo().degree && (
              <div className="text-lg mt-1 font-bold text-gray-600" style={{ fontFamily: 'Canva Sans, sans-serif' }}>
                Specialty: {getDoctorInfo().specialty}
              </div>
            )}
            
            {/* Hospital Experience - Below specialty */}
            {getDoctorInfo().hospital_experience && (
              <div className="text-lg mt-1 font-bold text-gray-600" style={{ fontFamily: 'Canva Sans, sans-serif' }}>
                {getDoctorInfo().hospital_experience}
              </div>
            )}
          </div>

          {/* Prescription Content Area */}
          <div className="absolute top-[26rem] left-12 right-12 bottom-20 overflow-hidden">
            {/* Chief Complaints */}
            {(prescriptionData.chiefComplaints.painComplaint || prescriptionData.chiefComplaints.location || prescriptionData.chiefComplaints.duration) && (
              <div className="mb-8">
                <div className="text-2xl font-bold text-gray-800 mb-4">Chief Complaints:</div>
                <div className="text-lg text-gray-700 space-y-3">
                  {prescriptionData.chiefComplaints.painComplaint && (
                    <div>{prescriptionData.chiefComplaints.painComplaint}</div>
                  )}
                  {prescriptionData.chiefComplaints.location && (
                    <div>{prescriptionData.chiefComplaints.location}</div>
                  )}
                  {prescriptionData.chiefComplaints.duration && (
                    <div><span className="font-bold">Duration:</span> {formatDuration(prescriptionData.chiefComplaints.duration)}</div>
                  )}
                </div>
              </div>
            )}

            {/* 2. Present History */}
            {prescriptionData.presentHistory && (
              <div className="mb-8">
                <div className="text-2xl font-bold text-gray-800 mb-4">2. Present History:</div>
                <div className="text-lg text-gray-700 leading-relaxed">{prescriptionData.presentHistory}</div>
              </div>
            )}

            {/* 3. Past History */}
            {prescriptionData.pastHistory && (
              <div className="mb-8">
                <div className="text-2xl font-bold text-gray-800 mb-4">3. Past History:</div>
                <div className="text-lg text-gray-700 leading-relaxed">{prescriptionData.pastHistory}</div>
              </div>
            )}

            {/* 4. Drug History */}
            {prescriptionData.drugHistory && (
              <div className="mb-8">
                <div className="text-2xl font-bold text-gray-800 mb-4">4. Drug History:</div>
                <div className="text-lg text-gray-700 leading-relaxed">{prescriptionData.drugHistory}</div>
              </div>
            )}

            {/* 5. Local Examination */}
            {prescriptionData.localExamination && (
              <div className="mb-8">
                <div className="text-2xl font-bold text-gray-800 mb-4">5. Local Examination:</div>
                <div className="text-lg text-gray-700 leading-relaxed">{prescriptionData.localExamination}</div>
              </div>
            )}

            {/* 6. Investigation */}
            {(prescriptionData.investigation.length > 0 || prescriptionData.investigationReference) && (
              <div className="mb-8">
                <div className="text-2xl font-bold text-gray-800 mb-4">6. Investigation:</div>
                <div className="text-lg text-gray-700">
                  {prescriptionData.investigation.map((item, index) => (
                    <div key={index} className="mb-2">• {item}</div>
                  ))}
                  {prescriptionData.investigationReference && (
                    <div className="mt-4">
                      <span className="font-bold">Reference:</span> {prescriptionData.investigationReference}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 7. General Advise */}
            {prescriptionData.generalAdvise && (
              <div className="mb-8">
                <div className="text-2xl font-bold text-gray-800 mb-4">7. General Advise:</div>
                <div className="text-lg text-gray-700 leading-relaxed">{prescriptionData.generalAdvise}</div>
              </div>
            )}

            {/* 8. Medical Advise */}
            {prescriptionData.medicalAdvise.length > 0 && (
              <div className="mb-8">
                <div className="text-2xl font-bold text-gray-800 mb-4">8. Medical Advise:</div>
                <div className="text-lg text-gray-700 leading-relaxed">
                  {prescriptionData.medicalAdvise.map((medicine, index) => (
                    <div key={index} className="mb-2">• {medicine}</div>
                  ))}
                </div>
              </div>
            )}

          </div>

          {/* Patient Details */}
          <div className="absolute top-72 left-12">
            {/* Row 1: Name and Age/Sex */}
            <div className="flex mb-3">
              <div className="flex items-center whitespace-nowrap">
                <span className="text-lg font-bold text-gray-700">Name:</span>
                <span className="text-xl font-normal text-gray-900 ml-2">
                  {patient.prefix ? `${patient.prefix} ` : ''}{patient.first_name} {patient.last_name}
                </span>
              </div>
              <div className="flex items-center whitespace-nowrap ml-52">
                <span className="text-lg font-bold text-gray-700">Age/Sex:</span>
                <span className="text-xl font-normal text-gray-900 ml-2">
                  {patient.age && patient.age.trim() !== '' ? `${patient.age} years` : 'N/A'} / {patient.gender === 'MALE' ? 'M' : patient.gender === 'FEMALE' ? 'F' : patient.gender}
                </span>
              </div>
            </div>

            {/* Row 2: Patient No and Department */}
            <div className="flex">
              <div className="flex items-center whitespace-nowrap">
                <span className="text-lg font-bold text-gray-700">Patient No:</span>
                <span className="text-xl font-normal text-gray-900 ml-2">{patient.patient_id}</span>
              </div>
              <div className="flex items-center whitespace-nowrap ml-52">
                <span className="text-lg font-bold text-gray-700">Department:</span>
                <span className="text-xl font-normal text-gray-900 ml-2">{getDepartmentName()}</span>
              </div>
            </div>
          </div>

          {/* Date and Paid Amount - Right Side */}
          <div className="absolute top-72 right-0 mr-12 space-y-3 text-right">
            {/* Date */}
            <div className="flex items-center justify-end">
              <span className="text-lg font-bold text-gray-700 mr-2">Date:</span>
              <span className="text-xl font-normal text-gray-900">{getCurrentDate()}</span>
            </div>

            {/* Paid Amount */}
            <div className="flex items-center justify-end">
              <span className="text-lg font-bold text-gray-700 mr-2">Paid Amount:</span>
              <span className="text-xl font-normal text-green-600 font-semibold">
                ₹{getTotalPaidAmount().toLocaleString()}
              </span>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default ValantPrescription;
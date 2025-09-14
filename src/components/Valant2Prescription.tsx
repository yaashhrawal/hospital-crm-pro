import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import type { PatientWithRelations } from '../config/supabaseNew';
import { getDoctorWithDegree } from '../data/doctorDegrees';
import { supabase } from '../config/supabaseNew';
import * as CompletePatientRecordService from '../services/completePatientRecordService';
import MedicineDropdown from './MedicineDropdown';

interface Valant2PrescriptionProps {
  patient: PatientWithRelations;
  onClose: () => void;
}

const Valant2Prescription: React.FC<Valant2PrescriptionProps> = ({ patient, onClose }) => {
  const [doctorDetails, setDoctorDetails] = useState<{specialty?: string, hospital_experience?: string}>({});
  
  // Text box states for prescription content
  const [prescriptionText, setPrescriptionText] = useState<string[]>([]);
  const [chiefComplaints, setChiefComplaints] = useState('');
  const [diagnosis, setDiagnosis] = useState('');
  const [advice, setAdvice] = useState('');
  
  const getCurrentDate = () => {
    return new Date().toLocaleDateString('en-IN');
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
  
  const handlePrint = () => {
    // Calculate values before generating HTML
    const doctorInfo = getDoctorInfo();
    const departmentName = getDepartmentName();
    const currentDate = getCurrentDate();
    const ageText = patient.age && patient.age.trim() !== '' ? `${patient.age} years` : 'N/A';
    const genderText = patient.gender === 'MALE' ? 'M' : patient.gender === 'FEMALE' ? 'F' : patient.gender;
    
    const printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Valant 2 Prescription - Print</title>
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
              right: 48px;
              text-align: left;
              max-width: 288px;
            }

            .doctor-name {
              font-family: 'Canva Sans', sans-serif;
              font-weight: bold;
              font-size: 30px;
              text-transform: uppercase;
              line-height: 1.2;
              color: #4E1BB2;
              word-wrap: break-word;
              overflow-wrap: break-word;
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
              top: 288px;
              left: 48px;
            }

            .patient-details > div {
              margin-bottom: 12px;
            }

            .patient-details .label {
              display: inline-block;
              width: 128px;
              font-size: 18px;
              font-weight: bold;
              color: #374151;
            }

            .patient-details .value {
              font-size: 20px;
              font-weight: normal;
              color: #111827;
            }

            .right-details {
              position: absolute;
              top: 288px;
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

            .prescription-content {
              position: absolute;
              top: 420px;
              left: 48px;
              right: 48px;
              max-width: calc(100% - 96px);
            }

            .prescription-section {
              margin-bottom: 20px;
            }

            .prescription-section h3 {
              font-size: 16px;
              font-weight: bold;
              color: #374151;
              margin-bottom: 8px;
              text-transform: uppercase;
            }

            .prescription-section .content {
              font-size: 14px;
              line-height: 1.4;
              color: #111827;
              white-space: pre-wrap;
              min-height: 40px;
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
              ${doctorInfo.degree ? `<div class="doctor-degree">${doctorInfo.degree}</div>` : ''}
              ${doctorInfo.specialty && doctorInfo.specialty !== doctorInfo.degree ? `<div class="doctor-specialty">${doctorInfo.specialty}</div>` : ''}
              ${doctorInfo.hospital_experience ? `<div class="doctor-experience">${doctorInfo.hospital_experience}</div>` : ''}
            </div>

            <div class="patient-details">
              <div>
                <span class="label">Name:</span>
                <span class="value">${patient.prefix ? `${patient.prefix} ` : ''}${patient.first_name} ${patient.last_name}</span>
              </div>
              <div>
                <span class="label">Patient No:</span>
                <span class="value">${patient.patient_id}</span>
              </div>
              <div>
                <span class="label">Department:</span>
                <span class="value">${departmentName}</span>
              </div>
            </div>

            <div class="right-details">
              <div>
                <span class="label">Date:</span>
                <span class="value">${currentDate}</span>
              </div>
              <div>
                <span class="label">Age/Sex:</span>
                <span class="value">${ageText} / ${genderText}</span>
              </div>
            </div>

            <div class="prescription-content">
              ${chiefComplaints ? `
                <div class="prescription-section">
                  <h3>Chief Complaints:</h3>
                  <div class="content">${chiefComplaints}</div>
                </div>
              ` : ''}
              
              ${diagnosis ? `
                <div class="prescription-section">
                  <h3>Diagnosis:</h3>
                  <div class="content">${diagnosis}</div>
                </div>
              ` : ''}
              
              ${prescriptionText.length > 0 ? `
                <div class="prescription-section">
                  <h3>Prescription:</h3>
                  <div class="content">${prescriptionText.map(medicine => `<div>• ${medicine}</div>`).join('')}</div>
                </div>
              ` : ''}
              
              ${advice ? `
                <div class="prescription-section">
                  <h3>Advice:</h3>
                  <div class="content">${advice}</div>
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
      console.log('🚀 Valant2 fetchDepartmentDetails called');
      console.log('🏥 Patient assigned_department:', patient.assigned_department);
      
      if (patient.assigned_department) {
        try {
          console.log('🔍 Valant2 Searching for department:', patient.assigned_department);
          
          // Simple exact match query first
          const { data: departments, error } = await supabase
            .from('departments')
            .select('name, specialty, hospital_experience')
            .eq('name', patient.assigned_department);
          
          console.log('📋 Valant2 Department query result:', departments);
          console.log('📋 Valant2 Query error:', error);
          
          if (departments && departments.length > 0) {
            const department = departments[0];
            console.log('✅ Valant2 Found department data:', department);
            
            const newDetails = {
              specialty: department.specialty || '',
              hospital_experience: department.hospital_experience || ''
            };
            
            console.log('📋 Valant2 Setting new state:', newDetails);
            console.log('🏥 Department hospital_experience:', department.hospital_experience);
            setDoctorDetails(newDetails);
            
            // Force re-render
            setTimeout(() => {
              console.log('📋 Valant2 State after update:', doctorDetails);
              console.log('🏥 Hospital experience in state:', doctorDetails.hospital_experience);
            }, 100);
          } else {
            console.log('❌ Valant2 No exact match, trying partial match');
            
            // Try alternative spelling for ORTHOPEDIC/ORTHOPAEDIC
            let searchTerm = patient.assigned_department;
            if (patient.assigned_department === 'ORTHOPEDIC') {
              searchTerm = 'ORTHOPAEDIC';
            } else if (patient.assigned_department === 'ORTHOPAEDIC') {
              searchTerm = 'ORTHOPEDIC';
            }
            
            console.log('🔍 Valant2 Trying alternative spelling:', searchTerm);
            
            const { data: altDepts, error: altError } = await supabase
              .from('departments')
              .select('name, specialty, hospital_experience')
              .eq('name', searchTerm);
            
            console.log('📋 Valant2 Alternative spelling result:', altDepts);
            
            if (altDepts && altDepts.length > 0) {
              const department = altDepts[0];
              setDoctorDetails({
                specialty: department.specialty || '',
                hospital_experience: department.hospital_experience || ''
              });
              console.log('✅ Valant2 Found with alternative spelling:', department);
            } else {
              // Finally try partial match
              const { data: partialDepts, error: partialError } = await supabase
                .from('departments')
                .select('name, specialty, hospital_experience')
                .ilike('name', `%${patient.assigned_department}%`);
              
              console.log('📋 Valant2 Partial match result:', partialDepts);
              
              if (partialDepts && partialDepts.length > 0) {
                const department = partialDepts[0];
                setDoctorDetails({
                  specialty: department.specialty || '',
                  hospital_experience: department.hospital_experience || ''
                });
                console.log('✅ Valant2 Found partial match:', department);
              }
            }
          }
          
        } catch (error) {
          console.error('❌ Valant2 Database error:', error);
        }
      }
    };
    
    fetchDepartmentDetails();
  }, [patient.assigned_department, doctorDetails.specialty, doctorDetails.hospital_experience]);

  // Load Complete Patient Record data if available
  useEffect(() => {
    const loadPatientRecordData = async () => {
      try {
        // Load data from Complete Patient Record database
        const savedPatientRecord = await CompletePatientRecordService.getCompletePatientRecord(patient.patient_id);
        
        if (savedPatientRecord) {
          console.log('✅ Valant2 Found Complete Patient Record data in database:', savedPatientRecord);
          
          // Map Complete Patient Record data to Valant2 prescription format
          let mappedChiefComplaints = '';
          let mappedDiagnosis = '';
          let mappedAdvice = '';
          let mappedPrescriptionText: string[] = [];
          
          // Map Chief Complaints from database patient record
          if (savedPatientRecord.chiefComplaints && savedPatientRecord.chiefComplaints.length > 0) {
            mappedChiefComplaints = savedPatientRecord.chiefComplaints.map((complaint: any) => 
              `${complaint.complaint} (${complaint.period}): ${complaint.duration || complaint.presentHistory || complaint.notes || 'No additional details'}`
            ).join('\n\n');
          }
          
          // Add High Risk data to chief complaints if available
          if (savedPatientRecord.highRisk) {
            const highRiskInfo = [];
            if (savedPatientRecord.highRisk.risk_factors?.length > 0) {
              highRiskInfo.push(`High Risk Factors: ${savedPatientRecord.highRisk.risk_factors.join(', ')}`);
            }
            if (savedPatientRecord.highRisk.allergy_drug || savedPatientRecord.highRisk.allergy_food) {
              const allergies = [savedPatientRecord.highRisk.allergy_drug, savedPatientRecord.highRisk.allergy_food].filter(Boolean);
              highRiskInfo.push(`Allergies: ${allergies.join(', ')}`);
            }
            if (savedPatientRecord.highRisk.current_medications) {
              highRiskInfo.push(`Current Medications: ${savedPatientRecord.highRisk.current_medications}`);
            }
            if (savedPatientRecord.highRisk.surgical_history) {
              highRiskInfo.push(`Surgical History: ${savedPatientRecord.highRisk.surgical_history}`);
            }
            if (savedPatientRecord.highRisk.family_history) {
              highRiskInfo.push(`Family History: ${savedPatientRecord.highRisk.family_history}`);
            }
            
            if (highRiskInfo.length > 0) {
              mappedChiefComplaints = mappedChiefComplaints + 
                (mappedChiefComplaints ? '\n\n' : '') + 
                highRiskInfo.join('\n');
            }
          }
          
          // Map Diagnosis from database patient record
          if (savedPatientRecord.diagnosis) {
            mappedDiagnosis = `${savedPatientRecord.diagnosis.primary_diagnosis}${savedPatientRecord.diagnosis.secondary_diagnosis ? '\n' + savedPatientRecord.diagnosis.secondary_diagnosis : ''} - ${savedPatientRecord.diagnosis.notes || 'Standard treatment'}`;
          }
          
          // Map Examinations and Investigations to advice - comprehensive mapping
          let examinationText = '';
          if (savedPatientRecord.examination) {
            const examDetails = [];
            if (savedPatientRecord.examination.general_appearance) examDetails.push(`General Appearance: ${savedPatientRecord.examination.general_appearance}`);
            if (savedPatientRecord.examination.vital_signs) examDetails.push(`Vital Signs: ${savedPatientRecord.examination.vital_signs}`);
            if (savedPatientRecord.examination.systemic_examination) examDetails.push(`Systemic Exam: ${savedPatientRecord.examination.systemic_examination}`);
            if (savedPatientRecord.examination.local_examination) examDetails.push(`Local Exam: ${savedPatientRecord.examination.local_examination}`);
            if (savedPatientRecord.examination.cardiovascular_examination) examDetails.push(`CVS: ${savedPatientRecord.examination.cardiovascular_examination}`);
            if (savedPatientRecord.examination.respiratory_examination) examDetails.push(`RS: ${savedPatientRecord.examination.respiratory_examination}`);
            if (savedPatientRecord.examination.abdominal_examination) examDetails.push(`Abdomen: ${savedPatientRecord.examination.abdominal_examination}`);
            
            if (examDetails.length > 0) {
              examinationText = 'Examination Findings:\n- ' + examDetails.join('\n- ');
            }
          }
          
          let investigationText = '';
          if (savedPatientRecord.investigation) {
            const investigations = [];
            if (savedPatientRecord.investigation.laboratory_tests) investigations.push(`Lab Tests: ${savedPatientRecord.investigation.laboratory_tests}`);
            if (savedPatientRecord.investigation.imaging_studies) investigations.push(`Imaging: ${savedPatientRecord.investigation.imaging_studies}`);
            if (savedPatientRecord.investigation.special_tests) investigations.push(`Special Tests: ${savedPatientRecord.investigation.special_tests}`);
            if (savedPatientRecord.investigation.results) investigations.push(`Results: ${savedPatientRecord.investigation.results}`);
            if (savedPatientRecord.investigation.interpretation) investigations.push(`Interpretation: ${savedPatientRecord.investigation.interpretation}`);
            
            if (investigations.length > 0) {
              investigationText = 'Investigations:\n- ' + investigations.join('\n- ');
            }
          }
          
          mappedAdvice = [examinationText, investigationText].filter(Boolean).join('\n\n');
          
          // Map Prescriptions to prescription text
          if (savedPatientRecord.prescription?.medications && savedPatientRecord.prescription.medications.length > 0) {
            mappedPrescriptionText = savedPatientRecord.prescription.medications.map((med: any) => 
              `${med.medicineName} ${med.dosage} - ${med.frequency} for ${med.duration} (${med.whenTaken})${med.specialInstructions ? '\n  Note: ' + med.specialInstructions : ''}`
            );
          }
          
          // Update state with mapped data
          setChiefComplaints(mappedChiefComplaints);
          setDiagnosis(mappedDiagnosis);
          setAdvice(mappedAdvice);
          setPrescriptionText(mappedPrescriptionText);
          
          toast.success('✅ Valant2: Loaded data from Complete Patient Record database!');
          console.log('✅ Valant2: Successfully mapped Complete Patient Record database to prescription format');
        } else {
          console.log('ℹ️ Valant2: No Complete Patient Record found for patient:', patient.patient_id);
        }
        
      } catch (error) {
        console.error('❌ Valant2: Error loading Complete Patient Record:', error);
        toast.error('Valant2: Error loading Complete Patient Record data');
      }
    };
    
    loadPatientRecordData();
  }, [patient.patient_id]);

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
      
      <div className="bg-white rounded-lg max-w-7xl w-full max-h-[90vh] overflow-auto flex">
        {/* Left Side - Text Boxes */}
        <div className="w-1/2 p-6 border-r">
          <h2 className="text-xl font-bold mb-4">📝 Prescription Editor</h2>
          
          {/* Chief Complaints */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Chief Complaints:
            </label>
            <textarea
              value={chiefComplaints}
              onChange={(e) => setChiefComplaints(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              rows={3}
              placeholder="Enter patient's chief complaints..."
            />
          </div>

          {/* Diagnosis */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Diagnosis:
            </label>
            <textarea
              value={diagnosis}
              onChange={(e) => setDiagnosis(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              rows={3}
              placeholder="Enter diagnosis..."
            />
          </div>

          {/* Prescription */}
          <div className="mb-4">
            <MedicineDropdown
              selectedMedicines={prescriptionText}
              onChange={(medicines) => setPrescriptionText(medicines)}
              placeholder="Select Medicine..."
              label="Prescription/Medications"
            />
          </div>

          {/* Advice */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Advice:
            </label>
            <textarea
              value={advice}
              onChange={(e) => setAdvice(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              rows={3}
              placeholder="Enter medical advice..."
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 mt-6">
            <button
              onClick={handlePrint}
              className="px-6 py-3 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center gap-2"
            >
              <span>🖨️</span> Print Prescription
            </button>
            <button
              onClick={onClose}
              className="px-6 py-3 bg-gray-500 text-white rounded hover:bg-gray-600"
            >
              Close
            </button>
          </div>
        </div>

        {/* Right Side - Preview */}
        <div className="w-1/2 p-6">
          <h2 className="text-xl font-bold mb-4">👁️ Preview</h2>
          
          {/* Prescription Preview */}
          <div 
            id="prescription-content" 
            className="relative w-full h-[700px] bg-cover bg-center bg-no-repeat border-2 border-gray-300 print:w-[297mm] print:h-[420mm] print:border-0"
            style={{ 
              backgroundImage: `url(/valant-prescription-template.png?t=${Date.now()})`,
              backgroundSize: '100% 100%',
              backgroundPosition: 'center'
            }}
          >
            {/* Doctor Details - Top Right */}
            <div className="absolute top-6 right-8 text-left max-w-[200px]">
              {/* Doctor Name */}
              <div className="font-bold text-2xl uppercase leading-tight break-words" style={{ fontFamily: 'Canva Sans, sans-serif', color: '#4E1BB2' }}>
                {getDoctorInfo().name}
              </div>
              
              {/* Doctor Degree - Just below name */}
              {getDoctorInfo().degree && (
                <div className="text-sm mt-1 font-medium text-gray-700" style={{ fontFamily: 'Canva Sans, sans-serif', whiteSpace: 'pre-line' }}>
                  {getDoctorInfo().degree}
                </div>
              )}
              
              {/* Specialty - Below department */}
              {getDoctorInfo().specialty && (
                <div className="text-sm mt-1 font-bold text-gray-600" style={{ fontFamily: 'Canva Sans, sans-serif' }}>
                  {getDoctorInfo().specialty}
                </div>
              )}
              
              {/* Hospital Experience - Below specialty */}
              {getDoctorInfo().hospital_experience && (
                <div className="text-sm mt-1 font-bold text-gray-600" style={{ fontFamily: 'Canva Sans, sans-serif' }}>
                  {getDoctorInfo().hospital_experience}
                </div>
              )}
            </div>

            {/* Patient Details - Left Side */}
            <div className="absolute top-52 left-8 space-y-2 text-sm">
              {/* Name */}
              <div className="flex items-center">
                <span className="w-24 font-bold text-gray-700">Name:</span>
                <span className="font-normal text-gray-900">
                  {patient.prefix ? `${patient.prefix} ` : ''}{patient.first_name} {patient.last_name}
                </span>
              </div>

              {/* Patient No */}
              <div className="flex items-center">
                <span className="w-24 font-bold text-gray-700">Patient No:</span>
                <span className="text-gray-900">{patient.patient_id}</span>
              </div>

              {/* Department */}
              <div className="flex items-center">
                <span className="w-24 font-bold text-gray-700">Department:</span>
                <span className="text-gray-900">{getDepartmentName()}</span>
              </div>
            </div>

            {/* Date and Age/Sex - Right Side */}
            <div className="absolute top-52 right-0 mr-8 space-y-2 text-right text-sm">
              {/* Date */}
              <div className="flex items-center justify-end">
                <span className="font-bold text-gray-700 mr-2">Date:</span>
                <span className="text-gray-900">{getCurrentDate()}</span>
              </div>

              {/* Age/Sex */}
              <div className="flex items-center justify-end">
                <span className="font-bold text-gray-700 mr-2">Age/Sex:</span>
                <span className="text-gray-900">
                  {patient.age && patient.age.trim() !== '' ? `${patient.age} years` : 'N/A'} / {patient.gender === 'MALE' ? 'M' : patient.gender === 'FEMALE' ? 'F' : patient.gender}
                </span>
              </div>
            </div>

            {/* Prescription Content */}
            <div className="absolute top-80 left-8 right-8 text-sm space-y-4">
              {chiefComplaints && (
                <div>
                  <h3 className="font-bold text-gray-700 text-xs uppercase mb-1">Chief Complaints:</h3>
                  <div className="text-gray-900 whitespace-pre-wrap">{chiefComplaints}</div>
                </div>
              )}
              
              {diagnosis && (
                <div>
                  <h3 className="font-bold text-gray-700 text-xs uppercase mb-1">Diagnosis:</h3>
                  <div className="text-gray-900 whitespace-pre-wrap">{diagnosis}</div>
                </div>
              )}
              
              {prescriptionText.length > 0 && (
                <div>
                  <h3 className="font-bold text-gray-700 text-xs uppercase mb-1">Prescription:</h3>
                  <div className="text-gray-900">
                    {prescriptionText.map((medicine, index) => (
                      <div key={index} className="mb-1">• {medicine}</div>
                    ))}
                  </div>
                </div>
              )}
              
              {advice && (
                <div>
                  <h3 className="font-bold text-gray-700 text-xs uppercase mb-1">Advice:</h3>
                  <div className="text-gray-900 whitespace-pre-wrap">{advice}</div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Valant2Prescription;
import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import type { PatientWithRelations } from '../config/supabaseNew';
import { getDoctorWithDegree } from '../data/doctorDegrees';
import { supabase } from '../config/supabaseNew';
import { MEDICAL_SERVICES, type MedicalService } from '../data/medicalServices';
import * as CompletePatientRecordService from '../services/completePatientRecordService';
import MedicineDropdown from './MedicineDropdown';

interface VHPrescriptionProps {
  patient: PatientWithRelations;
  onClose: () => void;
}

interface PrescriptionData {
  chiefComplaints: {
    painComplaint: string;
    location: string;
    duration: string;
  };
  historyOfPresentIllness: string;
  investigation: string[];
  reference: string;
  medicinePrescribed: string[];
}

const VHPrescription: React.FC<VHPrescriptionProps> = ({ patient, onClose }) => {
  const [templateLoaded, setTemplateLoaded] = useState(false);
  const [templateError, setTemplateError] = useState(false);
  const [doctorDetails, setDoctorDetails] = useState<{specialty?: string, hospital_experience?: string}>({});
  const [showTypingInterface, setShowTypingInterface] = useState(false);
  const [prescriptionData, setPrescriptionData] = useState<PrescriptionData>({
    chiefComplaints: {
      painComplaint: '',
      location: '',
      duration: ''
    },
    historyOfPresentIllness: '',
    investigation: [],
    reference: '',
    medicinePrescribed: []
  });

  const getCurrentDate = () => {
    return new Date().toLocaleDateString('en-IN');
  };

  // Get the correct doctor name and degree from patient data
  const getDoctorInfo = () => {
    console.log('🩺 VH Patient data for prescription:', patient);
    console.log('👨‍⚕️ VH assigned_doctor:', patient.assigned_doctor);
    console.log('👨‍⚕️ VH doctor_name:', (patient as any).doctor_name);
    console.log('👨‍⚕️ VH doctor_degree:', (patient as any).doctor_degree);
    console.log('👨‍⚕️ VH doctor_specialization:', (patient as any).doctor_specialization);
    console.log('🏥 VH assigned_department:', patient.assigned_department);
    console.log('📋 VH Current doctorDetails state:', doctorDetails);
    console.log('🔍 VH Transaction details:', (patient as any).transaction_details);
    
    // Use enhanced doctor fields from transaction-specific data first
    const doctorName = patient.assigned_doctor || (patient as any).doctor_name || 'DR. BATUL PEEPAWALA';
    const transactionDegree = (patient as any).doctor_degree;
    const transactionSpecialization = (patient as any).doctor_specialization;
    
    const localDoctorInfo = getDoctorWithDegree(doctorName);
    
    // Prioritize transaction-specific degree, then local degree, then database specialty
    let degree = '';
    if (transactionDegree && transactionDegree.trim()) {
      degree = transactionDegree;
      console.log('✅ VH Using transaction doctor_degree:', degree);
    } else if (localDoctorInfo.degree) {
      degree = localDoctorInfo.degree;
      console.log('✅ VH Using local doctor degree:', degree);
    } else if (doctorDetails.specialty) {
      degree = doctorDetails.specialty;
      console.log('✅ VH Using database specialty as degree:', degree);
    }
    
    const result = {
      name: localDoctorInfo.name,
      degree: degree,
      specialization: transactionSpecialization || '',
      specialty: '', // Don't show specialty separately since it's now the degree
      hospital_experience: doctorDetails.hospital_experience || ''
    };
    console.log('👨‍⚕️ VH FINAL getDoctorInfo result:', result);
    return result;
  };

  const getDepartmentName = () => {
    // Prioritize transaction-specific department over patient's assigned department
    let dept = patient.assigned_department || 'GENERAL PHYSICIAN';
    
    console.log('🏥 VH Department resolution:', {
      patient_assigned_department: patient.assigned_department,
      final_department: dept
    });
    
    // Fix any ORTHOPEDIC spelling issues
    if (dept.toUpperCase().includes('ORTHOPEDIC')) {
      dept = dept.replace(/ORTHOPEDIC/gi, 'ORTHOPAEDIC');
    }
    
    console.log('🏥 VH FINAL department:', dept);
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

  // Template path with fallback options
  const templatePaths = [
    '/vh-prescription-template.jpg',
    './vh-prescription-template.jpg',
    '../public/vh-prescription-template.jpg'
  ];
  const [currentTemplateIndex, setCurrentTemplateIndex] = useState(0);

  useEffect(() => {
    const tryLoadTemplate = (index: number) => {
      if (index >= templatePaths.length) {
        console.error('All VH prescription template paths failed');
        setTemplateError(true);
        return;
      }

      const img = new Image();
      img.onload = () => {
        console.log(`✅ VH prescription template loaded from: ${templatePaths[index]}`);
        setTemplateLoaded(true);
        setTemplateError(false);
      };
      img.onerror = () => {
        console.warn(`❌ Failed to load VH prescription template from: ${templatePaths[index]}`);
        setCurrentTemplateIndex(index + 1);
        tryLoadTemplate(index + 1);
      };
      img.src = templatePaths[index];
    };

    tryLoadTemplate(currentTemplateIndex);
  }, [currentTemplateIndex]);

  // Fetch department details from database
  useEffect(() => {
    const fetchDepartmentDetails = async () => {
      if (patient.assigned_department) {
        try {
          console.log('🔍 VH Searching for department:', patient.assigned_department);
          
          // Simple exact match query first
          const { data: departments, error } = await supabase
            .from('departments')
            .select('name, specialty, hospital_experience')
            .eq('name', patient.assigned_department);
          
          console.log('📋 VH Department query result:', departments);
          console.log('📋 VH Query error:', error);
          
          if (departments && departments.length > 0) {
            const department = departments[0];
            console.log('✅ VH Found department data:', department);
            
            const newDetails = {
              specialty: department.specialty || '',
              hospital_experience: department.hospital_experience || ''
            };
            
            console.log('📋 VH Setting new state:', newDetails);
            setDoctorDetails(newDetails);
            
            // Force re-render
            setTimeout(() => {
              console.log('📋 VH State after update:', newDetails);
            }, 100);
          } else {
            console.log('❌ VH No exact match, trying partial match');
            
            // Try alternative spelling for ORTHOPEDIC/ORTHOPAEDIC
            let searchTerm = patient.assigned_department;
            if (patient.assigned_department === 'ORTHOPEDIC') {
              searchTerm = 'ORTHOPAEDIC';
            } else if (patient.assigned_department === 'ORTHOPAEDIC') {
              searchTerm = 'ORTHOPEDIC';
            }
            
            console.log('🔍 VH Trying alternative spelling:', searchTerm);
            
            const { data: altDepts, error: altError } = await supabase
              .from('departments')
              .select('name, specialty, hospital_experience')
              .eq('name', searchTerm);
            
            console.log('📋 VH Alternative spelling result:', altDepts);
            
            if (altDepts && altDepts.length > 0) {
              const department = altDepts[0];
              setDoctorDetails({
                specialty: department.specialty || '',
                hospital_experience: department.hospital_experience || ''
              });
              console.log('✅ VH Found with alternative spelling:', department);
            } else {
              // Finally try partial match
              const { data: partialDepts, error: partialError } = await supabase
                .from('departments')
                .select('name, specialty, hospital_experience')
                .ilike('name', `%${patient.assigned_department}%`);
              
              console.log('📋 VH Partial match result:', partialDepts);
              
              if (partialDepts && partialDepts.length > 0) {
                const department = partialDepts[0];
                setDoctorDetails({
                  specialty: department.specialty || '',
                  hospital_experience: department.hospital_experience || ''
                });
                console.log('✅ VH Found partial match:', department);
              }
            }
          }
          
        } catch (error) {
          console.error('❌ VH Database error:', error);
        }
      }
    };
    
    fetchDepartmentDetails();
  }, [patient.assigned_department]);

  // Load Complete Patient Record data if available
  useEffect(() => {
    console.log('🚀 VH useEffect triggered for patient:', patient.patient_id);
    const loadPatientRecordData = async () => {
      try {
        console.log('🔄 VH Loading Complete Patient Record for:', patient.patient_id);
        // Load data from Complete Patient Record database
        const savedPatientRecord = await CompletePatientRecordService.getCompletePatientRecord(patient.patient_id);
        console.log('📡 VH Service returned:', !!savedPatientRecord, savedPatientRecord ? 'with data' : 'null');
        
        if (savedPatientRecord) {
          console.log('✅ VH Found Complete Patient Record data in database:', savedPatientRecord);
          console.log('🔍 VH High Risk Data:', savedPatientRecord.highRisk);
          console.log('🔍 VH High Risk Structure:', savedPatientRecord.highRisk ? Object.keys(savedPatientRecord.highRisk) : 'null');
          
          // Map Complete Patient Record data to VH prescription format - COMPREHENSIVE MAPPING
          const mappedChiefComplaints = { painComplaint: '', location: '', duration: '' };
          let mappedHistoryOfPresentIllness = '';
          let mappedInvestigations: string[] = [];
          let mappedMedicinePrescribed: string[] = [];
          
          // Build comprehensive history section with ALL Complete Patient Record data
          const historySections = [];
          
          // 1. CHIEF COMPLAINTS SECTION
          if (savedPatientRecord.chiefComplaints && savedPatientRecord.chiefComplaints.length > 0) {
            const complaintsText = savedPatientRecord.chiefComplaints.map((complaint, index) => 
              `${index + 1}. ${complaint.complaint} (${complaint.period || complaint.duration || 'Unknown duration'}) - ${complaint.presentHistory || complaint.notes || 'No additional details'}`
            ).join('\n');
            historySections.push(`CHIEF COMPLAINTS:\n${complaintsText}`);
            
            // Also map to the specific chief complaints fields
            const firstComplaint = savedPatientRecord.chiefComplaints[0];
            mappedChiefComplaints.painComplaint = firstComplaint.complaint || '';
            mappedChiefComplaints.duration = firstComplaint.duration || firstComplaint.period || '';
            mappedChiefComplaints.location = firstComplaint.location || '';
          }
          
          // 2. HIGH RISK DATA SECTION
          console.log('🔍 VH Processing high risk data...', !!savedPatientRecord.highRisk);
          if (savedPatientRecord.highRisk) {
            console.log('📊 VH High Risk Details:', savedPatientRecord.highRisk);
            
            const highRiskDetails = [];
            if (savedPatientRecord.highRisk.risk_factors?.length > 0) {
              highRiskDetails.push(`Risk Factors: ${savedPatientRecord.highRisk.risk_factors.join(', ')}`);
            }
            if (savedPatientRecord.highRisk.allergy_drug) {
              highRiskDetails.push(`Drug Allergies: ${savedPatientRecord.highRisk.allergy_drug}`);
            }
            if (savedPatientRecord.highRisk.allergy_food) {
              highRiskDetails.push(`Food Allergies: ${savedPatientRecord.highRisk.allergy_food}`);
            }
            if (savedPatientRecord.highRisk.current_medications) {
              highRiskDetails.push(`Current Medications: ${savedPatientRecord.highRisk.current_medications}`);
            }
            if (savedPatientRecord.highRisk.surgical_history) {
              highRiskDetails.push(`Surgical History: ${savedPatientRecord.highRisk.surgical_history}`);
            }
            if (savedPatientRecord.highRisk.family_history) {
              highRiskDetails.push(`Family History: ${savedPatientRecord.highRisk.family_history}`);
            }
            if (savedPatientRecord.highRisk.social_history) {
              highRiskDetails.push(`Social History: ${savedPatientRecord.highRisk.social_history}`);
            }
            if (savedPatientRecord.highRisk.notes) {
              highRiskDetails.push(`Notes: ${savedPatientRecord.highRisk.notes}`);
            }
            
            if (highRiskDetails.length > 0) {
              historySections.push(`HIGH RISK CONDITIONS & MEDICAL HISTORY:\n${highRiskDetails.join('\n')}`);
            }
          }
          
          // 3. EXAMINATION DATA SECTION
          if (savedPatientRecord.examination) {
            const examDetails = [];
            if (savedPatientRecord.examination.general_appearance) examDetails.push(`General Appearance: ${savedPatientRecord.examination.general_appearance}`);
            if (savedPatientRecord.examination.vital_signs) examDetails.push(`Vital Signs: ${savedPatientRecord.examination.vital_signs}`);
            if (savedPatientRecord.examination.systemic_examination) examDetails.push(`Systemic Exam: ${savedPatientRecord.examination.systemic_examination}`);
            if (savedPatientRecord.examination.local_examination) examDetails.push(`Local Exam: ${savedPatientRecord.examination.local_examination}`);
            if (savedPatientRecord.examination.neurological_examination) examDetails.push(`Neurological: ${savedPatientRecord.examination.neurological_examination}`);
            if (savedPatientRecord.examination.cardiovascular_examination) examDetails.push(`Cardiovascular: ${savedPatientRecord.examination.cardiovascular_examination}`);
            if (savedPatientRecord.examination.respiratory_examination) examDetails.push(`Respiratory: ${savedPatientRecord.examination.respiratory_examination}`);
            if (savedPatientRecord.examination.abdominal_examination) examDetails.push(`Abdominal: ${savedPatientRecord.examination.abdominal_examination}`);
            if (savedPatientRecord.examination.musculoskeletal_examination) examDetails.push(`Musculoskeletal: ${savedPatientRecord.examination.musculoskeletal_examination}`);
            
            if (examDetails.length > 0) {
              historySections.push(`EXAMINATION FINDINGS:\n${examDetails.join('\n')}`);
            }
          }
          
          // 4. DIAGNOSIS DATA SECTION
          if (savedPatientRecord.diagnosis) {
            const diagnosisDetails = [];
            if (savedPatientRecord.diagnosis.primary_diagnosis) diagnosisDetails.push(`Primary Diagnosis: ${savedPatientRecord.diagnosis.primary_diagnosis}`);
            if (savedPatientRecord.diagnosis.secondary_diagnosis) diagnosisDetails.push(`Secondary Diagnosis: ${savedPatientRecord.diagnosis.secondary_diagnosis}`);
            if (savedPatientRecord.diagnosis.differential_diagnosis) diagnosisDetails.push(`Differential Diagnosis: ${savedPatientRecord.diagnosis.differential_diagnosis}`);
            if (savedPatientRecord.diagnosis.icd_codes) diagnosisDetails.push(`ICD Codes: ${savedPatientRecord.diagnosis.icd_codes}`);
            if (savedPatientRecord.diagnosis.confidence_level) diagnosisDetails.push(`Confidence Level: ${savedPatientRecord.diagnosis.confidence_level}`);
            if (savedPatientRecord.diagnosis.notes) diagnosisDetails.push(`Diagnosis Notes: ${savedPatientRecord.diagnosis.notes}`);
            
            if (diagnosisDetails.length > 0) {
              historySections.push(`DIAGNOSIS:\n${diagnosisDetails.join('\n')}`);
            }
          }
          
          // Combine all sections into the history field
          mappedHistoryOfPresentIllness = historySections.join('\n\n═══════════════════\n\n');
          
          // Map Investigations comprehensively - include ALL investigation types
          if (savedPatientRecord.investigation) {
            const investigations = [];
            if (savedPatientRecord.investigation.laboratory_tests) investigations.push(`Lab Tests: ${savedPatientRecord.investigation.laboratory_tests}`);
            if (savedPatientRecord.investigation.imaging_studies) investigations.push(`Imaging: ${savedPatientRecord.investigation.imaging_studies}`);
            if (savedPatientRecord.investigation.special_tests) investigations.push(`Special Tests: ${savedPatientRecord.investigation.special_tests}`);
            if (savedPatientRecord.investigation.biopsy_results) investigations.push(`Biopsy: ${savedPatientRecord.investigation.biopsy_results}`);
            if (savedPatientRecord.investigation.pathology_reports) investigations.push(`Pathology: ${savedPatientRecord.investigation.pathology_reports}`);
            if (savedPatientRecord.investigation.results) investigations.push(`Results: ${savedPatientRecord.investigation.results}`);
            if (savedPatientRecord.investigation.interpretation) investigations.push(`Interpretation: ${savedPatientRecord.investigation.interpretation}`);
            mappedInvestigations = investigations.filter(inv => inv && inv.trim());
          }
          
          // Map Prescriptions comprehensively - include ALL medication details
          if (savedPatientRecord.prescription?.medications && savedPatientRecord.prescription.medications.length > 0) {
            mappedMedicinePrescribed = savedPatientRecord.prescription.medications.map((med: any, index: number) => {
              const parts = [`${index + 1}.`];
              if (med.medicineName || med.name) parts.push(med.medicineName || med.name);
              if (med.dosage || med.dose) parts.push(`- Dose: ${med.dosage || med.dose}`);
              if (med.frequency) parts.push(`- Frequency: ${med.frequency}`);
              if (med.duration) parts.push(`- Duration: ${med.duration}`);
              if (med.whenTaken || med.timing) parts.push(`- Timing: ${med.whenTaken || med.timing}`);
              if (med.specialInstructions) parts.push(`- Instructions: ${med.specialInstructions}`);
              if (med.route) parts.push(`- Route: ${med.route}`);
              return parts.join(' ');
            }).filter(med => med.trim());
            
            // Also add prescription instructions if available
            if (savedPatientRecord.prescription.dosage_instructions) {
              mappedMedicinePrescribed.push(`\nDosage Instructions: ${savedPatientRecord.prescription.dosage_instructions}`);
            }
            if (savedPatientRecord.prescription.special_instructions) {
              mappedMedicinePrescribed.push(`Special Instructions: ${savedPatientRecord.prescription.special_instructions}`);
            }
            if (savedPatientRecord.prescription.follow_up_date) {
              mappedMedicinePrescribed.push(`Follow-up Date: ${savedPatientRecord.prescription.follow_up_date}`);
            }
          }
          
          // Build comprehensive reference section
          const referenceDetails = [];
          if (savedPatientRecord.diagnosis?.primary_diagnosis) referenceDetails.push(`Primary Diagnosis: ${savedPatientRecord.diagnosis.primary_diagnosis}`);
          if (savedPatientRecord.diagnosis?.secondary_diagnosis) referenceDetails.push(`Secondary Diagnosis: ${savedPatientRecord.diagnosis.secondary_diagnosis}`);
          if (savedPatientRecord.investigation?.interpretation) referenceDetails.push(`Investigation Notes: ${savedPatientRecord.investigation.interpretation}`);
          if (savedPatientRecord.summary?.summary) referenceDetails.push(`Summary: ${savedPatientRecord.summary.summary}`);
          const mappedReference = referenceDetails.join('\n') || '';
          
          setPrescriptionData({
            chiefComplaints: mappedChiefComplaints,
            historyOfPresentIllness: mappedHistoryOfPresentIllness,
            investigation: mappedInvestigations,
            reference: mappedReference,
            medicinePrescribed: mappedMedicinePrescribed
          });
          
          console.log('📋 VH Final mapped data:', {
            chiefComplaintsCount: mappedChiefComplaints ? 1 : 0,
            historyLength: mappedHistoryOfPresentIllness.length,
            investigationsCount: mappedInvestigations.length,
            referenceLength: mappedReference.length,
            medicinesCount: mappedMedicinePrescribed.length,
            historySections: historySections.length
          });
          
          toast.success('✅ VH: Loaded ALL Complete Patient Record sections!');
          console.log('✅ VH: Successfully mapped ALL Complete Patient Record sections to prescription format');
        } else {
          console.log('ℹ️ VH: No Complete Patient Record found for patient:', patient.patient_id);
        }
        
      } catch (error) {
        console.error('❌ VH: Error loading Complete Patient Record:', error);
        toast.error('VH: Error loading Complete Patient Record data');
      }
    };
    
    loadPatientRecordData();
  }, [patient.patient_id]);

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
          <title>VH Prescription - Print</title>
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
              background-image: url('${templatePaths[currentTemplateIndex]}');
              background-size: 100% 100%;
              background-position: center;
              background-repeat: no-repeat;
            }

            .patient-details {
              position: absolute;
              top: 264px;
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
              font-weight: 500;
              color: #374151;
              margin-right: 8px;
            }

            .patient-details .value {
              font-size: 20px;
              font-weight: 500;
              color: #111827;
              white-space: nowrap;
            }

            .right-details {
              position: absolute;
              top: 264px;
              right: 48px;
              text-align: right;
            }

            .right-details > div {
              margin-bottom: 12px;
            }

            .right-details .label {
              font-size: 18px;
              font-weight: 500;
              color: #374151;
              margin-right: 8px;
            }

            .right-details .value {
              font-size: 20px;
              color: #111827;
            }

            .doctor-details {
              position: absolute;
              bottom: 384px;
              right: 48px;
              text-align: left;
              max-width: 500px;
            }

            .doctor-name {
              font-family: 'Canva Sans', sans-serif;
              font-weight: bold;
              font-size: 24px;
              text-transform: uppercase;
              line-height: 1.2;
              color: #4E1BB2;
            }

            .doctor-degree {
              font-family: 'Canva Sans', sans-serif;
              font-size: 18px;
              font-weight: 500;
              color: #374151;
              margin-top: 4px;
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

            .prescription-content {
              position: absolute;
              top: 380px;
              left: 48px;
              right: 48px;
              bottom: 400px;
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
                    ${prescriptionData.chiefComplaints.painComplaint ? `<div><span class="label">Pain:</span> ${prescriptionData.chiefComplaints.painComplaint}</div>` : ''}
                    ${prescriptionData.chiefComplaints.location ? `<div><span class="label">Location:</span> ${prescriptionData.chiefComplaints.location}</div>` : ''}
                    ${prescriptionData.chiefComplaints.duration ? `<div><span class="label">Duration:</span> ${prescriptionData.chiefComplaints.duration}</div>` : ''}
                  </div>
                </div>
              ` : ''}
              
              ${prescriptionData.historyOfPresentIllness ? `
                <div class="section">
                  <div class="section-title">History of Present Illness:</div>
                  <div class="section-content">${prescriptionData.historyOfPresentIllness}</div>
                </div>
              ` : ''}
              
              ${prescriptionData.investigation.length > 0 ? `
                <div class="section">
                  <div class="section-title">Investigation:</div>
                  <div class="section-content">
                    ${prescriptionData.investigation.map(item => `<div>• ${item}</div>`).join('')}
                  </div>
                </div>
              ` : ''}
              
              ${prescriptionData.reference ? `
                <div class="section">
                  <div class="section-title">Reference:</div>
                  <div class="section-content">${prescriptionData.reference}</div>
                </div>
              ` : ''}
              
              ${prescriptionData.medicinePrescribed.length > 0 ? `
                <div class="section">
                  <div class="section-title">Medicine Prescribed:</div>
                  <div class="section-content">${prescriptionData.medicinePrescribed.map(medicine => `<div>• ${medicine}</div>`).join('')}</div>
                </div>
              ` : ''}
            </div>

            <div class="doctor-details">
              <div class="doctor-name">${doctorInfo.name}</div>
              ${doctorInfo.degree ? `<div class="doctor-degree">${doctorInfo.degree.replace(/\n/g, '<br>')}</div>` : ''}
              <div class="doctor-specialty">${departmentName}</div>
              ${doctorInfo.specialty && doctorInfo.specialty !== doctorInfo.degree ? `<div class="doctor-specialty">Specialty: ${doctorInfo.specialty}</div>` : ''}
              ${doctorInfo.hospital_experience ? `<div class="doctor-experience">${doctorInfo.hospital_experience}</div>` : ''}
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
        {/* Print, Type, and Close buttons */}
        <div className="flex justify-end gap-2 p-4 border-b print:hidden">
          <button
            onClick={() => setShowTypingInterface(!showTypingInterface)}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 flex items-center gap-2"
          >
            <span>✏️</span> {showTypingInterface ? 'Hide' : 'Type'} Prescription
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
            <h3 className="text-lg font-semibold mb-4 text-gray-800">Prescription Details</h3>
            
            {/* Chief Complaints Section */}
            <div className="mb-6">
              <h4 className="text-md font-medium mb-3 text-gray-700">1. Chief Complaints</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">a. Pain Complaint</label>
                  <textarea
                    value={prescriptionData.chiefComplaints.painComplaint}
                    onChange={(e) => setPrescriptionData(prev => ({
                      ...prev,
                      chiefComplaints: { ...prev.chiefComplaints, painComplaint: e.target.value }
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={3}
                    placeholder="Describe pain complaint..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">b. Location</label>
                  <textarea
                    value={prescriptionData.chiefComplaints.location}
                    onChange={(e) => setPrescriptionData(prev => ({
                      ...prev,
                      chiefComplaints: { ...prev.chiefComplaints, location: e.target.value }
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={3}
                    placeholder="Location of pain..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">c. Duration</label>
                  <textarea
                    value={prescriptionData.chiefComplaints.duration}
                    onChange={(e) => setPrescriptionData(prev => ({
                      ...prev,
                      chiefComplaints: { ...prev.chiefComplaints, duration: e.target.value }
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={3}
                    placeholder="Duration of symptoms..."
                  />
                </div>
              </div>
            </div>

            {/* History of Present Illness */}
            <div className="mb-6">
              <label className="block text-md font-medium text-gray-700 mb-2">2. History of Present Illness</label>
              <textarea
                value={prescriptionData.historyOfPresentIllness}
                onChange={(e) => setPrescriptionData(prev => ({ ...prev, historyOfPresentIllness: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={4}
                placeholder="Describe the history of present illness..."
              />
            </div>

            {/* Investigation */}
            <div className="mb-6">
              <label className="block text-md font-medium text-gray-700 mb-2">3. Investigation</label>
              <div className="space-y-2">
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
                  {MEDICAL_SERVICES
                    .filter(service => service.isActive)
                    .map(service => (
                      <option key={service.id} value={service.name}>
                        {service.name} - {service.category} (₹{service.basePrice})
                      </option>
                    ))
                  }
                </select>
                
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
              </div>
            </div>

            {/* Reference */}
            <div className="mb-6">
              <label className="block text-md font-medium text-gray-700 mb-2">4. Reference</label>
              <textarea
                value={prescriptionData.reference}
                onChange={(e) => setPrescriptionData(prev => ({ ...prev, reference: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
                placeholder="Reference notes..."
              />
            </div>

            {/* Medicine Prescribed */}
            <div className="mb-4">
              <MedicineDropdown
                selectedMedicines={prescriptionData.medicinePrescribed}
                onChange={(medicines) => setPrescriptionData(prev => ({ ...prev, medicinePrescribed: medicines }))}
                placeholder="Select Medicine..."
                label="5. Medicine Prescribed"
              />
            </div>

            {/* Clear All Button */}
            <div className="flex justify-end">
              <button
                onClick={() => setPrescriptionData({
                  chiefComplaints: { painComplaint: '', location: '', duration: '' },
                  historyOfPresentIllness: '',
                  investigation: [],
                  reference: '',
                  medicinePrescribed: []
                })}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 text-sm"
              >
                Clear All
              </button>
            </div>
          </div>
        )}

        {/* Loading/Error State */}
        {!templateLoaded && !templateError && (
          <div className="flex items-center justify-center h-64">
            <div className="text-gray-500">Loading VH prescription template...</div>
          </div>
        )}

        {templateError && (
          <div className="flex flex-col items-center justify-center h-64 bg-red-50 border border-red-200 rounded p-6">
            <div className="text-red-600 text-center mb-4">
              ⚠️ Failed to load VH prescription template from all sources.
              <br />
              Please ensure 'vh-prescription-template.jpg' exists in the public folder.
            </div>
            <button
              onClick={() => {
                setTemplateError(false);
                setTemplateLoaded(false);
                setCurrentTemplateIndex(0);
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              🔄 Retry Loading Template
            </button>
          </div>
        )}

        {/* Prescription Content */}
        {(templateLoaded || !templateError) && (
          <div 
            id="prescription-content" 
            className="relative w-full h-[842px] bg-cover bg-center bg-no-repeat print:w-[297mm] print:h-[420mm]"
            style={{ 
              backgroundImage: `url(${templatePaths[currentTemplateIndex]})`,
              backgroundSize: '100% 100%',
              backgroundPosition: 'center'
            }}
          >

          {/* Patient Details */}
          <div className="absolute top-64 left-12">
            {/* Row 1: Name and Age/Sex */}
            <div className="flex mb-3">
              <div className="flex items-center whitespace-nowrap">
                <span className="text-lg font-medium text-gray-700">Name:</span>
                <span className="text-xl font-medium text-gray-900 ml-2">
                  {patient.prefix ? `${patient.prefix} ` : ''}{patient.first_name} {patient.last_name}
                </span>
              </div>
              <div className="flex items-center whitespace-nowrap ml-52">
                <span className="text-lg font-medium text-gray-700">Age/Sex:</span>
                <span className="text-xl text-gray-900 ml-2">
                  {patient.age && patient.age.trim() !== '' ? `${patient.age} years` : 'N/A'} / {patient.gender === 'MALE' ? 'M' : patient.gender === 'FEMALE' ? 'F' : patient.gender}
                </span>
              </div>
            </div>

            {/* Row 2: Patient No and Department */}
            <div className="flex">
              <div className="flex items-center whitespace-nowrap">
                <span className="text-lg font-medium text-gray-700">Patient No:</span>
                <span className="text-xl text-gray-900 ml-2">{patient.patient_id}</span>
              </div>
              <div className="flex items-center whitespace-nowrap ml-52">
                <span className="text-lg font-medium text-gray-700">Department:</span>
                <span className="text-xl text-gray-900 ml-2">{getDepartmentName()}</span>
              </div>
            </div>
          </div>

          {/* Date and Paid Amount - Right Side */}
          <div className="absolute top-64 right-0 mr-12 space-y-3 text-right">
            {/* Date */}
            <div className="flex items-center justify-end">
              <span className="text-lg font-medium text-gray-700 mr-2">Date:</span>
              <span className="text-xl text-gray-900">{getCurrentDate()}</span>
            </div>

            {/* Paid Amount */}
            <div className="flex items-center justify-end">
              <span className="text-lg font-medium text-gray-700 mr-2">Paid Amount:</span>
              <span className="text-xl font-semibold text-green-600">
                ₹{getTotalPaidAmount().toLocaleString()}
              </span>
            </div>
          </div>

          {/* Prescription Content Area */}
          <div className="absolute top-96 left-12 right-12 bottom-[26rem] overflow-hidden">
            {/* Chief Complaints */}
            {(prescriptionData.chiefComplaints.painComplaint || prescriptionData.chiefComplaints.location || prescriptionData.chiefComplaints.duration) && (
              <div className="mb-8">
                <div className="text-2xl font-bold text-gray-800 mb-4">Chief Complaints:</div>
                <div className="text-lg text-gray-700 space-y-3">
                  {prescriptionData.chiefComplaints.painComplaint && (
                    <div><span className="font-bold">Pain:</span> {prescriptionData.chiefComplaints.painComplaint}</div>
                  )}
                  {prescriptionData.chiefComplaints.location && (
                    <div><span className="font-bold">Location:</span> {prescriptionData.chiefComplaints.location}</div>
                  )}
                  {prescriptionData.chiefComplaints.duration && (
                    <div><span className="font-bold">Duration:</span> {prescriptionData.chiefComplaints.duration}</div>
                  )}
                </div>
              </div>
            )}

            {/* History of Present Illness */}
            {prescriptionData.historyOfPresentIllness && (
              <div className="mb-8">
                <div className="text-2xl font-bold text-gray-800 mb-4">History of Present Illness:</div>
                <div className="text-lg text-gray-700 leading-relaxed">{prescriptionData.historyOfPresentIllness}</div>
              </div>
            )}

            {/* Investigation */}
            {prescriptionData.investigation.length > 0 && (
              <div className="mb-8">
                <div className="text-2xl font-bold text-gray-800 mb-4">Investigation:</div>
                <div className="text-lg text-gray-700">
                  {prescriptionData.investigation.map((item, index) => (
                    <div key={index} className="mb-2">• {item}</div>
                  ))}
                </div>
              </div>
            )}

            {/* Reference */}
            {prescriptionData.reference && (
              <div className="mb-8">
                <div className="text-2xl font-bold text-gray-800 mb-4">Reference:</div>
                <div className="text-lg text-gray-700 leading-relaxed">{prescriptionData.reference}</div>
              </div>
            )}

            {/* Medicine Prescribed */}
            {prescriptionData.medicinePrescribed.length > 0 && (
              <div className="mb-8">
                <div className="text-2xl font-bold text-gray-800 mb-4">Medicine Prescribed:</div>
                <div className="text-lg text-gray-700 leading-relaxed">
                  {prescriptionData.medicinePrescribed.map((medicine, index) => (
                    <div key={index} className="mb-2">• {medicine}</div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Doctor Details - Bottom Right Above Signature */}
          <div className="absolute bottom-[24rem] right-12 text-left max-w-lg">
            {/* Doctor Name */}
            <div className="font-bold text-2xl uppercase leading-tight" style={{ fontFamily: 'Canva Sans, sans-serif', color: '#4E1BB2' }}>
              {getDoctorInfo().name}
            </div>
            
            {/* Doctor Degree */}
            {getDoctorInfo().degree && (
              <div className="text-lg mt-1 font-medium text-gray-700" style={{ fontFamily: 'Canva Sans, sans-serif', whiteSpace: 'pre-line' }}>
                {getDoctorInfo().degree}
              </div>
            )}
            
            {/* Department */}
            <div className="text-lg mt-1 font-bold text-gray-600" style={{ fontFamily: 'Canva Sans, sans-serif' }}>
              {getDepartmentName()}
            </div>
            
            {/* Specialty - only show if different from degree */}
            {getDoctorInfo().specialty && getDoctorInfo().specialty !== getDoctorInfo().degree && (
              <div className="text-lg mt-1 font-bold text-gray-600" style={{ fontFamily: 'Canva Sans, sans-serif' }}>
                Specialty: {getDoctorInfo().specialty}
              </div>
            )}
            
            {/* Hospital Experience */}
            {getDoctorInfo().hospital_experience && (
              <div className="text-lg mt-1 font-bold text-gray-600" style={{ fontFamily: 'Canva Sans, sans-serif' }}>
                {getDoctorInfo().hospital_experience}
              </div>
            )}
          </div>

          </div>
        )}
      </div>
    </div>
  );
};

export default VHPrescription;
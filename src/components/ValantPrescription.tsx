import React, { useState, useEffect } from 'react';
import type { PatientWithRelations } from '../config/supabaseNew';
import { getDoctorWithDegree } from '../data/doctorDegrees';
import { supabase } from '../config/supabaseNew';

interface ValantPrescriptionProps {
  patient: PatientWithRelations;
  onClose: () => void;
}

const ValantPrescription: React.FC<ValantPrescriptionProps> = ({ patient, onClose }) => {
  const [doctorDetails, setDoctorDetails] = useState<{specialty?: string, hospital_experience?: string}>({});
  
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
      
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-auto">
        {/* Print and Close buttons */}
        <div className="flex justify-end gap-2 p-4 border-b print:hidden">
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
          <div className="absolute top-10 right-12 text-left max-w-xs">
            {/* Doctor Name */}
            <div className="font-bold text-3xl uppercase leading-tight break-words" style={{ fontFamily: 'Canva Sans, sans-serif', color: '#4E1BB2' }}>
              {getDoctorInfo().name}
            </div>
            
            {/* Doctor Degree - Just below name */}
            {getDoctorInfo().degree && (
              <div className="text-lg mt-2 font-medium text-gray-700" style={{ fontFamily: 'Canva Sans, sans-serif' }}>
                {getDoctorInfo().degree}
              </div>
            )}
            
            
            {/* Specialty - Below department (only show if different from degree) */}
            {getDoctorInfo().specialty && getDoctorInfo().specialty !== getDoctorInfo().degree && (
              <div className="text-lg mt-1 font-bold text-gray-600" style={{ fontFamily: 'Canva Sans, sans-serif' }}>
                {getDoctorInfo().specialty}
              </div>
            )}
            
            {/* Hospital Experience - Below specialty */}
            {getDoctorInfo().hospital_experience && (
              <div className="text-lg mt-1 font-bold text-gray-600" style={{ fontFamily: 'Canva Sans, sans-serif' }}>
                {getDoctorInfo().hospital_experience}
              </div>
            )}
          </div>

          {/* Patient Details - Left Side */}
          <div className="absolute top-72 left-12 space-y-3">
            {/* Name */}
            <div className="flex items-center">
              <span className="w-32 text-lg font-bold text-gray-700">Name:</span>
              <span className="text-xl font-normal text-gray-900">
                {patient.prefix ? `${patient.prefix} ` : ''}{patient.first_name} {patient.last_name}
              </span>
            </div>

            {/* Patient No */}
            <div className="flex items-center">
              <span className="w-32 text-lg font-bold text-gray-700">Patient No:</span>
              <span className="text-xl font-normal text-gray-900">{patient.patient_id}</span>
            </div>

            {/* Department */}
            <div className="flex items-center">
              <span className="w-32 text-lg font-bold text-gray-700">Department:</span>
              <span className="text-xl font-normal text-gray-900">{getDepartmentName()}</span>
            </div>
          </div>

          {/* Date and Age/Sex - Right Side */}
          <div className="absolute top-72 right-0 mr-12 space-y-3 text-right">
            {/* Date */}
            <div className="flex items-center justify-end">
              <span className="text-lg font-bold text-gray-700 mr-2">Date:</span>
              <span className="text-xl font-normal text-gray-900">{getCurrentDate()}</span>
            </div>

            {/* Age/Sex */}
            <div className="flex items-center justify-end">
              <span className="text-lg font-bold text-gray-700 mr-2">Age/Sex:</span>
              <span className="text-xl font-normal text-gray-900">
                {patient.age && patient.age.trim() !== '' ? `${patient.age} years` : 'N/A'} / {patient.gender === 'MALE' ? 'M' : patient.gender === 'FEMALE' ? 'F' : patient.gender}
              </span>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default ValantPrescription;
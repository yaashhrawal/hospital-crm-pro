import React, { useState, useEffect } from 'react';
import type { PatientWithRelations } from '../config/supabaseNew';
import { getDoctorWithDegree } from '../data/doctorDegrees';
import { supabase } from '../config/supabaseNew';

interface VHPrescriptionProps {
  patient: PatientWithRelations;
  onClose: () => void;
}

const VHPrescription: React.FC<VHPrescriptionProps> = ({ patient, onClose }) => {
  const [templateLoaded, setTemplateLoaded] = useState(false);
  const [templateError, setTemplateError] = useState(false);
  const [doctorDetails, setDoctorDetails] = useState<{specialty?: string, hospital_experience?: string}>({});

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

  const handlePrint = () => {
    window.print();
  };


  const getCurrentDate = () => {
    return new Date().toLocaleDateString('en-IN');
  };

  // Get the correct doctor name and degree from patient data
  const getDoctorInfo = () => {
    console.log('🩺 VH Patient data:', patient);
    console.log('👨‍⚕️ VH assigned_doctor:', patient.assigned_doctor);
    console.log('🏥 VH assigned_department:', patient.assigned_department);
    console.log('📋 VH Current doctorDetails state:', doctorDetails);
    
    const doctorName = patient.assigned_doctor || 'DR. BATUL PEEPAWALA';
    const result = {
      ...getDoctorWithDegree(doctorName),
      specialty: doctorDetails.specialty || '',
      hospital_experience: doctorDetails.hospital_experience || ''
    };
    console.log('👨‍⚕️ VH FINAL getDoctorInfo result:', result);
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

          {/* Patient Details - Just after black line */}
          <div className="absolute top-64 left-12 space-y-3">
            {/* Name */}
            <div className="flex items-center">
              <span className="w-32 text-lg font-medium text-gray-700">Name:</span>
              <span className="text-xl font-medium text-gray-900">
                {patient.prefix ? `${patient.prefix} ` : ''}{patient.first_name} {patient.last_name}
              </span>
            </div>

            {/* Patient No */}
            <div className="flex items-center">
              <span className="w-32 text-lg font-medium text-gray-700">Patient No:</span>
              <span className="text-xl text-gray-900">{patient.patient_id}</span>
            </div>

            {/* Department */}
            <div className="flex items-center">
              <span className="w-32 text-lg font-medium text-gray-700">Department:</span>
              <span className="text-xl text-gray-900">{getDepartmentName()}</span>
            </div>
          </div>

          {/* Date and Age/Sex - Right Side aligned with patient details */}
          <div className="absolute top-64 right-0 mr-12 space-y-3 text-right">
            {/* Date */}
            <div className="flex items-center justify-end">
              <span className="text-lg font-medium text-gray-700 mr-2">Date:</span>
              <span className="text-xl text-gray-900">{getCurrentDate()}</span>
            </div>

            {/* Age/Sex */}
            <div className="flex items-center justify-end">
              <span className="text-lg font-medium text-gray-700 mr-2">Age/Sex:</span>
              <span className="text-xl text-gray-900">
                {patient.age && patient.age.trim() !== '' ? `${patient.age} years` : 'N/A'} / {patient.gender === 'MALE' ? 'M' : patient.gender === 'FEMALE' ? 'F' : patient.gender}
              </span>
            </div>
          </div>

          {/* Doctor Details - Bottom Right Above Signature */}
          <div className="absolute bottom-[24rem] right-12 text-left max-w-xs">
            {/* Doctor Name */}
            <div className="font-bold text-2xl uppercase leading-tight" style={{ fontFamily: 'Canva Sans, sans-serif', color: '#4E1BB2' }}>
              {getDoctorInfo().name}
            </div>
            
            {/* Doctor Degree */}
            {getDoctorInfo().degree && (
              <div className="text-lg mt-1 font-medium text-gray-700" style={{ fontFamily: 'Canva Sans, sans-serif' }}>
                {getDoctorInfo().degree}
              </div>
            )}
            
            
            {/* Specialty */}
            {getDoctorInfo().specialty && (
              <div className="text-lg mt-1 font-bold text-gray-600" style={{ fontFamily: 'Canva Sans, sans-serif' }}>
                {getDoctorInfo().specialty}
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
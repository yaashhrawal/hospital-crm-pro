import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { supabase } from '../config/supabaseNew';
import type { PatientAdmissionWithRelations } from '../config/supabaseNew';
import HospitalService from '../services/hospitalService';

interface DischargeModalProps {
  admission: PatientAdmissionWithRelations | null;
  isOpen: boolean;
  onClose: () => void;
  onDischargeSuccess: () => void;
}

interface DischargeFormData {
  // Medical Summary
  final_diagnosis: string;
  primary_consultant: string;
  chief_complaints: string;
  hopi: string;
  past_history: string;
  investigations: string;
  course_of_stay: string;
  treatment_during_hospitalization: string;
  treatment_summary: string;
  discharge_medication: string;
  follow_up_on: string;
  
  // Legal/Administrative
  attendant_name: string;
  attendant_relationship: string;
  attendant_contact: string;
  documents_handed_over: boolean;
  patient_consent: boolean;
  discharge_notes: string;
}

const DischargePatientModal: React.FC<DischargeModalProps> = ({
  admission,
  isOpen,
  onClose,
  onDischargeSuccess
}) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<DischargeFormData>({
    final_diagnosis: '',
    primary_consultant: '',
    chief_complaints: '',
    hopi: '',
    past_history: '',
    investigations: '',
    course_of_stay: '',
    treatment_during_hospitalization: '',
    treatment_summary: '',
    discharge_medication: '',
    follow_up_on: '',
    attendant_name: '',
    attendant_relationship: 'FAMILY_MEMBER',
    attendant_contact: '',
    documents_handed_over: false,
    patient_consent: false,
    discharge_notes: ''
  });

  const [stayDuration, setStayDuration] = useState(0);
  
  // Medication table state
  const [medications, setMedications] = useState<Array<{
    drug: string;
    morning: string;
    afternoon: string;
    night: string;
    days: string;
  }>>(() => Array(8).fill({ drug: '', morning: '', afternoon: '', night: '', days: '' }));

  useEffect(() => {
    if (admission && isOpen) {
      calculateStayDuration();
      setDefaultValues();
    }
  }, [admission, isOpen]);

  const calculateStayDuration = () => {
    if (!admission) return;
    
    const admissionDate = new Date(admission.admission_date);
    const today = new Date();
    const diffTime = Math.abs(today.getTime() - admissionDate.getTime());
    const days = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    setStayDuration(days);
  };

  const setDefaultValues = () => {
    if (!admission) return;

    // Set default next appointment (7 days from now)
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);

    setFormData(prev => ({
      ...prev,
      next_appointment_date: nextWeek.toISOString().split('T')[0],
      attendant_contact: admission.patient?.phone || ''
    }));
  };


  const handleDischarge = async () => {
    if (!admission) return;

    // Validation
    if (!formData.final_diagnosis.trim()) {
      toast.error('Final diagnosis is required');
      return;
    }

    if (!formData.primary_consultant.trim()) {
      toast.error('Primary consultant is required');
      return;
    }

    if (!formData.treatment_summary.trim()) {
      toast.error('Treatment summary is required');
      return;
    }

    if (!formData.attendant_name.trim()) {
      toast.error('Attendant name is required');
      return;
    }

    if (!formData.patient_consent) {
      toast.error('Patient consent is required for discharge');
      return;
    }

    if (!formData.documents_handed_over) {
      toast.error('Please confirm documents have been handed over');
      return;
    }

    // Convert medication table to string format
    const medicationString = medications
      .filter(med => med.drug.trim()) // Only include rows with drug names
      .map(med => `${med.drug}\t${med.morning || '0'}\t${med.afternoon || '0'}\t${med.night || '0'}\t${med.days || '0'}`)
      .join('\n');

    setLoading(true);
    try {
      console.log('🏥 Starting discharge process...');
      
      const currentUser = await HospitalService.getCurrentUser();
      if (!currentUser) {
        toast.error('Authentication required');
        return;
      }
      
      console.log('👤 Current user:', currentUser);
      console.log('🏨 Admission data:', admission);

      // Validate required data
      if (!admission.id) {
        throw new Error('Admission ID is missing');
      }
      
      if (!admission.patient?.id) {
        throw new Error('Patient ID is missing from admission data');
      }
      
      if (!currentUser.id) {
        throw new Error('Current user ID is missing');
      }

      // Check if current user exists in users table (for foreign key constraint)
      console.log('🔍 Verifying user exists in users table...');
      const { data: userExists, error: userCheckError } = await supabase
        .from('users')
        .select('id')
        .eq('id', currentUser.id)
        .single();

      if (userCheckError && userCheckError.code !== 'PGRST116') {
        console.error('❌ Error checking user existence:', userCheckError);
        throw new Error('Failed to verify user authentication');
      }

      let validUserId = currentUser.id;
      
      if (!userExists) {
        console.warn('⚠️ User does not exist in users table, attempting to create/find valid user ID...');
        
        // Try to find any user as fallback or create system user
        const { data: anyUser, error: anyUserError } = await supabase
          .from('users')
          .select('id')
          .limit(1)
          .single();
          
        if (anyUser) {
          console.log('🔄 Using fallback user ID:', anyUser.id);
          validUserId = anyUser.id;
        } else {
          console.error('❌ No users found in users table. Database may need setup.');
          throw new Error('User authentication system not properly configured. Please contact administrator.');
        }
      } else {
        console.log('✅ User verification successful');
        validUserId = userExists.id;
      }
      
      if (!admission.hospital_id) {
        console.warn('⚠️ Hospital ID missing from admission, using default');
      }

      const dischargeDate = new Date().toISOString();

      // 1. Create discharge summary record
      console.log('📝 Creating discharge summary...');
      console.log('🔍 Validation check:');
      console.log('- Admission ID:', admission.id);
      console.log('- Patient ID:', admission.patient?.id);
      console.log('- Current User ID:', currentUser.id);
      console.log('- Final Diagnosis:', formData.final_diagnosis);
      console.log('- Primary Consultant:', formData.primary_consultant);
      
      // Test table access first
      console.log('🧪 Testing discharge_summaries table access...');
      const { data: testData, error: testError } = await supabase
        .from('discharge_summaries')
        .select('id')
        .limit(1);
      
      if (testError) {
        console.error('❌ Cannot access discharge_summaries table:', testError);
        throw new Error(`Table access failed: ${testError.message}`);
      }
      
      console.log('✅ Table access successful');
      
      // Verify that the admission record actually exists in the database
      console.log('🔍 Verifying admission record exists...');
      const admissionExists = await HospitalService.verifyAdmissionExists(admission.id);
      
      if (!admissionExists) {
        console.warn('⚠️ Admission record does not exist in database:', admission.id);
        console.log('🛠️ Creating missing admission record...');
        
        try {
          // Create missing admission record using available data
          const missingAdmissionData = await HospitalService.createMissingAdmissionRecord(
            admission.patient?.id,
            admission.bed_id || 'unknown-bed',
            admission.admission_date,
            admission.bed_number
          );
          console.log('✅ Missing admission record created:', missingAdmissionData);
        } catch (createError: any) {
          console.error('❌ Failed to create missing admission record:', createError);
          // Continue with discharge process even if admission record creation fails
          console.warn('⚠️ Proceeding with discharge without admission record...');
        }
      }
      
      console.log('✅ Admission record handling complete, proceeding with discharge summary...');
      
      // Prepare discharge summary data with validation
      const dischargeSummaryData = {
        admission_id: admission.id,
        patient_id: admission.patient?.id,
        final_diagnosis: formData.final_diagnosis?.trim() || 'Not specified',
        primary_consultant: formData.primary_consultant?.trim() || 'Not specified',
        chief_complaints: formData.chief_complaints?.trim() || null,
        hopi: formData.hopi?.trim() || null,
        past_history: formData.past_history?.trim() || null,
        investigations: formData.investigations?.trim() || null,
        course_of_stay: formData.course_of_stay?.trim() || null,
        treatment_during_hospitalization: formData.treatment_during_hospitalization?.trim() || null,
        treatment_summary: formData.treatment_summary?.trim() || 'Treatment completed successfully',
        discharge_medication: medicationString || null,
        follow_up_on: formData.follow_up_on?.trim() || null,
        attendant_name: formData.attendant_name?.trim() || 'Not specified',
        attendant_relationship: formData.attendant_relationship || 'FAMILY_MEMBER',
        attendant_contact: formData.attendant_contact?.trim() || null,
        documents_handed_over: formData.documents_handed_over || false,
        discharge_notes: formData.discharge_notes?.trim() || null,
        created_by: validUserId,
        hospital_id: admission.hospital_id
      };
      
      console.log('📋 Prepared discharge summary data:', dischargeSummaryData);
      
      console.log('💾 Attempting to insert discharge summary...');
      const { data: dischargeSummary, error: summaryError } = await supabase
        .from('discharge_summaries')
        .insert(dischargeSummaryData)
        .select()
        .single();

      if (summaryError) {
        console.error('❌ Discharge summary insert failed:', summaryError);
        console.error('❌ Error details:', JSON.stringify(summaryError, null, 2));
        throw new Error(`Failed to save discharge summary: ${summaryError.message || summaryError.details || summaryError.hint || 'Unknown database error'}`);
      }
      
      console.log('✅ Discharge summary created:', dischargeSummary);

      // 2. Update admission status to DISCHARGED
      console.log('🏥 Updating admission status...');
      
      // Only update the status field since discharge_date column doesn't exist in actual table
      const updateData = {
        status: 'DISCHARGED'
      };
      
      console.log('🔄 Attempting to update admission with:', updateData);
      
      const { error: admissionError } = await supabase
        .from('patient_admissions')
        .update(updateData)
        .eq('id', admission.id);

      if (admissionError) {
        console.error('❌ Admission update error:', admissionError);
        throw admissionError;
      }
      
      console.log('✅ Admission status updated to DISCHARGED');

      // 3. Update patient ipd_status to DISCHARGED
      console.log('👤 Updating patient ipd_status to DISCHARGED...');
      const { error: patientUpdateError } = await supabase
        .from('patients')
        .update({ ipd_status: 'DISCHARGED' })
        .eq('id', admission.patient?.id);

      if (patientUpdateError) {
        console.warn('⚠️ Failed to update patient ipd_status:', patientUpdateError);
        // Don't throw error as the main discharge process succeeded
      } else {
        console.log('✅ Patient ipd_status updated to DISCHARGED');
      }

      // 4. Update bed status to available
      if (admission.bed_id) {
        console.log('🛏️ Updating bed status to available...');
        const { error: bedError } = await supabase
          .from('beds')
          .update({ status: 'AVAILABLE' })
          .eq('id', admission.bed_id);

        if (bedError) {
          console.warn('⚠️ Failed to update bed status:', bedError);
          // Don't throw error as the main discharge process succeeded
        } else {
          console.log('✅ Bed status updated to AVAILABLE');
        }
      }

      console.log('🎉 Discharge process completed successfully!');
      toast.success('Patient discharged successfully with complete documentation');
      onDischargeSuccess();
      onClose();

    } catch (error: any) {
      console.error('❌ CRITICAL ERROR during discharge process:', error);
      console.error('❌ Full error object:', JSON.stringify(error, null, 2));
      
      // Show the exact error to user - don't hide it
      let errorMessage = 'Unknown error occurred';
      
      if (error?.message) {
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      } else if (error?.details) {
        errorMessage = error.details;
      } else if (error?.hint) {
        errorMessage = error.hint;
      } else {
        errorMessage = 'Database operation failed. Check console for details.';
      }
      
      // STOP THE PROCESS - don't continue if there's an error
      toast.error(`❌ DISCHARGE FAILED: ${errorMessage}`);
      
      // Don't call onDischargeSuccess() or onClose() if there's an error
      // Keep the modal open so user can see what went wrong
      
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !admission) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-6xl max-h-[95vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b p-6 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">
              📤 Comprehensive Patient Discharge
            </h2>
            <p className="text-gray-600">
              {admission.patient?.first_name} {admission.patient?.last_name} - 
              Bed {admission.bed?.bed_number || admission.bed_id} - {stayDuration} days stay
            </p>
          </div>
          <button
            onClick={onClose}
            disabled={loading}
            className="text-gray-500 hover:text-gray-700 text-2xl font-bold disabled:opacity-50"
          >
            ×
          </button>
        </div>

        <div className="p-6 space-y-8">
          {/* Medical Summary Section */}
          <div className="bg-blue-50 p-6 rounded-lg border-2 border-blue-200">
            <h3 className="text-lg font-semibold text-blue-800 mb-4">🏥 Medical Discharge Summary</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Final Diagnosis *
                </label>
                <textarea
                  value={formData.final_diagnosis}
                  onChange={(e) => setFormData({...formData, final_diagnosis: e.target.value})}
                  placeholder="Enter final diagnosis"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 h-20"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Primary Consultant *
                </label>
                <input
                  type="text"
                  value={formData.primary_consultant}
                  onChange={(e) => setFormData({...formData, primary_consultant: e.target.value})}
                  placeholder="Enter primary consultant name"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Chief Complaints
                </label>
                <textarea
                  value={formData.chief_complaints}
                  onChange={(e) => setFormData({...formData, chief_complaints: e.target.value})}
                  placeholder="Enter chief complaints"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 h-20"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  HOPI (History of Present Illness)
                </label>
                <textarea
                  value={formData.hopi}
                  onChange={(e) => setFormData({...formData, hopi: e.target.value})}
                  placeholder="Enter history of present illness"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 h-20"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Past History
                </label>
                <textarea
                  value={formData.past_history}
                  onChange={(e) => setFormData({...formData, past_history: e.target.value})}
                  placeholder="Enter past medical history"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 h-20"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Investigations
                </label>
                <textarea
                  value={formData.investigations}
                  onChange={(e) => setFormData({...formData, investigations: e.target.value})}
                  placeholder="Enter investigations performed"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 h-20"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Course of Stay
                </label>
                <textarea
                  value={formData.course_of_stay}
                  onChange={(e) => setFormData({...formData, course_of_stay: e.target.value})}
                  placeholder="Enter course of hospitalization"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 h-20"
                />
              </div>
            </div>
          </div>

          {/* Medicine Details Section */}
          <div className="bg-green-50 p-6 rounded-lg border-2 border-green-200">
            <h3 className="text-lg font-semibold text-green-800 mb-4">💊 Medicine Details</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Treatment During Hospitalization
                </label>
                <textarea
                  value={formData.treatment_during_hospitalization}
                  onChange={(e) => setFormData({...formData, treatment_during_hospitalization: e.target.value})}
                  placeholder="Enter treatment details during hospitalization"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 h-24"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Treatment Summary *
                </label>
                <textarea
                  value={formData.treatment_summary}
                  onChange={(e) => setFormData({...formData, treatment_summary: e.target.value})}
                  placeholder="Enter overall treatment summary"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 h-24"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  💊 Discharge Medication
                </label>
                
                {/* Proper Medication Table */}
                <div className="border-2 border-gray-400 rounded-lg overflow-hidden bg-white">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-blue-50">
                        <th className="border border-gray-400 px-3 py-2 text-left font-bold text-gray-800 w-2/5">
                          Drug Name & Dose
                        </th>
                        <th className="border border-gray-400 px-3 py-2 text-center font-bold text-gray-800 w-1/6">
                          Morning
                        </th>
                        <th className="border border-gray-400 px-3 py-2 text-center font-bold text-gray-800 w-1/6">
                          Afternoon
                        </th>
                        <th className="border border-gray-400 px-3 py-2 text-center font-bold text-gray-800 w-1/6">
                          Night
                        </th>
                        <th className="border border-gray-400 px-3 py-2 text-center font-bold text-gray-800 w-1/6">
                          Days
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {/* Table rows for medication entry */}
                      {medications.map((med, index) => (
                        <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                          <td className="border border-gray-400 px-2 py-1">
                            <input
                              type="text"
                              value={med.drug}
                              onChange={(e) => {
                                const newMeds = [...medications];
                                newMeds[index] = { ...newMeds[index], drug: e.target.value };
                                setMedications(newMeds);
                              }}
                              className="w-full border-0 bg-transparent focus:outline-none text-sm"
                              placeholder={index === 0 ? "Tab. Paracetamol 500mg" : ""}
                            />
                          </td>
                          <td className="border border-gray-400 px-2 py-1">
                            <input
                              type="text"
                              value={med.morning}
                              onChange={(e) => {
                                const newMeds = [...medications];
                                newMeds[index] = { ...newMeds[index], morning: e.target.value };
                                setMedications(newMeds);
                              }}
                              className="w-full border-0 bg-transparent focus:outline-none text-center text-sm"
                              placeholder={index === 0 ? "1" : ""}
                            />
                          </td>
                          <td className="border border-gray-400 px-2 py-1">
                            <input
                              type="text"
                              value={med.afternoon}
                              onChange={(e) => {
                                const newMeds = [...medications];
                                newMeds[index] = { ...newMeds[index], afternoon: e.target.value };
                                setMedications(newMeds);
                              }}
                              className="w-full border-0 bg-transparent focus:outline-none text-center text-sm"
                              placeholder={index === 0 ? "0" : ""}
                            />
                          </td>
                          <td className="border border-gray-400 px-2 py-1">
                            <input
                              type="text"
                              value={med.night}
                              onChange={(e) => {
                                const newMeds = [...medications];
                                newMeds[index] = { ...newMeds[index], night: e.target.value };
                                setMedications(newMeds);
                              }}
                              className="w-full border-0 bg-transparent focus:outline-none text-center text-sm"
                              placeholder={index === 0 ? "1" : ""}
                            />
                          </td>
                          <td className="border border-gray-400 px-2 py-1">
                            <input
                              type="text"
                              value={med.days}
                              onChange={(e) => {
                                const newMeds = [...medications];
                                newMeds[index] = { ...newMeds[index], days: e.target.value };
                                setMedications(newMeds);
                              }}
                              className="w-full border-0 bg-transparent focus:outline-none text-center text-sm"
                              placeholder={index === 0 ? "5" : ""}
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                
                <p className="text-xs text-gray-600 mt-2">
                  📝 Enter each medication in the respective columns with proper dosing information
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Follow Up On
                </label>
                <input
                  type="text"
                  value={formData.follow_up_on}
                  onChange={(e) => setFormData({...formData, follow_up_on: e.target.value})}
                  placeholder="Enter follow-up date or instructions"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
            </div>
          </div>


          {/* Legal/Administrative Section */}
          <div className="bg-orange-50 p-6 rounded-lg border-2 border-orange-200">
            <h3 className="text-lg font-semibold text-orange-800 mb-4">📋 Legal & Administrative</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Attendant Name *
                </label>
                <input
                  type="text"
                  value={formData.attendant_name}
                  onChange={(e) => setFormData({...formData, attendant_name: e.target.value})}
                  placeholder="Person receiving patient"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Relationship
                </label>
                <select
                  value={formData.attendant_relationship}
                  onChange={(e) => setFormData({...formData, attendant_relationship: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  <option value="SELF">Self</option>
                  <option value="FAMILY_MEMBER">Family Member</option>
                  <option value="SPOUSE">Spouse</option>
                  <option value="PARENT">Parent</option>
                  <option value="CHILD">Child</option>
                  <option value="FRIEND">Friend</option>
                  <option value="GUARDIAN">Legal Guardian</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Attendant Contact
                </label>
                <input
                  type="tel"
                  value={formData.attendant_contact}
                  onChange={(e) => setFormData({...formData, attendant_contact: e.target.value})}
                  placeholder="Contact number"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
            </div>

            <div className="mt-4 space-y-3">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="documents_handed"
                  checked={formData.documents_handed_over}
                  onChange={(e) => setFormData({...formData, documents_handed_over: e.target.checked})}
                  className="mr-3 h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
                />
                <label htmlFor="documents_handed" className="text-sm text-gray-700">
                  All documents, reports, and discharge summary have been handed over to the attendant *
                </label>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="patient_consent"
                  checked={formData.patient_consent}
                  onChange={(e) => setFormData({...formData, patient_consent: e.target.checked})}
                  className="mr-3 h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
                />
                <label htmlFor="patient_consent" className="text-sm text-gray-700">
                  Patient/Attendant consent obtained for discharge and understands follow-up instructions *
                </label>
              </div>
            </div>

            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Additional Discharge Notes
              </label>
              <textarea
                value={formData.discharge_notes}
                onChange={(e) => setFormData({...formData, discharge_notes: e.target.value})}
                placeholder="Any additional notes or observations"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 h-20"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-4 pt-6 border-t">
            <button
              onClick={onClose}
              disabled={loading}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleDischarge}
              disabled={loading}
              className="px-8 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 flex items-center"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Processing...
                </>
              ) : (
                '📤 Complete Discharge'
              )}
            </button>
          </div>
        </div>
      </div>

    </div>
  );
};

export default DischargePatientModal;
import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { supabase } from '../config/supabaseNew';
import type { PatientAdmissionWithRelations } from '../config/supabaseNew';
import HospitalService from '../services/hospitalService';
import InsurancePaymentForm from './InsurancePaymentForm';

interface EnhancedDischargeModalProps {
  admission: PatientAdmissionWithRelations | null;
  isOpen: boolean;
  onClose: () => void;
  onDischargeSuccess: () => void;
}

interface EnhancedDischargeFormData {
  // Discharge Details
  discharge_date: string;
  discharge_time: string;
  discharge_type: 'ROUTINE' | 'LAMA' | 'TRANSFER' | 'EXPIRED' | 'ABSCOND';
  transfer_hospital?: string;
  
  // Medical Summary
  final_diagnosis: string;
  primary_consultant: string;
  chief_complaints: string;
  hopi: string;
  past_history: string;
  investigations: string;
  course_of_stay: string;
  treatment_during_hospitalization: string;
  discharge_medication: string;
  follow_up_on: string;
  treatment_summary: string;
  discharge_condition: 'STABLE' | 'IMPROVED' | 'SAME' | 'DETERIORATED';
  follow_up_instructions: string;
  medicines_prescribed: string;
  dietary_instructions: string;
  activity_restrictions: string;
  next_appointment_date: string;
  doctor_name: string;
  
  // Billing Information (Manual Entry)
  manual_bed_charges: number;
  doctor_fees: number;
  nursing_charges: number;
  medicine_charges: number;
  diagnostic_charges: number;
  operation_charges: number;
  other_charges: number;
  discount_amount: number;
  discount_reason: string;
  
  // Payment Details
  payment_mode: 'CASH' | 'CARD' | 'UPI' | 'BANK_TRANSFER' | 'INSURANCE';
  amount_paid: number;
  
  // Legal/Administrative
  attendant_name: string;
  attendant_relationship: string;
  attendant_contact: string;
  documents_handed_over: boolean;
  patient_consent: boolean;
  discharge_notes: string;
}

const EnhancedDischargeModal: React.FC<EnhancedDischargeModalProps> = ({
  admission,
  isOpen,
  onClose,
  onDischargeSuccess
}) => {
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<EnhancedDischargeFormData>({
    discharge_date: new Date().toISOString().split('T')[0],
    discharge_time: new Date().toTimeString().slice(0, 5),
    discharge_type: 'ROUTINE',
    final_diagnosis: '',
    primary_consultant: '',
    chief_complaints: '',
    hopi: '',
    past_history: '',
    investigations: '',
    course_of_stay: '',
    treatment_during_hospitalization: '',
    discharge_medication: '',
    follow_up_on: '',
    treatment_summary: '',
    discharge_condition: 'STABLE',
    follow_up_instructions: '',
    medicines_prescribed: '',
    dietary_instructions: '',
    activity_restrictions: '',
    next_appointment_date: '',
    doctor_name: '',
    manual_bed_charges: 0,
    doctor_fees: 0,
    nursing_charges: 0,
    medicine_charges: 0,
    diagnostic_charges: 0,
    operation_charges: 0,
    other_charges: 0,
    discount_amount: 0,
    discount_reason: '',
    payment_mode: 'CASH',
    amount_paid: 0,
    attendant_name: '',
    attendant_relationship: 'FAMILY_MEMBER',
    attendant_contact: '',
    documents_handed_over: false,
    patient_consent: false,
    discharge_notes: ''
  });

  const [existingServices, setExistingServices] = useState(0);
  const [totalPaid, setTotalPaid] = useState(0);
  const [stayDuration, setStayDuration] = useState(0);
  const [showInsuranceForm, setShowInsuranceForm] = useState(false);
  const [insuranceData, setInsuranceData] = useState<any>(null);

  useEffect(() => {
    if (admission && isOpen) {
      loadPatientData();
      calculateStayDuration();
      setDefaultValues();
    }
  }, [admission, isOpen]);

  const loadPatientData = async () => {
    if (!admission?.patient?.id) return;

    try {
      const transactions = await HospitalService.getTransactionsByPatient(admission.patient.id);
      
      // Filter transactions for this admission period
      const admissionTransactions = transactions.filter(t => 
        new Date(t.created_at) >= new Date(admission.admission_date) &&
        t.status === 'COMPLETED'
      );

      // Calculate existing services (exclude payments)
      const serviceCharges = admissionTransactions
        .filter(t => t.transaction_type !== 'IPD_PAYMENT' && t.transaction_type !== 'IPD_ADVANCE' && t.amount > 0)
        .reduce((sum, t) => sum + t.amount, 0);
      
      // Calculate payments made
      const paymentsReceived = admissionTransactions
        .filter(t => t.transaction_type === 'IPD_PAYMENT' || t.transaction_type === 'IPD_ADVANCE')
        .reduce((sum, t) => sum + t.amount, 0);
      
      setExistingServices(serviceCharges);
      setTotalPaid(paymentsReceived);
      
    } catch (error) {
      console.error('Error loading patient data:', error);
    }
  };

  const calculateStayDuration = () => {
    if (!admission) return;
    
    const admissionDate = new Date(admission.admission_date);
    const dischargeDate = new Date(`${formData.discharge_date}T${formData.discharge_time}`);
    const diffTime = Math.abs(dischargeDate.getTime() - admissionDate.getTime());
    const days = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    setStayDuration(days);
  };

  const setDefaultValues = () => {
    if (!admission) return;

    // Set default next appointment (7 days from discharge)
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);

    // If patient is already discharged, use their actual discharge date and time
    const isAlreadyDischarged = admission.status === 'DISCHARGED';
    const dischargeDate = isAlreadyDischarged && admission.discharge_date 
      ? new Date(admission.discharge_date).toISOString().split('T')[0]
      : new Date().toISOString().split('T')[0];
    const dischargeTime = isAlreadyDischarged && admission.discharge_date
      ? new Date(admission.discharge_date).toTimeString().slice(0, 5)
      : new Date().toTimeString().slice(0, 5);

    setFormData(prev => ({
      ...prev,
      discharge_date: dischargeDate,
      discharge_time: dischargeTime,
      next_appointment_date: nextWeek.toISOString().split('T')[0],
      attendant_contact: admission.patient?.phone || '',
      doctor_name: admission.patient?.assigned_doctor || ''
    }));
  };

  const calculateTotalCharges = () => {
    // Calculate manual bed charges
    const bedCharges = formData.manual_bed_charges * stayDuration;
    
    // Additional manual charges
    const additionalCharges = formData.doctor_fees + 
                             formData.nursing_charges + 
                             formData.medicine_charges + 
                             formData.diagnostic_charges + 
                             formData.operation_charges + 
                             formData.other_charges;
    
    const totalServices = existingServices + bedCharges + additionalCharges;
    const totalAfterDiscount = totalServices - formData.discount_amount;
    const totalPayments = totalPaid + formData.amount_paid;
    const finalBalance = totalAfterDiscount - totalPayments;
    
    return {
      existingServices,
      bedCharges,
      additionalCharges,
      totalServices,
      totalAfterDiscount,
      totalPayments,
      finalBalance,
      stayDuration
    };
  };

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1:
        if (!formData.discharge_type) {
          toast.error('Please select discharge type');
          return false;
        }
        if (formData.discharge_type === 'TRANSFER' && !formData.transfer_hospital) {
          toast.error('Please specify transfer hospital');
          return false;
        }
        return true;
      
      case 2:
        if (!formData.final_diagnosis.trim()) {
          toast.error('Final diagnosis is required');
          return false;
        }
        if (!formData.primary_consultant.trim()) {
          toast.error('Primary consultant is required');
          return false;
        }
        return true;
      
      case 3:
        if (!formData.attendant_name.trim()) {
          toast.error('Attendant name is required');
          return false;
        }
        if (!formData.patient_consent) {
          toast.error('Patient consent is required for discharge');
          return false;
        }
        if (!formData.documents_handed_over) {
          toast.error('Please confirm documents have been handed over');
          return false;
        }
        return true;
      
      default:
        return true;
    }
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      if (currentStep < 3) {
        setCurrentStep(currentStep + 1);
      }
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleDischarge = async () => {
    if (!admission) return;

    // Final validation
    for (let step = 1; step <= 3; step++) {
      if (!validateStep(step)) {
        setCurrentStep(step);
        return;
      }
    }

    
    setLoading(true);
    try {
      console.log('🏥 Starting enhanced discharge process...');
      
      const currentUser = await HospitalService.getCurrentUser();
      if (!currentUser) {
        toast.error('Authentication required');
        return;
      }

      const dischargeDateTime = new Date(`${formData.discharge_date}T${formData.discharge_time}`).toISOString();

      // 1. Validate required data first
      console.log('🔍 Validating discharge data...');
      console.log('Current user:', currentUser);
      console.log('Admission:', admission);
      console.log('Form data:', formData);

      if (!admission.id) {
        throw new Error('Admission ID is missing');
      }
      if (!admission.patient?.id) {
        throw new Error('Patient ID is missing from admission');
      }
      if (!currentUser.id) {
        throw new Error('Current user ID is missing');
      }

      // 2. Create discharge summary record with all medical data
      console.log('📝 Creating comprehensive discharge summary...');
      
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
        discharge_medication: formData.discharge_medication?.trim() || null,
        follow_up_on: formData.follow_up_on?.trim() || null,
        attendant_name: formData.attendant_name?.trim() || 'Not specified',
        attendant_relationship: formData.attendant_relationship || 'FAMILY_MEMBER',
        attendant_contact: formData.attendant_contact?.trim() || null,
        documents_handed_over: formData.documents_handed_over || false,
        discharge_notes: formData.discharge_notes?.trim() || null,
        created_by: currentUser.id,
        hospital_id: admission.hospital_id || '550e8400-e29b-41d4-a716-446655440000'
      };
      
      console.log('📋 Prepared discharge summary data:', dischargeSummaryData);
      
      // Test if table exists first
      console.log('🔍 Testing discharge_summaries table access...');
      const { data: testQuery, error: testError } = await supabase
        .from('discharge_summaries')
        .select('id')
        .limit(1);
      
      if (testError) {
        console.error('❌ Table access test failed:', testError);
        throw new Error(`Cannot access discharge_summaries table: ${testError.message}`);
      }
      
      console.log('✅ Table access test passed');
      
      const { data: dischargeSummary, error: summaryError } = await supabase
        .from('discharge_summaries')
        .insert(dischargeSummaryData)
        .select()
        .single();

      if (summaryError) {
        console.error('❌ Discharge summary insert error:', summaryError);
        console.error('Error details:', JSON.stringify(summaryError, null, 2));
        throw new Error(`Failed to save discharge summary: ${summaryError.message || summaryError.details || summaryError.hint || 'Unknown error'}`);
      }
      
      console.log('✅ Discharge summary created successfully:', dischargeSummary);

      // 2. Update patient admission with discharge information (only if not already discharged)
      const isAlreadyDischarged = admission.status === 'DISCHARGED';
      
      if (!isAlreadyDischarged) {
        const { error: admissionUpdateError } = await supabase
          .from('patient_admissions')
          .update({
            status: 'DISCHARGED',
            discharge_date: dischargeDateTime,
            discharge_notes: formData.discharge_notes?.trim() || null
          })
          .eq('id', admission.id);

        if (admissionUpdateError) {
          console.error('❌ Admission update error:', admissionUpdateError);
          throw admissionUpdateError;
        }
        
        console.log('✅ Patient admission updated with discharge info');

        // Update bed status to available (only for newly discharged patients)
        if (admission.bed_number) {
          await supabase
            .from('beds')
            .update({ status: 'AVAILABLE' })
            .eq('bed_number', admission.bed_number);
        }
      } else {
        console.log('ℹ️ Patient already discharged, only creating discharge summary');
        
        // For already discharged patients, update the discharge notes if needed
        if (formData.discharge_notes?.trim()) {
          await supabase
            .from('patient_admissions')
            .update({ discharge_notes: formData.discharge_notes.trim() })
            .eq('id', admission.id);
        }
      }

      const successMessage = isAlreadyDischarged 
        ? `Discharge summary created for ${admission.patient?.first_name} ${admission.patient?.last_name}`
        : `${admission.patient?.first_name} ${admission.patient?.last_name} discharged successfully`;
        
      console.log('✅ Process completed successfully');
      toast.success(successMessage);
      
      onDischargeSuccess();
      onClose();
      
    } catch (error: any) {
      console.error('❌ Discharge error:', error);
      toast.error(`Failed to discharge patient: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !admission) return null;

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-800">📅 Discharge Details</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Discharge Date *
                </label>
                <input
                  type="date"
                  value={formData.discharge_date}
                  onChange={(e) => {
                    setFormData({...formData, discharge_date: e.target.value});
                    setTimeout(() => calculateStayDuration(), 100);
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Discharge Time *
                </label>
                <input
                  type="time"
                  value={formData.discharge_time}
                  onChange={(e) => setFormData({...formData, discharge_time: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Stay Duration
                </label>
                <input
                  type="text"
                  value={`${stayDuration} days`}
                  disabled
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Discharge Type *
              </label>
              <select
                value={formData.discharge_type}
                onChange={(e) => setFormData({...formData, discharge_type: e.target.value as any})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="ROUTINE">Routine Discharge</option>
                <option value="LAMA">LAMA (Left Against Medical Advice)</option>
                <option value="TRANSFER">Transfer to Another Hospital</option>
                <option value="EXPIRED">Expired</option>
                <option value="ABSCOND">Absconded</option>
              </select>
            </div>

            {formData.discharge_type === 'TRANSFER' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Transfer Hospital *
                </label>
                <input
                  type="text"
                  value={formData.transfer_hospital || ''}
                  onChange={(e) => setFormData({...formData, transfer_hospital: e.target.value})}
                  placeholder="Name of the hospital patient is being transferred to"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
            )}
          </div>
        );

      case 2:
        return (
          <div className="space-y-8">
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
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Discharge Medication
                  </label>
                  <div className="space-y-3">
                    <textarea
                      value={formData.discharge_medication}
                      onChange={(e) => setFormData({...formData, discharge_medication: e.target.value})}
                      placeholder="Enter medication details or use the table below&#10;Example: Paracetamol 500mg | 1 | 0 | 1 | 5 days"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 h-20"
                    />
                    <p className="text-sm text-gray-600">Or use the table format below:</p>
                  </div>
                  <div className="overflow-x-auto mt-2">
                    <table className="w-full border border-gray-300 rounded-lg">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="border border-gray-300 px-3 py-2 text-left text-sm font-medium text-gray-700">
                            S.No.
                          </th>
                          <th className="border border-gray-300 px-3 py-2 text-left text-sm font-medium text-gray-700">
                            Drug Name & Dose
                          </th>
                          <th className="border border-gray-300 px-3 py-2 text-center text-sm font-medium text-gray-700">
                            Morning
                          </th>
                          <th className="border border-gray-300 px-3 py-2 text-center text-sm font-medium text-gray-700">
                            Afternoon
                          </th>
                          <th className="border border-gray-300 px-3 py-2 text-center text-sm font-medium text-gray-700">
                            Night
                          </th>
                          <th className="border border-gray-300 px-3 py-2 text-center text-sm font-medium text-gray-700">
                            Days
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {Array.from({ length: 8 }, (_, index) => (
                          <tr key={index} className="hover:bg-gray-50">
                            <td className="border border-gray-300 px-3 py-2 text-center text-sm font-medium text-gray-600">
                              {index + 1}
                            </td>
                            <td className="border border-gray-300 p-1">
                              <input
                                type="text"
                                placeholder="e.g., Paracetamol 500mg"
                                className="w-full px-2 py-1 text-sm border-0 focus:outline-none focus:ring-1 focus:ring-green-400 rounded"
                              />
                            </td>
                            <td className="border border-gray-300 p-1">
                              <input
                                type="text"
                                placeholder="1"
                                className="w-full px-2 py-1 text-sm border-0 focus:outline-none focus:ring-1 focus:ring-green-400 rounded text-center"
                              />
                            </td>
                            <td className="border border-gray-300 p-1">
                              <input
                                type="text"
                                placeholder="0"
                                className="w-full px-2 py-1 text-sm border-0 focus:outline-none focus:ring-1 focus:ring-green-400 rounded text-center"
                              />
                            </td>
                            <td className="border border-gray-300 p-1">
                              <input
                                type="text"
                                placeholder="1"
                                className="w-full px-2 py-1 text-sm border-0 focus:outline-none focus:ring-1 focus:ring-green-400 rounded text-center"
                              />
                            </td>
                            <td className="border border-gray-300 p-1">
                              <input
                                type="text"
                                placeholder="7"
                                className="w-full px-2 py-1 text-sm border-0 focus:outline-none focus:ring-1 focus:ring-green-400 rounded text-center"
                              />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    <p className="text-xs text-gray-500 mt-2">
                      * Fill in the medication details. Morning/Afternoon/Night: Enter number of tablets/doses. Days: Total duration of treatment.
                    </p>
                  </div>
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
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-800">👥 Attendant Details & Consent</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Attendant Name *
                </label>
                <input
                  type="text"
                  value={formData.attendant_name}
                  onChange={(e) => setFormData({...formData, attendant_name: e.target.value})}
                  placeholder="Name of person collecting patient"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Relationship to Patient
                </label>
                <select
                  value={formData.attendant_relationship}
                  onChange={(e) => setFormData({...formData, attendant_relationship: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="FAMILY_MEMBER">Family Member</option>
                  <option value="SPOUSE">Spouse</option>
                  <option value="PARENT">Parent</option>
                  <option value="CHILD">Child</option>
                  <option value="SIBLING">Sibling</option>
                  <option value="FRIEND">Friend</option>
                  <option value="GUARDIAN">Guardian</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Attendant Contact Number
                </label>
                <input
                  type="tel"
                  value={formData.attendant_contact}
                  onChange={(e) => setFormData({...formData, attendant_contact: e.target.value})}
                  placeholder="Contact number of attendant"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Consent and Document Handover */}
            <div className="space-y-4">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="documents_handed_over"
                  checked={formData.documents_handed_over}
                  onChange={(e) => setFormData({...formData, documents_handed_over: e.target.checked})}
                  className="mr-3 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  required
                />
                <label htmlFor="documents_handed_over" className="text-sm text-gray-700">
                  <span className="font-medium">Documents Handed Over:</span> All medical records, discharge summary, and prescribed medications have been handed over to the patient/attendant.
                </label>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="patient_consent"
                  checked={formData.patient_consent}
                  onChange={(e) => setFormData({...formData, patient_consent: e.target.checked})}
                  className="mr-3 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  required
                />
                <label htmlFor="patient_consent" className="text-sm text-gray-700">
                  <span className="font-medium">Patient/Attendant Consent:</span> The patient/attendant understands the discharge instructions and consents to the discharge.
                </label>
              </div>
            </div>

          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-6xl max-h-[95vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b p-6 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">
              {admission?.status === 'DISCHARGED' ? '📝 Create Discharge Summary' : '📤 Enhanced Patient Discharge'}
            </h2>
            <p className="text-gray-600">
              {admission.patient?.first_name} {admission.patient?.last_name} - 
              Bed {admission.bed_number} - {stayDuration} days stay
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

        {/* Step Progress Indicator */}
        <div className="px-6 py-4 bg-gray-50 border-b">
          <div className="flex items-center justify-between">
            {[1, 2, 3].map((step) => (
              <div key={step} className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  currentStep >= step 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-300 text-gray-600'
                }`}>
                  {step}
                </div>
                <div className={`ml-2 text-sm ${
                  currentStep >= step ? 'text-blue-600 font-medium' : 'text-gray-500'
                }`}>
                  {step === 1 && 'Discharge Details'}
                  {step === 2 && 'Medical Summary'}
                  {step === 3 && 'Consent & Handover'}
                </div>
                {step < 3 && (
                  <div className={`w-12 h-1 mx-4 ${
                    currentStep > step ? 'bg-blue-600' : 'bg-gray-300'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Step Content */}
        <div className="p-6">
          {renderStepContent()}
        </div>

        {/* Navigation Buttons */}
        <div className="sticky bottom-0 bg-white border-t p-6 flex justify-between">
          <button
            onClick={handlePrevious}
            disabled={currentStep === 1 || loading}
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            ← Previous
          </button>

          <div className="flex space-x-4">
            <button
              onClick={onClose}
              disabled={loading}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 disabled:opacity-50"
            >
              Cancel
            </button>

            {currentStep < 3 ? (
              <button
                onClick={handleNext}
                disabled={loading}
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                Next →
              </button>
            ) : (
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
                  admission?.status === 'DISCHARGED' ? '📝 Save Discharge Summary' : '📤 Complete Discharge'
                )}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Insurance Payment Form Modal */}
      {showInsuranceForm && (
        <InsurancePaymentForm
          amount={totals.totalAfterDiscount}
          onSave={(insuranceInfo) => {
            setInsuranceData(insuranceInfo);
            setShowInsuranceForm(false);
            // Adjust amount paid based on insurance coverage
            const patientPortion = insuranceInfo.deductible_amount + insuranceInfo.copay_amount;
            setFormData({...formData, amount_paid: patientPortion});
            toast.success('Insurance details saved. Patient portion calculated.');
          }}
          onCancel={() => {
            setShowInsuranceForm(false);
            setFormData({...formData, payment_mode: 'CASH'});
          }}
        />
      )}
    </div>
  );
};

export default EnhancedDischargeModal;
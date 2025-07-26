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

    setFormData(prev => ({
      ...prev,
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
        if (!formData.treatment_summary.trim()) {
          toast.error('Treatment summary is required');
          return false;
        }
        return true;
      
      case 3:
        if (formData.manual_bed_charges < 0) {
          toast.error('Bed charges cannot be negative');
          return false;
        }
        return true;
      
      case 4:
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
      if (currentStep < 4) {
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
    for (let step = 1; step <= 4; step++) {
      if (!validateStep(step)) {
        setCurrentStep(step);
        return;
      }
    }

    const totals = calculateTotalCharges();
    
    setLoading(true);
    try {
      console.log('🏥 Starting enhanced discharge process...');
      
      const currentUser = await HospitalService.getCurrentUser();
      if (!currentUser) {
        toast.error('Authentication required');
        return;
      }

      const dischargeDateTime = new Date(`${formData.discharge_date}T${formData.discharge_time}`).toISOString();

      // 1. Create comprehensive discharge summary
      const dischargeSummaryData = {
        admission_id: admission.id,
        patient_id: admission.patient?.id,
        discharge_date: dischargeDateTime,
        discharge_type: formData.discharge_type,
        transfer_hospital: formData.transfer_hospital || null,
        final_diagnosis: formData.final_diagnosis.trim(),
        treatment_summary: formData.treatment_summary.trim(),
        discharge_condition: formData.discharge_condition,
        follow_up_instructions: formData.follow_up_instructions.trim() || null,
        medicines_prescribed: formData.medicines_prescribed.trim() || null,
        dietary_instructions: formData.dietary_instructions.trim() || null,
        activity_restrictions: formData.activity_restrictions.trim() || null,
        next_appointment_date: formData.next_appointment_date || null,
        doctor_name: formData.doctor_name.trim() || null,
        attendant_name: formData.attendant_name.trim(),
        attendant_relationship: formData.attendant_relationship,
        attendant_contact: formData.attendant_contact.trim() || null,
        documents_handed_over: formData.documents_handed_over,
        discharge_notes: formData.discharge_notes.trim() || null,
        stay_duration: stayDuration,
        created_by: currentUser.id,
        hospital_id: admission.hospital_id || '550e8400-e29b-41d4-a716-446655440000'
      };
      
      const { data: dischargeSummary, error: summaryError } = await supabase
        .from('discharge_summaries')
        .insert(dischargeSummaryData)
        .select()
        .single();

      if (summaryError) {
        console.error('❌ Discharge summary error:', summaryError);
        throw summaryError;
      }
      
      console.log('✅ Discharge summary created:', dischargeSummary);

      // 2. Create manual bed charges transaction if specified
      if (formData.manual_bed_charges > 0) {
        await HospitalService.createTransaction({
          patient_id: admission.patient?.id,
          transaction_type: 'ACCOMMODATION',
          amount: totals.bedCharges,
          description: `Manual Bed Charges - ${stayDuration} days @ ₹${formData.manual_bed_charges}/day`,
          payment_mode: 'CASH',
          status: 'COMPLETED'
        });
      }

      // 3. Create additional charge transactions
      const additionalCharges = [
        { type: 'PROCEDURE', amount: formData.doctor_fees, desc: 'Doctor Fees - Discharge' },
        { type: 'NURSING', amount: formData.nursing_charges, desc: 'Additional Nursing Charges' },
        { type: 'MEDICINE', amount: formData.medicine_charges, desc: 'Medicine Charges - Discharge' },
        { type: 'DIAGNOSTIC', amount: formData.diagnostic_charges, desc: 'Diagnostic Charges' },
        { type: 'PROCEDURE', amount: formData.operation_charges, desc: 'Operation/Procedure Charges' },
        { type: 'OTHER', amount: formData.other_charges, desc: 'Other Charges' }
      ];

      for (const charge of additionalCharges) {
        if (charge.amount > 0) {
          await HospitalService.createTransaction({
            patient_id: admission.patient?.id,
            transaction_type: charge.type,
            amount: charge.amount,
            description: charge.desc,
            payment_mode: 'CASH',
            status: 'COMPLETED'
          });
        }
      }

      // 4. Create comprehensive discharge bill
      const { data: dischargeBill, error: billError } = await supabase
        .from('discharge_bills')
        .insert({
          admission_id: admission.id,
          patient_id: admission.patient?.id,
          discharge_summary_id: dischargeSummary.id,
          existing_services: totals.existingServices,
          manual_bed_charges: totals.bedCharges,
          doctor_fees: formData.doctor_fees,
          nursing_charges: formData.nursing_charges,
          medicine_charges: formData.medicine_charges,
          diagnostic_charges: formData.diagnostic_charges,
          operation_charges: formData.operation_charges,
          other_charges: formData.other_charges,
          total_charges: totals.totalServices,
          discount_amount: formData.discount_amount,
          discount_reason: formData.discount_reason || null,
          net_amount: totals.totalAfterDiscount,
          previous_payments: totalPaid,
          final_payment: formData.amount_paid,
          total_paid: totals.totalPayments,
          balance_amount: totals.finalBalance,
          payment_mode: formData.payment_mode,
          stay_duration: stayDuration,
          created_by: currentUser.id,
          hospital_id: admission.hospital_id
        })
        .select()
        .single();

      if (billError) {
        console.error('❌ Discharge bill error:', billError);
        throw billError;
      }
      
      console.log('✅ Final discharge bill created:', dischargeBill);

      // 5. Create final payment transaction if amount is being paid
      if (formData.amount_paid > 0) {
        await HospitalService.createTransaction({
          patient_id: admission.patient?.id,
          transaction_type: 'IPD_PAYMENT',
          amount: formData.amount_paid,
          description: `Final IPD Payment - Discharge Settlement (Bill: ${dischargeBill.id})`,
          payment_mode: formData.payment_mode,
          status: 'COMPLETED'
        });
      }

      // 6. Update admission status and discharge details
      const { error: admissionError } = await supabase
        .from('patient_admissions')
        .update({
          status: 'DISCHARGED',
          actual_discharge_date: dischargeDateTime,
          total_amount: totals.totalServices,
          amount_paid: totals.totalPayments,
          balance_amount: totals.finalBalance
        })
        .eq('id', admission.id);

      if (admissionError) {
        console.error('❌ Admission update error:', admissionError);
        throw admissionError;
      }

      // 7. Update bed status to available
      if (admission.bed_number) {
        await supabase
          .from('beds')
          .update({ status: 'AVAILABLE' })
          .eq('bed_number', admission.bed_number);
      }

      console.log('✅ Patient discharged successfully');
      toast.success(`${admission.patient?.first_name} ${admission.patient?.last_name} discharged successfully`);
      
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

  const totals = calculateTotalCharges();

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
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-800">🏥 Medical Summary</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Final Diagnosis *
                </label>
                <textarea
                  value={formData.final_diagnosis}
                  onChange={(e) => setFormData({...formData, final_diagnosis: e.target.value})}
                  placeholder="Primary and secondary diagnoses"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 h-20"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Treatment Summary *
                </label>
                <textarea
                  value={formData.treatment_summary}
                  onChange={(e) => setFormData({...formData, treatment_summary: e.target.value})}
                  placeholder="Summary of treatment provided during stay"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 h-20"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Discharge Condition
                </label>
                <select
                  value={formData.discharge_condition}
                  onChange={(e) => setFormData({...formData, discharge_condition: e.target.value as any})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="STABLE">Stable</option>
                  <option value="IMPROVED">Improved</option>
                  <option value="SAME">Same as admission</option>
                  <option value="DETERIORATED">Deteriorated</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Attending Doctor
                </label>
                <input
                  type="text"
                  value={formData.doctor_name}
                  onChange={(e) => setFormData({...formData, doctor_name: e.target.value})}
                  placeholder="Doctor name"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Medicines Prescribed at Discharge
                </label>
                <textarea
                  value={formData.medicines_prescribed}
                  onChange={(e) => setFormData({...formData, medicines_prescribed: e.target.value})}
                  placeholder="List of medications with dosage and duration"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 h-20"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Follow-up Instructions
                </label>
                <textarea
                  value={formData.follow_up_instructions}
                  onChange={(e) => setFormData({...formData, follow_up_instructions: e.target.value})}
                  placeholder="Follow-up care instructions and appointments"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 h-20"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Dietary Instructions
                </label>
                <textarea
                  value={formData.dietary_instructions}
                  onChange={(e) => setFormData({...formData, dietary_instructions: e.target.value})}
                  placeholder="Special dietary requirements or restrictions"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Activity Restrictions
                </label>
                <textarea
                  value={formData.activity_restrictions}
                  onChange={(e) => setFormData({...formData, activity_restrictions: e.target.value})}
                  placeholder="Physical activity limitations or restrictions"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Next Appointment Date
                </label>
                <input
                  type="date"
                  value={formData.next_appointment_date}
                  onChange={(e) => setFormData({...formData, next_appointment_date: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Additional Discharge Notes
                </label>
                <textarea
                  value={formData.discharge_notes}
                  onChange={(e) => setFormData({...formData, discharge_notes: e.target.value})}
                  placeholder="Any additional notes or special instructions"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                />
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-800">💰 Final Bill Summary</h3>
            
            {/* Manual Bed Charges Section */}
            <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
              <h4 className="font-medium text-yellow-800 mb-3">Manual Bed Charges Entry</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Per Day Bed Rate (₹)
                  </label>
                  <input
                    type="number"
                    value={formData.manual_bed_charges}
                    onChange={(e) => {
                      setFormData({...formData, manual_bed_charges: Number(e.target.value) || 0});
                      setTimeout(() => calculateStayDuration(), 100);
                    }}
                    placeholder="Enter per day bed charges"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
                    min="0"
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
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Total Bed Charges
                  </label>
                  <input
                    type="text"
                    value={`₹${totals.bedCharges.toLocaleString()}`}
                    disabled
                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 font-bold"
                  />
                </div>
              </div>
            </div>

            {/* Additional Charges */}
            <div>
              <h4 className="font-medium text-gray-800 mb-3">Additional Charges</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Doctor Fees (₹)
                  </label>
                  <input
                    type="number"
                    value={formData.doctor_fees}
                    onChange={(e) => setFormData({...formData, doctor_fees: Number(e.target.value) || 0})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    min="0"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Additional Nursing Charges (₹)
                  </label>
                  <input
                    type="number"
                    value={formData.nursing_charges}
                    onChange={(e) => setFormData({...formData, nursing_charges: Number(e.target.value) || 0})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    min="0"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Medicine Charges (₹)
                  </label>
                  <input
                    type="number"
                    value={formData.medicine_charges}
                    onChange={(e) => setFormData({...formData, medicine_charges: Number(e.target.value) || 0})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    min="0"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Diagnostic Charges (₹)
                  </label>
                  <input
                    type="number"
                    value={formData.diagnostic_charges}
                    onChange={(e) => setFormData({...formData, diagnostic_charges: Number(e.target.value) || 0})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    min="0"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Operation/Procedure Charges (₹)
                  </label>
                  <input
                    type="number"
                    value={formData.operation_charges}
                    onChange={(e) => setFormData({...formData, operation_charges: Number(e.target.value) || 0})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    min="0"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Other Charges (₹)
                  </label>
                  <input
                    type="number"
                    value={formData.other_charges}
                    onChange={(e) => setFormData({...formData, other_charges: Number(e.target.value) || 0})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    min="0"
                  />
                </div>
              </div>
            </div>

            {/* Discount Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Discount Amount (₹)
                </label>
                <input
                  type="number"
                  value={formData.discount_amount}
                  onChange={(e) => setFormData({...formData, discount_amount: Number(e.target.value) || 0})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min="0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Discount Reason
                </label>
                <input
                  type="text"
                  value={formData.discount_reason}
                  onChange={(e) => setFormData({...formData, discount_reason: e.target.value})}
                  placeholder="Reason for discount"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Bill Summary */}
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <h4 className="font-medium text-blue-800 mb-3">Bill Summary</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-blue-600">Existing Services:</span>
                  <div className="font-bold">₹{totals.existingServices.toLocaleString()}</div>
                </div>
                <div>
                  <span className="text-blue-600">Bed Charges:</span>
                  <div className="font-bold">₹{totals.bedCharges.toLocaleString()}</div>
                </div>
                <div>
                  <span className="text-blue-600">Additional Charges:</span>
                  <div className="font-bold">₹{totals.additionalCharges.toLocaleString()}</div>
                </div>
                <div>
                  <span className="text-blue-600">After Discount:</span>
                  <div className="font-bold">₹{totals.totalAfterDiscount.toLocaleString()}</div>
                </div>
                <div>
                  <span className="text-blue-600">Previous Payments:</span>
                  <div className="font-bold text-green-600">₹{totalPaid.toLocaleString()}</div>
                </div>
                <div>
                  <span className="text-blue-600">Final Payment:</span>
                  <div className="font-bold text-green-600">₹{formData.amount_paid.toLocaleString()}</div>
                </div>
                <div>
                  <span className="text-blue-600">Total Payments:</span>
                  <div className="font-bold text-green-600">₹{totals.totalPayments.toLocaleString()}</div>
                </div>
                <div>
                  <span className="text-blue-600">Final Balance:</span>
                  <div className={`font-bold ${totals.finalBalance >= 0 ? 'text-orange-600' : 'text-red-600'}`}>
                    ₹{totals.finalBalance.toLocaleString()}
                  </div>
                </div>
              </div>
            </div>

            {/* Payment Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Payment Mode
                </label>
                <select
                  value={formData.payment_mode}
                  onChange={(e) => {
                    const mode = e.target.value as any;
                    setFormData({...formData, payment_mode: mode});
                    if (mode === 'INSURANCE') {
                      setShowInsuranceForm(true);
                    }
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="CASH">Cash</option>
                  <option value="CARD">Credit/Debit Card</option>
                  <option value="UPI">UPI</option>
                  <option value="BANK_TRANSFER">Bank Transfer</option>
                  <option value="INSURANCE">Insurance</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Final Payment Amount (₹)
                </label>
                <input
                  type="number"
                  value={formData.amount_paid}
                  onChange={(e) => setFormData({...formData, amount_paid: Number(e.target.value) || 0})}
                  placeholder="Amount being paid now"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min="0"
                />
              </div>
            </div>
          </div>
        );

      case 4:
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

            {/* Final Balance Warning */}
            {totals.finalBalance > 0 && (
              <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                <div className="flex items-center">
                  <div className="text-orange-600 mr-3">⚠️</div>
                  <div>
                    <h4 className="font-medium text-orange-800">Outstanding Balance</h4>
                    <p className="text-sm text-orange-700">
                      There is an outstanding balance of ₹{totals.finalBalance.toLocaleString()}. 
                      The patient can settle this amount later or make a partial payment now.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {totals.finalBalance < 0 && (
              <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                <div className="flex items-center">
                  <div className="text-green-600 mr-3">💰</div>
                  <div>
                    <h4 className="font-medium text-green-800">Refund Due</h4>
                    <p className="text-sm text-green-700">
                      There is a refund amount of ₹{Math.abs(totals.finalBalance).toLocaleString()} due to the patient.
                    </p>
                  </div>
                </div>
              </div>
            )}
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
              📤 Enhanced Patient Discharge
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
            {[1, 2, 3, 4].map((step) => (
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
                  {step === 3 && 'Final Bill'}
                  {step === 4 && 'Consent & Handover'}
                </div>
                {step < 4 && (
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

            {currentStep < 4 ? (
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
                  '📤 Complete Discharge'
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
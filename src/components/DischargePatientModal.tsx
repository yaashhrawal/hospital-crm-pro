import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { supabase } from '../config/supabaseNew';
import type { PatientAdmissionWithRelations } from '../config/supabaseNew';
import HospitalService from '../services/hospitalService';
import InsurancePaymentForm from './InsurancePaymentForm';

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
  discharge_medication: string;
  follow_up_on: string;
  
  // Billing Information
  doctor_fees: number;
  nursing_charges: number;
  medicine_charges: number;
  diagnostic_charges: number;
  operation_charges: number;
  other_charges: number;
  discount_amount: number;
  insurance_covered: number;
  
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
    discharge_medication: '',
    follow_up_on: '',
    doctor_fees: 0,
    nursing_charges: 0,
    medicine_charges: 0,
    diagnostic_charges: 0,
    operation_charges: 0,
    other_charges: 0,
    discount_amount: 0,
    insurance_covered: 0,
    payment_mode: 'CASH',
    amount_paid: 0,
    attendant_name: '',
    attendant_relationship: 'FAMILY_MEMBER',
    attendant_contact: '',
    documents_handed_over: false,
    patient_consent: false,
    discharge_notes: ''
  });

  const [existingCharges, setExistingCharges] = useState(0);
  const [totalPaid, setTotalPaid] = useState(0);
  const [balanceDue, setBalanceDue] = useState(0);
  const [patientTransactions, setPatientTransactions] = useState<any[]>([]);
  const [stayDuration, setStayDuration] = useState(0);
  const [showInsuranceForm, setShowInsuranceForm] = useState(false);
  const [insuranceData, setInsuranceData] = useState<any>(null);

  useEffect(() => {
    if (admission && isOpen) {
      loadPatientCharges();
      calculateStayDuration();
      setDefaultValues();
    }
  }, [admission, isOpen]);

  const loadPatientCharges = async () => {
    if (!admission?.patient?.id) return;

    try {
      const transactions = await HospitalService.getTransactionsByPatient(admission.patient.id);
      
      // Filter transactions after admission date
      const admissionTransactions = transactions.filter(t => 
        new Date(t.created_at) >= new Date(admission.admission_date) &&
        t.status === 'COMPLETED'
      );

      setPatientTransactions(admissionTransactions);
      
      // Calculate totals for service-based charges
      const serviceCharges = admissionTransactions
        .filter(t => t.transaction_type !== 'IPD_PAYMENT' && t.amount > 0)
        .reduce((sum, t) => sum + t.amount, 0);
      
      const paymentsReceived = admissionTransactions
        .filter(t => t.transaction_type === 'IPD_PAYMENT')
        .reduce((sum, t) => sum + t.amount, 0);
      
      setExistingCharges(serviceCharges);
      setTotalPaid(paymentsReceived);
      setBalanceDue(serviceCharges - paymentsReceived);
      
    } catch (error: any) {
      console.error('Error loading patient charges:', error);
    }
  };

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
      attendant_contact: admission.patient?.phone || '',
      // Set amount paid to current balance due if any outstanding
      amount_paid: balanceDue > 0 ? balanceDue : 0
    }));
  };

  const calculateTotalCharges = () => {
    // New discharge charges (if any additional charges)
    const additionalCharges = formData.doctor_fees + 
                             formData.nursing_charges + 
                             formData.medicine_charges + 
                             formData.diagnostic_charges + 
                             formData.operation_charges + 
                             formData.other_charges;
    
    const totalServices = existingCharges + additionalCharges;
    const totalAfterDeductions = totalServices - formData.discount_amount - formData.insurance_covered;
    const grandTotal = totalAfterDeductions;
    const totalPayments = totalPaid + formData.amount_paid;
    const finalBalance = grandTotal - totalPayments;
    
    return {
      existingCharges,
      additionalCharges,
      totalServices,
      totalAfterDeductions: grandTotal,
      totalPayments,
      finalBalance,
      currentBalance: balanceDue
    };
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

    const totals = calculateTotalCharges();
    
    // Check if there's a balance and final payment is required
    if (totals.finalBalance > 0 && formData.amount_paid < totals.finalBalance) {
      const confirmDischarge = window.confirm(
        `There is a pending balance of ₹${totals.finalBalance.toLocaleString()}. ` +
        `Do you want to proceed with discharge? The patient can settle this later.`
      );
      if (!confirmDischarge) {
        return;
      }
    }

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
        discharge_medication: formData.discharge_medication?.trim() || null,
        follow_up_on: formData.follow_up_on?.trim() || null,
        attendant_name: formData.attendant_name?.trim() || 'Not specified',
        attendant_relationship: formData.attendant_relationship || 'FAMILY_MEMBER',
        attendant_contact: formData.attendant_contact?.trim() || null,
        documents_handed_over: formData.documents_handed_over || false,
        discharge_notes: formData.discharge_notes?.trim() || null,
        created_by: currentUser.id,
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

      // 2. Create final discharge bill (comprehensive summary)
      console.log('💰 Creating final discharge bill...');
      const { data: dischargeBill, error: billError } = await supabase
        .from('discharge_bills')
        .insert({
          admission_id: admission.id,
          patient_id: admission.patient?.id,
          discharge_summary_id: dischargeSummary.id,
          doctor_fees: formData.doctor_fees,
          nursing_charges: formData.nursing_charges,
          medicine_charges: formData.medicine_charges,
          diagnostic_charges: formData.diagnostic_charges,
          operation_charges: formData.operation_charges,
          other_charges: formData.other_charges,
          existing_services: totals.existingCharges, // Services rendered during stay
          total_charges: totals.totalServices,
          discount_amount: formData.discount_amount,
          insurance_covered: formData.insurance_covered,
          net_amount: totals.totalAfterDeductions,
          previous_payments: totalPaid, // Partial payments made
          final_payment: formData.amount_paid, // Final payment at discharge
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

      // 3. Create additional service transactions if any new charges
      if (totals.additionalCharges > 0) {
        console.log('🔬 Creating additional service transactions...');
        
        const additionalServices = [];
        if (formData.doctor_fees > 0) {
          additionalServices.push({
            patient_id: admission.patient?.id,
            transaction_type: 'PROCEDURE',
            amount: formData.doctor_fees,
            description: 'Doctor Fees - Discharge',
            payment_mode: 'CASH',
            status: 'COMPLETED'
          });
        }
        
        if (formData.nursing_charges > 0) {
          additionalServices.push({
            patient_id: admission.patient?.id,
            transaction_type: 'NURSING',
            amount: formData.nursing_charges,
            description: 'Additional Nursing Charges',
            payment_mode: 'CASH',
            status: 'COMPLETED'
          });
        }
        
        if (formData.medicine_charges > 0) {
          additionalServices.push({
            patient_id: admission.patient?.id,
            transaction_type: 'MEDICINE',
            amount: formData.medicine_charges,
            description: 'Medicine Charges - Discharge',
            payment_mode: 'CASH',
            status: 'COMPLETED'
          });
        }
        
        // Add other charges as needed...
        
        if (additionalServices.length > 0) {
          for (const service of additionalServices) {
            await HospitalService.createTransaction(service);
          }
        }
      }

      // 4. Create final payment transaction if amount is being paid
      if (formData.amount_paid > 0) {
        console.log('💳 Creating final payment transaction...');
        await HospitalService.createTransaction({
          patient_id: admission.patient?.id,
          transaction_type: 'IPD_PAYMENT',
          amount: formData.amount_paid,
          description: `Final IPD Payment - Discharge Settlement (Bill: ${dischargeBill.id})`,
          payment_mode: formData.payment_mode,
          status: 'COMPLETED'
        });
        
        console.log('✅ Final payment transaction created successfully');
      }

      // 4. Update admission status only
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

      // 5. Update bed status to available
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

  const totals = calculateTotalCharges();

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
                  Discharge Medication
                </label>
                <div className="space-y-2">
                  <p className="text-sm text-gray-600">Enter medication details in the format: Drug Name & Dose | Morning | Afternoon | Night | Days</p>
                  <textarea
                    value={formData.discharge_medication}
                    onChange={(e) => setFormData({...formData, discharge_medication: e.target.value})}
                    placeholder="Example: Paracetamol 500mg | 1 | 0 | 1 | 5 days\nAmoxicillin 250mg | 1 | 1 | 1 | 7 days"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 h-32"
                  />
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

          {/* Billing Section */}
          <div className="bg-green-50 p-6 rounded-lg border-2 border-green-200">
            <h3 className="text-lg font-semibold text-green-800 mb-4">💰 Comprehensive Billing</h3>
            
            {/* Existing charges display */}
            <div className="mb-4 p-4 bg-white rounded border">
              <h4 className="font-medium text-gray-700 mb-2">Previous Charges During Stay</h4>
              <div className="text-2xl font-bold text-green-600">₹{existingCharges.toLocaleString()}</div>
              {patientTransactions.length > 0 && (
                <div className="text-sm text-gray-600 mt-1">
                  {patientTransactions.length} transactions recorded
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Bed Charges ({stayDuration} days)
                </label>
                <input
                  type="number"
                  value={formData.nursing_charges}
                  onChange={(e) => setFormData({...formData, nursing_charges: Number(e.target.value)})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Doctor Fees
                </label>
                <input
                  type="number"
                  value={formData.doctor_fees}
                  onChange={(e) => setFormData({...formData, doctor_fees: Number(e.target.value)})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Medicine Charges
                </label>
                <input
                  type="number"
                  value={formData.medicine_charges}
                  onChange={(e) => setFormData({...formData, medicine_charges: Number(e.target.value)})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Diagnostic Charges
                </label>
                <input
                  type="number"
                  value={formData.diagnostic_charges}
                  onChange={(e) => setFormData({...formData, diagnostic_charges: Number(e.target.value)})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Operation Charges
                </label>
                <input
                  type="number"
                  value={formData.operation_charges}
                  onChange={(e) => setFormData({...formData, operation_charges: Number(e.target.value)})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Other Charges
                </label>
                <input
                  type="number"
                  value={formData.other_charges}
                  onChange={(e) => setFormData({...formData, other_charges: Number(e.target.value)})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Discount
                </label>
                <input
                  type="number"
                  value={formData.discount_amount}
                  onChange={(e) => setFormData({...formData, discount_amount: Number(e.target.value)})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Insurance Covered
                </label>
                <input
                  type="number"
                  value={formData.insurance_covered}
                  onChange={(e) => setFormData({...formData, insurance_covered: Number(e.target.value)})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
            </div>

            {/* Billing Summary */}
            <div className="mt-6 p-4 bg-white rounded border-2 border-gray-300">
              <h4 className="font-semibold text-gray-800 mb-3">💳 Billing Summary</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Previous Charges:</span>
                  <div className="font-semibold">₹{totals.existingCharges.toLocaleString()}</div>
                </div>
                <div>
                  <span className="text-gray-600">New Charges:</span>
                  <div className="font-semibold">₹{totals.newCharges.toLocaleString()}</div>
                </div>
                <div>
                  <span className="text-gray-600">Total Before Deductions:</span>
                  <div className="font-semibold">₹{totals.totalBeforeDeductions.toLocaleString()}</div>
                </div>
                <div>
                  <span className="text-gray-600">Net Amount Due:</span>
                  <div className="font-bold text-lg text-green-700">₹{totals.totalAfterDeductions.toLocaleString()}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Payment Section */}
          <div className="bg-purple-50 p-6 rounded-lg border-2 border-purple-200">
            <h3 className="text-lg font-semibold text-purple-800 mb-4">💳 Payment Processing</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
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
                  Amount Paying Now
                </label>
                <input
                  type="number"
                  value={formData.amount_paid}
                  onChange={(e) => setFormData({...formData, amount_paid: Number(e.target.value)})}
                  placeholder={totals.totalAfterDeductions.toString()}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div className="flex items-end">
                <div className="text-sm">
                  <div className="text-gray-600">Balance:</div>
                  <div className={`font-semibold text-lg ${
                    (totals.totalAfterDeductions - formData.amount_paid) > 0 
                      ? 'text-red-600' 
                      : 'text-green-600'
                  }`}>
                    ₹{Math.abs(totals.totalAfterDeductions - formData.amount_paid).toLocaleString()}
                    {(totals.totalAfterDeductions - formData.amount_paid) > 0 ? ' Due' : ' Excess'}
                  </div>
                </div>
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

      {/* Insurance Payment Form Modal */}
      {showInsuranceForm && (
        <InsurancePaymentForm
          amount={totals.totalAfterDeductions}
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

export default DischargePatientModal;
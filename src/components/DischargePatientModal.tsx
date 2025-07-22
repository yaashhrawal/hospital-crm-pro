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
  treatment_summary: string;
  discharge_condition: string;
  follow_up_instructions: string;
  medicines_prescribed: string;
  dietary_instructions: string;
  activity_restrictions: string;
  next_appointment_date: string;
  doctor_name: string;
  
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
  payment_mode: 'CASH' | 'ONLINE' | 'INSURANCE';
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
    treatment_summary: '',
    discharge_condition: 'STABLE',
    follow_up_instructions: '',
    medicines_prescribed: '',
    dietary_instructions: '',
    activity_restrictions: '',
    next_appointment_date: '',
    doctor_name: '',
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
  const [patientTransactions, setPatientTransactions] = useState<any[]>([]);
  const [stayDuration, setStayDuration] = useState(0);

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
      const { data: transactions, error } = await supabase
        .from('patient_transactions')
        .select('*')
        .eq('patient_id', admission.patient.id)
        .eq('status', 'COMPLETED')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setPatientTransactions(transactions || []);
      const totalExisting = transactions?.reduce((sum, t) => sum + (t.amount || 0), 0) || 0;
      setExistingCharges(totalExisting);
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

    // Calculate bed charges based on stay duration and bed daily rate
    const bedDailyRate = admission.bed?.daily_rate || 1000; // Default rate if not found
    const bedCharges = stayDuration * bedDailyRate;

    setFormData(prev => ({
      ...prev,
      nursing_charges: bedCharges,
      next_appointment_date: nextWeek.toISOString().split('T')[0],
      attendant_contact: admission.patient?.phone || ''
    }));
  };

  const calculateTotalCharges = () => {
    const newCharges = formData.doctor_fees + 
                      formData.nursing_charges + 
                      formData.medicine_charges + 
                      formData.diagnostic_charges + 
                      formData.operation_charges + 
                      formData.other_charges;
    
    const totalBeforeDeductions = existingCharges + newCharges;
    const totalAfterDeductions = totalBeforeDeductions - formData.discount_amount - formData.insurance_covered;
    
    return {
      existingCharges,
      newCharges,
      totalBeforeDeductions,
      totalAfterDeductions,
      bedCharges: stayDuration * (admission?.bed?.daily_rate || 1000)
    };
  };

  const handleDischarge = async () => {
    if (!admission) return;

    // Validation
    if (!formData.final_diagnosis.trim()) {
      toast.error('Final diagnosis is required');
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

    const totals = calculateTotalCharges();
    if (formData.amount_paid < totals.totalAfterDeductions) {
      toast.error('Payment amount is less than total charges');
      return;
    }

    setLoading(true);
    try {
      const currentUser = await HospitalService.getCurrentUser();
      if (!currentUser) {
        toast.error('Authentication required');
        return;
      }

      const dischargeDate = new Date().toISOString();

      // 1. Create discharge summary record
      const { data: dischargeSummary, error: summaryError } = await supabase
        .from('discharge_summaries')
        .insert({
          admission_id: admission.id,
          patient_id: admission.patient?.id,
          final_diagnosis: formData.final_diagnosis,
          treatment_summary: formData.treatment_summary,
          discharge_condition: formData.discharge_condition,
          follow_up_instructions: formData.follow_up_instructions,
          medicines_prescribed: formData.medicines_prescribed,
          dietary_instructions: formData.dietary_instructions,
          activity_restrictions: formData.activity_restrictions,
          next_appointment_date: formData.next_appointment_date || null,
          doctor_name: formData.doctor_name,
          attendant_name: formData.attendant_name,
          attendant_relationship: formData.attendant_relationship,
          attendant_contact: formData.attendant_contact,
          documents_handed_over: formData.documents_handed_over,
          discharge_notes: formData.discharge_notes,
          created_by: currentUser.id,
          hospital_id: admission.hospital_id
        })
        .select()
        .single();

      if (summaryError) throw summaryError;

      // 2. Create discharge bill if there are new charges
      if (totals.newCharges > 0) {
        const { error: billError } = await supabase
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
            total_charges: totals.totalBeforeDeductions,
            discount_amount: formData.discount_amount,
            insurance_covered: formData.insurance_covered,
            net_amount: totals.totalAfterDeductions,
            payment_mode: formData.payment_mode,
            amount_paid: formData.amount_paid,
            stay_duration: stayDuration,
            created_by: currentUser.id,
            hospital_id: admission.hospital_id
          });

        if (billError) throw billError;

        // 3. Create final payment transaction if amount is being paid
        if (formData.amount_paid > 0) {
          const { error: transactionError } = await supabase
            .from('patient_transactions')
            .insert({
              patient_id: admission.patient?.id,
              amount: formData.amount_paid,
              payment_mode: formData.payment_mode,
              transaction_type: 'DISCHARGE',
              description: `Discharge payment - Final settlement for ${stayDuration} days stay`,
              status: 'COMPLETED',
              processed_by: currentUser.id,
              hospital_id: admission.hospital_id
            });

          if (transactionError) throw transactionError;
        }
      }

      // 4. Update admission status
      const { error: admissionError } = await supabase
        .from('patient_admissions')
        .update({
          status: 'DISCHARGED',
          actual_discharge_date: dischargeDate.split('T')[0],
          discharge_notes: formData.discharge_notes,
          discharged_by: currentUser.id
        })
        .eq('id', admission.id);

      if (admissionError) throw admissionError;

      // 5. Update bed status
      const { error: bedError } = await supabase
        .from('beds')
        .update({ status: 'AVAILABLE' })
        .eq('id', admission.bed_id);

      if (bedError) throw bedError;

      toast.success('Patient discharged successfully with complete documentation');
      onDischargeSuccess();
      onClose();

    } catch (error: any) {
      console.error('Error during discharge process:', error);
      toast.error(`Failed to discharge patient: ${error.message}`);
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
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Treatment Summary *
                </label>
                <textarea
                  value={formData.treatment_summary}
                  onChange={(e) => setFormData({...formData, treatment_summary: e.target.value})}
                  placeholder="Treatment provided during stay"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 h-20"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Discharge Condition
                </label>
                <select
                  value={formData.discharge_condition}
                  onChange={(e) => setFormData({...formData, discharge_condition: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="STABLE">Stable</option>
                  <option value="IMPROVED">Improved</option>
                  <option value="CRITICAL">Critical</option>
                  <option value="REFERRED">Referred</option>
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
                  placeholder="Dr. Name"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Follow-up Instructions
                </label>
                <textarea
                  value={formData.follow_up_instructions}
                  onChange={(e) => setFormData({...formData, follow_up_instructions: e.target.value})}
                  placeholder="Follow-up care instructions"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 h-20"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Medicines Prescribed
                </label>
                <textarea
                  value={formData.medicines_prescribed}
                  onChange={(e) => setFormData({...formData, medicines_prescribed: e.target.value})}
                  placeholder="List of prescribed medications"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 h-20"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Activity Restrictions
                </label>
                <textarea
                  value={formData.activity_restrictions}
                  onChange={(e) => setFormData({...formData, activity_restrictions: e.target.value})}
                  placeholder="Any activity limitations"
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
                  placeholder="Dietary guidelines"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 h-20"
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
                  onChange={(e) => setFormData({...formData, payment_mode: e.target.value as any})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="CASH">Cash</option>
                  <option value="ONLINE">Online/Card</option>
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
    </div>
  );
};

export default DischargePatientModal;
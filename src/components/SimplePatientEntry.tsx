import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import HospitalService from '../services/hospitalService';
import { supabase } from '../config/supabaseNew';
import type { CreatePatientData } from '../config/supabaseNew';
import useReceiptPrinting from '../hooks/useReceiptPrinting';

const SimplePatientEntry: React.FC = () => {
  const { printConsultationReceipt } = useReceiptPrinting();
  // Helper function to calculate date of birth from age
  const calculateDOBFromAge = (age: string): string => {
    if (!age || isNaN(Number(age))) return '';
    const ageNum = Number(age);
    const today = new Date();
    const birthYear = today.getFullYear() - ageNum;
    return `${birthYear}-01-01`; // Default to January 1st
  };

  // Helper function to calculate age from date of birth
  const calculateAgeFromDOB = (dob: string): string => {
    if (!dob) return '';
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age.toString();
  };

  // Validate if age and DOB match
  const validateAgeAndDOB = (age: string, dob: string): boolean => {
    if (!age || !dob) return true; // If either is empty, no validation needed
    
    const calculatedAge = calculateAgeFromDOB(dob);
    const enteredAge = age.trim();
    
    // Allow 1 year tolerance for approximate DOB
    const ageDiff = Math.abs(Number(calculatedAge) - Number(enteredAge));
    return ageDiff <= 1;
  };
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    phone: '',
    email: '',
    age: '',
    gender: 'MALE',
    address: '',
    patient_tag: '',
    emergency_contact_name: '',
    emergency_contact_phone: '',
    blood_group: '',
    medical_history: '',
    allergies: '',
    date_of_birth: '',
    visit_date: new Date().toISOString().split('T')[0], // Default to today
    // Financial info
    consultation_fee: 0,
    discount_amount: 0,
    discount_reason: '',
    payment_mode: 'CASH' as any, // Default payment mode
    // Admission info
    isAdmitted: false,
    bedNumber: '',
    roomType: 'GENERAL',
    department: 'General',
    dailyRate: 0,
    admissionDate: '',
    expectedDischarge: '',
    admissionNotes: '',
    // Print options
    autoPrintReceipt: true, // Default to auto-print
  });

  const [loading, setLoading] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<string>('Connecting...');
  const [ageError, setAgeError] = useState<string>('');
  const [existingPatient, setExistingPatient] = useState<any>(null);
  const [showExistingPatientPrompt, setShowExistingPatientPrompt] = useState(false);
  const [lastVisitInfo, setLastVisitInfo] = useState<any>(null);

  useEffect(() => {
    testConnection();
  }, []);

  // Check for duplicates when phone or name changes
  useEffect(() => {
    const timer = setTimeout(() => {
      if ((formData.phone && formData.phone.length >= 10) || 
          (formData.first_name && formData.first_name.length >= 3)) {
        checkForDuplicateInBackground();
      }
    }, 1000); // 1 second debounce

    return () => clearTimeout(timer);
  }, [formData.phone, formData.first_name, formData.last_name]);

  const testConnection = async () => {
    try {
      const result = await HospitalService.testConnection();
      setConnectionStatus(result.success ? '🟢 Connected to Supabase' : `🔴 ${result.message}`);
    } catch (error) {
      setConnectionStatus('🔴 Connection failed');
    }
  };

  const checkForExistingPatient = async () => {
    if (!formData.first_name.trim()) return;
    
    try {
      const existing = await HospitalService.findExistingPatient(
        formData.phone,
        formData.first_name,
        formData.last_name
      );
      
      if (existing) {
        setExistingPatient(existing);
        setShowExistingPatientPrompt(true);
      }
    } catch (error) {
      console.error('Error checking for existing patient:', error);
    }
  };

  const checkForDuplicateInBackground = async () => {
    try {
      const existing = await HospitalService.findExistingPatient(
        formData.phone,
        formData.first_name,
        formData.last_name
      );
      
      // Only set if we found a match (don't clear if no match)
      if (existing) {
        setExistingPatient(existing);
      }
    } catch (error) {
      console.error('Background duplicate check error:', error);
    }
  };

  const handleContinueWithExisting = async () => {
    setShowExistingPatientPrompt(false);
    await createVisitForExistingPatient();
  };

  const handleCreateNewPatient = () => {
    setShowExistingPatientPrompt(false);
    setExistingPatient(null);
    handleNewPatientSubmit();
  };

  const createVisitForExistingPatient = async () => {
    if (!existingPatient) return;
    
    setLoading(true);
    try {
      console.log('🏥 Creating new visit for existing patient:', existingPatient.patient_id);
      
      // Create visit record
      const visitData = {
        patient_id: existingPatient.id,
        visit_type: 'Consultation',
        chief_complaint: formData.medical_history || 'General Consultation',
        department: formData.department || 'General',
        visit_date: formData.visit_date || new Date().toISOString().split('T')[0],
        notes: `Visit on ${formData.visit_date || new Date().toLocaleDateString()}`
      };
      
      await HospitalService.createPatientVisit(visitData);
      
      // Create financial transactions
      const totalAmount = formData.consultation_fee - formData.discount_amount;
      
      if (formData.consultation_fee > 0) {
        await HospitalService.createTransaction({
          patient_id: existingPatient.id,
          transaction_type: 'CONSULTATION',
          description: `Consultation Fee - Return Visit`,
          amount: formData.consultation_fee,
          payment_mode: formData.payment_mode,
          status: 'COMPLETED'
        });
      }

      if (formData.discount_amount > 0) {
        await HospitalService.createTransaction({
          patient_id: existingPatient.id,
          transaction_type: 'PROCEDURE',
          description: `Discount Applied: ${formData.discount_reason || 'Return visit discount'}`,
          amount: -formData.discount_amount,
          payment_mode: formData.payment_mode,
          status: 'COMPLETED'
        });
      }
      
      toast.success(`New visit created for ${existingPatient.first_name} ${existingPatient.last_name} - Total: ₹${totalAmount.toLocaleString()}`);
      
      // Auto-print receipt if enabled
      if (formData.autoPrintReceipt && totalAmount > 0) {
        try {
          await printConsultationReceipt(existingPatient.id);
          toast.success('Receipt printed successfully!');
        } catch (printError) {
          console.error('Failed to print receipt:', printError);
          toast.error('Failed to print receipt, but visit was saved successfully');
        }
      }
      
      // Reset form
      resetForm();
      
    } catch (error: any) {
      console.error('🚨 Visit creation failed:', error);
      toast.error(`Failed to create visit: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate minimum required fields
    if (!formData.first_name.trim()) {
      toast.error('First name is required');
      return;
    }

    // Validate age and DOB match
    if (formData.age && formData.date_of_birth && !validateAgeAndDOB(formData.age, formData.date_of_birth)) {
      toast.error('Age does not match Date of Birth. Please correct before submitting.');
      setAgeError('Age does not match Date of Birth. Please check your entries.');
      return;
    }

    setLoading(true);
    
    try {
      // Check for existing patient
      const existing = await HospitalService.findExistingPatient(
        formData.phone,
        formData.first_name,
        formData.last_name
      );
      
      if (existing) {
        setExistingPatient(existing);
        
        // Get last visit info
        try {
          const transactions = await HospitalService.getTransactionsByPatient(existing.id);
          if (transactions.length > 0) {
            const lastTransaction = transactions[0];
            setLastVisitInfo({
              date: new Date(lastTransaction.created_at).toLocaleDateString(),
              type: lastTransaction.transaction_type,
              amount: lastTransaction.amount
            });
          }
        } catch (error) {
          console.error('Error fetching last visit info:', error);
        }
        
        setShowExistingPatientPrompt(true);
        setLoading(false);
      } else {
        // No existing patient found, create new one
        await handleNewPatientSubmit();
      }
    } catch (error) {
      console.error('Error checking for existing patient:', error);
      setLoading(false);
    }
  };

  const handleNewPatientSubmit = async () => {
    setLoading(true);

    try {
      console.log('🚀 Starting patient creation process (WITHOUT transactions)...');
      
      // Create patient data
      const patientData: CreatePatientData = {
        first_name: formData.first_name.trim(),
        last_name: formData.last_name.trim() || undefined,
        phone: formData.phone.trim() || undefined,
        email: formData.email.trim() || undefined,
        date_of_birth: formData.date_of_birth || undefined,
        gender: formData.gender || 'MALE',
        address: formData.address.trim() || undefined,
        patient_tag: formData.patient_tag.trim() || undefined,
        emergency_contact_name: formData.emergency_contact_name.trim() || undefined,
        emergency_contact_phone: formData.emergency_contact_phone.trim() || undefined,
        blood_group: formData.blood_group || undefined,
        medical_history: formData.medical_history.trim() || undefined,
        allergies: formData.allergies.trim() || undefined,
        date_of_entry: formData.visit_date || undefined, // Store the visit date
        hospital_id: '550e8400-e29b-41d4-a716-446655440000'
      };

      console.log('📤 Creating patient with data:', patientData);
      console.log('📅 Form visit_date:', formData.visit_date);
      console.log('📅 Mapped date_of_entry:', patientData.date_of_entry);
      const newPatient = await HospitalService.createPatient(patientData);
      
      console.log('✅ Patient created successfully:', newPatient);
      console.log('✅ Patient date_of_entry in response:', newPatient.date_of_entry);

      // Create financial transactions and update patient notes
      const totalAmount = formData.consultation_fee - formData.discount_amount;
      
      // Create transactions for fees
      const transactions = [];
      

      if (formData.consultation_fee > 0) {
        transactions.push({
          patient_id: newPatient.id,
          transaction_type: 'CONSULTATION',
          description: `Consultation Fee - Doctor Visit`,
          amount: formData.consultation_fee,
          payment_mode: formData.payment_mode, // Use selected payment mode
          status: 'COMPLETED'
        });
      }

      if (formData.discount_amount > 0) {
        transactions.push({
          patient_id: newPatient.id,
          transaction_type: 'PROCEDURE', // Use PROCEDURE with negative amount for discounts
          description: `Discount Applied: ${formData.discount_reason || 'General discount'}`,
          amount: -formData.discount_amount, // Negative amount for discount
          payment_mode: formData.payment_mode, // Use selected payment mode
          status: 'COMPLETED'
        });
      }

      // Create all transactions
      for (const transactionData of transactions) {
        try {
          console.log('💰 Creating transaction:', transactionData);
          await HospitalService.createTransaction(transactionData as any);
          console.log('✅ Transaction created successfully');
        } catch (transactionError: any) {
          console.error('❌ Failed to create transaction:', transactionError);
          // Continue with other transactions even if one fails
        }
      }
      
      if (totalAmount > 0) {
        try {
          const financialSummary = `FINANCIAL_RECORD: Consultation Fee: ₹${formData.consultation_fee}, Discount: ₹${formData.discount_amount}, Total: ₹${totalAmount} (${new Date().toLocaleString()})`;
          
          // Update patient with financial info in medical_history
          const { error: updateError } = await supabase
            .from('patients')
            .update({
              medical_history: patientData.medical_history 
                ? `${patientData.medical_history}\n\n${financialSummary}`
                : financialSummary
            })
            .eq('id', newPatient.id);
            
          if (updateError) {
            console.error('Failed to update financial record:', updateError);
          } else {
            console.log('✅ Financial record added to patient profile');
          }
        } catch (error) {
          console.error('Error adding financial record:', error);
        }
      }
      
      toast.success(`Patient registered successfully! ${newPatient.first_name} ${newPatient.last_name} - Total: ₹${totalAmount.toLocaleString()}`);
      
      // Auto-print receipt if enabled
      if (formData.autoPrintReceipt && totalAmount > 0) {
        try {
          await printConsultationReceipt(newPatient.id);
          toast.success('Receipt printed successfully!');
        } catch (printError) {
          console.error('Failed to print receipt:', printError);
          toast.error('Failed to print receipt, but patient was saved successfully');
        }
      }
      
      // Reset form
      resetForm();

    } catch (error: any) {
      console.error('🚨 Patient creation failed:', error);
      toast.error(`Failed to save patient: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      first_name: '',
      last_name: '',
      phone: '',
      email: '',
      date_of_birth: '',
      age: '',
      gender: 'MALE',
      address: '',
      patient_tag: '',
      visit_date: new Date().toISOString().split('T')[0],
      emergency_contact_name: '',
      emergency_contact_phone: '',
      blood_group: '',
      medical_history: '',
      allergies: '',
      consultation_fee: 0,
      discount_amount: 0,
      discount_reason: '',
      payment_mode: 'CASH' as any,
      isAdmitted: false,
      bedNumber: '',
      roomType: 'GENERAL',
      department: 'General',
      dailyRate: 0,
      admissionDate: '',
      expectedDischarge: '',
      admissionNotes: '',
      autoPrintReceipt: true,
    });
    setExistingPatient(null);
    setLastVisitInfo(null);
  };

  const totalAmount = formData.consultation_fee - formData.discount_amount;

  return (
    <>
      {/* Existing Patient Modal */}
      {showExistingPatientPrompt && existingPatient && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">
              🔍 Existing Patient Found
            </h2>
            
            <div className="bg-blue-50 p-4 rounded-lg mb-4">
              <p className="text-gray-700 mb-2">
                A patient with similar details already exists:
              </p>
              <div className="space-y-1 text-sm">
                <p><strong>Name:</strong> {existingPatient.first_name} {existingPatient.last_name}</p>
                <p><strong>Phone:</strong> {existingPatient.phone || 'N/A'}</p>
                <p><strong>Patient ID:</strong> {existingPatient.patient_id}</p>
                <p><strong>Age:</strong> {existingPatient.age || 'N/A'}</p>
                <p><strong>Address:</strong> {existingPatient.address || 'N/A'}</p>
                <p><strong>Registered on:</strong> {new Date(existingPatient.created_at).toLocaleDateString()}</p>
                {lastVisitInfo && (
                  <p className="mt-2 text-blue-700 font-medium">
                    <strong>Last Visit:</strong> {lastVisitInfo.date} - {lastVisitInfo.type} (₹{lastVisitInfo.amount})
                  </p>
                )}
              </div>
            </div>
            
            <p className="text-gray-600 mb-6">
              Would you like to create a new visit for this existing patient, or register as a new patient?
            </p>
            
            <div className="flex gap-3 justify-end">
              <button
                onClick={handleCreateNewPatient}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
              >
                Register as New Patient
              </button>
              <button
                onClick={handleContinueWithExisting}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Create New Visit
              </button>
            </div>
          </div>
        </div>
      )}
      
      <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800">👤 Simple Patient Entry</h2>
        <p className="text-gray-600 mt-1">Simple patient registration with integrated financial tracking</p>
        
        {/* Connection Status */}
        <div className="mt-4 p-2 bg-blue-50 rounded-lg">
          <div className="text-sm text-gray-600">{connectionStatus}</div>
        </div>

        {/* Success Notice */}
        <div className="mt-4 p-3 bg-green-50 rounded-lg border border-green-200">
          <div className="text-sm text-green-800">
            ✅ <strong>Financial Integration Active:</strong> Entry fees and consultation fees will be automatically 
            recorded as transactions and appear in the Finance Dashboard.
          </div>
        </div>

        {/* Duplicate Detection Notice */}
        {existingPatient && !showExistingPatientPrompt && (
          <div className="mt-4 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
            <div className="text-sm text-yellow-800">
              ⚠️ <strong>Possible Duplicate:</strong> A patient named <strong>{existingPatient.first_name} {existingPatient.last_name}</strong> 
              {existingPatient.phone && ` with phone ${existingPatient.phone}`} already exists (ID: {existingPatient.patient_id})
            </div>
          </div>
        )}
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Essential Information */}
        <div className="bg-green-50 p-4 rounded-lg border-2 border-green-200">
          <h3 className="text-lg font-semibold text-green-800 mb-4">✅ Essential Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                First Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.first_name}
                onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="Enter first name"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
              <input
                type="text"
                value={formData.last_name}
                onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="Enter last name (optional)"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="Enter phone number"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Age</label>
              <input
                type="number"
                value={formData.age || ''}
                onChange={(e) => {
                  const newAge = parseInt(e.target.value) || 0;
                  setFormData({ ...formData, age: newAge });
                  setAgeError('');
                }}
                className={`w-full px-3 py-2 border ${ageError ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 ${ageError ? 'focus:ring-red-500' : 'focus:ring-green-500'}`}
                placeholder="Enter age"
                min="0"
                max="150"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
              <select
                value={formData.gender}
                onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="MALE">Male</option>
                <option value="FEMALE">Female</option>
                <option value="OTHER">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Patient Tag (Community/Camp)</label>
              <input
                type="text"
                value={formData.patient_tag}
                onChange={(e) => setFormData({ ...formData, patient_tag: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="Enter custom tag (e.g., Jain Community, Corporate Camp, etc.)"
                list="simple-patient-tags-suggestions"
              />
              <datalist id="simple-patient-tags-suggestions">
                <option value="Jain Community" />
                <option value="Bohara Community" />
                <option value="Corporate Camp" />
                <option value="Medical Camp" />
                <option value="School Camp" />
                <option value="Senior Citizen" />
                <option value="Insurance" />
                <option value="Government Scheme" />
                <option value="VIP" />
                <option value="Regular" />
              </datalist>
              <div className="text-xs text-gray-500 mt-1">
                💡 Start typing for suggestions or enter your own custom tag
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Visit Date</label>
              <input
                type="date"
                value={formData.visit_date}
                onChange={(e) => setFormData({ ...formData, visit_date: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              />
              <div className="text-xs text-gray-500 mt-1">
                📅 Date when this visit occurred (for back-dating entries)
              </div>
            </div>
          </div>
          
          {/* Age/DOB Validation Error */}
          {ageError && (
            <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-600 flex items-center">
                <span className="mr-2">⚠️</span>
                {ageError}
              </p>
            </div>
          )}
        </div>

        {/* Patient Admission Section */}
        <div className="bg-green-50 p-4 rounded-lg border-2 border-green-200">
          <div className="flex items-center mb-4">
            <input
              type="checkbox"
              id="isAdmitted"
              checked={formData.isAdmitted}
              onChange={(e) => setFormData({ ...formData, isAdmitted: e.target.checked })}
              className="w-4 h-4 text-green-600 bg-gray-100 border-gray-300 rounded focus:ring-green-500"
            />
            <label htmlFor="isAdmitted" className="ml-2 text-lg font-semibold text-green-800">
              🏥 Patient Admission
            </label>
          </div>
          
          {formData.isAdmitted && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Bed Number</label>
                <input
                  type="text"
                  value={formData.bedNumber}
                  onChange={(e) => setFormData({ ...formData, bedNumber: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="e.g., B101, ICU-5"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Room Type</label>
                <select
                  value={formData.roomType}
                  onChange={(e) => setFormData({ ...formData, roomType: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="GENERAL">General Ward</option>
                  <option value="PRIVATE">Private Room</option>
                  <option value="ICU">ICU</option>
                  <option value="EMERGENCY">Emergency</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                <select
                  value={formData.department}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="General">General</option>
                  <option value="Cardiology">Cardiology</option>
                  <option value="Orthopaedics">Orthopaedics</option>
                  <option value="Pediatrics">Pediatrics</option>
                  <option value="Surgery">Surgery</option>
                  <option value="Emergency">Emergency</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Daily Rate (₹)</label>
                <input
                  type="number"
                  value={formData.dailyRate}
                  onChange={(e) => setFormData({ ...formData, dailyRate: Number(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="0"
                  min="0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Admission Date</label>
                <input
                  type="date"
                  value={formData.admissionDate}
                  onChange={(e) => setFormData({ ...formData, admissionDate: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Expected Discharge</label>
                <input
                  type="date"
                  value={formData.expectedDischarge}
                  onChange={(e) => setFormData({ ...formData, expectedDischarge: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Admission Notes</label>
                <textarea
                  value={formData.admissionNotes}
                  onChange={(e) => setFormData({ ...formData, admissionNotes: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="Notes about admission, condition, special requirements..."
                  rows={3}
                />
              </div>
            </div>
          )}
        </div>

        {/* Financial Information */}
        <div className="bg-blue-50 p-4 rounded-lg border-2 border-blue-200">
          <h3 className="text-lg font-semibold text-blue-800 mb-4">💰 Financial Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Consultation Fee (₹)</label>
              <input
                type="number"
                value={formData.consultation_fee}
                onChange={(e) => setFormData({ ...formData, consultation_fee: Number(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="0"
                min="0"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Discount (₹)</label>
              <input
                type="number"
                value={formData.discount_amount}
                onChange={(e) => setFormData({ ...formData, discount_amount: Number(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="0"
                min="0"
              />
            </div>
          </div>

          {/* Payment Mode Selection */}
          {totalAmount > 0 && (
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Payment Mode</label>
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, payment_mode: 'CASH' })}
                  className={`p-3 rounded-lg border-2 flex items-center justify-center space-x-2 transition-all ${
                    formData.payment_mode === 'CASH'
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
                  }`}
                >
                  <span className="text-2xl">💵</span>
                  <span className="font-medium">Cash</span>
                </button>
                
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, payment_mode: 'ONLINE' })}
                  className={`p-3 rounded-lg border-2 flex items-center justify-center space-x-2 transition-all ${
                    formData.payment_mode === 'ONLINE'
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
                  }`}
                >
                  <span className="text-2xl">💳</span>
                  <span className="font-medium">Online</span>
                </button>
              </div>
            </div>
          )}

          {totalAmount > 0 && (
            <div className="mt-4 p-3 bg-white rounded-lg border-2 border-blue-300">
              <div className="text-center">
                <span className="text-xl font-bold text-blue-700">
                  Total Amount: ₹{totalAmount.toLocaleString()}
                </span>
                <span className="text-sm text-blue-600 block mt-1">
                  Payment Mode: {formData.payment_mode === 'CASH' ? '💵 Cash' : '💳 Online'}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Optional Fields */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">📝 Optional Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="patient@email.com"
              />
            </div>


            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
              <textarea
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter full address"
                rows={2}
              />
            </div>
          </div>
        </div>

        {/* Print Options */}
        <div className="mb-4 p-4 bg-green-50 rounded-lg border border-green-200">
          <div className="flex items-center">
            <input
              type="checkbox"
              id="autoPrintReceipt"
              checked={formData.autoPrintReceipt}
              onChange={(e) => setFormData({ ...formData, autoPrintReceipt: e.target.checked })}
              className="mr-3 h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
            />
            <label htmlFor="autoPrintReceipt" className="text-sm font-medium text-green-700">
              🖨️ Automatically print consultation receipt after registration
            </label>
          </div>
          <div className="text-xs text-green-600 mt-1 ml-7">
            Receipt will be printed if patient has consultation or entry fees
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end pt-4 border-t border-gray-200">
          <button
            type="submit"
            disabled={loading || !formData.first_name.trim()}
            className="bg-blue-600 text-white py-3 px-6 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
          >
{loading ? 'Registering...' : '✅ Register Patient'}
          </button>
        </div>
      </form>
    </div>
    </>
  );
};

export default SimplePatientEntry;
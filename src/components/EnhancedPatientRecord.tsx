import React, { useState, useEffect, useCallback } from 'react';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';

// Security and performance imports
import { SecuritySanitizer } from '../utils/security';
import SafeStorageManager from '../utils/storage';
import { ValidationUtils, PatientRecordDataSchema } from '../utils/validation';
import { useDebounce, useAsyncOperation } from '../utils/performance';
import ErrorBoundary from './common/ErrorBoundary';
import LoadingSpinner, { FormOverlay } from './common/LoadingSpinner';
import ValidationMessage from './common/ValidationMessage';

// Import all section components
import HighRiskSection from './prescription/sections/HighRiskSection';
import ChiefComplaintsSection from './prescription/sections/ChiefComplaintsSection';
import TaskOrderSection from './prescription/sections/TaskOrderSection';
import ExaminationSection from './prescription/sections/ExaminationSection';
import InvestigationSection from './prescription/sections/InvestigationSection';
import DiagnosisSection from './prescription/sections/DiagnosisSection';
import PrescriptionTableSection from './prescription/sections/PrescriptionTableSection';

// Import validated data types from validation schema
import type {
  HighRiskData,
  ChiefComplaintData,
  TaskOrderData,
  ExaminationData,
  InvestigationData,
  DiagnosisData,
  PrescriptionMedicine,
  PatientRecordData
} from '../utils/validation';

// Import existing prescription component for integration
import ValantPrescription from './ValantPrescription';

interface EnhancedPatientRecordProps {
  patient: {
    patient_id: string;
    first_name: string;
    last_name: string;
    prefix?: string;
    age?: string;
    gender: string;
    assigned_department?: string;
  };
  onClose: () => void;
  showExistingPrescription?: boolean;
}

// PatientRecordData is now imported from validation.ts with proper validation

const EnhancedPatientRecord: React.FC<EnhancedPatientRecordProps> = ({ 
  patient, 
  onClose, 
  showExistingPrescription = false 
}) => {
  const [activeView, setActiveView] = useState<'enhanced' | 'existing'>('enhanced');
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [validationErrors, setValidationErrors] = useState<Record<string, string[]>>({});
  const { safeAsync, isMounted } = useAsyncOperation();
  
  const [recordData, setRecordData] = useState<PatientRecordData>({
    highRisks: [],
    chiefComplaints: [],
    taskOrders: [],
    examinations: [],
    investigations: [],
    diagnoses: [],
    prescriptionMedicines: [],
    additionalNotes: '',
    patientId: patient.patient_id,
    patientName: `${patient.prefix ? `${patient.prefix} ` : ''}${patient.first_name} ${patient.last_name}`,
    version: '1.0'
  });

  // Secure data loading with validation and error handling
  const loadSavedData = useCallback(async () => {
    if (!isMounted()) return;
    
    try {
      setIsLoading(true);
      const savedKey = `enhanced_patient_record_${patient.patient_id}`;
      
      const result = await SafeStorageManager.load<PatientRecordData>(savedKey);
      
      if (result.success && result.data) {
        // Validate loaded data
        const validation = ValidationUtils.validatePatientRecord(result.data);
        
        if (validation.success && validation.data) {
          setRecordData(validation.data);
          setValidationErrors({});
          
          // Safe logging without sensitive data
          if (process.env.NODE_ENV === 'development') {
            console.log('✅ Loaded patient record data successfully');
          }
        } else {
          console.warn('⚠️ Loaded data failed validation, using defaults');
          setValidationErrors(validation.errors || {});
          toast.error('Saved data was corrupted, starting fresh');
        }
      } else if (result.error) {
        console.error('❌ Failed to load patient record:', result.error);
        toast.error(`Failed to load saved data: ${result.error}`);
      }
    } catch (error) {
      console.error('❌ Critical error loading patient record:', error);
      toast.error('Critical error loading patient data');
    } finally {
      if (isMounted()) {
        setIsLoading(false);
      }
    }
  }, [patient.patient_id, isMounted]);

  useEffect(() => {
    loadSavedData();
  }, [loadSavedData]);

  // Secure save with comprehensive validation and error handling
  const handleSaveRecord = useCallback(async () => {
    if (isSaving || !isMounted()) return;

    try {
      setIsSaving(true);
      setValidationErrors({});

      // Validate that at least one section has data
      const hasData = 
        recordData.highRisks.length > 0 ||
        recordData.chiefComplaints.length > 0 ||
        recordData.taskOrders.length > 0 ||
        recordData.examinations.length > 0 ||
        recordData.investigations.length > 0 ||
        recordData.diagnoses.length > 0 ||
        recordData.prescriptionMedicines.length > 0 ||
        (recordData.additionalNotes && recordData.additionalNotes.trim().length > 0);

      if (!hasData) {
        toast.error('Please fill at least one section before saving');
        return;
      }

      // Prepare data with metadata
      const dataToSave: PatientRecordData = {
        ...recordData,
        patientId: patient.patient_id,
        patientName: `${patient.prefix ? `${patient.prefix} ` : ''}${patient.first_name} ${patient.last_name}`,
        savedAt: new Date().toISOString(),
        lastModified: new Date().toISOString(),
        version: '1.0'
      };

      // Validate data before saving
      const validation = ValidationUtils.validatePatientRecord(dataToSave);
      
      if (!validation.success) {
        setValidationErrors(validation.errors || {});
        toast.error('Please correct validation errors before saving');
        return;
      }

      // Secure save with SafeStorageManager
      const savedKey = `enhanced_patient_record_${patient.patient_id}`;
      const saveResult = await safeAsync(async () => 
        SafeStorageManager.save(savedKey, validation.data!)
      );

      if (saveResult && saveResult.success) {
        toast.success('Enhanced patient record saved successfully!');
        
        // Safe logging without sensitive data
        if (process.env.NODE_ENV === 'development') {
          const logData = SecuritySanitizer.sanitizeForLogging(dataToSave);
          console.log('✅ Enhanced patient record saved:', logData);
        }
      } else {
        const error = saveResult?.error || 'Unknown save error';
        toast.error(`Failed to save: ${error}`);
        console.error('❌ Save failed:', error);
      }

      // TODO: Extend to save to database via API with proper error handling
      // const dbResult = await safeAsync(async () => 
      //   PatientRecordService.saveEnhancedRecord(validation.data!)
      // );

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('❌ Critical save error:', errorMessage);
      toast.error(`Critical error: ${errorMessage}`);
    } finally {
      if (isMounted()) {
        setIsSaving(false);
      }
    }
  }, [recordData, patient, isSaving, isMounted, safeAsync]);

  // Secure print with data validation
  const handlePrintRecord = useCallback(() => {
    try {
      // Validate data before printing
      const validation = ValidationUtils.validatePatientRecord(recordData);
      
      if (!validation.success) {
        toast.error('Please fix validation errors before printing');
        return;
      }

      // Optional: Show loading state during print preparation
      const printWindow = window.print();
      
      if (process.env.NODE_ENV === 'development') {
        console.log('🖨️ Print initiated for patient record');
      }
    } catch (error) {
      console.error('❌ Print error:', error);
      toast.error('Failed to print patient record');
    }
  }, [recordData]);

  // Secure clear with proper confirmation and storage cleanup
  const handleClearRecord = useCallback(async () => {
    const confirmed = window.confirm(
      'Are you sure you want to clear all data? This action cannot be undone. '
      + 'Consider downloading a backup first.'
    );
    
    if (!confirmed || !isMounted()) return;

    try {
      const clearedData: PatientRecordData = {
        highRisks: [],
        chiefComplaints: [],
        taskOrders: [],
        examinations: [],
        investigations: [],
        diagnoses: [],
        prescriptionMedicines: [],
        additionalNotes: '',
        patientId: patient.patient_id,
        patientName: `${patient.prefix ? `${patient.prefix} ` : ''}${patient.first_name} ${patient.last_name}`,
        version: '1.0'
      };

      setRecordData(clearedData);
      setValidationErrors({});
      
      // Secure storage removal
      const savedKey = `enhanced_patient_record_${patient.patient_id}`;
      const removeResult = SafeStorageManager.remove(savedKey);
      
      if (removeResult.success) {
        toast.success('Patient record cleared successfully');
      } else {
        toast.error(`Failed to clear storage: ${removeResult.error}`);
      }
      
    } catch (error) {
      console.error('❌ Error clearing record:', error);
      toast.error('Failed to clear patient record');
    }
  }, [patient, isMounted]);

  // Secure section counting with validation
  const getTotalSections = useCallback(() => {
    try {
      return (
        (recordData.highRisks?.length || 0) +
        (recordData.chiefComplaints?.length || 0) +
        (recordData.taskOrders?.length || 0) +
        (recordData.examinations?.length || 0) +
        (recordData.investigations?.length || 0) +
        (recordData.diagnoses?.length || 0) +
        (recordData.prescriptionMedicines?.length || 0) +
        (recordData.additionalNotes && recordData.additionalNotes.trim() ? 1 : 0)
      );
    } catch (error) {
      console.error('Error calculating sections:', error);
      return 0;
    }
  }, [recordData]);

  // Show existing prescription if requested
  // Debounced data update to prevent excessive re-renders
  const [debouncedUpdateData] = useDebounce(
    (newData: Partial<PatientRecordData>) => {
      setRecordData(prevData => ({ ...prevData, ...newData }));
    },
    100
  );

  // Secure data update handler
  const handleDataUpdate = useCallback((sectionKey: keyof PatientRecordData, newData: any) => {
    try {
      // Sanitize data before updating state
      const sanitizationResult = SecuritySanitizer.sanitizeObject(newData);
      
      if (!sanitizationResult.success) {
        toast.error(`Data sanitization failed: ${sanitizationResult.error}`);
        return;
      }

      debouncedUpdateData({ [sectionKey]: sanitizationResult.data });
    } catch (error) {
      console.error('❌ Data update error:', error);
      toast.error('Failed to update data');
    }
  }, [debouncedUpdateData]);

  // Show existing prescription if requested
  if (showExistingPrescription || activeView === 'existing') {
    return (
      <ErrorBoundary>
        <ValantPrescription patient={patient} onClose={onClose} />
      </ErrorBoundary>
    );
  }

  // Show loading state
  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <LoadingSpinner 
          size="xl" 
          message="Loading patient record..." 
          fullScreen={false} 
        />
      </div>
    );
  }

  return (
    <ErrorBoundary>
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-7xl w-full max-h-[95vh] overflow-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 z-10">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2" style={{ color: '#0056B3' }}>
                Enhanced Patient Record
              </h2>
              <div className="text-gray-600">
                <div className="font-medium text-lg">
                  {patient.prefix ? `${patient.prefix} ` : ''}{patient.first_name} {patient.last_name}
                </div>
                <div className="flex gap-4 text-sm">
                  <span>ID: {patient.patient_id}</span>
                  <span>Age: {patient.age || 'N/A'} years</span>
                  <span>Gender: {patient.gender}</span>
                  <span>Department: {patient.assigned_department || 'GENERAL'}</span>
                </div>
              </div>
            </div>
            
            <div className="text-right">
              <div className="text-sm text-gray-500">
                Sections Completed: {getTotalSections()}
              </div>
              <div className="text-sm text-gray-500">
                Last Saved: {recordData.additionalNotes ? 'Recently' : 'Never'}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 flex-wrap">
            <Button
              onClick={() => setActiveView('existing')}
              variant="outline"
              className="border-blue-500 text-blue-600 hover:bg-blue-50"
            >
              🩺 Existing Prescription
            </Button>
            <Button
              onClick={handleSaveRecord}
              variant="primary"
              disabled={isSaving}
              className="bg-green-600 hover:bg-green-700"
            >
              💾 {isSaving ? 'Saving...' : 'Save Record'}
            </Button>
            <Button
              onClick={handlePrintRecord}
              variant="outline"
              className="border-purple-500 text-purple-600 hover:bg-purple-50"
            >
              🖨️ Print Record
            </Button>
            <Button
              onClick={handleClearRecord}
              variant="outline"
              className="border-red-500 text-red-600 hover:bg-red-50"
            >
              🗑️ Clear All
            </Button>
            <Button
              onClick={onClose}
              variant="secondary"
            >
              Close
            </Button>
          </div>
        </div>

        {/* Main Content */}
        <div className="p-6 space-y-6">
          {/* Section 1: High Risk */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <HighRiskSection
              data={recordData.highRisks}
              onChange={(data) => handleDataUpdate('highRisks', data)}
            />
          </motion.div>

          {/* Section 2: Chief Complaints */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <ChiefComplaintsSection
              data={recordData.chiefComplaints}
              onChange={(data) => handleDataUpdate('chiefComplaints', data)}
            />
          </motion.div>

          {/* Section 3: Task Orders */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <TaskOrderSection
              data={recordData.taskOrders}
              onChange={(data) => handleDataUpdate('taskOrders', data)}
            />
          </motion.div>

          {/* Section 4: Examinations */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <ExaminationSection
              data={recordData.examinations}
              onChange={(data) => handleDataUpdate('examinations', data)}
            />
          </motion.div>

          {/* Section 5: Investigations */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <InvestigationSection
              data={recordData.investigations}
              onChange={(data) => handleDataUpdate('investigations', data)}
            />
          </motion.div>

          {/* Section 6: Diagnosis */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            <DiagnosisSection
              data={recordData.diagnoses}
              onChange={(data) => handleDataUpdate('diagnoses', data)}
            />
          </motion.div>

          {/* Section 7: Enhanced Prescription */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
          >
            <PrescriptionTableSection
              data={recordData.prescriptionMedicines}
              onChange={(data) => handleDataUpdate('prescriptionMedicines', data)}
            />
          </motion.div>

          {/* Additional Notes Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
          >
            <Card padding="lg">
              <h3 className="text-lg font-semibold text-gray-800 mb-4" style={{ color: '#0056B3' }}>
                8. Additional Notes
              </h3>
              <div className="relative">
                <textarea
                  value={recordData.additionalNotes || ''}
                  onChange={(e) => {
                    const sanitizedValue = SecuritySanitizer.sanitizeText(e.target.value);
                    handleDataUpdate('additionalNotes', sanitizedValue);
                  }}
                  rows={6}
                  maxLength={5000}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Add any additional notes, special instructions, or observations about the patient's condition and treatment plan..."
                  aria-label="Additional notes"
                  aria-describedby="notes-help"
                />
                <div className="absolute bottom-2 right-2 text-xs text-gray-500">
                  {(recordData.additionalNotes || '').length}/5000
                </div>
              </div>
              <p id="notes-help" className="text-xs text-gray-600 mt-1">
                Maximum 5000 characters. Special characters and scripts will be sanitized for security.
              </p>
            </Card>
          </motion.div>

          {/* Summary Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9 }}
          >
            <Card className="bg-blue-50 border-blue-200" padding="lg">
              <h3 className="text-lg font-semibold text-blue-800 mb-4">
                📋 Patient Record Summary
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div className="text-center">
                  <div className="font-bold text-red-600 text-xl">{recordData.highRisks.length}</div>
                  <div className="text-gray-600">High Risk</div>
                </div>
                <div className="text-center">
                  <div className="font-bold text-blue-600 text-xl">{recordData.chiefComplaints.length}</div>
                  <div className="text-gray-600">Complaints</div>
                </div>
                <div className="text-center">
                  <div className="font-bold text-green-600 text-xl">{recordData.taskOrders.length}</div>
                  <div className="text-gray-600">Task Orders</div>
                </div>
                <div className="text-center">
                  <div className="font-bold text-purple-600 text-xl">{recordData.examinations.length}</div>
                  <div className="text-gray-600">Examinations</div>
                </div>
                <div className="text-center">
                  <div className="font-bold text-indigo-600 text-xl">{recordData.investigations.length}</div>
                  <div className="text-gray-600">Investigations</div>
                </div>
                <div className="text-center">
                  <div className="font-bold text-teal-600 text-xl">{recordData.diagnoses.length}</div>
                  <div className="text-gray-600">Diagnoses</div>
                </div>
                <div className="text-center">
                  <div className="font-bold text-orange-600 text-xl">{recordData.prescriptionMedicines.length}</div>
                  <div className="text-gray-600">Medicines</div>
                </div>
                <div className="text-center">
                  <div className="font-bold text-gray-600 text-xl">
                    ₹{recordData.prescriptionMedicines
                      .reduce((total, med) => {
                        const amount = typeof med.netAmount === 'number' && isFinite(med.netAmount) 
                          ? med.netAmount 
                          : 0;
                        return total + amount;
                      }, 0)
                      .toFixed(2)}
                  </div>
                  <div className="text-gray-600">Total Cost</div>
                </div>
              </div>
            </Card>
          </motion.div>

          {/* Bottom Action Buttons */}
          <div className="flex justify-center gap-4 pt-6 border-t border-gray-200">
            <Button
              onClick={handleSaveRecord}
              variant="primary"
              size="lg"
              disabled={isSaving}
              className="bg-green-600 hover:bg-green-700"
            >
              💾 {isSaving ? 'Saving Record...' : 'Save Complete Record'}
            </Button>
            <Button
              onClick={handlePrintRecord}
              variant="outline"
              size="lg"
              className="border-blue-500 text-blue-600 hover:bg-blue-50"
            >
              🖨️ Print Record
            </Button>
          </div>
        </div>

        {/* Form Overlay for Save Operations */}
        <FormOverlay 
          visible={isSaving} 
          message="Saving patient record securely..." 
        />
      </div>

      {/* Validation Errors Display */}
      {Object.keys(validationErrors).length > 0 && (
        <div className="fixed top-4 right-4 max-w-md z-60">
          <ValidationMessage 
            error={`Validation errors found in ${Object.keys(validationErrors).length} field(s)`}
            show={true}
          />
        </div>
      )}
    </div>
    </ErrorBoundary>
  );
};

export default EnhancedPatientRecord;
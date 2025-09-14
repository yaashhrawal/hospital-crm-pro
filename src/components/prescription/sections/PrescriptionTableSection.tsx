import React, { useState, useCallback, useRef, useId } from 'react';
import { Card } from '../../ui/Card';
import { Button } from '../../ui/Button';
import { Input } from '../../ui/Input';
import { COMMON_MEDICINES, MEDICINE_TYPES } from '../../../data/medicalData';

// Import security and validation utilities
import { SecuritySanitizer } from '../../../utils/security';
import { ValidationUtils, PrescriptionMedicineSchema } from '../../../utils/validation';
import type { PrescriptionMedicine } from '../../../utils/validation';
import { useDebounce, useMemoizedSearch } from '../../../utils/performance';
import { AriaBuilder, useKeyboardNavigation, ScreenReader, KeyboardUtils } from '../../../utils/accessibility';
import ValidationMessage, { InlineValidation, FieldValidationIndicator } from '../../common/ValidationMessage';
import LoadingSpinner from '../../common/LoadingSpinner';
import toast from 'react-hot-toast';

interface PrescriptionTableSectionProps {
  data: PrescriptionMedicine[];
  onChange: (data: PrescriptionMedicine[]) => void;
}

// Default prescription medicine with validation
const DEFAULT_PRESCRIPTION_MEDICINE: PrescriptionMedicine = {
  id: '',
  medicineName: '',
  genericName: '',
  strength: '',
  dosageForm: '',
  frequency: '',
  duration: '',
  quantity: 1,
  instructions: '',
  route: '',
  rate: 0,
  discAmount: 0,
  netAmount: 0,
  warnings: '',
  interactions: '',
  substitutionAllowed: true,
  notes: ''
};

const PrescriptionTableSection: React.FC<PrescriptionTableSectionProps> = ({ data, onChange }) => {
  const [currentMedicine, setCurrentMedicine] = useState<PrescriptionMedicine>({
    ...DEFAULT_PRESCRIPTION_MEDICINE,
    id: crypto.randomUUID ? crypto.randomUUID() : Date.now().toString()
  });
  const [isEditing, setIsEditing] = useState(false);
  const [editIndex, setEditIndex] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [touchedFields, setTouchedFields] = useState<Set<string>>(new Set());
  
  // Accessibility and performance hooks
  const searchInputRef = useRef<HTMLInputElement>(null);
  const tableRef = useRef<HTMLTableElement>(null);
  const formId = useId();
  const tableId = useId();
  const searchResultsId = useId();
  
  // Safe favorite prescriptions with validation
  const [favoritePrescriptions] = useState<string[]>([
    'Paracetamol 500mg TDS x 5 days',
    'Ibuprofen 400mg BD x 3 days', 
    'Amoxicillin 500mg TDS x 7 days',
    'Omeprazole 20mg OD x 10 days'
  ]);
  
  // Debounced validation to prevent excessive calls
  const [debouncedValidate] = useDebounce((medicine: PrescriptionMedicine) => {
    validateMedicine(medicine);
  }, 300);
  
  // Memoized search for performance
  const filteredMedicines = useMemoizedSearch(
    COMMON_MEDICINES,
    searchTerm,
    ['name'] as any[],
    200
  );
  
  // Keyboard navigation for search results
  const { 
    containerRef: searchResultsRef, 
    focusedIndex: focusedResultIndex,
    setFocusedIndex: setFocusedResultIndex 
  } = useKeyboardNavigation(
    filteredMedicines, 
    (index) => handleMedicineSelect(filteredMedicines[index]),
    () => setShowSearchResults(false)
  );

  // Secure medicine validation with comprehensive checks
  const validateMedicine = useCallback(async (medicine: PrescriptionMedicine) => {
    try {
      setIsValidating(true);
      
      const validation = ValidationUtils.validateFormData(PrescriptionMedicineSchema, medicine);
      
      if (validation.success) {
        setFieldErrors({});
        return true;
      } else {
        const errors: Record<string, string> = {};
        Object.entries(validation.errors || {}).forEach(([field, fieldErrors]) => {
          errors[field] = fieldErrors[0] || 'Invalid value';
        });
        setFieldErrors(errors);
        return false;
      }
    } catch (error) {
      console.error('Validation error:', error);
      setFieldErrors({ general: 'Validation failed' });
      return false;
    } finally {
      setIsValidating(false);
    }
  }, []);

  // Secure calculation with input validation
  const calculateNetAmount = useCallback((rate: number, discAmount: number): number => {
    try {
      const sanitizedRate = SecuritySanitizer.sanitizeNumber(rate) || 0;
      const sanitizedDiscount = SecuritySanitizer.sanitizeNumber(discAmount) || 0;
      
      // Ensure finite numbers and prevent overflow
      if (!isFinite(sanitizedRate) || !isFinite(sanitizedDiscount)) {
        return 0;
      }
      
      const netAmount = Math.max(0, sanitizedRate - sanitizedDiscount);
      return Math.min(netAmount, 999999); // Prevent overflow
    } catch (error) {
      console.error('Calculation error:', error);
      return 0;
    }
  }, []);

  // Secure medicine addition with comprehensive validation
  const handleAddMedicine = useCallback(async () => {
    try {
      // Mark all fields as touched for validation display
      const newTouchedFields = new Set(['medicineName', 'dosageForm', 'frequency', 'duration']);
      setTouchedFields(newTouchedFields);

      // Validate required fields
      if (!currentMedicine.medicineName || !currentMedicine.frequency || !currentMedicine.duration) {
        toast.error('Please fill all required fields (Medicine Name, Frequency, Duration)');
        ScreenReader.announce('Please fill all required fields', 'assertive');
        return;
      }

      // Sanitize all input data
      const sanitizedMedicine: PrescriptionMedicine = {
        ...currentMedicine,
        medicineName: SecuritySanitizer.sanitizeText(currentMedicine.medicineName),
        genericName: SecuritySanitizer.sanitizeText(currentMedicine.genericName || ''),
        strength: SecuritySanitizer.sanitizeText(currentMedicine.strength || ''),
        frequency: SecuritySanitizer.sanitizeText(currentMedicine.frequency),
        duration: SecuritySanitizer.sanitizeText(currentMedicine.duration),
        instructions: SecuritySanitizer.sanitizeText(currentMedicine.instructions || ''),
        route: SecuritySanitizer.sanitizeText(currentMedicine.route || ''),
        warnings: SecuritySanitizer.sanitizeText(currentMedicine.warnings || ''),
        interactions: SecuritySanitizer.sanitizeText(currentMedicine.interactions || ''),
        notes: SecuritySanitizer.sanitizeText(currentMedicine.notes || ''),
        rate: SecuritySanitizer.sanitizeNumber(currentMedicine.rate) || 0,
        discAmount: SecuritySanitizer.sanitizeNumber(currentMedicine.discAmount) || 0,
        quantity: SecuritySanitizer.sanitizeNumber(currentMedicine.quantity) || 1
      };

      // Calculate net amount securely
      sanitizedMedicine.netAmount = calculateNetAmount(sanitizedMedicine.rate, sanitizedMedicine.discAmount);

      // Validate sanitized data
      const isValid = await validateMedicine(sanitizedMedicine);
      if (!isValid) {
        toast.error('Please correct validation errors before adding');
        return;
      }

      if (isEditing && editIndex !== null) {
        // Update existing entry
        const updatedData = [...data];
        updatedData[editIndex] = sanitizedMedicine;
        onChange(updatedData);
        setIsEditing(false);
        setEditIndex(null);
        toast.success('Medicine updated successfully');
        ScreenReader.announce('Medicine updated successfully', 'polite');
      } else {
        // Add new entry
        onChange([...data, sanitizedMedicine]);
        toast.success('Medicine added successfully');
        ScreenReader.announce('Medicine added to prescription', 'polite');
      }

      // Reset form
      resetForm();
    } catch (error) {
      console.error('Error adding medicine:', error);
      toast.error('Failed to add medicine');
    }
  }, [currentMedicine, data, onChange, isEditing, editIndex, validateMedicine, calculateNetAmount]);

  // Secure form reset with proper cleanup
  const resetForm = useCallback(() => {
    setCurrentMedicine({
      ...DEFAULT_PRESCRIPTION_MEDICINE,
      id: crypto.randomUUID ? crypto.randomUUID() : Date.now().toString()
    });
    setSearchTerm('');
    setShowSearchResults(false);
    setIsEditing(false);
    setEditIndex(null);
    setFieldErrors({});
    setTouchedFields(new Set());
    setFocusedResultIndex(-1);
  }, []);

  // Secure edit with validation and accessibility
  const handleEdit = useCallback((index: number) => {
    try {
      if (index < 0 || index >= data.length) {
        toast.error('Invalid medicine selection');
        return;
      }

      const medicineToEdit = data[index];
      setCurrentMedicine(medicineToEdit);
      setIsEditing(true);
      setEditIndex(index);
      setSearchTerm(medicineToEdit.medicineName || '');
      setFieldErrors({});
      setTouchedFields(new Set());
      
      // Announce edit mode to screen readers
      ScreenReader.announce(`Editing medicine: ${medicineToEdit.medicineName}`, 'polite');
      
      // Focus the medicine name input
      setTimeout(() => {
        if (searchInputRef.current) {
          searchInputRef.current.focus();
        }
      }, 100);
    } catch (error) {
      console.error('Error editing medicine:', error);
      toast.error('Failed to edit medicine');
    }
  }, [data]);

  // Secure delete with confirmation and accessibility
  const handleDelete = useCallback((index: number) => {
    try {
      if (index < 0 || index >= data.length) {
        toast.error('Invalid medicine selection');
        return;
      }

      const medicineToDelete = data[index];
      const confirmed = window.confirm(
        `Are you sure you want to delete ${medicineToDelete.medicineName || 'this medicine'}?`
      );
      
      if (!confirmed) return;

      const updatedData = data.filter((_, i) => i !== index);
      onChange(updatedData);
      
      toast.success('Medicine deleted successfully');
      ScreenReader.announce(
        `Deleted medicine: ${medicineToDelete.medicineName}`,
        'polite'
      );
    } catch (error) {
      console.error('Error deleting medicine:', error);
      toast.error('Failed to delete medicine');
    }
  }, [data, onChange]);

  // Secure medicine selection with sanitization
  const handleMedicineSelect = useCallback((medicine: string) => {
    try {
      const sanitizedMedicine = SecuritySanitizer.sanitizeText(medicine);
      setCurrentMedicine({ 
        ...currentMedicine, 
        medicineName: sanitizedMedicine
      });
      setSearchTerm(sanitizedMedicine);
      setShowSearchResults(false);
      setFocusedResultIndex(-1);
      
      // Trigger validation
      const updatedMedicine = { ...currentMedicine, medicineName: sanitizedMedicine };
      debouncedValidate(updatedMedicine);
      
      ScreenReader.announce(`Selected medicine: ${sanitizedMedicine}`, 'polite');
    } catch (error) {
      console.error('Error selecting medicine:', error);
      toast.error('Failed to select medicine');
    }
  }, [currentMedicine, debouncedValidate]);

  // Secure search with debounced validation and accessibility
  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      const value = SecuritySanitizer.sanitizeText(e.target.value);
      setSearchTerm(value);
      setCurrentMedicine({ ...currentMedicine, medicineName: value });
      setShowSearchResults(value.length > 0);
      setFocusedResultIndex(-1);
      
      // Mark field as touched
      setTouchedFields(prev => new Set([...prev, 'medicineName']));
      
      // Trigger validation
      const updatedMedicine = { ...currentMedicine, medicineName: value };
      debouncedValidate(updatedMedicine);
      
      // Announce search results count to screen readers
      if (value.length > 0) {
        const resultCount = filteredMedicines.length;
        ScreenReader.announce(
          `${resultCount} medicine${resultCount !== 1 ? 's' : ''} found`,
          'polite'
        );
      }
    } catch (error) {
      console.error('Error in search:', error);
    }
  }, [currentMedicine, debouncedValidate, filteredMedicines]);

  // Secure field update with validation
  const handleFieldUpdate = useCallback((field: keyof PrescriptionMedicine, value: any) => {
    try {
      let sanitizedValue = value;
      
      // Sanitize based on field type
      if (typeof value === 'string') {
        sanitizedValue = SecuritySanitizer.sanitizeText(value);
      } else if (typeof value === 'number') {
        sanitizedValue = SecuritySanitizer.sanitizeNumber(value);
      }
      
      const updatedMedicine = {
        ...currentMedicine,
        [field]: sanitizedValue
      };
      
      // Recalculate net amount if rate or discount changes
      if (field === 'rate' || field === 'discAmount') {
        updatedMedicine.netAmount = calculateNetAmount(
          field === 'rate' ? sanitizedValue : currentMedicine.rate,
          field === 'discAmount' ? sanitizedValue : currentMedicine.discAmount
        );
      }
      
      setCurrentMedicine(updatedMedicine);
      
      // Mark field as touched
      setTouchedFields(prev => new Set([...prev, field]));
      
      // Trigger validation
      debouncedValidate(updatedMedicine);
    } catch (error) {
      console.error('Error updating field:', error);
    }
  }, [currentMedicine, calculateNetAmount, debouncedValidate]);

  // Secure favorite prescription selection with parsing
  const handleFavoritePrescriptionSelect = useCallback((prescription: string) => {
    try {
      const sanitizedPrescription = SecuritySanitizer.sanitizeText(prescription);
      const parts = sanitizedPrescription.split(' ');
      
      if (parts.length >= 2) {
        const updatedMedicine = {
          ...currentMedicine,
          medicineName: parts[0] || '',
          dosageForm: 'Tablet', // Default type
          duration: parts.slice(-2).join(' ') || '5 days',
          frequency: parts.includes('TDS') ? 'Three times daily (TDS)' : 
                    parts.includes('BD') ? 'Twice daily (BD)' :
                    parts.includes('OD') ? 'Once daily (OD)' : ''
        };
        
        setCurrentMedicine(updatedMedicine);
        setSearchTerm(parts[0] || '');
        
        // Trigger validation
        debouncedValidate(updatedMedicine);
        
        ScreenReader.announce(`Selected favorite: ${parts[0]}`, 'polite');
      }
    } catch (error) {
      console.error('Error selecting favorite prescription:', error);
      toast.error('Failed to load favorite prescription');
    }
  }, [currentMedicine, debouncedValidate]);

  // Secure total calculation with overflow protection
  const getTotalAmount = useCallback((): number => {
    try {
      return data.reduce((total, medicine) => {
        const amount = SecuritySanitizer.sanitizeNumber(medicine.netAmount) || 0;
        const newTotal = total + amount;
        
        // Prevent overflow
        return isFinite(newTotal) ? Math.min(newTotal, 9999999) : total;
      }, 0);
    } catch (error) {
      console.error('Error calculating total:', error);
      return 0;
    }
  }, [data]);
  
  // Keyboard event handlers for search results
  const handleSearchKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (!showSearchResults) return;
    
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        const nextIndex = Math.min(focusedResultIndex + 1, filteredMedicines.length - 1);
        setFocusedResultIndex(nextIndex);
        break;
        
      case 'ArrowUp':
        e.preventDefault();
        const prevIndex = Math.max(focusedResultIndex - 1, -1);
        setFocusedResultIndex(prevIndex);
        break;
        
      case 'Enter':
        e.preventDefault();
        if (focusedResultIndex >= 0 && filteredMedicines[focusedResultIndex]) {
          handleMedicineSelect(filteredMedicines[focusedResultIndex]);
        }
        break;
        
      case 'Escape':
        e.preventDefault();
        setShowSearchResults(false);
        setFocusedResultIndex(-1);
        break;
    }
  }, [showSearchResults, focusedResultIndex, filteredMedicines, handleMedicineSelect]);

  return (
    <Card className="mb-6" padding="lg">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-800 mb-4" style={{ color: '#0056B3' }}>
          7. Enhanced Prescription Section (Table Format)
        </h3>

        {/* Favorite Prescriptions Dropdown */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Favorite Prescriptions
          </label>
          <select
            onChange={(e) => {
              if (e.target.value) {
                handleFavoritePrescriptionSelect(e.target.value);
                e.target.value = '';
              }
            }}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Select from favorites...</option>
            {favoritePrescriptions.map((prescription, index) => (
              <option key={index} value={prescription}>
                {prescription}
              </option>
            ))}
          </select>
        </div>

        {/* Medicine Input Form */}
        <div className="bg-gray-50 p-4 rounded-lg mb-4">
          <h4 className="text-md font-medium text-gray-700 mb-3">Add Medicine</h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            {/* Medicine Name with Search */}
            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Medicine *
              </label>
              <div className="relative">
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchTerm}
                  onChange={handleSearchChange}
                  onKeyDown={handleSearchKeyDown}
                  onFocus={() => setShowSearchResults(searchTerm.length > 0)}
                  onBlur={() => {
                    // Delay hiding to allow for click selection
                    setTimeout(() => setShowSearchResults(false), 200);
                  }}
                  className={`
                    w-full px-3 py-2 border rounded-md text-sm transition-colors
                    focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                    ${fieldErrors.medicineName ? 'border-red-300 bg-red-50' : 'border-gray-300'}
                  `}
                  placeholder="Search medicine..."
                  maxLength={200}
                  {...AriaBuilder.formField(
                    undefined,
                    fieldErrors.medicineName ? `${formId}-medicine-error` : undefined,
                    `${formId}-medicine-help`,
                    true
                  )}
                  aria-expanded={showSearchResults}
                  aria-controls={showSearchResults ? searchResultsId : undefined}
                  aria-autocomplete="list"
                  role="combobox"
                />
                
                {/* Validation indicator */}
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <FieldValidationIndicator
                    isValid={!fieldErrors.medicineName && touchedFields.has('medicineName') && currentMedicine.medicineName.length > 0}
                    isInvalid={!!fieldErrors.medicineName && touchedFields.has('medicineName')}
                    isValidating={isValidating}
                    size="sm"
                  />
                </div>
              </div>
              
              {/* Field error message */}
              <InlineValidation
                error={fieldErrors.medicineName}
                touched={touchedFields.has('medicineName')}
              />
              
              {/* Help text */}
              <p id={`${formId}-medicine-help`} className="text-xs text-gray-600 mt-1">
                Start typing to search from available medicines
              </p>
              
              {/* Search Results with accessibility */}
              {showSearchResults && filteredMedicines.length > 0 && (
                <div 
                  ref={searchResultsRef}
                  id={searchResultsId}
                  role="listbox"
                  className="absolute z-20 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-48 overflow-y-auto"
                  aria-label="Medicine search results"
                >
                  {filteredMedicines.slice(0, 20).map((medicine, index) => (
                    <div
                      key={`${medicine}-${index}`}
                      role="option"
                      className={`
                        px-3 py-2 cursor-pointer text-sm border-b border-gray-100 last:border-b-0
                        transition-colors duration-150
                        ${index === focusedResultIndex 
                          ? 'bg-blue-100 text-blue-800' 
                          : 'hover:bg-gray-100'
                        }
                      `}
                      onClick={() => handleMedicineSelect(medicine)}
                      onMouseEnter={() => setFocusedResultIndex(index)}
                      aria-selected={index === focusedResultIndex}
                      {...AriaBuilder.listItem(index, index === focusedResultIndex)}
                    >
                      {medicine}
                      {index === focusedResultIndex && (
                        <ScreenReader.onlyText>, selected</ScreenReader.onlyText>
                      )}
                    </div>
                  ))}
                  
                  {/* Loading state for search */}
                  {filteredMedicines.length === 0 && (
                    <div className="px-3 py-2 text-sm text-gray-500">
                      <LoadingSpinner size="sm" message="Searching medicines..." />
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Dosage Form */}
            <div>
              <label 
                className="block text-sm font-medium text-gray-700 mb-1"
                htmlFor={`${formId}-dosage-form`}
              >
                Dosage Form *
              </label>
              <select
                id={`${formId}-dosage-form`}
                value={currentMedicine.dosageForm || ''}
                onChange={(e) => handleFieldUpdate('dosageForm', e.target.value)}
                className={`
                  w-full px-3 py-2 border rounded-md text-sm transition-colors
                  focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                  ${fieldErrors.dosageForm ? 'border-red-300 bg-red-50' : 'border-gray-300'}
                `}
                {...AriaBuilder.formField(
                  undefined,
                  fieldErrors.dosageForm ? `${formId}-dosage-error` : undefined,
                  undefined,
                  true
                )}
              >
                <option value="">Select Dosage Form...</option>
                {MEDICINE_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
              
              <InlineValidation
                error={fieldErrors.dosageForm}
                touched={touchedFields.has('dosageForm')}
              />
            </div>

            {/* Duration */}
            <div>
              <label 
                className="block text-sm font-medium text-gray-700 mb-1"
                htmlFor={`${formId}-duration`}
              >
                Duration *
              </label>
              <input
                id={`${formId}-duration`}
                type="text"
                value={currentMedicine.duration || ''}
                onChange={(e) => handleFieldUpdate('duration', e.target.value)}
                className={`
                  w-full px-3 py-2 border rounded-md text-sm transition-colors
                  focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                  ${fieldErrors.duration ? 'border-red-300 bg-red-50' : 'border-gray-300'}
                `}
                placeholder="e.g., 5 days, 2 weeks"
                maxLength={100}
                {...AriaBuilder.formField(
                  undefined,
                  fieldErrors.duration ? `${formId}-duration-error` : undefined,
                  undefined,
                  true
                )}
              />
              
              <InlineValidation
                error={fieldErrors.duration}
                touched={touchedFields.has('duration')}
              />
            </div>

            {/* Instructions */}
            <div>
              <label 
                className="block text-sm font-medium text-gray-700 mb-1"
                htmlFor={`${formId}-instructions`}
              >
                Instructions
              </label>
              <input
                id={`${formId}-instructions`}
                type="text"
                value={currentMedicine.instructions || ''}
                onChange={(e) => handleFieldUpdate('instructions', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="e.g., Take with food"
                maxLength={500}
                aria-describedby={`${formId}-instructions-help`}
              />
              
              <p id={`${formId}-instructions-help`} className="text-xs text-gray-600 mt-1">
                Optional special instructions for taking this medicine
              </p>
            </div>
          </div>

          {/* Frequency */}
          <div className="mb-4">
            <label 
              className="block text-sm font-medium text-gray-700 mb-2"
              htmlFor={`${formId}-frequency`}
            >
              Frequency *
            </label>
            <select
              id={`${formId}-frequency`}
              value={currentMedicine.frequency || ''}
              onChange={(e) => handleFieldUpdate('frequency', e.target.value)}
              className={`
                w-full px-3 py-2 border rounded-md text-sm transition-colors
                focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                ${fieldErrors.frequency ? 'border-red-300 bg-red-50' : 'border-gray-300'}
              `}
              {...AriaBuilder.formField(
                undefined,
                fieldErrors.frequency ? `${formId}-frequency-error` : undefined,
                undefined,
                true
              )}
            >
              <option value="">Select Frequency...</option>
              <option value="Once daily (OD)">Once daily (OD)</option>
              <option value="Twice daily (BD)">Twice daily (BD)</option>
              <option value="Three times daily (TDS)">Three times daily (TDS)</option>
              <option value="Four times daily (QDS)">Four times daily (QDS)</option>
              <option value="As required (PRN)">As required (PRN)</option>
              <option value="Before meals">Before meals</option>
              <option value="After meals">After meals</option>
              <option value="At bedtime">At bedtime</option>
            </select>
            
            <InlineValidation
              error={fieldErrors.frequency}
              touched={touchedFields.has('frequency')}
            />
          </div>

          {/* Quantity, Rate and Discount */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            <div>
              <label 
                className="block text-sm font-medium text-gray-700 mb-1"
                htmlFor={`${formId}-quantity`}
              >
                Quantity
              </label>
              <input
                id={`${formId}-quantity`}
                type="number"
                min="1"
                max="999"
                value={currentMedicine.quantity || 1}
                onChange={(e) => handleFieldUpdate('quantity', parseInt(e.target.value) || 1)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="1"
              />
            </div>
            
            <div>
              <label 
                className="block text-sm font-medium text-gray-700 mb-1"
                htmlFor={`${formId}-rate`}
              >
                Rate (₹)
              </label>
              <input
                id={`${formId}-rate`}
                type="number"
                min="0"
                max="99999"
                step="0.01"
                value={currentMedicine.rate || 0}
                onChange={(e) => handleFieldUpdate('rate', parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="0.00"
              />
            </div>

            <div>
              <label 
                className="block text-sm font-medium text-gray-700 mb-1"
                htmlFor={`${formId}-discount`}
              >
                Discount (₹)
              </label>
              <input
                id={`${formId}-discount`}
                type="number"
                min="0"
                max="99999"
                step="0.01"
                value={currentMedicine.discAmount || 0}
                onChange={(e) => handleFieldUpdate('discAmount', parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="0.00"
              />
            </div>

            <div>
              <label 
                className="block text-sm font-medium text-gray-700 mb-1"
                htmlFor={`${formId}-net-amount`}
              >
                Net Amount (₹)
              </label>
              <input
                id={`${formId}-net-amount`}
                type="number"
                value={currentMedicine.netAmount?.toFixed(2) || '0.00'}
                disabled
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm bg-gray-100 cursor-not-allowed"
                aria-label="Net amount (calculated automatically)"
              />
            </div>
          </div>

          {/* General validation errors */}
          {fieldErrors.general && (
            <ValidationMessage 
              error={fieldErrors.general}
              className="mb-4"
            />
          )}
          
          {/* Action Buttons with accessibility */}
          <div className="flex gap-2">
            <Button
              onClick={handleAddMedicine}
              disabled={isValidating || Object.keys(fieldErrors).length > 0}
              variant="primary"
              className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              aria-describedby={Object.keys(fieldErrors).length > 0 ? `${formId}-form-errors` : undefined}
            >
              {isValidating && <LoadingSpinner size="sm" className="mr-2" />}
              {isEditing ? 'Update Medicine' : 'Add Medicine'}
            </Button>
            
            <Button
              onClick={resetForm}
              variant="secondary"
              disabled={isValidating}
            >
              {isEditing ? 'Cancel' : 'Reset'}
            </Button>
          </div>
          
          {/* Form errors summary for screen readers */}
          {Object.keys(fieldErrors).length > 0 && (
            <div id={`${formId}-form-errors`} className="sr-only">
              Form has {Object.keys(fieldErrors).length} error(s): {Object.values(fieldErrors).join(', ')}
            </div>
          )}
        </div>

        {/* Prescription Table with accessibility */}
        {data.length > 0 && (
          <div className="overflow-x-auto" role="region" aria-label="Prescription medicines table">
            <table 
              ref={tableRef}
              id={tableId}
              className="w-full border-collapse border border-gray-300"
              role="table"
              aria-label="Prescription medicines"
              aria-rowcount={data.length + 2}
              aria-colcount={9}
            >
              <thead>
                <tr className="bg-gray-100" role="row">
                  <th className="border border-gray-300 px-3 py-2 text-left text-sm font-semibold" role="columnheader" scope="col">Medicine Name</th>
                  <th className="border border-gray-300 px-3 py-2 text-left text-sm font-semibold" role="columnheader" scope="col">Dosage Form</th>
                  <th className="border border-gray-300 px-3 py-2 text-center text-sm font-semibold" role="columnheader" scope="col">Frequency</th>
                  <th className="border border-gray-300 px-3 py-2 text-left text-sm font-semibold" role="columnheader" scope="col">Duration</th>
                  <th className="border border-gray-300 px-3 py-2 text-left text-sm font-semibold" role="columnheader" scope="col">Instructions</th>
                  <th className="border border-gray-300 px-3 py-2 text-right text-sm font-semibold" role="columnheader" scope="col">Quantity</th>
                  <th className="border border-gray-300 px-3 py-2 text-right text-sm font-semibold" role="columnheader" scope="col">Rate (₹)</th>
                  <th className="border border-gray-300 px-3 py-2 text-right text-sm font-semibold" role="columnheader" scope="col">Net Amount (₹)</th>
                  <th className="border border-gray-300 px-3 py-2 text-center text-sm font-semibold" role="columnheader" scope="col">Actions</th>
                </tr>
              </thead>
              <tbody>
                {data.map((medicine, index) => {
                  const safeRate = SecuritySanitizer.sanitizeNumber(medicine.rate) || 0;
                  const safeDiscount = SecuritySanitizer.sanitizeNumber(medicine.discAmount) || 0;
                  const safeNetAmount = SecuritySanitizer.sanitizeNumber(medicine.netAmount) || 0;
                  const safeQuantity = SecuritySanitizer.sanitizeNumber(medicine.quantity) || 1;
                  
                  return (
                    <tr 
                      key={medicine.id || index} 
                      className="hover:bg-gray-50 transition-colors"
                      role="row"
                      aria-rowindex={index + 2}
                    >
                      <td className="border border-gray-300 px-3 py-2 text-sm" role="gridcell">
                        <div className="font-medium">{SecuritySanitizer.sanitizeText(medicine.medicineName || '')}</div>
                        {medicine.genericName && (
                          <div className="text-xs text-gray-600">({SecuritySanitizer.sanitizeText(medicine.genericName)})</div>
                        )}
                      </td>
                      <td className="border border-gray-300 px-3 py-2 text-sm" role="gridcell">
                        {SecuritySanitizer.sanitizeText(medicine.dosageForm || '')}
                        {medicine.strength && (
                          <div className="text-xs text-gray-600">{SecuritySanitizer.sanitizeText(medicine.strength)}</div>
                        )}
                      </td>
                      <td className="border border-gray-300 px-3 py-2 text-center text-sm" role="gridcell">
                        <span className="inline-block px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                          {SecuritySanitizer.sanitizeText(medicine.frequency || 'Not specified')}
                        </span>
                      </td>
                      <td className="border border-gray-300 px-3 py-2 text-sm" role="gridcell">
                        {SecuritySanitizer.sanitizeText(medicine.duration || '')}
                      </td>
                      <td className="border border-gray-300 px-3 py-2 text-sm" role="gridcell">
                        <div>{SecuritySanitizer.sanitizeText(medicine.instructions || 'No instructions')}</div>
                        {medicine.warnings && (
                          <div className="text-xs text-red-600 mt-1">
                            ⚠️ {SecuritySanitizer.sanitizeText(medicine.warnings)}
                          </div>
                        )}
                      </td>
                      <td className="border border-gray-300 px-3 py-2 text-right text-sm" role="gridcell">
                        {safeQuantity}
                      </td>
                      <td className="border border-gray-300 px-3 py-2 text-right text-sm" role="gridcell">
                        ₹{safeRate.toFixed(2)}
                        {safeDiscount > 0 && (
                          <div className="text-xs text-gray-600">-₹{safeDiscount.toFixed(2)}</div>
                        )}
                      </td>
                      <td className="border border-gray-300 px-3 py-2 text-right text-sm font-semibold" role="gridcell">
                        ₹{safeNetAmount.toFixed(2)}
                      </td>
                      <td className="border border-gray-300 px-3 py-2 text-center" role="gridcell">
                        <div className="flex gap-1 justify-center">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEdit(index)}
                            aria-label={`Edit ${medicine.medicineName || 'medicine'}`}
                            className="hover:bg-blue-50 hover:border-blue-300"
                          >
                            ✏️ Edit
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDelete(index)}
                            aria-label={`Delete ${medicine.medicineName || 'medicine'}`}
                            className="hover:bg-red-50 hover:border-red-300 text-red-600 border-red-200"
                          >
                            🗑️ Delete
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="bg-gray-100 font-semibold" role="row">
                  <td colSpan={7} className="border border-gray-300 px-3 py-2 text-right text-sm" role="gridcell">
                    <strong>Total Amount:</strong>
                  </td>
                  <td className="border border-gray-300 px-3 py-2 text-right text-sm text-lg" role="gridcell">
                    <strong>₹{getTotalAmount().toFixed(2)}</strong>
                  </td>
                  <td className="border border-gray-300 px-3 py-2" role="gridcell"></td>
                </tr>
              </tfoot>
            </table>
            
            {/* Screen reader summary */}
            <div className="sr-only" aria-live="polite">
              Prescription table contains {data.length} medicine{data.length !== 1 ? 's' : ''} with total amount ₹{getTotalAmount().toFixed(2)}
            </div>
          </div>
        )}

        {/* Empty State with accessibility */}
        {data.length === 0 && (
          <div 
            className="text-center py-8 text-gray-500"
            role="status"
            aria-label="No medicines in prescription"
          >
            <div className="text-6xl mb-4">💊</div>
            <div className="text-lg font-medium mb-2">No medicines added yet</div>
            <div className="text-sm mb-4">
              Use the form above to add medicines to the prescription
            </div>
            <div className="text-xs text-gray-400">
              Tip: Use the search field to quickly find medicines from our database
            </div>
            
            {/* Screen reader announcement */}
            <div className="sr-only" aria-live="polite">
              Prescription is empty. Use the medicine form above to add medicines.
            </div>
          </div>
        )}
      </div>
      
      {/* Success/Error announcements for screen readers */}
      <div aria-live="polite" aria-atomic="true" className="sr-only">
        {/* This will be populated by screen reader announcements */}
      </div>
    </Card>
  );
};

export default React.memo(PrescriptionTableSection);
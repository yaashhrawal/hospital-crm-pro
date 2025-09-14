/**
 * Comprehensive validation schemas and utilities
 * Addresses input validation vulnerabilities and data integrity issues
 */

import { z } from 'zod';

// Base validation patterns
const SAFE_TEXT_REGEX = /^[a-zA-Z0-9\s\-._@#()[\]{}:;,'"!?/\\+*=&%$€£¥₹°µαβγδεζηθικλμνξοπρστυφχψω\n\r]*$/;
const MEDICAL_CODE_REGEX = /^[A-Z0-9.-]{1,20}$/;
const PHONE_REGEX = /^[\d\s()+.-]{10,15}$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Custom validation error messages
const ValidationMessages = {
  required: 'This field is required',
  tooShort: (min: number) => `Must be at least ${min} characters`,
  tooLong: (max: number) => `Must not exceed ${max} characters`,
  invalidFormat: 'Invalid format',
  invalidNumber: 'Must be a valid number',
  invalidDate: 'Must be a valid date',
  invalidEmail: 'Must be a valid email address',
  invalidPhone: 'Must be a valid phone number',
  tooSmall: (min: number) => `Must be at least ${min}`,
  tooBig: (max: number) => `Must not exceed ${max}`,
  unsafeContent: 'Contains unsafe characters'
};

// Safe text validation
const safeTextSchema = (maxLength: number = 500, required: boolean = false) => {
  let schema = z.string()
    .max(maxLength, ValidationMessages.tooLong(maxLength))
    .refine(
      (value) => !value || SAFE_TEXT_REGEX.test(value),
      { message: ValidationMessages.unsafeContent }
    );

  if (required) {
    schema = schema.min(1, ValidationMessages.required);
  }

  return schema;
};

// Numeric validation with finite checks
const safeNumberSchema = (min: number = 0, max: number = 999999, required: boolean = false) => {
  let schema = z.number()
    .finite('Must be a finite number')
    .min(min, ValidationMessages.tooSmall(min))
    .max(max, ValidationMessages.tooBig(max))
    .refine(
      (value) => !isNaN(value) && isFinite(value),
      { message: 'Must be a valid finite number' }
    );

  if (!required) {
    schema = schema.optional();
  }

  return schema;
};

// Date validation
const safeDateSchema = (required: boolean = false) => {
  let schema = z.union([
    z.string().datetime({ message: ValidationMessages.invalidDate }),
    z.date(),
    z.string().regex(/^\d{4}-\d{2}-\d{2}$/, ValidationMessages.invalidDate)
  ])
  .refine(
    (value) => {
      if (!value) return !required;
      
      const date = new Date(value);
      const year = date.getFullYear();
      
      return !isNaN(date.getTime()) && year >= 1900 && year <= 2100;
    },
    { message: 'Date must be between 1900 and 2100' }
  );

  if (!required) {
    schema = schema.optional();
  }

  return schema;
};

// High Risk Data Schema
export const HighRiskDataSchema = z.object({
  id: z.string().uuid().optional(),
  type: safeTextSchema(100, true),
  description: safeTextSchema(500),
  severity: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']),
  identifiedDate: safeDateSchema(),
  isActive: z.boolean().default(true),
  notes: safeTextSchema(1000)
});

// Chief Complaint Data Schema
export const ChiefComplaintDataSchema = z.object({
  id: z.string().uuid().optional(),
  complaint: safeTextSchema(300, true),
  duration: safeTextSchema(100),
  severity: z.enum(['MILD', 'MODERATE', 'SEVERE']),
  location: safeTextSchema(200),
  presentHistory: safeTextSchema(2000),
  pastHistory: safeTextSchema(2000),
  familyHistory: safeTextSchema(1000),
  personalHistory: safeTextSchema(1000),
  notes: safeTextSchema(1000)
});

// Task Order Data Schema
export const TaskOrderDataSchema = z.object({
  id: z.string().uuid().optional(),
  task: safeTextSchema(200, true),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']),
  assignedTo: safeTextSchema(100),
  dueDate: safeDateSchema(),
  status: z.enum(['PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']),
  instructions: safeTextSchema(1000),
  completedAt: safeDateSchema(),
  notes: safeTextSchema(500)
});

// Examination Data Schema
export const ExaminationDataSchema = z.object({
  id: z.string().uuid().optional(),
  type: safeTextSchema(100, true),
  findings: safeTextSchema(2000),
  normalValues: safeTextSchema(500),
  abnormalFindings: safeTextSchema(1000),
  conclusion: safeTextSchema(1000),
  examiner: safeTextSchema(100),
  examinationDate: safeDateSchema(true),
  followUpRequired: z.boolean().default(false),
  followUpDate: safeDateSchema(),
  notes: safeTextSchema(1000)
});

// Investigation Data Schema
export const InvestigationDataSchema = z.object({
  id: z.string().uuid().optional(),
  investigationType: safeTextSchema(100, true),
  testName: safeTextSchema(200, true),
  result: safeTextSchema(1000),
  normalRange: safeTextSchema(200),
  unit: safeTextSchema(50),
  status: z.enum(['ORDERED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']),
  orderedDate: safeDateSchema(true),
  completedDate: safeDateSchema(),
  urgency: z.enum(['ROUTINE', 'URGENT', 'STAT']),
  cost: safeNumberSchema(0, 99999),
  notes: safeTextSchema(1000)
});

// Diagnosis Data Schema
export const DiagnosisDataSchema = z.object({
  id: z.string().uuid().optional(),
  diagnosisCode: z.string().regex(MEDICAL_CODE_REGEX, 'Invalid medical code format'),
  diagnosisName: safeTextSchema(200, true),
  type: z.enum(['PRIMARY', 'SECONDARY', 'DIFFERENTIAL', 'PROVISIONAL']),
  confidence: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CONFIRMED']),
  stage: safeTextSchema(100),
  severity: z.enum(['MILD', 'MODERATE', 'SEVERE', 'CRITICAL']),
  onsetDate: safeDateSchema(),
  resolvedDate: safeDateSchema(),
  isActive: z.boolean().default(true),
  treatmentPlan: safeTextSchema(2000),
  prognosis: safeTextSchema(1000),
  notes: safeTextSchema(1000)
});

// Prescription Medicine Schema
export const PrescriptionMedicineSchema = z.object({
  id: z.string().uuid().optional(),
  medicineName: safeTextSchema(200, true),
  genericName: safeTextSchema(200),
  strength: safeTextSchema(50),
  dosageForm: safeTextSchema(100),
  frequency: safeTextSchema(100, true),
  duration: safeTextSchema(100, true),
  quantity: safeNumberSchema(1, 999, true),
  instructions: safeTextSchema(500),
  route: safeTextSchema(50),
  rate: safeNumberSchema(0, 99999, true),
  discAmount: safeNumberSchema(0, 99999),
  netAmount: safeNumberSchema(0, 99999, true),
  warnings: safeTextSchema(500),
  interactions: safeTextSchema(500),
  substitutionAllowed: z.boolean().default(true),
  notes: safeTextSchema(500)
});

// Main Patient Record Schema
export const PatientRecordDataSchema = z.object({
  highRisks: z.array(HighRiskDataSchema).default([]),
  chiefComplaints: z.array(ChiefComplaintDataSchema).default([]),
  taskOrders: z.array(TaskOrderDataSchema).default([]),
  examinations: z.array(ExaminationDataSchema).default([]),
  investigations: z.array(InvestigationDataSchema).default([]),
  diagnoses: z.array(DiagnosisDataSchema).default([]),
  prescriptionMedicines: z.array(PrescriptionMedicineSchema).default([]),
  additionalNotes: safeTextSchema(5000),
  
  // Metadata
  patientId: z.string().min(1, ValidationMessages.required),
  patientName: safeTextSchema(200, true),
  savedAt: z.string().datetime().optional(),
  lastModified: z.string().datetime().optional(),
  version: z.string().default('1.0')
});

// Individual field validation schemas for real-time validation
export const FieldValidationSchemas = {
  // Text fields
  shortText: safeTextSchema(100),
  mediumText: safeTextSchema(500),
  longText: safeTextSchema(2000),
  veryLongText: safeTextSchema(5000),
  
  // Specific fields
  patientName: safeTextSchema(200, true),
  medicineName: safeTextSchema(200, true),
  diagnosis: safeTextSchema(200, true),
  
  // Numeric fields
  price: safeNumberSchema(0, 999999),
  quantity: safeNumberSchema(1, 999),
  percentage: safeNumberSchema(0, 100),
  
  // Date fields
  date: safeDateSchema(),
  requiredDate: safeDateSchema(true),
  
  // Contact fields
  email: z.string().email(ValidationMessages.invalidEmail).optional(),
  phone: z.string().regex(PHONE_REGEX, ValidationMessages.invalidPhone).optional(),
  
  // Medical codes
  medicalCode: z.string().regex(MEDICAL_CODE_REGEX, 'Invalid medical code format')
};

// Validation utility functions
export class ValidationUtils {
  /**
   * Validate form data with comprehensive error reporting
   */
  static validateFormData<T>(schema: z.ZodSchema<T>, data: unknown): {
    success: boolean;
    data?: T;
    errors?: Record<string, string[]>;
    error?: string;
  } {
    try {
      const result = schema.safeParse(data);
      
      if (result.success) {
        return { success: true, data: result.data };
      } else {
        const errors: Record<string, string[]> = {};
        
        result.error.issues.forEach(issue => {
          const path = issue.path.join('.');
          if (!errors[path]) {
            errors[path] = [];
          }
          errors[path].push(issue.message);
        });
        
        return { 
          success: false, 
          errors,
          error: 'Validation failed'
        };
      }
    } catch (error) {
      return { 
        success: false, 
        error: `Validation error: ${error instanceof Error ? error.message : 'Unknown error'}` 
      };
    }
  }

  /**
   * Validate individual field in real-time
   */
  static validateField(fieldName: string, value: unknown): {
    success: boolean;
    error?: string;
  } {
    try {
      const schema = (FieldValidationSchemas as any)[fieldName];
      if (!schema) {
        return { success: true }; // No validation rule found, pass through
      }

      const result = schema.safeParse(value);
      
      if (result.success) {
        return { success: true };
      } else {
        return { 
          success: false, 
          error: result.error.issues[0]?.message || 'Invalid value' 
        };
      }
    } catch (error) {
      return { 
        success: false, 
        error: 'Validation error occurred' 
      };
    }
  }

  /**
   * Sanitize and validate patient record data
   */
  static validatePatientRecord(data: unknown): {
    success: boolean;
    data?: z.infer<typeof PatientRecordDataSchema>;
    errors?: Record<string, string[]>;
    error?: string;
  } {
    return this.validateFormData(PatientRecordDataSchema, data);
  }

  /**
   * Check if a value is safe for display/storage
   */
  static isSafeValue(value: any): boolean {
    if (typeof value === 'string') {
      return SAFE_TEXT_REGEX.test(value) && !this.containsScriptTags(value);
    }
    
    if (typeof value === 'number') {
      return isFinite(value) && !isNaN(value);
    }
    
    return true;
  }

  /**
   * Check for script tags or dangerous content
   */
  private static containsScriptTags(value: string): boolean {
    const dangerousPatterns = [
      /<script[\s\S]*?>[\s\S]*?<\/script>/gi,
      /javascript:/gi,
      /on\w+\s*=/gi,
      /data:text\/html/gi,
      /vbscript:/gi
    ];
    
    return dangerousPatterns.some(pattern => pattern.test(value));
  }

  /**
   * Get validation message for a specific error type
   */
  static getValidationMessage(errorType: string, params?: any): string {
    switch (errorType) {
      case 'required':
        return ValidationMessages.required;
      case 'too_small':
        return ValidationMessages.tooSmall(params?.minimum || 0);
      case 'too_big':
        return ValidationMessages.tooBig(params?.maximum || 100);
      case 'invalid_string':
        return ValidationMessages.invalidFormat;
      case 'invalid_type':
        return 'Invalid data type';
      default:
        return 'Validation error';
    }
  }
}

// Export types
export type HighRiskData = z.infer<typeof HighRiskDataSchema>;
export type ChiefComplaintData = z.infer<typeof ChiefComplaintDataSchema>;
export type TaskOrderData = z.infer<typeof TaskOrderDataSchema>;
export type ExaminationData = z.infer<typeof ExaminationDataSchema>;
export type InvestigationData = z.infer<typeof InvestigationDataSchema>;
export type DiagnosisData = z.infer<typeof DiagnosisDataSchema>;
export type PrescriptionMedicine = z.infer<typeof PrescriptionMedicineSchema>;
export type PatientRecordData = z.infer<typeof PatientRecordDataSchema>;

export default ValidationUtils;
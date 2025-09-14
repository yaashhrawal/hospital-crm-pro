/**
 * Validation message component for real-time form feedback
 * Provides consistent validation UI across all forms
 */

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface ValidationMessageProps {
  error?: string;
  success?: string;
  warning?: string;
  info?: string;
  className?: string;
  show?: boolean;
}

const ValidationMessage: React.FC<ValidationMessageProps> = ({
  error,
  success,
  warning,
  info,
  className = '',
  show = true
}) => {
  // Determine the message and type
  const message = error || success || warning || info;
  const type = error ? 'error' : success ? 'success' : warning ? 'warning' : 'info';

  if (!message || !show) {
    return null;
  }

  const getStyles = () => {
    switch (type) {
      case 'error':
        return {
          containerClass: 'bg-red-50 border-red-200 text-red-800',
          iconClass: 'text-red-500',
          icon: '⚠️'
        };
      case 'success':
        return {
          containerClass: 'bg-green-50 border-green-200 text-green-800',
          iconClass: 'text-green-500',
          icon: '✅'
        };
      case 'warning':
        return {
          containerClass: 'bg-yellow-50 border-yellow-200 text-yellow-800',
          iconClass: 'text-yellow-500',
          icon: '⚠️'
        };
      case 'info':
        return {
          containerClass: 'bg-blue-50 border-blue-200 text-blue-800',
          iconClass: 'text-blue-500',
          icon: 'ℹ️'
        };
      default:
        return {
          containerClass: 'bg-gray-50 border-gray-200 text-gray-800',
          iconClass: 'text-gray-500',
          icon: 'ℹ️'
        };
    }
  };

  const styles = getStyles();

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -10, height: 0 }}
        animate={{ opacity: 1, y: 0, height: 'auto' }}
        exit={{ opacity: 0, y: -10, height: 0 }}
        transition={{ duration: 0.2 }}
        className={`
          flex items-start space-x-2 p-3 border rounded-md text-sm
          ${styles.containerClass} ${className}
        `}
        role="alert"
        aria-live="polite"
      >
        <span className={`${styles.iconClass} text-sm`}>
          {styles.icon}
        </span>
        <div className="flex-1 min-w-0">
          <p className="break-words">{message}</p>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

/**
 * Inline validation message for form fields
 */
export const InlineValidation: React.FC<{
  error?: string;
  touched?: boolean;
  className?: string;
}> = ({ error, touched = false, className = '' }) => {
  if (!error || !touched) {
    return null;
  }

  return (
    <motion.p
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      className={`text-red-600 text-xs mt-1 ${className}`}
      role="alert"
    >
      {error}
    </motion.p>
  );
};

/**
 * Field validation indicator (shows validation state visually)
 */
export const FieldValidationIndicator: React.FC<{
  isValid?: boolean;
  isInvalid?: boolean;
  isValidating?: boolean;
  size?: 'sm' | 'md';
  className?: string;
}> = ({ 
  isValid, 
  isInvalid, 
  isValidating, 
  size = 'sm',
  className = '' 
}) => {
  const sizeClass = size === 'sm' ? 'w-4 h-4' : 'w-5 h-5';

  if (isValidating) {
    return (
      <div className={`${sizeClass} ${className}`}>
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="w-full h-full text-blue-500"
        >
          <svg viewBox="0 0 24 24" fill="none" className="w-full h-full">
            <circle
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
              className="opacity-25"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            />
          </svg>
        </motion.div>
      </div>
    );
  }

  if (isValid) {
    return (
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        className={`${sizeClass} text-green-500 ${className}`}
      >
        <svg viewBox="0 0 20 20" fill="currentColor" className="w-full h-full">
          <path
            fillRule="evenodd"
            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
            clipRule="evenodd"
          />
        </svg>
      </motion.div>
    );
  }

  if (isInvalid) {
    return (
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        className={`${sizeClass} text-red-500 ${className}`}
      >
        <svg viewBox="0 0 20 20" fill="currentColor" className="w-full h-full">
          <path
            fillRule="evenodd"
            d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
            clipRule="evenodd"
          />
        </svg>
      </motion.div>
    );
  }

  return null;
};

/**
 * Form validation summary component
 */
export const ValidationSummary: React.FC<{
  errors: Record<string, string[]>;
  className?: string;
  title?: string;
}> = ({ errors, className = '', title = 'Please correct the following errors:' }) => {
  const errorCount = Object.keys(errors).length;

  if (errorCount === 0) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-red-50 border border-red-200 rounded-md p-4 ${className}`}
      role="alert"
      aria-labelledby="validation-summary-title"
    >
      <div className="flex">
        <div className="flex-shrink-0">
          <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
              clipRule="evenodd"
            />
          </svg>
        </div>
        <div className="ml-3">
          <h3 id="validation-summary-title" className="text-sm font-medium text-red-800">
            {title}
          </h3>
          <div className="mt-2 text-sm text-red-700">
            <ul className="list-disc list-inside space-y-1">
              {Object.entries(errors).map(([field, fieldErrors]) =>
                fieldErrors.map((error, index) => (
                  <li key={`${field}-${index}`}>
                    <strong className="capitalize">{field.replace(/([A-Z])/g, ' $1').trim()}:</strong> {error}
                  </li>
                ))
              )}
            </ul>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

/**
 * Real-time validation feedback for password strength
 */
export const PasswordStrengthIndicator: React.FC<{
  password: string;
  requirements?: Array<{
    label: string;
    test: (password: string) => boolean;
  }>;
}> = ({ 
  password, 
  requirements = [
    { label: 'At least 8 characters', test: (p) => p.length >= 8 },
    { label: 'Contains uppercase letter', test: (p) => /[A-Z]/.test(p) },
    { label: 'Contains lowercase letter', test: (p) => /[a-z]/.test(p) },
    { label: 'Contains number', test: (p) => /\d/.test(p) },
    { label: 'Contains special character', test: (p) => /[!@#$%^&*]/.test(p) }
  ]
}) => {
  if (!password) {
    return null;
  }

  const passedCount = requirements.filter(req => req.test(password)).length;
  const strength = (passedCount / requirements.length) * 100;

  const getStrengthColor = () => {
    if (strength < 40) return 'bg-red-500';
    if (strength < 70) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getStrengthLabel = () => {
    if (strength < 40) return 'Weak';
    if (strength < 70) return 'Medium';
    return 'Strong';
  };

  return (
    <div className="mt-2 space-y-2">
      <div className="flex items-center space-x-2">
        <div className="flex-1 bg-gray-200 rounded-full h-2">
          <motion.div
            className={`h-2 rounded-full ${getStrengthColor()}`}
            initial={{ width: 0 }}
            animate={{ width: `${strength}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
        <span className={`text-xs font-medium ${
          strength < 40 ? 'text-red-600' : 
          strength < 70 ? 'text-yellow-600' : 
          'text-green-600'
        }`}>
          {getStrengthLabel()}
        </span>
      </div>

      <ul className="text-xs space-y-1">
        {requirements.map((req, index) => {
          const isPassed = req.test(password);
          return (
            <motion.li
              key={index}
              className={`flex items-center space-x-2 ${
                isPassed ? 'text-green-600' : 'text-gray-500'
              }`}
              initial={{ opacity: 0.5 }}
              animate={{ opacity: 1 }}
            >
              <span className={isPassed ? 'text-green-500' : 'text-gray-400'}>
                {isPassed ? '✓' : '○'}
              </span>
              <span>{req.label}</span>
            </motion.li>
          );
        })}
      </ul>
    </div>
  );
};

export default ValidationMessage;
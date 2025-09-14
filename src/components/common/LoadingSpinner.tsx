/**
 * Loading spinner and loading states component
 * Provides consistent loading UI across the application
 */

import React from 'react';
import { motion } from 'framer-motion';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  color?: 'blue' | 'green' | 'red' | 'gray';
  message?: string;
  fullScreen?: boolean;
  overlay?: boolean;
}

const sizeClasses = {
  sm: 'w-4 h-4',
  md: 'w-6 h-6',
  lg: 'w-8 h-8',
  xl: 'w-12 h-12'
};

const colorClasses = {
  blue: 'text-blue-600',
  green: 'text-green-600',
  red: 'text-red-600',
  gray: 'text-gray-600'
};

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  color = 'blue',
  message,
  fullScreen = false,
  overlay = false
}) => {
  const spinnerElement = (
    <div className="flex flex-col items-center justify-center space-y-2">
      <motion.div
        className={`${sizeClasses[size]} ${colorClasses[color]}`}
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        aria-label="Loading"
        role="status"
      >
        <svg
          className="w-full h-full"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
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
      
      {message && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className={`text-sm ${colorClasses[color]} text-center max-w-xs`}
        >
          {message}
        </motion.p>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-white z-50">
        <div className="text-center">
          {spinnerElement}
        </div>
      </div>
    );
  }

  if (overlay) {
    return (
      <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-75 z-10">
        {spinnerElement}
      </div>
    );
  }

  return spinnerElement;
};

/**
 * Skeleton loader for patient record cards
 */
export const SkeletonLoader: React.FC<{ 
  lines?: number; 
  className?: string;
  showAvatar?: boolean;
}> = ({ lines = 3, className = '', showAvatar = false }) => (
  <div className={`animate-pulse ${className}`}>
    <div className="flex space-x-4">
      {showAvatar && (
        <div className="rounded-full bg-gray-300 h-10 w-10"></div>
      )}
      <div className="flex-1 space-y-2">
        {Array.from({ length: lines }).map((_, index) => (
          <div
            key={index}
            className={`h-4 bg-gray-300 rounded ${
              index === lines - 1 ? 'w-2/3' : 'w-full'
            }`}
          ></div>
        ))}
      </div>
    </div>
  </div>
);

/**
 * Loading button state
 */
export const LoadingButton: React.FC<{
  loading: boolean;
  children: React.ReactNode;
  loadingText?: string;
  disabled?: boolean;
  onClick?: () => void;
  className?: string;
  variant?: 'primary' | 'secondary' | 'outline';
}> = ({
  loading,
  children,
  loadingText = 'Loading...',
  disabled,
  onClick,
  className = '',
  variant = 'primary'
}) => {
  const variantClasses = {
    primary: 'bg-blue-600 hover:bg-blue-700 text-white',
    secondary: 'bg-gray-600 hover:bg-gray-700 text-white',
    outline: 'border border-gray-300 hover:bg-gray-50 text-gray-700'
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      className={`
        relative px-4 py-2 rounded-md font-medium transition-colors duration-200
        disabled:opacity-50 disabled:cursor-not-allowed
        focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
        ${variantClasses[variant]}
        ${className}
      `}
    >
      <span className={loading ? 'opacity-0' : 'opacity-100'}>
        {children}
      </span>
      
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center">
          <LoadingSpinner size="sm" color="blue" />
          <span className="ml-2 text-sm">{loadingText}</span>
        </div>
      )}
    </button>
  );
};

/**
 * Progressive loading component for data fetching
 */
export const ProgressiveLoader: React.FC<{
  steps: string[];
  currentStep: number;
  error?: string;
}> = ({ steps, currentStep, error }) => (
  <div className="max-w-md mx-auto">
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="text-center mb-6">
        <LoadingSpinner size="lg" color={error ? 'red' : 'blue'} />
        <h3 className="mt-4 text-lg font-medium text-gray-900">
          {error ? 'Loading Failed' : 'Loading Patient Data'}
        </h3>
      </div>

      <div className="space-y-3">
        {steps.map((step, index) => {
          const isCompleted = index < currentStep;
          const isCurrent = index === currentStep;
          const hasFailed = error && isCurrent;

          return (
            <div key={index} className="flex items-center space-x-3">
              <div className={`
                flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-sm
                ${isCompleted 
                  ? 'bg-green-100 text-green-800' 
                  : hasFailed
                    ? 'bg-red-100 text-red-800'
                    : isCurrent
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-gray-100 text-gray-400'
                }
              `}>
                {isCompleted ? '✓' : hasFailed ? '✗' : index + 1}
              </div>
              
              <div className={`
                flex-1 text-sm
                ${isCompleted 
                  ? 'text-green-800 font-medium' 
                  : hasFailed
                    ? 'text-red-800 font-medium'
                    : isCurrent
                      ? 'text-blue-800 font-medium'
                      : 'text-gray-500'
                }
              `}>
                {step}
              </div>

              {isCurrent && !error && (
                <LoadingSpinner size="sm" color="blue" />
              )}
            </div>
          );
        })}
      </div>

      {error && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}
    </div>
  </div>
);

/**
 * Inline loading state for form fields
 */
export const FieldLoader: React.FC<{ message?: string }> = ({ 
  message = 'Validating...' 
}) => (
  <div className="flex items-center space-x-2 text-blue-600">
    <LoadingSpinner size="sm" color="blue" />
    <span className="text-xs">{message}</span>
  </div>
);

/**
 * Loading overlay for forms during submission
 */
export const FormOverlay: React.FC<{
  visible: boolean;
  message?: string;
}> = ({ visible, message = 'Saving patient data...' }) => {
  if (!visible) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 bg-white bg-opacity-90 flex items-center justify-center z-20 rounded-lg"
    >
      <div className="text-center">
        <LoadingSpinner size="lg" color="blue" message={message} />
      </div>
    </motion.div>
  );
};

/**
 * Loading states for patient record sections
 */
export const SectionLoader: React.FC<{
  title: string;
  description?: string;
}> = ({ title, description }) => (
  <div className="bg-white border border-gray-200 rounded-lg p-6">
    <div className="flex items-center space-x-3 mb-4">
      <LoadingSpinner size="md" color="blue" />
      <div>
        <h3 className="text-lg font-medium text-gray-900">{title}</h3>
        {description && (
          <p className="text-sm text-gray-600">{description}</p>
        )}
      </div>
    </div>
    
    <div className="space-y-3">
      <SkeletonLoader lines={2} />
      <SkeletonLoader lines={3} />
      <SkeletonLoader lines={1} />
    </div>
  </div>
);

export default LoadingSpinner;
import React from 'react';
import PatientEntryForm from '../components/forms/PatientEntryForm';
import { useNavigate } from 'react-router-dom';

const PatientEntry: React.FC = () => {
  const navigate = useNavigate();

  const handlePatientCreated = () => {
    // Navigate to daily operations or patients list
    navigate('/daily-operations');
  };

  const handleClose = () => {
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen bg-gray-50 py-6">
      <PatientEntryForm 
        onPatientCreated={handlePatientCreated}
        onClose={handleClose}
      />
    </div>
  );
};

export default PatientEntry;
import React from 'react';
import ExpenseEntryForm from '../components/forms/ExpenseEntryForm';
import { useNavigate } from 'react-router-dom';

const ExpenseEntry: React.FC = () => {
  const navigate = useNavigate();

  const handleExpenseCreated = () => {
    // Stay on the same page to allow multiple entries
  };

  const handleClose = () => {
    navigate('/daily-operations');
  };

  return (
    <div className="min-h-screen bg-gray-50 py-6">
      <ExpenseEntryForm 
        onExpenseCreated={handleExpenseCreated}
        onClose={handleClose}
      />
    </div>
  );
};

export default ExpenseEntry;
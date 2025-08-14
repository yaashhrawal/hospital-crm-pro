import React from 'react';

const TestCalendar: React.FC = () => {
  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 my-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-4">📅 Live Calendar</h2>
      <p className="text-gray-600">Calendar component is working!</p>
      <div className="bg-blue-50 p-4 rounded-lg mt-4">
        <p className="text-blue-800">This is a test calendar component to verify rendering.</p>
      </div>
    </div>
  );
};

export default TestCalendar;
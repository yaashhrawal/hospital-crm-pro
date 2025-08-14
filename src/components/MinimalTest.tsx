import React from 'react';

const MinimalTest: React.FC = () => {
  console.log('🧪 MinimalTest component rendered');
  
  return (
    <div style={{ padding: '20px', backgroundColor: 'lightblue', border: '2px solid red' }}>
      <h1 style={{ color: 'red', fontSize: '24px' }}>🚨 MINIMAL TEST COMPONENT</h1>
      <p style={{ fontSize: '18px' }}>If you can see this, React is working!</p>
      <p>Component loaded at: {new Date().toLocaleTimeString()}</p>
      <div style={{ backgroundColor: 'yellow', padding: '10px', margin: '10px 0' }}>
        <strong>Next steps:</strong>
        <ul>
          <li>1. Open browser console (F12)</li>
          <li>2. Look for any error messages</li>
          <li>3. Check if you see the console log above</li>
        </ul>
      </div>
    </div>
  );
};

export default MinimalTest;
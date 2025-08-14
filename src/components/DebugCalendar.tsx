import React from 'react';

const DebugCalendar: React.FC = () => {
  return (
    <div style={{
      backgroundColor: 'red',
      color: 'white',
      padding: '20px',
      margin: '20px 0',
      borderRadius: '8px',
      fontSize: '20px',
      fontWeight: 'bold',
      textAlign: 'center'
    }}>
      🚨 DEBUG: CALENDAR COMPONENT IS HERE! 🚨
      <br />
      If you see this red box, the calendar location is working!
    </div>
  );
};

export default DebugCalendar;
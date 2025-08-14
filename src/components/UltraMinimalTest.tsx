import React from 'react';

const UltraMinimalTest = () => {
  console.log('🚨 ULTRA MINIMAL TEST COMPONENT LOADING...');
  console.log('🚨 Current time:', new Date().toISOString());
  console.log('🚨 React version:', React.version);
  
  // Test if this renders AT ALL
  return React.createElement('div', {
    style: {
      position: 'fixed',
      top: '0',
      left: '0',
      width: '100vw',  
      height: '100vh',
      backgroundColor: 'red',
      color: 'white',
      fontSize: '24px',
      fontWeight: 'bold',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999
    }
  }, [
    React.createElement('h1', { key: 'title' }, '🚨 ULTRA MINIMAL TEST'),
    React.createElement('p', { key: 'time' }, 'Time: ' + new Date().toLocaleTimeString()),
    React.createElement('p', { key: 'msg1' }, 'If you see this RED SCREEN, React is working!'),
    React.createElement('p', { key: 'msg2' }, 'Check browser console (F12) for logs'),
    React.createElement('div', { 
      key: 'instructions',
      style: { 
        backgroundColor: 'yellow', 
        color: 'black', 
        padding: '20px', 
        margin: '20px',
        borderRadius: '10px'
      }
    }, [
      React.createElement('h2', { key: 'h2' }, 'WHAT TO DO:'),
      React.createElement('p', { key: 'p1' }, '1. Take a screenshot of this'),
      React.createElement('p', { key: 'p2' }, '2. Open browser console (F12)'),
      React.createElement('p', { key: 'p3' }, '3. Look for red console messages'),
      React.createElement('p', { key: 'p4' }, '4. Tell me what you see!')
    ])
  ]);
};

export default UltraMinimalTest;
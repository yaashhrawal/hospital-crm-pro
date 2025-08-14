// COPY THIS EXACT CODE TO BOTH WEBSITES

import React, { useEffect, useState } from 'react';

export const SimpleDBChecker: React.FC = () => {
  const [info, setInfo] = useState('Loading...');
  
  useEffect(() => {
    // Get environment variables directly
    const envUrl = import.meta.env.VITE_SUPABASE_URL || 'NOT_SET';
    const projectId = envUrl.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1] || 'UNKNOWN';
    
    setInfo(`${projectId} | ${envUrl}`);
  }, []);
  
  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      background: 'red',
      color: 'white',
      padding: '10px',
      fontSize: '14px',
      zIndex: 99999,
      textAlign: 'center',
      fontFamily: 'monospace'
    }}>
      🔍 DATABASE: {info}
    </div>
  );
};

// INSTRUCTIONS TO ADD:
// 1. Copy this entire code
// 2. In BOTH websites, find src/App.tsx file
// 3. Add this import at the top:
//    import { SimpleDBChecker } from './components/SimpleDBChecker';
// 4. Inside the return statement, add:
//    <SimpleDBChecker />
// 5. Save and the component should appear at the top of the website
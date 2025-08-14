// Add this component temporarily to both frontends to see which database they're using

import React from 'react';

export const DatabaseDebugInfo: React.FC = () => {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const projectId = supabaseUrl ? supabaseUrl.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1] : 'Unknown';
  
  return (
    <div style={{
      position: 'fixed',
      top: '10px',
      right: '10px',
      background: 'red',
      color: 'white',
      padding: '10px',
      borderRadius: '5px',
      fontSize: '12px',
      zIndex: 9999
    }}>
      <div><strong>Database Info:</strong></div>
      <div>Project ID: {projectId}</div>
      <div>URL: {supabaseUrl}</div>
      <div>Expected: {projectId === 'oghqwddhojnryovmfvzc' ? 'VALANT' : projectId === 'btoeupnfqkioxigrheyp' ? 'MADHUBAN' : 'UNKNOWN'}</div>
    </div>
  );
};

// Instructions:
// 1. Add this component to both frontends temporarily
// 2. Import and add <DatabaseDebugInfo /> to your main App component
// 3. Visit both websites to see which database each is using
// 4. This will show if environment variables are working correctly
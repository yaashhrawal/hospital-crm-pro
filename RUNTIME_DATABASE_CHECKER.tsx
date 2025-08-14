// CRITICAL: Add this to both websites to see which database they're actually using

import React, { useEffect, useState } from 'react';
import { supabase } from '../config/supabase'; // Adjust import path as needed

export const RuntimeDatabaseChecker: React.FC = () => {
  const [dbInfo, setDbInfo] = useState<any>({});
  
  useEffect(() => {
    const checkDatabase = async () => {
      try {
        // Get the actual Supabase URL being used
        const url = supabase.supabaseUrl;
        const key = supabase.supabaseKey;
        
        // Extract project ID from URL
        const projectId = url.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1] || 'Unknown';
        
        // Test database connection
        const { data, error } = await supabase.from('patients').select('count').limit(1);
        
        setDbInfo({
          url,
          projectId,
          keyPreview: key.substring(0, 20) + '...',
          connected: !error,
          error: error?.message,
          envUrl: import.meta.env.VITE_SUPABASE_URL,
          envKey: import.meta.env.VITE_SUPABASE_ANON_KEY?.substring(0, 20) + '...'
        });
      } catch (err) {
        setDbInfo({ error: 'Failed to check database' });
      }
    };
    
    checkDatabase();
  }, []);
  
  const isValant = dbInfo.projectId === 'oghqwddhojnryovmfvzc';
  const isMadhuban = dbInfo.projectId === 'btoeupnfqkioxigrheyp';
  
  return (
    <div style={{
      position: 'fixed',
      top: '0',
      left: '0',
      right: '0',
      background: isValant ? 'blue' : isMadhuban ? 'green' : 'red',
      color: 'white',
      padding: '10px',
      fontSize: '12px',
      zIndex: 10000,
      fontFamily: 'monospace'
    }}>
      <div><strong>🔍 RUNTIME DATABASE CHECK</strong></div>
      <div>Project ID: {dbInfo.projectId}</div>
      <div>Expected: {window.location.hostname.includes('hospital-crm-pro.vercel.app') ? 'VALANT' : 'MADHUBAN'}</div>
      <div>ENV URL: {dbInfo.envUrl}</div>
      <div>Actual URL: {dbInfo.url}</div>
      <div>Status: {dbInfo.connected ? '✅ Connected' : '❌ Failed'}</div>
      {dbInfo.error && <div>Error: {dbInfo.error}</div>}
      <div style={{marginTop: '5px', fontWeight: 'bold'}}>
        {isValant && '🔵 USING VALANT DATABASE'}
        {isMadhuban && '🟢 USING MADHUBAN DATABASE'}  
        {!isValant && !isMadhuban && '🔴 USING UNKNOWN DATABASE'}
      </div>
    </div>
  );
};

// INSTRUCTIONS:
// 1. Add this component to BOTH websites
// 2. Import and add <RuntimeDatabaseChecker /> to your main App component
// 3. Visit both websites to see which database each is ACTUALLY using
// 4. This will show the REAL database connection vs environment variables
# How to Add Runtime Database Checker

## Step 1: Clone Madhuban Repository Locally

```bash
# Open terminal and run:
cd /tmp
git clone https://github.com/yaashhrawal/hospital-crm-madhuban.git
cd hospital-crm-madhuban
```

## Step 2: Create the Checker Component

Create a new file: `src/components/RuntimeDatabaseChecker.tsx`

```tsx
import React, { useEffect, useState } from 'react';
import { supabase } from '../config/supabase';

export const RuntimeDatabaseChecker: React.FC = () => {
  const [dbInfo, setDbInfo] = useState<any>({});
  
  useEffect(() => {
    const checkDatabase = async () => {
      try {
        // Get environment variables
        const envUrl = import.meta.env.VITE_SUPABASE_URL;
        const envKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
        
        // Get actual supabase config
        const actualUrl = supabase.supabaseUrl;
        
        // Extract project ID
        const projectId = envUrl?.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1] || 'Unknown';
        const actualProjectId = actualUrl?.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1] || 'Unknown';
        
        // Test connection
        const { data, error } = await supabase.from('patients').select('count').limit(1);
        
        setDbInfo({
          envUrl,
          actualUrl,
          projectId,
          actualProjectId,
          connected: !error,
          error: error?.message
        });
      } catch (err) {
        setDbInfo({ error: 'Failed to check' });
      }
    };
    
    checkDatabase();
  }, []);
  
  const isCorrect = dbInfo.projectId === dbInfo.actualProjectId;
  
  return (
    <div style={{
      position: 'fixed',
      top: '0',
      left: '0',
      right: '0',
      background: isCorrect ? 'green' : 'red',
      color: 'white',
      padding: '8px',
      fontSize: '11px',
      zIndex: 10000,
      fontFamily: 'monospace'
    }}>
      <strong>🔍 DATABASE CHECK</strong> | 
      ENV: {dbInfo.projectId} | 
      ACTUAL: {dbInfo.actualProjectId} | 
      {isCorrect ? '✅ CORRECT' : '❌ WRONG DATABASE'}
    </div>
  );
};
```

## Step 3: Add to Main App Component

Edit `src/App.tsx` and add the checker:

```tsx
// Add this import at the top
import { RuntimeDatabaseChecker } from './components/RuntimeDatabaseChecker';

// In your App component, add this at the very top of the return statement:
function App() {
  return (
    <>
      <RuntimeDatabaseChecker />
      {/* Rest of your existing app code */}
      {/* ... */}
    </>
  );
}
```

## Step 4: Commit and Push

```bash
git add .
git commit -m "Add runtime database checker for debugging"
git push origin main
```

## Step 5: Wait for Vercel Deploy

Wait for Vercel to deploy the changes (1-2 minutes).

## Step 6: Check Both Websites

1. **Visit Madhuban website** - should show green bar with "CORRECT"
2. **Visit Valant website** - check what it shows

## Step 7: Report Results

Tell me what the checker shows on each website:
- What database ID does it show for Valant?
- What database ID does it show for Madhuban?
- Are the bars green (correct) or red (wrong)?
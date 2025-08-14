#!/bin/bash

echo "🔧 QUICK ADD RUNTIME CHECKER TO MADHUBAN"
echo "========================================="

# Clone repository
cd /tmp
rm -rf hospital-crm-madhuban
git clone https://github.com/yaashhrawal/hospital-crm-madhuban.git
cd hospital-crm-madhuban

# Create the checker component
mkdir -p src/components
cat > src/components/RuntimeDatabaseChecker.tsx << 'EOF'
import React, { useEffect, useState } from 'react';
import { supabase } from '../config/supabase';

export const RuntimeDatabaseChecker: React.FC = () => {
  const [dbInfo, setDbInfo] = useState<any>({});
  
  useEffect(() => {
    const checkDatabase = async () => {
      try {
        const envUrl = import.meta.env.VITE_SUPABASE_URL;
        const envKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
        const actualUrl = supabase.supabaseUrl;
        
        const projectId = envUrl?.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1] || 'Unknown';
        const actualProjectId = actualUrl?.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1] || 'Unknown';
        
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
      <strong>🔍 MADHUBAN DB CHECK</strong> | 
      ENV: {dbInfo.projectId} | 
      ACTUAL: {dbInfo.actualProjectId} | 
      {isCorrect ? '✅ CORRECT' : '❌ WRONG DATABASE'}
    </div>
  );
};
EOF

# Update App.tsx to include the checker
if grep -q "RuntimeDatabaseChecker" src/App.tsx; then
  echo "✅ Checker already in App.tsx"
else
  # Add import at top
  sed -i '1i import { RuntimeDatabaseChecker } from "./components/RuntimeDatabaseChecker";' src/App.tsx
  
  # Add component after first opening tag
  sed -i 's/<>/&\n      <RuntimeDatabaseChecker \/>/' src/App.tsx
  
  echo "✅ Added checker to App.tsx"
fi

# Commit and push
git add .
git commit -m "🔍 Add runtime database checker for debugging"
git push origin main

echo ""
echo "✅ Runtime checker added to Madhuban repository!"
echo ""
echo "📋 Next steps:"
echo "1. Wait 1-2 minutes for Vercel to deploy"
echo "2. Visit both websites"
echo "3. Check the colored bar at the top"
echo "4. Report what database IDs you see"
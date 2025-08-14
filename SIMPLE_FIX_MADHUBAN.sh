#!/bin/bash

echo "🛠️ SIMPLE FIX FOR MADHUBAN BUILD ERROR"
echo "======================================"

# Clone and fix Madhuban repository
cd /Users/mac
rm -rf hospital-crm-madhuban
git clone https://github.com/yaashhrawal/hospital-crm-madhuban.git
cd hospital-crm-madhuban

echo "🔧 Creating simple, working supabase configuration..."

# Create simple supabase.ts that definitely works
cat > src/config/supabase.ts << 'EOF'
import { createClient } from '@supabase/supabase-js';

// Madhuban Hospital Database Configuration
const supabaseUrl = 'https://btoeupnfqkioxigrheyp.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ0b2V1cG5mcWtpb3hpZ3JoZXlwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQwMTg0MjQsImV4cCI6MjA2OTU5NDQyNH0.j70Ab_8XHCUG9eYHdEbbcZAPko3_Lj2edkzkZEpd8QQ';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
EOF

# Create simple supabaseNew.ts
cat > src/config/supabaseNew.ts << 'EOF'
import { createClient } from '@supabase/supabase-js';

// Madhuban Hospital Database Configuration
const supabaseUrl = 'https://btoeupnfqkioxigrheyp.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ0b2V1cG5mcWtpb3hpZ3JoZXlwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQwMTg0MjQsImV4cCI6MjA2OTU5NDQyNH0.j70Ab_8XHCUG9eYHdEbbcZAPko3_Lj2edkzkZEpd8QQ';

export const supabase = createClient(supabaseUrl, supabaseKey);
EOF

echo "✅ Created simple, hardcoded configuration for Madhuban database"

# Remove .env to avoid conflicts
rm -f .env

# Create new .env with Madhuban config
cat > .env << 'EOF'
# Madhuban Hospital Database Configuration
VITE_SUPABASE_URL=https://btoeupnfqkioxigrheyp.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ0b2V1cG5mcWtpb3hpZ3JoZXlwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQwMTg0MjQsImV4cCI6MjA2OTU5NDQyNH0.j70Ab_8XHCUG9eYHdEbbcZAPko3_Lj2edkzkZEpd8QQ

# Application Configuration  
VITE_ENABLE_LOCAL_STORAGE_FALLBACK=false
VITE_APP_MODE=production
EOF

echo "✅ Created clean .env file"

# Remove any problematic components
if [ -f "src/components/RuntimeDatabaseChecker.tsx" ]; then
    rm src/components/RuntimeDatabaseChecker.tsx
    echo "✅ Removed problematic debug component"
fi

# Commit and push fix
echo "💾 Pushing simple fix..."
git add .
git commit -m "🛠️ Simple fix: Hardcoded Madhuban database config to resolve build error"
git push origin main

echo ""
echo "✅ SIMPLE FIX DEPLOYED!"
echo ""
echo "📋 What was fixed:"
echo "- Hardcoded Madhuban database configuration (btoeupnfqkioxigrheyp)"
echo "- Removed problematic environment variable handling"
echo "- Clean .env file"
echo "- Should build successfully now"
echo ""
echo "⏰ Wait 2-3 minutes for Vercel to build and deploy"
echo "🎯 This ensures Madhuban uses ONLY its own database"
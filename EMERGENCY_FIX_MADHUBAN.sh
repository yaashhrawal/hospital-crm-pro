#!/bin/bash

echo "🚨 EMERGENCY FIX FOR MADHUBAN DEPLOYMENT"
echo "========================================"

# Clone and fix Madhuban repository
cd /Users/mac
rm -rf hospital-crm-madhuban
git clone https://github.com/yaashhrawal/hospital-crm-madhuban.git
cd hospital-crm-madhuban

echo "🔧 Creating proper supabase configuration..."

# Create correct supabase.ts
cat > src/config/supabase.ts << 'EOF'
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables');
  console.log('VITE_SUPABASE_URL:', import.meta.env.VITE_SUPABASE_URL);
  console.log('VITE_SUPABASE_ANON_KEY exists:', !!import.meta.env.VITE_SUPABASE_ANON_KEY);
}

export const supabase = createClient(
  supabaseUrl || 'https://btoeupnfqkioxigrheyp.supabase.co',
  supabaseAnonKey || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ0b2V1cG5mcWtpb3hpZ3JoZXlwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQwMTg0MjQsImV4cCI6MjA2OTU5NDQyNH0.j70Ab_8XHCUG9eYHdEbbcZAPko3_Lj2edkzkZEpd8QQ'
);
EOF

# Create correct supabaseNew.ts
cat > src/config/supabaseNew.ts << 'EOF'
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://btoeupnfqkioxigrheyp.supabase.co';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ0b2V1cG5mcWtpb3hpZ3JoZXlwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQwMTg0MjQsImV4cCI6MjA2OTU5NDQyNH0.j70Ab_8XHCUG9eYHdEbbcZAPko3_Lj2edkzkZEpd8QQ';

export const supabase = createClient(supabaseUrl, supabaseKey);
EOF

echo "✅ Fixed supabase configuration files"

# Commit and push emergency fix
echo "💾 Pushing emergency fix..."
git add .
git commit -m "🚨 Emergency fix: Restore working supabase configuration"
git push origin main

echo ""
echo "✅ EMERGENCY FIX DEPLOYED!"
echo ""
echo "📋 Status:"
echo "- Fixed supabase configuration with fallback values"
echo "- Should restore Madhuban website functionality"
echo "- Uses Madhuban database (btoeupnfqkioxigrheyp)"
echo ""
echo "⏰ Wait 1-2 minutes for Vercel to deploy the fix"
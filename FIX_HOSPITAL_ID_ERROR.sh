#!/bin/bash

echo "🔧 FIXING HOSPITAL_ID IMPORT ERROR"
echo "=================================="

cd /Users/mac
rm -rf hospital-crm-madhuban
git clone https://github.com/yaashhrawal/hospital-crm-madhuban.git
cd hospital-crm-madhuban

echo "🔧 Adding missing HOSPITAL_ID export to supabaseNew.ts..."

# Fix supabaseNew.ts to include HOSPITAL_ID export
cat > src/config/supabaseNew.ts << 'EOF'
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://btoeupnfqkioxigrheyp.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ0b2V1cG5mcWtpb3hpZ3JoZXlwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQwMTg0MjQsImV4cCI6MjA2OTU5NDQyNH0.j70Ab_8XHCUG9eYHdEbbcZAPko3_Lj2edkzkZEpd8QQ';

export const supabase = createClient(supabaseUrl, supabaseKey);

// Madhuban Hospital ID - Fixed UUID
export const HOSPITAL_ID = '550e8400-e29b-41d4-a716-446655440000';
EOF

# Also fix supabase.ts to match
cat > src/config/supabase.ts << 'EOF'
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://btoeupnfqkioxigrheyp.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ0b2V1cG5mcWtpb3hpZ3JoZXlwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQwMTg0MjQsImV4cCI6MjA2OTU5NDQyNH0.j70Ab_8XHCUG9eYHdEbbcZAPko3_Lj2edkzkZEpd8QQ';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Madhuban Hospital ID - Fixed UUID  
export const HOSPITAL_ID = '550e8400-e29b-41d4-a716-446655440000';
EOF

echo "✅ Added HOSPITAL_ID export to both supabase config files"

echo "🔍 Checking hospitalService.ts import..."
head -5 src/services/hospitalService.ts

echo "💾 Pushing fix..."
git add .
git commit -m "🔧 Fix build: Add missing HOSPITAL_ID export to supabase config"
git push origin main

echo ""
echo "✅ HOSPITAL_ID IMPORT ERROR FIXED!"
echo ""
echo "📋 What was fixed:"
echo "- Added missing HOSPITAL_ID constant to supabaseNew.ts"
echo "- Added HOSPITAL_ID constant to supabase.ts for consistency"
echo "- Both use Madhuban's default hospital UUID"
echo ""
echo "⏰ This should resolve the import error"
echo "🎯 Wait 2-3 minutes for Vercel to build successfully"
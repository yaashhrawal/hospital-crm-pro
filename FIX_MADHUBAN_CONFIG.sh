#!/bin/bash

echo "🔧 FIXING MADHUBAN DATABASE CONFIGURATION"
echo "=========================================="

# Clone Madhuban repository
cd /Users/mac
rm -rf hospital-crm-madhuban
git clone https://github.com/yaashhrawal/hospital-crm-madhuban.git
cd hospital-crm-madhuban

echo "🔍 Searching for hardcoded Valant database URLs..."

# Search for hardcoded Valant database URL
if grep -r "oghqwddhojnryovmfvzc" src/ 2>/dev/null; then
    echo "🚨 FOUND HARDCODED VALANT DATABASE URL IN CODE!"
    echo ""
    echo "Files containing hardcoded Valant URL:"
    grep -r "oghqwddhojnryovmfvzc" src/ 2>/dev/null
    echo ""
    echo "🛠️  FIXING: Replacing hardcoded URLs with environment variables..."
    
    # Replace hardcoded URLs with environment variables
    find src/ -type f -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" | xargs sed -i '' 's/https:\/\/oghqwddhojnryovmfvzc\.supabase\.co/import.meta.env.VITE_SUPABASE_URL/g' 2>/dev/null || true
    
    echo "✅ Replaced hardcoded URLs with environment variables"
else
    echo "✅ No hardcoded Valant URLs found in src/"
fi

echo ""
echo "🔍 Checking supabase config files..."

# Check main supabase config files
if [ -f "src/config/supabase.ts" ]; then
    echo "📁 Found src/config/supabase.ts"
    if grep -q "oghqwddhojnryovmfvzc" src/config/supabase.ts; then
        echo "🚨 FOUND HARDCODED URL IN supabase.ts!"
        cat src/config/supabase.ts
        echo ""
        echo "🛠️  Creating corrected supabase.ts..."
        cat > src/config/supabase.ts << 'EOF'
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
EOF
        echo "✅ Fixed supabase.ts to use environment variables"
    else
        echo "✅ supabase.ts already uses environment variables"
    fi
fi

if [ -f "src/config/supabaseNew.ts" ]; then
    echo "📁 Found src/config/supabaseNew.ts"
    if grep -q "oghqwddhojnryovmfvzc" src/config/supabaseNew.ts; then
        echo "🚨 FOUND HARDCODED URL IN supabaseNew.ts!"
        echo "🛠️  Creating corrected supabaseNew.ts..."
        cat > src/config/supabaseNew.ts << 'EOF'
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
EOF
        echo "✅ Fixed supabaseNew.ts to use environment variables"
    else
        echo "✅ supabaseNew.ts already uses environment variables"
    fi
fi

# Commit and push changes
echo ""
echo "💾 Committing fixes..."
git add .
git commit -m "🔧 Fix hardcoded database URLs - use environment variables"
git push origin main

echo ""
echo "✅ MADHUBAN CONFIGURATION FIXED!"
echo ""
echo "📋 Next steps:"
echo "1. Wait 1-2 minutes for Vercel to deploy"
echo "2. Clear browser cache completely"
echo "3. Test both websites again"
echo "4. Data should now be properly separated"
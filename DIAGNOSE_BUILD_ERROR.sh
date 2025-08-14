#!/bin/bash

echo "🔍 DIAGNOSING ROLLUP BUILD ERROR"
echo "================================"

cd /Users/mac
rm -rf hospital-crm-madhuban
git clone https://github.com/yaashhrawal/hospital-crm-madhuban.git
cd hospital-crm-madhuban

echo "🔍 Checking for common syntax errors..."

# Check for syntax errors in TypeScript/JavaScript files
echo "Checking for duplicate imports..."
find src/ -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" 2>/dev/null | xargs grep -l "import.*supabase" 2>/dev/null || true

echo ""
echo "Checking supabase config files:"
if [ -f "src/config/supabase.ts" ]; then
    echo "=== src/config/supabase.ts ==="
    cat src/config/supabase.ts
    echo ""
fi

if [ -f "src/config/supabaseNew.ts" ]; then
    echo "=== src/config/supabaseNew.ts ==="
    cat src/config/supabaseNew.ts
    echo ""
fi

echo "🔍 Checking for circular imports or undefined variables..."
# Look for potential issues in main entry files
if [ -f "src/main.tsx" ]; then
    echo "=== src/main.tsx ==="
    head -20 src/main.tsx
    echo ""
fi

if [ -f "src/App.tsx" ]; then
    echo "=== src/App.tsx (first 20 lines) ==="
    head -20 src/App.tsx
    echo ""
fi

echo "🔍 Checking for any remaining debug components..."
find src/ -name "*debug*" -o -name "*Debug*" -o -name "*DEBUG*" 2>/dev/null || echo "No debug files found"

echo ""
echo "🔍 Checking package.json dependencies..."
if [ -f "package.json" ]; then
    echo "React version:"
    grep "react" package.json | head -3
    echo ""
    echo "Vite version:"
    grep "vite" package.json | head -2
fi

echo ""
echo "💡 POTENTIAL FIXES:"
echo "1. Remove any problematic import statements"
echo "2. Fix circular dependencies"
echo "3. Ensure all imported modules exist"
echo "4. Check for typos in import paths"
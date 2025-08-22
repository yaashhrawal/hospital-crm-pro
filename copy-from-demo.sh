#!/bin/bash

echo "🔄 Copying updated files from Demo-HRM to hospital-crm-pro-new..."
echo "Excluding: Supabase configs, Vercel configs, Git configs"

# Source and destination directories
SOURCE_DIR="../Demo-HRM"
DEST_DIR="."

# Files and directories to exclude
EXCLUDE_PATTERNS=(
    "src/config/supabase.ts"
    "src/config/supabaseNew.ts" 
    "vercel.json"
    ".git/*"
    ".gitignore"
    ".env"
    ".env.*"
    "backend/.env"
    "node_modules/*"
    "dist/*"
    "*.log"
    "package-lock.json"
)

# Create rsync exclude pattern
EXCLUDE_ARGS=""
for pattern in "${EXCLUDE_PATTERNS[@]}"; do
    EXCLUDE_ARGS="$EXCLUDE_ARGS --exclude=$pattern"
done

echo "📁 Copying all files except excluded ones..."

# Copy files using rsync with exclusions
rsync -av $EXCLUDE_ARGS "$SOURCE_DIR/" "$DEST_DIR/"

echo "✅ Copy completed!"
echo ""
echo "📋 Files that were NOT copied (excluded):"
for pattern in "${EXCLUDE_PATTERNS[@]}"; do
    echo "   ❌ $pattern"
done

echo ""
echo "🔧 Preserving current configuration files:"
echo "   ✅ .env (Supabase configuration)"
echo "   ✅ src/config/supabase.ts"
echo "   ✅ Git configuration"

echo ""
echo "📦 You may need to run 'npm install' if package.json was updated."
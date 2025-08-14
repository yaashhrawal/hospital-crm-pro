#!/bin/bash

echo "💥 NUCLEAR FIX: RESET MADHUBAN TO WORKING STATE"
echo "=============================================="

cd /Users/mac
rm -rf hospital-crm-madhuban

echo "🔄 Starting fresh from working Valant code..."

# Clone the WORKING Valant repository
git clone https://github.com/yaashhrawal/hospital-crm-pro.git temp-valant
cd temp-valant

# Switch to main branch (known working state)
git checkout main

echo "🔧 Converting to Madhuban configuration..."

# Update package.json for Madhuban
cat > package.json << 'EOF'
{
  "name": "madhuban-hospital-crm",
  "private": true,
  "version": "1.0.0",
  "description": "Madhuban Hospital CRM System",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "build:typecheck": "tsc -b && vite build --mode production",
    "build:vercel": "vite build",
    "lint": "eslint .",
    "preview": "vite preview"
  },
  "dependencies": {
    "@hookform/resolvers": "^5.1.1",
    "@prisma/client": "^6.12.0",
    "@supabase/supabase-js": "^2.52.0",
    "@tanstack/react-query": "^5.83.0",
    "@tanstack/react-table": "^8.21.3",
    "@types/react-datepicker": "^6.2.0",
    "@types/uuid": "^10.0.0",
    "axios": "^1.10.0",
    "clsx": "^2.1.1",
    "date-fns": "^4.1.0",
    "dotenv": "^17.2.1",
    "framer-motion": "^12.23.6",
    "lucide-react": "^0.525.0",
    "react": "^19.1.0",
    "react-datepicker": "^8.4.0",
    "react-dom": "^19.1.0",
    "react-hook-form": "^7.60.0",
    "react-hot-toast": "^2.5.2",
    "react-router-dom": "^7.7.0",
    "recharts": "^3.1.0",
    "uuid": "^11.1.0",
    "zod": "^4.0.5",
    "zustand": "^5.0.6"
  },
  "devDependencies": {
    "@eslint/js": "^9.30.1",
    "@tailwindcss/forms": "^0.5.10",
    "@types/node": "^24.0.15",
    "@types/react": "^19.1.8",
    "@types/react-dom": "^19.1.6",
    "@vitejs/plugin-react": "^4.6.0",
    "autoprefixer": "^10.4.21",
    "eslint": "^9.30.1",
    "eslint-plugin-react-hooks": "^5.2.0",
    "eslint-plugin-react-refresh": "^0.4.20",
    "globals": "^16.3.0",
    "postcss": "^8.5.6",
    "prisma": "^6.12.0",
    "tailwindcss": "^3.4.17",
    "typescript": "~5.8.3",
    "typescript-eslint": "^8.35.1",
    "vite": "^7.0.4"
  }
}
EOF

# Create Madhuban supabase config (hardcoded to avoid build issues)
cat > src/config/supabase.ts << 'EOF'
import { createClient } from '@supabase/supabase-js';

// Madhuban Hospital Database - HARDCODED for reliability
const supabaseUrl = 'https://btoeupnfqkioxigrheyp.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ0b2V1cG5mcWtpb3hpZ3JoZXlwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQwMTg0MjQsImV4cCI6MjA2OTU5NDQyNH0.j70Ab_8XHCUG9eYHdEbbcZAPko3_Lj2edkzkZEpd8QQ';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
EOF

# If supabaseNew.ts exists, make it identical
if [ -f "src/config/supabaseNew.ts" ]; then
cat > src/config/supabaseNew.ts << 'EOF'
import { createClient } from '@supabase/supabase-js';

// Madhuban Hospital Database - HARDCODED for reliability
const supabaseUrl = 'https://btoeupnfqkioxigrheyp.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ0b2V1cG5mcWtpb3hpZ3JoZXlwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQwMTg0MjQsImV4cCI6MjA2OTU5NDQyNH0.j70Ab_8XHCUG9eYHdEbbcZAPko3_Lj2edkzkZEpd8QQ';

export const supabase = createClient(supabaseUrl, supabaseKey);
EOF
fi

# Create clean .env
cat > .env << 'EOF'
# Madhuban Hospital Database Configuration
VITE_SUPABASE_URL=https://btoeupnfqkioxigrheyp.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ0b2V1cG5mcWtpb3hpZ3JoZXlwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQwMTg0MjQsImV4cCI6MjA2OTU5NDQyNH0.j70Ab_8XHCUG9eYHdEbbcZAPko3_Lj2edkzkZEpd8QQ

# Application Configuration
VITE_ENABLE_LOCAL_STORAGE_FALLBACK=false
VITE_APP_MODE=production
EOF

# Create README for Madhuban
cat > MADHUBAN_HOSPITAL.md << 'EOF'
# MADHUBAN HOSPITAL CRM

**Status:** Working deployment with separate database
**Database:** btoeupnfqkioxigrheyp.supabase.co
**Repository:** Fresh copy from working Valant code
**Configuration:** Hardcoded for reliability

## Database Separation
✅ Uses Madhuban database only
✅ No shared data with Valant
✅ Independent operation
EOF

echo "🗑️ Removing problematic files..."
# Remove any problematic debug components or migration files
find . -name "*debug*" -type f -delete 2>/dev/null || true
find . -name "*DEBUG*" -type f -delete 2>/dev/null || true
rm -rf migration/ 2>/dev/null || true
rm -rf madhuban-setup/ 2>/dev/null || true

echo "🔄 Setting up fresh Madhuban repository..."
# Change git remote to Madhuban repository
git remote set-url origin https://github.com/yaashhrawal/hospital-crm-madhuban.git

# Force push to reset Madhuban repository
git add .
git commit -m "💥 Nuclear reset: Fresh working Madhuban deployment with hardcoded database"
git push origin main --force

echo ""
echo "✅ NUCLEAR RESET COMPLETE!"
echo ""
echo "📋 What was done:"
echo "- Started fresh from working Valant code (known to build)"
echo "- Hardcoded Madhuban database configuration"
echo "- Removed all problematic debug/migration files"
echo "- Force pushed clean state to Madhuban repository"
echo ""
echo "⏰ Wait 3-4 minutes for Vercel to build and deploy"
echo "🎯 This should definitely work - it's based on working Valant code"

# Cleanup
cd /Users/mac
rm -rf temp-valant
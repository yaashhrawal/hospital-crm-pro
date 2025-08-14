#!/bin/bash

echo "🏥 Updating Madhuban Hospital Repository"
echo "========================================"

# Clone the Madhuban repository
echo "📥 Cloning Madhuban repository..."
cd /tmp
rm -rf hospital-crm-madhuban
git clone https://github.com/yaashhrawal/hospital-crm-madhuban.git
cd hospital-crm-madhuban

# Create .env file
echo "📝 Creating .env file with Madhuban credentials..."
cat > .env << 'EOF'
# Madhuban Hospital Database Configuration
VITE_SUPABASE_URL=https://btoeupnfqkioxigrheyp.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ0b2V1cG5mcWtpb3hpZ3JoZXlwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQwMTg0MjQsImV4cCI6MjA2OTU5NDQyNH0.j70Ab_8XHCUG9eYHdEbbcZAPko3_Lj2edkzkZEpd8QQ

# Application Configuration
VITE_ENABLE_LOCAL_STORAGE_FALLBACK=false
VITE_APP_MODE=production
EOF

# Update MADHUBAN_HOSPITAL.md
cat > MADHUBAN_HOSPITAL.md << 'EOF'
# MADHUBAN HOSPITAL CRM

**Hospital Name:** Madhuban Hospital  
**Repository:** hospital-crm-madhuban  
**Database:** btoeupnfqkioxigrheyp.supabase.co  
**Status:** Ready for deployment  

## Configuration
✅ Separate repository created
✅ Database configured with Madhuban credentials
✅ Complete isolation from Valant Hospital
✅ Ready for Vercel deployment

## Database Info
- **Project URL:** https://btoeupnfqkioxigrheyp.supabase.co
- **Database Password:** Rawal@00
- **Region:** Selected during setup

## Next Steps
1. Create Vercel project
2. Connect to this repository
3. Add environment variables
4. Deploy
EOF

# Commit and push
echo "💾 Committing changes..."
git add .env MADHUBAN_HOSPITAL.md
git commit -m "Configure Madhuban Hospital database credentials"
git push origin main

echo "✅ Madhuban repository updated!"
echo ""
echo "📋 Summary:"
echo "- Repository: hospital-crm-madhuban"
echo "- Database: btoeupnfqkioxigrheyp.supabase.co"
echo "- Environment variables: Configured"
echo ""
echo "🚀 Ready for Vercel deployment!"
# Madhuban Hospital Setup Instructions

## Repository Separation Complete ✅
- **Valant Hospital**: `hospital-crm-pro` repository (main branch)
- **Madhuban Hospital**: `hospital-crm-madhuban` repository (main branch)

## Next Steps for Madhuban Database Setup

### 1. Create New Supabase Project
1. Go to https://supabase.com/dashboard
2. Click "New Project"
3. Name: "Madhuban Hospital CRM"
4. Database Password: Choose a strong password
5. Region: Select nearest to your location
6. Click "Create new project"

### 2. Get Database Credentials
Once project is created, go to Settings → API and note:
- Project URL: `https://[your-project-id].supabase.co`
- Anon Key: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
- Service Role Key: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

### 3. Import Database Schema
1. Go to SQL Editor in Supabase dashboard
2. Copy contents of `MADHUBAN_SCHEMA.sql`
3. Paste and run in SQL Editor
4. This will create all necessary tables

### 4. Update Madhuban Repository
Clone the Madhuban repository locally:
```bash
git clone https://github.com/yaashhrawal/hospital-crm-madhuban.git
cd hospital-crm-madhuban
```

Create `.env` file with Madhuban credentials:
```
# Madhuban Database Configuration
VITE_SUPABASE_URL=https://[your-project-id].supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-key

# Application Configuration
VITE_ENABLE_LOCAL_STORAGE_FALLBACK=false
VITE_APP_MODE=production
```

### 5. Create Vercel Project
1. Go to https://vercel.com/dashboard
2. Click "Add New" → "Project"
3. Import from Git: Select `hospital-crm-madhuban`
4. Configure:
   - Framework Preset: Vite
   - Root Directory: ./
   - Build Command: npm run build
   - Output Directory: dist

### 6. Set Environment Variables in Vercel
Add these in Vercel project settings:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

### 7. Deploy
Click "Deploy" and wait for build to complete.

## Result
- **Valant Hospital**: Completely independent with its own database
- **Madhuban Hospital**: Completely independent with its own database
- No data sharing or cross-linking between hospitals
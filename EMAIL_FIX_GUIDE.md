# Email Functionality - Fix Guide

## 🔧 Errors Fixed

### 1. ✅ ReceiptTemplate reduce error - FIXED
- **Error**: `Cannot read properties of undefined (reading 'reduce')`
- **Fix**: Added null checks for `data.charges` and `data.payments`
- **Status**: ✅ FIXED in code

### 2. ✅ CORS Error - FIXED
- **Error**: `Access-Control-Allow-Origin header is not present`
- **Fix**: Created Supabase Edge Function to proxy email requests
- **Status**: ✅ Code updated, needs deployment

### 3. ⚠️ Email logs table missing - NEEDS SETUP
- **Error**: `POST /rest/v1/email_logs 404 (Not Found)`
- **Fix**: Run SQL to create table
- **Status**: ⚠️ NEEDS YOUR ACTION

## 📋 Setup Steps (Do These Now)

### Step 1: Create Email Logs Table

**Run this SQL in Supabase SQL Editor:**

1. Go to https://supabase.com/dashboard
2. Select your project: `oghqwddhojnryovmfvzc`
3. Click "SQL Editor" in left sidebar
4. Click "New Query"
5. Copy and paste the SQL from `CREATE_EMAIL_LOGS_TABLE.sql`
6. Click "Run" (or press Ctrl+Enter)

**Verify:**
- Go to "Table Editor"
- Check if `email_logs` table exists

### Step 2: Deploy Supabase Edge Function

**Option A: Using Supabase CLI (Recommended)**

```bash
# Install Supabase CLI if not installed
npm install -g supabase

# Login to Supabase
supabase login

# Link your project
supabase link --project-ref oghqwddhojnryovmfvzc

# Deploy the function
supabase functions deploy send-email --no-verify-jwt

# Set the secret
supabase secrets set RESEND_API_KEY=re_hnhQfxdQ_8NijQc84CxHijKYLUcpPaGf6
```

**Option B: Using Supabase Dashboard**

1. Go to https://supabase.com/dashboard/project/oghqwddhojnryovmfvzc/functions
2. Click "Create a new function"
3. Name: `send-email`
4. Copy code from `supabase/functions/send-email/index.ts`
5. Click "Deploy function"
6. Go to "Secrets" and add:
   - Key: `RESEND_API_KEY`
   - Value: `re_hnhQfxdQ_8NijQc84CxHijKYLUcpPaGf6`

### Step 3: Test the Setup

1. Refresh browser (Ctrl+F5)
2. Go to Patient List
3. Select a patient and transactions
4. Click "📧 Email Documents"
5. Enter your email
6. Click "Send Email"

**Expected Result:**
- ✅ No CORS errors
- ✅ Email sent successfully
- ✅ Logged in `email_logs` table

## 🐛 Current Errors Explained

### Error 1: ReceiptTemplate.tsx:153
```
Cannot read properties of undefined (reading 'reduce')
```
**Cause:** `data.charges` or `data.payments` was undefined
**Fix:** ✅ Added `(data.charges || [])` to handle undefined
**Status:** FIXED

### Error 2: CORS Policy
```
Access to fetch at 'https://api.resend.com/emails' from origin 'http://localhost:3001'
has been blocked by CORS policy
```
**Cause:** Browsers block direct API calls to external services
**Fix:** ✅ Created Supabase Edge Function as proxy
**Status:** FIXED (needs deployment)

### Error 3: email_logs 404
```
POST https://oghqwddhojnryovmfvzc.supabase.co/rest/v1/email_logs 404 (Not Found)
```
**Cause:** `email_logs` table doesn't exist in database
**Fix:** ⚠️ Run `CREATE_EMAIL_LOGS_TABLE.sql`
**Status:** NEEDS YOUR ACTION

### Error 4: smartConsoleBlocker.ts:121
```
Uncaught TypeError: clearInterval is not a function
```
**Cause:** Browser extension or dev tool issue
**Fix:** ℹ️ Ignore - not related to email functionality
**Status:** Can be ignored

## 🚀 Quick Fix Commands

### If you have Supabase CLI installed:

```bash
# Deploy edge function
cd C:\Users\DELL\hospital-crm-pro-new
supabase functions deploy send-email --no-verify-jwt

# Set API key
supabase secrets set RESEND_API_KEY=re_hnhQfxdQ_8NijQc84CxHijKYLUcpPaGf6
```

### If you don't have Supabase CLI:

1. **Manually create the Edge Function** in Supabase Dashboard
2. **Copy code** from `supabase/functions/send-email/index.ts`
3. **Add secret** `RESEND_API_KEY` in Dashboard

## 📊 Verification Checklist

After setup, verify:

- [ ] `email_logs` table exists in Supabase
- [ ] Edge function `send-email` is deployed
- [ ] Secret `RESEND_API_KEY` is set
- [ ] No CORS errors in browser console
- [ ] Email sends successfully
- [ ] Email appears in `email_logs` table

## 🔍 Testing

### Test Email Sending:

1. Open http://localhost:3002/ (or 3001)
2. Go to Patient List
3. Click on patient "Divyansh Khandelwal" (from console logs)
4. Select 1-2 transactions
5. Click "📧 Email Documents"
6. Enter email: `your.email@gmail.com`
7. Click "Send Email"

### Check Console:

**Success looks like:**
```
✅ Email sent successfully: {id: "...", ...}
```

**Failure looks like:**
```
❌ Email sending error: {...}
```

## 📁 Files Created/Modified

### Created:
- ✅ `supabase/functions/send-email/index.ts` - Edge function
- ✅ `CREATE_EMAIL_LOGS_TABLE.sql` - Database table
- ✅ `EMAIL_FIX_GUIDE.md` - This guide

### Modified:
- ✅ `src/services/emailService.ts` - Uses Edge Function now
- ✅ `src/components/receipts/ReceiptTemplate.tsx` - Fixed reduce error
- ✅ `.env` - Added email config

## 🎯 Next Steps

1. ✅ Run `CREATE_EMAIL_LOGS_TABLE.sql` in Supabase
2. ✅ Deploy Edge Function (via CLI or Dashboard)
3. ✅ Test email sending
4. ✅ Verify in email inbox

## 💡 Alternative (If Edge Function Deployment Fails)

If you can't deploy the Edge Function, you can:

1. **Use a simple backend proxy** (Node.js/Express)
2. **Or temporarily disable RLS** and use direct Resend API (not recommended for production)
3. **Or use a CORS proxy** (testing only)

For now, **deploying the Edge Function is the best solution**.

---

**Need Help?**
- Supabase CLI docs: https://supabase.com/docs/guides/cli
- Edge Functions guide: https://supabase.com/docs/guides/functions
- Resend docs: https://resend.com/docs

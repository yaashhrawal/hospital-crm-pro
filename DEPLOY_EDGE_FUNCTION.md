# Deploy Email Edge Function to Supabase

## Error You're Seeing:
```
send-email:1 Failed to load resource: the server responded with a status of 546
Email error: Error: Failed to send email
```

This means the Edge Function hasn't been deployed to Supabase yet.

## Step-by-Step Deployment Guide

### Option 1: Deploy via Supabase Dashboard (EASIEST - Do This)

#### Step 1: Go to Supabase Functions Page
1. Open browser and go to: https://supabase.com/dashboard/project/oghqwddhojnryovmfvzc/functions
2. Login if needed

#### Step 2: Create or Update Function

**If you see "send-email" function already exists:**
1. Click on "send-email"
2. Click "Edit" button
3. Delete all existing code
4. Copy the code from Section "Edge Function Code" below
5. Paste it
6. Click "Deploy" button
7. Wait for deployment to complete (green checkmark)

**If "send-email" function does NOT exist:**
1. Click "Create a new function" button
2. Function name: `send-email`
3. Copy the code from Section "Edge Function Code" below
4. Paste it in the code editor
5. Click "Deploy" button
6. Wait for deployment to complete (green checkmark)

#### Step 3: Add Secret (API Key)
1. In the same page, click on "Secrets" tab
2. Click "Add Secret" or "New Secret"
3. Enter:
   - Name: `RESEND_API_KEY`
   - Value: `re_hnhQfxdQ_8NijQc84CxHijKYLUcpPaGf6`
4. Click "Save" or "Add"

#### Step 4: Verify Deployment
1. Go back to "Functions" tab
2. You should see "send-email" with status: "Active" (green dot)
3. Click on it and you'll see the deployment logs

#### Step 5: Test
1. Refresh your hospital CRM app (press Ctrl+F5)
2. Go to Patient List
3. Select transactions
4. Click "Print Receipts"
5. Click "Send Email" button
6. Enter email and send
7. Should work now!

---

## Edge Function Code

Copy this EXACT code and paste it in Supabase:

```typescript
// Supabase Edge Function for sending emails via Resend
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY') || 're_hnhQfxdQ_8NijQc84CxHijKYLUcpPaGf6'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { to, subject, html, from = 'onboarding@resend.dev', fromName = 'Valant Hospital', attachments = [] } = await req.json()

    // Prepare email payload
    const emailPayload: any = {
      from: `${fromName} <${from}>`,
      to: [to],
      subject,
      html,
    }

    // Add attachments if provided
    if (attachments && attachments.length > 0) {
      emailPayload.attachments = attachments.map((attachment: any) => ({
        filename: attachment.filename,
        content: attachment.content, // Base64 encoded
      }))
    }

    // Send email via Resend
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(emailPayload),
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.message || 'Failed to send email')
    }

    return new Response(
      JSON.stringify({ success: true, data }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      },
    )
  }
})
```

---

## Option 2: Deploy via Supabase CLI (If you have it installed)

If you have Supabase CLI installed, you can run these commands:

```bash
# Navigate to project directory
cd C:\Users\DELL\hospital-crm-pro-new

# Login to Supabase
supabase login

# Link your project
supabase link --project-ref oghqwddhojnryovmfvzc

# Deploy the function
supabase functions deploy send-email --no-verify-jwt

# Set the secret
supabase secrets set RESEND_API_KEY=re_hnhQfxdQ_8NijQc84CxHijKYLUcpPaGf6
```

---

## Troubleshooting

### If deployment fails:
1. Make sure you're logged into Supabase dashboard
2. Make sure you have the correct project selected
3. Try refreshing the Supabase dashboard page
4. Try deploying again

### If you still get 546 error after deployment:
1. Wait 1-2 minutes for the function to fully deploy
2. Check deployment logs in Supabase Functions page
3. Verify the function shows "Active" status
4. Hard refresh your browser (Ctrl+Shift+R or Ctrl+F5)

### If email sends but you don't receive it:
- Remember: Resend free tier only sends to verified emails
- You can only send to: divyanshkwork@gmail.com
- To send to other emails, you need to verify your domain in Resend

---

## Quick Checklist

- [ ] Go to Supabase Functions page
- [ ] Create or update "send-email" function
- [ ] Paste the Edge Function code
- [ ] Click Deploy
- [ ] Add RESEND_API_KEY secret
- [ ] Verify function is "Active"
- [ ] Refresh browser
- [ ] Test email functionality

---

**Need Help?**
- Supabase Dashboard: https://supabase.com/dashboard/project/oghqwddhojnryovmfvzc
- Edge Functions Guide: https://supabase.com/docs/guides/functions

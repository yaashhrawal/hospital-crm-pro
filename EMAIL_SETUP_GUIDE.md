# Email Integration Setup Guide

## Overview
The Hospital CRM now supports email functionality for sending receipts, prescriptions, and other documents to patients directly from the Patient List.

## ✅ What's New

### **Email Address Input Field**
- ✅ Editable email address field in the email modal
- ✅ Pre-fills with patient's saved email (if available)
- ✅ Can type/edit any email address
- ✅ Email validation before sending
- ✅ Send to any email address you want

### **Features**
- 📧 Send receipts for selected transactions
- 📝 Professional email templates with Valant Hospital branding
- 📊 Document selection (Receipt, Prescription, Reports)
- 📋 Email logging for tracking
- ✉️ Beautiful HTML formatted emails

## 💰 Email API Costs (Resend)

### **Free Tier (Recommended for Starting)**
- ✅ **100 emails/day** - Completely FREE
- ✅ **3,000 emails/month** - FREE
- ✅ No credit card required
- ✅ Perfect for testing and small-scale usage
- ✅ Full features included

### **Paid Plans (If You Need More)**

#### Pro Plan - $20/month
- 50,000 emails/month included
- $0.001 per email after that
- Custom domains
- Priority support

#### Business Plan - Custom Pricing
- 100,000+ emails/month
- Volume discounts
- Dedicated support
- SLA guarantees

### **Cost Comparison**

**Example Usage:**
- 10 patients/day × 30 days = 300 emails/month = **FREE** ✅
- 50 patients/day × 30 days = 1,500 emails/month = **FREE** ✅
- 100 patients/day × 30 days = 3,000 emails/month = **FREE** ✅
- 200 patients/day × 30 days = 6,000 emails/month = **$20/month** (Pro plan)

### **Alternative Email Providers**

#### SendGrid
- **Free Tier**: 100 emails/day (3,000/month) - FREE
- **Paid**: $19.95/month for 50,000 emails

#### Mailgun
- **Free Tier**: First 5,000 emails/month - FREE
- **Paid**: $35/month for 50,000 emails

#### Amazon SES
- **Very Cheap**: $0.10 per 1,000 emails
- Requires AWS account setup

**Recommendation**: Start with **Resend Free Tier** (100 emails/day) - it's perfect for most hospitals and completely free!

## 🚀 Setup Instructions

### Step 1: Create Resend Account

1. Go to https://resend.com/
2. Click "Sign Up" (Free, no credit card needed)
3. Verify your email
4. Go to https://resend.com/api-keys
5. Click "Create API Key"
6. Copy the API key (starts with `re_`)

### Step 2: Configure Environment Variables

Update your `.env` file:

```env
# Email Configuration (Resend)
VITE_EMAIL_ENABLED=true
VITE_EMAIL_API_KEY=re_your_api_key_here
VITE_EMAIL_FROM=noreply@valanthospital.com
VITE_EMAIL_FROM_NAME=Valant Hospital
```

**Important Notes:**
- Replace `re_your_api_key_here` with your actual API key
- You can use any "from" email initially (Resend provides test emails)
- For production, verify your domain at https://resend.com/domains

### Step 3: Create Database Table

Run this SQL in your Supabase SQL Editor:

```bash
# File location:
CREATE_EMAIL_LOGS_TABLE.sql
```

This creates the `email_logs` table for tracking sent emails.

### Step 4: Test the Integration

1. Restart your dev server:
   ```bash
   npm run dev
   ```

2. Go to **Patient List**
3. Click on any patient
4. Select one or more transactions (checkboxes)
5. Click **"📧 Email Documents"**
6. Enter/edit the email address
7. Select document type (Receipt)
8. Click **"📧 Send Email"**

## 📧 How to Use

### **From Patient List:**

1. **Select Patient** - Click on a patient to view their history
2. **Select Transactions** - Check the transactions you want to email
3. **Click "📧 Email Documents"** - Button appears when transactions are selected
4. **Enter Email Address** - Type or edit the email address
5. **Choose Documents** - Select Receipt, Prescription, or Report
6. **Send** - Click "Send Email"

### **Email Address Input:**
- Pre-fills with patient's saved email
- Can be edited/changed to any email address
- Can send to family members, caregivers, etc.
- Validates email format before sending

## 📄 Email Template

### **Receipt Email**
```
Subject: Receipt #RCP123456 - Valant Hospital

Dear Mr. John Doe,

Thank you for choosing Valant Hospital. Please find your receipt attached below.

[Receipt Details]

Patient ID: P004063
Transactions: 2 selected
Total Amount: ₹1,500

If you have any questions, please contact us.

Best regards,
Valant Hospital Team
```

## 🔒 Security & Privacy

- ✅ All emails logged in database
- ✅ Email addresses validated
- ✅ Secure API key storage in environment variables
- ✅ Only authenticated users can send emails
- ✅ Email logs linked to patient records

## 📊 Email Logs

Track all sent emails:
- Patient ID
- Recipient email
- Subject & body
- Attachments
- Status (sent/failed)
- Timestamp

Access logs via database:
```sql
SELECT * FROM email_logs WHERE patient_id = 'patient-uuid';
```

## ⚠️ Troubleshooting

### Email not sending
1. ✅ Check `VITE_EMAIL_ENABLED=true` in `.env`
2. ✅ Verify API key is correct
3. ✅ Check Resend dashboard for errors
4. ✅ Ensure email address is valid
5. ✅ Check browser console for errors

### Resend API Limits
- Free tier: 100 emails/day
- If exceeded: Upgrade to Pro ($20/month)
- Or wait 24 hours for reset

### Invalid API Key
- Get new key from https://resend.com/api-keys
- Copy entire key including `re_` prefix
- Update `.env` file
- Restart server

## 🎯 Best Practices

1. **Start Free** - Use Resend free tier (100 emails/day)
2. **Verify Emails** - Ask patients to confirm email addresses
3. **Log Everything** - Keep email logs for records
4. **Monitor Usage** - Check Resend dashboard regularly
5. **Upgrade When Needed** - Only upgrade if you exceed free tier

## 🔄 Future Enhancements

Planned features:
- [ ] PDF attachments for receipts
- [ ] Prescription email templates
- [ ] Report email templates
- [ ] Bulk email sending
- [ ] Email templates customization
- [ ] Scheduled emails
- [ ] Email analytics

## 💡 Pro Tips

1. **Test Mode**: Use your own email for testing
2. **Patient Email**: Always verify patient email first
3. **Free Tier**: 100/day is plenty for most hospitals
4. **Multiple Emails**: Can send to patients, family, insurance
5. **Track Opens**: Resend provides email open tracking (Pro plan)

## 📞 Support

For issues:
1. Check Resend status: https://status.resend.com/
2. Review email logs in database
3. Check browser console for errors
4. Verify API key in Resend dashboard

---

**Cost Summary:**
- ✅ **FREE** for up to 100 emails/day (3,000/month)
- 💰 **$20/month** for 50,000 emails/month
- 🚀 **No credit card** required for free tier

Start with the **FREE tier** and upgrade only when needed!

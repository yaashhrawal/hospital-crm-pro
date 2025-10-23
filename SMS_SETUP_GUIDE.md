# SMS Integration Setup Guide

## Overview
The Hospital CRM Pro now supports SMS notifications for:
- **Patient Registration Confirmations** - Sent automatically when a new patient is registered
- **Appointment Confirmations** - Sent when a future appointment is scheduled
- **Appointment Reminders** - Can be sent manually or scheduled

## Features
- ✅ Automatic SMS on patient registration
- ✅ Automatic SMS on appointment booking
- ✅ SMS logging and tracking in database
- ✅ Support for Indian phone numbers (+91)
- ✅ Graceful fallback if SMS service is not configured
- ✅ Custom SMS messages

## Setup Instructions

### 1. Create Twilio Account (Recommended SMS Provider)

1. Go to [Twilio](https://www.twilio.com/) and sign up for a free account
2. Get a Twilio phone number (with SMS capabilities)
3. Find your credentials in the Twilio Console:
   - Account SID
   - Auth Token
   - Twilio Phone Number

### 2. Configure Environment Variables

Add the following to your `.env` file:

```env
# SMS Configuration (Twilio)
VITE_SMS_ENABLED=true
VITE_TWILIO_ACCOUNT_SID=your_account_sid_here
VITE_TWILIO_AUTH_TOKEN=your_auth_token_here
VITE_TWILIO_PHONE_NUMBER=+1234567890
```

**Important**:
- Set `VITE_SMS_ENABLED=true` to enable SMS functionality
- Set `VITE_SMS_ENABLED=false` to disable SMS (no errors will be thrown)
- Replace placeholder values with your actual Twilio credentials

### 3. Create Database Table

Run the SQL script in your Supabase SQL Editor:

```bash
# The SQL file is located at:
CREATE_SMS_LOGS_TABLE.sql
```

This will create:
- `sms_logs` table for tracking all SMS messages
- Indexes for better query performance
- Row Level Security (RLS) policies
- Proper permissions

### 4. Test the Integration

1. **Restart your development server:**
   ```bash
   npm run dev
   ```

2. **Register a new patient:**
   - Go to Patient Entry
   - Fill in patient details with a valid phone number
   - Submit the form
   - You should see: "Patient registered successfully!" followed by "SMS confirmation sent successfully!"

3. **Schedule an appointment:**
   - Go to Future Appointments
   - Select a patient and doctor
   - Choose date and time
   - Submit
   - You should see: "Appointment scheduled successfully!" followed by "SMS confirmation sent!"

## SMS Message Templates

### Registration Confirmation
```
Dear [Patient Name],

Welcome to Hospital CRM Pro!

Registration No: [REG_NO]
Date: [DATE]
Department: [DEPARTMENT]
Assigned Doctor: Dr. [DOCTOR_NAME]

Your registration is complete. Please keep your registration number for future reference.

Thank you!

- Hospital CRM Pro
```

### Appointment Confirmation
```
Dear [Patient Name],

Your appointment has been confirmed!

Registration No: [REG_NO]
Date: [DATE]
Time: [TIME]
Doctor: Dr. [DOCTOR_NAME]

Thank you for choosing our hospital.

- Hospital CRM Pro
```

### Appointment Reminder
```
Dear [Patient Name],

Reminder: You have an appointment tomorrow!

Date: [DATE]
Time: [TIME]
Doctor: Dr. [DOCTOR_NAME]

Please arrive 15 minutes early.

- Hospital CRM Pro
```

## Integration Points

### 1. Patient Registration
**File**: `src/components/forms/PatientEntryForm.tsx:258-276`

SMS is sent automatically after successful patient registration with:
- Patient name
- Registration number (first 8 characters of patient ID)
- Registration date
- Assigned doctor and department

### 2. Appointment Booking
**File**: `src/components/FutureAppointmentsSystem.tsx:110-136`

SMS is sent automatically after successful appointment creation with:
- Patient name
- Appointment date and time
- Doctor name
- Registration number

### 3. Custom SMS
You can send custom SMS using the service directly:

```typescript
import SMSService from '../services/smsService';

// Send custom SMS
await SMSService.sendCustomSMS(
  '+919876543210',
  'Your custom message here',
  patientId // optional
);
```

## Phone Number Format

The SMS service automatically handles Indian phone numbers:
- `9876543210` → `+919876543210`
- `919876543210` → `+919876543210`
- `+919876543210` → `+919876543210` (no change)

## SMS Logging

All SMS messages are logged in the `sms_logs` table with:
- Patient ID (if available)
- Phone number
- Message content
- Status (sent/failed/pending)
- Error message (if failed)
- SMS type (registration/appointment_confirmation/reminder/general)
- Timestamp

**View SMS logs for a patient:**
```typescript
import SMSService from '../services/smsService';

const logs = await SMSService.getSMSLogs(patientId);
console.log(logs);
```

## Troubleshooting

### SMS not sending
1. ✅ Check that `VITE_SMS_ENABLED=true` in `.env`
2. ✅ Verify Twilio credentials are correct
3. ✅ Ensure Twilio phone number has SMS capabilities
4. ✅ Check Twilio account balance (free trial has limits)
5. ✅ Verify phone number format is correct
6. ✅ Check browser console for error messages

### SMS marked as failed in logs
1. Check `sms_logs` table for `error_message`
2. Common issues:
   - Invalid phone number format
   - Insufficient Twilio credits
   - Country/region restrictions
   - Invalid Twilio credentials

### No SMS configuration warning
- If SMS service is not configured, a warning will be logged to console
- The application will continue working normally without SMS
- No error will be shown to users

## Cost Considerations

**Twilio Pricing (as of 2024):**
- Free trial: $15 credit
- SMS to India: ~$0.0070 per message
- ~2,142 SMS with free trial credits

**Production Recommendations:**
1. Set up monthly spending limits in Twilio
2. Monitor SMS usage in `sms_logs` table
3. Consider SMS batching for reminders
4. Implement rate limiting if needed

## Alternative SMS Providers

The SMS service can be adapted for other providers:

### Twilio (Current)
✅ Already implemented

### MSG91 (India-focused)
1. Update `sendViaTwilio` method in `src/services/smsService.ts`
2. Replace with MSG91 API endpoint and authentication

### AWS SNS
1. Update service to use AWS SDK
2. Configure AWS credentials

### Other Providers
The service is designed to be provider-agnostic. Update the `sendViaTwilio` method with your provider's API.

## Security Best Practices

1. ✅ Never commit `.env` file to git
2. ✅ Store credentials in environment variables only
3. ✅ Use RLS policies on `sms_logs` table
4. ✅ Implement rate limiting for SMS sending
5. ✅ Validate phone numbers before sending
6. ✅ Log all SMS activity for audit trail

## Future Enhancements

Potential improvements:
- [ ] Scheduled SMS reminders (cron job)
- [ ] SMS templates management in database
- [ ] Multi-language SMS support
- [ ] SMS delivery status tracking
- [ ] Bulk SMS sending
- [ ] SMS opt-out management
- [ ] SMS analytics dashboard

## Support

For issues or questions:
1. Check the console for error messages
2. Review `sms_logs` table for failed messages
3. Verify Twilio account status
4. Check Supabase logs for database errors

---

**Created**: 2025-10-06
**Version**: 1.0.0
**Service**: `src/services/smsService.ts`

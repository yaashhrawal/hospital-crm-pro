-- Email Logs Table for tracking all emails sent to patients
-- Run this SQL in your Supabase SQL Editor

CREATE TABLE IF NOT EXISTS email_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID REFERENCES patients(id) ON DELETE SET NULL,
  recipient_email VARCHAR(255) NOT NULL,
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  attachments TEXT[], -- Array of attachment filenames
  status VARCHAR(20) NOT NULL CHECK (status IN ('sent', 'failed', 'pending')),
  error_message TEXT,
  email_type VARCHAR(50) NOT NULL CHECK (email_type IN ('receipt', 'prescription', 'report', 'general')),
  provider VARCHAR(50) NOT NULL DEFAULT 'resend',
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_email_logs_patient_id ON email_logs(patient_id);
CREATE INDEX IF NOT EXISTS idx_email_logs_recipient_email ON email_logs(recipient_email);
CREATE INDEX IF NOT EXISTS idx_email_logs_sent_at ON email_logs(sent_at DESC);
CREATE INDEX IF NOT EXISTS idx_email_logs_status ON email_logs(status);
CREATE INDEX IF NOT EXISTS idx_email_logs_email_type ON email_logs(email_type);

-- Enable Row Level Security (RLS)
ALTER TABLE email_logs ENABLE ROW LEVEL SECURITY;

-- Create policies for email logs
-- Allow authenticated users to read email logs
CREATE POLICY "Allow authenticated users to read email logs"
  ON email_logs
  FOR SELECT
  TO authenticated
  USING (true);

-- Allow authenticated users to insert email logs
CREATE POLICY "Allow authenticated users to insert email logs"
  ON email_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Grant permissions
GRANT SELECT, INSERT ON email_logs TO authenticated;
GRANT SELECT, INSERT ON email_logs TO service_role;

-- Add comments for documentation
COMMENT ON TABLE email_logs IS 'Stores all emails sent to patients for tracking and auditing';
COMMENT ON COLUMN email_logs.patient_id IS 'Reference to the patient who received the email';
COMMENT ON COLUMN email_logs.recipient_email IS 'Email address where email was sent';
COMMENT ON COLUMN email_logs.subject IS 'Email subject line';
COMMENT ON COLUMN email_logs.body IS 'Email body content (HTML)';
COMMENT ON COLUMN email_logs.attachments IS 'Array of attachment filenames';
COMMENT ON COLUMN email_logs.status IS 'Status of email delivery (sent, failed, pending)';
COMMENT ON COLUMN email_logs.error_message IS 'Error message if email failed to send';
COMMENT ON COLUMN email_logs.email_type IS 'Type of email (receipt, prescription, report, general)';
COMMENT ON COLUMN email_logs.provider IS 'Email service provider used (resend, sendgrid, etc.)';
COMMENT ON COLUMN email_logs.sent_at IS 'Timestamp when email was sent';

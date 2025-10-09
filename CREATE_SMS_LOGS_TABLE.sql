-- SMS Logs Table for tracking all SMS messages sent to patients
-- Run this SQL in your Supabase SQL Editor

CREATE TABLE IF NOT EXISTS sms_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID REFERENCES patients(id) ON DELETE SET NULL,
  phone_number VARCHAR(20) NOT NULL,
  message TEXT NOT NULL,
  status VARCHAR(20) NOT NULL CHECK (status IN ('sent', 'failed', 'pending')),
  error_message TEXT,
  sms_type VARCHAR(50) NOT NULL CHECK (sms_type IN ('appointment_confirmation', 'registration', 'reminder', 'general')),
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_sms_logs_patient_id ON sms_logs(patient_id);
CREATE INDEX IF NOT EXISTS idx_sms_logs_phone_number ON sms_logs(phone_number);
CREATE INDEX IF NOT EXISTS idx_sms_logs_sent_at ON sms_logs(sent_at DESC);
CREATE INDEX IF NOT EXISTS idx_sms_logs_status ON sms_logs(status);
CREATE INDEX IF NOT EXISTS idx_sms_logs_sms_type ON sms_logs(sms_type);

-- Enable Row Level Security (RLS)
ALTER TABLE sms_logs ENABLE ROW LEVEL SECURITY;

-- Create policies for SMS logs
-- Allow authenticated users to read SMS logs
CREATE POLICY "Allow authenticated users to read SMS logs"
  ON sms_logs
  FOR SELECT
  TO authenticated
  USING (true);

-- Allow authenticated users to insert SMS logs
CREATE POLICY "Allow authenticated users to insert SMS logs"
  ON sms_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Grant permissions
GRANT SELECT, INSERT ON sms_logs TO authenticated;
GRANT SELECT, INSERT ON sms_logs TO service_role;

-- Add comments for documentation
COMMENT ON TABLE sms_logs IS 'Stores all SMS messages sent to patients for tracking and auditing';
COMMENT ON COLUMN sms_logs.patient_id IS 'Reference to the patient who received the SMS';
COMMENT ON COLUMN sms_logs.phone_number IS 'Phone number where SMS was sent';
COMMENT ON COLUMN sms_logs.message IS 'Content of the SMS message';
COMMENT ON COLUMN sms_logs.status IS 'Status of SMS delivery (sent, failed, pending)';
COMMENT ON COLUMN sms_logs.error_message IS 'Error message if SMS failed to send';
COMMENT ON COLUMN sms_logs.sms_type IS 'Type of SMS (appointment_confirmation, registration, reminder, general)';
COMMENT ON COLUMN sms_logs.sent_at IS 'Timestamp when SMS was sent';

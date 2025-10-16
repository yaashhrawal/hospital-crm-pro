import { supabase } from '../config/supabase';

interface EmailConfig {
  apiKey: string;
  fromEmail: string;
  fromName: string;
  enabled: boolean;
}

interface EmailAttachment {
  filename: string;
  content: string; // Base64 encoded content
  type?: string; // MIME type (optional)
}

interface EmailLog {
  patient_id?: string;
  recipient_email: string;
  subject: string;
  body: string;
  attachments?: string[]; // Array of attachment filenames
  status: 'sent' | 'failed' | 'pending';
  error_message?: string;
  email_type: 'receipt' | 'prescription' | 'report' | 'general';
  provider: 'resend' | 'sendgrid' | 'other';
}

export class EmailService {
  private static config: EmailConfig = {
    apiKey: import.meta.env.VITE_EMAIL_API_KEY || '',
    fromEmail: import.meta.env.VITE_EMAIL_FROM || 'onboarding@resend.dev',
    fromName: import.meta.env.VITE_EMAIL_FROM_NAME || 'Valant Hospital',
    enabled: import.meta.env.VITE_EMAIL_ENABLED === 'true',
  };

  /**
   * Check if email service is properly configured
   */
  static isConfigured(): boolean {
    return !!(this.config.enabled && this.config.apiKey && this.config.fromEmail);
  }

  /**
   * Send email using Supabase Edge Function (bypasses CORS)
   */
  private static async sendViaResend(
    to: string,
    subject: string,
    htmlBody: string,
    attachments?: EmailAttachment[]
  ): Promise<{ success: boolean; error?: string; emailId?: string }> {
    try {
      // Use Supabase Edge Function to avoid CORS issues
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

      const payload: any = {
        to,
        subject,
        html: htmlBody,
        from: this.config.fromEmail,
        fromName: this.config.fromName,
      };

      // Add attachments if provided
      if (attachments && attachments.length > 0) {
        payload.attachments = attachments.map(att => ({
          filename: att.filename,
          content: att.content,
        }));
      }

      console.log('📤 Sending request to Edge Function:', `${supabaseUrl}/functions/v1/send-email`);
      console.log('📤 Payload:', { to, subject, hasAttachments: !!attachments?.length });

      const response = await fetch(`${supabaseUrl}/functions/v1/send-email`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      console.log('📥 Response status:', response.status, response.statusText);

      let data;
      try {
        data = await response.json();
        console.log('📥 Response data:', data);
      } catch (parseError) {
        console.error('❌ Failed to parse response as JSON:', parseError);
        throw new Error(`Edge Function returned status ${response.status} with non-JSON response`);
      }

      if (!response.ok || !data.success) {
        console.error('❌ Email sending error - Status:', response.status);
        console.error('❌ Email sending error - Data:', data);
        const errorMsg = data.error || data.message || `Edge Function failed with status ${response.status}`;
        throw new Error(errorMsg);
      }

      console.log('✅ Email sent successfully:', data);
      return {
        success: true,
        emailId: data.data?.id,
      };
    } catch (error: any) {
      console.error('❌ Email sending error:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Log email to database for tracking
   */
  private static async logEmail(log: EmailLog): Promise<void> {
    try {
      await supabase.from('email_logs').insert([{
        patient_id: log.patient_id,
        recipient_email: log.recipient_email,
        subject: log.subject,
        body: log.body,
        attachments: log.attachments,
        status: log.status,
        error_message: log.error_message,
        email_type: log.email_type,
        provider: log.provider,
        sent_at: new Date().toISOString(),
      }]);
    } catch (error) {
      console.error('Failed to log email:', error);
      // Don't throw - logging failure shouldn't break email sending
    }
  }

  /**
   * Send receipt email to patient
   */
  static async sendReceipt(
    patientId: string,
    patientName: string,
    patientEmail: string,
    receiptHtml: string,
    receiptNumber: string,
    pdfBase64?: string
  ): Promise<{ success: boolean; error?: string }> {
    if (!this.isConfigured()) {
      console.warn('Email service not configured - skipping email');
      return { success: false, error: 'Email service not configured' };
    }

    const subject = `Receipt #${receiptNumber} - Valant Hospital`;

    const emailBody = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #0056B3; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background-color: #f9f9f9; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
          .receipt-box { background: white; padding: 20px; margin: 20px 0; border: 1px solid #ddd; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Valant Hospital</h1>
          </div>
          <div class="content">
            <h2>Dear ${patientName},</h2>
            <p>Thank you for choosing Valant Hospital. Please find your receipt attached below.</p>

            <div class="receipt-box">
              ${receiptHtml}
            </div>

            <p>If you have any questions about this receipt, please contact us.</p>

            <p>Best regards,<br>
            <strong>Valant Hospital Team</strong></p>
          </div>
          <div class="footer">
            <p>This is an automated email. Please do not reply to this message.</p>
            <p>&copy; 2025 Valant Hospital. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const attachments: EmailAttachment[] = [];
    if (pdfBase64) {
      attachments.push({
        filename: `receipt_${receiptNumber}.pdf`,
        content: pdfBase64,
        type: 'application/pdf',
      });
    }

    const result = await this.sendViaResend(patientEmail, subject, emailBody, attachments);

    await this.logEmail({
      patient_id: patientId,
      recipient_email: patientEmail,
      subject,
      body: emailBody,
      attachments: attachments.map(a => a.filename),
      status: result.success ? 'sent' : 'failed',
      error_message: result.error,
      email_type: 'receipt',
      provider: 'resend',
    });

    return result;
  }

  /**
   * Send prescription email to patient
   */
  static async sendPrescription(
    patientId: string,
    patientName: string,
    patientEmail: string,
    prescriptionHtml: string,
    doctorName: string,
    pdfBase64?: string
  ): Promise<{ success: boolean; error?: string }> {
    if (!this.isConfigured()) {
      console.warn('Email service not configured - skipping email');
      return { success: false, error: 'Email service not configured' };
    }

    const subject = `Prescription from Dr. ${doctorName} - Valant Hospital`;

    const emailBody = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #0056B3; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background-color: #f9f9f9; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
          .prescription-box { background: white; padding: 20px; margin: 20px 0; border: 1px solid #ddd; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Valant Hospital</h1>
          </div>
          <div class="content">
            <h2>Dear ${patientName},</h2>
            <p>Please find your prescription from Dr. ${doctorName} below.</p>

            <div class="prescription-box">
              ${prescriptionHtml}
            </div>

            <p><strong>Important:</strong> Please follow the prescribed medication and dosage as directed by your doctor.</p>

            <p>Best regards,<br>
            <strong>Valant Hospital Team</strong></p>
          </div>
          <div class="footer">
            <p>This is an automated email. Please do not reply to this message.</p>
            <p>&copy; 2025 Valant Hospital. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const attachments: EmailAttachment[] = [];
    if (pdfBase64) {
      attachments.push({
        filename: `prescription_${patientName.replace(/\s+/g, '_')}.pdf`,
        content: pdfBase64,
        type: 'application/pdf',
      });
    }

    const result = await this.sendViaResend(patientEmail, subject, emailBody, attachments);

    await this.logEmail({
      patient_id: patientId,
      recipient_email: patientEmail,
      subject,
      body: emailBody,
      attachments: attachments.map(a => a.filename),
      status: result.success ? 'sent' : 'failed',
      error_message: result.error,
      email_type: 'prescription',
      provider: 'resend',
    });

    return result;
  }

  /**
   * Send custom email
   */
  static async sendCustomEmail(
    recipientEmail: string,
    subject: string,
    htmlBody: string,
    patientId?: string,
    attachments?: EmailAttachment[]
  ): Promise<{ success: boolean; error?: string }> {
    console.log('🔵 sendCustomEmail called with:', {
      recipientEmail,
      subject,
      patientId,
      attachmentsCount: attachments?.length || 0,
      isConfigured: this.isConfigured()
    });

    if (!this.isConfigured()) {
      console.warn('❌ Email service not configured - skipping email');
      console.warn('Config:', {
        enabled: this.config.enabled,
        apiKey: this.config.apiKey ? 'present' : 'missing',
        fromEmail: this.config.fromEmail
      });
      return { success: false, error: 'Email service not configured' };
    }

    const result = await this.sendViaResend(recipientEmail, subject, htmlBody, attachments);
    console.log('🔵 sendCustomEmail result:', result);

    await this.logEmail({
      patient_id: patientId,
      recipient_email: recipientEmail,
      subject,
      body: htmlBody,
      attachments: attachments?.map(a => a.filename),
      status: result.success ? 'sent' : 'failed',
      error_message: result.error,
      email_type: 'general',
      provider: 'resend',
    });

    return result;
  }

  /**
   * Get email logs for a patient
   */
  static async getEmailLogs(patientId: string) {
    try {
      const { data, error } = await supabase
        .from('email_logs')
        .select('*')
        .eq('patient_id', patientId)
        .order('sent_at', { ascending: false });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Failed to fetch email logs:', error);
      return [];
    }
  }
}

export default EmailService;

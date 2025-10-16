import { supabase } from '../config/supabase';

interface SMSConfig {
  accountSid: string;
  authToken: string;
  fromNumber: string;
  enabled: boolean;
}

interface SMSLog {
  patient_id?: string;
  phone_number: string;
  message: string;
  status: 'sent' | 'failed' | 'pending';
  error_message?: string;
  sms_type: 'appointment_confirmation' | 'registration' | 'reminder' | 'general';
}

export class SMSService {
  private static config: SMSConfig = {
    accountSid: import.meta.env.VITE_TWILIO_ACCOUNT_SID || '',
    authToken: import.meta.env.VITE_TWILIO_AUTH_TOKEN || '',
    fromNumber: import.meta.env.VITE_TWILIO_PHONE_NUMBER || '',
    enabled: import.meta.env.VITE_SMS_ENABLED === 'true',
  };

  /**
   * Check if SMS service is properly configured
   */
  static isConfigured(): boolean {
    return !!(
      this.config.enabled &&
      this.config.accountSid &&
      this.config.authToken &&
      this.config.fromNumber
    );
  }

  /**
   * Send SMS using Twilio API
   */
  private static async sendViaTwilio(
    to: string,
    message: string
  ): Promise<{ success: boolean; error?: string; messageId?: string }> {
    try {
      const url = `https://api.twilio.com/2010-04-01/Accounts/${this.config.accountSid}/Messages.json`;

      const formData = new URLSearchParams();
      formData.append('To', to);
      formData.append('From', this.config.fromNumber);
      formData.append('Body', message);

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': 'Basic ' + btoa(`${this.config.accountSid}:${this.config.authToken}`),
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to send SMS');
      }

      return {
        success: true,
        messageId: data.sid,
      };
    } catch (error: any) {
      console.error('Twilio SMS error:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Log SMS to database for tracking
   */
  private static async logSMS(log: SMSLog): Promise<void> {
    try {
      await supabase.from('sms_logs').insert([{
        patient_id: log.patient_id,
        phone_number: log.phone_number,
        message: log.message,
        status: log.status,
        error_message: log.error_message,
        sms_type: log.sms_type,
        sent_at: new Date().toISOString(),
      }]);
    } catch (error) {
      console.error('Failed to log SMS:', error);
      // Don't throw - logging failure shouldn't break SMS sending
    }
  }

  /**
   * Format Indian phone number
   */
  private static formatPhoneNumber(phone: string): string {
    // Remove all non-numeric characters
    const cleaned = phone.replace(/\D/g, '');

    // Add country code if not present
    if (cleaned.length === 10) {
      return `+91${cleaned}`;
    } else if (cleaned.startsWith('91') && cleaned.length === 12) {
      return `+${cleaned}`;
    }

    return phone; // Return as-is if format is unclear
  }

  /**
   * Send appointment confirmation SMS
   */
  static async sendAppointmentConfirmation(
    patientId: string,
    patientName: string,
    phoneNumber: string,
    appointmentDate: string,
    appointmentTime: string,
    doctorName: string,
    registrationNo: string
  ): Promise<{ success: boolean; error?: string }> {
    if (!this.isConfigured()) {
      console.warn('SMS service not configured - skipping SMS');
      return { success: false, error: 'SMS service not configured' };
    }

    const formattedPhone = this.formatPhoneNumber(phoneNumber);

    const message = `Dear ${patientName},

Your appointment has been confirmed!

Registration No: ${registrationNo}
Date: ${appointmentDate}
Time: ${appointmentTime}
Doctor: Dr. ${doctorName}

Thank you for choosing our hospital.

- Valant Hospital`;

    const result = await this.sendViaTwilio(formattedPhone, message);

    await this.logSMS({
      patient_id: patientId,
      phone_number: formattedPhone,
      message,
      status: result.success ? 'sent' : 'failed',
      error_message: result.error,
      sms_type: 'appointment_confirmation',
    });

    return result;
  }

  /**
   * Send patient registration confirmation SMS
   */
  static async sendRegistrationConfirmation(
    patientId: string,
    patientName: string,
    phoneNumber: string,
    registrationNo: string,
    registrationDate: string,
    doctorName: string,
    department: string
  ): Promise<{ success: boolean; error?: string }> {
    if (!this.isConfigured()) {
      console.warn('SMS service not configured - skipping SMS');
      return { success: false, error: 'SMS service not configured' };
    }

    const formattedPhone = this.formatPhoneNumber(phoneNumber);

    const message = `Dear ${patientName},

Welcome to Valant Hospital!

Registration No: ${registrationNo}
Date: ${registrationDate}
Department: ${department}
Assigned Doctor: Dr. ${doctorName}

Your registration is complete. Please keep your registration number for future reference.

Thank you!

- Valant Hospital`;

    const result = await this.sendViaTwilio(formattedPhone, message);

    await this.logSMS({
      patient_id: patientId,
      phone_number: formattedPhone,
      message,
      status: result.success ? 'sent' : 'failed',
      error_message: result.error,
      sms_type: 'registration',
    });

    return result;
  }

  /**
   * Send appointment reminder SMS
   */
  static async sendAppointmentReminder(
    patientId: string,
    patientName: string,
    phoneNumber: string,
    appointmentDate: string,
    appointmentTime: string,
    doctorName: string
  ): Promise<{ success: boolean; error?: string }> {
    if (!this.isConfigured()) {
      console.warn('SMS service not configured - skipping SMS');
      return { success: false, error: 'SMS service not configured' };
    }

    const formattedPhone = this.formatPhoneNumber(phoneNumber);

    const message = `Dear ${patientName},

Reminder: You have an appointment tomorrow!

Date: ${appointmentDate}
Time: ${appointmentTime}
Doctor: Dr. ${doctorName}

Please arrive 15 minutes early.

- Valant Hospital`;

    const result = await this.sendViaTwilio(formattedPhone, message);

    await this.logSMS({
      patient_id: patientId,
      phone_number: formattedPhone,
      message,
      status: result.success ? 'sent' : 'failed',
      error_message: result.error,
      sms_type: 'reminder',
    });

    return result;
  }

  /**
   * Send custom SMS
   */
  static async sendCustomSMS(
    phoneNumber: string,
    message: string,
    patientId?: string
  ): Promise<{ success: boolean; error?: string }> {
    if (!this.isConfigured()) {
      console.warn('SMS service not configured - skipping SMS');
      return { success: false, error: 'SMS service not configured' };
    }

    const formattedPhone = this.formatPhoneNumber(phoneNumber);
    const result = await this.sendViaTwilio(formattedPhone, message);

    await this.logSMS({
      patient_id: patientId,
      phone_number: formattedPhone,
      message,
      status: result.success ? 'sent' : 'failed',
      error_message: result.error,
      sms_type: 'general',
    });

    return result;
  }

  /**
   * Get SMS logs for a patient
   */
  static async getSMSLogs(patientId: string) {
    try {
      const { data, error } = await supabase
        .from('sms_logs')
        .select('*')
        .eq('patient_id', patientId)
        .order('sent_at', { ascending: false });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Failed to fetch SMS logs:', error);
      return [];
    }
  }
}

export default SMSService;

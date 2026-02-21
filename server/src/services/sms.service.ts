import { env } from '../config/env';
import db from '../db/knex';
import logger from '../utils/logger';
import { v4 as uuidv4 } from 'uuid';

interface SendSMSParams {
  to: string;
  message: string;
  patientId?: string;
  smsType?: string;
}

interface SMSResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

function formatPhone(phone: string): string {
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.startsWith('91') && cleaned.length === 12) return `+${cleaned}`;
  if (cleaned.length === 10) return `+91${cleaned}`;
  return `+${cleaned}`;
}

export class SMSService {
  private static isMockMode(): boolean {
    return !env.TWILIO_ACCOUNT_SID || !env.TWILIO_AUTH_TOKEN;
  }

  static async send(params: SendSMSParams): Promise<SMSResult> {
    const formattedPhone = formatPhone(params.to);
    const logId = uuidv4();

    // Log the attempt
    await db('sms_logs').insert({
      id: logId,
      phone_number: formattedPhone,
      message: params.message,
      sms_type: params.smsType || 'general',
      patient_id: params.patientId || null,
      status: 'sending',
      hospital_id: env.HOSPITAL_ID,
      created_at: new Date(),
    }).catch(() => {
      // sms_logs table might not exist yet, log and continue
      logger.warn('sms_logs table not available, skipping log');
    });

    if (this.isMockMode()) {
      logger.info({ to: formattedPhone, message: params.message }, 'MOCK SMS sent');
      await this.updateLog(logId, 'sent', 'mock-' + Date.now());
      return { success: true, messageId: 'mock-' + Date.now() };
    }

    try {
      const twilio = await import('twilio');
      const client = twilio.default(env.TWILIO_ACCOUNT_SID, env.TWILIO_AUTH_TOKEN);
      const result = await client.messages.create({
        body: params.message,
        from: env.TWILIO_PHONE_NUMBER,
        to: formattedPhone,
      });

      await this.updateLog(logId, 'sent', result.sid);
      logger.info({ sid: result.sid, to: formattedPhone }, 'SMS sent successfully');
      return { success: true, messageId: result.sid };
    } catch (err: any) {
      await this.updateLog(logId, 'failed', undefined, err.message);
      logger.error({ err, to: formattedPhone }, 'SMS send failed');
      return { success: false, error: err.message };
    }
  }

  static async sendAppointmentConfirmation(patientName: string, phone: string, date: string, time: string, doctorName: string, patientId?: string): Promise<SMSResult> {
    const message = `Dear ${patientName}, your appointment is confirmed for ${date} at ${time} with Dr. ${doctorName}. Please arrive 15 minutes early. - Hospital Management`;
    return this.send({ to: phone, message, patientId, smsType: 'appointment_confirmation' });
  }

  static async sendRegistrationConfirmation(patientName: string, phone: string, uhid: string, patientId?: string): Promise<SMSResult> {
    const message = `Dear ${patientName}, your registration is successful. Your UHID: ${uhid}. Please keep this for future reference. - Hospital Management`;
    return this.send({ to: phone, message, patientId, smsType: 'registration' });
  }

  static async sendFollowUpReminder(patientName: string, phone: string, date: string, doctorName: string, patientId?: string): Promise<SMSResult> {
    const message = `Dear ${patientName}, this is a reminder for your follow-up appointment on ${date} with Dr. ${doctorName}. - Hospital Management`;
    return this.send({ to: phone, message, patientId, smsType: 'followup_reminder' });
  }

  static async getLogs(filters: { patientId?: string; limit?: number; offset?: number }): Promise<any[]> {
    let query = db('sms_logs')
      .where('hospital_id', env.HOSPITAL_ID)
      .orderBy('created_at', 'desc');

    if (filters.patientId) query = query.where('patient_id', filters.patientId);
    if (filters.limit) query = query.limit(filters.limit);
    if (filters.offset) query = query.offset(filters.offset);

    return query.catch(() => []);
  }

  private static async updateLog(logId: string, status: string, messageId?: string, errorMsg?: string) {
    await db('sms_logs')
      .where('id', logId)
      .update({
        status,
        external_id: messageId,
        error_message: errorMsg,
        sent_at: status === 'sent' ? new Date() : null,
      })
      .catch(() => {});
  }
}

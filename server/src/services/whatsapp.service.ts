import { env } from '../config/env';
import db from '../db/knex';
import logger from '../utils/logger';
import { v4 as uuidv4 } from 'uuid';

interface WhatsAppParams {
  to: string;
  message: string;
  patientId?: string;
  category?: string;
}

interface WhatsAppResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

function formatPhone(phone: string): string {
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.startsWith('91') && cleaned.length === 12) return cleaned;
  if (cleaned.length === 10) return `91${cleaned}`;
  return cleaned;
}

export class WhatsAppService {
  private static isMockMode(): boolean {
    return !env.WHATSAPP_API_TOKEN || !env.WHATSAPP_PHONE_NUMBER_ID;
  }

  static async send(params: WhatsAppParams): Promise<WhatsAppResult> {
    const phone = formatPhone(params.to);

    // Log the attempt
    const logId = uuidv4();
    await db('notification_logs').insert({
      id: logId,
      notification_number: `WA-${Date.now()}`,
      recipient_phone: phone,
      channel: 'whatsapp',
      category: params.category || 'general',
      message_content: params.message,
      status: 'sending',
      patient_id: params.patientId || null,
      hospital_id: env.HOSPITAL_ID,
      created_at: new Date(),
    }).catch(() => {
      logger.warn('notification_logs table not available');
    });

    if (this.isMockMode()) {
      logger.info({ to: phone, message: params.message }, 'MOCK WhatsApp sent');
      await this.updateLog(logId, 'sent', 'mock-wa-' + Date.now());
      return { success: true, messageId: 'mock-wa-' + Date.now() };
    }

    try {
      // Meta WhatsApp Cloud API
      const response = await fetch(
        `https://graph.facebook.com/v18.0/${env.WHATSAPP_PHONE_NUMBER_ID}/messages`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${env.WHATSAPP_API_TOKEN}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            messaging_product: 'whatsapp',
            to: phone,
            type: 'text',
            text: { body: params.message },
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || 'WhatsApp API error');
      }

      const messageId = data.messages?.[0]?.id || 'unknown';
      await this.updateLog(logId, 'sent', messageId);
      logger.info({ messageId, to: phone }, 'WhatsApp sent successfully');
      return { success: true, messageId };
    } catch (err: any) {
      await this.updateLog(logId, 'failed', undefined, err.message);
      logger.error({ err, to: phone }, 'WhatsApp send failed');
      return { success: false, error: err.message };
    }
  }

  static async sendAppointmentReminder(patientName: string, phone: string, date: string, time: string, doctorName: string, patientId?: string): Promise<WhatsAppResult> {
    const message = `Hello ${patientName}! 🏥\n\nThis is a reminder for your appointment:\n📅 Date: ${date}\n⏰ Time: ${time}\n👨‍⚕️ Doctor: Dr. ${doctorName}\n\nPlease arrive 15 minutes early. Reply CONFIRM to confirm your appointment.`;
    return this.send({ to: phone, message, patientId, category: 'appointment_reminder' });
  }

  static async sendFollowUpReminder(patientName: string, phone: string, date: string, doctorName: string, patientId?: string): Promise<WhatsAppResult> {
    const message = `Hello ${patientName}! 🏥\n\nYou have a follow-up appointment scheduled:\n📅 Date: ${date}\n👨‍⚕️ Doctor: Dr. ${doctorName}\n\nPlease don't miss your follow-up. Your health matters!`;
    return this.send({ to: phone, message, patientId, category: 'followup_reminder' });
  }

  private static async updateLog(logId: string, status: string, messageId?: string, errorMsg?: string) {
    await db('notification_logs')
      .where('id', logId)
      .update({
        status,
        sent_at: status === 'sent' ? new Date() : null,
        error_message: errorMsg,
      })
      .catch(() => {});
  }
}

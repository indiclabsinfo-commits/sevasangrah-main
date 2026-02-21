import db from '../db/knex';
import { env } from '../config/env';
import { SMSService } from './sms.service';
import { WhatsAppService } from './whatsapp.service';
import logger from '../utils/logger';
import { v4 as uuidv4 } from 'uuid';

interface SendNotificationParams {
  channel: 'sms' | 'whatsapp';
  recipientName?: string;
  recipientPhone: string;
  message: string;
  category?: string;
  patientId?: string;
  templateId?: string;
  scheduledFor?: string;
}

export class NotificationService {
  static async send(params: SendNotificationParams) {
    const logId = uuidv4();
    const notificationNumber = `NOTIF-${Date.now()}`;

    // Log notification
    await db('notification_logs').insert({
      id: logId,
      notification_number: notificationNumber,
      template_id: params.templateId || null,
      recipient_name: params.recipientName,
      recipient_phone: params.recipientPhone,
      channel: params.channel,
      category: params.category || 'general',
      message_content: params.message,
      status: 'queued',
      scheduled_for: params.scheduledFor || null,
      patient_id: params.patientId || null,
      hospital_id: env.HOSPITAL_ID,
      created_at: new Date(),
    }).catch(() => {
      logger.warn('notification_logs table not available');
    });

    let result;
    if (params.channel === 'sms') {
      result = await SMSService.send({
        to: params.recipientPhone,
        message: params.message,
        patientId: params.patientId,
        smsType: params.category,
      });
    } else {
      result = await WhatsAppService.send({
        to: params.recipientPhone,
        message: params.message,
        patientId: params.patientId,
        category: params.category,
      });
    }

    // Update log
    await db('notification_logs')
      .where('id', logId)
      .update({
        status: result.success ? 'sent' : 'failed',
        sent_at: result.success ? new Date() : null,
        error_message: result.error || null,
      })
      .catch(() => {});

    return { ...result, notificationNumber, logId };
  }

  static async getTemplates() {
    return db('notification_templates')
      .where('hospital_id', env.HOSPITAL_ID)
      .where('is_active', true)
      .orderBy('category')
      .catch(() => []);
  }

  static async createTemplate(template: {
    templateName: string;
    templateType: 'sms' | 'whatsapp' | 'email';
    category: string;
    content: string;
    variables: string[];
    language?: string;
  }) {
    const id = uuidv4();
    await db('notification_templates').insert({
      id,
      template_name: template.templateName,
      template_type: template.templateType,
      category: template.category,
      language: template.language || 'en',
      content: template.content,
      variables: JSON.stringify(template.variables),
      character_count: template.content.length,
      is_active: true,
      hospital_id: env.HOSPITAL_ID,
      created_at: new Date(),
    });
    return { id };
  }

  static async getLogs(filters: { page?: number; limit?: number; channel?: string; status?: string }) {
    const page = filters.page || 1;
    const limit = filters.limit || 50;
    const offset = (page - 1) * limit;

    let query = db('notification_logs')
      .where('hospital_id', env.HOSPITAL_ID);

    if (filters.channel) query = query.where('channel', filters.channel);
    if (filters.status) query = query.where('status', filters.status);

    const [logs, countResult] = await Promise.all([
      query.clone().orderBy('created_at', 'desc').limit(limit).offset(offset),
      query.clone().count('* as total').first(),
    ]).catch(() => [[], { total: 0 }]);

    return {
      logs: logs || [],
      total: Number((countResult as any)?.total || 0),
      page,
      limit,
    };
  }

  static async getStats() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const stats = await db('notification_logs')
      .where('hospital_id', env.HOSPITAL_ID)
      .select(
        db.raw("COUNT(*) as total"),
        db.raw("COUNT(*) FILTER (WHERE status = 'sent' OR status = 'delivered') as sent"),
        db.raw("COUNT(*) FILTER (WHERE status = 'failed') as failed"),
        db.raw("COUNT(*) FILTER (WHERE channel = 'sms') as sms_count"),
        db.raw("COUNT(*) FILTER (WHERE channel = 'whatsapp') as whatsapp_count"),
        db.raw("COUNT(*) FILTER (WHERE created_at >= ?) as today_count", [today]),
      )
      .first()
      .catch(() => ({
        total: 0, sent: 0, failed: 0, sms_count: 0, whatsapp_count: 0, today_count: 0,
      }));

    return stats;
  }
}

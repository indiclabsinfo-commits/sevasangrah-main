import db from '../db/knex';
import { env } from '../config/env';
import { SMSService } from './sms.service';
import logger from '../utils/logger';
import { v4 as uuidv4 } from 'uuid';

const OTP_EXPIRY_MINUTES = 5;
const MAX_ATTEMPTS = 3;

export class OTPService {
  static generateOTP(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  static async send(phoneNumber: string, purpose: 'registration' | 'login' | 'verification'): Promise<{ success: boolean; message: string }> {
    const otpCode = this.generateOTP();
    const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

    // Invalidate any previous OTPs for this phone
    await db('otp_verifications')
      .where('phone_number', phoneNumber)
      .where('purpose', purpose)
      .where('verified', false)
      .delete()
      .catch(() => {});

    // Store OTP
    await db('otp_verifications').insert({
      id: uuidv4(),
      phone_number: phoneNumber,
      otp_code: otpCode,
      purpose,
      expires_at: expiresAt,
      verified: false,
      attempts: 0,
      hospital_id: env.HOSPITAL_ID,
      created_at: new Date(),
    }).catch((err) => {
      logger.error({ err }, 'Failed to store OTP, table might not exist');
      // Continue anyway - for mock mode
    });

    // Send via SMS
    const smsResult = await SMSService.send({
      to: phoneNumber,
      message: `Your verification code is: ${otpCode}. Valid for ${OTP_EXPIRY_MINUTES} minutes. Do not share this code.`,
      smsType: 'otp',
    });

    logger.info({ phone: phoneNumber, purpose, mock: !env.TWILIO_ACCOUNT_SID }, 'OTP sent');

    return {
      success: smsResult.success,
      message: smsResult.success
        ? `OTP sent to ${phoneNumber.slice(-4).padStart(phoneNumber.length, '*')}`
        : `Failed to send OTP: ${smsResult.error}`,
    };
  }

  static async verify(phoneNumber: string, otpCode: string): Promise<{ success: boolean; message: string }> {
    const record = await db('otp_verifications')
      .where('phone_number', phoneNumber)
      .where('verified', false)
      .orderBy('created_at', 'desc')
      .first()
      .catch(() => null);

    if (!record) {
      return { success: false, message: 'No OTP found for this number. Please request a new one.' };
    }

    if (new Date(record.expires_at) < new Date()) {
      return { success: false, message: 'OTP has expired. Please request a new one.' };
    }

    if (record.attempts >= MAX_ATTEMPTS) {
      return { success: false, message: 'Maximum attempts exceeded. Please request a new OTP.' };
    }

    // Increment attempts
    await db('otp_verifications')
      .where('id', record.id)
      .update({ attempts: record.attempts + 1 })
      .catch(() => {});

    if (record.otp_code !== otpCode) {
      return { success: false, message: 'Invalid OTP. Please try again.' };
    }

    // Mark as verified
    await db('otp_verifications')
      .where('id', record.id)
      .update({ verified: true })
      .catch(() => {});

    logger.info({ phone: phoneNumber }, 'OTP verified successfully');
    return { success: true, message: 'Phone number verified successfully.' };
  }
}

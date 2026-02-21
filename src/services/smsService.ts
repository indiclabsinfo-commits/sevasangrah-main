/**
 * SMS Service — Routes all SMS operations through the backend server.
 * No Twilio keys are stored or used in the frontend.
 */

import api from './apiService';

interface SMSResult {
  success: boolean;
  error?: string;
  messageId?: string;
}

export class SMSService {
  /**
   * Check if SMS service is available (backend handles actual config check)
   */
  static isConfigured(): boolean {
    // Always return true — the backend decides whether to send real or mock SMS
    return true;
  }

  /**
   * Send appointment confirmation SMS via backend
   */
  static async sendAppointmentConfirmation(
    patientId: string,
    patientName: string,
    phoneNumber: string,
    appointmentDate: string,
    appointmentTime: string,
    doctorName: string,
    _registrationNo: string
  ): Promise<SMSResult> {
    try {
      const result = await api.sms.sendAppointmentConfirmation({
        patientName,
        phone: phoneNumber,
        date: appointmentDate,
        time: appointmentTime,
        doctorName,
        patientId,
      });
      return { success: true, messageId: result?.messageId };
    } catch (error: any) {
      console.error('SMS send error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Send patient registration confirmation SMS via backend
   */
  static async sendRegistrationConfirmation(
    patientId: string,
    patientName: string,
    phoneNumber: string,
    registrationNo: string,
    _registrationDate: string,
    _doctorName: string,
    _department: string
  ): Promise<SMSResult> {
    try {
      const result = await api.sms.sendRegistrationConfirmation({
        patientName,
        phone: phoneNumber,
        uhid: registrationNo,
        patientId,
      });
      return { success: true, messageId: result?.messageId };
    } catch (error: any) {
      console.error('SMS send error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Send appointment reminder SMS via backend
   */
  static async sendAppointmentReminder(
    patientId: string,
    patientName: string,
    phoneNumber: string,
    appointmentDate: string,
    _appointmentTime: string,
    doctorName: string
  ): Promise<SMSResult> {
    try {
      const result = await api.sms.sendReminder({
        patientName,
        phone: phoneNumber,
        date: appointmentDate,
        doctorName,
        patientId,
      });
      return { success: true, messageId: result?.messageId };
    } catch (error: any) {
      console.error('SMS send error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Send custom SMS via backend
   */
  static async sendCustomSMS(
    phoneNumber: string,
    message: string,
    patientId?: string
  ): Promise<SMSResult> {
    try {
      const result = await api.sms.send(phoneNumber, message, patientId);
      return { success: true, messageId: result?.messageId };
    } catch (error: any) {
      console.error('SMS send error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get SMS logs for a patient
   */
  static async getSMSLogs(patientId?: string) {
    try {
      return await api.sms.getLogs(patientId);
    } catch (error) {
      console.error('Failed to fetch SMS logs:', error);
      return [];
    }
  }
}

export default SMSService;

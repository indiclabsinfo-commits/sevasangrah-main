import { Router, Request, Response } from 'express';
import { SMSService } from '../services/sms.service';
import { success, error } from '../utils/response';

const router = Router();

// Send custom SMS
router.post('/send', async (req: Request, res: Response) => {
  try {
    const { to, message, patientId, smsType } = req.body;
    if (!to || !message) return error(res, 'Missing required fields: to, message', 400);

    const result = await SMSService.send({ to, message, patientId, smsType });
    return success(res, result);
  } catch (err: any) {
    return error(res, err.message, 500);
  }
});

// Send appointment confirmation
router.post('/send-appointment-confirmation', async (req: Request, res: Response) => {
  try {
    const { patientName, phone, date, time, doctorName, patientId } = req.body;
    if (!phone || !patientName) return error(res, 'Missing required fields', 400);

    const result = await SMSService.sendAppointmentConfirmation(patientName, phone, date, time, doctorName, patientId);
    return success(res, result);
  } catch (err: any) {
    return error(res, err.message, 500);
  }
});

// Send registration confirmation
router.post('/send-registration-confirmation', async (req: Request, res: Response) => {
  try {
    const { patientName, phone, uhid, patientId } = req.body;
    if (!phone || !patientName) return error(res, 'Missing required fields', 400);

    const result = await SMSService.sendRegistrationConfirmation(patientName, phone, uhid || 'N/A', patientId);
    return success(res, result);
  } catch (err: any) {
    return error(res, err.message, 500);
  }
});

// Send follow-up reminder
router.post('/send-reminder', async (req: Request, res: Response) => {
  try {
    const { patientName, phone, date, doctorName, patientId } = req.body;
    if (!phone || !patientName) return error(res, 'Missing required fields', 400);

    const result = await SMSService.sendFollowUpReminder(patientName, phone, date, doctorName, patientId);
    return success(res, result);
  } catch (err: any) {
    return error(res, err.message, 500);
  }
});

// Get SMS logs
router.get('/logs', async (req: Request, res: Response) => {
  try {
    const { patient_id, limit, offset } = req.query;
    const logs = await SMSService.getLogs({
      patientId: patient_id as string,
      limit: limit ? parseInt(limit as string) : 50,
      offset: offset ? parseInt(offset as string) : 0,
    });
    return success(res, logs);
  } catch (err: any) {
    return error(res, err.message, 500);
  }
});

export default router;

import { Router, Request, Response } from 'express';
import { WhatsAppService } from '../services/whatsapp.service';
import { success, error } from '../utils/response';

const router = Router();

// Send WhatsApp message
router.post('/send', async (req: Request, res: Response) => {
  try {
    const { to, message, patientId, category } = req.body;
    if (!to || !message) return error(res, 'Missing required fields: to, message', 400);

    const result = await WhatsAppService.send({ to, message, patientId, category });
    return success(res, result);
  } catch (err: any) {
    return error(res, err.message, 500);
  }
});

// Send appointment reminder
router.post('/send-reminder', async (req: Request, res: Response) => {
  try {
    const { patientName, phone, date, time, doctorName, patientId } = req.body;
    if (!phone || !patientName) return error(res, 'Missing required fields', 400);

    const result = await WhatsAppService.sendAppointmentReminder(patientName, phone, date, time, doctorName, patientId);
    return success(res, result);
  } catch (err: any) {
    return error(res, err.message, 500);
  }
});

// Send follow-up reminder
router.post('/send-followup-reminder', async (req: Request, res: Response) => {
  try {
    const { patientName, phone, date, doctorName, patientId } = req.body;
    if (!phone || !patientName) return error(res, 'Missing required fields', 400);

    const result = await WhatsAppService.sendFollowUpReminder(patientName, phone, date, doctorName, patientId);
    return success(res, result);
  } catch (err: any) {
    return error(res, err.message, 500);
  }
});

export default router;

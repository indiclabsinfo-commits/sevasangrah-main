import { Router, Request, Response } from 'express';
import { NotificationService } from '../services/notification.service';
import { success, error } from '../utils/response';

const router = Router();

// Send notification
router.post('/send', async (req: Request, res: Response) => {
  try {
    const { channel, recipientName, recipientPhone, message, category, patientId, templateId } = req.body;
    if (!channel || !recipientPhone || !message) {
      return error(res, 'Missing required fields: channel, recipientPhone, message', 400);
    }

    const result = await NotificationService.send({
      channel, recipientName, recipientPhone, message, category, patientId, templateId,
    });
    return success(res, result);
  } catch (err: any) {
    return error(res, err.message, 500);
  }
});

// Get templates
router.get('/templates', async (_req: Request, res: Response) => {
  try {
    const templates = await NotificationService.getTemplates();
    return success(res, templates);
  } catch (err: any) {
    return error(res, err.message, 500);
  }
});

// Create template
router.post('/templates', async (req: Request, res: Response) => {
  try {
    const result = await NotificationService.createTemplate(req.body);
    return success(res, result, 201);
  } catch (err: any) {
    return error(res, err.message, 500);
  }
});

// Get notification logs
router.get('/logs', async (req: Request, res: Response) => {
  try {
    const { page, limit, channel, status } = req.query;
    const result = await NotificationService.getLogs({
      page: page ? parseInt(page as string) : 1,
      limit: limit ? parseInt(limit as string) : 50,
      channel: channel as string,
      status: status as string,
    });
    return success(res, result);
  } catch (err: any) {
    return error(res, err.message, 500);
  }
});

// Get notification stats
router.get('/stats', async (_req: Request, res: Response) => {
  try {
    const stats = await NotificationService.getStats();
    return success(res, stats);
  } catch (err: any) {
    return error(res, err.message, 500);
  }
});

export default router;

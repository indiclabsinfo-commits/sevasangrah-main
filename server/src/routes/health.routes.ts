import { Router, Request, Response } from 'express';
import db from '../db/knex';

const router = Router();

router.get('/', async (_req: Request, res: Response) => {
  let dbStatus = 'disconnected';
  try {
    await db.raw('SELECT 1');
    dbStatus = 'connected';
  } catch {
    dbStatus = 'error';
  }

  res.json({
    status: 'ok',
    database: dbStatus,
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    version: '1.0.0',
  });
});

export default router;

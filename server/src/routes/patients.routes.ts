import { Router, Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import db from '../db/knex';
import { env } from '../config/env';
import { success, error } from '../utils/response';
import logger from '../utils/logger';

const router = Router();

// Configure multer for photo uploads
const photoStorage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, path.join(env.UPLOAD_DIR, 'photos'));
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || '.jpg';
    cb(null, `${req.params.id}_${Date.now()}${ext}`);
  },
});

const photoUpload = multer({
  storage: photoStorage,
  limits: { fileSize: parseInt(env.MAX_FILE_SIZE_MB) * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only JPEG, PNG, and WebP images are allowed'));
    }
  },
});

// Upload patient photo
router.post('/:id/photo', photoUpload.single('photo'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return error(res, 'No file uploaded', 400);
    }

    const patientId = req.params.id;
    const photoUrl = `/uploads/photos/${req.file.filename}`;

    // Update patient record
    await db('patients')
      .where('id', patientId)
      .update({ photo_url: photoUrl, updated_at: new Date() });

    logger.info({ patientId, photoUrl }, 'Patient photo uploaded');
    return success(res, { photoUrl });
  } catch (err: any) {
    logger.error({ err }, 'Photo upload failed');
    return error(res, err.message, 500);
  }
});

// Get patient photo URL
router.get('/:id/photo', async (req: Request, res: Response) => {
  try {
    const patient = await db('patients')
      .where('id', req.params.id)
      .select('photo_url')
      .first();

    if (!patient?.photo_url) {
      return error(res, 'No photo found', 404);
    }

    return success(res, { photoUrl: patient.photo_url });
  } catch (err: any) {
    return error(res, err.message, 500);
  }
});

// Bulk sync for offline registrations
router.post('/bulk-sync', async (req: Request, res: Response) => {
  try {
    const { patients } = req.body;
    if (!Array.isArray(patients) || patients.length === 0) {
      return error(res, 'No patients to sync', 400);
    }

    const results = [];
    for (const patient of patients) {
      try {
        const id = uuidv4();
        await db('patients').insert({
          id,
          ...patient,
          hospital_id: env.HOSPITAL_ID,
          created_at: new Date(),
          updated_at: new Date(),
        });
        results.push({ localId: patient.localId, serverId: id, status: 'synced' });
      } catch (err: any) {
        results.push({ localId: patient.localId, status: 'failed', error: err.message });
      }
    }

    return success(res, { results, synced: results.filter(r => r.status === 'synced').length });
  } catch (err: any) {
    return error(res, err.message, 500);
  }
});

export default router;

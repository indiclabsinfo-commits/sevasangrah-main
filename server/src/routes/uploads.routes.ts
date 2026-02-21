import { Router, Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import db from '../db/knex';
import { env } from '../config/env';
import { success, error } from '../utils/response';
import logger from '../utils/logger';

const router = Router();

// Configure multer for document uploads
const docStorage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, path.join(env.UPLOAD_DIR, 'documents'));
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${uuidv4()}${ext}`);
  },
});

const docUpload = multer({
  storage: docStorage,
  limits: { fileSize: parseInt(env.MAX_FILE_SIZE_MB) * 1024 * 1024 },
});

// Upload document
router.post('/', docUpload.single('file'), async (req: Request, res: Response) => {
  try {
    if (!req.file) return error(res, 'No file uploaded', 400);

    const { patientId, documentType, description } = req.body;
    if (!patientId) return error(res, 'patientId is required', 400);

    const id = uuidv4();
    const filePath = `/uploads/documents/${req.file.filename}`;

    await db('document_uploads').insert({
      id,
      patient_id: patientId,
      document_type: documentType || 'other',
      file_name: req.file.originalname,
      file_path: filePath,
      file_size: req.file.size,
      mime_type: req.file.mimetype,
      description,
      uploaded_by: req.user?.id || null,
      hospital_id: env.HOSPITAL_ID,
      created_at: new Date(),
    }).catch((err) => {
      logger.warn({ err }, 'document_uploads table might not exist');
    });

    logger.info({ id, patientId, fileName: req.file.originalname }, 'Document uploaded');
    return success(res, { id, filePath, fileName: req.file.originalname }, 201);
  } catch (err: any) {
    return error(res, err.message, 500);
  }
});

// List documents for a patient
router.get('/', async (req: Request, res: Response) => {
  try {
    const { patient_id } = req.query;
    if (!patient_id) return error(res, 'patient_id is required', 400);

    const docs = await db('document_uploads')
      .where('patient_id', patient_id as string)
      .where('hospital_id', env.HOSPITAL_ID)
      .orderBy('created_at', 'desc')
      .catch(() => []);

    return success(res, docs);
  } catch (err: any) {
    return error(res, err.message, 500);
  }
});

// Download document
router.get('/:id/download', async (req: Request, res: Response) => {
  try {
    const doc = await db('document_uploads').where('id', req.params.id).first();
    if (!doc) return error(res, 'Document not found', 404);

    const filePath = path.join(env.UPLOAD_DIR, doc.file_path.replace('/uploads/', ''));
    if (!fs.existsSync(filePath)) return error(res, 'File not found on disk', 404);

    res.setHeader('Content-Type', doc.mime_type || 'application/octet-stream');
    res.setHeader('Content-Disposition', `attachment; filename="${doc.file_name}"`);
    fs.createReadStream(filePath).pipe(res);
  } catch (err: any) {
    return error(res, err.message, 500);
  }
});

// Delete document
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const doc = await db('document_uploads').where('id', req.params.id).first();
    if (!doc) return error(res, 'Document not found', 404);

    // Delete file from disk
    const filePath = path.join(env.UPLOAD_DIR, doc.file_path.replace('/uploads/', ''));
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

    await db('document_uploads').where('id', req.params.id).delete();
    return success(res, { deleted: true });
  } catch (err: any) {
    return error(res, err.message, 500);
  }
});

export default router;

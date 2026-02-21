import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import db from '../db/knex';
import { env } from '../config/env';
import { success, error } from '../utils/response';

const router = Router();

// Create episode
router.post('/', async (req: Request, res: Response) => {
  try {
    const { patientId, episodeType, startDate, primaryDiagnosis, primaryDoctorId, department, notes } = req.body;
    if (!patientId || !episodeType) return error(res, 'Missing required fields', 400);

    const id = uuidv4();
    const episodeNumber = `EP-${Date.now().toString(36).toUpperCase()}`;

    await db('episodes_of_care').insert({
      id,
      episode_number: episodeNumber,
      patient_id: patientId,
      episode_type: episodeType,
      start_date: startDate || new Date(),
      status: 'active',
      primary_diagnosis: primaryDiagnosis,
      primary_doctor_id: primaryDoctorId,
      department,
      notes,
      hospital_id: env.HOSPITAL_ID,
      created_at: new Date(),
      updated_at: new Date(),
    });

    return success(res, { id, episodeNumber }, 201);
  } catch (err: any) {
    return error(res, err.message, 500);
  }
});

// List episodes for a patient
router.get('/', async (req: Request, res: Response) => {
  try {
    const { patient_id } = req.query;
    if (!patient_id) return error(res, 'patient_id is required', 400);

    const episodes = await db('episodes_of_care')
      .where('patient_id', patient_id as string)
      .where('hospital_id', env.HOSPITAL_ID)
      .orderBy('start_date', 'desc');

    return success(res, episodes);
  } catch (err: any) {
    return error(res, err.message, 500);
  }
});

// Get episode with linked records
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const episode = await db('episodes_of_care').where('id', req.params.id).first();
    if (!episode) return error(res, 'Episode not found', 404);

    const records = await db('episode_records')
      .where('episode_id', req.params.id)
      .orderBy('record_date', 'asc');

    return success(res, { ...episode, records });
  } catch (err: any) {
    return error(res, err.message, 500);
  }
});

// Link record to episode
router.post('/:id/records', async (req: Request, res: Response) => {
  try {
    const { recordType, recordId, recordDate, description } = req.body;
    if (!recordType || !recordId) return error(res, 'Missing required fields', 400);

    const id = uuidv4();
    await db('episode_records').insert({
      id,
      episode_id: req.params.id,
      record_type: recordType,
      record_id: recordId,
      record_date: recordDate || new Date(),
      description,
      created_at: new Date(),
    });

    return success(res, { id }, 201);
  } catch (err: any) {
    return error(res, err.message, 500);
  }
});

// Update episode
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { status, endDate, primaryDiagnosis, notes } = req.body;

    await db('episodes_of_care')
      .where('id', req.params.id)
      .update({
        ...(status && { status }),
        ...(endDate && { end_date: endDate }),
        ...(primaryDiagnosis && { primary_diagnosis: primaryDiagnosis }),
        ...(notes !== undefined && { notes }),
        updated_at: new Date(),
      });

    return success(res, { updated: true });
  } catch (err: any) {
    return error(res, err.message, 500);
  }
});

export default router;

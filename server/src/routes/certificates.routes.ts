import { Router, Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import db from '../db/knex';
import { env } from '../config/env';
import { PDFService } from '../services/pdf.service';
import { success, error } from '../utils/response';
import logger from '../utils/logger';

const router = Router();

// Create medical certificate
router.post('/', async (req: Request, res: Response) => {
  try {
    const {
      patientId, doctorId, certificateType, diagnosis, diagnosisCodes,
      startDate, endDate, durationDays, restrictions, recommendations,
      additionalNotes, purpose, disabilityPercentage, natureOfDisability,
    } = req.body;

    if (!patientId || !certificateType || !startDate || !endDate) {
      return error(res, 'Missing required fields: patientId, certificateType, startDate, endDate', 400);
    }

    // Get patient and doctor info for PDF
    const [patient, doctor] = await Promise.all([
      db('patients').where('id', patientId).first(),
      doctorId ? db('users').where('id', doctorId).first() : null,
    ]);

    if (!patient) return error(res, 'Patient not found', 404);

    const certNumber = `CERT-${new Date().getFullYear()}-${String(Date.now()).slice(-5)}`;
    const id = uuidv4();

    // Generate PDF
    const pdfPath = await PDFService.generateMedicalCertificate({
      certificateNumber: certNumber,
      certificateType,
      patientName: `${patient.first_name} ${patient.last_name || ''}`.trim(),
      patientAge: patient.age,
      patientGender: patient.gender,
      uhid: patient.uhid,
      doctorName: doctor ? `${doctor.first_name || ''} ${doctor.last_name || ''}`.trim() : 'N/A',
      diagnosis: diagnosis || 'N/A',
      startDate,
      endDate,
      durationDays: durationDays || 0,
      restrictions,
      recommendations,
      additionalNotes,
      purpose,
      disabilityPercentage,
      natureOfDisability,
    });

    // Save to DB
    await db('medical_certificates').insert({
      id,
      certificate_number: certNumber,
      patient_id: patientId,
      doctor_id: doctorId || null,
      certificate_type: certificateType,
      diagnosis: diagnosis || '',
      diagnosis_codes: diagnosisCodes ? JSON.stringify(diagnosisCodes) : null,
      start_date: startDate,
      end_date: endDate,
      duration_days: durationDays || 0,
      restrictions,
      recommendations,
      additional_notes: additionalNotes,
      purpose,
      disability_percentage: disabilityPercentage,
      nature_of_disability: natureOfDisability,
      pdf_path: pdfPath,
      hospital_id: env.HOSPITAL_ID,
      created_at: new Date(),
      updated_at: new Date(),
    }).catch((err) => {
      logger.warn({ err }, 'medical_certificates table might not exist, PDF still generated');
    });

    logger.info({ certNumber, patientId }, 'Medical certificate generated');
    return success(res, { id, certificateNumber: certNumber, pdfPath }, 201);
  } catch (err: any) {
    logger.error({ err }, 'Certificate generation failed');
    return error(res, err.message, 500);
  }
});

// Get certificate by ID
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const cert = await db('medical_certificates').where('id', req.params.id).first();
    if (!cert) return error(res, 'Certificate not found', 404);
    return success(res, cert);
  } catch (err: any) {
    return error(res, err.message, 500);
  }
});

// Download certificate PDF
router.get('/:id/pdf', async (req: Request, res: Response) => {
  try {
    const cert = await db('medical_certificates').where('id', req.params.id).first();
    if (!cert?.pdf_path) return error(res, 'Certificate PDF not found', 404);

    const filePath = path.join(env.UPLOAD_DIR, cert.pdf_path.replace('/uploads/', ''));
    if (!fs.existsSync(filePath)) return error(res, 'PDF file not found on disk', 404);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${cert.certificate_number}.pdf"`);
    fs.createReadStream(filePath).pipe(res);
  } catch (err: any) {
    return error(res, err.message, 500);
  }
});

// List certificates for a patient
router.get('/', async (req: Request, res: Response) => {
  try {
    const { patient_id } = req.query;
    let query = db('medical_certificates')
      .where('hospital_id', env.HOSPITAL_ID)
      .orderBy('created_at', 'desc');

    if (patient_id) query = query.where('patient_id', patient_id as string);

    const certs = await query.limit(100);
    return success(res, certs);
  } catch (err: any) {
    return error(res, err.message, 500);
  }
});

export default router;

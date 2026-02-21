import { Router, Request, Response } from 'express';
import db from '../db/knex';
import { env } from '../config/env';
import { success, error } from '../utils/response';

const router = Router();

// Daily OPD report
router.get('/opd/daily', async (req: Request, res: Response) => {
  try {
    const date = (req.query.date as string) || new Date().toISOString().split('T')[0];
    const startOfDay = `${date}T00:00:00`;
    const endOfDay = `${date}T23:59:59`;

    const [patientCount, consultationCount, queueStats] = await Promise.all([
      db('patients')
        .where('hospital_id', env.HOSPITAL_ID)
        .whereBetween('created_at', [startOfDay, endOfDay])
        .count('* as count')
        .first(),
      db('opd_consultations')
        .where('hospital_id', env.HOSPITAL_ID)
        .whereBetween('consultation_date', [startOfDay, endOfDay])
        .count('* as count')
        .first(),
      db('opd_queue')
        .where('hospital_id', env.HOSPITAL_ID)
        .whereBetween('created_at', [startOfDay, endOfDay])
        .select(
          db.raw("COUNT(*) as total"),
          db.raw("COUNT(*) FILTER (WHERE queue_status = 'COMPLETED') as completed"),
          db.raw("COUNT(*) FILTER (WHERE queue_status = 'WAITING') as waiting"),
          db.raw("COUNT(*) FILTER (WHERE queue_status = 'IN_CONSULTATION') as in_consultation"),
        )
        .first(),
    ]).catch(() => [{ count: 0 }, { count: 0 }, { total: 0, completed: 0, waiting: 0, in_consultation: 0 }]);

    return success(res, {
      date,
      newPatients: Number((patientCount as any)?.count || 0),
      consultations: Number((consultationCount as any)?.count || 0),
      queue: queueStats || { total: 0, completed: 0, waiting: 0, in_consultation: 0 },
    });
  } catch (err: any) {
    return error(res, err.message, 500);
  }
});

// Monthly OPD report
router.get('/opd/monthly', async (req: Request, res: Response) => {
  try {
    const month = (req.query.month as string) || new Date().toISOString().slice(0, 7);
    const startOfMonth = `${month}-01T00:00:00`;
    const endDate = new Date(parseInt(month.split('-')[0]), parseInt(month.split('-')[1]), 0);
    const endOfMonth = `${month}-${endDate.getDate()}T23:59:59`;

    const dailyBreakdown = await db('opd_consultations')
      .where('hospital_id', env.HOSPITAL_ID)
      .whereBetween('consultation_date', [startOfMonth, endOfMonth])
      .select(
        db.raw("DATE(consultation_date) as date"),
        db.raw("COUNT(*) as consultations"),
        db.raw("COUNT(DISTINCT patient_id) as unique_patients"),
        db.raw("COUNT(DISTINCT doctor_id) as active_doctors"),
      )
      .groupByRaw("DATE(consultation_date)")
      .orderBy('date')
      .catch(() => []);

    const totals = await db('opd_consultations')
      .where('hospital_id', env.HOSPITAL_ID)
      .whereBetween('consultation_date', [startOfMonth, endOfMonth])
      .select(
        db.raw("COUNT(*) as total_consultations"),
        db.raw("COUNT(DISTINCT patient_id) as unique_patients"),
        db.raw("COUNT(DISTINCT doctor_id) as active_doctors"),
        db.raw("COUNT(*) FILTER (WHERE status = 'COMPLETED') as completed"),
      )
      .first()
      .catch(() => ({ total_consultations: 0, unique_patients: 0, active_doctors: 0, completed: 0 }));

    return success(res, { month, totals, dailyBreakdown });
  } catch (err: any) {
    return error(res, err.message, 500);
  }
});

// MIS Overview
router.get('/mis/overview', async (_req: Request, res: Response) => {
  try {
    const [patientStats, consultationStats, queueStats, admissionStats] = await Promise.all([
      db('patients')
        .where('hospital_id', env.HOSPITAL_ID)
        .select(
          db.raw("COUNT(*) as total"),
          db.raw("COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE) as today"),
          db.raw("COUNT(*) FILTER (WHERE created_at >= DATE_TRUNC('month', CURRENT_DATE)) as this_month"),
        )
        .first()
        .catch(() => ({ total: 0, today: 0, this_month: 0 })),
      db('opd_consultations')
        .where('hospital_id', env.HOSPITAL_ID)
        .select(
          db.raw("COUNT(*) as total"),
          db.raw("COUNT(*) FILTER (WHERE consultation_date >= CURRENT_DATE) as today"),
          db.raw("COUNT(*) FILTER (WHERE consultation_date >= DATE_TRUNC('month', CURRENT_DATE)) as this_month"),
          db.raw("COUNT(*) FILTER (WHERE status = 'COMPLETED') as completed"),
        )
        .first()
        .catch(() => ({ total: 0, today: 0, this_month: 0, completed: 0 })),
      db('opd_queue')
        .where('hospital_id', env.HOSPITAL_ID)
        .where('created_at', '>=', new Date().toISOString().split('T')[0])
        .select(
          db.raw("COUNT(*) as total_today"),
          db.raw("AVG(EXTRACT(EPOCH FROM (updated_at - created_at))/60) as avg_wait_minutes"),
        )
        .first()
        .catch(() => ({ total_today: 0, avg_wait_minutes: 0 })),
      db('patient_admissions')
        .where('hospital_id', env.HOSPITAL_ID)
        .select(
          db.raw("COUNT(*) as total"),
          db.raw("COUNT(*) FILTER (WHERE status = 'ADMITTED') as currently_admitted"),
        )
        .first()
        .catch(() => ({ total: 0, currently_admitted: 0 })),
    ]);

    return success(res, {
      patients: patientStats,
      consultations: consultationStats,
      queue: queueStats,
      admissions: admissionStats,
    });
  } catch (err: any) {
    return error(res, err.message, 500);
  }
});

// Doctor-wise report
router.get('/mis/doctor-wise', async (req: Request, res: Response) => {
  try {
    const from = req.query.from as string || new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0];
    const to = req.query.to as string || new Date().toISOString().split('T')[0];

    const doctorStats = await db('opd_consultations as c')
      .leftJoin('users as u', 'c.doctor_id', 'u.id')
      .where('c.hospital_id', env.HOSPITAL_ID)
      .whereBetween('c.consultation_date', [`${from}T00:00:00`, `${to}T23:59:59`])
      .select(
        'c.doctor_id',
        db.raw("CONCAT(u.first_name, ' ', COALESCE(u.last_name, '')) as doctor_name"),
        db.raw("u.department"),
        db.raw("COUNT(*) as total_consultations"),
        db.raw("COUNT(DISTINCT c.patient_id) as unique_patients"),
        db.raw("COUNT(*) FILTER (WHERE c.status = 'COMPLETED') as completed"),
      )
      .groupBy('c.doctor_id', 'u.first_name', 'u.last_name', 'u.department')
      .orderByRaw("COUNT(*) DESC")
      .catch(() => []);

    return success(res, { from, to, doctors: doctorStats });
  } catch (err: any) {
    return error(res, err.message, 500);
  }
});

export default router;

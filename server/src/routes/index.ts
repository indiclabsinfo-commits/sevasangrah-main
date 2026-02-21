import { Router } from 'express';
import healthRoutes from './health.routes';
import patientsRoutes from './patients.routes';
import certificatesRoutes from './certificates.routes';
import smsRoutes from './sms.routes';
import whatsappRoutes from './whatsapp.routes';
import otpRoutes from './otp.routes';
import notificationsRoutes from './notifications.routes';
import uhidRoutes from './uhid.routes';
import episodesRoutes from './episodes.routes';
import reportsRoutes from './reports.routes';
import uploadsRoutes from './uploads.routes';

const router = Router();

// Public routes
router.use('/health', healthRoutes);

// Feature routes (auth can be added per-route or globally later)
router.use('/patients', patientsRoutes);
router.use('/certificates', certificatesRoutes);
router.use('/sms', smsRoutes);
router.use('/whatsapp', whatsappRoutes);
router.use('/otp', otpRoutes);
router.use('/notifications', notificationsRoutes);
router.use('/uhid', uhidRoutes);
router.use('/episodes', episodesRoutes);
router.use('/reports', reportsRoutes);
router.use('/uploads', uploadsRoutes);

export { router };

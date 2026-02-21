import { Router, Request, Response } from 'express';
import db from '../db/knex';
import { env } from '../config/env';
import { success, error } from '../utils/response';
import logger from '../utils/logger';

const router = Router();

// Get UHID config
router.get('/config', async (_req: Request, res: Response) => {
  try {
    let config = await db('uhid_config')
      .where('hospital_id', env.HOSPITAL_ID)
      .first()
      .catch(() => null);

    if (!config) {
      // Return default config
      config = {
        prefix: 'HMS',
        separator: '-',
        include_year: true,
        year_format: 'YYYY',
        sequence_digits: 4,
        current_sequence: 0,
        format_preview: 'HMS-2026-0001',
      };
    }

    return success(res, config);
  } catch (err: any) {
    return error(res, err.message, 500);
  }
});

// Update UHID config
router.put('/config', async (req: Request, res: Response) => {
  try {
    const { prefix, separator, includeYear, yearFormat, sequenceDigits } = req.body;

    // Generate preview
    const year = includeYear
      ? (yearFormat === 'YY' ? String(new Date().getFullYear()).slice(-2) : String(new Date().getFullYear()))
      : '';
    const seq = '1'.padStart(sequenceDigits || 4, '0');
    const parts = [prefix || 'HMS'];
    if (year) parts.push(year);
    parts.push(seq);
    const formatPreview = parts.join(separator || '-');

    const existing = await db('uhid_config')
      .where('hospital_id', env.HOSPITAL_ID)
      .first()
      .catch(() => null);

    const configData = {
      prefix: prefix || 'HMS',
      separator: separator || '-',
      include_year: includeYear !== false,
      year_format: yearFormat || 'YYYY',
      sequence_digits: sequenceDigits || 4,
      format_preview: formatPreview,
      updated_at: new Date(),
    };

    if (existing) {
      await db('uhid_config').where('hospital_id', env.HOSPITAL_ID).update(configData);
    } else {
      await db('uhid_config').insert({
        ...configData,
        hospital_id: env.HOSPITAL_ID,
        current_sequence: 0,
        created_at: new Date(),
      });
    }

    logger.info({ formatPreview }, 'UHID config updated');
    return success(res, { ...configData, formatPreview });
  } catch (err: any) {
    return error(res, err.message, 500);
  }
});

// Generate next UHID
router.post('/next', async (_req: Request, res: Response) => {
  try {
    // Atomic increment
    const config = await db('uhid_config')
      .where('hospital_id', env.HOSPITAL_ID)
      .first()
      .catch(() => null);

    const prefix = config?.prefix || 'HMS';
    const separator = config?.separator || '-';
    const includeYear = config?.include_year !== false;
    const yearFormat = config?.year_format || 'YYYY';
    const digits = config?.sequence_digits || 4;
    const currentSeq = (config?.current_sequence || 0) + 1;

    // Update sequence
    if (config) {
      await db('uhid_config')
        .where('hospital_id', env.HOSPITAL_ID)
        .update({ current_sequence: currentSeq, updated_at: new Date() });
    }

    // Build UHID
    const year = includeYear
      ? (yearFormat === 'YY' ? String(new Date().getFullYear()).slice(-2) : String(new Date().getFullYear()))
      : '';
    const seq = String(currentSeq).padStart(digits, '0');
    const parts = [prefix];
    if (year) parts.push(year);
    parts.push(seq);
    const uhid = parts.join(separator);

    return success(res, { uhid, sequence: currentSeq });
  } catch (err: any) {
    return error(res, err.message, 500);
  }
});

export default router;

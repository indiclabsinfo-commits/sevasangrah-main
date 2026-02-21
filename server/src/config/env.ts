import { z } from 'zod';
import dotenv from 'dotenv';

dotenv.config();

const envSchema = z.object({
  PORT: z.string().default('3002'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  HOSPITAL_ID: z.string().default('550e8400-e29b-41d4-a716-446655440000'),
  JWT_SECRET: z.string().min(8, 'JWT_SECRET must be at least 8 characters'),
  TWILIO_ACCOUNT_SID: z.string().optional().default(''),
  TWILIO_AUTH_TOKEN: z.string().optional().default(''),
  TWILIO_PHONE_NUMBER: z.string().optional().default(''),
  WHATSAPP_API_TOKEN: z.string().optional().default(''),
  WHATSAPP_PHONE_NUMBER_ID: z.string().optional().default(''),
  UPLOAD_DIR: z.string().default('./uploads'),
  MAX_FILE_SIZE_MB: z.string().default('10'),
});

export const env = envSchema.parse(process.env);

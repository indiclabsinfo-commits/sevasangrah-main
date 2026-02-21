import app from './app';
import { env } from './config/env';
import logger from './utils/logger';
import db from './db/knex';

const PORT = parseInt(env.PORT);

async function start() {
  // Test database connection
  try {
    await db.raw('SELECT 1');
    logger.info('Database connected successfully');
  } catch (err) {
    logger.warn({ err }, 'Database connection failed — server will start but some features may not work');
  }

  app.listen(PORT, () => {
    logger.info(`HMS Backend running on http://localhost:${PORT}`);
    logger.info(`Environment: ${env.NODE_ENV}`);
    logger.info(`Health check: http://localhost:${PORT}/api/health`);
    logger.info(`SMS mode: ${env.TWILIO_ACCOUNT_SID ? 'LIVE (Twilio)' : 'MOCK'}`);
    logger.info(`WhatsApp mode: ${env.WHATSAPP_API_TOKEN ? 'LIVE' : 'MOCK'}`);
  });
}

start().catch((err) => {
  logger.fatal({ err }, 'Failed to start server');
  process.exit(1);
});

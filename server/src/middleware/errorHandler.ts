import { Request, Response, NextFunction } from 'express';
import logger from '../utils/logger';

export function errorHandler(err: Error, req: Request, res: Response, _next: NextFunction) {
  logger.error({ err, method: req.method, url: req.url }, 'Unhandled error');

  const statusCode = (err as any).statusCode || 500;
  const message = process.env.NODE_ENV === 'production'
    ? 'Internal server error'
    : err.message;

  res.status(statusCode).json({
    success: false,
    error: message,
  });
}

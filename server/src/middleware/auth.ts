import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import logger from '../utils/logger';

export interface AuthUser {
  id: string;
  email: string;
  role: string;
  name: string;
  hospital_id: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

export function authenticate(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, error: 'No token provided' });
  }

  const token = authHeader.substring(7);

  try {
    const decoded = jwt.verify(token, env.JWT_SECRET) as AuthUser;
    req.user = decoded;
    next();
  } catch (err) {
    logger.warn({ err }, 'Invalid token');
    return res.status(401).json({ success: false, error: 'Invalid or expired token' });
  }
}

export function optionalAuth(req: Request, _res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    try {
      req.user = jwt.verify(token, env.JWT_SECRET) as AuthUser;
    } catch {
      // Token invalid, continue without auth
    }
  }

  next();
}

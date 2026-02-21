import fs from 'fs';
import path from 'path';
import { env } from '../config/env';
import logger from '../utils/logger';

export class FileService {
  static ensureUploadDirs() {
    const dirs = ['photos', 'documents', 'certificates'];
    for (const dir of dirs) {
      const fullPath = path.join(env.UPLOAD_DIR, dir);
      if (!fs.existsSync(fullPath)) {
        fs.mkdirSync(fullPath, { recursive: true });
        logger.info({ dir: fullPath }, 'Created upload directory');
      }
    }
  }

  static getUploadPath(subDir: string, fileName: string): string {
    return path.join(env.UPLOAD_DIR, subDir, fileName);
  }

  static getPublicUrl(subDir: string, fileName: string): string {
    return `/uploads/${subDir}/${fileName}`;
  }

  static deleteFile(filePath: string): boolean {
    try {
      const fullPath = path.join(env.UPLOAD_DIR, filePath.replace('/uploads/', ''));
      if (fs.existsSync(fullPath)) {
        fs.unlinkSync(fullPath);
        return true;
      }
      return false;
    } catch (err) {
      logger.error({ err, filePath }, 'Failed to delete file');
      return false;
    }
  }

  static getFileSizeBytes(filePath: string): number {
    try {
      const stats = fs.statSync(filePath);
      return stats.size;
    } catch {
      return 0;
    }
  }
}

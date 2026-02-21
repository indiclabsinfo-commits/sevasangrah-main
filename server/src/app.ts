import express from 'express';
import cors from 'cors';
import path from 'path';
import { router } from './routes';
import { errorHandler } from './middleware/errorHandler';
import { FileService } from './services/file.service';
import { env } from './config/env';

const app = express();

// Middleware
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Ensure upload directories exist
FileService.ensureUploadDirs();

// Serve uploaded files
app.use('/uploads', express.static(path.resolve(env.UPLOAD_DIR)));

// API routes
app.use('/api', router);

// In production, serve the built React frontend
if (env.NODE_ENV === 'production') {
  const frontendDist = path.join(__dirname, '../../dist');
  app.use(express.static(frontendDist));
  app.get('*', (_req, res) => {
    res.sendFile(path.join(frontendDist, 'index.html'));
  });
}

// Error handler (must be last)
app.use(errorHandler);

export default app;

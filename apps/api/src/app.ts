import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { env } from './config/env.config';
import { apiRoutes } from './routes';
import { errorHandler } from './middleware/error.middleware';
import { httpLogger } from './middleware/logger.middleware';
import { NotFoundError } from './utils/errors';

export const app = express();

// Trust reverse proxy (e.g. in docker/production)
app.set('trust proxy', 1);

// Security Headers
app.use(helmet());

// CORS configuration (allow only configured frontend origin with credentials)
app.use(
  cors({
    origin: env.FRONTEND_URL,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  }),
);

// Body and Cookie Parsing
app.use(express.json({ limit: '10kb' }));
app.use(cookieParser());

// Request Logging
if (env.NODE_ENV !== 'test') {
  app.use(httpLogger);
}

// API Routes
app.use('/api', apiRoutes);

// Catch-all 404 handler for undefined API routes
app.use((_req, _res, next) => {
  next(new NotFoundError('API route not found'));
});

// Centralized Error Handler
app.use(errorHandler);


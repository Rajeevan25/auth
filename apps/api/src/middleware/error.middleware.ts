import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/errors';
import { logger } from '../utils/logger';
import { env } from '../config/env.config';

export function errorHandler(
  err: Error | AppError,
  _req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction,
): void {
  if (err instanceof AppError) {
    if (err.statusCode >= 500) {
      logger.error({ err }, `[AppError ${err.statusCode}] ${err.message}`);
    }

    res.status(err.statusCode).json({
      success: false,
      message: err.message,
      ...(err.details ? { details: err.details } : {}),
      ...(err.lockoutRemainingSeconds !== undefined
        ? { lockoutRemainingSeconds: err.lockoutRemainingSeconds }
        : {}),
    });
    return;
  }

  // Unhandled error
  logger.error({ err }, '[Unhandled Error]');

  const message =
    env.NODE_ENV === 'production'
      ? 'An unexpected error occurred. Please try again later.'
      : err.message || 'Internal Server Error';

  res.status(500).json({
    success: false,
    message,
    ...(env.NODE_ENV !== 'production' && { stack: err.stack }),
  });
}


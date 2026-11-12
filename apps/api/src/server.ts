import { app } from './app';
import { env } from './config/env.config';
import { logger } from './utils/logger';
import { prisma } from './config/db';

const server = app.listen(env.PORT, () => {
  logger.info(`🚀 API server started successfully on port ${env.PORT} in [${env.NODE_ENV}] mode`);
  logger.info(`👉 Health check: http://localhost:${env.PORT}/api/health`);
  logger.info(`👉 CORS origin allowed: ${env.FRONTEND_URL}`);
});

async function gracefulShutdown(signal: string) {
  logger.info(`Received ${signal}. Shutting down gracefully...`);
  server.close(async () => {
    logger.info('HTTP server closed.');
    try {
      await prisma.$disconnect();
      logger.info('Database connection closed.');
      process.exit(0);
    } catch (err) {
      logger.error({ err }, 'Error disconnecting database');
      process.exit(1);
    }
  });

  // Force shutdown after 10s if graceful fails
  setTimeout(() => {
    logger.error('Forced shutdown after timeout.');
    process.exit(1);
  }, 10000).unref();
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));


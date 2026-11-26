import { ArgumentsHost, Catch, ExceptionFilter } from '@nestjs/common';
import type { FastifyReply } from 'fastify';
import { AppError } from '../../utils/errors';

@Catch(AppError)
export class AppErrorFilter implements ExceptionFilter {
  catch(exception: AppError, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const reply = ctx.getResponse<FastifyReply>();

    const body: Record<string, unknown> = {
      success: false,
      statusCode: exception.statusCode,
      message: exception.message,
    };

    if (exception.details !== undefined) {
      body.details = exception.details;
    }

    if (exception.lockoutRemainingSeconds !== undefined) {
      body.lockoutRemainingSeconds = exception.lockoutRemainingSeconds;
    }

    reply.status(exception.statusCode).send(body);
  }
}

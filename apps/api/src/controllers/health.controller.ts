import { Request, Response } from 'express';

export class HealthController {
  getHealth(_req: Request, res: Response): void {
    res.status(200).json({
      status: 'ok',
      service: 'api',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    });
  }
}

export const healthController = new HealthController();


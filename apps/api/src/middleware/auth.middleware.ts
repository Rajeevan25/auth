import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken, AccessTokenPayload } from '../utils/token.utils';
import { UnauthorizedError } from '../utils/errors';
import { ACCESS_COOKIE_NAME } from '../services/token.service';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: AccessTokenPayload;
    }
  }
}

export function authenticate(req: Request, _res: Response, next: NextFunction): void {
  try {
    let token = req.cookies?.[ACCESS_COOKIE_NAME];

    // Fallback to Authorization: Bearer <token> header for API testing/mobile clients
    if (!token && req.headers.authorization?.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      throw new UnauthorizedError('Authentication token missing');
    }

    const payload = verifyAccessToken(token);
    req.user = payload;
    next();
  } catch (error) {
    next(new UnauthorizedError('Invalid or expired authentication token'));
  }
}


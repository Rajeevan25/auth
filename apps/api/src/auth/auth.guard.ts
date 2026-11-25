import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import type { FastifyRequest } from 'fastify';
import { verifyAccessToken, AccessTokenPayload } from '../utils/token.utils';
import { ACCESS_COOKIE_NAME } from '../services/token.service';

export interface AuthenticatedRequest extends FastifyRequest {
  user?: AccessTokenPayload;
}

@Injectable()
export class AuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<AuthenticatedRequest>();
    let token = req.cookies?.[ACCESS_COOKIE_NAME];

    if (!token && req.headers.authorization?.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      throw new UnauthorizedException('Authentication token missing');
    }

    try {
      req.user = verifyAccessToken(token);
      return true;
    } catch {
      throw new UnauthorizedException('Invalid or expired authentication token');
    }
  }
}

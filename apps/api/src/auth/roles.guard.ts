import {
  CanActivate,
  ExecutionContext,
  Injectable,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { SetMetadata } from '@nestjs/common';
import { AuthenticatedRequest } from './auth.guard';

export const ROLES_KEY = 'roles';

/**
 * Decorator to restrict a route to specific roles.
 * Usage: @Roles('ADMIN', 'HR_MANAGER')
 */
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);

/**
 * Guard that enforces role-based access.
 * Must be used AFTER AuthGuard (which populates req.user).
 *
 * Usage:
 *   @UseGuards(AuthGuard, RolesGuard)
 *   @Roles('ADMIN', 'HR_MANAGER')
 *   @Get('some-route')
 *   someRoute() { ... }
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // No @Roles() decorator → allow all authenticated users
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const req = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const userRole = req.user?.role;

    if (!userRole || !requiredRoles.includes(userRole)) {
      throw new ForbiddenException(
        `Access denied. Required role(s): ${requiredRoles.join(', ')}`,
      );
    }

    return true;
  }
}

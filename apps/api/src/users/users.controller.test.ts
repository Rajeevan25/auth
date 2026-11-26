import { jest } from '@jest/globals';
import { ExecutionContext, ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from '@prisma/client';
import { AuthGuard, AuthenticatedRequest } from '../auth/auth.guard';
import { ROLES_KEY, RolesGuard } from '../auth/roles.guard';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { BadRequestError, ForbiddenError } from '../utils/errors';
import * as tokenUtils from '../utils/token.utils';
import { createUserSchema } from './dto/user.dto';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

describe('UsersController & Guards (Integration)', () => {
  let controller: UsersController;
  let authGuard: AuthGuard;
  let rolesGuard: RolesGuard;

  const fn = () => jest.fn<(...args: any[]) => any>();

  const mockUsersService = {
    findAll: fn(),
    findById: fn(),
    create: fn(),
    update: fn(),
    updateOrg: fn(),
    updateStatus: fn(),
    updateMyProfile: fn(),
  };

  const VALID_USER_UUID = '11111111-1111-4111-8111-111111111111';
  const OTHER_USER_UUID = '22222222-2222-4222-8222-222222222222';

  beforeEach(() => {
    controller = new UsersController(mockUsersService as unknown as UsersService);
    authGuard = new AuthGuard();
    rolesGuard = new RolesGuard(new Reflector());
  });

  function createHttpContext(
    req: Partial<AuthenticatedRequest>,
    // eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
    handler: Function,
  ): ExecutionContext {
    return {
      switchToHttp: () => ({
        getRequest: () => req,
      }),
      getHandler: () => handler,
      getClass: () => UsersController,
    } as unknown as ExecutionContext;
  }

  it('AuthGuard throws UnauthorizedException when no token is provided', () => {
    const ctx = createHttpContext({ headers: {}, cookies: {} }, controller.findAll);
    expect(() => authGuard.canActivate(ctx)).toThrow(UnauthorizedException);
  });

  it('AuthGuard populates req.user and RolesGuard blocks EMPLOYEE on GET /users', () => {
    const token = tokenUtils.signAccessToken({
      userId: VALID_USER_UUID,
      email: 'emp@hrm.dev',
      name: 'Emp',
      role: UserRole.EMPLOYEE,
    });

    const req: Partial<AuthenticatedRequest> = {
      headers: { authorization: `Bearer ${token}` },
      cookies: {},
    };
    const ctx = createHttpContext(req, controller.findAll);

    expect(authGuard.canActivate(ctx)).toBe(true);
    expect(Reflect.getMetadata(ROLES_KEY, controller.findAll)).toContain(UserRole.HR_MANAGER);
    expect(() => rolesGuard.canActivate(ctx)).toThrow(ForbiddenException);
  });

  it('allows EMPLOYEE to view their own profile via findById, but blocks viewing others', async () => {
    const empReq = {
      user: {
        userId: VALID_USER_UUID,
        email: 'emp@hrm.dev',
        name: 'Emp',
        role: UserRole.EMPLOYEE,
      },
    } as AuthenticatedRequest;

    mockUsersService.findById.mockResolvedValue({ id: VALID_USER_UUID, name: 'Emp' });
    const ownResult = await controller.findById(VALID_USER_UUID, empReq);
    expect(ownResult.success).toBe(true);
    expect(ownResult.user.id).toBe(VALID_USER_UUID);

    await expect(controller.findById(OTHER_USER_UUID, empReq)).rejects.toThrow(ForbiddenError);
  });

  it('allows EMPLOYEE to update their own safe profile fields', async () => {
    const empReq = {
      user: {
        userId: VALID_USER_UUID,
        email: 'emp@hrm.dev',
        name: 'Emp',
        role: UserRole.EMPLOYEE,
      },
    } as AuthenticatedRequest;

    mockUsersService.updateMyProfile.mockResolvedValue({
      id: VALID_USER_UUID,
      name: 'Updated Name',
    });

    const res = await controller.updateMyProfile(empReq, {
      name: 'Updated Name',
      city: 'Bengaluru',
    });

    expect(res.success).toBe(true);
    expect(mockUsersService.updateMyProfile).toHaveBeenCalledWith(VALID_USER_UUID, {
      name: 'Updated Name',
      city: 'Bengaluru',
    });
  });

  it('ZodValidationPipe rejects invalid createUser payload with BadRequestError', () => {
    const pipe = new ZodValidationPipe(createUserSchema);
    expect(() =>
      pipe.transform({ email: 'not-an-email', name: 'A', password: '123' }),
    ).toThrow(BadRequestError);
  });

  it('allows HR_MANAGER to pass RolesGuard and create a user', async () => {
    const req = {
      user: {
        userId: VALID_USER_UUID,
        email: 'hr@hrm.dev',
        name: 'HR',
        role: UserRole.HR_MANAGER,
      },
    } as AuthenticatedRequest;

    const ctx = createHttpContext(req, controller.create);
    expect(rolesGuard.canActivate(ctx)).toBe(true);

    mockUsersService.create.mockResolvedValue({
      id: OTHER_USER_UUID,
      email: 'new@hrm.dev',
      name: 'New User',
      role: UserRole.EMPLOYEE,
    });

    const res = await controller.create(req, {
      email: 'new@hrm.dev',
      name: 'New User',
      password: 'Password123',
      role: UserRole.EMPLOYEE,
    });

    expect(res.success).toBe(true);
    expect(res.user.email).toBe('new@hrm.dev');
  });
});

import { jest } from '@jest/globals';
import { UserRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import {
  BadRequestError,
  ConflictError,
  ForbiddenError,
  NotFoundError,
} from '../utils/errors';
import { UsersRepository } from './users.repository';
import { UsersService } from './users.service';

describe('UsersService', () => {
  let service: UsersService;

  const fn = () => jest.fn<(...args: any[]) => any>();

  const mockRepository = {
    findAll: fn(),
    findById: fn(),
    findByEmail: fn(),
    findByEmployeeCode: fn(),
    createWithProfile: fn(),
    updateWithProfile: fn(),
    updateOrg: fn(),
    updateStatus: fn(),
  };

  const mockPrisma = {
    department: { findUnique: fn(), count: fn() },
    designation: { findUnique: fn() },
    user: { findUnique: fn(), count: fn() },
    refreshToken: { updateMany: fn() },
  };

  beforeEach(() => {
    service = new UsersService(
      mockRepository as unknown as UsersRepository,
      mockPrisma as unknown as PrismaService,
    );
  });

  describe('create', () => {
    it('creates user and profile with hashed password', async () => {
      mockRepository.findByEmail.mockResolvedValue(null);
      mockRepository.findByEmployeeCode.mockResolvedValue(null);
      mockPrisma.department.findUnique.mockResolvedValue({ id: 'dept-1', isActive: true });
      mockPrisma.designation.findUnique.mockResolvedValue({ id: 'desig-1', isActive: true });
      mockRepository.createWithProfile.mockResolvedValue({
        id: 'user-1',
        email: 'jane@hrm.dev',
        name: 'Jane Doe',
        role: UserRole.EMPLOYEE,
      });

      const result = await service.create(UserRole.HR_MANAGER, {
        email: 'jane@hrm.dev',
        name: 'Jane Doe',
        password: 'Password123',
        role: UserRole.EMPLOYEE,
        departmentId: 'dept-1',
        designationId: 'desig-1',
        profile: { employeeCode: 'EMP-100' },
      });

      expect(result.id).toBe('user-1');
      expect(mockRepository.createWithProfile).toHaveBeenCalledWith(
        expect.objectContaining({
          email: 'jane@hrm.dev',
          name: 'Jane Doe',
          role: UserRole.EMPLOYEE,
          passwordHash: expect.any(String),
        }),
      );
      const callArg = mockRepository.createWithProfile.mock.calls[0][0] as {
        passwordHash: string;
      };
      expect(callArg.passwordHash).not.toBe('Password123');
    });

    it('prevents ADMIN from creating SUPER_ADMIN', async () => {
      await expect(
        service.create(UserRole.ADMIN, {
          email: 'root@hrm.dev',
          name: 'Root',
          password: 'Password123',
          role: UserRole.SUPER_ADMIN,
        }),
      ).rejects.toThrow(ForbiddenError);
    });

    it('prevents HR_MANAGER from creating ADMIN', async () => {
      await expect(
        service.create(UserRole.HR_MANAGER, {
          email: 'admin2@hrm.dev',
          name: 'Admin 2',
          password: 'Password123',
          role: UserRole.ADMIN,
        }),
      ).rejects.toThrow(ForbiddenError);
    });

    it('throws ConflictError on duplicate email', async () => {
      mockRepository.findByEmail.mockResolvedValue({ id: 'existing' });

      await expect(
        service.create(UserRole.ADMIN, {
          email: 'dup@hrm.dev',
          name: 'Dup',
          password: 'Password123',
          role: UserRole.EMPLOYEE,
        }),
      ).rejects.toThrow(ConflictError);
    });

    it('throws ConflictError on duplicate employeeCode', async () => {
      mockRepository.findByEmail.mockResolvedValue(null);
      mockRepository.findByEmployeeCode.mockResolvedValue({ id: 'prof-1', userId: 'other' });

      await expect(
        service.create(UserRole.ADMIN, {
          email: 'new@hrm.dev',
          name: 'New',
          password: 'Password123',
          role: UserRole.EMPLOYEE,
          profile: { employeeCode: 'EMP-001' },
        }),
      ).rejects.toThrow(ConflictError);
    });

    it('throws BadRequestError if assigned department is inactive', async () => {
      mockRepository.findByEmail.mockResolvedValue(null);
      mockPrisma.department.findUnique.mockResolvedValue({ id: 'dept-1', isActive: false });

      await expect(
        service.create(UserRole.ADMIN, {
          email: 'new@hrm.dev',
          name: 'New',
          password: 'Password123',
          role: UserRole.EMPLOYEE,
          departmentId: 'dept-1',
        }),
      ).rejects.toThrow(BadRequestError);
    });
  });

  describe('findAll & findById scoping', () => {
    it('scopes MANAGER findAll queries to their own direct reports', async () => {
      mockRepository.findAll.mockResolvedValue({ users: [], meta: { total: 0 } });

      await service.findAll(
        { page: 1, limit: 20 },
        { userId: 'mgr-1', role: UserRole.MANAGER },
      );

      expect(mockRepository.findAll).toHaveBeenCalledWith({
        page: 1,
        limit: 20,
        managerId: 'mgr-1',
      });
    });

    it('blocks MANAGER from viewing a user who is not their direct report', async () => {
      mockRepository.findById.mockResolvedValue({
        id: 'emp-other',
        managerId: 'mgr-2',
      });

      await expect(
        service.findById('emp-other', { userId: 'mgr-1', role: UserRole.MANAGER }),
      ).rejects.toThrow(ForbiddenError);
    });
  });

  describe('updateOrg', () => {
    it('prevents a user from changing their own role', async () => {
      mockRepository.findById.mockResolvedValue({ id: 'hr-1', role: UserRole.HR_MANAGER });

      await expect(
        service.updateOrg('hr-1', UserRole.HR_MANAGER, 'hr-1', { role: UserRole.EMPLOYEE }),
      ).rejects.toThrow(ForbiddenError);
    });

    it('prevents a user from being their own manager', async () => {
      mockRepository.findById.mockResolvedValue({ id: 'user-1', role: UserRole.EMPLOYEE });

      await expect(
        service.updateOrg('hr-1', UserRole.HR_MANAGER, 'user-1', { managerId: 'user-1' }),
      ).rejects.toThrow(BadRequestError);
    });

    it('prevents circular manager hierarchies (A -> B -> A)', async () => {
      mockRepository.findById.mockResolvedValue({ id: 'user-a', role: UserRole.MANAGER });
      mockPrisma.user.findUnique
        .mockResolvedValueOnce({ id: 'user-b', isActive: true }) // manager exists & active
        .mockResolvedValueOnce({ managerId: 'user-a' }); // user-b's manager is user-a

      await expect(
        service.updateOrg('admin-1', UserRole.ADMIN, 'user-a', { managerId: 'user-b' }),
      ).rejects.toThrow(BadRequestError);
    });
  });

  describe('updateStatus', () => {
    it('prevents deactivating own account', async () => {
      mockRepository.findById.mockResolvedValue({ id: 'admin-1', role: UserRole.ADMIN });

      await expect(
        service.updateStatus('admin-1', UserRole.ADMIN, 'admin-1', { isActive: false }),
      ).rejects.toThrow(BadRequestError);
    });

    it('blocks deactivating a manager who still has active direct reports', async () => {
      mockRepository.findById.mockResolvedValue({ id: 'mgr-1', role: UserRole.MANAGER });
      mockPrisma.user.count.mockResolvedValue(2);
      mockPrisma.department.count.mockResolvedValue(0);

      await expect(
        service.updateStatus('hr-1', UserRole.HR_MANAGER, 'mgr-1', { isActive: false }),
      ).rejects.toThrow(BadRequestError);
    });

    it('blocks deactivating a user who heads an active department', async () => {
      mockRepository.findById.mockResolvedValue({ id: 'mgr-1', role: UserRole.MANAGER });
      mockPrisma.user.count.mockResolvedValue(0);
      mockPrisma.department.count.mockResolvedValue(1);

      await expect(
        service.updateStatus('hr-1', UserRole.HR_MANAGER, 'mgr-1', { isActive: false }),
      ).rejects.toThrow(BadRequestError);
    });

    it('revokes refresh tokens when deactivating a user', async () => {
      mockRepository.findById.mockResolvedValue({ id: 'emp-1', role: UserRole.EMPLOYEE });
      mockPrisma.user.count.mockResolvedValue(0);
      mockPrisma.department.count.mockResolvedValue(0);
      mockRepository.updateStatus.mockResolvedValue({ id: 'emp-1', isActive: false });
      mockPrisma.refreshToken.updateMany.mockResolvedValue({ count: 2 });

      const result = await service.updateStatus('hr-1', UserRole.HR_MANAGER, 'emp-1', {
        isActive: false,
      });

      expect(result.isActive).toBe(false);
      expect(mockPrisma.refreshToken.updateMany).toHaveBeenCalledWith({
        where: { userId: 'emp-1', revokedAt: null },
        data: { revokedAt: expect.any(Date) },
      });
    });

    it('resets failedAttempts and lockedUntil when unlockAccount is true', async () => {
      mockRepository.findById.mockResolvedValue({ id: 'emp-1', role: UserRole.EMPLOYEE });
      mockRepository.updateStatus.mockResolvedValue({
        id: 'emp-1',
        failedAttempts: 0,
        lockedUntil: null,
      });

      await service.updateStatus('hr-1', UserRole.HR_MANAGER, 'emp-1', {
        unlockAccount: true,
      });

      expect(mockRepository.updateStatus).toHaveBeenCalledWith('emp-1', {
        failedAttempts: 0,
        lockedUntil: null,
      });
    });

    it('throws NotFoundError when target user does not exist', async () => {
      mockRepository.findById.mockResolvedValue(null);

      await expect(
        service.updateStatus('hr-1', UserRole.HR_MANAGER, 'missing', { isActive: false }),
      ).rejects.toThrow(NotFoundError);
    });
  });
});

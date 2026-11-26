import { jest } from '@jest/globals';
import { UserRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { ROLE_DEFINITIONS, RolesService } from './roles.service';

describe('RolesService', () => {
  let service: RolesService;

  const mockPrisma = {
    user: {
      groupBy: jest.fn<(...args: any[]) => any>(),
    },
  };

  beforeEach(() => {
    service = new RolesService(mockPrisma as unknown as PrismaService);
  });

  describe('findAll', () => {
    it('returns all role definitions with live user counts', async () => {
      mockPrisma.user.groupBy.mockResolvedValue([
        { role: UserRole.ADMIN, _count: { _all: 2 } },
        { role: UserRole.EMPLOYEE, _count: { _all: 15 } },
      ]);

      const roles = await service.findAll();

      expect(roles).toHaveLength(ROLE_DEFINITIONS.length);
      expect(roles.find((r) => r.code === UserRole.ADMIN)?.userCount).toBe(2);
      expect(roles.find((r) => r.code === UserRole.EMPLOYEE)?.userCount).toBe(15);
      expect(roles.find((r) => r.code === UserRole.SUPER_ADMIN)?.userCount).toBe(0);
    });
  });

  describe('getAssignableRoles', () => {
    it('allows SUPER_ADMIN to assign all roles', () => {
      const roles = service.getAssignableRoles(UserRole.SUPER_ADMIN);
      expect(roles).toHaveLength(ROLE_DEFINITIONS.length);
    });

    it('prevents ADMIN from assigning SUPER_ADMIN', () => {
      const roles = service.getAssignableRoles(UserRole.ADMIN);
      expect(roles.some((r) => r.code === UserRole.SUPER_ADMIN)).toBe(false);
      expect(roles.some((r) => r.code === UserRole.ADMIN)).toBe(true);
    });

    it('prevents HR_MANAGER from assigning SUPER_ADMIN or ADMIN', () => {
      const roles = service.getAssignableRoles(UserRole.HR_MANAGER);
      expect(roles.some((r) => r.code === UserRole.SUPER_ADMIN)).toBe(false);
      expect(roles.some((r) => r.code === UserRole.ADMIN)).toBe(false);
      expect(roles.some((r) => r.code === UserRole.EMPLOYEE)).toBe(true);
    });

    it('returns empty array for non-privileged roles', () => {
      expect(service.getAssignableRoles(UserRole.EMPLOYEE)).toEqual([]);
      expect(service.getAssignableRoles(UserRole.MANAGER)).toEqual([]);
    });
  });
});

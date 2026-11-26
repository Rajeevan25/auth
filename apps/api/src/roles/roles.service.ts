import { Injectable } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

export interface RoleMetadata {
  code: UserRole;
  label: string;
  level: number;
  description: string;
}

export const ROLE_DEFINITIONS: RoleMetadata[] = [
  { code: UserRole.SUPER_ADMIN, label: 'Super Admin', level: 100, description: 'Full platform control including Admin management' },
  { code: UserRole.ADMIN, label: 'Admin', level: 90, description: 'System administration and user management' },
  { code: UserRole.HR_MANAGER, label: 'HR Manager', level: 80, description: 'Manage employees, departments, designations, and HR ops' },
  { code: UserRole.HR_EXECUTIVE, label: 'HR Executive', level: 70, description: 'HR operations and employee onboarding' },
  { code: UserRole.RECRUITER, label: 'Recruiter', level: 60, description: 'Talent acquisition and hiring pipeline' },
  { code: UserRole.FINANCE_MANAGER, label: 'Finance Manager', level: 80, description: 'Payroll and financial approvals' },
  { code: UserRole.FINANCE_EXECUTIVE, label: 'Finance Executive', level: 65, description: 'Payroll processing and finance operations' },
  { code: UserRole.MANAGER, label: 'Manager', level: 60, description: 'Department/team management and approvals' },
  { code: UserRole.TEAM_LEAD, label: 'Team Lead', level: 50, description: 'Lead small teams and direct reports' },
  { code: UserRole.EMPLOYEE, label: 'Employee', level: 10, description: 'Standard employee access' },
];

@Injectable()
export class RolesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    const counts = await this.prisma.user.groupBy({
      by: ['role'],
      _count: { _all: true },
    });
    const countMap = new Map(counts.map((c) => [c.role, c._count._all]));

    return ROLE_DEFINITIONS.map((role) => ({
      ...role,
      userCount: countMap.get(role.code) ?? 0,
    }));
  }

  getAssignableRoles(actorRole: string): RoleMetadata[] {
    if (actorRole === UserRole.SUPER_ADMIN) {
      return ROLE_DEFINITIONS;
    }
    if (actorRole === UserRole.ADMIN) {
      return ROLE_DEFINITIONS.filter((r) => r.code !== UserRole.SUPER_ADMIN);
    }
    if (actorRole === UserRole.HR_MANAGER) {
      return ROLE_DEFINITIONS.filter(
        (r) => r.code !== UserRole.SUPER_ADMIN && r.code !== UserRole.ADMIN,
      );
    }
    return [];
  }
}

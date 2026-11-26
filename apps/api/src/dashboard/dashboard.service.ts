import { Injectable } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AccessTokenPayload } from '../utils/token.utils';

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  private async getDepartmentBreakdown() {
    const [grouped, departments] = await Promise.all([
      this.prisma.user.groupBy({
        by: ['departmentId'],
        where: { departmentId: { not: null } },
        _count: { _all: true },
      }),
      this.prisma.department.findMany({
        select: { id: true, name: true },
      }),
    ]);

    const nameById = new Map(departments.map((d) => [d.id, d.name]));
    return grouped.map((g) => ({
      department: (g.departmentId ? nameById.get(g.departmentId) : null) ?? 'Unassigned',
      count: g._count._all,
    }));
  }

  async getSummaryForUser(user: AccessTokenPayload) {
    const now = new Date();

    if (user.role === UserRole.SUPER_ADMIN || user.role === UserRole.ADMIN) {
      const [totalUsers, activeUsers, lockedAccounts, traineeCount, byRole, departmentBreakdown] =
        await Promise.all([
          this.prisma.user.count(),
          this.prisma.user.count({ where: { isActive: true } }),
          this.prisma.user.count({ where: { lockedUntil: { gt: now } } }),
          this.prisma.user.count({ where: { designation: { code: 'TRAINEE' } } }),
          this.prisma.user.groupBy({ by: ['role'], _count: { _all: true } }),
          this.getDepartmentBreakdown(),
        ]);

      return {
        role: user.role,
        metrics: {
          totalUsers,
          activeUsers,
          lockedAccounts,
          traineeCount,
          roleBreakdown: byRole.map((r) => ({ role: r.role, count: r._count._all })),
          departmentBreakdown,
        },
      };
    }

    if (
      user.role === UserRole.HR_MANAGER ||
      user.role === UserRole.HR_EXECUTIVE ||
      user.role === UserRole.RECRUITER
    ) {
      const [totalEmployees, activeEmployees, traineeCount, departmentBreakdown] = await Promise.all([
        this.prisma.user.count(),
        this.prisma.user.count({ where: { isActive: true } }),
        this.prisma.user.count({ where: { designation: { code: 'TRAINEE' } } }),
        this.getDepartmentBreakdown(),
      ]);

      return {
        role: user.role,
        metrics: {
          totalEmployees,
          activeEmployees,
          traineeCount,
          departmentBreakdown,
        },
      };
    }

    if (user.role === UserRole.FINANCE_MANAGER || user.role === UserRole.FINANCE_EXECUTIVE) {
      const [activePayrollHeadcount, traineeCount] = await Promise.all([
        this.prisma.user.count({ where: { isActive: true } }),
        this.prisma.user.count({ where: { isActive: true, designation: { code: 'TRAINEE' } } }),
      ]);

      return {
        role: user.role,
        metrics: {
          activePayrollHeadcount,
          fullTimeCount: activePayrollHeadcount - traineeCount,
          traineeCount,
        },
      };
    }

    if (user.role === UserRole.MANAGER || user.role === UserRole.TEAM_LEAD) {
      const [directReportsCount, employeeCount] = await Promise.all([
        this.prisma.user.count({ where: { managerId: user.userId, isActive: true } }),
        this.prisma.user.count({ where: { role: UserRole.EMPLOYEE, isActive: true } }),
      ]);

      return {
        role: user.role,
        metrics: {
          directReportsCount,
          employeeCount,
        },
      };
    }

    // Default: EMPLOYEE (tailored by designation from DB)
    const dbUser = await this.prisma.user.findUnique({
      where: { id: user.userId },
      select: { designation: { select: { code: true, leaveQuota: true } } },
    });

    const designation = dbUser?.designation?.code ?? user.designation ?? 'JUNIOR';
    const leaveQuotaDays = dbUser?.designation?.leaveQuota ?? 18;

    return {
      role: user.role,
      designation,
      metrics: {
        leaveQuotaDays,
        isProbation: designation === 'TRAINEE',
        wfhAllowed: designation !== 'TRAINEE',
      },
    };
  }
}

import { Injectable } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AccessTokenPayload } from '../utils/token.utils';

const LEAVE_QUOTA_BY_DESIGNATION: Record<string, number> = {
  SENIOR: 24,
  JUNIOR: 18,
  ASSOCIATE: 15,
  TRAINEE: 6,
};

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getSummaryForUser(user: AccessTokenPayload) {
    const now = new Date();

    if (user.role === UserRole.SUPER_ADMIN || user.role === UserRole.ADMIN) {
      const [totalUsers, activeUsers, lockedAccounts, traineeCount, byRole, byDepartment] =
        await Promise.all([
          this.prisma.user.count(),
          this.prisma.user.count({ where: { isActive: true } }),
          this.prisma.user.count({ where: { lockedUntil: { gt: now } } }),
          this.prisma.user.count({ where: { designation: 'TRAINEE' } }),
          this.prisma.user.groupBy({ by: ['role'], _count: { _all: true } }),
          this.prisma.user.groupBy({
            by: ['department'],
            where: { department: { not: null } },
            _count: { _all: true },
          }),
        ]);

      return {
        role: user.role,
        metrics: {
          totalUsers,
          activeUsers,
          lockedAccounts,
          traineeCount,
          roleBreakdown: byRole.map((r) => ({ role: r.role, count: r._count._all })),
          departmentBreakdown: byDepartment.map((d) => ({
            department: d.department,
            count: d._count._all,
          })),
        },
      };
    }

    if (
      user.role === UserRole.HR_MANAGER ||
      user.role === UserRole.HR_EXECUTIVE ||
      user.role === UserRole.RECRUITER
    ) {
      const [totalEmployees, activeEmployees, traineeCount, byDepartment] = await Promise.all([
        this.prisma.user.count(),
        this.prisma.user.count({ where: { isActive: true } }),
        this.prisma.user.count({ where: { designation: 'TRAINEE' } }),
        this.prisma.user.groupBy({
          by: ['department'],
          where: { department: { not: null } },
          _count: { _all: true },
        }),
      ]);

      return {
        role: user.role,
        metrics: {
          totalEmployees,
          activeEmployees,
          traineeCount,
          departmentBreakdown: byDepartment.map((d) => ({
            department: d.department,
            count: d._count._all,
          })),
        },
      };
    }

    if (user.role === UserRole.FINANCE_MANAGER || user.role === UserRole.FINANCE_EXECUTIVE) {
      const [activePayrollHeadcount, traineeCount] = await Promise.all([
        this.prisma.user.count({ where: { isActive: true } }),
        this.prisma.user.count({ where: { isActive: true, designation: 'TRAINEE' } }),
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

    // Default: EMPLOYEE (tailored by designation)
    const designation = user.designation ?? 'JUNIOR';
    const leaveQuotaDays = LEAVE_QUOTA_BY_DESIGNATION[designation] ?? 18;

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

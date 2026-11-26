import { Injectable } from '@nestjs/common';
import { User, UserRole, Designation, Department } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

export type UserWithOrg = User & {
  designation: Pick<Designation, 'id' | 'code' | 'name' | 'leaveQuota'> | null;
  department: Pick<Department, 'id' | 'code' | 'name'> | null;
};

const ORG_INCLUDE = {
  designation: { select: { id: true, code: true, name: true, leaveQuota: true } },
  department: { select: { id: true, code: true, name: true } },
} as const;

@Injectable()
export class UserRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByEmail(email: string): Promise<UserWithOrg | null> {
    return this.prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
      include: ORG_INCLUDE,
    });
  }

  async findById(id: string): Promise<UserWithOrg | null> {
    return this.prisma.user.findUnique({
      where: { id },
      include: ORG_INCLUDE,
    });
  }

  async createUser(data: {
    email: string;
    name: string;
    passwordHash: string;
    role?: UserRole;
    designationId?: string;
    departmentId?: string;
    managerId?: string;
  }): Promise<UserWithOrg> {
    return this.prisma.user.create({
      data: {
        email: data.email.toLowerCase().trim(),
        name: data.name.trim(),
        passwordHash: data.passwordHash,
        role: data.role ?? UserRole.EMPLOYEE,
        designationId: data.designationId ?? null,
        departmentId: data.departmentId ?? null,
        managerId: data.managerId ?? null,
        failedAttempts: 0,
        lockedUntil: null,
      },
      include: ORG_INCLUDE,
    });
  }

  async incrementFailedAttempts(id: string): Promise<User> {
    return this.prisma.user.update({
      where: { id },
      data: {
        failedAttempts: { increment: 1 },
      },
    });
  }

  async lockAccount(
    id: string,
    lockedUntil: Date,
    failedAttempts: number,
  ): Promise<User> {
    return this.prisma.user.update({
      where: { id },
      data: {
        failedAttempts,
        lockedUntil,
      },
    });
  }

  async resetFailedAttempts(id: string): Promise<User> {
    return this.prisma.user.update({
      where: { id },
      data: {
        failedAttempts: 0,
        lockedUntil: null,
      },
    });
  }

  async updatePassword(id: string, passwordHash: string): Promise<User> {
    return this.prisma.user.update({
      where: { id },
      data: {
        passwordHash,
        failedAttempts: 0,
        lockedUntil: null,
      },
    });
  }
}

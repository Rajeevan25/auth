import { Injectable } from '@nestjs/common';
import { User, UserRole, EmployeeDesignation } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UserRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });
  }

  async findById(id: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { id },
    });
  }

  async createUser(data: {
    email: string;
    name: string;
    passwordHash: string;
    role?: UserRole;
    designation?: EmployeeDesignation;
    department?: string;
    managerId?: string;
  }): Promise<User> {
    return this.prisma.user.create({
      data: {
        email: data.email.toLowerCase().trim(),
        name: data.name.trim(),
        passwordHash: data.passwordHash,
        role: data.role ?? UserRole.EMPLOYEE,
        designation: data.designation ?? null,
        department: data.department ?? null,
        managerId: data.managerId ?? null,
        failedAttempts: 0,
        lockedUntil: null,
      },
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

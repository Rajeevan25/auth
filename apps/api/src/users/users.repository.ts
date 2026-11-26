import { Injectable } from '@nestjs/common';
import { Prisma, UserRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { ListUsersQueryDto, UpdateUserOrgDto } from './dto/user.dto';

export const USER_SAFE_SELECT = {
  id: true,
  email: true,
  name: true,
  role: true,
  departmentId: true,
  designationId: true,
  managerId: true,
  isActive: true,
  failedAttempts: true,
  lockedUntil: true,
  createdAt: true,
  updatedAt: true,
  department: {
    select: { id: true, name: true, code: true },
  },
  designation: {
    select: { id: true, name: true, code: true, level: true, leaveQuota: true },
  },
  manager: {
    select: { id: true, name: true, email: true, role: true },
  },
  profile: true,
  _count: {
    select: { directReports: true },
  },
} as const;

@Injectable()
export class UsersRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: ListUsersQueryDto) {
    const where: Prisma.UserWhereInput = {};

    if (query.role) where.role = query.role;
    if (query.departmentId) where.departmentId = query.departmentId;
    if (query.designationId) where.designationId = query.designationId;
    if (query.managerId) where.managerId = query.managerId;
    if (query.isActive !== undefined) where.isActive = query.isActive;

    if (query.search) {
      where.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { email: { contains: query.search, mode: 'insensitive' } },
        { profile: { employeeCode: { contains: query.search, mode: 'insensitive' } } },
      ];
    }

    const skip = (query.page - 1) * query.limit;

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        select: USER_SAFE_SELECT,
        orderBy: [{ createdAt: 'desc' }],
        skip,
        take: query.limit,
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      users,
      meta: {
        total,
        page: query.page,
        limit: query.limit,
        totalPages: Math.ceil(total / query.limit) || 1,
      },
    };
  }

  async findById(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
      select: {
        ...USER_SAFE_SELECT,
        directReports: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            isActive: true,
            designation: { select: { id: true, name: true, code: true } },
          },
          orderBy: { name: 'asc' },
        },
      },
    });
  }

  async findByEmail(email: string, excludeId?: string) {
    return this.prisma.user.findFirst({
      where: {
        email: { equals: email.toLowerCase().trim(), mode: 'insensitive' },
        ...(excludeId ? { id: { not: excludeId } } : {}),
      },
      select: { id: true },
    });
  }

  async findByEmployeeCode(employeeCode: string, excludeUserId?: string) {
    return this.prisma.userProfile.findFirst({
      where: {
        employeeCode: { equals: employeeCode.trim(), mode: 'insensitive' },
        ...(excludeUserId ? { userId: { not: excludeUserId } } : {}),
      },
      select: { id: true, userId: true },
    });
  }

  async createWithProfile(data: {
    email: string;
    name: string;
    passwordHash: string;
    role: UserRole;
    departmentId?: string | null;
    designationId?: string | null;
    managerId?: string | null;
    profile?: Prisma.UserProfileCreateWithoutUserInput;
  }) {
    return this.prisma.user.create({
      data: {
        email: data.email.toLowerCase().trim(),
        name: data.name.trim(),
        passwordHash: data.passwordHash,
        role: data.role,
        departmentId: data.departmentId ?? null,
        designationId: data.designationId ?? null,
        managerId: data.managerId ?? null,
        profile: {
          create: data.profile ?? {},
        },
      },
      select: USER_SAFE_SELECT,
    });
  }

  async updateWithProfile(
    id: string,
    data: {
      name?: string;
      email?: string;
      profile?: Prisma.UserProfileUpdateWithoutUserInput;
    },
  ) {
    return this.prisma.user.update({
      where: { id },
      data: {
        ...(data.name !== undefined ? { name: data.name.trim() } : {}),
        ...(data.email !== undefined ? { email: data.email.toLowerCase().trim() } : {}),
        ...(data.profile
          ? {
              profile: {
                upsert: {
                  create: data.profile as Prisma.UserProfileCreateWithoutUserInput,
                  update: data.profile,
                },
              },
            }
          : {}),
      },
      select: USER_SAFE_SELECT,
    });
  }

  async updateOrg(id: string, data: UpdateUserOrgDto) {
    return this.prisma.user.update({
      where: { id },
      data: {
        ...(data.role !== undefined ? { role: data.role } : {}),
        ...(data.departmentId !== undefined ? { departmentId: data.departmentId } : {}),
        ...(data.designationId !== undefined ? { designationId: data.designationId } : {}),
        ...(data.managerId !== undefined ? { managerId: data.managerId } : {}),
      },
      select: USER_SAFE_SELECT,
    });
  }

  async updateStatus(
    id: string,
    data: { isActive?: boolean; failedAttempts?: number; lockedUntil?: Date | null },
  ) {
    return this.prisma.user.update({
      where: { id },
      data,
      select: USER_SAFE_SELECT,
    });
  }
}

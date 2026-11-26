import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

const DEPARTMENT_SELECT = {
  id: true,
  name: true,
  code: true,
  description: true,
  headId: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
  head: {
    select: { id: true, name: true, email: true, role: true },
  },
  _count: {
    select: { users: true },
  },
} as const;

@Injectable()
export class DepartmentsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(filters: { search?: string; isActive?: boolean }) {
    const where: Prisma.DepartmentWhereInput = {};
    if (filters.isActive !== undefined) {
      where.isActive = filters.isActive;
    }
    if (filters.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { code: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    return this.prisma.department.findMany({
      where,
      select: DEPARTMENT_SELECT,
      orderBy: { name: 'asc' },
    });
  }

  async findById(id: string) {
    return this.prisma.department.findUnique({
      where: { id },
      select: {
        ...DEPARTMENT_SELECT,
        users: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            isActive: true,
            designation: { select: { id: true, code: true, name: true } },
          },
          orderBy: { name: 'asc' },
        },
      },
    });
  }

  async findConflict(name?: string, code?: string, excludeId?: string) {
    const orConditions: Prisma.DepartmentWhereInput[] = [];
    if (name) orConditions.push({ name: { equals: name, mode: 'insensitive' } });
    if (code) orConditions.push({ code: { equals: code, mode: 'insensitive' } });
    if (orConditions.length === 0) return null;

    return this.prisma.department.findFirst({
      where: {
        OR: orConditions,
        ...(excludeId ? { id: { not: excludeId } } : {}),
      },
      select: { id: true, name: true, code: true },
    });
  }

  async create(data: {
    name: string;
    code: string;
    description?: string | null;
    headId?: string | null;
  }) {
    return this.prisma.department.create({
      data,
      select: DEPARTMENT_SELECT,
    });
  }

  async update(
    id: string,
    data: {
      name?: string;
      code?: string;
      description?: string | null;
      headId?: string | null;
      isActive?: boolean;
    },
  ) {
    return this.prisma.department.update({
      where: { id },
      data,
      select: DEPARTMENT_SELECT,
    });
  }

  async countActiveUsers(departmentId: string): Promise<number> {
    return this.prisma.user.count({
      where: { departmentId, isActive: true },
    });
  }
}

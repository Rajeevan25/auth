import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

const DESIGNATION_SELECT = {
  id: true,
  name: true,
  code: true,
  level: true,
  leaveQuota: true,
  description: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
  _count: {
    select: { users: true },
  },
} as const;

@Injectable()
export class DesignationsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(filters: { search?: string; isActive?: boolean }) {
    const where: Prisma.DesignationWhereInput = {};
    if (filters.isActive !== undefined) {
      where.isActive = filters.isActive;
    }
    if (filters.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { code: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    return this.prisma.designation.findMany({
      where,
      select: DESIGNATION_SELECT,
      orderBy: [{ level: 'desc' }, { name: 'asc' }],
    });
  }

  async findById(id: string) {
    return this.prisma.designation.findUnique({
      where: { id },
      select: DESIGNATION_SELECT,
    });
  }

  async findConflict(name?: string, code?: string, excludeId?: string) {
    const orConditions: Prisma.DesignationWhereInput[] = [];
    if (name) orConditions.push({ name: { equals: name, mode: 'insensitive' } });
    if (code) orConditions.push({ code: { equals: code, mode: 'insensitive' } });
    if (orConditions.length === 0) return null;

    return this.prisma.designation.findFirst({
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
    level: number;
    leaveQuota: number;
    description?: string | null;
  }) {
    return this.prisma.designation.create({
      data,
      select: DESIGNATION_SELECT,
    });
  }

  async update(
    id: string,
    data: {
      name?: string;
      code?: string;
      level?: number;
      leaveQuota?: number;
      description?: string | null;
      isActive?: boolean;
    },
  ) {
    return this.prisma.designation.update({
      where: { id },
      data,
      select: DESIGNATION_SELECT,
    });
  }

  async countActiveUsers(designationId: string): Promise<number> {
    return this.prisma.user.count({
      where: { designationId, isActive: true },
    });
  }
}

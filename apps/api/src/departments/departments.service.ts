import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { BadRequestError, ConflictError, NotFoundError } from '../utils/errors';
import { DepartmentsRepository } from './departments.repository';
import {
  CreateDepartmentDto,
  ListDepartmentsQueryDto,
  UpdateDepartmentDto,
} from './dto/department.dto';

@Injectable()
export class DepartmentsService {
  constructor(
    private readonly departmentsRepository: DepartmentsRepository,
    private readonly prisma: PrismaService,
  ) {}

  private async validateHeadUser(headId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: headId },
      select: { id: true, isActive: true },
    });
    if (!user) {
      throw new NotFoundError('Department head user not found');
    }
    if (!user.isActive) {
      throw new BadRequestError('Department head must be an active user');
    }
  }

  async findAll(query: ListDepartmentsQueryDto) {
    return this.departmentsRepository.findAll(query);
  }

  async findById(id: string) {
    const department = await this.departmentsRepository.findById(id);
    if (!department) {
      throw new NotFoundError('Department not found');
    }
    return department;
  }

  async create(dto: CreateDepartmentDto) {
    const conflict = await this.departmentsRepository.findConflict(dto.name, dto.code);
    if (conflict) {
      throw new ConflictError('A department with this name or code already exists');
    }

    if (dto.headId) {
      await this.validateHeadUser(dto.headId);
    }

    return this.departmentsRepository.create({
      name: dto.name,
      code: dto.code,
      description: dto.description ?? null,
      headId: dto.headId ?? null,
    });
  }

  async update(id: string, dto: UpdateDepartmentDto) {
    await this.findById(id);

    if (dto.name || dto.code) {
      const conflict = await this.departmentsRepository.findConflict(dto.name, dto.code, id);
      if (conflict) {
        throw new ConflictError('A department with this name or code already exists');
      }
    }

    if (dto.headId) {
      await this.validateHeadUser(dto.headId);
    }

    if (dto.isActive === false) {
      const activeUsers = await this.departmentsRepository.countActiveUsers(id);
      if (activeUsers > 0) {
        throw new BadRequestError(
          `Cannot deactivate department with ${activeUsers} active user(s). Reassign them first.`,
        );
      }
    }

    return this.departmentsRepository.update(id, dto);
  }

  async deactivate(id: string) {
    return this.update(id, { isActive: false });
  }
}

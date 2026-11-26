import { Injectable } from '@nestjs/common';
import { BadRequestError, ConflictError, NotFoundError } from '../utils/errors';
import { DesignationsRepository } from './designations.repository';
import {
  CreateDesignationDto,
  ListDesignationsQueryDto,
  UpdateDesignationDto,
} from './dto/designation.dto';

@Injectable()
export class DesignationsService {
  constructor(private readonly designationsRepository: DesignationsRepository) {}

  async findAll(query: ListDesignationsQueryDto) {
    return this.designationsRepository.findAll(query);
  }

  async findById(id: string) {
    const designation = await this.designationsRepository.findById(id);
    if (!designation) {
      throw new NotFoundError('Designation not found');
    }
    return designation;
  }

  async create(dto: CreateDesignationDto) {
    const conflict = await this.designationsRepository.findConflict(dto.name, dto.code);
    if (conflict) {
      throw new ConflictError('A designation with this name or code already exists');
    }

    return this.designationsRepository.create({
      name: dto.name,
      code: dto.code,
      level: dto.level,
      leaveQuota: dto.leaveQuota,
      description: dto.description ?? null,
    });
  }

  async update(id: string, dto: UpdateDesignationDto) {
    await this.findById(id);

    if (dto.name || dto.code) {
      const conflict = await this.designationsRepository.findConflict(dto.name, dto.code, id);
      if (conflict) {
        throw new ConflictError('A designation with this name or code already exists');
      }
    }

    if (dto.isActive === false) {
      const activeUsers = await this.designationsRepository.countActiveUsers(id);
      if (activeUsers > 0) {
        throw new BadRequestError(
          `Cannot deactivate designation assigned to ${activeUsers} active user(s). Reassign them first.`,
        );
      }
    }

    return this.designationsRepository.update(id, dto);
  }

  async deactivate(id: string) {
    return this.update(id, { isActive: false });
  }
}

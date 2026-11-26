import { Injectable } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import {
  BadRequestError,
  ConflictError,
  ForbiddenError,
  NotFoundError,
} from '../utils/errors';
import { hashPassword } from '../utils/password.utils';
import {
  CreateUserDto,
  ListUsersQueryDto,
  UpdateMyProfileDto,
  UpdateUserDto,
  UpdateUserOrgDto,
  UpdateUserStatusDto,
} from './dto/user.dto';
import { UsersRepository } from './users.repository';

@Injectable()
export class UsersService {
  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly prisma: PrismaService,
  ) {}

  private assertCanManageRole(actorRole: string, targetRole: UserRole) {
    if (actorRole === UserRole.SUPER_ADMIN) {
      return;
    }
    if (actorRole === UserRole.ADMIN) {
      if (targetRole === UserRole.SUPER_ADMIN) {
        throw new ForbiddenError('Only a Super Admin can manage Super Admin accounts');
      }
      return;
    }
    if (actorRole === UserRole.HR_MANAGER) {
      if (targetRole === UserRole.SUPER_ADMIN || targetRole === UserRole.ADMIN) {
        throw new ForbiddenError('HR Manager cannot manage Admin or Super Admin accounts');
      }
      return;
    }
    throw new ForbiddenError('You do not have permission to manage this role');
  }

  private async validateOrgReferences(params: {
    userId?: string;
    departmentId?: string | null;
    designationId?: string | null;
    managerId?: string | null;
  }) {
    if (params.departmentId) {
      const dept = await this.prisma.department.findUnique({
        where: { id: params.departmentId },
        select: { id: true, isActive: true },
      });
      if (!dept) throw new NotFoundError('Department not found');
      if (!dept.isActive) throw new BadRequestError('Cannot assign an inactive department');
    }

    if (params.designationId) {
      const desig = await this.prisma.designation.findUnique({
        where: { id: params.designationId },
        select: { id: true, isActive: true },
      });
      if (!desig) throw new NotFoundError('Designation not found');
      if (!desig.isActive) throw new BadRequestError('Cannot assign an inactive designation');
    }

    if (params.managerId) {
      if (params.userId && params.managerId === params.userId) {
        throw new BadRequestError('A user cannot be their own manager');
      }

      const manager = await this.prisma.user.findUnique({
        where: { id: params.managerId },
        select: { id: true, isActive: true },
      });
      if (!manager) throw new NotFoundError('Manager user not found');
      if (!manager.isActive) throw new BadRequestError('Assigned manager must be active');

      // Prevent circular reporting chains
      if (params.userId) {
        let currentManagerId: string | null = params.managerId;
        const visited = new Set<string>([params.userId]);
        while (currentManagerId) {
          if (visited.has(currentManagerId)) {
            throw new BadRequestError('Circular manager hierarchy detected');
          }
          visited.add(currentManagerId);
          const ancestor: { managerId: string | null } | null =
            await this.prisma.user.findUnique({
              where: { id: currentManagerId },
              select: { managerId: true },
            });
          currentManagerId = ancestor?.managerId ?? null;
        }
      }
    }
  }

  async findAll(
    query: ListUsersQueryDto,
    actor?: { userId: string; role: string },
  ) {
    if (
      actor &&
      (actor.role === UserRole.MANAGER || actor.role === UserRole.TEAM_LEAD)
    ) {
      return this.usersRepository.findAll({
        ...query,
        managerId: actor.userId,
      });
    }
    return this.usersRepository.findAll(query);
  }

  async findById(id: string, actor?: { userId: string; role: string }) {
    const user = await this.usersRepository.findById(id);
    if (!user) {
      throw new NotFoundError('User not found');
    }

    if (
      actor &&
      (actor.role === UserRole.MANAGER || actor.role === UserRole.TEAM_LEAD) &&
      actor.userId !== id &&
      user.managerId !== actor.userId
    ) {
      throw new ForbiddenError('Managers can only view their own profile or direct reports');
    }

    return user;
  }

  async create(actorRole: string, dto: CreateUserDto) {
    this.assertCanManageRole(actorRole, dto.role);

    const existingEmail = await this.usersRepository.findByEmail(dto.email);
    if (existingEmail) {
      throw new ConflictError('A user with this email already exists');
    }

    if (dto.profile?.employeeCode) {
      const existingCode = await this.usersRepository.findByEmployeeCode(dto.profile.employeeCode);
      if (existingCode) {
        throw new ConflictError('A user with this employee code already exists');
      }
    }

    await this.validateOrgReferences({
      departmentId: dto.departmentId,
      designationId: dto.designationId,
      managerId: dto.managerId,
    });

    const passwordHash = await hashPassword(dto.password);

    return this.usersRepository.createWithProfile({
      email: dto.email,
      name: dto.name,
      passwordHash,
      role: dto.role,
      departmentId: dto.departmentId,
      designationId: dto.designationId,
      managerId: dto.managerId,
      profile: dto.profile,
    });
  }

  async update(actorRole: string, targetUserId: string, dto: UpdateUserDto) {
    const target = await this.findById(targetUserId);
    this.assertCanManageRole(actorRole, target.role);

    if (dto.email) {
      const existingEmail = await this.usersRepository.findByEmail(dto.email, targetUserId);
      if (existingEmail) {
        throw new ConflictError('A user with this email already exists');
      }
    }

    if (dto.profile?.employeeCode) {
      const existingCode = await this.usersRepository.findByEmployeeCode(
        dto.profile.employeeCode,
        targetUserId,
      );
      if (existingCode) {
        throw new ConflictError('A user with this employee code already exists');
      }
    }

    return this.usersRepository.updateWithProfile(targetUserId, {
      name: dto.name,
      email: dto.email,
      profile: dto.profile,
    });
  }

  async updateOrg(
    actorUserId: string,
    actorRole: string,
    targetUserId: string,
    dto: UpdateUserOrgDto,
  ) {
    const target = await this.findById(targetUserId);
    this.assertCanManageRole(actorRole, target.role);

    if (actorUserId === targetUserId && dto.role !== undefined && dto.role !== target.role) {
      throw new ForbiddenError('You cannot change your own role');
    }

    if (dto.role) {
      this.assertCanManageRole(actorRole, dto.role);
    }

    await this.validateOrgReferences({
      userId: targetUserId,
      departmentId: dto.departmentId,
      designationId: dto.designationId,
      managerId: dto.managerId,
    });

    return this.usersRepository.updateOrg(targetUserId, dto);
  }

  async updateStatus(
    actorUserId: string,
    actorRole: string,
    targetUserId: string,
    dto: UpdateUserStatusDto,
  ) {
    const target = await this.findById(targetUserId);
    this.assertCanManageRole(actorRole, target.role);

    if (actorUserId === targetUserId && dto.isActive === false) {
      throw new BadRequestError('You cannot deactivate your own account');
    }

    if (dto.isActive === false) {
      const [activeReports, headedDepts] = await Promise.all([
        this.prisma.user.count({ where: { managerId: targetUserId, isActive: true } }),
        this.prisma.department.count({ where: { headId: targetUserId, isActive: true } }),
      ]);
      if (activeReports > 0) {
        throw new BadRequestError(
          `Cannot deactivate user with ${activeReports} active direct report(s). Reassign them first.`,
        );
      }
      if (headedDepts > 0) {
        throw new BadRequestError(
          `Cannot deactivate user who heads ${headedDepts} active department(s). Reassign department head first.`,
        );
      }
    }

    const updateData: {
      isActive?: boolean;
      failedAttempts?: number;
      lockedUntil?: Date | null;
    } = {};

    if (dto.isActive !== undefined) {
      updateData.isActive = dto.isActive;
    }
    if (dto.unlockAccount) {
      updateData.failedAttempts = 0;
      updateData.lockedUntil = null;
    }

    const updated = await this.usersRepository.updateStatus(targetUserId, updateData);

    // Revoke active sessions immediately when deactivating a user
    if (dto.isActive === false) {
      await this.prisma.refreshToken.updateMany({
        where: { userId: targetUserId, revokedAt: null },
        data: { revokedAt: new Date() },
      });
    }

    return updated;
  }

  async updateMyProfile(userId: string, dto: UpdateMyProfileDto) {
    await this.findById(userId);
    const { name, ...profileFields } = dto;

    return this.usersRepository.updateWithProfile(userId, {
      name,
      profile: profileFields,
    });
  }
}

import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Req,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { AuthGuard, AuthenticatedRequest } from '../auth/auth.guard';
import { Roles, RolesGuard } from '../auth/roles.guard';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { ForbiddenError } from '../utils/errors';
import {
  CreateUserDto,
  createUserSchema,
  ListUsersQueryDto,
  listUsersQuerySchema,
  UpdateMyProfileDto,
  updateMyProfileSchema,
  UpdateUserDto,
  updateUserOrgSchema,
  UpdateUserOrgDto,
  updateUserSchema,
  UpdateUserStatusDto,
  updateUserStatusSchema,
} from './dto/user.dto';
import { UsersService } from './users.service';

const DIRECTORY_ROLES = [
  UserRole.SUPER_ADMIN,
  UserRole.ADMIN,
  UserRole.HR_MANAGER,
  UserRole.HR_EXECUTIVE,
  UserRole.RECRUITER,
  UserRole.MANAGER,
  UserRole.TEAM_LEAD,
] as const;

const ADMIN_HR_ROLES = [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.HR_MANAGER] as const;

@Controller('users')
@UseGuards(AuthGuard, RolesGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me/profile')
  async getMyProfile(@Req() req: AuthenticatedRequest) {
    if (!req.user?.userId) {
      throw new UnauthorizedException('Unauthorized');
    }
    const user = await this.usersService.findById(req.user.userId);
    return { success: true, user };
  }

  @Patch('me/profile')
  async updateMyProfile(
    @Req() req: AuthenticatedRequest,
    @Body(new ZodValidationPipe(updateMyProfileSchema)) body: UpdateMyProfileDto,
  ) {
    if (!req.user?.userId) {
      throw new UnauthorizedException('Unauthorized');
    }
    const user = await this.usersService.updateMyProfile(req.user.userId, body);
    return {
      success: true,
      message: 'Profile updated successfully',
      user,
    };
  }

  @Get()
  @Roles(...DIRECTORY_ROLES)
  async findAll(
    @Req() req: AuthenticatedRequest,
    @Query(new ZodValidationPipe(listUsersQuerySchema)) query: ListUsersQueryDto,
  ) {
    const result = await this.usersService.findAll(query, {
      userId: req.user?.userId ?? '',
      role: req.user?.role ?? '',
    });
    return {
      success: true,
      users: result.users,
      meta: result.meta,
    };
  }

  @Get(':id')
  async findById(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: AuthenticatedRequest,
  ) {
    const actorRole = req.user?.role as UserRole;
    const isSelf = req.user?.userId === id;
    const canViewDirectory = (DIRECTORY_ROLES as readonly string[]).includes(actorRole);

    if (!isSelf && !canViewDirectory) {
      throw new ForbiddenError('You do not have permission to view this user profile');
    }

    const user = await this.usersService.findById(id, {
      userId: req.user?.userId ?? '',
      role: actorRole,
    });
    return { success: true, user };
  }

  @Post()
  @Roles(...ADMIN_HR_ROLES)
  async create(
    @Req() req: AuthenticatedRequest,
    @Body(new ZodValidationPipe(createUserSchema)) body: CreateUserDto,
  ) {
    const user = await this.usersService.create(req.user?.role ?? '', body);
    return {
      success: true,
      message: 'User created successfully',
      user,
    };
  }

  @Patch(':id')
  @Roles(...ADMIN_HR_ROLES)
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: AuthenticatedRequest,
    @Body(new ZodValidationPipe(updateUserSchema)) body: UpdateUserDto,
  ) {
    const user = await this.usersService.update(req.user?.role ?? '', id, body);
    return {
      success: true,
      message: 'User updated successfully',
      user,
    };
  }

  @Patch(':id/org')
  @Roles(...ADMIN_HR_ROLES)
  async updateOrg(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: AuthenticatedRequest,
    @Body(new ZodValidationPipe(updateUserOrgSchema)) body: UpdateUserOrgDto,
  ) {
    const user = await this.usersService.updateOrg(
      req.user?.userId ?? '',
      req.user?.role ?? '',
      id,
      body,
    );
    return {
      success: true,
      message: 'User organization details updated successfully',
      user,
    };
  }

  @Patch(':id/status')
  @Roles(...ADMIN_HR_ROLES)
  async updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: AuthenticatedRequest,
    @Body(new ZodValidationPipe(updateUserStatusSchema)) body: UpdateUserStatusDto,
  ) {
    const user = await this.usersService.updateStatus(
      req.user?.userId ?? '',
      req.user?.role ?? '',
      id,
      body,
    );
    return {
      success: true,
      message: 'User status updated successfully',
      user,
    };
  }
}

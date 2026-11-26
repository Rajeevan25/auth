import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { AuthGuard } from '../auth/auth.guard';
import { Roles, RolesGuard } from '../auth/roles.guard';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { DesignationsService } from './designations.service';
import {
  CreateDesignationDto,
  createDesignationSchema,
  ListDesignationsQueryDto,
  listDesignationsQuerySchema,
  UpdateDesignationDto,
  updateDesignationSchema,
} from './dto/designation.dto';

@Controller('designations')
@UseGuards(AuthGuard, RolesGuard)
export class DesignationsController {
  constructor(private readonly designationsService: DesignationsService) {}

  @Get()
  async findAll(
    @Query(new ZodValidationPipe(listDesignationsQuerySchema)) query: ListDesignationsQueryDto,
  ) {
    const designations = await this.designationsService.findAll(query);
    return { success: true, designations };
  }

  @Get(':id')
  async findById(@Param('id', ParseUUIDPipe) id: string) {
    const designation = await this.designationsService.findById(id);
    return { success: true, designation };
  }

  @Post()
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.HR_MANAGER)
  async create(@Body(new ZodValidationPipe(createDesignationSchema)) body: CreateDesignationDto) {
    const designation = await this.designationsService.create(body);
    return {
      success: true,
      message: 'Designation created successfully',
      designation,
    };
  }

  @Patch(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.HR_MANAGER)
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body(new ZodValidationPipe(updateDesignationSchema)) body: UpdateDesignationDto,
  ) {
    const designation = await this.designationsService.update(id, body);
    return {
      success: true,
      message: 'Designation updated successfully',
      designation,
    };
  }

  @Delete(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.HR_MANAGER)
  async deactivate(@Param('id', ParseUUIDPipe) id: string) {
    const designation = await this.designationsService.deactivate(id);
    return {
      success: true,
      message: 'Designation deactivated successfully',
      designation,
    };
  }
}

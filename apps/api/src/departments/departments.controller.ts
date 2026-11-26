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
import { DepartmentsService } from './departments.service';
import {
  CreateDepartmentDto,
  createDepartmentSchema,
  ListDepartmentsQueryDto,
  listDepartmentsQuerySchema,
  UpdateDepartmentDto,
  updateDepartmentSchema,
} from './dto/department.dto';

@Controller('departments')
@UseGuards(AuthGuard, RolesGuard)
export class DepartmentsController {
  constructor(private readonly departmentsService: DepartmentsService) {}

  @Get()
  async findAll(
    @Query(new ZodValidationPipe(listDepartmentsQuerySchema)) query: ListDepartmentsQueryDto,
  ) {
    const departments = await this.departmentsService.findAll(query);
    return { success: true, departments };
  }

  @Get(':id')
  async findById(@Param('id', ParseUUIDPipe) id: string) {
    const department = await this.departmentsService.findById(id);
    return { success: true, department };
  }

  @Post()
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.HR_MANAGER)
  async create(@Body(new ZodValidationPipe(createDepartmentSchema)) body: CreateDepartmentDto) {
    const department = await this.departmentsService.create(body);
    return {
      success: true,
      message: 'Department created successfully',
      department,
    };
  }

  @Patch(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.HR_MANAGER)
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body(new ZodValidationPipe(updateDepartmentSchema)) body: UpdateDepartmentDto,
  ) {
    const department = await this.departmentsService.update(id, body);
    return {
      success: true,
      message: 'Department updated successfully',
      department,
    };
  }

  @Delete(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.HR_MANAGER)
  async deactivate(@Param('id', ParseUUIDPipe) id: string) {
    const department = await this.departmentsService.deactivate(id);
    return {
      success: true,
      message: 'Department deactivated successfully',
      department,
    };
  }
}

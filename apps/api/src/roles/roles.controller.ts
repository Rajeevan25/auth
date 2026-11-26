import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { AuthGuard, AuthenticatedRequest } from '../auth/auth.guard';
import { RolesService } from './roles.service';

@Controller('roles')
@UseGuards(AuthGuard)
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Get()
  async findAll() {
    const roles = await this.rolesService.findAll();
    return { success: true, roles };
  }

  @Get('assignable')
  findAssignable(@Req() req: AuthenticatedRequest) {
    const roles = this.rolesService.getAssignableRoles(req.user?.role ?? '');
    return { success: true, roles };
  }
}

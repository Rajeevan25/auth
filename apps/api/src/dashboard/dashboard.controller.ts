import { Controller, Get, Req, UnauthorizedException, UseGuards } from '@nestjs/common';
import { AuthGuard, AuthenticatedRequest } from '../auth/auth.guard';
import { DashboardService } from './dashboard.service';

@Controller('dashboard')
@UseGuards(AuthGuard)
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('summary')
  async getSummary(@Req() req: AuthenticatedRequest) {
    if (!req.user) {
      throw new UnauthorizedException('Unauthorized');
    }

    const summary = await this.dashboardService.getSummaryForUser(req.user);
    return {
      success: true,
      ...summary,
    };
  }
}

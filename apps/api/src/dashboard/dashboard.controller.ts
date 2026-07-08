import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUserId } from '../common/decorators/current-user.decorator';
import { DashboardService, DashboardSummary } from './dashboard.service';

/** Panel inicial (RF-38). Protegido por sesión (RNF-06). */
@Controller('dashboard')
@UseGuards(JwtAuthGuard)
export class DashboardController {
  constructor(private readonly dashboard: DashboardService) {}

  @Get()
  getSummary(@CurrentUserId() userId: string): Promise<DashboardSummary> {
    return this.dashboard.getSummary(userId);
  }
}

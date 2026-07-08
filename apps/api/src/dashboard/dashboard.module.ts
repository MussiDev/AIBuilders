import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { MovementsModule } from '../movements/movements.module';
import { GroupsModule } from '../groups/groups.module';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';

/** Paso 5 — Panel inicial (RF-38). */
@Module({
  imports: [AuthModule, MovementsModule, GroupsModule],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}

import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import {
  GroupsController,
  InvitationsController,
} from './groups.controller';
import { SharedExpensesController } from './shared-expenses.controller';
import { GroupsService } from './groups.service';
import { BalanceService } from './balance.service';
import { SharedExpensesService } from './shared-expenses.service';

/** F2 — Grupos + gasto compartido en partes iguales (RF-21 a 34). */
@Module({
  imports: [AuthModule], // reusa JwtAuthGuard para proteger las rutas (RNF-06)
  controllers: [
    GroupsController,
    InvitationsController,
    SharedExpensesController,
  ],
  providers: [GroupsService, BalanceService, SharedExpensesService],
  exports: [GroupsService, BalanceService, SharedExpensesService],
})
export class GroupsModule {}

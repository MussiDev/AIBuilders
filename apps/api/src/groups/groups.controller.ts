import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { Group, GroupMember, Settlement } from '@prisma/client';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUserId } from '../common/decorators/current-user.decorator';
import { GroupsService } from './groups.service';
import { BalanceService, GroupBalances } from './balance.service';
import { CreateGroupDto } from './dto/create-group.dto';
import { CreateSettlementDto } from './dto/create-settlement.dto';

/** Grupos, invitaciones, balance y pagos (RF-21 a 23, 29, 31, 34). */
@Controller('groups')
@UseGuards(JwtAuthGuard)
export class GroupsController {
  constructor(
    private readonly groups: GroupsService,
    private readonly balance: BalanceService,
  ) {}

  @Post()
  create(
    @CurrentUserId() userId: string,
    @Body() dto: CreateGroupDto,
  ): Promise<Group> {
    return this.groups.create(userId, dto);
  }

  @Get()
  list(@CurrentUserId() userId: string): Promise<Group[]> {
    return this.groups.listForUser(userId);
  }

  @Get(':id')
  getOne(
    @CurrentUserId() userId: string,
    @Param('id') id: string,
  ): Promise<Group> {
    return this.groups.getOne(userId, id);
  }

  @Post(':id/invitations')
  createInvitation(
    @CurrentUserId() userId: string,
    @Param('id') id: string,
  ) {
    return this.groups.createInvitation(userId, id);
  }

  @Get(':id/balance')
  getBalance(
    @CurrentUserId() userId: string,
    @Param('id') id: string,
  ): Promise<GroupBalances> {
    return this.balance.getNetBalances(userId, id);
  }

  @Post(':id/settlements')
  settle(
    @CurrentUserId() userId: string,
    @Param('id') id: string,
    @Body() dto: CreateSettlementDto,
  ): Promise<Settlement> {
    return this.balance.createSettlement(userId, id, dto);
  }

  // RF-34: salir del grupo. RF-46: la confirmación la aplica el cliente.
  @Delete(':id/membership')
  @HttpCode(204)
  leave(
    @CurrentUserId() userId: string,
    @Param('id') id: string,
  ): Promise<void> {
    return this.groups.leave(userId, id);
  }
}

/** Aceptación de invitaciones por token (RF-23). Ruta fuera del prefijo /groups. */
@Controller('invitations')
@UseGuards(JwtAuthGuard)
export class InvitationsController {
  constructor(private readonly groups: GroupsService) {}

  @Post(':token/accept')
  accept(
    @CurrentUserId() userId: string,
    @Param('token') token: string,
  ): Promise<GroupMember> {
    return this.groups.acceptInvitation(userId, token);
  }
}

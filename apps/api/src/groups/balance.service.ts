import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Settlement } from '@prisma/client';
import { addMoney, toMoney } from '@app/shared';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSettlementDto } from './dto/create-settlement.dto';

export interface MemberBalance {
  userId: string;
  balance: string; // string para preservar la exactitud decimal (RNF-11)
}

export interface GroupBalances {
  currencyCode: string;
  balances: MemberBalance[];
}

/**
 * Balance neto por miembro (RF-29) y registro de pagos de saldo (RF-31).
 * Convención de signo: balance positivo = al miembro le deben; negativo = debe.
 */
@Injectable()
export class BalanceService {
  constructor(private readonly prisma: PrismaService) {}

  async getNetBalances(userId: string, groupId: string): Promise<GroupBalances> {
    await this.assertMember(userId, groupId);

    const group = await this.prisma.group.findUnique({
      where: { id: groupId },
      include: {
        members: { select: { userId: true } },
        expenses: {
          select: {
            amount: true,
            payerId: true,
            shares: { select: { userId: true, amount: true } },
          },
        },
        settlements: {
          select: { fromUserId: true, toUserId: true, amount: true },
        },
      },
    });
    if (!group) {
      throw new NotFoundException('Grupo no encontrado');
    }

    // balance[u] = (lo que pagó u) - (lo que le corresponde a u) + ajustes por pagos.
    const balances = new Map<string, ReturnType<typeof toMoney>>();
    for (const member of group.members) {
      balances.set(member.userId, toMoney(0));
    }
    const bump = (uid: string, delta: ReturnType<typeof toMoney>): void => {
      balances.set(uid, addMoney(balances.get(uid) ?? toMoney(0), delta));
    };

    for (const expense of group.expenses) {
      bump(expense.payerId, toMoney(expense.amount.toString()));
      for (const share of expense.shares) {
        bump(share.userId, toMoney(share.amount.toString()).negated());
      }
    }
    for (const s of group.settlements) {
      // Quien paga (from) reduce su deuda; quien recibe (to) reduce lo que le deben.
      bump(s.fromUserId, toMoney(s.amount.toString()));
      bump(s.toUserId, toMoney(s.amount.toString()).negated());
    }

    return {
      currencyCode: group.currencyCode,
      balances: [...balances.entries()].map(([uid, amount]) => ({
        userId: uid,
        balance: amount.toFixed(2),
      })),
    };
  }

  /** Balance neto de un único miembro (usado por "salir del grupo", RF-34). */
  async getMemberBalance(userId: string, groupId: string): Promise<string> {
    const { balances } = await this.getNetBalances(userId, groupId);
    const own = balances.find((b) => b.userId === userId);
    return own?.balance ?? '0.00';
  }

  /** RF-31: registra que `fromUserId` le pagó a `toUserId` para saldar deuda. */
  async createSettlement(
    userId: string,
    groupId: string,
    dto: CreateSettlementDto,
  ): Promise<Settlement> {
    await this.assertMember(userId, groupId);

    if (dto.fromUserId === dto.toUserId) {
      throw new BadRequestException('El pago debe ser entre dos miembros distintos');
    }
    await this.assertMember(dto.fromUserId, groupId);
    await this.assertMember(dto.toUserId, groupId);

    const group = await this.prisma.group.findUnique({
      where: { id: groupId },
      select: { currencyCode: true },
    });
    if (!group) {
      throw new NotFoundException('Grupo no encontrado');
    }

    return this.prisma.settlement.create({
      data: {
        groupId,
        fromUserId: dto.fromUserId,
        toUserId: dto.toUserId,
        amount: dto.amount,
        currencyCode: group.currencyCode,
        date: dto.date ? new Date(dto.date) : new Date(),
      },
    });
  }

  private async assertMember(userId: string, groupId: string): Promise<void> {
    const membership = await this.prisma.groupMember.findUnique({
      where: { groupId_userId: { groupId, userId } },
    });
    if (!membership) {
      throw new ForbiddenException('No sos miembro de este grupo');
    }
  }
}

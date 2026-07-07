import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, SharedExpense } from '@prisma/client';
import { splitEqually } from '@app/shared';
import { PrismaService } from '../prisma/prisma.service';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { UpdateExpenseDto } from './dto/update-expense.dto';

interface ShareData {
  userId: string;
  amount: string;
}

/** Categoría personal donde caen los egresos autogenerados desde grupos (RF-35). */
const SHARED_CATEGORY_NAME = 'Gastos compartidos';

/** Forma mínima de un gasto con sus partes, para sincronizar los movimientos. */
interface ExpenseWithShares {
  currencyCode: string;
  category: string;
  date: Date;
  shares: { id: string; userId: string; amount: Prisma.Decimal | string }[];
}

/**
 * Gastos compartidos divididos en partes iguales (RF-24, RF-25, RF-28, RF-32, RF-33)
 * con integración automática hacia las finanzas personales (RF-35/36/37, el
 * diferencial). Todo acceso queda acotado a miembros del grupo (RNF-06).
 */
@Injectable()
export class SharedExpensesService {
  constructor(private readonly prisma: PrismaService) {}

  /** RF-24 + RF-25: registra el gasto y reparte el total en partes iguales. */
  async create(
    userId: string,
    groupId: string,
    dto: CreateExpenseDto,
  ): Promise<SharedExpense> {
    await this.assertMember(userId, groupId);
    const currencyCode = await this.groupCurrency(groupId);
    const memberIds = await this.groupMemberIds(groupId);

    this.assertParticipantsAreMembers(dto.payerId, dto.memberIds, memberIds);
    const shares = this.buildShares(dto.amount, dto.memberIds);

    // R4: el gasto, sus partes y los egresos personales se crean de forma atómica.
    return this.prisma.$transaction(async (tx) => {
      const expense = await tx.sharedExpense.create({
        data: {
          groupId,
          payerId: dto.payerId,
          amount: dto.amount,
          currencyCode, // RNF-17: siempre la moneda del grupo
          category: dto.category,
          date: new Date(dto.date),
          shares: { create: shares },
        },
        include: { shares: true },
      });
      await this.syncPersonalMovements(tx, expense);
      return expense;
    });
  }

  async list(userId: string, groupId: string): Promise<SharedExpense[]> {
    await this.assertMember(userId, groupId);
    return this.prisma.sharedExpense.findMany({
      where: { groupId },
      orderBy: { date: 'desc' },
      include: { shares: true },
    });
  }

  async getOne(userId: string, expenseId: string): Promise<SharedExpense> {
    const expense = await this.prisma.sharedExpense.findUnique({
      where: { id: expenseId },
      include: { shares: true },
    });
    if (!expense) {
      throw new NotFoundException('Gasto no encontrado');
    }
    await this.assertMember(userId, expense.groupId);
    return expense;
  }

  /** RF-32: edita un gasto y recalcula las partes, con bloqueo optimista (R6). */
  async update(
    userId: string,
    expenseId: string,
    dto: UpdateExpenseDto,
  ): Promise<SharedExpense> {
    const current = await this.prisma.sharedExpense.findUnique({
      where: { id: expenseId },
      include: { shares: { select: { userId: true } } },
    });
    if (!current) {
      throw new NotFoundException('Gasto no encontrado');
    }
    await this.assertMember(userId, current.groupId);

    // R6: si otro editó el gasto en el medio, la versión no coincide → conflicto.
    if (current.version !== dto.version) {
      throw new ConflictException(
        'El gasto fue modificado por otra persona; recargá y volvé a intentar',
      );
    }

    const memberIds = await this.groupMemberIds(current.groupId);
    const newAmount = dto.amount ?? current.amount.toString();
    const newMemberIds = dto.memberIds ?? current.shares.map((s) => s.userId);
    const newPayerId = dto.payerId ?? undefined;

    this.assertParticipantsAreMembers(newPayerId, newMemberIds, memberIds);
    const shares = this.buildShares(newAmount, newMemberIds);

    // R4: recomputar partes y egresos personales de forma atómica.
    return this.prisma.$transaction(async (tx) => {
      // Se reemplazan todas las partes: la división pudo cambiar. Al borrar cada
      // parte, su egreso personal asociado cae por cascada (onDelete: Cascade).
      await tx.expenseShare.deleteMany({ where: { sharedExpenseId: expenseId } });
      const updated = await tx.sharedExpense.update({
        where: { id: expenseId },
        data: {
          ...(dto.amount !== undefined ? { amount: dto.amount } : {}),
          ...(dto.payerId !== undefined ? { payerId: dto.payerId } : {}),
          ...(dto.date !== undefined ? { date: new Date(dto.date) } : {}),
          ...(dto.category !== undefined ? { category: dto.category } : {}),
          version: { increment: 1 },
          shares: { create: shares },
        },
        include: { shares: true },
      });
      // RF-36: los egresos personales se regeneran con las nuevas partes.
      await this.syncPersonalMovements(tx, updated);
      return updated;
    });
  }

  /**
   * RF-33 + RF-37: elimina el gasto; las partes y sus egresos personales
   * asociados caen en cascada (onDelete: Cascade en el schema).
   */
  async remove(userId: string, expenseId: string): Promise<void> {
    const expense = await this.prisma.sharedExpense.findUnique({
      where: { id: expenseId },
      select: { groupId: true },
    });
    if (!expense) {
      throw new NotFoundException('Gasto no encontrado');
    }
    await this.assertMember(userId, expense.groupId);
    await this.prisma.sharedExpense.delete({ where: { id: expenseId } });
  }

  /**
   * RF-25 + R1: reparto determinístico. Se ordena a los miembros de forma
   * estable (por id) para que el centavo residual caiga siempre en los mismos.
   */
  private buildShares(amount: string, memberIds: string[]): ShareData[] {
    const ordered = [...new Set(memberIds)].sort();
    const parts = splitEqually(amount, ordered.length);
    return ordered.map((uid, index) => ({
      userId: uid,
      amount: parts[index].toFixed(2),
    }));
  }

  /**
   * RF-35: por cada parte del gasto crea el egreso personal del miembro, enlazado
   * al share que lo originó (`sourceShareId`). El monto es la parte del miembro y
   * la moneda es la del grupo (RNF-17). Se ejecuta dentro de la transacción del
   * gasto para que todo sea atómico (R4).
   */
  private async syncPersonalMovements(
    tx: Prisma.TransactionClient,
    expense: ExpenseWithShares,
  ): Promise<void> {
    for (const share of expense.shares) {
      const categoryId = await this.ensureSharedCategory(tx, share.userId);
      await tx.movement.create({
        data: {
          userId: share.userId,
          type: 'EXPENSE',
          amount: share.amount.toString(),
          currencyCode: expense.currencyCode,
          date: expense.date,
          note: `Gasto compartido: ${expense.category}`,
          categoryId,
          sourceShareId: share.id,
        },
      });
    }
  }

  /** Categoría "Gastos compartidos" del usuario, creada on-demand si no existe. */
  private async ensureSharedCategory(
    tx: Prisma.TransactionClient,
    userId: string,
  ): Promise<string> {
    const category = await tx.category.upsert({
      where: { userId_name: { userId, name: SHARED_CATEGORY_NAME } },
      create: { userId, name: SHARED_CATEGORY_NAME, isDefault: false },
      update: {},
      select: { id: true },
    });
    return category.id;
  }

  private assertParticipantsAreMembers(
    payerId: string | undefined,
    memberIds: string[],
    groupMemberIds: string[],
  ): void {
    const members = new Set(groupMemberIds);
    if (payerId !== undefined && !members.has(payerId)) {
      throw new BadRequestException('El pagador no es miembro del grupo');
    }
    for (const uid of memberIds) {
      if (!members.has(uid)) {
        throw new BadRequestException(
          'Todos los participantes deben ser miembros del grupo',
        );
      }
    }
  }

  private async groupCurrency(groupId: string): Promise<string> {
    const group = await this.prisma.group.findUnique({
      where: { id: groupId },
      select: { currencyCode: true },
    });
    if (!group) {
      throw new NotFoundException('Grupo no encontrado');
    }
    return group.currencyCode;
  }

  private async groupMemberIds(groupId: string): Promise<string[]> {
    const members = await this.prisma.groupMember.findMany({
      where: { groupId },
      select: { userId: true },
    });
    return members.map((m) => m.userId);
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

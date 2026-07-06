import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Movement, Prisma } from '@prisma/client';
import { subtractMoney, toMoney } from '@app/shared';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMovementDto } from './dto/create-movement.dto';
import { UpdateMovementDto } from './dto/update-movement.dto';

/** RF-44: la lista de movimientos pagina de a 50 ítems. */
export const PAGE_SIZE = 50;

export interface PersonalBalance {
  balance: string; // string para preservar la exactitud decimal (RNF-11)
  currencyCode: string | null;
}

export interface MovementsPage {
  items: Movement[];
  total: number;
  page: number;
  pageSize: number;
}

/**
 * Movimientos personales del usuario (RF-08 a 13).
 * Todo acceso queda acotado al usuario dueño (RNF-06).
 */
@Injectable()
export class MovementsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, dto: CreateMovementDto): Promise<Movement> {
    await this.assertCategoryBelongsToUser(userId, dto.categoryId);
    // RNF-17: la moneda se toma de la moneda por defecto del usuario.
    const currencyCode = await this.userCurrency(userId);
    if (!currencyCode) {
      throw new NotFoundException('Usuario no encontrado');
    }

    return this.prisma.movement.create({
      data: {
        userId,
        type: dto.type,
        amount: dto.amount,
        currencyCode,
        date: new Date(dto.date),
        note: dto.note ?? null,
        categoryId: dto.categoryId,
      },
    });
  }

  async list(userId: string, page = 1): Promise<MovementsPage> {
    const current = page < 1 ? 1 : page;
    const [items, total] = await Promise.all([
      this.prisma.movement.findMany({
        where: { userId },
        orderBy: { date: 'desc' },
        skip: (current - 1) * PAGE_SIZE,
        take: PAGE_SIZE,
      }),
      this.prisma.movement.count({ where: { userId } }),
    ]);
    return { items, total, page: current, pageSize: PAGE_SIZE };
  }

  getOne(userId: string, id: string): Promise<Movement> {
    return this.ensureOwned(userId, id);
  }

  async update(
    userId: string,
    id: string,
    dto: UpdateMovementDto,
  ): Promise<Movement> {
    await this.ensureOwned(userId, id);
    if (dto.categoryId !== undefined) {
      await this.assertCategoryBelongsToUser(userId, dto.categoryId);
    }

    const data: Prisma.MovementUpdateInput = {};
    if (dto.type !== undefined) data.type = dto.type;
    if (dto.amount !== undefined) data.amount = dto.amount;
    if (dto.date !== undefined) data.date = new Date(dto.date);
    if (dto.note !== undefined) data.note = dto.note;
    if (dto.categoryId !== undefined) {
      data.category = { connect: { id: dto.categoryId } };
    }

    return this.prisma.movement.update({ where: { id }, data });
  }

  async remove(userId: string, id: string): Promise<void> {
    await this.ensureOwned(userId, id);
    await this.prisma.movement.delete({ where: { id } });
  }

  /** RF-13: saldo = suma de ingresos - suma de egresos, con decimal exacto. */
  async getBalance(userId: string): Promise<PersonalBalance> {
    const grouped = await this.prisma.movement.groupBy({
      by: ['type'],
      where: { userId },
      _sum: { amount: true },
    });

    let income = toMoney(0);
    let expense = toMoney(0);
    for (const row of grouped) {
      const sum = row._sum.amount ?? 0;
      if (row.type === 'INCOME') {
        income = toMoney(sum);
      } else {
        expense = toMoney(sum);
      }
    }

    const currencyCode = await this.userCurrency(userId);
    return {
      balance: subtractMoney(income, expense).toFixed(2),
      currencyCode,
    };
  }

  private async ensureOwned(userId: string, id: string): Promise<Movement> {
    const movement = await this.prisma.movement.findFirst({
      where: { id, userId },
    });
    if (!movement) {
      throw new NotFoundException('Movimiento no encontrado');
    }
    return movement;
  }

  private async assertCategoryBelongsToUser(
    userId: string,
    categoryId: string,
  ): Promise<void> {
    const category = await this.prisma.category.findFirst({
      where: { id: categoryId, userId },
    });
    if (!category) {
      throw new BadRequestException('Categoría inválida');
    }
  }

  private async userCurrency(userId: string): Promise<string | null> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { defaultCurrency: true },
    });
    return user?.defaultCurrency ?? null;
  }
}

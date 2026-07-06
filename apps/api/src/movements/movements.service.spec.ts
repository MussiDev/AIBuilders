import { describe, it, expect, beforeEach, vi } from 'vitest';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { MovementsService, PAGE_SIZE } from './movements.service';
import { PrismaService } from '../prisma/prisma.service';

function createPrismaMock() {
  return {
    user: { findUnique: vi.fn() },
    category: { findFirst: vi.fn() },
    movement: {
      create: vi.fn(),
      findMany: vi.fn(),
      findFirst: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
      groupBy: vi.fn(),
    },
  } as unknown as PrismaService & {
    user: Record<string, ReturnType<typeof vi.fn>>;
    category: Record<string, ReturnType<typeof vi.fn>>;
    movement: Record<string, ReturnType<typeof vi.fn>>;
  };
}

const USER = 'u1';

const createInput = {
  type: 'EXPENSE' as const,
  amount: '350.50',
  date: '2026-07-01',
  categoryId: 'cat1',
  note: 'Supermercado',
};

describe('MovementsService', () => {
  let prisma: ReturnType<typeof createPrismaMock>;
  let service: MovementsService;

  beforeEach(() => {
    prisma = createPrismaMock();
    service = new MovementsService(prisma);
  });

  describe('create', () => {
    // AC-09 / AC-10: registra el movimiento con sus datos.
    it('crea el movimiento tomando la moneda por defecto del usuario (RNF-17)', async () => {
      prisma.category.findFirst.mockResolvedValue({ id: 'cat1', userId: USER });
      prisma.user.findUnique.mockResolvedValue({ id: USER, defaultCurrency: 'ARS' });
      prisma.movement.create.mockImplementation(({ data }: any) =>
        Promise.resolve({ id: 'm1', ...data }),
      );

      const result = await service.create(USER, createInput);

      const data = prisma.movement.create.mock.calls[0][0].data;
      expect(data).toMatchObject({
        userId: USER,
        type: 'EXPENSE',
        amount: '350.50',
        currencyCode: 'ARS',
        categoryId: 'cat1',
        note: 'Supermercado',
      });
      expect(data.date).toBeInstanceOf(Date);
      expect(result.id).toBe('m1');
    });

    // RF-42 / RNF-06: la categoría debe existir y pertenecer al usuario.
    it('rechaza el alta si la categoría no pertenece al usuario', async () => {
      prisma.category.findFirst.mockResolvedValue(null);

      await expect(service.create(USER, createInput)).rejects.toBeInstanceOf(
        BadRequestException,
      );
      expect(prisma.movement.create).not.toHaveBeenCalled();
    });
  });

  describe('getBalance', () => {
    // RF-13 / AC-10: saldo = suma de ingresos - suma de egresos.
    it('calcula el saldo como ingresos menos egresos', async () => {
      prisma.movement.groupBy.mockResolvedValue([
        { type: 'INCOME', _sum: { amount: '1000.00' } },
        { type: 'EXPENSE', _sum: { amount: '350.50' } },
      ]);
      prisma.user.findUnique.mockResolvedValue({ defaultCurrency: 'ARS' });

      const result = await service.getBalance(USER);

      expect(result.balance).toBe('649.50');
      expect(result.currencyCode).toBe('ARS');
    });

    // RNF-11: exactitud decimal — un float daría 0.19999999999999998.
    it('mantiene exactitud decimal (sin errores de coma flotante)', async () => {
      prisma.movement.groupBy.mockResolvedValue([
        { type: 'INCOME', _sum: { amount: '0.30' } },
        { type: 'EXPENSE', _sum: { amount: '0.10' } },
      ]);
      prisma.user.findUnique.mockResolvedValue({ defaultCurrency: 'ARS' });

      const result = await service.getBalance(USER);

      expect(result.balance).toBe('0.20');
    });

    it('devuelve 0.00 cuando no hay movimientos', async () => {
      prisma.movement.groupBy.mockResolvedValue([]);
      prisma.user.findUnique.mockResolvedValue({ defaultCurrency: 'ARS' });

      const result = await service.getBalance(USER);

      expect(result.balance).toBe('0.00');
    });

    it('un saldo negativo se representa correctamente', async () => {
      prisma.movement.groupBy.mockResolvedValue([
        { type: 'EXPENSE', _sum: { amount: '500.00' } },
      ]);
      prisma.user.findUnique.mockResolvedValue({ defaultCurrency: 'ARS' });

      const result = await service.getBalance(USER);

      expect(result.balance).toBe('-500.00');
    });
  });

  describe('list', () => {
    // RF-44: máximo 50 ítems por página, acotado al usuario (RNF-06).
    it('pagina la lista del usuario (50 por página)', async () => {
      prisma.movement.findMany.mockResolvedValue([{ id: 'm1' }]);
      prisma.movement.count.mockResolvedValue(1);

      const result = await service.list(USER, 2);

      expect(prisma.movement.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId: USER },
          skip: PAGE_SIZE,
          take: PAGE_SIZE,
        }),
      );
      expect(result).toMatchObject({ page: 2, pageSize: PAGE_SIZE, total: 1 });
    });
  });

  describe('update', () => {
    it('actualiza un movimiento propio (AC-11)', async () => {
      prisma.movement.findFirst.mockResolvedValue({ id: 'm1', userId: USER });
      prisma.movement.update.mockResolvedValue({ id: 'm1', amount: '800.00' });

      const result = await service.update(USER, 'm1', { amount: '800.00' });

      expect(result.amount).toBe('800.00');
    });

    it('falla si el movimiento no es del usuario (RNF-06)', async () => {
      prisma.movement.findFirst.mockResolvedValue(null);

      await expect(
        service.update(USER, 'ajeno', { amount: '800.00' }),
      ).rejects.toBeInstanceOf(NotFoundException);
      expect(prisma.movement.update).not.toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('elimina un movimiento propio (AC-12)', async () => {
      prisma.movement.findFirst.mockResolvedValue({ id: 'm1', userId: USER });
      prisma.movement.delete.mockResolvedValue({ id: 'm1' });

      await service.remove(USER, 'm1');

      expect(prisma.movement.delete).toHaveBeenCalledWith({ where: { id: 'm1' } });
    });
  });
});

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { SharedExpensesService } from './shared-expenses.service';
import { PrismaService } from '../prisma/prisma.service';

function createPrismaMock() {
  const prisma = {
    group: { findUnique: vi.fn() },
    groupMember: { findUnique: vi.fn(), findMany: vi.fn() },
    sharedExpense: {
      create: vi.fn(),
      findUnique: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    expenseShare: { deleteMany: vi.fn(), createMany: vi.fn() },
    $transaction: vi.fn(),
  } as any;
  // Transacción interactiva: ejecuta el callback con el mismo mock.
  prisma.$transaction.mockImplementation((cb: any) => cb(prisma));
  return prisma as PrismaService & Record<string, any>;
}

const A = 'userA';
const B = 'userB';
const C = 'userC';
const GROUP = 'g1';

/** El grupo tiene 3 miembros y moneda ARS; el solicitante A es miembro. */
function setupGroup(prisma: any) {
  prisma.groupMember.findUnique.mockResolvedValue({ userId: A });
  prisma.group.findUnique.mockResolvedValue({ id: GROUP, currencyCode: 'ARS' });
  prisma.groupMember.findMany.mockResolvedValue([
    { userId: A },
    { userId: B },
    { userId: C },
  ]);
}

const baseInput = {
  amount: '1000.00',
  payerId: A,
  date: '2026-07-01',
  category: 'Comida',
  memberIds: [A, B, C],
};

describe('SharedExpensesService', () => {
  let prisma: any;
  let service: SharedExpensesService;

  beforeEach(() => {
    prisma = createPrismaMock();
    service = new SharedExpensesService(prisma);
  });

  describe('create', () => {
    // AC-22 / AC-23 / RF-28: divide en partes iguales y las partes suman el total.
    it('crea el gasto y reparte el total en partes iguales (centavo residual a los primeros)', async () => {
      setupGroup(prisma);
      prisma.sharedExpense.create.mockImplementation(({ data }: any) =>
        Promise.resolve({ id: 'e1', ...data }),
      );

      await service.create(A, GROUP, baseInput);

      const data = prisma.sharedExpense.create.mock.calls[0][0].data;
      expect(data).toMatchObject({
        groupId: GROUP,
        payerId: A,
        amount: '1000.00',
        currencyCode: 'ARS',
        category: 'Comida',
      });
      const shares = data.shares.create as { userId: string; amount: string }[];
      const byUser = Object.fromEntries(shares.map((s) => [s.userId, s.amount]));
      // 1000 / 3 = 333.34 + 333.33 + 333.33 (residuo al primero en orden estable).
      expect(byUser[A]).toBe('333.34');
      expect(byUser[B]).toBe('333.33');
      expect(byUser[C]).toBe('333.33');
      const sum = shares.reduce((acc, s) => acc + Number(s.amount), 0);
      expect(sum).toBeCloseTo(1000, 2); // RF-28
    });

    // AC-23: $1.000 entre 4 miembros → $250 cada uno.
    it('reparte en montos exactos cuando es divisible', async () => {
      prisma.groupMember.findUnique.mockResolvedValue({ userId: A });
      prisma.group.findUnique.mockResolvedValue({ currencyCode: 'ARS' });
      prisma.groupMember.findMany.mockResolvedValue([
        { userId: A },
        { userId: B },
        { userId: C },
        { userId: 'userD' },
      ]);
      prisma.sharedExpense.create.mockImplementation(({ data }: any) =>
        Promise.resolve({ id: 'e1', ...data }),
      );

      await service.create(A, GROUP, {
        ...baseInput,
        memberIds: [A, B, C, 'userD'],
      });

      const shares = prisma.sharedExpense.create.mock.calls[0][0].data.shares
        .create as { amount: string }[];
      expect(shares.map((s) => s.amount)).toEqual([
        '250.00',
        '250.00',
        '250.00',
        '250.00',
      ]);
    });

    it('rechaza si el pagador no es miembro del grupo', async () => {
      setupGroup(prisma);

      await expect(
        service.create(A, GROUP, { ...baseInput, payerId: 'ajeno' }),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(prisma.sharedExpense.create).not.toHaveBeenCalled();
    });

    it('rechaza si algún miembro seleccionado no pertenece al grupo', async () => {
      setupGroup(prisma);

      await expect(
        service.create(A, GROUP, { ...baseInput, memberIds: [A, 'ajeno'] }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    // RNF-06: quien no es miembro no puede registrar gastos.
    it('rechaza al solicitante que no es miembro (RNF-06)', async () => {
      prisma.groupMember.findUnique.mockResolvedValue(null);

      await expect(service.create('intruso', GROUP, baseInput)).rejects.toBeInstanceOf(
        ForbiddenException,
      );
    });
  });

  describe('update', () => {
    // AC-30: editar el monto recalcula las partes con el bloqueo optimista (R6).
    it('recalcula las partes al editar el monto (version coincide)', async () => {
      setupGroup(prisma);
      prisma.sharedExpense.findUnique.mockResolvedValue({
        id: 'e1',
        groupId: GROUP,
        amount: '1000.00',
        version: 0,
        shares: [{ userId: A }, { userId: B }],
      });
      prisma.sharedExpense.update.mockResolvedValue({ id: 'e1', version: 1 });

      await service.update(A, 'e1', { version: 0, amount: '1200.00' });

      expect(prisma.expenseShare.deleteMany).toHaveBeenCalled();
      const updateArg = prisma.sharedExpense.update.mock.calls[0][0];
      expect(updateArg.data.version).toEqual({ increment: 1 });
      expect(updateArg.data.amount).toBe('1200.00');
    });

    // R6: versión desactualizada → conflicto, no se pisa la edición ajena.
    it('rechaza la edición si la versión no coincide (bloqueo optimista)', async () => {
      setupGroup(prisma);
      prisma.sharedExpense.findUnique.mockResolvedValue({
        id: 'e1',
        groupId: GROUP,
        amount: '1000.00',
        version: 3,
        shares: [{ userId: A }],
      });

      await expect(
        service.update(A, 'e1', { version: 0, amount: '1200.00' }),
      ).rejects.toBeInstanceOf(ConflictException);
      expect(prisma.sharedExpense.update).not.toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    // AC-31: eliminar el gasto lo saca de la lista (las partes caen en cascada).
    it('elimina un gasto del grupo del que el solicitante es miembro', async () => {
      prisma.groupMember.findUnique.mockResolvedValue({ userId: A });
      prisma.sharedExpense.findUnique.mockResolvedValue({
        id: 'e1',
        groupId: GROUP,
      });
      prisma.sharedExpense.delete.mockResolvedValue({ id: 'e1' });

      await service.remove(A, 'e1');

      expect(prisma.sharedExpense.delete).toHaveBeenCalledWith({
        where: { id: 'e1' },
      });
    });
  });
});

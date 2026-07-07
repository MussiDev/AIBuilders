import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ForbiddenException } from '@nestjs/common';
import { BalanceService } from './balance.service';
import { PrismaService } from '../prisma/prisma.service';

function createPrismaMock() {
  return {
    group: { findUnique: vi.fn() },
    groupMember: { findUnique: vi.fn() },
    settlement: { create: vi.fn() },
  } as unknown as PrismaService & {
    group: Record<string, ReturnType<typeof vi.fn>>;
    groupMember: Record<string, ReturnType<typeof vi.fn>>;
    settlement: Record<string, ReturnType<typeof vi.fn>>;
  };
}

const A = 'userA';
const B = 'userB';
const GROUP = 'g1';

/** Deja al usuario A como miembro del grupo (RNF-06). */
function memberOk(prisma: ReturnType<typeof createPrismaMock>) {
  prisma.groupMember.findUnique.mockResolvedValue({ id: 'm', userId: A });
}

describe('BalanceService', () => {
  let prisma: ReturnType<typeof createPrismaMock>;
  let service: BalanceService;

  beforeEach(() => {
    prisma = createPrismaMock();
    service = new BalanceService(prisma);
  });

  describe('getNetBalances', () => {
    // AC-27: A pagó $1.000 dividido en partes iguales entre A y B → B debe $500 a A.
    it('calcula el balance neto por miembro (paga - le corresponde)', async () => {
      memberOk(prisma);
      prisma.group.findUnique.mockResolvedValue({
        currencyCode: 'ARS',
        members: [{ userId: A }, { userId: B }],
        expenses: [
          {
            amount: '1000.00',
            payerId: A,
            shares: [
              { userId: A, amount: '500.00' },
              { userId: B, amount: '500.00' },
            ],
          },
        ],
        settlements: [],
      });

      const result = await service.getNetBalances(A, GROUP);

      expect(result.currencyCode).toBe('ARS');
      const byUser = Object.fromEntries(
        result.balances.map((b) => [b.userId, b.balance]),
      );
      expect(byUser[A]).toBe('500.00'); // le deben 500
      expect(byUser[B]).toBe('-500.00'); // debe 500
    });

    // AC-29: registrado el pago de $500 de B a A, el balance queda en $0.
    it('un settlement salda el balance entre dos miembros', async () => {
      memberOk(prisma);
      prisma.group.findUnique.mockResolvedValue({
        currencyCode: 'ARS',
        members: [{ userId: A }, { userId: B }],
        expenses: [
          {
            amount: '1000.00',
            payerId: A,
            shares: [
              { userId: A, amount: '500.00' },
              { userId: B, amount: '500.00' },
            ],
          },
        ],
        settlements: [{ fromUserId: B, toUserId: A, amount: '500.00' }],
      });

      const result = await service.getNetBalances(A, GROUP);
      const byUser = Object.fromEntries(
        result.balances.map((b) => [b.userId, b.balance]),
      );
      expect(byUser[A]).toBe('0.00');
      expect(byUser[B]).toBe('0.00');
    });

    it('un miembro sin movimientos tiene balance 0.00', async () => {
      memberOk(prisma);
      prisma.group.findUnique.mockResolvedValue({
        currencyCode: 'ARS',
        members: [{ userId: A }, { userId: B }],
        expenses: [],
        settlements: [],
      });

      const result = await service.getNetBalances(A, GROUP);
      expect(result.balances.every((b) => b.balance === '0.00')).toBe(true);
    });

    // RNF-06: un no-miembro no puede ver el balance del grupo.
    it('rechaza a quien no es miembro del grupo (RNF-06)', async () => {
      prisma.groupMember.findUnique.mockResolvedValue(null);

      await expect(service.getNetBalances('intruso', GROUP)).rejects.toBeInstanceOf(
        ForbiddenException,
      );
      expect(prisma.group.findUnique).not.toHaveBeenCalled();
    });
  });

  describe('createSettlement', () => {
    it('registra un pago entre dos miembros con la moneda del grupo', async () => {
      prisma.groupMember.findUnique
        .mockResolvedValueOnce({ userId: A }) // solicitante es miembro
        .mockResolvedValueOnce({ userId: B }) // from es miembro
        .mockResolvedValueOnce({ userId: A }); // to es miembro
      prisma.group.findUnique.mockResolvedValue({ currencyCode: 'ARS' });
      prisma.settlement.create.mockImplementation(({ data }: any) =>
        Promise.resolve({ id: 's1', ...data }),
      );

      const result = await service.createSettlement(A, GROUP, {
        fromUserId: B,
        toUserId: A,
        amount: '500.00',
      });

      expect(result.id).toBe('s1');
      const data = prisma.settlement.create.mock.calls[0][0].data;
      expect(data).toMatchObject({
        groupId: GROUP,
        fromUserId: B,
        toUserId: A,
        amount: '500.00',
        currencyCode: 'ARS',
      });
    });

    it('rechaza un pago de un miembro hacia sí mismo', async () => {
      prisma.groupMember.findUnique.mockResolvedValue({ userId: A });
      prisma.group.findUnique.mockResolvedValue({ currencyCode: 'ARS' });

      await expect(
        service.createSettlement(A, GROUP, {
          fromUserId: A,
          toUserId: A,
          amount: '500.00',
        }),
      ).rejects.toBeTruthy();
      expect(prisma.settlement.create).not.toHaveBeenCalled();
    });
  });
});

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  GoneException,
} from '@nestjs/common';
import { GroupsService } from './groups.service';
import { BalanceService } from './balance.service';
import { PrismaService } from '../prisma/prisma.service';

function createPrismaMock() {
  const prisma = {
    group: { create: vi.fn(), findUnique: vi.fn(), findMany: vi.fn() },
    groupMember: {
      create: vi.fn(),
      findUnique: vi.fn(),
      delete: vi.fn(),
    },
    invitation: { create: vi.fn(), findUnique: vi.fn(), update: vi.fn() },
    $transaction: vi.fn(),
  } as any;
  prisma.$transaction.mockImplementation((cb: any) => cb(prisma));
  return prisma as PrismaService & Record<string, any>;
}

const A = 'userA';
const GROUP = 'g1';

describe('GroupsService', () => {
  let prisma: any;
  let balance: { getMemberBalance: ReturnType<typeof vi.fn> };
  let service: GroupsService;

  beforeEach(() => {
    prisma = createPrismaMock();
    balance = { getMemberBalance: vi.fn() };
    service = new GroupsService(prisma, balance as unknown as BalanceService);
  });

  describe('create', () => {
    // AC-20: el creador figura como miembro del grupo recién creado.
    it('crea el grupo con el creador como primer miembro', async () => {
      prisma.group.create.mockImplementation(({ data }: any) =>
        Promise.resolve({ id: GROUP, ...data }),
      );

      await service.create(A, { name: 'Viaje', currencyCode: 'ARS' });

      const data = prisma.group.create.mock.calls[0][0].data;
      expect(data).toMatchObject({ name: 'Viaje', currencyCode: 'ARS' });
      expect(data.members.create).toMatchObject({ userId: A });
    });
  });

  describe('createInvitation', () => {
    // RF-22: un miembro genera un enlace con token y expiración.
    it('genera una invitación con token y fecha de expiración futura', async () => {
      prisma.groupMember.findUnique.mockResolvedValue({ userId: A });
      prisma.invitation.create.mockImplementation(({ data }: any) =>
        Promise.resolve({ id: 'inv1', ...data }),
      );

      await service.createInvitation(A, GROUP);

      const data = prisma.invitation.create.mock.calls[0][0].data;
      expect(typeof data.token).toBe('string');
      expect(data.token.length).toBeGreaterThan(10);
      expect(data.groupId).toBe(GROUP);
      expect(data.expiresAt.getTime()).toBeGreaterThan(Date.now());
    });

    it('rechaza a quien no es miembro del grupo (RNF-06)', async () => {
      prisma.groupMember.findUnique.mockResolvedValue(null);
      await expect(service.createInvitation('intruso', GROUP)).rejects.toBeInstanceOf(
        ForbiddenException,
      );
    });
  });

  describe('acceptInvitation', () => {
    // AC-21: con enlace válido, el usuario queda agregado como miembro.
    it('agrega al usuario y consume la invitación (un solo uso)', async () => {
      prisma.invitation.findUnique.mockResolvedValue({
        id: 'inv1',
        groupId: GROUP,
        expiresAt: new Date(Date.now() + 60_000),
        acceptedAt: null,
      });
      prisma.groupMember.findUnique.mockResolvedValue(null); // aún no es miembro
      prisma.groupMember.create.mockResolvedValue({ id: 'm', userId: 'nuevo' });

      await service.acceptInvitation('nuevo', 'tok');

      expect(prisma.groupMember.create).toHaveBeenCalled();
      const updateArg = prisma.invitation.update.mock.calls[0][0];
      expect(updateArg.where).toEqual({ id: 'inv1' });
      expect(updateArg.data.acceptedAt).toBeInstanceOf(Date);
    });

    // RF-48 / AC-46: invitación expirada.
    it('rechaza una invitación expirada (RF-48)', async () => {
      prisma.invitation.findUnique.mockResolvedValue({
        id: 'inv1',
        groupId: GROUP,
        expiresAt: new Date(Date.now() - 1000),
        acceptedAt: null,
      });

      await expect(service.acceptInvitation('nuevo', 'tok')).rejects.toBeInstanceOf(
        GoneException,
      );
      expect(prisma.groupMember.create).not.toHaveBeenCalled();
    });

    // Un solo uso: una invitación ya aceptada no se puede reutilizar.
    it('rechaza una invitación ya usada', async () => {
      prisma.invitation.findUnique.mockResolvedValue({
        id: 'inv1',
        groupId: GROUP,
        expiresAt: new Date(Date.now() + 60_000),
        acceptedAt: new Date(),
      });

      await expect(service.acceptInvitation('nuevo', 'tok')).rejects.toBeInstanceOf(
        GoneException,
      );
    });

    it('rechaza a un usuario que ya es miembro', async () => {
      prisma.invitation.findUnique.mockResolvedValue({
        id: 'inv1',
        groupId: GROUP,
        expiresAt: new Date(Date.now() + 60_000),
        acceptedAt: null,
      });
      prisma.groupMember.findUnique.mockResolvedValue({ userId: 'nuevo' });

      await expect(service.acceptInvitation('nuevo', 'tok')).rejects.toBeInstanceOf(
        ConflictException,
      );
    });
  });

  describe('leave', () => {
    // AC-32: con balance en $0 el usuario puede salir del grupo.
    it('permite salir cuando el balance es cero', async () => {
      prisma.groupMember.findUnique.mockResolvedValue({ id: 'm', userId: A });
      balance.getMemberBalance.mockResolvedValue('0.00');

      await service.leave(A, GROUP);

      expect(prisma.groupMember.delete).toHaveBeenCalledWith({
        where: { groupId_userId: { groupId: GROUP, userId: A } },
      });
    });

    it('impide salir con saldo pendiente', async () => {
      prisma.groupMember.findUnique.mockResolvedValue({ id: 'm', userId: A });
      balance.getMemberBalance.mockResolvedValue('-500.00');

      await expect(service.leave(A, GROUP)).rejects.toBeInstanceOf(
        BadRequestException,
      );
      expect(prisma.groupMember.delete).not.toHaveBeenCalled();
    });
  });
});

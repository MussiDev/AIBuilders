import { randomBytes } from 'crypto';
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  GoneException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Group, GroupMember } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { BalanceService } from './balance.service';
import { CreateGroupDto } from './dto/create-group.dto';

/** Vigencia de un enlace de invitación (RF-48): 7 días. */
const INVITATION_TTL_MS = 7 * 24 * 60 * 60 * 1000;

/**
 * Grupos de gastos compartidos, membresías e invitaciones (RF-21 a 23, 34).
 * Toda operación sobre un grupo queda acotada a sus miembros (RNF-06).
 */
@Injectable()
export class GroupsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly balance: BalanceService,
  ) {}

  /** RF-21: crea el grupo; el creador queda como primer miembro (AC-20). */
  create(userId: string, dto: CreateGroupDto): Promise<Group> {
    return this.prisma.group.create({
      data: {
        name: dto.name,
        currencyCode: dto.currencyCode, // RNF-17: moneda única del grupo
        members: { create: { userId } },
      },
      include: { members: true },
    });
  }

  /** Grupos de los que el usuario es miembro (RNF-06). */
  listForUser(userId: string): Promise<Group[]> {
    return this.prisma.group.findMany({
      where: { members: { some: { userId } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getOne(userId: string, groupId: string): Promise<Group> {
    await this.assertMember(userId, groupId);
    const group = await this.prisma.group.findUnique({
      where: { id: groupId },
      include: { members: true },
    });
    if (!group) {
      throw new NotFoundException('Grupo no encontrado');
    }
    return group;
  }

  /** RF-22: un miembro genera un enlace de invitación de un solo uso. */
  async createInvitation(userId: string, groupId: string) {
    await this.assertMember(userId, groupId);
    return this.prisma.invitation.create({
      data: {
        groupId,
        token: randomBytes(24).toString('hex'),
        expiresAt: new Date(Date.now() + INVITATION_TTL_MS),
      },
    });
  }

  /**
   * RF-23: un usuario se une a un grupo con un enlace válido (AC-21).
   * RF-48: se rechaza si está expirada o ya fue usada (un solo uso).
   */
  async acceptInvitation(userId: string, token: string): Promise<GroupMember> {
    const invitation = await this.prisma.invitation.findUnique({
      where: { token },
    });
    if (!invitation) {
      throw new NotFoundException('Invitación inválida');
    }
    if (invitation.acceptedAt) {
      throw new GoneException('La invitación ya fue utilizada');
    }
    if (invitation.expiresAt.getTime() < Date.now()) {
      throw new GoneException('La invitación expiró');
    }

    const already = await this.prisma.groupMember.findUnique({
      where: { groupId_userId: { groupId: invitation.groupId, userId } },
    });
    if (already) {
      throw new ConflictException('Ya sos miembro de este grupo');
    }

    // Alta del miembro y consumo de la invitación, de forma atómica.
    return this.prisma.$transaction(async (tx) => {
      const member = await tx.groupMember.create({
        data: { groupId: invitation.groupId, userId },
      });
      await tx.invitation.update({
        where: { id: invitation.id },
        data: { acceptedAt: new Date() },
      });
      return member;
    });
  }

  /** RF-34: salir del grupo, sólo con el balance saldado (AC-32). */
  async leave(userId: string, groupId: string): Promise<void> {
    await this.assertMember(userId, groupId);

    const memberBalance = await this.balance.getMemberBalance(userId, groupId);
    if (memberBalance !== '0.00') {
      throw new BadRequestException(
        'Saldá tu balance en el grupo antes de salir',
      );
    }

    await this.prisma.groupMember.delete({
      where: { groupId_userId: { groupId, userId } },
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

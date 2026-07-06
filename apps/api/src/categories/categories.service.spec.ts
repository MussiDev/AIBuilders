import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { CategoriesService } from './categories.service';
import { PrismaService } from '../prisma/prisma.service';

function createPrismaMock() {
  return {
    category: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    movement: {
      count: vi.fn(),
    },
  } as unknown as PrismaService & {
    category: Record<string, ReturnType<typeof vi.fn>>;
    movement: Record<string, ReturnType<typeof vi.fn>>;
  };
}

const USER = 'u1';

describe('CategoriesService', () => {
  let prisma: ReturnType<typeof createPrismaMock>;
  let service: CategoriesService;

  beforeEach(() => {
    prisma = createPrismaMock();
    service = new CategoriesService(prisma);
  });

  describe('list', () => {
    // RNF-06: solo devuelve categorías del propio usuario.
    it('lista únicamente las categorías del usuario', async () => {
      prisma.category.findMany.mockResolvedValue([{ id: 'c1', name: 'Salud' }]);

      const result = await service.list(USER);

      expect(prisma.category.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { userId: USER } }),
      );
      expect(result).toHaveLength(1);
    });
  });

  describe('create', () => {
    // AC-14: una categoría nueva queda disponible.
    it('crea la categoría asociada al usuario', async () => {
      prisma.category.findFirst.mockResolvedValue(null);
      prisma.category.create.mockImplementation(({ data }: any) =>
        Promise.resolve({ id: 'c1', ...data }),
      );

      const result = await service.create(USER, { name: 'Mascotas' });

      expect(prisma.category.create).toHaveBeenCalledWith({
        data: { userId: USER, name: 'Mascotas' },
      });
      expect(result.name).toBe('Mascotas');
    });

    // @@unique([userId, name]): no se admiten nombres repetidos por usuario.
    it('rechaza un nombre ya existente para el usuario', async () => {
      prisma.category.findFirst.mockResolvedValue({ id: 'c1', name: 'Salud' });

      await expect(service.create(USER, { name: 'Salud' })).rejects.toBeInstanceOf(
        ConflictException,
      );
      expect(prisma.category.create).not.toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('renombra una categoría propia', async () => {
      prisma.category.findFirst
        .mockResolvedValueOnce({ id: 'c1', userId: USER, name: 'Salud' }) // ownership
        .mockResolvedValueOnce(null); // no hay choque de nombre
      prisma.category.update.mockResolvedValue({ id: 'c1', name: 'Bienestar' });

      const result = await service.update(USER, 'c1', { name: 'Bienestar' });

      expect(result.name).toBe('Bienestar');
    });

    // RNF-06: no puede tocar una categoría que no le pertenece.
    it('falla si la categoría no es del usuario', async () => {
      prisma.category.findFirst.mockResolvedValue(null);

      await expect(
        service.update(USER, 'ajena', { name: 'X' }),
      ).rejects.toBeInstanceOf(NotFoundException);
      expect(prisma.category.update).not.toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('elimina una categoría propia sin movimientos', async () => {
      prisma.category.findFirst.mockResolvedValue({ id: 'c1', userId: USER });
      prisma.movement.count.mockResolvedValue(0);
      prisma.category.delete.mockResolvedValue({ id: 'c1' });

      await service.remove(USER, 'c1');

      expect(prisma.category.delete).toHaveBeenCalledWith({ where: { id: 'c1' } });
    });

    // RF-45: error legible en vez de un fallo de integridad de la DB.
    it('rechaza eliminar una categoría con movimientos asociados', async () => {
      prisma.category.findFirst.mockResolvedValue({ id: 'c1', userId: USER });
      prisma.movement.count.mockResolvedValue(3);

      await expect(service.remove(USER, 'c1')).rejects.toBeInstanceOf(
        ConflictException,
      );
      expect(prisma.category.delete).not.toHaveBeenCalled();
    });
  });
});

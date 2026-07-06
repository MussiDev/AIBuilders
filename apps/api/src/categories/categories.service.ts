import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Category } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

/**
 * Gestión de categorías de movimientos (RF-14).
 * Toda operación queda acotada al usuario dueño (RNF-06).
 */
@Injectable()
export class CategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  list(userId: string): Promise<Category[]> {
    return this.prisma.category.findMany({
      where: { userId },
      orderBy: { name: 'asc' },
    });
  }

  async create(userId: string, dto: CreateCategoryDto): Promise<Category> {
    await this.ensureNameAvailable(userId, dto.name);
    return this.prisma.category.create({
      data: { userId, name: dto.name },
    });
  }

  async update(
    userId: string,
    id: string,
    dto: UpdateCategoryDto,
  ): Promise<Category> {
    await this.ensureOwned(userId, id);
    await this.ensureNameAvailable(userId, dto.name, id);
    return this.prisma.category.update({
      where: { id },
      data: { name: dto.name },
    });
  }

  async remove(userId: string, id: string): Promise<void> {
    await this.ensureOwned(userId, id);
    // RF-45: en vez de dejar reventar la restricción de integridad de la DB,
    // devolvemos un mensaje legible cuando la categoría está en uso.
    const inUse = await this.prisma.movement.count({ where: { categoryId: id } });
    if (inUse > 0) {
      throw new ConflictException(
        'No se puede eliminar una categoría con movimientos asociados',
      );
    }
    await this.prisma.category.delete({ where: { id } });
  }

  private async ensureOwned(userId: string, id: string): Promise<Category> {
    const category = await this.prisma.category.findFirst({
      where: { id, userId },
    });
    if (!category) {
      throw new NotFoundException('Categoría no encontrada');
    }
    return category;
  }

  /** @@unique([userId, name]): un usuario no repite nombres de categoría. */
  private async ensureNameAvailable(
    userId: string,
    name: string,
    exceptId?: string,
  ): Promise<void> {
    const clash = await this.prisma.category.findFirst({
      where: { userId, name },
    });
    if (clash && clash.id !== exceptId) {
      throw new ConflictException('Ya existe una categoría con ese nombre');
    }
  }
}

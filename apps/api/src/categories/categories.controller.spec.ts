import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CategoriesController } from './categories.controller';
import { CategoriesService } from './categories.service';

const USER = 'u1';

describe('CategoriesController', () => {
  let service: Record<string, ReturnType<typeof vi.fn>>;
  let controller: CategoriesController;

  beforeEach(() => {
    service = {
      list: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      remove: vi.fn(),
    };
    controller = new CategoriesController(
      service as unknown as CategoriesService,
    );
  });

  it('delega el listado con el usuario de la sesión (RNF-06)', async () => {
    service.list.mockResolvedValue([{ id: 'c1' }]);

    await controller.list(USER);

    expect(service.list).toHaveBeenCalledWith(USER);
  });

  it('delega la creación (RF-14)', async () => {
    const dto = { name: 'Mascotas' };
    service.create.mockResolvedValue({ id: 'c1', ...dto });

    const result = await controller.create(USER, dto);

    expect(service.create).toHaveBeenCalledWith(USER, dto);
    expect(result).toEqual({ id: 'c1', name: 'Mascotas' });
  });

  it('delega la edición', async () => {
    await controller.update(USER, 'c1', { name: 'X' });
    expect(service.update).toHaveBeenCalledWith(USER, 'c1', { name: 'X' });
  });

  it('delega la eliminación', async () => {
    await controller.remove(USER, 'c1');
    expect(service.remove).toHaveBeenCalledWith(USER, 'c1');
  });
});

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { MovementsController } from './movements.controller';
import { MovementsService } from './movements.service';

const USER = 'u1';

describe('MovementsController', () => {
  let service: Record<string, ReturnType<typeof vi.fn>>;
  let controller: MovementsController;

  beforeEach(() => {
    service = {
      create: vi.fn(),
      list: vi.fn(),
      getOne: vi.fn(),
      update: vi.fn(),
      remove: vi.fn(),
      getBalance: vi.fn(),
    };
    controller = new MovementsController(
      service as unknown as MovementsService,
    );
  });

  it('delega el alta con el usuario de la sesión (RNF-06)', async () => {
    const dto = {
      type: 'INCOME' as const,
      amount: '100.00',
      date: '2026-07-01',
      categoryId: 'c1',
    };
    await controller.create(USER, dto);
    expect(service.create).toHaveBeenCalledWith(USER, dto);
  });

  it('delega el listado con la página solicitada (RF-44)', async () => {
    await controller.list(USER, { page: 2 });
    expect(service.list).toHaveBeenCalledWith(USER, 2);
  });

  it('delega el saldo (RF-13)', async () => {
    await controller.balance(USER);
    expect(service.getBalance).toHaveBeenCalledWith(USER);
  });

  it('delega el detalle', async () => {
    await controller.getOne(USER, 'm1');
    expect(service.getOne).toHaveBeenCalledWith(USER, 'm1');
  });

  it('delega la edición', async () => {
    await controller.update(USER, 'm1', { amount: '800.00' });
    expect(service.update).toHaveBeenCalledWith(USER, 'm1', { amount: '800.00' });
  });

  it('delega la eliminación', async () => {
    await controller.remove(USER, 'm1');
    expect(service.remove).toHaveBeenCalledWith(USER, 'm1');
  });
});

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  GroupsController,
  InvitationsController,
} from './groups.controller';
import { SharedExpensesController } from './shared-expenses.controller';
import { GroupsService } from './groups.service';
import { BalanceService } from './balance.service';
import { SharedExpensesService } from './shared-expenses.service';

const USER = 'u1';

describe('GroupsController', () => {
  let groups: Record<string, ReturnType<typeof vi.fn>>;
  let balance: Record<string, ReturnType<typeof vi.fn>>;
  let controller: GroupsController;

  beforeEach(() => {
    groups = {
      create: vi.fn(),
      listForUser: vi.fn(),
      getOne: vi.fn(),
      createInvitation: vi.fn(),
      leave: vi.fn(),
    };
    balance = { getNetBalances: vi.fn(), createSettlement: vi.fn() };
    controller = new GroupsController(
      groups as unknown as GroupsService,
      balance as unknown as BalanceService,
    );
  });

  it('delega el alta de grupo con el usuario de la sesión (RNF-06)', async () => {
    const dto = { name: 'Viaje', currencyCode: 'ARS' };
    await controller.create(USER, dto);
    expect(groups.create).toHaveBeenCalledWith(USER, dto);
  });

  it('delega el balance del grupo (RF-29)', async () => {
    await controller.getBalance(USER, 'g1');
    expect(balance.getNetBalances).toHaveBeenCalledWith(USER, 'g1');
  });

  it('delega el registro de pago (RF-31)', async () => {
    const dto = { fromUserId: 'b', toUserId: 'a', amount: '500.00' };
    await controller.settle(USER, 'g1', dto);
    expect(balance.createSettlement).toHaveBeenCalledWith(USER, 'g1', dto);
  });

  it('delega la salida del grupo (RF-34)', async () => {
    await controller.leave(USER, 'g1');
    expect(groups.leave).toHaveBeenCalledWith(USER, 'g1');
  });
});

describe('InvitationsController', () => {
  it('delega la aceptación por token (RF-23)', async () => {
    const groups = { acceptInvitation: vi.fn() };
    const controller = new InvitationsController(
      groups as unknown as GroupsService,
    );
    await controller.accept(USER, 'tok');
    expect(groups.acceptInvitation).toHaveBeenCalledWith(USER, 'tok');
  });
});

describe('SharedExpensesController', () => {
  let service: Record<string, ReturnType<typeof vi.fn>>;
  let controller: SharedExpensesController;

  beforeEach(() => {
    service = {
      create: vi.fn(),
      list: vi.fn(),
      getOne: vi.fn(),
      update: vi.fn(),
      remove: vi.fn(),
    };
    controller = new SharedExpensesController(
      service as unknown as SharedExpensesService,
    );
  });

  it('delega el alta de gasto en el grupo (RF-24)', async () => {
    const dto = {
      amount: '1000.00',
      payerId: 'a',
      date: '2026-07-01',
      category: 'Comida',
      memberIds: ['a', 'b'],
    };
    await controller.create(USER, 'g1', dto);
    expect(service.create).toHaveBeenCalledWith(USER, 'g1', dto);
  });

  it('delega la edición del gasto (RF-32)', async () => {
    await controller.update(USER, 'e1', { version: 0, amount: '1200.00' });
    expect(service.update).toHaveBeenCalledWith(USER, 'e1', {
      version: 0,
      amount: '1200.00',
    });
  });

  it('delega la eliminación del gasto (RF-33)', async () => {
    await controller.remove(USER, 'e1');
    expect(service.remove).toHaveBeenCalledWith(USER, 'e1');
  });
});

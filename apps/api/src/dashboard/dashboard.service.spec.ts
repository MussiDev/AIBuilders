import { describe, it, expect, beforeEach, vi } from 'vitest';
import { DashboardService } from './dashboard.service';
import { MovementsService } from '../movements/movements.service';
import { GroupsService } from '../groups/groups.service';
import { BalanceService } from '../groups/balance.service';

const USER = 'u1';

describe('DashboardService', () => {
  let movements: { getBalance: ReturnType<typeof vi.fn> };
  let groups: { listForUser: ReturnType<typeof vi.fn> };
  let balance: { getMemberBalance: ReturnType<typeof vi.fn> };
  let service: DashboardService;

  beforeEach(() => {
    movements = { getBalance: vi.fn() };
    groups = { listForUser: vi.fn() };
    balance = { getMemberBalance: vi.fn() };
    service = new DashboardService(
      movements as unknown as MovementsService,
      groups as unknown as GroupsService,
      balance as unknown as BalanceService,
    );
  });

  // AC-36: el panel muestra saldo personal + total adeudado/por cobrar en grupos.
  it('compone el saldo personal con los totales adeudado/por cobrar', async () => {
    movements.getBalance.mockResolvedValue({ balance: '1000.00', currencyCode: 'ARS' });
    groups.listForUser.mockResolvedValue([{ id: 'g1' }, { id: 'g2' }]);
    balance.getMemberBalance
      .mockResolvedValueOnce('500.00') // en g1 le deben 500 → por cobrar
      .mockResolvedValueOnce('-200.00'); // en g2 debe 200 → adeudado

    const summary = await service.getSummary(USER);

    expect(summary.personal).toEqual({ balance: '1000.00', currencyCode: 'ARS' });
    expect(summary.groups.totalToCollect).toBe('500.00');
    expect(summary.groups.totalOwed).toBe('200.00');
  });

  it('suma correctamente varios grupos del mismo signo', async () => {
    movements.getBalance.mockResolvedValue({ balance: '0.00', currencyCode: 'ARS' });
    groups.listForUser.mockResolvedValue([{ id: 'g1' }, { id: 'g2' }, { id: 'g3' }]);
    balance.getMemberBalance
      .mockResolvedValueOnce('333.34')
      .mockResolvedValueOnce('333.33')
      .mockResolvedValueOnce('-666.67');

    const summary = await service.getSummary(USER);

    expect(summary.groups.totalToCollect).toBe('666.67');
    expect(summary.groups.totalOwed).toBe('666.67');
  });

  it('sin grupos, los totales son 0.00', async () => {
    movements.getBalance.mockResolvedValue({ balance: '750.00', currencyCode: 'ARS' });
    groups.listForUser.mockResolvedValue([]);

    const summary = await service.getSummary(USER);

    expect(summary.groups.totalToCollect).toBe('0.00');
    expect(summary.groups.totalOwed).toBe('0.00');
    expect(balance.getMemberBalance).not.toHaveBeenCalled();
  });
});

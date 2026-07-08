import { Injectable } from '@nestjs/common';
import { addMoney, toMoney } from '@app/shared';
import {
  MovementsService,
  PersonalBalance,
} from '../movements/movements.service';
import { GroupsService } from '../groups/groups.service';
import { BalanceService } from '../groups/balance.service';

export interface DashboardSummary {
  personal: PersonalBalance;
  groups: {
    // Suma de los balances netos favorables (te deben) y desfavorables (debés).
    totalToCollect: string;
    totalOwed: string;
  };
}

/**
 * Panel inicial (RF-38 / AC-36): compone el saldo personal (RF-13) con el total
 * adeudado/por cobrar sumando el balance neto del usuario en cada uno de sus grupos.
 * Nota (RNF-17): en el MVP no hay conversión de moneda; los totales agregan los
 * balances tal cual, igual que el saldo personal.
 */
@Injectable()
export class DashboardService {
  constructor(
    private readonly movements: MovementsService,
    private readonly groups: GroupsService,
    private readonly balance: BalanceService,
  ) {}

  async getSummary(userId: string): Promise<DashboardSummary> {
    const personal = await this.movements.getBalance(userId);
    const groups = await this.groups.listForUser(userId);

    let toCollect = toMoney(0);
    let owed = toMoney(0);
    for (const group of groups) {
      const net = toMoney(await this.balance.getMemberBalance(userId, group.id));
      if (net.greaterThan(0)) {
        toCollect = addMoney(toCollect, net);
      } else if (net.lessThan(0)) {
        owed = addMoney(owed, net.negated());
      }
    }

    return {
      personal,
      groups: {
        totalToCollect: toCollect.toFixed(2),
        totalOwed: owed.toFixed(2),
      },
    };
  }
}

'use client';

import { useActionState, useEffect, useRef, useState } from 'react';
import {
  createInvitationAction,
  createSettlementAction,
  deleteExpenseAction,
  leaveGroupAction,
} from '@/app/groups/actions';
import { DeleteButton } from '@/components/delete-button';
import { ExpenseForm } from '@/components/expense-form';
import { FieldError } from '@/components/field-error';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { formatMoney } from '@/lib/format';
import type {
  GroupBalances,
  GroupDetail,
  SharedExpense,
} from '@/lib/api.server';

interface Props {
  group: GroupDetail;
  expenses: SharedExpense[];
  balances: GroupBalances;
  today: string;
}

export function GroupDetailPanel({ group, expenses, balances, today }: Props) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const email = new Map(group.members.map((m) => [m.userId, m.user.email]));
  const label = (userId: string) => email.get(userId) ?? userId;

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Balances (RF-29)</CardTitle>
          <CardDescription>
            Positivo: le deben. Negativo: debe.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="flex flex-col divide-y">
            {balances.balances.map((b) => {
              const n = Number(b.balance);
              return (
                <li
                  key={b.userId}
                  className="flex items-center justify-between gap-2 py-2"
                >
                  <span className="text-sm">{label(b.userId)}</span>
                  <span
                    className={
                      n > 0
                        ? 'font-medium text-emerald-600 dark:text-emerald-400'
                        : n < 0
                          ? 'font-medium text-destructive'
                          : 'font-medium text-muted-foreground'
                    }
                  >
                    {formatMoney(b.balance, balances.currencyCode)}
                  </span>
                </li>
              );
            })}
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Miembros e invitaciones</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <ul className="flex flex-col divide-y">
            {group.members.map((m) => (
              <li key={m.userId} className="py-2 text-sm">
                {m.user.email}
              </li>
            ))}
          </ul>
          <InviteButton groupId={group.id} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Nuevo gasto compartido</CardTitle>
          <CardDescription>Se divide en partes iguales (RF-25).</CardDescription>
        </CardHeader>
        <CardContent>
          <ExpenseForm
            groupId={group.id}
            members={group.members}
            currencyCode={group.currencyCode}
            today={today}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Gastos</CardTitle>
        </CardHeader>
        <CardContent>
          {expenses.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Todavía no hay gastos en este grupo.
            </p>
          ) : (
            <ul className="flex flex-col divide-y">
              {expenses.map((e) =>
                editingId === e.id ? (
                  <li key={e.id} className="py-4">
                    <ExpenseForm
                      mode="edit"
                      expense={e}
                      groupId={group.id}
                      members={group.members}
                      currencyCode={group.currencyCode}
                      today={today}
                      onSuccess={() => setEditingId(null)}
                      onCancel={() => setEditingId(null)}
                    />
                  </li>
                ) : (
                  <li
                    key={e.id}
                    className="flex flex-wrap items-center justify-between gap-2 py-3"
                  >
                    <div className="min-w-0">
                      <p className="font-medium">
                        {formatMoney(e.amount, e.currencyCode)}{' '}
                        <span className="text-sm text-muted-foreground">
                          {e.category}
                        </span>
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {e.date.slice(0, 10)} · pagó {label(e.payerId)} · entre{' '}
                        {e.shares.length}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setEditingId(e.id)}
                      >
                        Editar
                      </Button>
                      <DeleteButton
                        action={deleteExpenseAction}
                        hidden={{ id: e.id, groupId: group.id }}
                        confirmMessage="¿Eliminar este gasto? También se borrarán los egresos personales asociados."
                      />
                    </div>
                  </li>
                ),
              )}
            </ul>
          )}
        </CardContent>
      </Card>

      <SettlementForm group={group} />

      <Card>
        <CardHeader>
          <CardTitle>Salir del grupo</CardTitle>
          <CardDescription>
            Solo posible con tu balance saldado (RF-34).
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DeleteButton
            action={leaveGroupAction}
            hidden={{ groupId: group.id }}
            confirmMessage="¿Salir de este grupo?"
            label="Salir del grupo"
            pendingLabel="Saliendo…"
          />
        </CardContent>
      </Card>
    </div>
  );
}

/** RF-22: genera un enlace de invitación de un solo uso y lo muestra para copiar. */
function InviteButton({ groupId }: { groupId: string }) {
  const [state, formAction, pending] = useActionState(createInvitationAction, {});

  return (
    <div className="flex flex-col gap-2">
      <form action={formAction}>
        <input type="hidden" name="groupId" value={groupId} />
        <Button type="submit" variant="outline" size="sm" disabled={pending}>
          {pending ? 'Generando…' : 'Generar enlace de invitación'}
        </Button>
      </form>
      {state.invitationUrl && (
        <Input readOnly value={state.invitationUrl} onFocus={(e) => e.target.select()} />
      )}
      {state.message && (
        <p className="text-sm text-destructive" role="alert">
          {state.message}
        </p>
      )}
    </div>
  );
}

/** RF-31: registra un pago de saldo entre dos miembros. */
function SettlementForm({ group }: { group: GroupDetail }) {
  const [state, formAction, pending] = useActionState(createSettlementAction, {});
  const formRef = useRef<HTMLFormElement>(null);
  const [amount, setAmount] = useState('');

  useEffect(() => {
    if (state.ok) {
      formRef.current?.reset();
      setAmount('');
    }
  }, [state.ok]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Registrar pago (RF-31)</CardTitle>
      </CardHeader>
      <CardContent>
        <form ref={formRef} action={formAction} noValidate className="flex flex-col gap-3">
          <input type="hidden" name="groupId" value={group.id} />
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="fromUserId">Pagó</Label>
              <Select
                id="fromUserId"
                name="fromUserId"
                defaultValue={state.values?.fromUserId ?? ''}
                aria-invalid={!!state.fieldErrors?.fromUserId}
              >
                <option value="" disabled>
                  Elegí
                </option>
                {group.members.map((m) => (
                  <option key={m.userId} value={m.userId}>
                    {m.user.email}
                  </option>
                ))}
              </Select>
              <FieldError messages={state.fieldErrors?.fromUserId} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="toUserId">Recibió</Label>
              <Select
                id="toUserId"
                name="toUserId"
                defaultValue={state.values?.toUserId ?? ''}
                aria-invalid={!!state.fieldErrors?.toUserId}
              >
                <option value="" disabled>
                  Elegí
                </option>
                {group.members.map((m) => (
                  <option key={m.userId} value={m.userId}>
                    {m.user.email}
                  </option>
                ))}
              </Select>
              <FieldError messages={state.fieldErrors?.toUserId} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="settle-amount">Monto ({group.currencyCode})</Label>
              <Input
                id="settle-amount"
                name="amount"
                inputMode="decimal"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                aria-invalid={!!state.fieldErrors?.amount}
              />
              <FieldError messages={state.fieldErrors?.amount} />
            </div>
          </div>
          {state.message && (
            <p className="text-sm text-destructive" role="alert">
              {state.message}
            </p>
          )}
          <Button type="submit" disabled={pending}>
            {pending ? 'Registrando…' : 'Registrar pago'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

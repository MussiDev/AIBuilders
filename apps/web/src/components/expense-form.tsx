'use client';

import { useActionState, useEffect, useRef, useState } from 'react';
import {
  createExpenseAction,
  updateExpenseAction,
} from '@/app/groups/actions';
import { FieldError } from '@/components/field-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import type { GroupMember, SharedExpense } from '@/lib/api.server';

interface Props {
  groupId: string;
  members: GroupMember[];
  currencyCode: string;
  today: string;
  mode?: 'create' | 'edit';
  expense?: SharedExpense;
  onSuccess?: () => void;
  onCancel?: () => void;
}

/** Alta (RF-24/25) o edición (RF-32) de un gasto compartido en partes iguales. */
export function ExpenseForm({
  groupId,
  members,
  currencyCode,
  today,
  mode = 'create',
  expense,
  onSuccess,
  onCancel,
}: Props) {
  const action = mode === 'create' ? createExpenseAction : updateExpenseAction;
  const [state, formAction, pending] = useActionState(action, {});
  const formRef = useRef<HTMLFormElement>(null);
  const [amount, setAmount] = useState(expense?.amount ?? '');
  const [date, setDate] = useState(expense?.date.slice(0, 10) ?? today);
  const [category, setCategory] = useState(expense?.category ?? '');

  useEffect(() => {
    if (state.ok) {
      if (mode === 'create') {
        formRef.current?.reset();
        setAmount('');
        setDate(today);
        setCategory('');
      }
      onSuccess?.();
    }
  }, [state.ok, mode, onSuccess, today]);

  const suffix = expense?.id ?? 'new';
  const includedByDefault = new Set(
    mode === 'edit'
      ? expense!.shares.map((s) => s.userId)
      : members.map((m) => m.userId),
  );

  return (
    <form ref={formRef} action={formAction} noValidate className="flex flex-col gap-3">
      <input type="hidden" name="groupId" value={groupId} />
      {mode === 'edit' && (
        <>
          <input type="hidden" name="id" value={expense!.id} />
          <input type="hidden" name="version" value={expense!.version} />
        </>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor={`amount-${suffix}`}>Monto ({currencyCode})</Label>
          <Input
            id={`amount-${suffix}`}
            name="amount"
            inputMode="decimal"
            placeholder="0.00"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            aria-invalid={!!state.fieldErrors?.amount}
          />
          <FieldError messages={state.fieldErrors?.amount} />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor={`payerId-${suffix}`}>Pagó</Label>
          <Select
            id={`payerId-${suffix}`}
            name="payerId"
            defaultValue={state.values?.payerId ?? expense?.payerId ?? ''}
            aria-invalid={!!state.fieldErrors?.payerId}
          >
            <option value="" disabled>
              Elegí quién pagó
            </option>
            {members.map((m) => (
              <option key={m.userId} value={m.userId}>
                {m.user.email}
              </option>
            ))}
          </Select>
          <FieldError messages={state.fieldErrors?.payerId} />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor={`date-${suffix}`}>Fecha</Label>
          <Input
            id={`date-${suffix}`}
            name="date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            aria-invalid={!!state.fieldErrors?.date}
          />
          <FieldError messages={state.fieldErrors?.date} />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor={`category-${suffix}`}>Categoría</Label>
          <Input
            id={`category-${suffix}`}
            name="category"
            placeholder="Comida"
            maxLength={60}
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            aria-invalid={!!state.fieldErrors?.category}
          />
          <FieldError messages={state.fieldErrors?.category} />
        </div>
      </div>

      <fieldset className="flex flex-col gap-2">
        <legend className="text-sm font-medium">Dividir entre</legend>
        <div className="flex flex-wrap gap-3">
          {members.map((m) => (
            <label key={m.userId} className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                name="memberIds"
                value={m.userId}
                defaultChecked={includedByDefault.has(m.userId)}
                className="size-4"
              />
              {m.user.email}
            </label>
          ))}
        </div>
        <FieldError messages={state.fieldErrors?.memberIds} />
      </fieldset>

      {state.message && (
        <p className="text-sm text-destructive" role="alert">
          {state.message}
        </p>
      )}

      <div className="flex gap-2">
        <Button type="submit" disabled={pending}>
          {pending
            ? 'Guardando…'
            : mode === 'create'
              ? 'Agregar gasto'
              : 'Guardar cambios'}
        </Button>
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
        )}
      </div>
    </form>
  );
}

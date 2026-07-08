'use client';

import { useActionState, useEffect, useRef, useState } from 'react';
import {
  createMovementAction,
  updateMovementAction,
} from '@/app/movements/actions';
import { FieldError } from '@/components/field-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import type { Category, Movement } from '@/lib/api.server';
import type { FormState } from '@/lib/validation';

interface Props {
  categories: Category[];
  today: string;
  mode?: 'create' | 'edit';
  movement?: Movement;
  onSuccess?: () => void;
  onCancel?: () => void;
}

/** Alta (RF-08/09) o edición (RF-10) de un movimiento personal. */
export function MovementForm({
  categories,
  today,
  mode = 'create',
  movement,
  onSuccess,
  onCancel,
}: Props) {
  const action = mode === 'create' ? createMovementAction : updateMovementAction;
  const [state, formAction, pending] = useActionState<FormState, FormData>(
    action,
    {},
  );
  const formRef = useRef<HTMLFormElement>(null);
  const [amount, setAmount] = useState(movement?.amount ?? '');
  const [date, setDate] = useState(movement?.date.slice(0, 10) ?? today);

  useEffect(() => {
    if (state.ok) {
      if (mode === 'create') {
        formRef.current?.reset();
        setAmount('');
        setDate(today);
      }
      onSuccess?.();
    }
  }, [state.ok, mode, onSuccess, today]);

  const v = state.values;

  return (
    <form ref={formRef} action={formAction} noValidate className="flex flex-col gap-3">
      {mode === 'edit' && <input type="hidden" name="id" value={movement!.id} />}

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor={`type-${movement?.id ?? 'new'}`}>Tipo</Label>
          <Select
            id={`type-${movement?.id ?? 'new'}`}
            name="type"
            defaultValue={v?.type ?? movement?.type ?? 'EXPENSE'}
            aria-invalid={!!state.fieldErrors?.type}
          >
            <option value="EXPENSE">Egreso</option>
            <option value="INCOME">Ingreso</option>
          </Select>
          <FieldError messages={state.fieldErrors?.type} />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor={`amount-${movement?.id ?? 'new'}`}>Monto</Label>
          <Input
            id={`amount-${movement?.id ?? 'new'}`}
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
          <Label htmlFor={`date-${movement?.id ?? 'new'}`}>Fecha</Label>
          <Input
            id={`date-${movement?.id ?? 'new'}`}
            name="date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            aria-invalid={!!state.fieldErrors?.date}
          />
          <FieldError messages={state.fieldErrors?.date} />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor={`categoryId-${movement?.id ?? 'new'}`}>Categoría</Label>
          <Select
            id={`categoryId-${movement?.id ?? 'new'}`}
            name="categoryId"
            defaultValue={v?.categoryId ?? movement?.categoryId ?? ''}
            aria-invalid={!!state.fieldErrors?.categoryId}
          >
            <option value="" disabled>
              Elegí una categoría
            </option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
          <FieldError messages={state.fieldErrors?.categoryId} />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor={`note-${movement?.id ?? 'new'}`}>Nota (opcional)</Label>
        <Textarea
          id={`note-${movement?.id ?? 'new'}`}
          name="note"
          maxLength={280}
          defaultValue={v?.note ?? movement?.note ?? ''}
          aria-invalid={!!state.fieldErrors?.note}
        />
        <FieldError messages={state.fieldErrors?.note} />
      </div>

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
              ? 'Agregar movimiento'
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

'use client';

import { useActionState, useState } from 'react';
import { createGroupAction } from '@/app/groups/actions';
import { FieldError } from '@/components/field-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

/** RF-21: crea un grupo con su moneda única (RNF-17). */
export function CreateGroupForm({ defaultCurrency }: { defaultCurrency?: string }) {
  const [state, formAction, pending] = useActionState(createGroupAction, {});
  const [name, setName] = useState('');
  const [currencyCode, setCurrencyCode] = useState(defaultCurrency ?? '');

  return (
    <form action={formAction} noValidate className="flex flex-col gap-3">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="name">Nombre del grupo</Label>
        <Input
          id="name"
          name="name"
          placeholder="Viaje a la costa"
          value={name}
          onChange={(e) => setName(e.target.value)}
          aria-invalid={!!state.fieldErrors?.name}
        />
        <FieldError messages={state.fieldErrors?.name} />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="currencyCode">Moneda (ISO 4217)</Label>
        <Input
          id="currencyCode"
          name="currencyCode"
          maxLength={3}
          placeholder="ARS"
          value={currencyCode}
          onChange={(e) => setCurrencyCode(e.target.value)}
          aria-invalid={!!state.fieldErrors?.currencyCode}
        />
        <FieldError messages={state.fieldErrors?.currencyCode} />
      </div>
      {state.message && (
        <p className="text-sm text-destructive" role="alert">
          {state.message}
        </p>
      )}
      <Button type="submit" disabled={pending}>
        {pending ? 'Creando…' : 'Crear grupo'}
      </Button>
    </form>
  );
}

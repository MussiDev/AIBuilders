'use client';

import { useActionState } from 'react';
import { Button } from '@/components/ui/button';
import type { FormState } from '@/lib/validation';

type Action = (prev: FormState, formData: FormData) => Promise<FormState>;

interface Props {
  action: Action;
  /** Campos ocultos que la action necesita (id, groupId, …). */
  hidden: Record<string, string>;
  /** Mensaje de confirmación previo al borrado (RF-46). */
  confirmMessage: string;
  label?: string;
  pendingLabel?: string;
}

/** Botón de borrado con confirmación explícita (RF-46) y estado de envío. */
export function DeleteButton({
  action,
  hidden,
  confirmMessage,
  label = 'Eliminar',
  pendingLabel = 'Eliminando…',
}: Props) {
  const [state, formAction, pending] = useActionState(action, {});

  return (
    <form
      action={formAction}
      onSubmit={(e) => {
        if (!window.confirm(confirmMessage)) e.preventDefault();
      }}
    >
      {Object.entries(hidden).map(([name, value]) => (
        <input key={name} type="hidden" name={name} value={value} />
      ))}
      <Button type="submit" variant="outline" size="sm" disabled={pending}>
        {pending ? pendingLabel : label}
      </Button>
      {state.message && (
        <p className="mt-1 text-sm text-destructive" role="alert">
          {state.message}
        </p>
      )}
    </form>
  );
}

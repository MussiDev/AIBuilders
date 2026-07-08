'use client';

import { useActionState } from 'react';
import { acceptInvitationAction } from '@/app/groups/actions';
import { Button } from '@/components/ui/button';

/** RF-23: el usuario autenticado acepta la invitación con su token. */
export function AcceptInvitation({ token }: { token: string }) {
  const [state, formAction, pending] = useActionState(acceptInvitationAction, {});

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <input type="hidden" name="token" value={token} />
      <Button type="submit" disabled={pending}>
        {pending ? 'Uniéndote…' : 'Unirme al grupo'}
      </Button>
      {state.message && (
        <p className="text-sm text-destructive" role="alert">
          {state.message}
        </p>
      )}
    </form>
  );
}

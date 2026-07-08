'use client';

import { useTransition } from 'react';
import { logoutAction } from '@/app/auth-actions';
import { Button } from '@/components/ui/button';

export function LogoutButton() {
  const [pending, startTransition] = useTransition();

  return (
    <Button
      variant="outline"
      size="sm"
      disabled={pending}
      onClick={() => startTransition(() => logoutAction())}
    >
      {pending ? 'Saliendo…' : 'Cerrar sesión'}
    </Button>
  );
}

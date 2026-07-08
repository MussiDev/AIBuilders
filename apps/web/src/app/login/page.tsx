'use client';

import { useActionState } from 'react';
import Link from 'next/link';
import { loginAction } from '@/app/auth-actions';
import { FieldError } from '@/components/field-error';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { FormState } from '@/lib/validation';

const initialState: FormState = {};

export default function LoginPage() {
  const [state, formAction, pending] = useActionState(loginAction, initialState);

  return (
    <main className="flex min-h-svh items-center justify-center p-6">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Iniciar sesión</CardTitle>
          <CardDescription>Ingresá con tu email y contraseña.</CardDescription>
        </CardHeader>
        <form action={formAction} noValidate>
          <CardContent className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                defaultValue={state.values?.email}
                autoComplete="email"
                aria-invalid={!!state.fieldErrors?.email}
              />
              <FieldError messages={state.fieldErrors?.email} />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="password">Contraseña</Label>
              <Input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                aria-invalid={!!state.fieldErrors?.password}
              />
              <FieldError messages={state.fieldErrors?.password} />
            </div>
            {state.message && (
              <p className="text-sm text-destructive" role="alert">
                {state.message}
              </p>
            )}
          </CardContent>
          <CardFooter className="mt-6 flex flex-col gap-3">
            <Button type="submit" className="w-full" disabled={pending}>
              {pending ? 'Ingresando…' : 'Ingresar'}
            </Button>
            <p className="text-sm text-muted-foreground">
              ¿No tenés cuenta?{' '}
              <Link href="/register" className="underline">
                Registrate
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </main>
  );
}

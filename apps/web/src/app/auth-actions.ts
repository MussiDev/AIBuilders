'use server';

import { redirect } from 'next/navigation';
import { authenticate } from '@/lib/api.server';
import { clearSession } from '@/lib/session';
import {
  FormState,
  loginSchema,
  registerSchema,
  zodFieldErrors,
} from '@/lib/validation';

export async function loginAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const email = String(formData.get('email') ?? '');
  const parsed = loginSchema.safeParse({
    email,
    password: String(formData.get('password') ?? ''),
  });
  if (!parsed.success) {
    return { fieldErrors: zodFieldErrors(parsed.error), values: { email } };
  }

  const result = await authenticate('/auth/login', parsed.data);
  if (!result.ok) {
    return { message: result.message, values: { email } };
  }

  redirect('/');
}

export async function registerAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const email = String(formData.get('email') ?? '');
  const defaultCurrency = String(formData.get('defaultCurrency') ?? '');
  const parsed = registerSchema.safeParse({
    email,
    password: String(formData.get('password') ?? ''),
    defaultCurrency,
  });
  if (!parsed.success) {
    return {
      fieldErrors: zodFieldErrors(parsed.error),
      values: { email, defaultCurrency },
    };
  }

  const result = await authenticate('/auth/register', parsed.data);
  if (!result.ok) {
    return { message: result.message, values: { email, defaultCurrency } };
  }

  redirect('/');
}

export async function logoutAction(): Promise<void> {
  await clearSession();
  redirect('/login');
}

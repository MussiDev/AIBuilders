'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { headers } from 'next/headers';
import {
  acceptInvitation,
  createExpense,
  createGroup,
  createInvitation,
  createSettlement,
  deleteExpense,
  leaveGroup,
  updateExpense,
  UnauthorizedError,
} from '@/lib/api.server';
import {
  expenseSchema,
  FormState,
  groupSchema,
  settlementSchema,
  zodFieldErrors,
} from '@/lib/validation';

function toFormState(error: unknown, values?: Record<string, string>): FormState {
  if (error instanceof UnauthorizedError) {
    redirect('/login');
  }
  return { message: (error as Error).message, values };
}

export async function createGroupAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const values = {
    name: String(formData.get('name') ?? ''),
    currencyCode: String(formData.get('currencyCode') ?? ''),
  };
  const parsed = groupSchema.safeParse(values);
  if (!parsed.success) {
    return { fieldErrors: zodFieldErrors(parsed.error), values };
  }
  let group: { id: string };
  try {
    group = await createGroup(parsed.data);
  } catch (error) {
    return toFormState(error, values);
  }
  revalidatePath('/groups');
  redirect(`/groups/${group.id}`);
}

/** RF-22: genera un enlace de invitación de un solo uso y lo devuelve para copiar. */
export async function createInvitationAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const groupId = String(formData.get('groupId') ?? '');
  try {
    const { token } = await createInvitation(groupId);
    const h = await headers();
    const host = h.get('host') ?? 'localhost:3000';
    const proto = h.get('x-forwarded-proto') ?? 'http';
    return { ok: true, invitationUrl: `${proto}://${host}/invitations/${token}` };
  } catch (error) {
    return toFormState(error);
  }
}

export async function acceptInvitationAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const token = String(formData.get('token') ?? '');
  let result: { groupId: string };
  try {
    result = await acceptInvitation(token);
  } catch (error) {
    return toFormState(error);
  }
  redirect(`/groups/${result.groupId}`);
}

export async function createExpenseAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const groupId = String(formData.get('groupId') ?? '');
  const values = {
    amount: String(formData.get('amount') ?? ''),
    payerId: String(formData.get('payerId') ?? ''),
    date: String(formData.get('date') ?? ''),
    category: String(formData.get('category') ?? ''),
  };
  const memberIds = formData.getAll('memberIds').map(String);
  const parsed = expenseSchema.safeParse({ ...values, memberIds });
  if (!parsed.success) {
    return { fieldErrors: zodFieldErrors(parsed.error), values };
  }
  try {
    await createExpense(groupId, parsed.data);
  } catch (error) {
    return toFormState(error, values);
  }
  revalidatePath(`/groups/${groupId}`);
  return { ok: true };
}

export async function updateExpenseAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const id = String(formData.get('id') ?? '');
  const groupId = String(formData.get('groupId') ?? '');
  const version = Number(formData.get('version') ?? '0');
  const values = {
    amount: String(formData.get('amount') ?? ''),
    payerId: String(formData.get('payerId') ?? ''),
    date: String(formData.get('date') ?? ''),
    category: String(formData.get('category') ?? ''),
  };
  const memberIds = formData.getAll('memberIds').map(String);
  const parsed = expenseSchema.safeParse({ ...values, memberIds });
  if (!parsed.success) {
    return { fieldErrors: zodFieldErrors(parsed.error), values };
  }
  try {
    // RF-32 / R6: se envía la versión para el bloqueo optimista del backend.
    await updateExpense(id, { ...parsed.data, version });
  } catch (error) {
    return toFormState(error, values);
  }
  revalidatePath(`/groups/${groupId}`);
  return { ok: true };
}

export async function deleteExpenseAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const id = String(formData.get('id') ?? '');
  const groupId = String(formData.get('groupId') ?? '');
  try {
    await deleteExpense(id);
  } catch (error) {
    return toFormState(error);
  }
  revalidatePath(`/groups/${groupId}`);
  return { ok: true };
}

export async function createSettlementAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const groupId = String(formData.get('groupId') ?? '');
  const values = {
    fromUserId: String(formData.get('fromUserId') ?? ''),
    toUserId: String(formData.get('toUserId') ?? ''),
    amount: String(formData.get('amount') ?? ''),
  };
  const parsed = settlementSchema.safeParse(values);
  if (!parsed.success) {
    return { fieldErrors: zodFieldErrors(parsed.error), values };
  }
  try {
    await createSettlement(groupId, parsed.data);
  } catch (error) {
    return toFormState(error, values);
  }
  revalidatePath(`/groups/${groupId}`);
  return { ok: true };
}

export async function leaveGroupAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const groupId = String(formData.get('groupId') ?? '');
  try {
    await leaveGroup(groupId);
  } catch (error) {
    return toFormState(error);
  }
  revalidatePath('/groups');
  redirect('/groups');
}

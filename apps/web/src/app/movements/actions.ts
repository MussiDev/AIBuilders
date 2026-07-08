'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import {
  createCategory,
  createMovement,
  deleteCategory,
  deleteMovement,
  updateCategory,
  updateMovement,
  UnauthorizedError,
} from '@/lib/api.server';
import {
  categorySchema,
  FormState,
  movementSchema,
  zodFieldErrors,
} from '@/lib/validation';

// Mapea un error de la capa BFF a FormState. UnauthorizedError corta con redirect
// a /login (RNF-06); el resto se muestra como error general legible (RF-45).
function toFormState(error: unknown, values?: Record<string, string>): FormState {
  if (error instanceof UnauthorizedError) {
    redirect('/login');
  }
  return { message: (error as Error).message, values };
}

export async function createMovementAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const values = {
    type: String(formData.get('type') ?? ''),
    amount: String(formData.get('amount') ?? ''),
    date: String(formData.get('date') ?? ''),
    categoryId: String(formData.get('categoryId') ?? ''),
    note: String(formData.get('note') ?? ''),
  };
  const parsed = movementSchema.safeParse(values);
  if (!parsed.success) {
    return { fieldErrors: zodFieldErrors(parsed.error), values };
  }

  try {
    await createMovement({
      ...parsed.data,
      note: parsed.data.note || undefined,
    });
  } catch (error) {
    return toFormState(error, values);
  }

  revalidatePath('/movements');
  return { ok: true };
}

export async function updateMovementAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const id = String(formData.get('id') ?? '');
  const values = {
    type: String(formData.get('type') ?? ''),
    amount: String(formData.get('amount') ?? ''),
    date: String(formData.get('date') ?? ''),
    categoryId: String(formData.get('categoryId') ?? ''),
    note: String(formData.get('note') ?? ''),
  };
  const parsed = movementSchema.safeParse(values);
  if (!parsed.success) {
    return { fieldErrors: zodFieldErrors(parsed.error), values };
  }

  try {
    await updateMovement(id, {
      ...parsed.data,
      note: parsed.data.note || undefined,
    });
  } catch (error) {
    return toFormState(error, values);
  }

  revalidatePath('/movements');
  return { ok: true };
}

export async function deleteMovementAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const id = String(formData.get('id') ?? '');
  try {
    await deleteMovement(id);
  } catch (error) {
    return toFormState(error);
  }
  revalidatePath('/movements');
  return { ok: true };
}

export async function createCategoryAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const name = String(formData.get('name') ?? '');
  const parsed = categorySchema.safeParse({ name });
  if (!parsed.success) {
    return { fieldErrors: zodFieldErrors(parsed.error), values: { name } };
  }
  try {
    await createCategory(parsed.data);
  } catch (error) {
    return toFormState(error, { name });
  }
  revalidatePath('/movements');
  return { ok: true };
}

export async function updateCategoryAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const id = String(formData.get('id') ?? '');
  const name = String(formData.get('name') ?? '');
  const parsed = categorySchema.safeParse({ name });
  if (!parsed.success) {
    return { fieldErrors: zodFieldErrors(parsed.error), values: { name } };
  }
  try {
    await updateCategory(id, parsed.data);
  } catch (error) {
    return toFormState(error, { name });
  }
  revalidatePath('/movements');
  return { ok: true };
}

export async function deleteCategoryAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const id = String(formData.get('id') ?? '');
  try {
    await deleteCategory(id);
  } catch (error) {
    return toFormState(error);
  }
  revalidatePath('/movements');
  return { ok: true };
}

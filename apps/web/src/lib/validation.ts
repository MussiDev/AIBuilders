import { z, ZodError } from 'zod';

// Esquemas de validación compartidos por los server actions. Reflejan las reglas
// del backend (RF-02 email válido, RF-42 obligatorios, RF-07 moneda ISO 4217).

export const loginSchema = z.object({
  email: z.string().trim().min(1, 'El email es obligatorio').email('Email inválido'),
  // En login no se revela el mínimo de longitud: solo que no esté vacío.
  password: z.string().min(1, 'La contraseña es obligatoria'),
});

export const registerSchema = z.object({
  email: z.string().trim().min(1, 'El email es obligatorio').email('Email inválido'),
  password: z
    .string()
    .min(8, 'La contraseña debe tener al menos 8 caracteres'),
  defaultCurrency: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^[A-Z]{3}$/, 'Usá un código de moneda ISO 4217 (ej. ARS, USD)'),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;

// Monto: string decimal exacto (RNF-11), > 0 (RF-41), hasta 2 decimales (RF-43).
const moneySchema = z
  .string()
  .trim()
  .regex(/^\d+(\.\d{1,2})?$/, 'Monto inválido (hasta 2 decimales, ej. 1500.50)')
  .refine((v) => Number(v) > 0, 'El monto debe ser mayor a 0');

// Fecha del formulario (<input type="date"> → yyyy-mm-dd), obligatoria (RF-42).
const dateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'La fecha es obligatoria');

const currencySchema = z
  .string()
  .trim()
  .toUpperCase()
  .regex(/^[A-Z]{3}$/, 'Usá un código de moneda ISO 4217 (ej. ARS, USD)');

export const movementSchema = z.object({
  type: z.enum(['INCOME', 'EXPENSE'], { message: 'Elegí un tipo válido' }),
  amount: moneySchema,
  date: dateSchema,
  categoryId: z.string().min(1, 'La categoría es obligatoria'),
  note: z.string().trim().max(280, 'La nota admite hasta 280 caracteres').optional(),
});

export const categorySchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'El nombre es obligatorio')
    .max(50, 'El nombre admite hasta 50 caracteres'),
});

export const groupSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'El nombre del grupo es obligatorio')
    .max(120, 'El nombre admite hasta 120 caracteres'),
  currencyCode: currencySchema,
});

export const expenseSchema = z.object({
  amount: moneySchema,
  payerId: z.string().min(1, 'El pagador es obligatorio'),
  date: dateSchema,
  category: z
    .string()
    .trim()
    .min(1, 'La categoría es obligatoria')
    .max(60, 'La categoría admite hasta 60 caracteres'),
  memberIds: z.array(z.string().min(1)).min(1, 'Elegí al menos un miembro'),
});

export const settlementSchema = z
  .object({
    fromUserId: z.string().min(1, 'El pagador es obligatorio'),
    toUserId: z.string().min(1, 'El receptor es obligatorio'),
    amount: moneySchema,
  })
  .refine((v) => v.fromUserId !== v.toUserId, {
    message: 'El pago debe ser entre dos miembros distintos',
    path: ['toUserId'],
  });

/** Estado de un formulario manejado con useActionState. */
export interface FormState {
  ok?: boolean;
  /** Error general del formulario (credenciales, red, servidor). */
  message?: string;
  /** Errores por campo, para mostrar debajo de cada input. */
  fieldErrors?: Record<string, string[]>;
  /** Valores a repoblar tras un error (nunca la contraseña). */
  values?: Record<string, string>;
  /** Enlace de invitación generado (RF-22), para mostrarlo tras crearlo. */
  invitationUrl?: string;
}

/** Convierte los issues de Zod en un mapa campo → mensajes. */
export function zodFieldErrors(error: ZodError): Record<string, string[]> {
  const out: Record<string, string[]> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? '_form');
    (out[key] ??= []).push(issue.message);
  }
  return out;
}

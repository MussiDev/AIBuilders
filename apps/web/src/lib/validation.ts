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

/** Estado de un formulario manejado con useActionState. */
export interface FormState {
  ok?: boolean;
  /** Error general del formulario (credenciales, red, servidor). */
  message?: string;
  /** Errores por campo, para mostrar debajo de cada input. */
  fieldErrors?: Record<string, string[]>;
  /** Valores a repoblar tras un error (nunca la contraseña). */
  values?: { email?: string; defaultCurrency?: string };
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

import { getSessionToken, setSessionToken, SESSION_COOKIE } from './session';

// Cliente de la API que corre SOLO en el server de Next (BFF). Reenvía la cookie
// de sesión a la API y captura el Set-Cookie del login/registro.
const API_URL = process.env.API_URL ?? 'http://localhost:3001';

export interface SafeUser {
  id: string;
  email: string;
  defaultCurrency: string;
}

export interface DashboardSummary {
  personal: { balance: string; currencyCode: string | null };
  groups: { totalToCollect: string; totalOwed: string };
}

export type AuthResult =
  | { ok: true; user: SafeUser }
  | { ok: false; message: string };

/** Error de sesión: el llamador (server component) debe redirigir a /login. */
export class UnauthorizedError extends Error {}

/** Login/registro: valida en la API y, si sale bien, persiste la cookie en :3000. */
export async function authenticate(
  path: '/auth/login' | '/auth/register',
  body: Record<string, unknown>,
): Promise<AuthResult> {
  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      cache: 'no-store',
    });
  } catch {
    return { ok: false, message: 'No se pudo conectar con el servidor' };
  }

  if (!res.ok) {
    return { ok: false, message: await extractMessage(res) };
  }

  const token = extractSessionToken(res);
  if (!token) {
    return { ok: false, message: 'La API no devolvió una sesión válida' };
  }
  await setSessionToken(token);
  return { ok: true, user: (await res.json()) as SafeUser };
}

/** GET autenticado que reenvía la cookie de sesión a la API. */
async function authedGet<T>(path: string): Promise<T> {
  const token = await getSessionToken();
  if (!token) {
    throw new UnauthorizedError();
  }
  const res = await fetch(`${API_URL}${path}`, {
    headers: { Cookie: `${SESSION_COOKIE}=${token}` },
    cache: 'no-store',
  });
  if (res.status === 401) {
    throw new UnauthorizedError();
  }
  if (!res.ok) {
    throw new Error(await extractMessage(res));
  }
  return (await res.json()) as T;
}

export function getDashboard(): Promise<DashboardSummary> {
  return authedGet<DashboardSummary>('/dashboard');
}

export function getMe(): Promise<{ id: string; email: string }> {
  return authedGet<{ id: string; email: string }>('/auth/me');
}

/** Extrae el valor del token del header Set-Cookie que emite la API. */
function extractSessionToken(res: Response): string | null {
  const setCookies = res.headers.getSetCookie?.() ?? [];
  for (const cookie of setCookies) {
    if (cookie.startsWith(`${SESSION_COOKIE}=`)) {
      return cookie.slice(SESSION_COOKIE.length + 1).split(';')[0] || null;
    }
  }
  return null;
}

/** Extrae un mensaje legible del cuerpo de error de NestJS (RF-45). */
async function extractMessage(res: Response): Promise<string> {
  try {
    const body = (await res.json()) as { message?: string | string[] };
    if (Array.isArray(body.message)) return body.message.join('. ');
    if (body.message) return body.message;
  } catch {
    // sin cuerpo JSON
  }
  return 'Ocurrió un error inesperado';
}

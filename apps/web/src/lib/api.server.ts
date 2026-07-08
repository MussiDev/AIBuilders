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

// --- Tipos de dominio, tal como los serializa la API (Decimal → string). ---

export type MovementType = 'INCOME' | 'EXPENSE';

export interface Movement {
  id: string;
  type: MovementType;
  amount: string; // decimal exacto como string (RNF-11)
  currencyCode: string;
  date: string; // ISO 8601
  note: string | null;
  categoryId: string;
  sourceShareId: string | null; // != null ⇒ autogenerado por un gasto compartido
}

export interface MovementsPage {
  items: Movement[];
  total: number;
  page: number;
  pageSize: number;
}

export interface Category {
  id: string;
  name: string;
  isDefault: boolean;
}

export interface PersonalBalance {
  balance: string;
  currencyCode: string | null;
}

export interface Group {
  id: string;
  name: string;
  currencyCode: string;
}

export interface GroupMember {
  userId: string;
  user: { id: string; email: string };
}

export interface GroupDetail extends Group {
  members: GroupMember[];
}

export interface GroupBalances {
  currencyCode: string;
  balances: { userId: string; balance: string }[];
}

export interface ExpenseShare {
  userId: string;
  amount: string;
}

export interface SharedExpense {
  id: string;
  amount: string;
  currencyCode: string;
  category: string;
  date: string;
  version: number;
  groupId: string;
  payerId: string;
  shares: ExpenseShare[];
}

export interface Invitation {
  token: string;
  expiresAt: string;
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

/**
 * Mutación autenticada (POST/PATCH/DELETE) que reenvía la cookie de sesión.
 * Lanza UnauthorizedError en 401 y Error con mensaje legible (RF-45) en el resto.
 * Devuelve el JSON parseado, o null si la API responde 204 (sin contenido).
 */
async function authedSend<T>(
  method: 'POST' | 'PATCH' | 'DELETE',
  path: string,
  body?: unknown,
): Promise<T> {
  const token = await getSessionToken();
  if (!token) {
    throw new UnauthorizedError();
  }
  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers: {
      Cookie: `${SESSION_COOKIE}=${token}`,
      ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
    cache: 'no-store',
  });
  if (res.status === 401) {
    throw new UnauthorizedError();
  }
  if (!res.ok) {
    throw new Error(await extractMessage(res));
  }
  if (res.status === 204) {
    return null as T;
  }
  return (await res.json()) as T;
}

export function getDashboard(): Promise<DashboardSummary> {
  return authedGet<DashboardSummary>('/dashboard');
}

export function getMe(): Promise<{ id: string; email: string }> {
  return authedGet<{ id: string; email: string }>('/auth/me');
}

// --- Finanzas personales (Paso 2, RF-08 a 15) ---

export function getMovements(page = 1): Promise<MovementsPage> {
  return authedGet<MovementsPage>(`/movements?page=${page}`);
}

export function getPersonalBalance(): Promise<PersonalBalance> {
  return authedGet<PersonalBalance>('/movements/balance');
}

export function createMovement(body: unknown): Promise<Movement> {
  return authedSend<Movement>('POST', '/movements', body);
}

export function updateMovement(id: string, body: unknown): Promise<Movement> {
  return authedSend<Movement>('PATCH', `/movements/${id}`, body);
}

export function deleteMovement(id: string): Promise<void> {
  return authedSend<void>('DELETE', `/movements/${id}`);
}

export function getCategories(): Promise<Category[]> {
  return authedGet<Category[]>('/categories');
}

export function createCategory(body: unknown): Promise<Category> {
  return authedSend<Category>('POST', '/categories', body);
}

export function updateCategory(id: string, body: unknown): Promise<Category> {
  return authedSend<Category>('PATCH', `/categories/${id}`, body);
}

export function deleteCategory(id: string): Promise<void> {
  return authedSend<void>('DELETE', `/categories/${id}`);
}

// --- Grupos y gastos compartidos (Pasos 3/4, RF-21 a 37) ---

export function getGroups(): Promise<Group[]> {
  return authedGet<Group[]>('/groups');
}

export function getGroup(id: string): Promise<GroupDetail> {
  return authedGet<GroupDetail>(`/groups/${id}`);
}

export function getGroupBalance(id: string): Promise<GroupBalances> {
  return authedGet<GroupBalances>(`/groups/${id}/balance`);
}

export function createGroup(body: unknown): Promise<Group> {
  return authedSend<Group>('POST', '/groups', body);
}

export function createInvitation(groupId: string): Promise<Invitation> {
  return authedSend<Invitation>('POST', `/groups/${groupId}/invitations`);
}

export function acceptInvitation(token: string): Promise<{ groupId: string }> {
  return authedSend<{ groupId: string }>('POST', `/invitations/${token}/accept`);
}

export function createSettlement(groupId: string, body: unknown): Promise<unknown> {
  return authedSend('POST', `/groups/${groupId}/settlements`, body);
}

export function leaveGroup(groupId: string): Promise<void> {
  return authedSend<void>('DELETE', `/groups/${groupId}/membership`);
}

export function getExpenses(groupId: string): Promise<SharedExpense[]> {
  return authedGet<SharedExpense[]>(`/groups/${groupId}/expenses`);
}

export function createExpense(groupId: string, body: unknown): Promise<SharedExpense> {
  return authedSend<SharedExpense>('POST', `/groups/${groupId}/expenses`, body);
}

export function updateExpense(id: string, body: unknown): Promise<SharedExpense> {
  return authedSend<SharedExpense>('PATCH', `/expenses/${id}`, body);
}

export function deleteExpense(id: string): Promise<void> {
  return authedSend<void>('DELETE', `/expenses/${id}`);
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

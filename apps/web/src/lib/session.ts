import { cookies } from 'next/headers';

// Capa de sesión del BFF. El navegador nunca habla con la API directamente:
// la cookie de sesión vive en el origin de la app (:3000) y este módulo la lee,
// la setea y la reenvía a la API (:3001) server-to-server.

/** Mismo nombre que espera el JwtAuthGuard de la API (access_token). */
export const SESSION_COOKIE = 'access_token';

/** 7 días, igual que la cookie que emite la API. */
const SESSION_MAX_AGE_S = 7 * 24 * 60 * 60;

export async function getSessionToken(): Promise<string | undefined> {
  return (await cookies()).get(SESSION_COOKIE)?.value;
}

export async function setSessionToken(token: string): Promise<void> {
  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true, // el JS del navegador no puede leer el token (mitiga XSS)
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: SESSION_MAX_AGE_S,
  });
}

export async function clearSession(): Promise<void> {
  (await cookies()).delete(SESSION_COOKIE);
}

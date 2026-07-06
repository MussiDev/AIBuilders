import { describe, it, expect, beforeEach, vi } from 'vitest';
import { UnauthorizedException } from '@nestjs/common';
import type { Response } from 'express';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtService } from '@nestjs/jwt';
import { AUTH_COOKIE } from './jwt-auth.guard';

function createResponseMock() {
  return {
    cookie: vi.fn(),
    clearCookie: vi.fn(),
  } as unknown as Response & {
    cookie: ReturnType<typeof vi.fn>;
    clearCookie: ReturnType<typeof vi.fn>;
  };
}

const safeUser = { id: 'u1', email: 'juan@example.com', defaultCurrency: 'ARS' };

describe('AuthController', () => {
  let auth: { register: ReturnType<typeof vi.fn>; validateUser: ReturnType<typeof vi.fn> };
  let jwt: { sign: ReturnType<typeof vi.fn> };
  let controller: AuthController;
  let res: ReturnType<typeof createResponseMock>;

  beforeEach(() => {
    auth = { register: vi.fn(), validateUser: vi.fn() };
    jwt = { sign: vi.fn().mockReturnValue('signed.jwt.token') };
    controller = new AuthController(
      auth as unknown as AuthService,
      jwt as unknown as JwtService,
    );
    res = createResponseMock();
  });

  it('register deja una cookie httpOnly y devuelve el usuario (RF-01)', async () => {
    auth.register.mockResolvedValue(safeUser);

    const result = await controller.register(
      { email: safeUser.email, password: 'secreta123', defaultCurrency: 'ARS' },
      res,
    );

    expect(result).toEqual(safeUser);
    const [name, token, options] = res.cookie.mock.calls[0];
    expect(name).toBe(AUTH_COOKIE);
    expect(token).toBe('signed.jwt.token');
    expect(options.httpOnly).toBe(true);
  });

  it('login con credenciales correctas deja la cookie (RF-04)', async () => {
    auth.validateUser.mockResolvedValue(safeUser);

    await controller.login({ email: safeUser.email, password: 'secreta123' }, res);

    expect(res.cookie).toHaveBeenCalledOnce();
  });

  it('login con credenciales incorrectas rechaza y no deja cookie (AC-05)', async () => {
    auth.validateUser.mockResolvedValue(null);

    await expect(
      controller.login({ email: safeUser.email, password: 'mala' }, res),
    ).rejects.toBeInstanceOf(UnauthorizedException);
    expect(res.cookie).not.toHaveBeenCalled();
  });

  it('logout borra la cookie del lado del servidor (RF-05 / AC-06)', () => {
    const result = controller.logout(res);

    expect(res.clearCookie).toHaveBeenCalledWith(
      AUTH_COOKIE,
      expect.objectContaining({ httpOnly: true }),
    );
    expect(result).toEqual({ ok: true });
  });
});

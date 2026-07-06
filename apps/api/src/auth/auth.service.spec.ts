import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ConflictException } from '@nestjs/common';
import bcrypt from 'bcryptjs';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';

// Doble de PrismaService: solo los métodos que AuthService usa.
function createPrismaMock() {
  return {
    user: {
      findUnique: vi.fn(),
      create: vi.fn(),
    },
  } as unknown as PrismaService & {
    user: { findUnique: ReturnType<typeof vi.fn>; create: ReturnType<typeof vi.fn> };
  };
}

const registerInput = {
  email: 'juan@example.com',
  password: 'secreta123',
  defaultCurrency: 'ARS',
};

describe('AuthService', () => {
  let prisma: ReturnType<typeof createPrismaMock>;
  let service: AuthService;

  beforeEach(() => {
    prisma = createPrismaMock();
    service = new AuthService(prisma);
  });

  describe('register', () => {
    // RF-03 / AC-03: no se puede registrar un email ya existente.
    it('rechaza el registro si el email ya existe', async () => {
      prisma.user.findUnique.mockResolvedValue({ id: 'u1', email: registerInput.email });

      await expect(service.register(registerInput)).rejects.toBeInstanceOf(
        ConflictException,
      );
      expect(prisma.user.create).not.toHaveBeenCalled();
    });

    // RNF-04: la contraseña se almacena hasheada, nunca en texto plano.
    it('hashea la contraseña antes de persistirla (nunca texto plano)', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      prisma.user.create.mockImplementation(({ data }: any) =>
        Promise.resolve({ id: 'u1', ...data }),
      );

      await service.register(registerInput);

      const persisted = prisma.user.create.mock.calls[0][0].data;
      expect(persisted.passwordHash).toBeDefined();
      expect(persisted.passwordHash).not.toBe(registerInput.password);
      expect(await bcrypt.compare(registerInput.password, persisted.passwordHash)).toBe(
        true,
      );
    });

    // RF-07: persiste la moneda por defecto elegida al crear la cuenta.
    it('persiste la moneda por defecto elegida', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      prisma.user.create.mockImplementation(({ data }: any) =>
        Promise.resolve({ id: 'u1', ...data }),
      );

      await service.register(registerInput);

      expect(prisma.user.create.mock.calls[0][0].data.defaultCurrency).toBe('ARS');
    });

    // RNF-04: nunca se expone el hash de la contraseña hacia afuera.
    it('nunca devuelve el hash de la contraseña', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      prisma.user.create.mockImplementation(({ data }: any) =>
        Promise.resolve({ id: 'u1', ...data }),
      );

      const result = await service.register(registerInput);

      expect(result).not.toHaveProperty('passwordHash');
      expect(result.email).toBe(registerInput.email);
    });
  });

  describe('validateUser', () => {
    let passwordHash: string;

    beforeEach(async () => {
      passwordHash = await bcrypt.hash(registerInput.password, 10);
    });

    // AC-05: contraseña incorrecta no inicia sesión.
    it('devuelve null si la contraseña es incorrecta', async () => {
      prisma.user.findUnique.mockResolvedValue({
        id: 'u1',
        email: registerInput.email,
        passwordHash,
        defaultCurrency: 'ARS',
      });

      expect(
        await service.validateUser(registerInput.email, 'contraseña-mala'),
      ).toBeNull();
    });

    it('devuelve null si el usuario no existe', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      expect(
        await service.validateUser('nadie@example.com', registerInput.password),
      ).toBeNull();
    });

    // AC-04: credenciales correctas devuelven al usuario (sin el hash).
    it('devuelve el usuario sin el hash si las credenciales son correctas', async () => {
      prisma.user.findUnique.mockResolvedValue({
        id: 'u1',
        email: registerInput.email,
        passwordHash,
        defaultCurrency: 'ARS',
      });

      const result = await service.validateUser(
        registerInput.email,
        registerInput.password,
      );

      expect(result).not.toBeNull();
      expect(result).not.toHaveProperty('passwordHash');
      expect(result?.id).toBe('u1');
    });
  });
});

import { ConflictException, Injectable } from '@nestjs/common';
import bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { DEFAULT_CATEGORIES } from '../categories/default-categories';
import { RegisterDto } from './dto/register.dto';

const SALT_ROUNDS = 10;

/** Vista pública de un usuario: nunca incluye el hash de la contraseña (RNF-04). */
export interface SafeUser {
  id: string;
  email: string;
  defaultCurrency: string;
}

@Injectable()
export class AuthService {
  constructor(private readonly prisma: PrismaService) {}

  /** RF-01: crea una cuenta. RF-03: rechaza si el email ya existe. */
  async register(dto: RegisterDto): Promise<SafeUser> {
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (existing) {
      throw new ConflictException('El email ya está registrado');
    }

    // RNF-04: la contraseña se persiste hasheada, nunca en texto plano.
    const passwordHash = await bcrypt.hash(dto.password, SALT_ROUNDS);
    // RF-15: al abrir la cuenta se siembran las categorías predefinidas.
    // El create anidado es una única operación atómica.
    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        passwordHash,
        defaultCurrency: dto.defaultCurrency, // RF-07
        categories: {
          create: DEFAULT_CATEGORIES.map((name) => ({ name, isDefault: true })),
        },
      },
    });

    return this.toSafeUser(user);
  }

  /**
   * RF-04/RF-05: valida credenciales para iniciar sesión.
   * Devuelve null ante usuario inexistente o contraseña incorrecta (AC-05),
   * sin distinguir cuál de los dos falló (no filtra qué emails existen).
   */
  async validateUser(email: string, password: string): Promise<SafeUser | null> {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) {
      return null;
    }
    const matches = await bcrypt.compare(password, user.passwordHash);
    if (!matches) {
      return null;
    }
    return this.toSafeUser(user);
  }

  private toSafeUser(user: {
    id: string;
    email: string;
    defaultCurrency: string;
  }): SafeUser {
    return {
      id: user.id,
      email: user.email,
      defaultCurrency: user.defaultCurrency,
    };
  }
}

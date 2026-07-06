import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { Request } from 'express';

export const AUTH_COOKIE = 'access_token';

export interface AuthTokenPayload {
  sub: string;
  email: string;
}

/**
 * Protege rutas leyendo el JWT desde la cookie httpOnly.
 * Base del control de acceso (RNF-06) que usarán los pasos siguientes.
 */
@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly jwt: JwtService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const token = request.cookies?.[AUTH_COOKIE];
    if (!token) {
      throw new UnauthorizedException('No autenticado');
    }
    try {
      const payload = this.jwt.verify<AuthTokenPayload>(token);
      (request as Request & { user: AuthTokenPayload }).user = payload;
      return true;
    } catch {
      throw new UnauthorizedException('Sesión inválida o expirada');
    }
  }
}

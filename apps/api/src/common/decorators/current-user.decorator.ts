import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { Request } from 'express';
import { AuthTokenPayload } from '../../auth/jwt-auth.guard';

/**
 * Extrae el id del usuario autenticado desde el payload del JWT que dejó
 * JwtAuthGuard. Base del control de acceso por usuario (RNF-06): las rutas
 * nunca reciben el userId desde el cliente, siempre desde la sesión.
 */
export const CurrentUserId = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): string => {
    const request = ctx
      .switchToHttp()
      .getRequest<Request & { user: AuthTokenPayload }>();
    return request.user.sub;
  },
);

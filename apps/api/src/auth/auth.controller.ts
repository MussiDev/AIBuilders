import {
  Body,
  Controller,
  Get,
  HttpCode,
  Post,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { CookieOptions, Request, Response } from 'express';
import { AuthService, SafeUser } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { AUTH_COOKIE, AuthTokenPayload, JwtAuthGuard } from './jwt-auth.guard';

const COOKIE_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000; // 7 días

@Controller('auth')
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly jwt: JwtService,
  ) {}

  /** RF-01/RF-07: registra la cuenta e inicia sesión dejando la cookie httpOnly. */
  @Post('register')
  async register(
    @Body() dto: RegisterDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<SafeUser> {
    const user = await this.auth.register(dto);
    this.setAuthCookie(res, user);
    return user;
  }

  /** RF-04: inicia sesión con email y contraseña. */
  @Post('login')
  @HttpCode(200)
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<SafeUser> {
    const user = await this.auth.validateUser(dto.email, dto.password);
    if (!user) {
      // AC-05: no distingue email inexistente de contraseña incorrecta.
      throw new UnauthorizedException('Email o contraseña incorrectos');
    }
    this.setAuthCookie(res, user);
    return user;
  }

  /** RF-05 / AC-06: cierra la sesión borrando la cookie del lado del servidor. */
  @Post('logout')
  @HttpCode(200)
  logout(@Res({ passthrough: true }) res: Response): { ok: true } {
    res.clearCookie(AUTH_COOKIE, this.cookieOptions());
    return { ok: true };
  }

  /** Devuelve el usuario de la sesión actual. Prueba end-to-end de la cookie. */
  @Get('me')
  @UseGuards(JwtAuthGuard)
  me(@Req() req: Request): { id: string; email: string } {
    const user = (req as Request & { user: AuthTokenPayload }).user;
    return { id: user.sub, email: user.email };
  }

  private setAuthCookie(res: Response, user: SafeUser): void {
    const token = this.jwt.sign({ sub: user.id, email: user.email });
    res.cookie(AUTH_COOKIE, token, {
      ...this.cookieOptions(),
      maxAge: COOKIE_MAX_AGE_MS,
    });
  }

  private cookieOptions(): CookieOptions {
    return {
      httpOnly: true, // el JS del navegador no puede leer el token (mitiga XSS)
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
    };
  }
}

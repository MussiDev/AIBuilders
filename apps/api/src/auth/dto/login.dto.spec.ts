import { describe, it, expect } from 'vitest';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { LoginDto } from './login.dto';

async function errorsFor(payload: Record<string, unknown>): Promise<string[]> {
  const dto = plainToInstance(LoginDto, payload);
  const errors = await validate(dto);
  return errors.map((e) => e.property);
}

describe('LoginDto', () => {
  it('acepta email y contraseña válidos', async () => {
    expect(
      await errorsFor({ email: 'juan@example.com', password: 'secreta123' }),
    ).toEqual([]);
  });

  it('rechaza un email sin formato válido', async () => {
    expect(
      await errorsFor({ email: 'juan@', password: 'secreta123' }),
    ).toContain('email');
  });

  it('rechaza cuando falta la contraseña (RF-42)', async () => {
    expect(await errorsFor({ email: 'juan@example.com' })).toContain('password');
  });
});

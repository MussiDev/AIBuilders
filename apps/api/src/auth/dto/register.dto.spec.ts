import { describe, it, expect } from 'vitest';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { RegisterDto } from './register.dto';

// Valida el DTO de registro con las mismas reglas que aplicará el ValidationPipe global.
async function errorsFor(payload: Record<string, unknown>): Promise<string[]> {
  const dto = plainToInstance(RegisterDto, payload);
  const errors = await validate(dto);
  return errors.map((e) => e.property);
}

const valid = {
  email: 'juan@example.com',
  password: 'secreta123',
  defaultCurrency: 'ARS',
};

describe('RegisterDto', () => {
  it('acepta un payload válido (AC-01)', async () => {
    expect(await errorsFor(valid)).toEqual([]);
  });

  // RF-02 / AC-02: email con formato inválido debe rechazarse.
  it('rechaza un email sin formato válido', async () => {
    expect(await errorsFor({ ...valid, email: 'juan@' })).toContain('email');
  });

  // RF-42: campos obligatorios.
  it('rechaza cuando falta el email', async () => {
    const { email, ...withoutEmail } = valid;
    expect(await errorsFor(withoutEmail)).toContain('email');
  });

  it('rechaza cuando falta la contraseña', async () => {
    const { password, ...withoutPassword } = valid;
    expect(await errorsFor(withoutPassword)).toContain('password');
  });

  // RF-07 / RNF-17: la moneda por defecto debe ser un código ISO 4217 válido.
  it('rechaza una moneda que no es ISO 4217', async () => {
    expect(await errorsFor({ ...valid, defaultCurrency: 'PESOS' })).toContain(
      'defaultCurrency',
    );
  });

  it('acepta un código de moneda ISO 4217 válido', async () => {
    expect(await errorsFor({ ...valid, defaultCurrency: 'USD' })).toEqual([]);
  });
});

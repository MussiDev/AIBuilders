import {
  IsEmail,
  IsISO4217CurrencyCode,
  IsString,
  MinLength,
} from 'class-validator';

/**
 * Datos de registro de una cuenta (RF-01).
 * La validación la aplica el ValidationPipe global antes de llegar al controlador.
 */
export class RegisterDto {
  @IsEmail({}, { message: 'El email no tiene un formato válido' }) // RF-02
  email!: string;

  // RF-42: obligatorio. Mínimo de 8 caracteres como piso de seguridad razonable.
  @IsString()
  @MinLength(8, { message: 'La contraseña debe tener al menos 8 caracteres' })
  password!: string;

  // RF-07 / RNF-17: moneda por defecto de la cuenta, código ISO 4217 (ej. ARS, USD).
  @IsISO4217CurrencyCode({ message: 'La moneda debe ser un código ISO 4217 válido' })
  defaultCurrency!: string;
}

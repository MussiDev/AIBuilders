import {
  IsISO4217CurrencyCode,
  IsNotEmpty,
  IsString,
  MaxLength,
} from 'class-validator';

/**
 * Alta de un grupo de gastos compartidos (RF-21).
 * La moneda es única por grupo (RNF-17) y no se puede cambiar luego.
 */
export class CreateGroupDto {
  // RF-42: el nombre es obligatorio.
  @IsString()
  @IsNotEmpty({ message: 'El nombre del grupo es obligatorio' })
  @MaxLength(120, { message: 'El nombre admite como máximo 120 caracteres' })
  name!: string;

  // RNF-17: moneda del grupo, código ISO 4217 (ej. ARS, USD).
  @IsISO4217CurrencyCode({ message: 'La moneda debe ser un código ISO 4217 válido' })
  currencyCode!: string;
}

import { MovementType } from '@prisma/client';
import {
  IsEnum,
  IsISO8601,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import {
  HasValidMoneyScale,
  IsPositiveMoney,
} from '../../common/validators/money.validators';

/**
 * Alta de un movimiento personal (RF-08 ingreso / RF-09 egreso).
 * El monto viaja como string para preservar la exactitud decimal (RNF-11).
 * La moneda no se recibe: se toma de la moneda por defecto del usuario (RNF-17).
 */
export class CreateMovementDto {
  @IsEnum(MovementType, { message: 'El tipo debe ser INCOME o EXPENSE' })
  type!: MovementType;

  // RF-42 obligatorio, RF-41 > 0, RF-43 hasta dos decimales.
  @IsString({ message: 'El monto debe enviarse como texto' })
  @IsNotEmpty({ message: 'El monto es obligatorio' })
  @IsPositiveMoney()
  @HasValidMoneyScale()
  amount!: string;

  // RF-42: la fecha es obligatoria.
  @IsISO8601({}, { message: 'La fecha debe tener un formato válido (ISO 8601)' })
  date!: string;

  // RF-42: la categoría es obligatoria.
  @IsString()
  @IsNotEmpty({ message: 'La categoría es obligatoria' })
  categoryId!: string;

  // RF-12: nota de texto opcional.
  @IsOptional()
  @IsString()
  @MaxLength(280, { message: 'La nota admite como máximo 280 caracteres' })
  note?: string;
}

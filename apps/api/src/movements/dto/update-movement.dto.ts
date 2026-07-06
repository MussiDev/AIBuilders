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
 * Edición de un movimiento personal (RF-10). Todos los campos son opcionales;
 * las mismas reglas de validación aplican a los que sí se envían.
 */
export class UpdateMovementDto {
  @IsOptional()
  @IsEnum(MovementType, { message: 'El tipo debe ser INCOME o EXPENSE' })
  type?: MovementType;

  @IsOptional()
  @IsString({ message: 'El monto debe enviarse como texto' })
  @IsNotEmpty({ message: 'El monto es obligatorio' })
  @IsPositiveMoney()
  @HasValidMoneyScale()
  amount?: string;

  @IsOptional()
  @IsISO8601({}, { message: 'La fecha debe tener un formato válido (ISO 8601)' })
  date?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty({ message: 'La categoría es obligatoria' })
  categoryId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(280, { message: 'La nota admite como máximo 280 caracteres' })
  note?: string;
}

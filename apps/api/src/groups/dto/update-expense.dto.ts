import {
  ArrayNotEmpty,
  IsArray,
  IsInt,
  IsISO8601,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';
import {
  HasValidMoneyScale,
  IsPositiveMoney,
} from '../../common/validators/money.validators';

/**
 * Edición de un gasto compartido existente (RF-32).
 * `version` es obligatoria: bloqueo optimista contra ediciones concurrentes
 * (mitigación del riesgo R6). Si no coincide con la versión persistida, se rechaza.
 */
export class UpdateExpenseDto {
  @IsInt({ message: 'La versión debe ser un número entero' })
  @Min(0)
  version!: number;

  @IsOptional()
  @IsString({ message: 'El monto debe enviarse como texto' })
  @IsNotEmpty({ message: 'El monto es obligatorio' })
  @IsPositiveMoney()
  @HasValidMoneyScale()
  amount?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty({ message: 'El pagador es obligatorio' })
  payerId?: string;

  @IsOptional()
  @IsISO8601({}, { message: 'La fecha debe tener un formato válido (ISO 8601)' })
  date?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty({ message: 'La categoría es obligatoria' })
  @MaxLength(60, { message: 'La categoría admite como máximo 60 caracteres' })
  category?: string;

  @IsOptional()
  @IsArray()
  @ArrayNotEmpty({ message: 'Debe seleccionar al menos un miembro' })
  @IsString({ each: true })
  memberIds?: string[];
}

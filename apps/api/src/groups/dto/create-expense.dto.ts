import {
  ArrayNotEmpty,
  IsArray,
  IsISO8601,
  IsNotEmpty,
  IsString,
  MaxLength,
} from 'class-validator';
import {
  HasValidMoneyScale,
  IsPositiveMoney,
} from '../../common/validators/money.validators';

/**
 * Alta de un gasto compartido dividido en partes iguales (RF-24, RF-25).
 * El monto viaja como string para preservar la exactitud decimal (RNF-11).
 * La moneda no se recibe: se toma de la moneda del grupo (RNF-17).
 * Las partes se calculan en el servidor (partes iguales), no se reciben del
 * cliente: la división por montos exactos o porcentaje es Fase 2 (RF-26/27).
 */
export class CreateExpenseDto {
  // RF-42 obligatorio, RF-41 > 0, RF-43 hasta dos decimales.
  @IsString({ message: 'El monto debe enviarse como texto' })
  @IsNotEmpty({ message: 'El monto es obligatorio' })
  @IsPositiveMoney()
  @HasValidMoneyScale()
  amount!: string;

  // RF-24: el pagador es obligatorio y debe ser miembro del grupo.
  @IsString()
  @IsNotEmpty({ message: 'El pagador es obligatorio' })
  payerId!: string;

  // RF-24: la fecha es obligatoria.
  @IsISO8601({}, { message: 'La fecha debe tener un formato válido (ISO 8601)' })
  date!: string;

  // RF-24: categoría como etiqueta de texto libre.
  @IsString()
  @IsNotEmpty({ message: 'La categoría es obligatoria' })
  @MaxLength(60, { message: 'La categoría admite como máximo 60 caracteres' })
  category!: string;

  // RF-25: miembros entre los que se divide el gasto en partes iguales.
  @IsArray()
  @ArrayNotEmpty({ message: 'Debe seleccionar al menos un miembro' })
  @IsString({ each: true })
  memberIds!: string[];
}

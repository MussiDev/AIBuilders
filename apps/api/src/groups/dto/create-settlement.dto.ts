import { IsISO8601, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import {
  HasValidMoneyScale,
  IsPositiveMoney,
} from '../../common/validators/money.validators';

/**
 * Registro de un pago de saldo (settlement) entre dos miembros (RF-31).
 * Refleja que `fromUserId` le pagó a `toUserId` para saldar deuda.
 */
export class CreateSettlementDto {
  @IsString()
  @IsNotEmpty({ message: 'El pagador es obligatorio' })
  fromUserId!: string;

  @IsString()
  @IsNotEmpty({ message: 'El receptor es obligatorio' })
  toUserId!: string;

  @IsString({ message: 'El monto debe enviarse como texto' })
  @IsNotEmpty({ message: 'El monto es obligatorio' })
  @IsPositiveMoney()
  @HasValidMoneyScale()
  amount!: string;

  // Opcional: si no se envía, el servidor usa la fecha actual.
  @IsOptional()
  @IsISO8601({}, { message: 'La fecha debe tener un formato válido (ISO 8601)' })
  date?: string;
}

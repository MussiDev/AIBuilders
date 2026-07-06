import { Type } from 'class-transformer';
import { IsInt, IsOptional, Min } from 'class-validator';

/** Paginación de la lista de movimientos (RF-44: máx. 50 ítems por página). */
export class ListMovementsQuery {
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'La página debe ser un número entero' })
  @Min(1, { message: 'La página debe ser mayor o igual a 1' })
  page?: number;
}

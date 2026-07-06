import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

/** Datos para crear una categoría de movimientos (RF-14). */
export class CreateCategoryDto {
  // RF-42: el nombre es obligatorio.
  @IsString()
  @IsNotEmpty({ message: 'El nombre de la categoría es obligatorio' })
  @MaxLength(50, { message: 'El nombre admite como máximo 50 caracteres' })
  name!: string;
}

import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

/** Datos para renombrar una categoría existente (RF-14). */
export class UpdateCategoryDto {
  @IsString()
  @IsNotEmpty({ message: 'El nombre de la categoría es obligatorio' })
  @MaxLength(50, { message: 'El nombre admite como máximo 50 caracteres' })
  name!: string;
}

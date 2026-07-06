import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

/** Datos de inicio de sesión (RF-04). */
export class LoginDto {
  @IsEmail({}, { message: 'El email no tiene un formato válido' })
  email!: string;

  @IsString()
  @IsNotEmpty({ message: 'La contraseña es obligatoria' }) // RF-42
  password!: string;
}

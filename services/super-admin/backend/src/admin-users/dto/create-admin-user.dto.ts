import { IsEmail, IsEnum, IsString, MinLength } from 'class-validator';
import { AdminRole } from '@prisma/client';

export class CreateAdminUserDto {
  @IsString()
  name!: string;

  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(8)
  password!: string;

  @IsEnum(AdminRole)
  role!: AdminRole;
}

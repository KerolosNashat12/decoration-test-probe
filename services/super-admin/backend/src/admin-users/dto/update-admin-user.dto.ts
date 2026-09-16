import { IsBoolean, IsEnum, IsOptional, IsString } from 'class-validator';
import { AdminRole } from '@prisma/client';

export class UpdateAdminUserDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsEnum(AdminRole)
  role?: AdminRole;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

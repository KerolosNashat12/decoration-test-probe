import { IsArray, IsEmail, IsEnum, IsOptional, IsString } from 'class-validator';
import { TenantCategory } from '@prisma/client';

export class CreateTenantDto {
  @IsString()
  name!: string;

  @IsString()
  contactName!: string;

  @IsString()
  phone!: string;

  @IsOptional()
  @IsString()
  whatsapp?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  district?: string;

  @IsArray()
  @IsEnum(TenantCategory, { each: true })
  categories!: TenantCategory[];

  @IsOptional()
  @IsString()
  notes?: string;
}

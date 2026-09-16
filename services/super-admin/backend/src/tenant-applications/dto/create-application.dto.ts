import { IsArray, IsEmail, IsEnum, IsOptional, IsString } from 'class-validator';
import { TenantCategory } from '@prisma/client';

// What the public website submits when a supplier requests to join.
export class CreateApplicationDto {
  @IsString()
  shopName!: string;

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
  message?: string;
}

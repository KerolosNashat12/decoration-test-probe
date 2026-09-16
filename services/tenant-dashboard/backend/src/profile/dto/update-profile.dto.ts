import { IsArray, IsEnum, IsOptional, IsString } from 'class-validator';
import { TenantCategory } from '../../../generated/tenant/index.js';

export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  contactName?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  whatsapp?: string;

  @IsOptional()
  @IsString()
  email?: string;

  @IsOptional()
  @IsString()
  district?: string;

  @IsOptional()
  @IsArray()
  @IsEnum(TenantCategory, { each: true })
  categories?: TenantCategory[];
}

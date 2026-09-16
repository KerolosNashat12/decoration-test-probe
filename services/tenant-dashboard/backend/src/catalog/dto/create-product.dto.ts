import { IsBoolean, IsEnum, IsNumber, IsOptional, IsPositive, IsString, MaxLength, MinLength } from 'class-validator';
import { TenantCategory } from '../../../generated/tenant/index.js';

// See the Tenant Dashboard SRS, §10, for the field-by-field rationale.
export class CreateProductDto {
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  name!: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @IsEnum(TenantCategory)
  category!: TenantCategory;

  @IsNumber()
  @IsPositive()
  price!: number;

  @IsString()
  @MinLength(1)
  unit!: string;

  @IsOptional()
  @IsString()
  photoUrl?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

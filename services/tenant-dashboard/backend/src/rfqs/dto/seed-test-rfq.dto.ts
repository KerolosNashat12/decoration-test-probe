import { IsDateString, IsEnum, IsOptional, IsString, IsUUID, MinLength } from 'class-validator';
import { TenantCategory } from '../../../generated/tenant/index.js';

// Called only from Super Admin's internal API (shared-secret guarded) — see
// the Tenant Dashboard SRS, §14, "Internal seed path". Stands in for the
// Public Website's future RFQ-submission endpoint.
export class SeedTestRfqDto {
  @IsUUID()
  tenantId!: string;

  @IsString()
  @MinLength(1)
  buyerName!: string;

  @IsString()
  @MinLength(1)
  buyerPhone!: string;

  @IsEnum(TenantCategory)
  category!: TenantCategory;

  @IsString()
  @MinLength(1)
  description!: string;

  @IsOptional()
  @IsString()
  quantity?: string;

  @IsOptional()
  @IsDateString()
  deadlineAt?: string;
}

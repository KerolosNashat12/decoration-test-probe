import { PartialType } from '@nestjs/mapped-types';
import { IsEnum, IsOptional } from 'class-validator';
import { TenantStatus } from '@prisma/client';
import { CreateTenantDto } from './create-tenant.dto.js';

export class UpdateTenantDto extends PartialType(CreateTenantDto) {
  @IsOptional()
  @IsEnum(TenantStatus)
  status?: TenantStatus;
}

import { Transform } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsString, Min } from 'class-validator';
import { TenantCategory } from '../../../generated/tenant/index.js';

// Query-string params for GET /catalog (SRS §9's search/filter/pagination
// toolbar). Booleans and numbers arrive as strings over the wire, so this
// DTO accepts the string form and CatalogService interprets it — keeping
// the coercion in one place rather than sprinkling `=== 'true'` around.
export class ListProductsQueryDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsIn(Object.values(TenantCategory))
  category?: TenantCategory;

  @IsOptional()
  @IsIn(['true', 'false'])
  isActive?: 'true' | 'false';

  @IsOptional()
  @Transform(({ value }) => Number(value))
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @Transform(({ value }) => Number(value))
  @IsInt()
  @Min(1)
  pageSize?: number;
}

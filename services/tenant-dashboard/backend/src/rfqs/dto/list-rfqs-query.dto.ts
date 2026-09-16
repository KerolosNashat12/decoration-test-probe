import { Transform } from 'class-transformer';
import { IsIn, IsInt, IsOptional, Min } from 'class-validator';
import { RfqStatus } from '../../../generated/tenant/index.js';

export class ListRfqsQueryDto {
  @IsOptional()
  @IsIn(Object.values(RfqStatus))
  status?: RfqStatus;

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

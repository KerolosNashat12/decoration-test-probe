import { IsNumber, IsOptional, IsPositive, IsString, IsUUID, MaxLength } from 'class-validator';

// See the Tenant Dashboard SRS, §13.
export class RespondRfqDto {
  @IsNumber()
  @IsPositive()
  price!: number;

  @IsString()
  priceUnit!: string;

  @IsOptional()
  @IsUUID()
  productId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  availabilityNote?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  message?: string;
}

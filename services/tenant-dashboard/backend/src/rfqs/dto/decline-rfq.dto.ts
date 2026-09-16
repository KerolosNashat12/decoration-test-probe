import { IsOptional, IsString, MaxLength } from 'class-validator';

export class DeclineRfqDto {
  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;
}

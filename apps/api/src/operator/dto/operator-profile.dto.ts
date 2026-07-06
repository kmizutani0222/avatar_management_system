import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class UpdateOperatorProfileDto {
  @ApiPropertyOptional({ example: 'Demo Operator Inc.' })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(128)
  companyName?: string;
}

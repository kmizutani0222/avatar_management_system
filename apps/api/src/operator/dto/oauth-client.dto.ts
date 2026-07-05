import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsOptional, IsString, MinLength } from 'class-validator';

export class CreateOAuthClientDto {
  @ApiProperty({ example: 'My App' })
  @IsString()
  @MinLength(1)
  name!: string;

  @ApiPropertyOptional({ example: ['http://localhost:3000/callback'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  redirectUris?: string[];
}

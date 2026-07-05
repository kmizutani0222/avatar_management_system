import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsInt, IsOptional, IsString, MinLength } from 'class-validator';

export class CreateApiKeyDto {
  @ApiProperty({ example: 'Production key' })
  @IsString()
  @MinLength(1)
  name!: string;

  @ApiPropertyOptional({ example: 1000 })
  @IsOptional()
  @IsInt()
  rateLimit?: number;

  @ApiPropertyOptional({
    example: ['https://game.example.com'],
    description: 'Allowed Origin headers. Empty = allow all.',
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  allowedOrigins?: string[];
}

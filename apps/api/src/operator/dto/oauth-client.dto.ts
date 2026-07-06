import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ArrayMinSize, IsArray, IsOptional, IsString, MinLength } from 'class-validator';

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

export class UpdateOAuthClientDto {
  @ApiProperty({ example: ['http://localhost:4002/oauth/callback'] })
  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  redirectUris!: string[];
}

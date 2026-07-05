import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AvatarBodyType } from '@prisma/client';
import { IsBoolean, IsEnum, IsInt, IsObject, IsOptional, IsString, MinLength } from 'class-validator';

export class CreatePartDto {
  @ApiProperty({ enum: AvatarBodyType })
  @IsEnum(AvatarBodyType)
  bodyType!: AvatarBodyType;

  @ApiProperty({ example: 'hair' })
  @IsString()
  @MinLength(1)
  category!: string;

  @ApiProperty({ example: 'Short Hair' })
  @IsString()
  @MinLength(1)
  name!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  sortOrder?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdatePartDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(1)
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  sortOrder?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

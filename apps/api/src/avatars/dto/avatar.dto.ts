import {
  IsBoolean,
  IsEnum,
  IsObject,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AvatarBodyType, AvatarSourceType } from '@prisma/client';

export class CreateAvatarDto {
  @ApiProperty({ example: 'My Avatar' })
  @IsString()
  @MinLength(1)
  name!: string;

  @ApiProperty({ enum: AvatarBodyType })
  @IsEnum(AvatarBodyType)
  bodyType!: AvatarBodyType;

  @ApiProperty({ enum: AvatarSourceType })
  @IsEnum(AvatarSourceType)
  sourceType!: AvatarSourceType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  partsConfig?: Record<string, unknown>;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  editorMetadata?: Record<string, unknown>;
}

export class UpdateAvatarDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(1)
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  partsConfig?: Record<string, unknown>;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  editorMetadata?: Record<string, unknown>;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  externalEnabled?: boolean;
}

export class AdminUpdateAvatarDto extends UpdateAvatarDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  adminApproved?: boolean;

  @ApiPropertyOptional({ enum: ['active', 'archived', 'admin_suspended'] })
  @IsOptional()
  @IsString()
  status?: string;
}

export class AdminCreateAvatarDto extends CreateAvatarDto {
  @ApiProperty({ description: 'Owner user ID' })
  @IsString()
  @MinLength(1)
  userId!: string;
}

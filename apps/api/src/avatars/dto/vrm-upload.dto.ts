import { IsEnum, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { AvatarBodyType, AvatarSourceType } from '@prisma/client';

export class VrmUploadDto {
  @ApiProperty({ example: 'My VRM Avatar' })
  @IsString()
  @MinLength(1)
  name!: string;

  @ApiProperty({ enum: AvatarBodyType })
  @IsEnum(AvatarBodyType)
  bodyType!: AvatarBodyType;

  @ApiProperty({ enum: ['vrm_upload', 'vrm_editor'] })
  @IsEnum(['vrm_upload', 'vrm_editor'])
  sourceType!: 'vrm_upload' | 'vrm_editor';
}

import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, Matches, MaxLength, MinLength } from 'class-validator';

export class UpdateUserProfileDto {
  @ApiPropertyOptional({ example: 'My Avatar' })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(64)
  displayName?: string;

  @ApiPropertyOptional({ example: 'my_handle', description: 'X (Twitter) username without @' })
  @IsOptional()
  @IsString()
  @MaxLength(15)
  @Matches(/^[A-Za-z0-9_]*$/, { message: 'X username may only contain letters, numbers, and underscore' })
  xUsername?: string | null;

  @ApiPropertyOptional({ example: 'よろしくお願いします！' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  profileMessage?: string | null;
}

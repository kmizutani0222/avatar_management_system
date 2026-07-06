import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MinLength } from 'class-validator';

export class OAuthAuthorizeDto {
  @ApiProperty({ example: 'cli_abc123' })
  @IsString()
  @MinLength(1)
  clientId!: string;

  @ApiPropertyOptional({ example: 'http://localhost:4002/oauth/callback' })
  @IsOptional()
  @IsString()
  redirectUri?: string;
}

export class OAuthTokenDto {
  @ApiProperty({ example: 'authorization_code' })
  @IsString()
  grant_type!: string;

  @ApiProperty()
  @IsString()
  code!: string;

  @ApiProperty()
  @IsString()
  client_id!: string;

  @ApiProperty()
  @IsString()
  client_secret!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  redirect_uri?: string;
}

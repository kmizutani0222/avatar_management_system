import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class OAuthAuthorizeDto {
  @ApiProperty({ example: 'cli_abc123' })
  @IsString()
  @MinLength(1)
  clientId!: string;
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
}

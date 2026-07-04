import { IsEmail, IsEnum, IsOptional, IsString, MinLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: 'password123' })
  @IsString()
  @MinLength(8)
  password!: string;

  @ApiProperty({ enum: ['admin', 'user', 'operator'] })
  @IsEnum(['admin', 'user', 'operator'])
  role!: 'admin' | 'user' | 'operator';
}

export class RegisterDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: 'password123' })
  @IsString()
  @MinLength(8)
  password!: string;

  @ApiProperty({ enum: ['user', 'operator'] })
  @IsEnum(['user', 'operator'])
  role!: 'user' | 'operator';

  @ApiPropertyOptional({ example: 'Taro' })
  @IsOptional()
  @IsString()
  displayName?: string;

  @ApiPropertyOptional({ example: 'Example Corp' })
  @IsOptional()
  @IsString()
  companyName?: string;
}

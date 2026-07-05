import { ApiProperty } from '@nestjs/swagger';
import { IsIn } from 'class-validator';

export class AdminUpdateOperatorDto {
  @ApiProperty({ enum: ['pending', 'active', 'suspended'] })
  @IsIn(['pending', 'active', 'suspended'])
  status!: 'pending' | 'active' | 'suspended';
}

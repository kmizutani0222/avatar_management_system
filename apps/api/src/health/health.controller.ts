import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('health')
@Controller('health')
export class HealthController {
  @Get()
  check() {
    return {
      status: 'ok' as const,
      service: 'avatar-management-api',
      timestamp: new Date().toISOString(),
    };
  }
}

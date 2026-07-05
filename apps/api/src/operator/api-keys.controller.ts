import { Body, Controller, Delete, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { OperatorActiveGuard } from '../auth/guards/operator-active.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtPayload } from '../auth/interfaces/jwt-payload.interface';
import { ROLE_OPERATOR } from '../common/constants';
import { ApiKeysService } from './api-keys.service';
import { CreateApiKeyDto } from './dto/api-key.dto';

@ApiTags('operator-api-keys')
@ApiBearerAuth()
@Controller('operator/api-keys')
@UseGuards(JwtAuthGuard, RolesGuard, OperatorActiveGuard)
@Roles(ROLE_OPERATOR)
export class ApiKeysController {
  constructor(private readonly apiKeysService: ApiKeysService) {}

  @Get()
  list(@CurrentUser() user: JwtPayload) {
    return this.apiKeysService.list(user.sub);
  }

  @Post()
  create(@CurrentUser() user: JwtPayload, @Body() dto: CreateApiKeyDto) {
    return this.apiKeysService.create(user.sub, dto);
  }

  @Delete(':id')
  revoke(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.apiKeysService.revoke(user.sub, id);
  }
}

import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { OperatorActiveGuard } from '../auth/guards/operator-active.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtPayload } from '../auth/interfaces/jwt-payload.interface';
import { ROLE_OPERATOR } from '../common/constants';
import { OAuthClientsService } from './oauth-clients.service';
import { CreateOAuthClientDto } from './dto/oauth-client.dto';

@ApiTags('operator-oauth-clients')
@ApiBearerAuth()
@Controller('operator/oauth-clients')
@UseGuards(JwtAuthGuard, RolesGuard, OperatorActiveGuard)
@Roles(ROLE_OPERATOR)
export class OAuthClientsController {
  constructor(private readonly oauthClientsService: OAuthClientsService) {}

  @Get()
  list(@CurrentUser() user: JwtPayload) {
    return this.oauthClientsService.list(user.sub);
  }

  @Post()
  create(@CurrentUser() user: JwtPayload, @Body() dto: CreateOAuthClientDto) {
    return this.oauthClientsService.create(user.sub, dto);
  }

  @Patch(':id/deactivate')
  deactivate(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.oauthClientsService.deactivate(user.sub, id);
  }
}

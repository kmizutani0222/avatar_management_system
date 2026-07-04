import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtPayload } from '../auth/interfaces/jwt-payload.interface';
import { ROLE_USER } from '../common/constants';
import { AvatarsService } from './avatars.service';

@ApiTags('external-avatars')
@Controller('v1/avatars')
export class ExternalAvatarsController {
  constructor(private readonly avatarsService: AvatarsService) {}

  // OAuth guard to be added in Phase 5 — temporarily JWT user auth
  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(ROLE_USER)
  @ApiBearerAuth()
  list(@CurrentUser() user: JwtPayload) {
    return this.avatarsService.listForExternalApi(user.sub);
  }
}

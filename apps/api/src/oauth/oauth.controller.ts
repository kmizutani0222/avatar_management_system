import { Body, Controller, Get, Param, Post, Query, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtPayload } from '../auth/interfaces/jwt-payload.interface';
import { ROLE_USER } from '../common/constants';
import { OAuthAuthorizeDto, OAuthTokenDto } from './dto/oauth.dto';
import { OAuthService } from './oauth.service';

@ApiTags('oauth')
@Controller('v1/oauth')
export class OAuthController {
  constructor(private readonly oauthService: OAuthService) {}

  /** Consent screen metadata (public, no auth). */
  @Get('clients/:clientId')
  getPublicClient(
    @Param('clientId') clientId: string,
    @Query('redirect_uri') redirectUri?: string,
  ) {
    return this.oauthService.getPublicClientInfo(clientId, redirectUri);
  }

  /** Issue authorization code (user JWT — browser consent or dev API). */
  @Post('authorize')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(ROLE_USER)
  @ApiBearerAuth()
  authorize(@CurrentUser() user: JwtPayload, @Body() dto: OAuthAuthorizeDto) {
    return this.oauthService.authorize(user.sub, dto.clientId, dto.redirectUri);
  }

  @Post('token')
  token(@Body() dto: OAuthTokenDto, @Req() req: Request) {
    const ip =
      (typeof req.headers['x-forwarded-for'] === 'string'
        ? req.headers['x-forwarded-for'].split(',')[0]?.trim()
        : undefined) ?? req.ip ?? 'unknown';

    return this.oauthService.exchangeToken(
      dto.grant_type,
      dto.code,
      dto.client_id,
      dto.client_secret,
      ip,
      dto.redirect_uri,
    );
  }
}

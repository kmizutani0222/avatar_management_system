import { Controller, Get, Param, Res, UseGuards } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApiBearerAuth, ApiSecurity, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { ExternalAuthGuard } from '../auth/guards/external-auth.guard';
import { ExternalUserId } from '../auth/decorators/external-auth.decorator';
import { AvatarsService } from './avatars.service';

@ApiTags('external-avatars')
@Controller('v1/avatars')
export class ExternalAvatarsController {
  constructor(
    private readonly avatarsService: AvatarsService,
    private readonly config: ConfigService,
  ) {}

  @Get()
  @UseGuards(ExternalAuthGuard)
  @ApiBearerAuth()
  @ApiSecurity('api-key')
  list(@ExternalUserId() userId: string) {
    return this.avatarsService.listForExternalApi(userId);
  }

  @Get(':id/model')
  @UseGuards(ExternalAuthGuard)
  @ApiBearerAuth()
  @ApiSecurity('api-key')
  async getModel(
    @ExternalUserId() userId: string,
    @Param('id') id: string,
    @Res() res: Response,
  ) {
    const delivery = this.config.get<string>('MODEL_DELIVERY', 'proxy');

    if (delivery === 'presigned') {
      const { url } = await this.avatarsService.getPresignedModelForExternal(userId, id);
      return res.redirect(302, url);
    }

    const { body, contentType } = await this.avatarsService.getModelForExternal(userId, id);
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', 'inline');
    res.send(body);
  }

  @Get(':id/thumbnail')
  @UseGuards(ExternalAuthGuard)
  @ApiBearerAuth()
  @ApiSecurity('api-key')
  async getThumbnail(
    @ExternalUserId() userId: string,
    @Param('id') id: string,
    @Res() res: Response,
  ) {
    const { body, contentType } = await this.avatarsService.getThumbnailForExternal(userId, id);
    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'private, max-age=300');
    res.send(body);
  }

  @Get(':id')
  @UseGuards(ExternalAuthGuard)
  @ApiBearerAuth()
  @ApiSecurity('api-key')
  getOne(@ExternalUserId() userId: string, @Param('id') id: string) {
    return this.avatarsService.findOneForExternal(userId, id).then((avatar) =>
      this.avatarsService.toExternalAvatar(avatar),
    );
  }
}

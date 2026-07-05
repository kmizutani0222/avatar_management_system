import { Controller, Get, Query, Res } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { AvatarBodyType } from '@prisma/client';
import { BaseTemplateService } from './base-template.service';

@ApiTags('parts')
@Controller('parts')
export class BaseTemplateController {
  constructor(private readonly baseTemplate: BaseTemplateService) {}

  /** Base body GLB for parts-avatar preview and bake (same MinIO template). */
  @Get('base-template')
  async getBaseTemplate(
    @Query('bodyType') bodyType: AvatarBodyType,
    @Res() res: Response,
  ) {
    const type = this.baseTemplate.requireBodyType(bodyType);
    const buffer = await this.baseTemplate.getBuffer(type);
    res.setHeader('Content-Type', 'model/gltf-binary');
    res.setHeader('Cache-Control', 'public, max-age=60');
    res.send(buffer);
  }
}

import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AvatarBodyType } from '@prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { ROLE_ADMIN } from '../common/constants';
import { PartsService } from './parts.service';

@ApiTags('parts')
@Controller('parts')
export class PartsController {
  constructor(private readonly partsService: PartsService) {}

  @Get()
  listParts(@Query('bodyType') bodyType?: AvatarBodyType) {
    return this.partsService.listPublic(bodyType);
  }

  @Get('admin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(ROLE_ADMIN)
  @ApiBearerAuth()
  listAllParts(@Query('bodyType') bodyType?: AvatarBodyType) {
    return this.partsService.listAll(bodyType);
  }
}

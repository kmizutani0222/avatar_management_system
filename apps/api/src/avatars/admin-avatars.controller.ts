import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { ROLE_ADMIN } from '../common/constants';
import { AvatarsService } from './avatars.service';
import { AdminCreateAvatarDto, AdminUpdateAvatarDto } from './dto/avatar.dto';

@ApiTags('admin-avatars')
@ApiBearerAuth()
@Controller('admin/avatars')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(ROLE_ADMIN)
export class AdminAvatarsController {
  constructor(private readonly avatarsService: AvatarsService) {}

  @Get()
  list(
    @Query('bodyType') bodyType?: string,
    @Query('status') status?: string,
  ) {
    return this.avatarsService.listForAdmin({ bodyType, status });
  }

  @Get(':id')
  getOne(@Param('id') id: string) {
    return this.avatarsService.findOneForAdmin(id);
  }

  @Post()
  create(@Body() dto: AdminCreateAvatarDto) {
    return this.avatarsService.createForAdmin(dto);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: AdminUpdateAvatarDto) {
    return this.avatarsService.updateForAdmin(id, dto);
  }

  @Post(':id/publish')
  publish(@Param('id') id: string) {
    return this.avatarsService.publishForAdmin(id);
  }

  @Post(':id/unpublish')
  unpublish(@Param('id') id: string) {
    return this.avatarsService.unpublishForAdmin(id);
  }

  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.avatarsService.deleteAvatar(id);
  }
}

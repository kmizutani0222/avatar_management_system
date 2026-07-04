import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { ROLE_ADMIN } from '../common/constants';
import { AvatarsService } from './avatars.service';
import { AdminUpdateAvatarDto } from './dto/avatar.dto';

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

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: AdminUpdateAvatarDto) {
    return this.avatarsService.updateForAdmin(id, dto);
  }

  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.avatarsService.deleteAvatar(id);
  }
}

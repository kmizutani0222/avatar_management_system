import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtPayload } from '../auth/interfaces/jwt-payload.interface';
import { ROLE_ADMIN } from '../common/constants';
import { UpdateAdminProfileDto } from './dto/admin-profile.dto';
import { AdminProfileService } from './admin-profile.service';

@ApiTags('admin-profile')
@ApiBearerAuth()
@Controller('admin/profile')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(ROLE_ADMIN)
export class AdminProfileController {
  constructor(private readonly adminProfileService: AdminProfileService) {}

  @Get()
  getProfile(@CurrentUser() user: JwtPayload) {
    return this.adminProfileService.getProfile(user.sub);
  }

  @Patch()
  updateProfile(@CurrentUser() user: JwtPayload, @Body() dto: UpdateAdminProfileDto) {
    return this.adminProfileService.updateProfile(user.sub, dto);
  }
}

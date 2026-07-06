import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { SuperAdminGuard } from '../auth/guards/super-admin.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { SuperAdmin } from '../auth/decorators/super-admin.decorator';
import { ROLE_ADMIN } from '../common/constants';
import { CreateAdminDto } from './dto/create-admin.dto';
import { AdminAdminsService } from './admin-admins.service';

@ApiTags('admin-admins')
@ApiBearerAuth()
@Controller('admin/admins')
@UseGuards(JwtAuthGuard, RolesGuard, SuperAdminGuard)
@Roles(ROLE_ADMIN)
export class AdminAdminsController {
  constructor(private readonly adminAdminsService: AdminAdminsService) {}

  @Get()
  @SuperAdmin()
  list() {
    return this.adminAdminsService.list();
  }

  @Post()
  @SuperAdmin()
  create(@Body() dto: CreateAdminDto) {
    return this.adminAdminsService.create(dto);
  }
}

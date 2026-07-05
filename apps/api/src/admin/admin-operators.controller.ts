import { Body, Controller, Get, Param, Patch, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { ROLE_ADMIN } from '../common/constants';
import { AdminOperatorsService } from './admin-operators.service';
import { AdminUpdateOperatorDto } from './dto/admin-operator.dto';

@ApiTags('admin-operators')
@ApiBearerAuth()
@Controller('admin/operators')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(ROLE_ADMIN)
export class AdminOperatorsController {
  constructor(private readonly adminOperatorsService: AdminOperatorsService) {}

  @Get()
  list() {
    return this.adminOperatorsService.list();
  }

  @Get(':id')
  getOne(@Param('id') id: string) {
    return this.adminOperatorsService.findOne(id);
  }

  @Patch(':id')
  updateStatus(@Param('id') id: string, @Body() dto: AdminUpdateOperatorDto) {
    return this.adminOperatorsService.updateStatus(id, dto);
  }
}

import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtPayload } from '../auth/interfaces/jwt-payload.interface';
import { ROLE_OPERATOR } from '../common/constants';
import { UpdateOperatorProfileDto } from './dto/operator-profile.dto';
import { OperatorProfileService } from './operator-profile.service';

@ApiTags('operator-profile')
@ApiBearerAuth()
@Controller('operator/profile')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(ROLE_OPERATOR)
export class OperatorProfileController {
  constructor(private readonly operatorProfileService: OperatorProfileService) {}

  @Get()
  getProfile(@CurrentUser() user: JwtPayload) {
    return this.operatorProfileService.getProfile(user.sub);
  }

  @Patch()
  updateProfile(@CurrentUser() user: JwtPayload, @Body() dto: UpdateOperatorProfileDto) {
    return this.operatorProfileService.updateProfile(user.sub, dto);
  }
}

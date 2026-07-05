import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { IsNumber, IsObject, IsOptional, Max, Min } from 'class-validator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { ROLE_ADMIN } from '../common/constants';
import { SettingsService } from './settings.service';

class UpdateExpressionMorphSettingsDto {
  @IsOptional()
  @IsNumber()
  @Min(0.1)
  @Max(2)
  mouthScale?: number;

  @IsOptional()
  @IsNumber()
  @Min(0.1)
  @Max(2)
  eyeScale?: number;

  @IsOptional()
  @IsNumber()
  @Min(0.1)
  @Max(2)
  browScale?: number;

  /** Per-expression intensity multipliers keyed by VRM preset name (values clamped server-side). */
  @IsOptional()
  @IsObject()
  expressionIntensity?: Record<string, number>;
}

@ApiTags('admin-settings')
@ApiBearerAuth()
@Controller('admin/settings')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(ROLE_ADMIN)
export class AdminSettingsController {
  constructor(private readonly settings: SettingsService) {}

  @Get('expressions')
  getExpressionSettings() {
    return this.settings.getExpressionMorphSettings();
  }

  @Patch('expressions')
  updateExpressionSettings(@Body() dto: UpdateExpressionMorphSettingsDto) {
    return this.settings.updateExpressionMorphSettings(dto);
  }
}

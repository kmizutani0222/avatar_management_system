import {
  Body,
  Controller,
  Get,
  Patch,
  Post,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiConsumes, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtPayload } from '../auth/interfaces/jwt-payload.interface';
import { ROLE_USER } from '../common/constants';
import { UpdateUserProfileDto } from './dto/update-user-profile.dto';
import { UserProfileService } from './user-profile.service';

@ApiTags('user-profile')
@ApiBearerAuth()
@Controller('user/profile')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(ROLE_USER)
export class UserProfileController {
  constructor(private readonly userProfileService: UserProfileService) {}

  @Get()
  getProfile(@CurrentUser() user: JwtPayload) {
    return this.userProfileService.getProfile(user.sub);
  }

  @Patch()
  updateProfile(@CurrentUser() user: JwtPayload, @Body() dto: UpdateUserProfileDto) {
    return this.userProfileService.updateProfile(user.sub, dto);
  }

  @Post('icon')
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 2 * 1024 * 1024 } }))
  uploadIcon(@CurrentUser() user: JwtPayload, @UploadedFile() file: Express.Multer.File) {
    return this.userProfileService.uploadProfileIcon(user.sub, file);
  }

  @Get('icon')
  async getIcon(@CurrentUser() user: JwtPayload, @Res() res: Response) {
    const { body, contentType } = await this.userProfileService.getProfileIcon(user.sub);
    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'private, max-age=60');
    res.send(body);
  }
}

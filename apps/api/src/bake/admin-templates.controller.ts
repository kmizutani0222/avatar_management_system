import {
  Controller,
  Delete,
  Get,
  Param,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiConsumes, ApiTags } from '@nestjs/swagger';
import { AvatarBodyType } from '@prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { ROLE_ADMIN, MAX_VRM_SIZE_BYTES } from '../common/constants';
import { TemplatesService } from './templates.service';

@ApiTags('admin-templates')
@ApiBearerAuth()
@Controller('admin/templates')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(ROLE_ADMIN)
export class AdminTemplatesController {
  constructor(private readonly templates: TemplatesService) {}

  @Get()
  list() {
    return this.templates.listTemplateStatus();
  }

  @Post(':bodyType')
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: MAX_VRM_SIZE_BYTES } }))
  upload(@Param('bodyType') bodyType: AvatarBodyType, @UploadedFile() file: Express.Multer.File) {
    return this.templates.uploadBaseTemplate(bodyType, file);
  }

  @Delete(':bodyType')
  reset(@Param('bodyType') bodyType: AvatarBodyType) {
    return this.templates.deleteBaseTemplate(bodyType);
  }
}

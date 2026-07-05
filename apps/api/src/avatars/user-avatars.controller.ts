import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
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
import { ROLE_USER, MAX_VRM_SIZE_BYTES } from '../common/constants';
import { AvatarsService } from './avatars.service';
import { CreateAvatarDto, UpdateAvatarDto } from './dto/avatar.dto';
import { VrmUploadDto } from './dto/vrm-upload.dto';

@ApiTags('user-avatars')
@ApiBearerAuth()
@Controller('user/avatars')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(ROLE_USER)
export class UserAvatarsController {
  constructor(private readonly avatarsService: AvatarsService) {}

  @Get()
  list(@CurrentUser() user: JwtPayload) {
    return this.avatarsService.listForUser(user.sub);
  }

  @Post('vrm')
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: MAX_VRM_SIZE_BYTES } }))
  uploadVrm(
    @CurrentUser() user: JwtPayload,
    @UploadedFile() file: Express.Multer.File,
    @Body() dto: VrmUploadDto,
  ) {
    return this.avatarsService.createFromVrmUpload(user.sub, dto, file);
  }

  @Get(':id/model')
  async getModel(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Res() res: Response,
  ) {
    const { body, contentType } = await this.avatarsService.getModelForUser(user.sub, id);
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', 'inline');
    res.send(body);
  }

  @Get(':id/thumbnail')
  async getThumbnail(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Res() res: Response,
  ) {
    const { body, contentType } = await this.avatarsService.getThumbnailForUser(user.sub, id);
    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'private, max-age=300');
    res.send(body);
  }

  @Get(':id')
  getOne(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.avatarsService.findOneForUser(user.sub, id);
  }

  @Post()
  create(@CurrentUser() user: JwtPayload, @Body() dto: CreateAvatarDto) {
    return this.avatarsService.createForUser(user.sub, dto);
  }

  @Post(':id/reupload')
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: MAX_VRM_SIZE_BYTES } }))
  reuploadVrm(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.avatarsService.reuploadVrm(user.sub, id, file);
  }

  @Patch(':id')
  update(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() dto: UpdateAvatarDto,
  ) {
    return this.avatarsService.updateForUser(user.sub, id, dto);
  }

  @Delete(':id')
  delete(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.avatarsService.deleteAvatar(id, user.sub);
  }
}

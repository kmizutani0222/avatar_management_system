import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
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
import { CreatePartDto, UpdatePartDto } from './dto/part.dto';
import { PartsService } from './parts.service';

@ApiTags('admin-parts')
@ApiBearerAuth()
@Controller('admin/parts')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(ROLE_ADMIN)
export class AdminPartsController {
  constructor(private readonly partsService: PartsService) {}

  @Get()
  list(@Query('bodyType') bodyType?: AvatarBodyType) {
    return this.partsService.listAll(bodyType);
  }

  @Get(':id')
  getOne(@Param('id') id: string) {
    return this.partsService.findOne(id);
  }

  @Post()
  create(@Body() dto: CreatePartDto) {
    return this.partsService.create(dto);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdatePartDto) {
    return this.partsService.update(id, dto);
  }

  @Post(':id/asset')
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: MAX_VRM_SIZE_BYTES } }))
  uploadAsset(@Param('id') id: string, @UploadedFile() file: Express.Multer.File) {
    return this.partsService.uploadPartAsset(id, file);
  }

  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.partsService.delete(id);
  }
}

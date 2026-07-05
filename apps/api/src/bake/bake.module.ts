import { Module } from '@nestjs/common';
import { PartsModule } from '../parts/parts.module';
import { SettingsModule } from '../settings/settings.module';
import { AdminTemplatesController } from './admin-templates.controller';
import { BaseTemplateController } from './base-template.controller';
import { BaseTemplateService } from './base-template.service';
import { PartsBakeService } from './parts-bake.service';
import { TemplatesService } from './templates.service';
import { ThumbnailService } from './thumbnail.service';

@Module({
  imports: [PartsModule, SettingsModule],
  controllers: [AdminTemplatesController, BaseTemplateController],
  providers: [BaseTemplateService, PartsBakeService, TemplatesService, ThumbnailService],
  exports: [PartsBakeService, ThumbnailService, BaseTemplateService],
})
export class BakeModule {}

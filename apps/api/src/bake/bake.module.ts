import { Module } from '@nestjs/common';
import { PartsModule } from '../parts/parts.module';
import { PartsBakeService } from './parts-bake.service';
import { ThumbnailService } from './thumbnail.service';

@Module({
  imports: [PartsModule],
  providers: [PartsBakeService, ThumbnailService],
  exports: [PartsBakeService, ThumbnailService],
})
export class BakeModule {}

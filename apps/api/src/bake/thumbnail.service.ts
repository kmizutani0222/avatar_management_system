import { Injectable } from '@nestjs/common';
import { bakeDefaultVrmThumbnail } from '@ams/parts-baker';
import { StorageService } from '../storage/storage.service';

@Injectable()
export class ThumbnailService {
  constructor(private readonly storage: StorageService) {}

  async uploadDefaultVrmThumbnail(userId: string, name: string): Promise<string> {
    const buffer = await bakeDefaultVrmThumbnail(name);
    return this.storage.uploadThumbnail(userId, buffer);
  }
}

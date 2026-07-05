import { Injectable } from '@nestjs/common';
import { AvatarBodyType } from '@prisma/client';
import { AvatarBodyType as SharedBodyType, isGlbBodyType } from '@ams/shared-types';
import {
  bakeMergedAvatar,
  bakePartsThumbnail,
  resolvePartsFromSelections,
  type BakePartInput,
} from '@ams/parts-baker';
import type { PartsConfig } from '@ams/shared-types';
import { PartsService } from '../parts/parts.service';
import { StorageService } from '../storage/storage.service';
import { BaseTemplateService } from './base-template.service';

@Injectable()
export class PartsBakeService {
  constructor(
    private readonly partsService: PartsService,
    private readonly storage: StorageService,
    private readonly baseTemplate: BaseTemplateService,
  ) {}

  async bakeAndUpload(
    userId: string,
    bodyType: AvatarBodyType,
    partsConfig: PartsConfig,
    avatarName = 'AMS Avatar',
  ): Promise<{ modelUrl: string; thumbnailUrl: string }> {
    const catalog = await this.partsService.listPublic(bodyType);
    const resolved = resolvePartsFromSelections(catalog, partsConfig.selections);
    const baseBuffer = await this.baseTemplate.getBuffer(bodyType);

    const bakeParts: BakePartInput[] = [];
    for (const part of resolved) {
      let assetBuffer: Buffer | undefined;
      const assetKey = part.bake?.assetKey;
      if (assetKey) {
        const obj = await this.storage.getObjectOrNull(assetKey);
        assetBuffer = obj?.body;
      }
      bakeParts.push({
        name: part.name,
        preview: part.preview,
        bake: part.bake,
        assetBuffer,
      });
    }

    const buffer = await bakeMergedAvatar(
      bodyType as SharedBodyType,
      baseBuffer,
      bakeParts,
      avatarName,
    );
    const format = isGlbBodyType(bodyType as SharedBodyType) ? 'glb' : 'vrm';
    const modelUrl = await this.storage.uploadBakedModel(userId, buffer, format);
    const thumbnailBuffer = await bakePartsThumbnail(
      bodyType as SharedBodyType,
      resolved.map((part) => part.preview),
    );
    const thumbnailUrl = await this.storage.uploadThumbnail(userId, thumbnailBuffer);

    return { modelUrl, thumbnailUrl };
  }
}

import { BadRequestException, Injectable } from '@nestjs/common';
import { AvatarBodyType } from '@prisma/client';
import { AvatarBodyType as SharedBodyType } from '@ams/shared-types';
import { bakeBaseBody, findMissingVrmBones } from '@ams/parts-baker';
import { SettingsService } from '../settings/settings.service';
import { StorageService } from '../storage/storage.service';

@Injectable()
export class BaseTemplateService {
  constructor(
    private readonly storage: StorageService,
    private readonly settings: SettingsService,
  ) {}

  async getBuffer(bodyType: AvatarBodyType): Promise<Buffer> {
    const key = this.storage.baseTemplateKey(bodyType);
    const existing = await this.storage.getObjectOrNull(key);
    if (existing) {
      if (bodyType === 'humanoid_vrm') {
        const missing = findMissingVrmBones(existing.body);
        if (missing.length > 0) {
          throw new BadRequestException(
            `Base template is missing required VRM bones (${missing.join(', ')}). ` +
              'Ask an admin to reset the humanoid base template from the admin templates page.',
          );
        }
      }
      return existing.body;
    }

    const expressionSettings = await this.settings.getExpressionMorphSettings();
    const generated = await bakeBaseBody(bodyType as SharedBodyType, expressionSettings);
    await this.storage.uploadBaseTemplate(bodyType, generated);
    return generated;
  }

  requireBodyType(bodyType?: AvatarBodyType): AvatarBodyType {
    if (!bodyType) {
      throw new BadRequestException('bodyType query parameter is required');
    }
    return bodyType;
  }
}

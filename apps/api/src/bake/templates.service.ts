import { BadRequestException, Injectable } from '@nestjs/common';
import { AvatarBodyType } from '@prisma/client';
import { AvatarBodyType as SharedBodyType } from '@ams/shared-types';
import { bakeBaseBody, findMissingVrmBones } from '@ams/parts-baker';
import { StorageService } from '../storage/storage.service';
import { SettingsService } from '../settings/settings.service';
import { PrismaService } from '../prisma/prisma.module';

const ALL_BODY_TYPES: AvatarBodyType[] = ['humanoid_vrm', 'biped_mascot', 'quadruped'];

function templateCustomKey(bodyType: AvatarBodyType): string {
  return `template_custom_${bodyType}`;
}

@Injectable()
export class TemplatesService {
  constructor(
    private readonly storage: StorageService,
    private readonly settings: SettingsService,
    private readonly prisma: PrismaService,
  ) {}

  async listTemplateStatus() {
    return Promise.all(
      ALL_BODY_TYPES.map(async (bodyType) => {
        const key = this.storage.baseTemplateKey(bodyType);
        const existing = await this.storage.getObjectOrNull(key);
        const customRow = await this.prisma.systemSetting.findUnique({
          where: { key: templateCustomKey(bodyType) },
        });
        return {
          bodyType,
          key,
          hasTemplate: Boolean(existing),
          isCustomUpload: customRow?.value === true,
        };
      }),
    );
  }

  async uploadBaseTemplate(bodyType: AvatarBodyType, file: Express.Multer.File) {
    this.storage.validateGlbFile(file);
    if (bodyType === 'humanoid_vrm') {
      const missing = findMissingVrmBones(file.buffer);
      if (missing.length > 0) {
        throw new BadRequestException(
          `Humanoid base template must include VRM bone nodes. Missing: ${missing.join(', ')}`,
        );
      }
    }
    const key = await this.storage.uploadBaseTemplate(bodyType, file.buffer);
    await this.prisma.systemSetting.upsert({
      where: { key: templateCustomKey(bodyType) },
      create: { key: templateCustomKey(bodyType), value: true },
      update: { value: true },
    });
    return { bodyType, key, isCustomUpload: true };
  }

  async deleteBaseTemplate(bodyType: AvatarBodyType) {
    const key = this.storage.baseTemplateKey(bodyType);
    await this.storage.deleteObject(key);
    const expressionSettings = await this.settings.getExpressionMorphSettings();
    const generated = await bakeBaseBody(bodyType as SharedBodyType, expressionSettings);
    await this.storage.uploadBaseTemplate(bodyType, generated);
    await this.prisma.systemSetting.upsert({
      where: { key: templateCustomKey(bodyType) },
      create: { key: templateCustomKey(bodyType), value: false },
      update: { value: false },
    });
    return { bodyType, key, isCustomUpload: false, regenerated: true };
  }
}

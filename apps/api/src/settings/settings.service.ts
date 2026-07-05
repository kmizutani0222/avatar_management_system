import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import {
  DEFAULT_EXPRESSION_MORPH_SETTINGS,
  EXPRESSION_MORPH_SETTINGS_KEY,
  VRM_EXPRESSION_PRESETS,
  type ExpressionMorphSettings,
  type VrmExpressionPreset,
} from '@ams/shared-types';
import { PrismaService } from '../prisma/prisma.module';
import { StorageService } from '../storage/storage.service';

function clampScale(value: unknown, fallback: number): number {
  if (typeof value !== 'number' || Number.isNaN(value)) return fallback;
  return Math.min(2, Math.max(0.1, value));
}

function parseIntensityMap(value: unknown): Partial<Record<VrmExpressionPreset, number>> {
  if (!value || typeof value !== 'object') return {};
  const result: Partial<Record<VrmExpressionPreset, number>> = {};
  for (const name of VRM_EXPRESSION_PRESETS) {
    const raw = (value as Record<string, unknown>)[name];
    if (typeof raw === 'number' && !Number.isNaN(raw)) {
      result[name] = Math.min(2, Math.max(0, raw));
    }
  }
  return result;
}

function parseExpressionSettings(value: unknown): ExpressionMorphSettings {
  if (!value || typeof value !== 'object') return DEFAULT_EXPRESSION_MORPH_SETTINGS;
  const record = value as Partial<ExpressionMorphSettings>;
  return {
    mouthScale: clampScale(record.mouthScale, DEFAULT_EXPRESSION_MORPH_SETTINGS.mouthScale),
    eyeScale: clampScale(record.eyeScale, DEFAULT_EXPRESSION_MORPH_SETTINGS.eyeScale),
    browScale: clampScale(record.browScale, DEFAULT_EXPRESSION_MORPH_SETTINGS.browScale),
    expressionIntensity: parseIntensityMap(record.expressionIntensity),
  };
}

@Injectable()
export class SettingsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
  ) {}

  async getExpressionMorphSettings(): Promise<ExpressionMorphSettings> {
    const row = await this.prisma.systemSetting.findUnique({
      where: { key: EXPRESSION_MORPH_SETTINGS_KEY },
    });
    if (!row) return DEFAULT_EXPRESSION_MORPH_SETTINGS;
    return parseExpressionSettings(row.value);
  }

  async updateExpressionMorphSettings(
    dto: Partial<ExpressionMorphSettings>,
  ): Promise<ExpressionMorphSettings> {
    const current = await this.getExpressionMorphSettings();
    const next: ExpressionMorphSettings = parseExpressionSettings({
      mouthScale: dto.mouthScale ?? current.mouthScale,
      eyeScale: dto.eyeScale ?? current.eyeScale,
      browScale: dto.browScale ?? current.browScale,
      expressionIntensity: dto.expressionIntensity ?? current.expressionIntensity,
    });

    await this.prisma.systemSetting.upsert({
      where: { key: EXPRESSION_MORPH_SETTINGS_KEY },
      create: { key: EXPRESSION_MORPH_SETTINGS_KEY, value: next as unknown as Prisma.InputJsonValue },
      update: { value: next as unknown as Prisma.InputJsonValue },
    });

    await this.invalidateProceduralHumanoidTemplate();

    return next;
  }

  /**
   * Drop the cached procedural humanoid template so the next bake regenerates
   * it with the new morph settings. Custom-uploaded templates are kept.
   */
  private async invalidateProceduralHumanoidTemplate(): Promise<void> {
    const customRow = await this.prisma.systemSetting.findUnique({
      where: { key: 'template_custom_humanoid_vrm' },
    });
    if (customRow?.value === true) return;

    const key = this.storage.baseTemplateKey('humanoid_vrm');
    await this.storage.deleteObject(key).catch(() => undefined);
  }
}

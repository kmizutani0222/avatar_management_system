import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Avatar, Prisma } from '@prisma/client';
import { AvatarBodyType as SharedBodyType, isGlbBodyType, PartsConfig } from '@ams/shared-types';
import { PrismaService } from '../prisma/prisma.module';
import { StorageService } from '../storage/storage.service';
import { PartsBakeService } from '../bake/parts-bake.service';
import { ThumbnailService } from '../bake/thumbnail.service';
import { buildDefaultCapabilities, isEditableByAdmin } from '../common/constants';
import {
  AdminUpdateAvatarDto,
  AdminCreateAvatarDto,
  CreateAvatarDto,
  UpdateAvatarDto,
} from './dto/avatar.dto';
import { VrmUploadDto } from './dto/vrm-upload.dto';

@Injectable()
export class AvatarsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
    private readonly partsBake: PartsBakeService,
    private readonly thumbnails: ThumbnailService,
  ) {}

  /** External SDK: metadata only — no partsConfig (VRM is fetched via /model). */
  toExternalAvatar(avatar: Avatar) {
    return {
      id: avatar.id,
      name: avatar.name,
      bodyType: avatar.bodyType,
      sourceType: avatar.sourceType,
      format: avatar.format,
      status: avatar.status,
      externalEnabled: avatar.externalEnabled,
      adminApproved: avatar.adminApproved,
      hasModel: Boolean(avatar.modelUrl),
      hasThumbnail: Boolean(avatar.thumbnailUrl),
      createdAt: avatar.createdAt,
      updatedAt: avatar.updatedAt,
    };
  }

  async listForUser(userId: string) {
    return this.prisma.avatar.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async findOneForUser(userId: string, avatarId: string) {
    const avatar = await this.prisma.avatar.findFirst({
      where: { id: avatarId, userId },
    });
    if (!avatar) throw new NotFoundException('Avatar not found');
    return avatar;
  }

  async listForAdmin(filters?: { bodyType?: string; status?: string }) {
    return this.prisma.avatar.findMany({
      where: {
        ...(filters?.bodyType ? { bodyType: filters.bodyType as never } : {}),
        ...(filters?.status ? { status: filters.status as never } : {}),
      },
      include: { user: { select: { id: true, email: true, displayName: true } } },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async findOneForAdmin(avatarId: string) {
    const avatar = await this.prisma.avatar.findUnique({
      where: { id: avatarId },
      include: { user: { select: { id: true, email: true, displayName: true } } },
    });
    if (!avatar) throw new NotFoundException('Avatar not found');
    return avatar;
  }

  async createForAdmin(dto: AdminCreateAvatarDto) {
    const user = await this.prisma.user.findUnique({ where: { id: dto.userId } });
    if (!user) throw new NotFoundException('User not found');

    const capabilities = buildDefaultCapabilities(dto.bodyType as SharedBodyType);
    const format = isGlbBodyType(dto.bodyType as SharedBodyType) ? 'glb' : 'vrm';

    let modelUrl: string | undefined;
    let thumbnailUrl: string | undefined;
    if (dto.sourceType === 'parts' && dto.partsConfig) {
      const baked = await this.partsBake.bakeAndUpload(
        dto.userId,
        dto.bodyType,
        dto.partsConfig as unknown as PartsConfig,
        dto.name,
      );
      modelUrl = baked.modelUrl;
      thumbnailUrl = baked.thumbnailUrl;
    }

    return this.prisma.avatar.create({
      data: {
        userId: dto.userId,
        name: dto.name,
        bodyType: dto.bodyType,
        sourceType: dto.sourceType,
        format,
        modelUrl,
        thumbnailUrl,
        isAdminCreated: true,
        partsConfig: (dto.partsConfig as Prisma.InputJsonValue) ?? undefined,
        editorMetadata: (dto.editorMetadata as Prisma.InputJsonValue) ?? undefined,
        capabilities: capabilities as unknown as Prisma.InputJsonValue,
      },
      include: { user: { select: { id: true, email: true, displayName: true } } },
    });
  }

  async publishForAdmin(avatarId: string) {
    return this.updateForAdmin(avatarId, { adminApproved: true, status: 'active' });
  }

  async unpublishForAdmin(avatarId: string) {
    return this.updateForAdmin(avatarId, { adminApproved: false, status: 'admin_suspended' });
  }

  async findOneForExternal(userId: string, avatarId: string) {
    const avatar = await this.prisma.avatar.findFirst({
      where: {
        id: avatarId,
        userId,
        status: 'active',
        externalEnabled: true,
        adminApproved: true,
      },
    });
    if (!avatar) throw new NotFoundException('Avatar not found');
    return avatar;
  }

  async getModelForExternal(userId: string, avatarId: string) {
    const avatar = await this.findOneForExternal(userId, avatarId);
    if (!avatar.modelUrl) throw new NotFoundException('Model not found');

    const key = avatar.modelUrl.startsWith('avatars/')
      ? avatar.modelUrl
      : this.storage.extractKeyFromModelUrl(avatar.modelUrl);

    if (!key) throw new NotFoundException('Model storage key invalid');

    return this.storage.getObject(key);
  }

  async getPresignedModelForExternal(userId: string, avatarId: string) {
    const avatar = await this.findOneForExternal(userId, avatarId);
    if (!avatar.modelUrl) throw new NotFoundException('Model not found');

    const key = avatar.modelUrl.startsWith('avatars/')
      ? avatar.modelUrl
      : this.storage.extractKeyFromModelUrl(avatar.modelUrl);

    if (!key) throw new NotFoundException('Model storage key invalid');

    const url = await this.storage.getPresignedModelUrl(key);
    return { url, format: avatar.format };
  }

  async listForExternalApi(userId: string) {
    const avatars = await this.prisma.avatar.findMany({
      where: {
        userId,
        status: 'active',
        externalEnabled: true,
        adminApproved: true,
      },
      orderBy: { updatedAt: 'desc' },
    });
    return avatars.map((avatar) => this.toExternalAvatar(avatar));
  }

  async createForUser(userId: string, dto: CreateAvatarDto) {
    const capabilities = buildDefaultCapabilities(dto.bodyType as SharedBodyType);
    const format = isGlbBodyType(dto.bodyType as SharedBodyType) ? 'glb' : 'vrm';

    let modelUrl: string | undefined;
    let thumbnailUrl: string | undefined;
    if (dto.sourceType === 'parts' && dto.partsConfig) {
      const baked = await this.partsBake.bakeAndUpload(
        userId,
        dto.bodyType,
        dto.partsConfig as unknown as PartsConfig,
        dto.name,
      );
      modelUrl = baked.modelUrl;
      thumbnailUrl = baked.thumbnailUrl;
    }

    return this.prisma.avatar.create({
      data: {
        userId,
        name: dto.name,
        bodyType: dto.bodyType,
        sourceType: dto.sourceType,
        format,
        modelUrl,
        thumbnailUrl,
        partsConfig: (dto.partsConfig as Prisma.InputJsonValue) ?? undefined,
        editorMetadata: (dto.editorMetadata as Prisma.InputJsonValue) ?? undefined,
        capabilities: capabilities as unknown as Prisma.InputJsonValue,
      },
    });
  }

  async createFromVrmUpload(
    userId: string,
    dto: VrmUploadDto,
    file: Express.Multer.File,
  ) {
    if (dto.bodyType !== 'humanoid_vrm') {
      throw new ForbiddenException('VRM upload is only supported for humanoid_vrm');
    }

    const storageKey = await this.storage.uploadVrm(userId, file);
    const thumbnailUrl = await this.thumbnails.uploadDefaultVrmThumbnail(userId, dto.name);
    const capabilities = buildDefaultCapabilities(dto.bodyType as SharedBodyType);

    return this.prisma.avatar.create({
      data: {
        userId,
        name: dto.name,
        bodyType: dto.bodyType,
        sourceType: dto.sourceType,
        format: 'vrm',
        modelUrl: storageKey,
        thumbnailUrl,
        capabilities: capabilities as unknown as Prisma.InputJsonValue,
        editorMetadata: dto.sourceType === 'vrm_editor' ? { blendShapes: {} } : undefined,
      },
    });
  }

  async reuploadVrm(userId: string, avatarId: string, file: Express.Multer.File) {
    const avatar = await this.findOwnedAvatar(userId, avatarId);
    if (avatar.sourceType !== 'vrm_upload') {
      throw new ForbiddenException('Only vrm_upload avatars can be re-uploaded');
    }

    const storageKey = await this.storage.uploadVrm(userId, file);
    const thumbnailUrl = await this.thumbnails.uploadDefaultVrmThumbnail(userId, avatar.name);

    return this.prisma.avatar.update({
      where: { id: avatarId },
      data: { modelUrl: storageKey, thumbnailUrl },
    });
  }

  async getModelForUser(userId: string, avatarId: string) {
    const avatar = await this.findOwnedAvatar(userId, avatarId);
    if (!avatar.modelUrl) throw new NotFoundException('Model not found');

    const key = avatar.modelUrl.startsWith('avatars/')
      ? avatar.modelUrl
      : this.storage.extractKeyFromModelUrl(avatar.modelUrl);

    if (!key) throw new NotFoundException('Model storage key invalid');

    return this.storage.getObject(key);
  }

  async updateForUser(userId: string, avatarId: string, dto: UpdateAvatarDto) {
    const avatar = await this.findOwnedAvatar(userId, avatarId);

    if (avatar.sourceType === 'vrm_upload') {
      const hasDisallowed =
        dto.name !== undefined ||
        dto.partsConfig !== undefined ||
        dto.editorMetadata !== undefined;
      if (hasDisallowed) {
        throw new ForbiddenException('VRM upload avatars cannot be edited. Re-upload instead.');
      }
      if (dto.externalEnabled === undefined) {
        throw new ForbiddenException('VRM upload avatars cannot be edited. Re-upload instead.');
      }
    }

    if (avatar.sourceType === 'vrm_editor' && dto.partsConfig !== undefined) {
      throw new ForbiddenException('VRM editor avatars cannot change parts config');
    }

    let modelUrl: string | undefined;
    let thumbnailUrl: string | undefined;
    if (dto.partsConfig !== undefined && avatar.sourceType === 'parts') {
      const baked = await this.partsBake.bakeAndUpload(
        userId,
        avatar.bodyType,
        dto.partsConfig as unknown as PartsConfig,
        dto.name ?? avatar.name,
      );
      modelUrl = baked.modelUrl;
      thumbnailUrl = baked.thumbnailUrl;
    }

    return this.prisma.avatar.update({
      where: { id: avatarId },
      data: {
        ...(dto.name !== undefined ? { name: dto.name } : {}),
        ...(dto.partsConfig !== undefined
          ? { partsConfig: dto.partsConfig as Prisma.InputJsonValue }
          : {}),
        ...(dto.editorMetadata !== undefined
          ? { editorMetadata: dto.editorMetadata as Prisma.InputJsonValue }
          : {}),
        ...(dto.externalEnabled !== undefined ? { externalEnabled: dto.externalEnabled } : {}),
        ...(modelUrl !== undefined ? { modelUrl } : {}),
        ...(thumbnailUrl !== undefined ? { thumbnailUrl } : {}),
      },
    });
  }

  async updateForAdmin(avatarId: string, dto: AdminUpdateAvatarDto) {
    const avatar = await this.prisma.avatar.findUnique({ where: { id: avatarId } });
    if (!avatar) throw new NotFoundException('Avatar not found');

    if (!isEditableByAdmin(avatar.sourceType)) {
      const allowedKeys = ['adminApproved', 'status'];
      const hasDisallowed = Object.keys(dto).some(
        (k) => !allowedKeys.includes(k) && (dto as Record<string, unknown>)[k] !== undefined,
      );
      if (hasDisallowed) {
        throw new ForbiddenException('User-uploaded VRM avatars cannot be edited by admin');
      }
    }

    let modelUrl: string | undefined;
    let thumbnailUrl: string | undefined;
    if (dto.partsConfig !== undefined && avatar.sourceType === 'parts') {
      const baked = await this.partsBake.bakeAndUpload(
        avatar.userId,
        avatar.bodyType,
        dto.partsConfig as unknown as PartsConfig,
        dto.name ?? avatar.name,
      );
      modelUrl = baked.modelUrl;
      thumbnailUrl = baked.thumbnailUrl;
    }

    return this.prisma.avatar.update({
      where: { id: avatarId },
      data: {
        ...(dto.name !== undefined ? { name: dto.name } : {}),
        ...(dto.partsConfig !== undefined
          ? { partsConfig: dto.partsConfig as Prisma.InputJsonValue }
          : {}),
        ...(dto.editorMetadata !== undefined
          ? { editorMetadata: dto.editorMetadata as Prisma.InputJsonValue }
          : {}),
        ...(dto.externalEnabled !== undefined ? { externalEnabled: dto.externalEnabled } : {}),
        ...(dto.adminApproved !== undefined ? { adminApproved: dto.adminApproved } : {}),
        ...(dto.status !== undefined ? { status: dto.status as never } : {}),
        ...(modelUrl !== undefined ? { modelUrl } : {}),
        ...(thumbnailUrl !== undefined ? { thumbnailUrl } : {}),
      },
    });
  }

  async getThumbnailForUser(userId: string, avatarId: string) {
    const avatar = await this.findOwnedAvatar(userId, avatarId);
    return this.getThumbnailObject(avatar);
  }

  async getThumbnailForExternal(userId: string, avatarId: string) {
    const avatar = await this.findOneForExternal(userId, avatarId);
    return this.getThumbnailObject(avatar);
  }

  private getThumbnailObject(avatar: Avatar) {
    if (!avatar.thumbnailUrl) throw new NotFoundException('Thumbnail not found');

    const key = avatar.thumbnailUrl.startsWith('thumbnails/')
      ? avatar.thumbnailUrl
      : this.storage.extractKeyFromModelUrl(avatar.thumbnailUrl);

    if (!key) throw new NotFoundException('Thumbnail storage key invalid');

    return this.storage.getObject(key);
  }

  async deleteAvatar(avatarId: string, userId?: string) {
    const avatar = await this.prisma.avatar.findUnique({ where: { id: avatarId } });
    if (!avatar) throw new NotFoundException('Avatar not found');
    if (userId && avatar.userId !== userId) {
      throw new ForbiddenException('Not your avatar');
    }

    await this.prisma.avatar.delete({ where: { id: avatarId } });
    return { deleted: true };
  }

  private async findOwnedAvatar(userId: string, avatarId: string) {
    const avatar = await this.prisma.avatar.findFirst({
      where: { id: avatarId, userId },
    });
    if (!avatar) throw new NotFoundException('Avatar not found');
    return avatar;
  }
}

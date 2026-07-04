import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { AvatarBodyType as SharedBodyType } from '@ams/shared-types';
import { PrismaService } from '../prisma/prisma.module';
import { StorageService } from '../storage/storage.service';
import { buildDefaultCapabilities, isEditableByAdmin } from '../common/constants';
import {
  AdminUpdateAvatarDto,
  CreateAvatarDto,
  UpdateAvatarDto,
} from './dto/avatar.dto';
import { VrmUploadDto } from './dto/vrm-upload.dto';

@Injectable()
export class AvatarsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
  ) {}

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

  async listForExternalApi(userId: string) {
    return this.prisma.avatar.findMany({
      where: {
        userId,
        status: 'active',
        externalEnabled: true,
        adminApproved: true,
      },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async createForUser(userId: string, dto: CreateAvatarDto) {
    const capabilities = buildDefaultCapabilities(dto.bodyType as SharedBodyType);
    const format = dto.bodyType === 'biped_mascot' ? 'glb' : 'vrm';

    return this.prisma.avatar.create({
      data: {
        userId,
        name: dto.name,
        bodyType: dto.bodyType,
        sourceType: dto.sourceType,
        format,
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
    const capabilities = buildDefaultCapabilities(dto.bodyType as SharedBodyType);

    return this.prisma.avatar.create({
      data: {
        userId,
        name: dto.name,
        bodyType: dto.bodyType,
        sourceType: dto.sourceType,
        format: 'vrm',
        modelUrl: storageKey,
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

    return this.prisma.avatar.update({
      where: { id: avatarId },
      data: { modelUrl: storageKey },
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
      throw new ForbiddenException('VRM upload avatars cannot be edited. Re-upload instead.');
    }

    if (avatar.sourceType === 'vrm_editor' && dto.partsConfig !== undefined) {
      throw new ForbiddenException('VRM editor avatars cannot change parts config');
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
      },
    });
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

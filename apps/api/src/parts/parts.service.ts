import { Injectable, NotFoundException } from '@nestjs/common';
import { AvatarBodyType, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.module';
import { StorageService } from '../storage/storage.service';
import { CreatePartDto, UpdatePartDto } from './dto/part.dto';

@Injectable()
export class PartsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
  ) {}

  listPublic(bodyType?: AvatarBodyType) {
    return this.prisma.avatarPart.findMany({
      where: {
        isActive: true,
        ...(bodyType ? { bodyType } : {}),
      },
      orderBy: [{ category: 'asc' }, { sortOrder: 'asc' }],
    });
  }

  listAll(bodyType?: AvatarBodyType) {
    return this.prisma.avatarPart.findMany({
      where: bodyType ? { bodyType } : undefined,
      orderBy: [{ bodyType: 'asc' }, { category: 'asc' }, { sortOrder: 'asc' }],
    });
  }

  async findOne(id: string) {
    const part = await this.prisma.avatarPart.findUnique({ where: { id } });
    if (!part) throw new NotFoundException('Part not found');
    return part;
  }

  create(dto: CreatePartDto) {
    return this.prisma.avatarPart.create({
      data: {
        bodyType: dto.bodyType,
        category: dto.category,
        name: dto.name,
        metadata: (dto.metadata ?? {}) as Prisma.InputJsonValue,
        sortOrder: dto.sortOrder ?? 0,
        isActive: dto.isActive ?? true,
      },
    });
  }

  async update(id: string, dto: UpdatePartDto) {
    await this.findOne(id);
    return this.prisma.avatarPart.update({
      where: { id },
      data: {
        ...(dto.name !== undefined ? { name: dto.name } : {}),
        ...(dto.metadata !== undefined
          ? { metadata: dto.metadata as Prisma.InputJsonValue }
          : {}),
        ...(dto.sortOrder !== undefined ? { sortOrder: dto.sortOrder } : {}),
        ...(dto.isActive !== undefined ? { isActive: dto.isActive } : {}),
      },
    });
  }

  async delete(id: string) {
    await this.findOne(id);
    await this.prisma.avatarPart.delete({ where: { id } });
    return { deleted: true };
  }

  async uploadPartAsset(id: string, file: Express.Multer.File) {
    const part = await this.findOne(id);
    this.storage.validateGlbFile(file);

    const assetKey = await this.storage.uploadPartAsset(id, file.buffer);
    const metadata = (part.metadata && typeof part.metadata === 'object'
      ? { ...(part.metadata as Record<string, unknown>) }
      : {}) as Record<string, unknown>;

    const bake = (metadata.bake && typeof metadata.bake === 'object'
      ? { ...(metadata.bake as Record<string, unknown>) }
      : {}) as Record<string, unknown>;
    bake.assetKey = assetKey;
    metadata.bake = bake;

    return this.prisma.avatarPart.update({
      where: { id },
      data: { metadata: metadata as Prisma.InputJsonValue },
    });
  }
}

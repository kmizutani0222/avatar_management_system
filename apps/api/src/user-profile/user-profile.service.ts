import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.module';
import { StorageService } from '../storage/storage.service';
import { UpdateUserProfileDto } from './dto/update-user-profile.dto';

function normalizeXUsername(raw?: string | null): string | null {
  if (raw === undefined) return undefined as unknown as null;
  if (raw === null) return null;
  const trimmed = raw.trim().replace(/^@/, '');
  return trimmed.length > 0 ? trimmed : null;
}

@Injectable()
export class UserProfileService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
  ) {}

  private toProfile(user: {
    id: string;
    email: string;
    displayName: string;
    xUsername: string | null;
    profileMessage: string | null;
    profileIconUrl: string | null;
  }) {
    return {
      id: user.id,
      email: user.email,
      role: 'user' as const,
      displayName: user.displayName,
      xUsername: user.xUsername,
      profileMessage: user.profileMessage,
      hasProfileIcon: Boolean(user.profileIconUrl),
    };
  }

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.isActive) throw new NotFoundException('User not found');
    return this.toProfile(user);
  }

  async updateProfile(userId: string, dto: UpdateUserProfileDto) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.isActive) throw new NotFoundException('User not found');

    const xUsername =
      dto.xUsername !== undefined ? normalizeXUsername(dto.xUsername) : undefined;

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: {
        ...(dto.displayName !== undefined ? { displayName: dto.displayName.trim() } : {}),
        ...(dto.profileMessage !== undefined
          ? { profileMessage: dto.profileMessage?.trim() || null }
          : {}),
        ...(xUsername !== undefined ? { xUsername } : {}),
      },
    });

    return this.toProfile(updated);
  }

  async uploadProfileIcon(userId: string, file: Express.Multer.File) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.isActive) throw new NotFoundException('User not found');

    if (user.profileIconUrl) {
      await this.storage.deleteObject(user.profileIconUrl).catch(() => undefined);
    }

    const key = await this.storage.uploadProfileIcon(userId, file);
    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: { profileIconUrl: key },
    });

    return this.toProfile(updated);
  }

  async getProfileIcon(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user?.profileIconUrl) throw new NotFoundException('Profile icon not found');
    return this.storage.getObject(user.profileIconUrl);
  }
}

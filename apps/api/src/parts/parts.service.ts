import { Injectable } from '@nestjs/common';
import { AvatarBodyType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.module';

@Injectable()
export class PartsService {
  constructor(private readonly prisma: PrismaService) {}

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
}

import { ConflictException, Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.module';
import { CreateAdminDto } from './dto/create-admin.dto';

@Injectable()
export class AdminAdminsService {
  constructor(private readonly prisma: PrismaService) {}

  async list() {
    const admins = await this.prisma.admin.findMany({
      orderBy: { createdAt: 'asc' },
      select: {
        id: true,
        email: true,
        name: true,
        level: true,
        isActive: true,
        createdAt: true,
      },
    });
    return admins.map((a) => ({
      ...a,
      createdAt: a.createdAt.toISOString(),
    }));
  }

  async create(dto: CreateAdminDto) {
    const existing = await this.prisma.admin.findUnique({ where: { email: dto.email } });
    if (existing) throw new ConflictException('Email already registered');

    const passwordHash = await bcrypt.hash(dto.password, 10);
    const admin = await this.prisma.admin.create({
      data: {
        email: dto.email,
        passwordHash,
        name: dto.name.trim(),
        level: 'standard',
      },
      select: {
        id: true,
        email: true,
        name: true,
        level: true,
        isActive: true,
        createdAt: true,
      },
    });

    return { ...admin, createdAt: admin.createdAt.toISOString() };
  }
}

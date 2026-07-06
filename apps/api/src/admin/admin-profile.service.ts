import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.module';
import { UpdateAdminProfileDto } from './dto/admin-profile.dto';

@Injectable()
export class AdminProfileService {
  constructor(private readonly prisma: PrismaService) {}

  private toProfile(admin: {
    id: string;
    email: string;
    name: string;
    level: 'super' | 'standard';
  }) {
    return {
      id: admin.id,
      email: admin.email,
      role: 'admin' as const,
      displayName: admin.name,
      adminLevel: admin.level,
    };
  }

  async getProfile(adminId: string) {
    const admin = await this.prisma.admin.findUnique({ where: { id: adminId } });
    if (!admin?.isActive) throw new NotFoundException('Admin not found');
    return this.toProfile(admin);
  }

  async updateProfile(adminId: string, dto: UpdateAdminProfileDto) {
    const admin = await this.prisma.admin.findUnique({ where: { id: adminId } });
    if (!admin?.isActive) throw new NotFoundException('Admin not found');

    const updated = await this.prisma.admin.update({
      where: { id: adminId },
      data: {
        ...(dto.name !== undefined ? { name: dto.name.trim() } : {}),
      },
    });

    return this.toProfile(updated);
  }
}

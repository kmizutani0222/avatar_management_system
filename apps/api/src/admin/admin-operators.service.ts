import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.module';
import { AdminUpdateOperatorDto } from './dto/admin-operator.dto';

@Injectable()
export class AdminOperatorsService {
  constructor(private readonly prisma: PrismaService) {}

  list() {
    return this.prisma.operator.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        _count: { select: { apiKeys: true, oauthClients: true } },
      },
    });
  }

  async findOne(id: string) {
    const operator = await this.prisma.operator.findUnique({
      where: { id },
      include: {
        _count: { select: { apiKeys: true, oauthClients: true } },
      },
    });
    if (!operator) throw new NotFoundException('Operator not found');
    return operator;
  }

  async updateStatus(id: string, dto: AdminUpdateOperatorDto) {
    await this.findOne(id);
    return this.prisma.operator.update({
      where: { id },
      data: { status: dto.status },
      include: {
        _count: { select: { apiKeys: true, oauthClients: true } },
      },
    });
  }
}

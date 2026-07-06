import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.module';
import { UpdateOperatorProfileDto } from './dto/operator-profile.dto';

@Injectable()
export class OperatorProfileService {
  constructor(private readonly prisma: PrismaService) {}

  private toProfile(operator: {
    id: string;
    email: string;
    companyName: string;
    status: string;
  }) {
    return {
      id: operator.id,
      email: operator.email,
      role: 'operator' as const,
      companyName: operator.companyName,
      status: operator.status,
    };
  }

  async getProfile(operatorId: string) {
    const operator = await this.prisma.operator.findUnique({ where: { id: operatorId } });
    if (!operator || operator.status === 'suspended') {
      throw new NotFoundException('Operator not found');
    }
    return this.toProfile(operator);
  }

  async updateProfile(operatorId: string, dto: UpdateOperatorProfileDto) {
    const operator = await this.prisma.operator.findUnique({ where: { id: operatorId } });
    if (!operator || operator.status === 'suspended') {
      throw new NotFoundException('Operator not found');
    }

    const updated = await this.prisma.operator.update({
      where: { id: operatorId },
      data: {
        ...(dto.companyName !== undefined ? { companyName: dto.companyName.trim() } : {}),
      },
    });

    return this.toProfile(updated);
  }
}

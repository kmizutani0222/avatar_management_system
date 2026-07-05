import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.module';
import { generateApiKey, hashSecret } from '../common/crypto.util';
import { CreateApiKeyDto } from './dto/api-key.dto';

@Injectable()
export class ApiKeysService {
  constructor(private readonly prisma: PrismaService) {}

  private async assertActiveOperator(operatorId: string) {
    const operator = await this.prisma.operator.findUnique({ where: { id: operatorId } });
    if (!operator || operator.status !== 'active') {
      throw new ForbiddenException('Operator account is not active');
    }
  }

  async list(operatorId: string) {
    return this.prisma.apiKey.findMany({
      where: { operatorId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        rateLimit: true,
        revokedAt: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async create(operatorId: string, dto: CreateApiKeyDto) {
    await this.assertActiveOperator(operatorId);

    const rawKey = generateApiKey();
    const keyHash = hashSecret(rawKey);

    const record = await this.prisma.apiKey.create({
      data: {
        operatorId,
        name: dto.name,
        keyHash,
        rateLimit: dto.rateLimit ?? 1000,
        allowedOrigins: (dto.allowedOrigins ?? []) as Prisma.InputJsonValue,
      },
      select: {
        id: true,
        name: true,
        rateLimit: true,
        createdAt: true,
      },
    });

    return { ...record, apiKey: rawKey };
  }

  async revoke(operatorId: string, keyId: string) {
    const record = await this.prisma.apiKey.findFirst({
      where: { id: keyId, operatorId },
    });
    if (!record) throw new NotFoundException('API key not found');
    if (record.revokedAt) return { revoked: true };

    await this.prisma.apiKey.update({
      where: { id: keyId },
      data: { revokedAt: new Date() },
    });
    return { revoked: true };
  }
}

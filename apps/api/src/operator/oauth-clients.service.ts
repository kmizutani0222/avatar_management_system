import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.module';
import {
  generateClientId,
  generateClientSecret,
  hashSecret,
} from '../common/crypto.util';
import { CreateOAuthClientDto } from './dto/oauth-client.dto';

@Injectable()
export class OAuthClientsService {
  constructor(private readonly prisma: PrismaService) {}

  private async assertActiveOperator(operatorId: string) {
    const operator = await this.prisma.operator.findUnique({ where: { id: operatorId } });
    if (!operator || operator.status !== 'active') {
      throw new ForbiddenException('Operator account is not active');
    }
  }

  list(operatorId: string) {
    return this.prisma.oAuthClient.findMany({
      where: { operatorId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        clientId: true,
        name: true,
        redirectUris: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async create(operatorId: string, dto: CreateOAuthClientDto) {
    await this.assertActiveOperator(operatorId);

    const clientId = generateClientId();
    const clientSecret = generateClientSecret();

    const record = await this.prisma.oAuthClient.create({
      data: {
        operatorId,
        clientId,
        clientSecretHash: hashSecret(clientSecret),
        name: dto.name,
        redirectUris: dto.redirectUris ?? [],
      },
      select: {
        id: true,
        clientId: true,
        name: true,
        redirectUris: true,
        isActive: true,
        createdAt: true,
      },
    });

    return { ...record, clientSecret };
  }

  async deactivate(operatorId: string, clientId: string) {
    const record = await this.prisma.oAuthClient.findFirst({
      where: { id: clientId, operatorId },
    });
    if (!record) throw new NotFoundException('OAuth client not found');

    return this.prisma.oAuthClient.update({
      where: { id: clientId },
      data: { isActive: false },
      select: {
        id: true,
        clientId: true,
        name: true,
        isActive: true,
      },
    });
  }

  async findByClientId(clientId: string) {
    return this.prisma.oAuthClient.findUnique({
      where: { clientId },
      include: { operator: true },
    });
  }
}

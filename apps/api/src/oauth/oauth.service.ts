import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.module';
import {
  generateAuthCode,
  generateOAuthAccessToken,
  hashSecret,
} from '../common/crypto.util';
import { OAuthClientsService } from '../operator/oauth-clients.service';
import { RedisService } from '../redis/redis.service';
import { RateLimitService } from '../redis/rate-limit.service';

interface PendingAuthCode {
  userId: string;
  clientId: string;
}

@Injectable()
export class OAuthService {
  private readonly pendingCodes = new Map<string, PendingAuthCode & { expiresAt: number }>();
  private readonly codeTtlMs = 10 * 60 * 1000;
  private readonly tokenTtlMs = 60 * 60 * 1000;

  constructor(
    private readonly prisma: PrismaService,
    private readonly oauthClientsService: OAuthClientsService,
    private readonly redis: RedisService,
    private readonly rateLimit: RateLimitService,
  ) {}

  private codeKey(code: string) {
    return `oauth:code:${code}`;
  }

  private async storePendingCode(code: string, payload: PendingAuthCode) {
    const ttlSeconds = this.codeTtlMs / 1000;
    if (this.redis.isReady()) {
      await this.redis.setJson(this.codeKey(code), payload, ttlSeconds);
      return;
    }
    this.pendingCodes.set(code, { ...payload, expiresAt: Date.now() + this.codeTtlMs });
  }

  private async consumePendingCode(code: string, clientId: string): Promise<PendingAuthCode | null> {
    if (this.redis.isReady()) {
      const payload = await this.redis.getJson<PendingAuthCode>(this.codeKey(code));
      if (!payload || payload.clientId !== clientId) return null;
      await this.redis.deleteKey(this.codeKey(code));
      return payload;
    }

    const pending = this.pendingCodes.get(code);
    if (!pending || pending.expiresAt < Date.now() || pending.clientId !== clientId) {
      return null;
    }
    this.pendingCodes.delete(code);
    return { userId: pending.userId, clientId: pending.clientId };
  }

  async authorize(userId: string, clientId: string) {
    const client = await this.oauthClientsService.findByClientId(clientId);
    if (!client || !client.isActive || client.operator.status !== 'active') {
      throw new UnauthorizedException('Invalid OAuth client');
    }

    const code = generateAuthCode();
    await this.storePendingCode(code, { userId, clientId });

    return {
      code,
      expiresIn: this.codeTtlMs / 1000,
    };
  }

  async exchangeToken(
    grantType: string,
    code: string,
    clientId: string,
    clientSecret: string,
    clientIp = 'unknown',
  ) {
    if (grantType !== 'authorization_code') {
      throw new BadRequestException('Unsupported grant_type');
    }

    await this.rateLimit.enforceOAuthTokenLimit(clientId, clientIp);

    const client = await this.oauthClientsService.findByClientId(clientId);
    if (!client || !client.isActive || client.operator.status !== 'active') {
      throw new UnauthorizedException('Invalid client credentials');
    }

    const hashedInput = hashSecret(clientSecret);
    if (hashedInput !== client.clientSecretHash) {
      throw new UnauthorizedException('Invalid client credentials');
    }

    const pending = await this.consumePendingCode(code, clientId);
    if (!pending) {
      throw new UnauthorizedException('Invalid or expired authorization code');
    }

    const accessToken = generateOAuthAccessToken();
    const tokenHash = hashSecret(accessToken);
    const expiresAt = new Date(Date.now() + this.tokenTtlMs);

    await this.prisma.oAuthToken.create({
      data: {
        userId: pending.userId,
        clientId,
        tokenHash,
        scopes: ['avatars:read'],
        expiresAt,
      },
    });

    return {
      access_token: accessToken,
      token_type: 'Bearer',
      expires_in: this.tokenTtlMs / 1000,
      scope: 'avatars:read',
    };
  }
}

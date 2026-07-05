import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.module';
import { hashSecret } from '../../common/crypto.util';
import { OriginCheckService } from '../../common/origin-check.service';
import { RateLimitService } from '../../redis/rate-limit.service';
import type { ApiKeyAuthContext } from '../interfaces/external-auth.interface';

@Injectable()
export class ApiKeyGuard implements CanActivate {
  constructor(
    private readonly prisma: PrismaService,
    private readonly rateLimit: RateLimitService,
    private readonly originCheck: OriginCheckService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<{
      headers: Record<string, string | string[] | undefined>;
      query: Record<string, string | undefined>;
      externalAuth?: ApiKeyAuthContext;
    }>();

    const rawKey = req.headers['x-api-key'];
    const apiKey = typeof rawKey === 'string' ? rawKey : undefined;
    if (!apiKey) throw new UnauthorizedException('X-API-Key header required');

    const userId =
      (typeof req.headers['x-user-id'] === 'string' ? req.headers['x-user-id'] : undefined) ??
      req.query.userId;
    if (!userId) throw new UnauthorizedException('X-User-Id header or userId query required');

    const keyHash = hashSecret(apiKey);
    const record = await this.prisma.apiKey.findFirst({
      where: { keyHash, revokedAt: null },
      include: { operator: true },
    });

    if (!record || record.operator.status !== 'active') {
      throw new UnauthorizedException('Invalid API key');
    }

    const origin =
      typeof req.headers.origin === 'string'
        ? req.headers.origin
        : typeof req.headers.referer === 'string'
          ? (() => {
              try {
                return new URL(req.headers.referer).origin;
              } catch {
                return undefined;
              }
            })()
          : undefined;

    try {
      this.originCheck.assertAllowedOrigin(record.allowedOrigins, origin);
    } catch (err) {
      if (err instanceof ForbiddenException) throw err;
      throw new ForbiddenException('Origin not allowed for this API key');
    }

    await this.rateLimit.enforceApiKeyLimit(record.id, record.rateLimit);

    req.externalAuth = {
      type: 'api_key',
      operatorId: record.operatorId,
      apiKeyId: record.id,
      userId,
    };
    return true;
  }
}

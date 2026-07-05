import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.module';
import { hashSecret } from '../../common/crypto.util';
import type { OAuthAuthContext } from '../interfaces/external-auth.interface';

@Injectable()
export class OAuthTokenGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<{
      headers: Record<string, string | string[] | undefined>;
      externalAuth?: OAuthAuthContext;
    }>();

    const rawAuth = req.headers.authorization;
    const authHeader = typeof rawAuth === 'string' ? rawAuth : undefined;
    if (!authHeader?.startsWith('Bearer ')) {
      throw new UnauthorizedException('Bearer token required');
    }

    const token = authHeader.slice(7);
    const tokenHash = hashSecret(token);

    const record = await this.prisma.oAuthToken.findFirst({
      where: {
        tokenHash,
        expiresAt: { gt: new Date() },
      },
    });

    if (!record) throw new UnauthorizedException('Invalid or expired token');

    const scopes = Array.isArray(record.scopes)
      ? (record.scopes as string[])
      : ['avatars:read'];

    req.externalAuth = {
      type: 'oauth',
      userId: record.userId,
      clientId: record.clientId,
      scopes,
    };
    return true;
  }
}

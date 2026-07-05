import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../prisma/prisma.module';
import { ROLE_USER } from '../../common/constants';
import type { JwtPayload } from '../interfaces/jwt-payload.interface';
import type { SessionAuthContext } from '../interfaces/external-auth.interface';

/**
 * Accepts AMS user-portal JWT (login token) on external /api/v1/* routes so
 * logged-in users can try the SDK against their own external-enabled avatars.
 */
@Injectable()
export class UserSessionExternalGuard implements CanActivate {
  constructor(
    private readonly jwt: JwtService,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<{
      headers: Record<string, string | string[] | undefined>;
      externalAuth?: SessionAuthContext;
    }>();

    const rawAuth = req.headers.authorization;
    const authHeader = typeof rawAuth === 'string' ? rawAuth : undefined;
    if (!authHeader?.startsWith('Bearer ')) {
      throw new UnauthorizedException('Bearer token required');
    }

    let payload: JwtPayload;
    try {
      payload = await this.jwt.verifyAsync<JwtPayload>(authHeader.slice(7));
    } catch {
      throw new UnauthorizedException('Invalid or expired token');
    }

    if (payload.role !== ROLE_USER || !payload.sub) {
      throw new UnauthorizedException('User session token required');
    }

    const user = await this.prisma.user.findUnique({ where: { id: payload.sub } });
    if (!user?.isActive) {
      throw new UnauthorizedException('User account inactive');
    }

    req.externalAuth = {
      type: 'session',
      userId: user.id,
    };
    return true;
  }
}

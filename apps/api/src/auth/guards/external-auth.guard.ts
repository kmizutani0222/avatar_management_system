import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ApiKeyGuard } from './api-key.guard';
import { OAuthTokenGuard } from './oauth-token.guard';
import { UserSessionExternalGuard } from './user-session-external.guard';

/** Accepts OAuth Bearer token, user-portal JWT, or API key + user id */
@Injectable()
export class ExternalAuthGuard implements CanActivate {
  constructor(
    private readonly oauthGuard: OAuthTokenGuard,
    private readonly userSessionGuard: UserSessionExternalGuard,
    private readonly apiKeyGuard: ApiKeyGuard,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<{ headers: Record<string, string | string[] | undefined> }>();
    const rawAuth = req.headers.authorization;
    const authHeader = typeof rawAuth === 'string' ? rawAuth : undefined;

    if (authHeader?.startsWith('Bearer ')) {
      try {
        return await this.oauthGuard.canActivate(context);
      } catch {
        return this.userSessionGuard.canActivate(context);
      }
    }

    if (req.headers['x-api-key']) {
      return this.apiKeyGuard.canActivate(context);
    }

    throw new UnauthorizedException('OAuth Bearer token or X-API-Key required');
  }
}

import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ApiKeyGuard } from './api-key.guard';
import { OAuthTokenGuard } from './oauth-token.guard';

/** Accepts OAuth Bearer token or API key + user id */
@Injectable()
export class ExternalAuthGuard implements CanActivate {
  constructor(
    private readonly oauthGuard: OAuthTokenGuard,
    private readonly apiKeyGuard: ApiKeyGuard,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<{ headers: Record<string, string | string[] | undefined> }>();
    const rawAuth = req.headers.authorization;
    const authHeader = typeof rawAuth === 'string' ? rawAuth : undefined;

    if (authHeader?.startsWith('Bearer ')) {
      return this.oauthGuard.canActivate(context);
    }

    if (req.headers['x-api-key']) {
      return this.apiKeyGuard.canActivate(context);
    }

    throw new UnauthorizedException('OAuth Bearer token or X-API-Key required');
  }
}

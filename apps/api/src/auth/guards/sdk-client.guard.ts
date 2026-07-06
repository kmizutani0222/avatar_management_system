import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';

/** External avatar endpoints accept requests only from @ams/sdk-web. */
export const AMS_SDK_CLIENT_HEADER = 'x-ams-sdk-client';
export const AMS_SDK_CLIENT_PREFIX = '@ams/sdk-web/';

@Injectable()
export class SdkClientGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<{
      headers: Record<string, string | string[] | undefined>;
    }>();
    const raw = req.headers[AMS_SDK_CLIENT_HEADER];
    const header = typeof raw === 'string' ? raw : undefined;

    if (!header?.startsWith(AMS_SDK_CLIENT_PREFIX)) {
      throw new ForbiddenException(
        'External avatar API is SDK-only. Use @ams/sdk-web AmsClient instead of direct HTTP calls.',
      );
    }

    return true;
  }
}

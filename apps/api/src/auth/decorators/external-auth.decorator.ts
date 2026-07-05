import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { ExternalAuthContext } from '../interfaces/external-auth.interface';

export const ExternalAuth = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): ExternalAuthContext => {
    const req = ctx.switchToHttp().getRequest<{ externalAuth?: ExternalAuthContext }>();
    return req.externalAuth!;
  },
);

export const ExternalUserId = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): string => {
    const req = ctx.switchToHttp().getRequest<{ externalAuth?: ExternalAuthContext }>();
    const auth = req.externalAuth;
    if (!auth) throw new Error('External auth context missing');
    return auth.type === 'oauth' ? auth.userId : auth.userId;
  },
);

import { ForbiddenException, Injectable } from '@nestjs/common';

@Injectable()
export class OriginCheckService {
  /** Empty allowedOrigins = allow all (backward compatible). */
  assertAllowedOrigin(allowedOrigins: unknown, originHeader?: string): void {
    if (!Array.isArray(allowedOrigins) || allowedOrigins.length === 0) return;

    const allowed = allowedOrigins.filter((v): v is string => typeof v === 'string');
    if (allowed.length === 0) return;

    if (!originHeader) {
      throw new ForbiddenException('Origin header required for this API key');
    }

    const normalized = originHeader.replace(/\/$/, '');
    const ok = allowed.some((entry) => entry.replace(/\/$/, '') === normalized);
    if (!ok) {
      throw new ForbiddenException('Origin not allowed for this API key');
    }
  }
}

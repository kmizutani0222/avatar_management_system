import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { RedisService } from './redis.service';

@Injectable()
export class RateLimitService {
  constructor(private readonly redis: RedisService) {}

  /** Enforce hourly limit per API key (matches operator UI "/h" label). */
  async enforceApiKeyLimit(apiKeyId: string, limit: number): Promise<void> {
    const hourBucket = Math.floor(Date.now() / 3_600_000);
    const key = `rate:apikey:${apiKeyId}:${hourBucket}`;
    const allowed = await this.redis.incrementWithinLimit(key, limit, 3600);
    if (!allowed) {
      throw new HttpException(
        { statusCode: 429, message: 'API rate limit exceeded', error: 'Too Many Requests' },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
  }

  /** Limit OAuth token exchange attempts per client + IP. */
  async enforceOAuthTokenLimit(clientId: string, ip: string, limit = 30): Promise<void> {
    const minuteBucket = Math.floor(Date.now() / 60_000);
    const key = `rate:oauth:token:${clientId}:${ip}:${minuteBucket}`;
    const allowed = await this.redis.incrementWithinLimit(key, limit, 60);
    if (!allowed) {
      throw new HttpException(
        { statusCode: 429, message: 'Too many token requests', error: 'Too Many Requests' },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
  }
}

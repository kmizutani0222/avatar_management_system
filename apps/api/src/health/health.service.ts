import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.module';
import { RedisService } from '../redis/redis.service';
import { StorageService } from '../storage/storage.service';

export type HealthStatus = 'ok' | 'degraded' | 'error';

@Injectable()
export class HealthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly storage: StorageService,
  ) {}

  liveness() {
    return {
      status: 'ok' as const,
      service: 'avatar-management-api',
      timestamp: new Date().toISOString(),
    };
  }

  async readiness() {
    const [database, redis, storage] = await Promise.all([
      this.checkDatabase(),
      this.checkRedis(),
      this.checkStorage(),
    ]);

    const checks = { database, redis, storage };
    const allOk = Object.values(checks).every((c) => c.status === 'ok');
    const anyError = Object.values(checks).some((c) => c.status === 'error');

    return {
      status: allOk ? ('ok' as const) : anyError ? ('error' as const) : ('degraded' as const),
      service: 'avatar-management-api',
      timestamp: new Date().toISOString(),
      checks,
    };
  }

  private async checkDatabase() {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return { status: 'ok' as HealthStatus, message: 'connected' };
    } catch (err) {
      return {
        status: 'error' as HealthStatus,
        message: err instanceof Error ? err.message : 'database unreachable',
      };
    }
  }

  private async checkRedis() {
    if (!process.env.REDIS_URL) {
      return { status: 'degraded' as HealthStatus, message: 'REDIS_URL not configured' };
    }
    const ok = await this.redis.ping();
    return ok
      ? { status: 'ok' as HealthStatus, message: 'connected' }
      : { status: 'error' as HealthStatus, message: 'unreachable' };
  }

  private async checkStorage() {
    try {
      const ok = await this.storage.ping();
      return ok
        ? { status: 'ok' as HealthStatus, message: 'connected' }
        : { status: 'error' as HealthStatus, message: 'bucket unreachable' };
    } catch (err) {
      return {
        status: 'error' as HealthStatus,
        message: err instanceof Error ? err.message : 'storage unreachable',
      };
    }
  }
}

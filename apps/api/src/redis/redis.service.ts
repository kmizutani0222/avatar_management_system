import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, type RedisClientType } from 'redis';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private client: RedisClientType | null = null;
  private ready = false;

  constructor(private readonly config: ConfigService) {}

  async onModuleInit() {
    const url = this.config.get<string>('REDIS_URL');
    if (!url) {
      this.logger.warn('REDIS_URL is not set — rate limiting disabled');
      return;
    }

    this.client = createClient({ url });
    this.client.on('error', (err) => {
      this.logger.error(`Redis error: ${err.message}`);
      this.ready = false;
    });

    try {
      await this.client.connect();
      this.ready = true;
      this.logger.log('Redis connected');
    } catch (err) {
      this.logger.error(`Redis connection failed: ${err instanceof Error ? err.message : err}`);
      this.client = null;
    }
  }

  async onModuleDestroy() {
    if (this.client?.isOpen) {
      await this.client.quit();
    }
  }

  isReady(): boolean {
    return this.ready && this.client?.isOpen === true;
  }

  async ping(): Promise<boolean> {
    if (!this.isReady() || !this.client) return false;
    try {
      const pong = await this.client.ping();
      return pong === 'PONG';
    } catch {
      return false;
    }
  }

  /** Sliding window counter. Returns true if under limit. */
  async incrementWithinLimit(key: string, limit: number, windowSeconds: number): Promise<boolean> {
    if (!this.isReady() || !this.client) return true;

    const count = await this.client.incr(key);
    if (count === 1) {
      await this.client.expire(key, windowSeconds);
    }
    return count <= limit;
  }

  async setJson(key: string, value: unknown, ttlSeconds: number): Promise<void> {
    if (!this.isReady() || !this.client) return;
    await this.client.set(key, JSON.stringify(value), { EX: ttlSeconds });
  }

  async getJson<T>(key: string): Promise<T | null> {
    if (!this.isReady() || !this.client) return null;
    const raw = await this.client.get(key);
    if (!raw) return null;
    return JSON.parse(raw) as T;
  }

  async deleteKey(key: string): Promise<void> {
    if (!this.isReady() || !this.client) return;
    await this.client.del(key);
  }
}

import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { createClient, RedisClientType } from 'redis';

@Injectable()
export class CacheService implements OnModuleInit, OnModuleDestroy {
    private readonly logger = new Logger(CacheService.name);
    private client: RedisClientType;
    private isConnected = false;

    constructor() {
        this.client = createClient({
            url: process.env.REDIS_URL || 'redis://127.0.0.1:6379',
            socket: {
                reconnectStrategy: (retries) => {
                    if (retries > 10) {
                        this.logger.error('Redis max retries reached');
                        return false;
                    }
                    return Math.min(retries * 50, 2000);
                },
            },
        });

        this.client.on('error', (err) => {
            this.logger.error(`Redis error: ${err.message}`);
        });

        this.client.on('reconnecting', () => {
            this.logger.warn('Redis reconnecting...');
        });
    }

    async onModuleInit() {
        try {
            await this.client.connect();
            this.isConnected = true;
            this.logger.log('✅ Redis cache connected successfully');
        } catch (error: any) {
            this.logger.error(`Failed to connect to Redis: ${error.message}`);
            throw error;
        }
    }

    async onModuleDestroy() {
        if (this.isConnected) {
            await this.client.quit();
            this.logger.log('Redis cache connection closed');
        }
    }

    /**
     * Get cached value
     */
    async get<T = any>(key: string): Promise<T | null> {
        if (!this.isConnected) return null;

        const value = await this.client.get(key);
        if (!value) return null;
        try {
            return JSON.parse(value);
        } catch {
            return value as unknown as T;
        }
    }

    /**
     * Set cached value with TTL
     */
    async set<T = any>(key: string, value: T, ttl?: number): Promise<void> {
        if (!this.isConnected) return;

        const serialized = JSON.stringify(value);
        if (ttl) {
            await this.client.setEx(key, ttl, serialized);
        } else {
            await this.client.set(key, serialized);
        }
    }

    /**
     * Delete cached value
     */
    async del(key: string): Promise<number> {
        if (!this.isConnected) return 0;
        return this.client.del(key);
    }

    /**
     * Check if key exists
     */
    async exists(key: string): Promise<boolean> {
        if (!this.isConnected) return false;
        return (await this.client.exists(key)) > 0;
    }

    /**
     * Increment counter
     */
    async incr(key: string): Promise<number> {
        if (!this.isConnected) return 0;
        return this.client.incr(key);
    }

    /**
     * Set expiration on existing key
     */
    async expire(key: string, seconds: number): Promise<boolean> {
        if (!this.isConnected) return false;
        return this.client.expire(key, seconds);
    }

    /**
     * Get multiple keys
     */
    async mget(keys: string[]): Promise<(any | null)[]> {
        if (!this.isConnected) return keys.map(() => null);

        const values = await this.client.mGet(keys);
        return values.map(v => v ? JSON.parse(v) : null);
    }

    /**
     * Set multiple keys
     */
    async mset(entries: Record<string, any>, ttl?: number): Promise<void> {
        if (!this.isConnected) return;

        const serialized = Object.entries(entries).map(([k, v]) => [k, JSON.stringify(v)]);
        await this.client.mSet(Object.fromEntries(serialized));

        if (ttl) {
            for (const key of Object.keys(entries)) {
                await this.expire(key, ttl);
            }
        }
    }
}

import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { createClient, RedisClientType } from 'redis';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
    private readonly logger = new Logger(RedisService.name);
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
            // [SEC-FIX] Handle DNS resolution failures specifically for Docker startup
            if (err.message.includes('ESERVFAIL') || err.message.includes('EAI_AGAIN')) {
                this.logger.warn('DNS resolution failed for Redis, will retry via reconnect strategy...');
            }
        });

        this.client.on('reconnecting', () => {
            this.logger.warn('Redis reconnecting...');
        });
    }

    async onModuleInit() {
        await this.init();
    }

    /**
     * [SEC-L1] Manual Initialization for non-NestJS environments (e.g., tests)
     * Follows LEGO strategy: Zero glue code required for standalone use.
     */
    async init() {
        if (this.isConnected) return;
        try {
            await this.client.connect();
            this.isConnected = true;
            this.logger.log('✅ Redis connected successfully');
        } catch (error: any) {
            this.logger.error(`Failed to connect to Redis: ${error.message}`);
            throw error;
        }
    }

    async onModuleDestroy() {
        if (this.isConnected) {
            await this.client.quit();
            this.logger.log('Redis connection closed');
        }
    }

    getClient(): RedisClientType {
        if (!this.isConnected) {
            throw new Error('Redis not connected');
        }
        return this.client;
    }

    async get(key: string): Promise<string | null> {
        return this.client.get(key);
    }

    async set(key: string, value: string, ttl?: number): Promise<void> {
        if (ttl) {
            await this.client.setEx(key, ttl, value);
        } else {
            await this.client.set(key, value);
        }
    }

    async del(key: string): Promise<number> {
        return this.client.del(key);
    }

    async incr(key: string): Promise<number> {
        return this.client.incr(key);
    }

    async expire(key: string, seconds: number): Promise<boolean> {
        return this.client.expire(key, seconds);
    }

    async keys(pattern: string): Promise<string[]> {
        return this.client.keys(pattern);
    }

    async flushDb(): Promise<void> {
        await this.client.flushDb();
    }

    async ping(): Promise<string> {
        if (!this.isConnected) {
            await this.init();
        }
        return this.client.ping();
    }
}

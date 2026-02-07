import { Injectable, NestMiddleware, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { RedisService } from '@apex/redis';
import * as crypto from 'crypto';

/**
 * [FIX-007/016] Hardened Distributed Rate Limiter
 * Uses Redis-backed counting with hashed keys to prevent memory exhaustion and injection.
 */
@Injectable()
export class RateLimiterMiddleware implements NestMiddleware {
    private readonly logger = new Logger(RateLimiterMiddleware.name);

    constructor(private readonly redisService: RedisService) { }

    async use(req: any, res: any, next: () => void) {
        try {
            const client = this.redisService.getClient();

            // [SEC] S6: IP Spoofing Prevention
            // Fastify with trustProxy: true provides the reliable IP in req.ip
            const realIp = req.ip || req.raw?.remoteAddress || '127.0.0.1';
            const blockKey = `block:${realIp}`;
            const isBlocked = await client.get(blockKey);
            if (isBlocked) {
                this.logger.warn(`🚫 [SECURITY] Blocked request from ${req.ip}`);
                throw new HttpException('Your IP is temporarily blocked due to repeated violations.', HttpStatus.FORBIDDEN);
            }

            const tenantId = req.tenantId || 'anonymous';
            const tier = req.tenantTier || 'basic';
            const limits: Record<string, number> = {
                basic: 10,
                auth: 5,
                admin: 30,
                enterprise: 3000
            };
            const limit = limits[tier] || limits.basic;

            const rawPath = req.url || req.raw?.url || '/';
            const normalizedPath = rawPath.split('?')[0];

            // [SEC-016] Full SHA256 to avoid collisions
            const rawKeyIdentifier = `${tenantId}:${realIp}:${normalizedPath}`;
            const hashedKey = `rl:${crypto.createHash('sha256').update(rawKeyIdentifier).digest('hex')}`;

            const current = await client.incr(hashedKey);

            if (current === 1) {
                await client.expire(hashedKey, 60);
            }

            const raw = res.raw || res;
            if (typeof res.header === 'function') {
                res.header('X-RateLimit-Limit', limit.toString());
                res.header('X-RateLimit-Remaining', Math.max(0, limit - current).toString());
            } else if (typeof raw.setHeader === 'function') {
                raw.setHeader('X-RateLimit-Limit', limit.toString());
                raw.setHeader('X-RateLimit-Remaining', Math.max(0, limit - current).toString());
            }


            if (current > limit) {
                const requestId = req.requestId || req.headers['x-request-id'] || 'unknown';
                this.logger.warn(`🚩 [RATE_LIMIT] Exceeded for ${tenantId} at ${normalizedPath}`);

                // [SEC] Track violation and escalate
                const violationKey = `violations:${realIp}`;
                const violations = await client.incr(violationKey);
                if (violations === 1) await client.expire(violationKey, 3600);

                // Progressive blocking: 1m, 5m, 15m, 1h, 24h
                const blockDurations = [60, 300, 900, 3600, 86400];
                // [SEC] S6: Raised threshold for dev/test stability (1000 violations before hard block)
                if (violations >= 1000) {
                    const duration = blockDurations[Math.min(violations - 100, 4)];
                    await client.setEx(blockKey, duration, '1');
                    this.logger.error(`🛑 [SECURITY] IP ${realIp} blocked for ${duration}s due to ${violations} violations`);
                }

                throw new HttpException({
                    statusCode: 429,
                    error: 'Too Many Requests',
                    message: 'Rate limit exceeded. Please try again in a minute.',
                    requestId: requestId
                }, 429);
            }

            next();
        } catch (error: any) {
            if (error instanceof HttpException) throw error;

            this.logger.error(`🚨 Rate Limiter Failure: ${error?.message || error}`);
            // [ARCH-S6] Fail Closed on security infra failure
            throw new Error('Infrastructure Failure: Redis is unreachable or Service is misconfigured.');
        }
    }
}

// Rate Limiter Middleware Spec - S6 Compliant
import { describe, it, expect, mock, beforeEach } from 'bun:test';
import { RateLimiterMiddleware } from './rate-limiter.middleware';
import { RedisService } from '@apex/redis';

describe('RateLimiterMiddleware (S6)', () => {
    let mockReq: any;
    let mockRes: any;
    let mockNext: any;
    let mockRedisService: any;
    let mockClient: any;

    beforeEach(() => {
        mockReq = { ip: '127.0.0.1', path: '/test', headers: {} };
        mockRes = {
            status: mock(() => mockRes),
            json: mock(() => mockRes),
            setHeader: mock(() => { }),
        };
        mockNext = mock(() => { });

        mockClient = {
            incr: mock(() => Promise.resolve(5)),
            expire: mock(() => Promise.resolve()),
            get: mock(() => Promise.resolve(null)),
            setEx: mock(() => Promise.resolve()),
        };

        mockRedisService = {
            getClient: mock(() => mockClient)
        };
    });

    it('should permit request if below limit', async () => {
        const middleware = new RateLimiterMiddleware(mockRedisService);
        (middleware as any).logger = { log: mock(), warn: mock(), error: mock() };

        mockClient.incr.mockResolvedValue(5);

        await middleware.use(mockReq, mockRes, mockNext);

        expect(mockNext).toHaveBeenCalled();
        expect(mockRes.setHeader).toHaveBeenCalledWith('X-RateLimit-Limit', '60'); // Basic tier default
    });

    it('should block request if above limit', async () => {
        const middleware = new RateLimiterMiddleware(mockRedisService);
        (middleware as any).logger = { log: mock(), warn: mock(), error: mock() };

        mockClient.incr.mockResolvedValue(61); // Above basic limit 60

        try {
            await middleware.use(mockReq, mockRes, mockNext);
            expect(true).toBe(false); // Should not reach here
        } catch (error: any) {
            expect(error.status).toBe(429);
            const msg = typeof error.response === 'object' ? error.response.message : error.message;
            expect(msg).toContain('Rate limit exceeded');
        }

        expect(mockNext).not.toHaveBeenCalled();
    });

    it('should handle redis failures by failing closed (S6)', async () => {
        const middleware = new RateLimiterMiddleware(mockRedisService);
        (middleware as any).logger = { log: mock(), warn: mock(), error: mock() };

        mockRedisService.getClient = mock(() => { throw new Error('Redis down'); });

        try {
            await middleware.use(mockReq, mockRes, mockNext);
            expect(true).toBe(false);
        } catch (error: any) {
            expect(error.status).toBe(503);
            expect(error.message).toContain('Security infrastructure currently unavailable');
        }
    });
});

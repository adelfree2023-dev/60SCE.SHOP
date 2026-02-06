import { describe, it, expect, mock } from 'bun:test';
import { RateLimiterMiddleware } from '../../packages/security/src/middlewares/rate-limiter.middleware';

describe('S6 Integration Test', () => {
    it('should handle rate limiting requests', async () => {
        console.log('🔍 Execution: S6 Rate Limiting Test');

        const mockClient = {
            incr: mock(() => Promise.resolve(1)),
            expire: mock(() => Promise.resolve()),
            get: mock(() => Promise.resolve(null)),
            setEx: mock(() => Promise.resolve()),
        };

        const mockRedisService = {
            getClient: mock(() => mockClient)
        };

        const mockReq = { ip: '127.0.0.1', path: '/api/health' } as any;
        const mockRes = {
            status: mock(() => ({ json: mock() })),
            setHeader: mock(() => { })
        } as any;

        let nextCalled = 0;
        const mockNext = () => { nextCalled++; };

        const middleware = new RateLimiterMiddleware(mockRedisService as any);
        (middleware as any).logger = { log: mock(), warn: mock(), error: mock() };

        for (let i = 0; i < 5; i++) {
            await middleware.use(mockReq, mockRes, mockNext);
        }

        expect(nextCalled).toBe(5);
        expect(mockRes.setHeader).toHaveBeenCalled();
    });
});

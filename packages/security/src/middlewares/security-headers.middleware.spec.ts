import { describe, it, expect, mock } from 'bun:test';
import { SecurityHeadersMiddleware } from './security-headers.middleware';

describe('SecurityHeadersMiddleware (S7) Unit Test', () => {
    it('should set all security headers', () => {
        const middleware = new SecurityHeadersMiddleware();
        const mockRes = {
            setHeader: mock(() => { }),
        };
        const mockNext = mock(() => { });

        middleware.use({}, mockRes, mockNext);

        expect(mockRes.setHeader).toHaveBeenCalledWith('X-Frame-Options', 'DENY');
        expect(mockRes.setHeader).toHaveBeenCalledWith('X-Content-Type-Options', 'nosniff');
        expect(mockNext).toHaveBeenCalled();
    });
});

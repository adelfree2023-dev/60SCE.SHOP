import { describe, it, expect, mock, beforeEach } from 'bun:test';
import { HelmetMiddleware } from './helmet.middleware';

describe('HelmetMiddleware (Arch-S8)', () => {
    let middleware: HelmetMiddleware;
    let mockReq: any;
    let mockRes: any;
    let mockNext: any;

    beforeEach(() => {
        middleware = new HelmetMiddleware();
        mockReq = {
            method: 'GET',
            headers: {},
        };
        mockRes = {
            setHeader: mock(() => { }),
            removeHeader: mock(() => { }),
        };
        mockNext = mock(() => { });
    });

    it('should set all required security headers', () => {
        middleware.use(mockReq, mockRes, mockNext);

        const setHeaderCalls = mockRes.setHeader.mock.calls;
        const headers = setHeaderCalls.map((call: any) => call[0]);

        expect(headers).toContain('Content-Security-Policy');
        expect(headers).toContain('Strict-Transport-Security');
        expect(headers).toContain('X-Frame-Options');
        expect(headers).toContain('X-Content-Type-Options');

        expect(mockNext).toHaveBeenCalled();
    });

    it('should set CSP with proper directives', () => {
        middleware.use(mockReq, mockRes, mockNext);

        const cspCall = mockRes.setHeader.mock.calls.find(
            (call: any) => call[0] === 'Content-Security-Policy'
        );

        expect(cspCall).toBeDefined();
        expect(cspCall[1]).toContain("default-src 'self'");
    });

    it('should set HSTS header correctly', () => {
        middleware.use(mockReq, mockRes, mockNext);

        const hstsCall = mockRes.setHeader.mock.calls.find(
            (call: any) => call[0] === 'Strict-Transport-Security'
        );

        expect(hstsCall).toBeDefined();
        expect(hstsCall[1]).toContain('max-age=31536000');
    });

    it('should set X-Frame-Options to DENY', () => {
        middleware.use(mockReq, mockRes, mockNext);

        const xFrameCall = mockRes.setHeader.mock.calls.find(
            (call: any) => call[0] === 'X-Frame-Options'
        );

        expect(xFrameCall).toBeDefined();
        // Helmet sets it to DENY when configured with { action: 'deny' }
        expect(xFrameCall[1]).toBe('DENY');
    });
});

import { RequestIdMiddleware } from './request-id.middleware';

describe('RequestIdMiddleware', () => {
    let middleware: RequestIdMiddleware;

    beforeEach(() => {
        middleware = new RequestIdMiddleware();
    });

    it('should be defined', () => {
        expect(middleware).toBeDefined();
    });

    it('should generate request ID if missing', () => {
        const req: any = { headers: {} };
        const res: any = { setHeader: jest.fn() };
        const next = jest.fn();

        middleware.use(req, res, next);

        expect(req.requestId).toBeDefined();
        expect(req.headers['x-request-id']).toBeDefined();
        expect(res.setHeader).toHaveBeenCalledWith('X-Request-ID', expect.any(String));
        expect(next).toHaveBeenCalled();
    });

    it('should use existing request ID', () => {
        const existingId = 'existing-uuid';
        const req: any = { headers: { 'x-request-id': existingId } };
        const res: any = { setHeader: jest.fn() };
        const next = jest.fn();

        middleware.use(req, res, next);

        expect(req.requestId).toBe(existingId);
        expect(res.setHeader).toHaveBeenCalledWith('X-Request-ID', existingId);
        expect(next).toHaveBeenCalled();
    });
});

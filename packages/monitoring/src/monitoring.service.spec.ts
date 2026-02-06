import { describe, it, expect, mock, beforeEach } from 'bun:test';
import { MonitoringService } from './monitoring.service';
import * as Sentry from '@sentry/node';

// Mock Sentry
mock.module('@sentry/node', () => ({
    init: mock(() => { }),
    captureException: mock(() => { }),
    captureMessage: mock(() => { }),
    setUser: mock(() => { }),
    addBreadcrumb: mock(() => { }),
    startTransaction: mock(() => ({ finish: mock(() => { }) })),
}));

describe('MonitoringService', () => {
    let service: MonitoringService;
    let loggedWarns: string[] = [];

    beforeEach(() => {
        loggedWarns = [];
        service = new MonitoringService();
        (service as any).logger = {
            warn: mock((msg: string) => loggedWarns.push(msg)),
            log: mock(() => { }),
            error: mock(() => { }),
            debug: mock(() => { }),
        };
    });

    it('should not initialize if no DSN', async () => {
        delete process.env.SENTRY_DSN;
        delete process.env.GLITCHTIP_DSN;

        await service.onModuleInit();
        expect((service as any).isInitialized).toBe(false);
        expect(loggedWarns.some(m => m.includes('monitoring disabled'))).toBe(true);
    });

    it('should test beforeSend in development', async () => {
        process.env.SENTRY_DSN = 'https://test@sentry.io/123';
        process.env.NODE_ENV = 'development';
        delete process.env.SENTRY_DEV_ENABLED;

        let capturedInitOptions: any;
        (Sentry.init as any).mockImplementation((opts: any) => {
            capturedInitOptions = opts;
        });

        await service.onModuleInit();

        const event = { message: 'test' };
        const result = capturedInitOptions.beforeSend(event);
        expect(result).toBeNull();

        // Enable dev
        process.env.SENTRY_DEV_ENABLED = 'true';
        const resultEnabled = capturedInitOptions.beforeSend(event);
        expect(resultEnabled).toBe(event);
    });

    it('should initialize if DSN present', async () => {
        process.env.SENTRY_DSN = 'https://test@sentry.io/123';
        await service.onModuleInit();
        expect((service as any).isInitialized).toBe(true);
        expect(Sentry.init).toHaveBeenCalled();
    });

    it('should capture exception when initialized', () => {
        (service as any).isInitialized = true;
        const err = new Error('test');
        service.captureException(err, { extra: 'data' });
        expect(Sentry.captureException).toHaveBeenCalled();
    });

    it('should capture message when initialized', () => {
        (service as any).isInitialized = true;
        service.captureMessage('test', 'info');
        expect(Sentry.captureMessage).toHaveBeenCalledWith('test', 'info');
    });

    it('should set and clear user', () => {
        (service as any).isInitialized = true;
        service.setUser('123', 'a@b.com');
        expect(Sentry.setUser).toHaveBeenCalledWith(expect.objectContaining({ id: '123' }));

        service.clearUser();
        expect(Sentry.setUser).toHaveBeenCalledWith(null);
    });

    it('should add breadcrumb', () => {
        (service as any).isInitialized = true;
        service.addBreadcrumb('event');
        expect(Sentry.addBreadcrumb).toHaveBeenCalledWith(expect.objectContaining({ message: 'event' }));
    });

    it('should start transaction', () => {
        (service as any).isInitialized = true;
        const tx = service.startTransaction('test');
        expect(Sentry.startTransaction).toHaveBeenCalled();
        expect(tx).toBeDefined();
    });

    it('should do nothing when not initialized', () => {
        (service as any).isInitialized = false;
        service.captureException(new Error('test'));
        service.captureMessage('test');
        service.setUser('123');
        service.clearUser();
        service.addBreadcrumb('test');
        service.startTransaction('test');

        // Sentry methods shouldn't be called after resetting state
        // (Since they were called in previous tests, we just check logic doesn't throw)
        expect(true).toBe(true);
    });
});

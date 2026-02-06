import { describe, it, expect, mock, beforeEach } from 'bun:test';
import { Test, TestingModule } from '@nestjs/testing';
import { TenantMiddleware } from './tenant.middleware';
import { ForbiddenException } from '@nestjs/common';

describe('TenantMiddleware', () => {
    let middleware: TenantMiddleware;
    let mockBoundPool: any; // Reduced scope pool

    beforeEach(async () => {
        mockBoundPool = {
            connect: mock(), // For request-scoped connections
            query: mock(),   // For tenant lookup
            on: mock(),
            end: mock(),
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                TenantMiddleware,
                {
                    provide: 'DATABASE_POOL',
                    useValue: mockBoundPool,
                },
            ],
        }).compile();

        middleware = module.get<TenantMiddleware>(TenantMiddleware);

        // Ensure logger is mocked
        (middleware as any).logger = {
            error: mock(),
            log: mock(),
            warn: mock()
        };
    });

    it('should be defined', () => {
        expect(middleware).toBeDefined();
    });

    it('should set schema path using UUID and call next', async () => {
        const req: any = {
            headers: { 'host': 'test-tenant.apex.localhost' },
            ip: '127.0.0.1'
        };
        const res: any = { on: mock() };
        const next = mock();

        // 1. Mock connection for SET search_path
        const mockClient = {
            query: mock(),
            release: mock(),
        };
        mockBoundPool.connect.mockResolvedValue(mockClient);

        // 2. Mock tenant lookup
        const mockTenantId = 'uuid-123-456';
        mockBoundPool.query.mockResolvedValueOnce({
            rows: [{ id: mockTenantId, subdomain: 'test-tenant', plan_id: 'pro', status: 'active' }],
        });

        await middleware.use(req, res, next);

        // TRIGGER LAZY CONNECTION
        await req.dbClient; // This triggers the getter and the query

        // CHECK: Must use UUID logic (pg-format adds quotes)
        // "SET search_path TO "tenant_uuid-123-456", public"
        expect(mockClient.query).toHaveBeenCalledWith(expect.stringContaining(`SET search_path TO "tenant_${mockTenantId}", public`));
        // Should NOT use subdomain
        expect(mockClient.query).not.toHaveBeenCalledWith(expect.stringContaining(`SET search_path TO tenant_test-tenant, public`));

        expect(next).toHaveBeenCalled();
    });
});

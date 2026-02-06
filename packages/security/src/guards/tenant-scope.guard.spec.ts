import { describe, it, expect, mock, beforeEach } from 'bun:test';
import { TenantScopeGuard } from './tenant-scope.guard';
import { ForbiddenException } from '@nestjs/common';

describe('TenantScopeGuard', () => {
    let guard: TenantScopeGuard;
    let mockContext: any;
    let mockRequest: any;
    let mockReflector: any;

    beforeEach(() => {
        mockReflector = {
            getAllAndOverride: mock(() => false),
            get: mock(() => false),
        };
        guard = new TenantScopeGuard(mockReflector);
        mockRequest = {
            user: undefined,
            tenantId: undefined,
            headers: {},
            url: '/'
        };
        mockContext = {
            switchToHttp: () => ({
                getRequest: () => mockRequest,
            }),
            getHandler: mock(),
            getClass: mock(),
        };
    });

    it('should be defined', () => {
        expect(guard).toBeDefined();
    });

    it('should allow access if user is not authenticated', async () => {
        const result = await guard.canActivate(mockContext);
        expect(result).toBe(true);
    });

    it('should allow access for super-admin', async () => {
        mockRequest.user = { role: 'super_admin' }; // Corrected role
        const result = await guard.canActivate(mockContext);
        expect(result).toBe(true);
    });

    it('should throw ForbiddenException if tenant context missing for authenticated user', async () => {
        mockRequest.user = { role: 'user', tenantId: 't1' };
        mockRequest.tenantId = undefined; 
        try {
            await guard.canActivate(mockContext);
            expect(true).toBe(false);
        } catch (e: any) {
             expect(e).toBeInstanceOf(ForbiddenException);
        }
    });

    it('should throw ForbiddenException on cross-tenant access', async () => {
        mockRequest.user = { role: 'user', tenantId: 'tenant-A' };
        mockRequest.tenantId = 'tenant-B'; 
        try {
            await guard.canActivate(mockContext);
            expect(true).toBe(false);
        } catch (e: any) {
             expect(e).toBeInstanceOf(ForbiddenException);
        }
    });

    it('should allow access when tenant IDs match', async () => {
        mockRequest.user = { role: 'user', tenantId: 'tenant-A' };
        mockRequest.tenantId = 'tenant-A'; 
        const result = await guard.canActivate(mockContext);
        expect(result).toBe(true);
    });
});

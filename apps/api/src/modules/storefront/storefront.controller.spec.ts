import { describe, it, expect, beforeEach, mock } from 'bun:test';
import { StorefrontController } from './storefront.controller';
import { StorefrontService } from './storefront.service';

describe('StorefrontController', () => {
    let controller: StorefrontController;
    let service: StorefrontService;

    beforeEach(() => {
        service = {
            getHomePage: mock(() => Promise.resolve({
                tenant: { id: 'test-tenant', name: 'Test Store' },
                sections: {},
                metadata: {}
            })),
            invalidateCache: mock(() => Promise.resolve()),
            warmCache: mock(() => Promise.resolve()),
        } as any;

        controller = new StorefrontController(service);
    });

    it('should get home page data', async () => {
        const mockRequest = { tenantId: 'test-tenant' };
        const result = await controller.getHomePage(mockRequest);

        expect(service.getHomePage).toHaveBeenCalledWith(mockRequest);
        expect(result.tenant.name).toBe('Test Store');
    });

    it('should refresh home page cache', async () => {
        const mockRequest = { tenantId: 'test-tenant' };
        const result = await controller.refreshHomePage(mockRequest);

        expect(service.invalidateCache).toHaveBeenCalledWith(mockRequest);
        expect(service.warmCache).toHaveBeenCalledWith(mockRequest);
        expect(result.success).toBe(true);
        expect(result.message).toContain('refreshed');
    });
});

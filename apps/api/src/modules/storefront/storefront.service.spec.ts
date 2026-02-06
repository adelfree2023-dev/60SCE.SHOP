import { describe, it, expect, beforeEach, mock } from 'bun:test';
import { StorefrontService } from './storefront.service';
import { CacheService } from '@apex/cache';
import { NotFoundException } from '@nestjs/common';

describe('StorefrontService', () => {
    let service: StorefrontService;
    let cacheService: CacheService;
    let mockPool: any;
    let mockClient: any;

    const mockRequest = {
        tenantId: 'tenant-123',
        tenantSubdomain: 'test-store', // Matches what is returned in mocks
        tenantSchema: 'tenant_test-store',
        dbClient: {
            query: mock(() => Promise.resolve({ rows: [] }))
        }
    };

    beforeEach(() => {
        // Mock CacheService
        cacheService = {
            get: mock(() => Promise.resolve(null)),
            set: mock(() => Promise.resolve()),
            del: mock(() => Promise.resolve(1)),
        } as any;

        mockClient = {
            query: mock((sql: string) => {
                if (sql.includes('public.tenants')) {
                    return Promise.resolve({
                        rows: [{
                            id: 'tenant-123',
                            name: 'Test Store',
                            subdomain: 'test-store',
                            logo_url: 'https://example.com/logo.png',
                            primary_color: '#FF5733',
                            status: 'active'
                        }]
                    });
                }
                // Return empty arrays for section queries
                return Promise.resolve({ rows: [] });
            }),
        };

        // Update mockRequest with fresh mockClient
        mockRequest.dbClient = mockClient;

        mockPool = {
            connect: mock(() => Promise.resolve(mockClient)),
            query: mock((sql, params) => mockClient.query(sql, params)),
        };

        service = new StorefrontService(cacheService);
        // Inject logger mock to suppress console output during tests
        (service as any).logger = {
            log: mock(),
            error: mock(),
            debug: mock(),
            warn: mock(),
        };
    });

    it('should return cached data if available', async () => {
        const cachedData = {
            tenant: { id: 'tenant-123', name: 'Test Store' },
            sections: {},
            metadata: {}
        };

        cacheService.get = mock(() => Promise.resolve(cachedData));

        const result = await service.getHomePage(mockRequest);

        expect(result).toEqual(cachedData);
        expect(cacheService.get).toHaveBeenCalledWith('storefront:home:tenant-123');
    });

    it('should fetch from database on cache miss', async () => {
        const result = await service.getHomePage(mockRequest);

        expect(mockClient.query).toHaveBeenCalled();
        expect(result.tenant.name).toBe('Test Store');
        expect(cacheService.set).toHaveBeenCalled();
    });

    it('should throw Error if tenant context missing', async () => {
        try {
            await service.getHomePage({});
            expect(true).toBe(false); // Should not reach here
        } catch (error) {
            expect(error.message).toBe('TENANT_CONTEXT_MISSING');
        }
    });

    it('should throw NotFoundException for non-existent tenant', async () => {
        // We need to simulate the query returning no rows for the tenant lookup
        // But getHomePage relies on tenantId being in the request, implying it exists?
        // The service code `getHomePage` implementation does a query:
        // `SELECT * FROM public.tenants WHERE id = $1` using `tenantId`.

        mockClient.query = mock((sql: string) => {
            // If querying tenants, return empty
            if (sql.includes('public.tenants')) return Promise.resolve({ rows: [] });
            return Promise.resolve({ rows: [] });
        });
        mockRequest.dbClient = mockClient;

        try {
            await service.getHomePage(mockRequest);
            expect(true).toBe(false); // Should not reach here
        } catch (error) {
            expect(error).toBeInstanceOf(NotFoundException);
        }
    });

    it('should invalidate cache', async () => {
        await service.invalidateCache(mockRequest);

        expect(cacheService.del).toHaveBeenCalledWith('storefront:home:tenant-123');
    });

    it('should warm cache', async () => {
        await service.warmCache(mockRequest);

        expect(mockClient.query).toHaveBeenCalled();
        expect(cacheService.set).toHaveBeenCalled();
    });

    it('should handle missing sections gracefully', async () => {
        const result = await service.getHomePage(mockRequest);

        expect(result.sections.hero).toEqual([]);
        expect(result.sections.bestSellers).toEqual([]);
        expect(result.sections.categories).toEqual([]);
        expect(result.sections.promotions).toEqual([]);
        expect(result.sections.testimonials).toEqual([]);
    });

    it('should include metadata in response', async () => {
        const result = await service.getHomePage(mockRequest);

        expect(result.metadata).toBeDefined();
        expect(result.metadata.cacheTTL).toBe(300);
        expect(result.metadata.lastUpdated).toBeDefined();
    });
});

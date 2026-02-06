import { describe, it, expect, mock, beforeEach } from 'bun:test';
import { TenantsService } from './tenants.service';

describe('TenantsService (Super-#01)', () => {
    let service: TenantsService;
    let mockPool: any;
    let mockEncryptionService: any;

    beforeEach(() => {
        mockPool = {
            query: mock(),
        };
        mockEncryptionService = {
            encrypt: mock(),
        };
        service = new TenantsService(mockPool, mockEncryptionService);
    });

    it('should fetch all tenants with default pagination', async () => {
        // Mock data query
        mockPool.query.mockResolvedValueOnce({
            rows: Array(5).fill(null).map((_, i) => ({
                id: `tenant-${i}`,
                subdomain: `test${i}`,
                status: 'active',
            })),
        });
        // Mock count query
        mockPool.query.mockResolvedValueOnce({ rows: [{ count: '5' }] });

        const result = await service.findAll({ page: 1, limit: 20 });

        expect(result.data).toHaveLength(5);
        expect(result.pagination.page).toBe(1);
        expect(result.pagination.total).toBe(5);
    });
});

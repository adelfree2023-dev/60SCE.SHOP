import { describe, it, expect, mock, beforeEach } from 'bun:test';
import { TenantsController } from './tenants.controller';

describe('TenantsController', () => {
    let controller: TenantsController;
    let mockTenantsService: any;

    beforeEach(() => {
        mockTenantsService = {
            findAll: mock().mockResolvedValue([]),
            findOne: mock().mockResolvedValue({ id: '1', subdomain: 'test' }),
        };
        controller = new TenantsController(mockTenantsService);
    });

    it('should be defined', () => {
        expect(controller).toBeDefined();
    });

    it('should return all tenants', async () => {
        const query: any = { limit: 10, page: 1 };
        const result = await controller.findAll(query);
        expect(result).toEqual([]);
        expect(mockTenantsService.findAll).toHaveBeenCalledWith(query);
    });

    it('should return one tenant', async () => {
        const result = await controller.findOne('1');
        expect(result).toEqual({ id: '1', subdomain: 'test' });
        expect(mockTenantsService.findOne).toHaveBeenCalledWith('1');
    });
});

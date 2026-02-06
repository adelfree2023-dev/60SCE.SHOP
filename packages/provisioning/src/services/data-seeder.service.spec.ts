import { Test, TestingModule } from '@nestjs/testing';
import { DataSeederService } from './data-seeder.service';
import { Pool } from 'pg';

describe('DataSeederService', () => {
    let service: DataSeederService;
    let mockPool: any;
    let mockDb: any;

    beforeEach(async () => {
        mockPool = {
            query: jest.fn().mockResolvedValue({ rows: [{ config: { products: [], pages: [], settings: {} } }] }),
        };
        mockDb = {
            execute: jest.fn().mockResolvedValue({}),
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                DataSeederService,
                { provide: Pool, useValue: mockPool },
                { provide: 'DATABASE_CONNECTION', useValue: mockDb },
            ],
        }).compile();

        service = module.get<DataSeederService>(DataSeederService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    it('should fetch blueprint and seed data', async () => {
        const tenantId = 'test-tenant';
        await service.seedData(tenantId, 'standard');

        // Updates status
        expect(mockPool.query).toHaveBeenCalledWith(
            expect.stringContaining('SELECT config FROM public.onboarding_blueprints'),
            ['standard']
        );

        // Creates tables
        expect(mockDb.execute).toHaveBeenCalled();
    });

    it('should throw error if blueprint not found', async () => {
        mockPool.query.mockResolvedValueOnce({ rows: [] });
        await expect(service.seedData('t1', 'invalid')).rejects.toThrow('Blueprint invalid not found');
    });
});

import { Test, TestingModule } from '@nestjs/testing';
import { HealthController } from './health.controller';
import { RedisService } from '@apex/redis';

describe('HealthController', () => {
    let controller: HealthController;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [HealthController],
            providers: [
                { provide: 'DATABASE_POOL', useValue: { query: jest.fn().mockResolvedValue({ rows: [] }) } },
                { provide: RedisService, useValue: { ping: jest.fn().mockResolvedValue('PONG') } },
            ]
        }).compile();

        controller = module.get<HealthController>(HealthController);
    });

    it('should be defined', () => {
        expect(controller).toBeDefined();
    });

    it('should return health status', async () => {
        const result = await controller.check();
        expect(result.status).toBe('ok');
        expect(result.timestamp).toBeDefined();
    });
});

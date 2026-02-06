import { Test, TestingModule } from '@nestjs/testing';
import { CacheModule } from './cache.module';
import { CacheService } from './cache.service';

describe('CacheModule', () => {
    let module: TestingModule;

    beforeEach(async () => {
        module = await Test.createTestingModule({
            imports: [CacheModule],
        }).compile();
    });

    it('should be defined', () => {
        expect(module).toBeDefined();
    });

    it('should export CacheService by class', () => {
        const service = module.get<CacheService>(CacheService);
        expect(service).toBeDefined();
    });

    it('should export CacheService by token', () => {
        const service = module.get('CACHE_SERVICE');
        expect(service).toBeDefined();
        expect(service).toBeInstanceOf(CacheService);
    });
});

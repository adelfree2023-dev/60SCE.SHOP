import { Test, TestingModule } from '@nestjs/testing';
import { EncryptionModule } from './encryption.module';
import { EncryptionService } from './encryption.service';

describe('EncryptionModule', () => {
    let module: TestingModule;

    beforeEach(async () => {
        module = await Test.createTestingModule({
            imports: [EncryptionModule],
        }).compile();
    });

    it('should be defined', () => {
        expect(module).toBeDefined();
    });

    it('should export EncryptionService', () => {
        const service = module.get<EncryptionService>(EncryptionService);
        expect(service).toBeDefined();
    });
});

import { Test, TestingModule } from '@nestjs/testing';
import { EncryptionService } from './encryption.service';

describe('EncryptionService', () => {
    let service: EncryptionService;

    beforeEach(async () => {
        process.env.JWT_SECRET = 'test-secret-must-be-at-least-32-chars-long-for-safety';
        const module: TestingModule = await Test.createTestingModule({
            providers: [EncryptionService],
        }).compile();

        service = module.get<EncryptionService>(EncryptionService);
        service.onModuleInit(); // Initialize secret
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('encrypt', () => {
        it('should encrypt data and return formatted string', async () => {
            const text = 'sensitive-data';
            const encrypted = await service.encrypt(text);
            expect(encrypted).toContain(':');
            expect(encrypted.split(':').length).toBe(4);
        });

        it('should handle empty string', async () => {
            const encrypted = await service.encrypt('');
            expect(encrypted).toBe('');
        });
    });

    describe('decrypt', () => {
        it('should decrypt properly encrypted data', async () => {
            const text = 'my-secret-data';
            const encrypted = await service.encrypt(text);
            const decrypted = await service.decrypt(encrypted);
            expect(decrypted).toBe(text);
        });

        it('should return empty string for empty input', async () => {
            const decrypted = await service.decrypt('');
            expect(decrypted).toBe('');
        });

        it('should throw error for invalid payload', async () => {
            await expect(service.decrypt('invalid-payload')).rejects.toThrow('Decryption failed');
        });
    });

    describe('Database Helpers', () => {
        it('should prefix db values with enc:', async () => {
            const result = await service.encryptDbValue('value');
            expect(result.startsWith('enc:')).toBe(true);
        });

        it('should remove prefix and decrypt db values', async () => {
            const original = 'db-value';
            const encrypted = await service.encryptDbValue(original);
            const decrypted = await service.decryptDbValue(encrypted);
            expect(decrypted).toBe(original);
        });

        it('should return plaintext if not prefixed', async () => {
            const plain = 'legacy-plain-data';
            const result = await service.decryptDbValue(plain);
            expect(result).toBe(plain);
        });
    });
});

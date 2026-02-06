import { describe, it, expect, mock, beforeEach } from 'bun:test';
import { StorageService } from './storage.service';
import * as S3 from '@aws-sdk/client-s3';

// Mock S3 Client
const mockSend = mock(() => Promise.resolve({ Contents: [] }));
mock.module('@aws-sdk/client-s3', () => ({
    S3Client: mock(() => ({
        send: mockSend,
    })),
    PutObjectCommand: mock((args) => args),
    GetObjectCommand: mock((args) => args),
    DeleteObjectCommand: mock((args) => args),
    ListObjectsV2Command: mock((args) => args),
    CreateBucketCommand: mock((args) => args),
}));

mock.module('@aws-sdk/s3-request-presigner', () => ({
    getSignedUrl: mock(() => Promise.resolve('https://signed-url.com')),
}));

describe('StorageService', () => {
    let service: StorageService;
    let loggedErrors: string[] = [];

    beforeEach(() => {
        loggedErrors = [];
        service = new StorageService();
        (service as any).logger = {
            log: mock(() => { }),
            error: mock((msg: string) => loggedErrors.push(msg)),
        };
        mockSend.mockClear();
    });

    it('should initialize on module init', async () => {
        await service.onModuleInit();
        expect(true).toBe(true);
    });

    it('should upload file and return url', async () => {
        mockSend.mockResolvedValueOnce({});
        const buffer = Buffer.from('test');
        const url = await service.uploadFile('bucket', 'key', buffer);

        expect(mockSend).toHaveBeenCalled();
        expect(url).toBe('http://localhost:9000/bucket/key');
    });

    it('should handle upload error', async () => {
        mockSend.mockRejectedValueOnce(new Error('Upload fail'));
        const buffer = Buffer.from('test');
        await expect(service.uploadFile('bucket', 'key', buffer)).rejects.toThrow('Upload fail');
        expect(loggedErrors).toContain('Upload failed: Upload fail');
    });

    it('should get signed url', async () => {
        const url = await service.getFileUrl('bucket', 'key');
        expect(url).toBe('https://signed-url.com');
    });

    it('should delete file', async () => {
        mockSend.mockResolvedValueOnce({});
        await service.deleteFile('bucket', 'key');
        expect(mockSend).toHaveBeenCalled();
    });

    it('should create bucket', async () => {
        mockSend.mockResolvedValueOnce({});
        await service.createBucket('new-bucket');
        expect(mockSend).toHaveBeenCalled();
    });

    it('should handle bucket already exists', async () => {
        const err = new Error('Owned');
        err.name = 'BucketAlreadyOwnedByYou';
        mockSend.mockRejectedValueOnce(err);

        await service.createBucket('exists');
        expect(mockSend).toHaveBeenCalled();
        // Should not throw
    });

    it('should rethrow other create bucket errors', async () => {
        mockSend.mockRejectedValueOnce(new Error('Fatal'));
        await expect(service.createBucket('fail')).rejects.toThrow('Fatal');
    });

    it('should list files', async () => {
        mockSend.mockResolvedValueOnce({
            Contents: [{ Key: 'file1' }],
        });
        const files = await service.listFiles('bucket');
        expect(files).toHaveLength(1);
        expect(files[0].Key).toBe('file1');
    });
});

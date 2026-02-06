import { describe, it, expect, mock, beforeEach } from 'bun:test';
import { ProvisioningService } from './provisioning.service';
import { ConflictException } from '@nestjs/common';

describe('ProvisioningService', () => {
    let service: ProvisioningService;
    let mockPool: any;
    let mockClient: any;
    let mockIdentityService: any;
    let mockMailService: any;
    let mockEncryptionService: any;

    beforeEach(() => {
        mockClient = {
            query: mock(),
            connect: mock(),
            release: mock(),
        };
        mockPool = {
            connect: mock().mockResolvedValue(mockClient),
            query: mock()
        };
        mockIdentityService = {
            register: mock().mockResolvedValue({ user: { id: 'u1', verificationToken: 'v1' } })
        };
        mockMailService = {
            sendVerificationEmail: mock().mockResolvedValue(undefined)
        };
        mockEncryptionService = {
            encryptDbValue: mock().mockResolvedValue('encrypted-email')
        };

        // Manual Injection
        service = new ProvisioningService(
            mockPool,
            mockIdentityService,
            mockMailService,
            mockEncryptionService
        );
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    it('should successfully provision a tenant with UUID schema', async () => {
        const dto: any = {
            subdomain: 'test-tenant',
            ownerEmail: 'owner@example.com',
            storeName: 'Test Store',
            planId: 'basic',
            password: 'password123'
        };
        const mockTenantId = 'uuid-v4-tenant-id';

        mockClient.query
            .mockResolvedValueOnce({}) // BEGIN
            .mockResolvedValueOnce({}) // Advisory Lock
            .mockResolvedValueOnce({ rows: [] }) // Check existence
            .mockResolvedValueOnce({ rows: [{ id: mockTenantId }] }) // Insert tenant
            .mockResolvedValueOnce({}) // CREATE SCHEMA
            .mockResolvedValueOnce({}) // Identity: Insert user
            .mockResolvedValueOnce({}) // Identity: Insert roles
            .mockResolvedValueOnce({}) // UPDATE STATUS
            .mockResolvedValueOnce({}); // COMMIT

        const result = await service.provisionTenant(dto);

        expect(result.success).toBe(true);
        expect(result.tenantId).toBe(mockTenantId);
        
        // STRICT ASSERTION: Schema must use UUID, NOT subdomain (pg-format adds quotes)
        expect(mockClient.query).toHaveBeenCalledWith(expect.stringContaining('CREATE SCHEMA "tenant_' + mockTenantId + '"'));
    });
});

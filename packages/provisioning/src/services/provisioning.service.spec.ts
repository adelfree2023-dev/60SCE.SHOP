import { describe, it, expect, mock, beforeEach } from 'bun:test';
import { ProvisioningService } from './provisioning.service';
import { ConflictException, BadRequestException } from '@nestjs/common';

describe('ProvisioningService', () => {
    let service: ProvisioningService;
    let mockSchemaCreator: any;
    let mockDataSeeder: any;
    let mockTraefikRouter: any;
    let mockEventEmitter: any;
    let mockEncryptionService: any;
    let mockPool: any;

    beforeEach(() => {
        // Setup mocks
        mockSchemaCreator = { createSchema: mock(() => Promise.resolve('tenant_schema')) };
        mockDataSeeder = { seedData: mock(() => Promise.resolve()) };
        mockTraefikRouter = { addTenantRoute: mock(() => Promise.resolve()) };
        mockEventEmitter = { emit: mock() };
        mockEncryptionService = { encryptDbValue: mock((val: string) => Promise.resolve('encrypted_' + val)) };

        mockPool = {
            connect: mock(() => Promise.resolve({
                query: mock()
                    .mockResolvedValueOnce({}) // BEGIN
                    .mockResolvedValueOnce({ rows: [] }) // Lock
                    .mockResolvedValueOnce({ rows: [] }) // Check existence
                    .mockResolvedValueOnce({ rows: [{ id: 'test-id' }] }) // Insert
                    .mockResolvedValueOnce({}) // Update status
                    .mockResolvedValueOnce({}), // COMMIT
                release: mock()
            })),
            query: mock(() => Promise.resolve({ rows: [] }))
        };

        service = new ProvisioningService(
            mockPool,
            mockSchemaCreator,
            mockDataSeeder,
            mockTraefikRouter,
            mockEventEmitter,
            mockEncryptionService
        );

        // Mock logger
        (service as any).logger = {
            log: mock(),
            error: mock(),
            warn: mock(),
            debug: mock(),
        };
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    it('should provision tenant successfully', async () => {
        const dto = { subdomain: 'test', ownerEmail: 'test@example.com', name: 'Test Store' };

        const result = await service.provisionTenant(dto);

        expect(result.id).toBe('test-id');
        expect(mockSchemaCreator.createSchema).toHaveBeenCalled();
        expect(mockDataSeeder.seedData).toHaveBeenCalled();
        expect(mockTraefikRouter.addTenantRoute).toHaveBeenCalledWith('test');
        expect(mockEncryptionService.encryptDbValue).toHaveBeenCalledWith('test@example.com');
    });

    it('should handle provisioning failure and rollback', async () => {
        const dto = { subdomain: 'fail', ownerEmail: 'fail@example.com' };

        const mockClient = {
            query: mock()
                .mockResolvedValueOnce({}) // BEGIN
                .mockResolvedValueOnce({ rows: [] }) // Lock
                .mockResolvedValueOnce({ rows: [] }) // Check existence
                .mockRejectedValueOnce(new Error('Insert Failed')), // INSERT fails
            release: mock()
        };
        mockPool.connect.mockResolvedValue(mockClient);

        await expect(service.provisionTenant(dto)).rejects.toThrow('Insert Failed');
        expect(mockClient.query).toHaveBeenCalledWith(expect.stringContaining('ROLLBACK'));
    });

    it('should validate subdomain format and availability', async () => {
        // Valid
        mockPool.query.mockResolvedValueOnce({ rows: [] });
        expect(await service.validateSubdomain('valid-subdomain')).toBe(true);

        // Invalid format
        await expect(service.validateSubdomain('Invalid Format!')).rejects.toThrow(BadRequestException);

        // Reserved
        await expect(service.validateSubdomain('api')).rejects.toThrow('reserved');

        // Taken
        mockPool.query.mockResolvedValueOnce({ rows: [{ id: '1' }] });
        await expect(service.validateSubdomain('taken')).rejects.toThrow('already taken');
    });

    it('should validate email format', async () => {
        expect(await service.validateEmail('valid@example.com')).toBe(true);
        await expect(service.validateEmail('invalid-email')).rejects.toThrow(BadRequestException);
    });
});

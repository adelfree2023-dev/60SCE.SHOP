import { describe, it, expect, mock, beforeEach } from 'bun:test';
import { SchemaCreatorService } from './schema-creator.service';

describe('SchemaCreatorService', () => {
    let service: SchemaCreatorService;
    let mockPool: any;
    let mockDb: any;

    beforeEach(() => {
        // Simple direct mocks
        mockPool = {
            query: mock(() => Promise.resolve({ rows: [] }))
        };

        mockDb = {
            execute: mock(() => Promise.resolve())
        };

        // Inject mocks via constructor
        service = new SchemaCreatorService(mockPool, mockDb);
    });

    it('should create schema if not exists', async () => {
        // Setup state
        mockPool.query
            .mockResolvedValueOnce({ rows: [] }) // Schema does not exist
            .mockResolvedValueOnce({}) // CREATE SCHEMA
            .mockResolvedValueOnce({}) // GRANT ALL
            .mockResolvedValueOnce({}); // Audit Log

        const result = await service.createSchema('test-id');

        expect(result).toBe('tenant_test-id');

        // Check schema existence check + CREATE SCHEMA + GRANT ALL + Audit
        expect(mockPool.query).toHaveBeenCalledTimes(4);
    });

    it('should return existing schema if idempotent', async () => {
        mockPool.query.mockResolvedValueOnce({ rows: [{ schema_name: 'tenant_test-id' }] });

        const result = await service.createSchema('test-id');

        expect(result).toBe('tenant_test-id');
        // No db.execute calls (schema already exists, no CREATE/GRANT)
        expect(mockDb.execute).toHaveBeenCalledTimes(0);
        // pool.query called for schema check + audit log
        expect(mockPool.query).toHaveBeenCalledTimes(2);
    });
});

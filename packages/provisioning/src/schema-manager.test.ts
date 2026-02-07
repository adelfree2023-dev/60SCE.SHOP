/**
 * Schema Manager Tests
 * Verifies PostgreSQL schema lifecycle operations
 */

import { publicPool } from '@apex/db';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  createTenantSchema,
  dropTenantSchema,
  listTenantSchemas,
  type SchemaCreationResult,
  type SchemaVerificationResult,
  sanitizeSchemaName,
  verifySchemaExists,
} from './schema-manager.js';

// Mock the database pool
vi.mock('@apex/db', () => ({
  publicPool: {
    connect: vi.fn(),
  },
}));

describe('Schema Manager', () => {
  let mockClient: {
    query: ReturnType<typeof vi.fn>;
    release: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    mockClient = {
      query: vi.fn(),
      release: vi.fn(),
    };
    vi.mocked(publicPool.connect).mockResolvedValue(mockClient as any);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('sanitizeSchemaName', () => {
    it('should prefix with tenant_', () => {
      expect(sanitizeSchemaName('coffee')).toBe('tenant_coffee');
    });

    it('should lowercase subdomain', () => {
      expect(sanitizeSchemaName('CoffeeShop')).toBe('tenant_coffeeshop');
    });

    it('should allow hyphens and underscores', () => {
      expect(sanitizeSchemaName('coffee_shop-1')).toBe('tenant_coffee_shop-1');
    });

    it('should reject special characters', () => {
      expect(() => sanitizeSchemaName('coffee@shop')).toThrow(
        'Invalid subdomain'
      );
    });

    it('should reject too short subdomains', () => {
      expect(() => sanitizeSchemaName('ab')).toThrow('too short');
    });

    it('should handle names starting with numbers', () => {
      expect(sanitizeSchemaName('123shop')).toBe('tenant__123shop');
    });

    it('should reject too long subdomains', () => {
      expect(() => sanitizeSchemaName('a'.repeat(60))).toThrow(
        'exceeds 50 character limit'
      );
    });
  });

  describe('createTenantSchema', () => {
    it('should create schema successfully', async () => {
      // Mock: schema doesn't exist
      mockClient.query.mockResolvedValueOnce({ rows: [] });
      // Mock: CREATE SCHEMA success
      mockClient.query.mockResolvedValueOnce({ rows: [] });

      const result = await createTenantSchema('newstore');

      expect(result.schemaName).toBe('tenant_newstore');
      expect(result.durationMs).toBeGreaterThanOrEqual(0);
      expect(result.createdAt).toBeInstanceOf(Date);
      expect(mockClient.release).toHaveBeenCalled();
    });

    it('should throw if schema already exists', async () => {
      // Mock: schema exists
      mockClient.query.mockResolvedValueOnce({
        rows: [{ schema_name: 'tenant_existing' }],
      });

      await expect(createTenantSchema('existing')).rejects.toThrow(
        "Schema 'tenant_existing' already exists"
      );
      expect(mockClient.release).toHaveBeenCalled();
    });

    it('should always release connection', async () => {
      mockClient.query.mockRejectedValue(new Error('DB Error'));

      await expect(createTenantSchema('test')).rejects.toThrow('DB Error');
      expect(mockClient.release).toHaveBeenCalled();
    });
  });

  describe('verifySchemaExists', () => {
    it('should return exists=true with table count', async () => {
      mockClient.query
        .mockResolvedValueOnce({ rows: [{ schema_name: 'tenant_test' }] })
        .mockResolvedValueOnce({ rows: [{ count: '5' }] });

      const result = await verifySchemaExists('test');

      expect(result.exists).toBe(true);
      expect(result.tableCount).toBe(5);
      expect(result.schemaName).toBe('tenant_test');
    });

    it('should return exists=false for missing schema', async () => {
      mockClient.query.mockResolvedValueOnce({ rows: [] });

      const result = await verifySchemaExists('missing');

      expect(result.exists).toBe(false);
      expect(result.tableCount).toBe(0);
    });
  });

  describe('dropTenantSchema', () => {
    it('should drop existing schema', async () => {
      mockClient.query
        .mockResolvedValueOnce({ rows: [{ schema_name: 'tenant_old' }] })
        .mockResolvedValueOnce({ rows: [] });

      const result = await dropTenantSchema('old');

      expect(result).toBe(true);
      expect(mockClient.query).toHaveBeenLastCalledWith(
        'DROP SCHEMA IF EXISTS "tenant_old" CASCADE'
      );
    });

    it('should return false for non-existent schema', async () => {
      mockClient.query.mockResolvedValueOnce({ rows: [] });

      const result = await dropTenantSchema('nonexistent');

      expect(result).toBe(false);
    });

    it('should verify empty when flag set', async () => {
      mockClient.query
        .mockResolvedValueOnce({ rows: [{ schema_name: 'tenant_nonempty' }] })
        .mockResolvedValueOnce({ rows: [{ count: '3' }] });

      await expect(dropTenantSchema('nonempty', true)).rejects.toThrow(
        'not empty'
      );
    });
  });

  describe('listTenantSchemas', () => {
    it('should return sorted list of tenant schemas', async () => {
      mockClient.query.mockResolvedValueOnce({
        rows: [{ schema_name: 'tenant_alpha' }, { schema_name: 'tenant_beta' }],
      });

      const result = await listTenantSchemas();

      expect(result).toEqual(['tenant_alpha', 'tenant_beta']);
    });
  });
});

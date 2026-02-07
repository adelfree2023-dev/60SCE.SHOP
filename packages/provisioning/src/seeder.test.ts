/**
 * Seeder Tests
 */

import { createTenantDb } from '@apex/db';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { isSeeded, seedTenantData } from './seeder.js';

vi.mock('@apex/db', () => ({
  createTenantDb: vi.fn(),
  users: { id: 'users_id' },
  stores: { id: 'stores_id' },
  settings: {},
}));

describe('Tenant Seeder', () => {
  let mockDb: any;

  beforeEach(() => {
    mockDb = {
      insert: vi.fn().mockReturnValue({
        values: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([{ id: 'uuid_123' }]),
        }),
      }),
      select: vi.fn().mockReturnValue({
        from: vi.fn().mockResolvedValue([{ count: 1 }]),
      }),
    };
    vi.mocked(createTenantDb).mockReturnValue(mockDb);
  });

  it('should seed data in correct order', async () => {
    const result = await seedTenantData({
      subdomain: 'test',
      adminEmail: 'admin@test.com',
      storeName: 'Test Store',
    });

    expect(result.adminId).toBe('uuid_123');
    expect(mockDb.insert).toHaveBeenCalledTimes(3);
  });

  it('should check if seeded correctly', async () => {
    const seeded = await isSeeded('test');
    expect(seeded).toBe(true);
  });
});

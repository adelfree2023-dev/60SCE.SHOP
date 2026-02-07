/**
 * Migration Runner Tests
 */

import { createTenantDb } from '@apex/db';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { runTenantMigrations } from './runner.js';

vi.mock('@apex/db', () => ({
  createTenantDb: vi.fn(),
  publicPool: {},
}));

vi.mock('drizzle-orm/postgres-js/migrator', () => ({
  migrate: vi.fn(),
}));

describe('Migration Runner', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should call drizzle migrate with correct paths', async () => {
    const mockDb = { execute: vi.fn() };
    vi.mocked(createTenantDb).mockReturnValue(mockDb as any);
    vi.mocked(migrate).mockResolvedValue(undefined);

    const result = await runTenantMigrations('test-store');

    expect(result.schemaName).toBe('tenant_test-store');
    expect(createTenantDb).toHaveBeenCalledWith('test-store');
    expect(migrate).toHaveBeenCalled();
  });

  it('should throw and log if migration fails', async () => {
    vi.mocked(migrate).mockRejectedValue(new Error('Migration syntax error'));

    await expect(runTenantMigrations('fail-store')).rejects.toThrow(
      'Migration Failure'
    );
  });
});

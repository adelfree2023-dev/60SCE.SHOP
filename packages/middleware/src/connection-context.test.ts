/**
 * Connection Context Tests
 * Verifies AsyncLocalStorage isolation for multi-tenant requests
 */

import { beforeEach, describe, expect, it } from 'vitest';
import {
  getCurrentTenantContext,
  getCurrentTenantId,
  hasTenantContext,
  requireTenantContext,
  runWithTenantContext,
  type TenantContext,
  tenantStorage,
} from './connection-context';

describe('Tenant Context Management', () => {
  const mockContext: TenantContext = {
    tenantId: 'tenant_123',
    subdomain: 'test-store',
    plan: 'basic',
    features: ['products', 'orders'],
    createdAt: new Date('2026-01-01'),
  };

  beforeEach(() => {
    // Ensure clean state
    expect(hasTenantContext()).toBe(false);
  });

  describe('runWithTenantContext', () => {
    it('should execute callback with tenant context set', async () => {
      const result = await runWithTenantContext(mockContext, () => {
        expect(getCurrentTenantId()).toBe('tenant_123');
        expect(getCurrentTenantContext()?.subdomain).toBe('test-store');
        return 'success';
      });

      expect(result).toBe('success');
    });

    it('should handle synchronous callbacks', () => {
      const result = runWithTenantContext(mockContext, () => {
        return getCurrentTenantId();
      });

      expect(result).toBe('tenant_123');
    });

    it('should handle asynchronous callbacks', async () => {
      const result = await runWithTenantContext(mockContext, async () => {
        await new Promise((resolve) => setTimeout(resolve, 10));
        return getCurrentTenantContext()?.plan;
      });

      expect(result).toBe('basic');
    });

    it('should isolate contexts between concurrent executions', async () => {
      const context1: TenantContext = {
        ...mockContext,
        tenantId: 'tenant_1',
        subdomain: 'store-1',
      };
      const context2: TenantContext = {
        ...mockContext,
        tenantId: 'tenant_2',
        subdomain: 'store-2',
      };

      const results: string[] = [];

      await Promise.all([
        runWithTenantContext(context1, async () => {
          await new Promise((resolve) => setTimeout(resolve, 20));
          results.push(`1:${getCurrentTenantId()}`);
        }),
        runWithTenantContext(context2, async () => {
          await new Promise((resolve) => setTimeout(resolve, 10));
          results.push(`2:${getCurrentTenantId()}`);
        }),
      ]);

      expect(results).toContain('1:tenant_1');
      expect(results).toContain('2:tenant_2');
      expect(results).toHaveLength(2);
    });

    it('should clear context after execution', () => {
      runWithTenantContext(mockContext, () => {
        expect(hasTenantContext()).toBe(true);
      });

      expect(hasTenantContext()).toBe(false);
    });
  });

  describe('getCurrentTenantId', () => {
    it('should return null when no context', () => {
      expect(getCurrentTenantId()).toBeNull();
    });

    it('should return tenant ID when in context', () => {
      runWithTenantContext(mockContext, () => {
        expect(getCurrentTenantId()).toBe('tenant_123');
      });
    });
  });

  describe('getCurrentTenantContext', () => {
    it('should return null when no context', () => {
      expect(getCurrentTenantContext()).toBeNull();
    });

    it('should return full context when set', () => {
      runWithTenantContext(mockContext, () => {
        const ctx = getCurrentTenantContext();
        expect(ctx).toEqual(mockContext);
      });
    });
  });

  describe('requireTenantContext', () => {
    it('should throw when no context', () => {
      expect(() => requireTenantContext()).toThrow(
        'S2 Violation: Tenant context required'
      );
    });

    it('should return context when available', () => {
      runWithTenantContext(mockContext, () => {
        const ctx = requireTenantContext();
        expect(ctx.tenantId).toBe('tenant_123');
      });
    });
  });

  describe('hasTenantContext', () => {
    it('should return false outside context', () => {
      expect(hasTenantContext()).toBe(false);
    });

    it('should return true inside context', () => {
      runWithTenantContext(mockContext, () => {
        expect(hasTenantContext()).toBe(true);
      });
    });
  });

  describe('Context Immutability', () => {
    it('should not allow context mutation', () => {
      runWithTenantContext(mockContext, () => {
        const ctx = getCurrentTenantContext();
        // @ts-expect-error - Testing immutability
        expect(() => {
          ctx.tenantId = 'hacked';
        }).toThrow();
      });
    });
  });
});

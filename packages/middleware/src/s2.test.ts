import type { Request, Response } from 'express';
import { describe, expect, it, vi } from 'vitest';
import { tenantStorage } from './tenant-context';
import { extractSubdomain, resolveTenant } from './tenant-resolution';

describe('S2 Middleware: Tenant Resolution', () => {
  it('should extract subdomain from host header', () => {
    expect(extractSubdomain('coffee.apex.com')).toBe('coffee');
    expect(extractSubdomain('tenant.localhost:3000')).toBe('tenant');
    expect(extractSubdomain('apex.com')).toBeNull();
    expect(extractSubdomain('www.apex.com')).toBeNull();
  });

  it('should resolve tenant and attach to context', async () => {
    const req = {
      headers: { host: 'test-tenant.apex.com' },
    } as Request;
    const res = {} as Response;
    const next = vi.fn();

    // We need to wrap this in a promise because resolveTenant is async
    // and uses a callback for run()
    await new Promise<void>((resolve) => {
      resolveTenant(req, res, () => {
        // Assertions inside the context
        const store = tenantStorage.getStore();
        expect(store).toBeDefined();
        expect(store?.subdomain).toBe('test-tenant');
        expect(store?.tenantId).toBe('mock-tenant-id'); // Matching the mock in logic
        next();
        resolve();
      });
    });

    expect(next).toHaveBeenCalled();
  });
});

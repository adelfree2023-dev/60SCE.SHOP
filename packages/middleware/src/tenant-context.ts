import { AsyncLocalStorage } from 'async_hooks';

export interface TenantContext {
  tenantId: string;
  subdomain: string;
  plan: 'free' | 'basic' | 'pro' | 'enterprise';
  features: string[];
}

// Global storage for the current request's tenant context
export const tenantStorage = new AsyncLocalStorage<TenantContext>();

/**
 * Helper to get the current tenant context.
 * Throws if called outside of a tenant context (S2 Enforcement).
 */
export function getTenantContext(): TenantContext {
  const store = tenantStorage.getStore();
  if (!store) {
    throw new Error(
      'S2 Violation: Tenant context accessed outside of tenant scope'
    );
  }
  return store;
}

/**
 * Helper to check if we are strictly inside a tenant context
 */
export function hasTenantContext(): boolean {
  return !!tenantStorage.getStore();
}

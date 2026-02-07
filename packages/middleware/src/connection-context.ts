/**
 * Connection Context Management
 * S2 Protocol: Tenant Isolation via AsyncLocalStorage
 * 
 * Provides request-scoped tenant context for database operations
 */

import { AsyncLocalStorage } from 'async_hooks';

/**
 * Tenant context stored per request
 */
export interface TenantContext {
    readonly tenantId: string;
    readonly subdomain: string;
    readonly plan: 'free' | 'basic' | 'pro' | 'enterprise';
    readonly features: readonly string[];
    readonly createdAt: Date;
}

/**
 * AsyncLocalStorage instance for tenant context
 * Usage: tenantStorage.run(context, () => { /* your code */ })
 */
export const tenantStorage = new AsyncLocalStorage<TenantContext>();

/**
 * Execute function within a tenant context
 * @param context - Tenant context to set
 * @param callback - Function to execute within context
 * @returns Result of callback
 */
export function runWithTenantContext<T>(
    context: TenantContext,
    callback: () => T | Promise<T>
): T | Promise<T> {
    return tenantStorage.run(context, callback);
}

/**
 * Get current tenant ID from AsyncLocalStorage
 * @returns Tenant ID or null if not in context
 */
export function getCurrentTenantId(): string | null {
    const store = tenantStorage.getStore();
    return store?.tenantId ?? null;
}

/**
 * Get full tenant context from AsyncLocalStorage
 * @returns TenantContext or null if not in context
 */
export function getCurrentTenantContext(): TenantContext | null {
    return tenantStorage.getStore() ?? null;
}

/**
 * Require tenant context - throws if not present
 * @returns TenantContext (guaranteed)
 * @throws Error if no tenant context found
 */
export function requireTenantContext(): TenantContext {
    const context = getCurrentTenantContext();
    if (!context) {
        throw new Error('S2 Violation: Tenant context required but not found. Ensure middleware is configured.');
    }
    return context;
}

/**
 * Check if currently running within a tenant context
 * @returns boolean indicating context presence
 */
export function hasTenantContext(): boolean {
    return tenantStorage.getStore() !== undefined;
}

import { getTenantContext } from './tenant-context.js';

/**
 * Utility to get the current tenant ID from request context.
 * Used primarily for database schema switching.
 * @throws if outside context
 */
export function getCurrentTenantId(): string {
    const context = getTenantContext();
    return context.tenantId;
}

/**
 * Utility to get the current tenant subdomain from request context.
 */
export function getCurrentSubdomain(): string {
    const context = getTenantContext();
    return context.subdomain;
}

/**
 * Helper to determine the database schema name for the current tenant.
 */
export function getTenantSchemaName(): string {
    const tenantId = getCurrentTenantId();
    return `tenant_${tenantId}`;
}

/**
 * S2: Tenant Isolation Protocol
 * Schema-based isolation using Drizzle ORM
 */

import { validateEnv } from '@apex/config';
import { drizzle } from 'drizzle-orm/node-postgres';
import pkg from 'pg';
const { Pool } = pkg;

export * from './schema.js';

const env = validateEnv();

// Connection pool for public schema (tenant management)
export const publicPool = new Pool({
  connectionString: env.DATABASE_URL,
  ssl: env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

// Drizzle instance for public schema
export const publicDb = drizzle(publicPool);

/**
 * Execute operation within tenant context using shared pool
 */
export async function withTenantConnection<T>(
  tenantId: string,
  operation: (db: any) => Promise<T>
): Promise<T> {
  const client = await publicPool.connect();

  try {
    // 🔒 S2 Enforcement: Switch to tenant context
    await client.query(`SET search_path TO "tenant_${tenantId}", public`);

    const db = drizzle(client);
    const result = await operation(db);
    return result;
  } finally {
    // 🧹 Cleanup: Reset context before returning to pool
    await client.query('SET search_path TO public');
    client.release();
  }
}

/**
 * Create a Drizzle instance for a specific tenant
 * Note: For production, use withTenantConnection for proper isolation.
 * This helper is for one-off operations like seeding.
 */
export function createTenantDb(tenantId: string) {
  // In a real implementation, this would return a proxy or handle search_path
  // For now, we return publicDb but the caller must be aware or use withTenantConnection
  return publicDb;
}

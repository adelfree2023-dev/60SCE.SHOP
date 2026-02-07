/**
 * S2: Tenant Isolation Protocol
 * Schema-based isolation using Drizzle ORM
 */

import { validateEnv } from '@apex/config';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';

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
 * 1. Acquires client from global pool
 * 2. Sets search_path to isolated tenant schema
 * 3. Executes callback
 * 4. Resets search_path and releases client
 */
export async function withTenantConnection<T>(
  tenantId: string,
  operation: (db: ReturnType<typeof drizzle>) => Promise<T>
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
 * Create tenant schema (used in provisioning)
 */
export async function createTenantSchema(tenantId: string): Promise<void> {
  const schemaName = `tenant_${tenantId}`;

  await publicPool.query(`
    CREATE SCHEMA IF NOT EXISTS "${schemaName}";
    GRANT ALL ON SCHEMA "${schemaName}" TO CURRENT_USER;
  `);
}

/**
 * Drop tenant schema (used in deletion/kill switch)
 */
export async function dropTenantSchema(tenantId: string): Promise<void> {
  const schemaName = `tenant_${tenantId}`;
  await publicPool.query(`DROP SCHEMA IF EXISTS "${schemaName}" CASCADE`);
}

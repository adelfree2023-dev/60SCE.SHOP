/**
 * Migration Runner
 * Handles programmatic execution of Drizzle migrations for tenant schemas
 */

import { createTenantDb, publicPool } from '@apex/db';
import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import path from 'path';

export interface MigrationResult {
  schemaName: string;
  appliedCount: number;
  durationMs: number;
}

/**
 * Run migrations for a specific tenant schema
 * @param subdomain - Tenant subdomain
 * @returns Migration result metadata
 * @throws Error if migration fails
 */
export async function runTenantMigrations(
  subdomain: string
): Promise<MigrationResult> {
  const startTime = performance.now();
  const schemaName = `tenant_${subdomain.toLowerCase()}`;

  // Create a tenant-specific connection
  const db = createTenantDb(subdomain);

  // Path to migrations folder (assuming standard project structure)
  // In a real monorepo, this would point to @apex/db/migrations
  const migrationsPath = path.resolve(
    process.cwd(),
    '../../packages/db/migrations'
  );

  try {
    // Execute migrations
    // Note: Drizzle's migrate for node-postgres/postgres-js handles schema-scoped migrations
    // when the connection has SET search_path already set (which createTenantDb does)
    await migrate(db as any, {
      migrationsFolder: migrationsPath,
      migrationsSchema: 'drizzle', // Store migration history in a separate schema or same?
    });

    const durationMs = performance.now() - startTime;

    return {
      schemaName,
      appliedCount: 0, // Drizzle doesn't return count easily in programmatic call
      durationMs,
    };
  } catch (error) {
    console.error(`Migration failed for schema ${schemaName}:`, error);
    throw new Error(
      `Migration Failure: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Check migration status for a tenant
 * @param subdomain - Tenant subdomain
 */
export async function getMigrationStatus(subdomain: string) {
  const db = createTenantDb(subdomain);

  try {
    // Query the drizzle migrations table if it exists
    const result = await db.execute(sql`
      SELECT id, hash, created_at 
      FROM drizzle.__drizzle_migrations 
      ORDER BY created_at DESC
    `);

    return result.rows;
  } catch (e) {
    return []; // Migrations table might not exist yet
  }
}

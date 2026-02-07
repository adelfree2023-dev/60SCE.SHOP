/**
 * Tenant Data Seeder
 * Seeds initial data (Admin user, default settings) for new stores
 */

import { createTenantDb, settings, stores, users } from '@apex/db';
import { sql } from 'drizzle-orm';

export interface SeedOptions {
  subdomain: string;
  adminEmail: string;
  storeName: string;
}

export interface SeedResult {
  adminId: string;
  storeId: string;
  seededAt: Date;
}

/**
 * Seed initial data for a new tenant
 * @param options - Seeding configuration
 * @returns Seeding metadata
 */
export async function seedTenantData(
  options: SeedOptions
): Promise<SeedResult> {
  const db = createTenantDb(options.subdomain);

  try {
    // 1. Create Default Store Record
    const storeResult = await db
      .insert(stores)
      .values({
        name: options.storeName,
        subdomain: options.subdomain,
        status: 'active',
        plan: 'free',
      })
      .returning({ id: stores.id });

    const storeId = storeResult[0].id;

    // 2. Create Initial Admin User
    // Note: Password hash should be handled by auth service, using a placeholder/temp for now
    const userResult = await db
      .insert(users)
      .values({
        email: options.adminEmail,
        role: 'admin',
        status: 'active',
      })
      .returning({ id: users.id });

    const adminId = userResult[0].id;

    // 3. Seed Default Settings
    await db.insert(settings).values([
      { key: 'site_name', value: options.storeName },
      { key: 'currency', value: 'USD' },
      { key: 'timezone', value: 'UTC' },
      { key: 'maintenance_mode', value: 'false' },
    ]);

    return {
      adminId,
      storeId,
      seededAt: new Date(),
    };
  } catch (error) {
    console.error(`Seeding failed for ${options.subdomain}:`, error);
    throw new Error(
      `Seeding Failure: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Verify if tenant has been seeded
 * @param subdomain - Tenant subdomain
 */
export async function isSeeded(subdomain: string): Promise<boolean> {
  const db = createTenantDb(subdomain);
  try {
    const result = await db.select({ count: sql`count(*)` }).from(users);
    return Number(result[0].count) > 0;
  } catch (e) {
    return false;
  }
}

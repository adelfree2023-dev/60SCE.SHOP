#!/usr/bin/env bun
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as crypto from 'crypto';
import { env } from '../packages/config/src/index';
import { SchemaCreatorService } from '../packages/provisioning/src/services/schema-creator.service';
import { DataSeederService } from '../packages/provisioning/src/services/data-seeder.service';
import { TraefikRouterService } from '../packages/provisioning/src/services/traefik-router.service';

// Use a simple encryption/hashing helper for PII
const hashEmail = (email: string) => crypto.createHash('sha256').update(email.toLowerCase()).digest('hex');

const pool = new Pool({ connectionString: env.DATABASE_URL });
const db = drizzle(pool);

async function provisionTenant(name: string, email: string) {
    const startTime = Date.now();
    console.log(`🚀 Starting Provisioning Flow for: ${name}...`);
    console.log('='.repeat(60));

    try {
        // PHASE 1: Schema Creation
        console.log('\n🔧 PHASE 1: Schema Creation (S2 Isolation)');
        const schemaCreator = new SchemaCreatorService(pool as any, db as any);
        const schemaName = await schemaCreator.createSchema(name);
        console.log(`✅ Schema created: ${schemaName}`);

        // PHASE 2: Data Seeding
        console.log('\n🌱 PHASE 2: Data Seeding');
        const dataSeeder = new DataSeederService(pool as any, db as any);
        await dataSeeder.seedData(name, 'standard');
        console.log(`✅ Starter data seeded`);

        // PHASE 3: Traefik Routing
        console.log('\n🚦 PHASE 3: Traefik Routing');
        const traefikRouter = new TraefikRouterService();
        await traefikRouter.createRoute(name);
        console.log(`✅ Route created: ${name}.apex.localhost`);

        // PHASE 4: Register Tenant
        console.log('\n📝 PHASE 4: Tenant Registration');
        const tenantId = crypto.randomUUID();
        const schemaNameFinal = `tenant_${tenantId}`;

        // We need to rename the schema created in Phase 1 to match the ID
        await pool.query(`ALTER SCHEMA ${schemaName} RENAME TO ${schemaNameFinal}`);

        await pool.query(`
      INSERT INTO public.tenants (id, name, subdomain, owner_email, owner_email_hash, status)
      VALUES ($1, $2, $3, $4, $5, 'active')
      ON CONFLICT (subdomain) DO NOTHING
    `, [tenantId, name, name, email, hashEmail(email)]);
        console.log(`✅ Tenant registered in public.tenants with ID: ${tenantId}`);

        // PHASE 5: Audit Logging
        console.log('\n📝 PHASE 5: Audit Logging (S4)');
        const provisionDuration = Date.now() - startTime;
        await pool.query(`
      INSERT INTO public.audit_logs (user_id, action, tenant_id, duration, status)
      VALUES ('cli', 'TENANT_PROVISIONED', $1, $2, 'success')
    `, [name, provisionDuration]);
        console.log(`✅ Audit log created`);

        // Calculate duration
        const duration = (Date.now() - startTime) / 1000;

        // Final summary
        console.log('\n' + '='.repeat(60));
        console.log('✨ PROVISIONING COMPLETE!');
        console.log('='.repeat(60));
        console.log(`📊 Schema: ${schemaName}`);
        console.log(`🌐 URL: http://${name}.apex.localhost`);
        console.log(`⏱️ Duration: ${duration.toFixed(2)}s`);

        if (duration > 55) {
            console.warn('⚠️ WARNING: Exceeded 55s threshold (Pillar 3 Violation)');
        } else {
            console.log('🎯 NORTH STAR GOAL: ✅ MET (< 55s)');
        }
        console.log('='.repeat(60));

        await pool.end();
    } catch (error) {
        console.error('\n❌ PROVISIONING FAILED:');
        console.error(error);
        await pool.end();
        process.exit(1);
    }
}

// Parse CLI arguments
const args = process.argv.slice(2);
const storeName = args.find(a => a.startsWith('--store-name='))?.split('=')[1];
const ownerEmail = args.find(a => a.startsWith('--owner-email='))?.split('=')[1];

if (storeName && ownerEmail) {
    provisionTenant(storeName, ownerEmail);
} else {
    console.log(`
❌ Missing arguments. Usage:

  bun run provision --store-name='myshop' --owner-email='user@example.com'

Example:
  bun run provision --store-name='fashion-store' --owner-email='owner@fashion.com'
  `);
    process.exit(1);
}

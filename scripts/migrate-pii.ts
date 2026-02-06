import { Pool } from 'pg';
import { EncryptionService } from './packages/encryption/src/encryption.service';

/**
 * [DATA] Phase 3: PII Migration Script (Docker Container Root Version - CLEAN)
 * Run this inside the apex-api container at /app/migrate-pii.ts
 */
async function migrate() {
    console.log('🚀 Starting PII Migration INSIDE Docker Container (Root)...');

    const connectionString = process.env.DATABASE_URL;

    if (!connectionString) {
        console.error('❌ ERROR: DATABASE_URL not found in environment.');
        process.exit(1);
    }

    const pool = new Pool({
        connectionString: connectionString,
        connectionTimeoutMillis: 10000,
    });

    const encryptionService = new EncryptionService();
    // Simulate NestJS lifecycle
    (encryptionService as any).onModuleInit();

    let client;
    try {
        client = await pool.connect();
        console.log('✅ Database Connection Established.');

        const tenantsRes = await client.query('SELECT id, owner_email FROM public.tenants');
        console.log(`📊 Found ${tenantsRes.rows.length} tenants.`);

        let migratedCount = 0;
        for (const row of tenantsRes.rows) {
            if (row.owner_email && !row.owner_email.startsWith('enc:')) {
                const encrypted = await encryptionService.encryptDbValue(row.owner_email);
                await client.query('UPDATE public.tenants SET owner_email = $1 WHERE id = $2', [encrypted, row.id]);
                migratedCount++;
            }
        }
        console.log(`✅ Successfully encrypted ${migratedCount} tenant owner emails.`);
        console.log('🎉 Phase 3 Migration Completed Successfully.');
    } catch (error: any) {
        console.error(`❌ Migration failed: ${error.message}`);
        process.exit(1);
    } finally {
        if (client) client.release();
        await pool.end();
    }
}

migrate();

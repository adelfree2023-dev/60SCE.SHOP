import { Pool } from 'pg';

const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://apex:apex_secure_pass_2026@apex-postgres:5432/apex_v2';

async function purge() {
    console.log('🛡️  [PURGE] Starting forensic sanitization of server environment...');
    const pool = new Pool({ connectionString: DATABASE_URL });

    try {
        // 1. Get all tenant schemas
        const schemasRes = await pool.query(`
            SELECT schema_name 
            FROM information_schema.schemata 
            WHERE schema_name LIKE 'tenant_%'
        `);
        const schemas = schemasRes.rows.map(r => r.schema_name);

        console.log(`📦 Found ${schemas.length} tenant schemas to purge.`);

        // 2. Drop all tenant schemas (CASCADE deletes everything inside them)
        for (const schema of schemas) {
            console.log(`🗑️  Dropping schema: ${schema}`);
            await pool.query(`DROP SCHEMA IF EXISTS "${schema}" CASCADE`);
        }

        // 3. Purge public tables
        console.log('🧹 Purging public tables: tenants, audit_logs');
        await pool.query('TRUNCATE TABLE public.tenants CASCADE');
        await pool.query('TRUNCATE TABLE public.audit_logs CASCADE');

        console.log('✨ [SUCCESS] Environment sanitized. SEC-L4 compliance ready.');
    } catch (error: any) {
        console.error('❌ [ERROR] Purge failed:', error.message);
        process.exit(1);
    } finally {
        await pool.end();
    }
}

purge();

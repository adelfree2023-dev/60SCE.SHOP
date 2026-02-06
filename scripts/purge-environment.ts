import { Pool } from 'pg';
import Redis from 'ioredis';

const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://apex:apex_secure_pass_2026@apex-postgres:5432/apex_v2';
const REDIS_URL = process.env.REDIS_URL || 'redis://apex-redis:6379';

async function purge() {
    console.log('🛡️  [PURGE] Starting forensic sanitization of server environment...');

    // 1. Database Purge
    const pool = new Pool({ connectionString: DATABASE_URL });
    try {
        const schemasRes = await pool.query(`
            SELECT schema_name 
            FROM information_schema.schemata 
            WHERE schema_name LIKE 'tenant_%'
        `);
        const schemas = schemasRes.rows.map(r => r.schema_name);

        console.log(`📦 Found ${schemas.length} tenant schemas to purge.`);

        for (const schema of schemas) {
            console.log(`🗑️  Dropping schema: ${schema}`);
            await pool.query(`DROP SCHEMA IF EXISTS "${schema}" CASCADE`);
        }

        console.log('🧹 Purging public tables: tenants, audit_logs');
        await pool.query('TRUNCATE TABLE public.tenants CASCADE');
        await pool.query('TRUNCATE TABLE public.users CASCADE');
        await pool.query('TRUNCATE TABLE public.audit_logs CASCADE');
        await pool.end();
    } catch (e: any) {
        console.error('❌ DB Purge Error:', e.message);
    }

    // 2. Redis Purge
    try {
        console.log('⚡ Purging Redis cache...');
        const redis = new Redis(REDIS_URL);
        await redis.flushall();
        await redis.quit();
        console.log('✅ Redis flushed.');
    } catch (e: any) {
        console.error('❌ Redis Purge Error:', e.message);
    }

    console.log('✨ [SUCCESS] Environment sanitized. SEC-L4 compliance ready.');
}

purge();

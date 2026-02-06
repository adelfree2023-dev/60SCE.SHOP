#!/usr/bin/env bun
import { Pool } from 'pg';
import { env } from '../packages/config/src/index';
import * as fs from 'fs';
import * as path from 'path';

const pool = new Pool({ connectionString: env.DATABASE_URL });

async function runMigration() {
    console.log('🐘 Starting Customer Portal Migration...');
    console.log('='.repeat(60));

    try {
        const migrationPath = path.join(__dirname, '../migrations/002_customer_portal.sql');
        const sql = fs.readFileSync(migrationPath, 'utf8');

        console.log(`📄 Reading migration from: ${migrationPath}`);

        const client = await pool.connect();
        try {
            console.log('🔗 Connected to database, executing migration...');
            await client.query(sql);
            console.log('✅ Migration successful!');
        } finally {
            client.release();
        }

        await pool.end();
    } catch (error) {
        console.error('\n❌ MIGRATION FAILED:');
        console.error(error);
        await pool.end();
        process.exit(1);
    }
}

runMigration();

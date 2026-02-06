import { Pool } from 'pg';
import * as crypto from 'crypto';

/**
 * [OPS] Phase 5: Super Admin Seeder
 * Email: admin@60sec.shop
 * Password: ApexAdmin2024!
 */
async function seed() {
    console.log('🌱 Seeding Super Admin...');

    const pool = new Pool({
        connectionString: process.env.DATABASE_URL
    });

    const email = 'admin@60sec.shop';
    const password = 'ApexAdmin2024!';
    const pepper = process.env.PASSWORD_PEPPER || '';

    // Generate Hash (IdentityService logic)
    const salt = crypto.randomBytes(16).toString('hex');
    const pepperedPassword = password + pepper;

    const derivedKey = await new Promise<Buffer>((resolve, reject) => {
        crypto.scrypt(pepperedPassword, salt, 64, { N: 16384, r: 8, p: 1 }, (err: Error | null, key: Buffer) => {
            if (err) reject(err);
            resolve(key);
        });
    });

    const hash = `${salt}:${derivedKey.toString('hex')}`;

    try {
        await pool.query(`
            INSERT INTO public.users (email, password_hash, role, is_verified)
            VALUES ($1, $2, 'super-admin', true)
            ON CONFLICT (email, tenant_id) DO UPDATE SET password_hash = EXCLUDED.password_hash;
        `, [email, hash]);

        console.log(`✅ Super Admin created: ${email}`);
    } catch (error: any) {
        console.error(`❌ Seeding failed: ${error.message}`);
    } finally {
        await pool.end();
    }
}

seed();

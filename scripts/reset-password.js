#!/usr/bin/env node
/**
 * Password Reset Script
 * 
 * Usage: node reset-password.js <email> <new_password>
 * 
 * This script updates a user's password using the same scrypt+pepper
 * hashing mechanism as the identity service.
 * 
 * Run on server: node scripts/reset-password.js adel@gmail.com "adel@gmail.com"
 */

const crypto = require('crypto');
const { Pool } = require('pg');

// Load environment from .env file if exists
require('dotenv').config();

const pepper = process.env.PASSWORD_PEPPER || '';
const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
    console.error('❌ DATABASE_URL environment variable not set');
    console.log('   Set it via: export DATABASE_URL=postgresql://user:pass@host:5432/database');
    process.exit(1);
}

const pool = new Pool({ connectionString: databaseUrl });

async function hashPassword(password) {
    const salt = crypto.randomBytes(16).toString('hex');
    const pepperedPassword = password + pepper;

    return new Promise((resolve, reject) => {
        crypto.scrypt(pepperedPassword, salt, 64, { N: 32768, r: 8, p: 1, maxmem: 64 * 1024 * 1024 }, (err, derivedKey) => {
            if (err) reject(err);
            resolve(`${salt}:${derivedKey.toString('hex')}`);
        });
    });
}

async function resetPassword(email, newPassword) {
    console.log(`\n🔐 Password Reset Script`);
    console.log(`   Email: ${email}`);
    console.log(`   Pepper: ${pepper ? '✓ Set' : '✗ Not set (using empty string)'}`);
    console.log('');

    try {
        // Check if user exists
        const checkResult = await pool.query(
            'SELECT id, email, role, tenant_id FROM public.users WHERE email = $1',
            [email]
        );

        if (checkResult.rows.length === 0) {
            console.error(`❌ User with email "${email}" not found`);
            process.exit(1);
        }

        const user = checkResult.rows[0];
        console.log(`   Found user: ${user.email} (Role: ${user.role}, Tenant: ${user.tenant_id || 'N/A'})`);

        // Hash new password
        console.log('   Hashing password with scrypt (N=32768, r=8, p=1)...');
        const hashedPassword = await hashPassword(newPassword);
        console.log(`   Hash generated: ${hashedPassword.substring(0, 20)}...`);

        // Update password
        await pool.query(
            'UPDATE public.users SET password_hash = $1 WHERE id = $2',
            [hashedPassword, user.id]
        );

        console.log(`\n✅ Password successfully reset for ${email}`);
        console.log(`   You can now login with the new password.\n`);

    } catch (error) {
        console.error(`\n❌ Error: ${error.message}`);
        process.exit(1);
    } finally {
        await pool.end();
    }
}

// Parse command line arguments
const args = process.argv.slice(2);
if (args.length < 2) {
    console.log('Usage: node reset-password.js <email> <new_password>');
    console.log('Example: node reset-password.js adel@gmail.com "newpassword123"');
    process.exit(1);
}

const [email, newPassword] = args;
resetPassword(email, newPassword);

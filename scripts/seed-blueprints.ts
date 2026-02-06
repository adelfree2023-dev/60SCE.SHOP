import { Pool } from 'pg';

/**
 * [OPS] Seed Blueprints
 * This script populates the public.onboarding_blueprints table
 */
async function seed() {
    console.log('🌱 Seeding Onboarding Blueprints...');

    const pool = new Pool({
        connectionString: process.env.DATABASE_URL
    });

    const standardBlueprint = {
        name: 'standard',
        config: {
            products: [
                { name: 'Standard Product 1', price: 10.00, stock: 100, description: 'Starter product' },
                { name: 'Standard Product 2', price: 20.00, stock: 50, description: 'Premium version' }
            ],
            pages: [
                { title: 'Home', content: '<h1>Welcome to your store</h1>' },
                { title: 'About', content: '<p>About us page content...</p>' }
            ],
            settings: {
                storeName: 'My Apex Store',
                theme: 'modern'
            }
        },
        is_default: true
    };

    try {
        await pool.query(`
            INSERT INTO public.onboarding_blueprints (name, config, is_default)
            VALUES ($1, $2, $3)
            ON CONFLICT (name) DO UPDATE SET config = EXCLUDED.config;
        `, [standardBlueprint.name, JSON.stringify(standardBlueprint.config), standardBlueprint.is_default]);

        console.log(`✅ Blueprint seeded: ${standardBlueprint.name}`);
    } catch (error: any) {
        console.error(`❌ Seeding failed: ${error.message}`);
    } finally {
        await pool.end();
    }
}

seed();

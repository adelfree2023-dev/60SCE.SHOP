import { Injectable, Logger, Inject } from '@nestjs/common';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { sql } from 'drizzle-orm';

@Injectable()
export class DataSeederService {
    private readonly logger = new Logger(DataSeederService.name);
    private readonly pool: Pool;
    private readonly db: ReturnType<typeof drizzle>;

    constructor(
        @Inject(Pool) pool: Pool,
        @Inject('DATABASE_CONNECTION') db: ReturnType<typeof drizzle>
    ) {
        this.pool = pool;
        this.db = db;
    }

    /**
     * Seeds starter data from onboarding blueprint
     * @param tenantId - Tenant identifier
     * @param blueprintId - Blueprint to use (default: 'standard')
     */
    async seedData(tenantId: string, blueprintId: string = 'standard'): Promise<void> {
        const startTime = Date.now();
        const schemaName = `tenant_${tenantId}`;

        this.logger.log(`Seeding data for ${tenantId} using blueprint: ${blueprintId}`);

        try {
            // Fetch blueprint configuration
            const blueprint = await this.getBlueprint(blueprintId);
            if (!blueprint) {
                throw new Error(`Blueprint ${blueprintId} not found`);
            }

            // 1. Create core tables in parallel
            await this.createCoreTables(schemaName);

            // 2. Seed data in parallel (after tables exist)
            await Promise.all([
                blueprint.products?.length > 0 ? this.seedProducts(schemaName, blueprint.products) : Promise.resolve(),
                blueprint.pages?.length > 0 ? this.seedPages(schemaName, blueprint.pages) : Promise.resolve(),
                this.seedSettings(schemaName, blueprint.settings || {})
            ]);

            const duration = Date.now() - startTime;
            this.logger.log(`✅ Data seeded in ${duration}ms for ${tenantId}`);
        } catch (error: any) {
            this.logger.error(`Failed to seed data: ${error.message}`);
            throw error;
        }
    }

    /**
     * Creates core tenant tables
     */
    private async createCoreTables(schemaName: string): Promise<void> {
        const schema = sql.identifier(schemaName);

        await Promise.all([
            // Products table
            this.db.execute(sql`
                CREATE TABLE IF NOT EXISTS ${schema}.products (
                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    name VARCHAR(255) NOT NULL,
                    slug VARCHAR(255) UNIQUE NOT NULL,
                    description TEXT,
                    price DECIMAL(10,2) NOT NULL,
                    stock INTEGER DEFAULT 0,
                    images JSONB DEFAULT '[]'::jsonb,
                    status VARCHAR(50) DEFAULT 'published',
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
                )
            `),
            // Orders table
            this.db.execute(sql`
                CREATE TABLE IF NOT EXISTS ${schema}.orders (
                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    customer_id UUID,
                    status VARCHAR(50) DEFAULT 'pending',
                    total DECIMAL(10,2) NOT NULL,
                    items JSONB NOT NULL,
                    shipping_address JSONB,
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
                )
            `),
            // Pages table
            this.db.execute(sql`
                CREATE TABLE IF NOT EXISTS ${schema}.pages (
                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    title VARCHAR(255) NOT NULL,
                    slug VARCHAR(255) UNIQUE NOT NULL,
                    content TEXT,
                    published BOOLEAN DEFAULT false,
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
                )
            `),
            // Settings table
            this.db.execute(sql`
                CREATE TABLE IF NOT EXISTS ${schema}.settings (
                    key VARCHAR(255) PRIMARY KEY,
                    value TEXT NOT NULL
                )
            `)
        ]);

        this.logger.debug(`Core tables created for ${schemaName}`);
    }

    /**
     * Seeds products from blueprint
     */
    private async seedProducts(schemaName: string, products: any[]): Promise<void> {
        if (products.length === 0) return;

        for (const p of products) {
            const slug = p.slug || p.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
            await this.db.execute(sql`
                INSERT INTO ${sql.identifier(schemaName)}.products (name, slug, description, price, stock, images)
                VALUES (${p.name}, ${slug}, ${p.description || ''}, ${p.price}, ${p.stock || 0}, ${JSON.stringify(p.images || [])}::jsonb)
                ON CONFLICT (slug) DO NOTHING
            `);
        }

        this.logger.debug(`Seeded ${products.length} products`);
    }

    /**
     * Seeds pages from blueprint
     */
    private async seedPages(schemaName: string, pages: any[]): Promise<void> {
        if (pages.length === 0) return;

        for (const p of pages) {
            const slug = p.slug || p.title.toLowerCase().replace(/[^a-z0-9]+/g, '-');
            await this.db.execute(sql`
                INSERT INTO ${sql.identifier(schemaName)}.pages (title, slug, content, published)
                VALUES (${p.title}, ${slug}, ${p.content || ''}, true)
                ON CONFLICT (slug) DO NOTHING
            `);
        }

        this.logger.debug(`Seeded ${pages.length} pages`);
    }

    /**
     * Seeds settings
     */
    private async seedSettings(schemaName: string, settings: Record<string, any>): Promise<void> {
        for (const [key, value] of Object.entries(settings)) {
            await this.db.execute(sql`
                INSERT INTO ${sql.identifier(schemaName)}.settings (key, value)
                VALUES (${key}, ${JSON.stringify(value)})
                ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value
            `);
        }

        this.logger.debug(`Seeded settings`);
    }

    /**
     * Fetches blueprint configuration
     */
    private async getBlueprint(blueprintId: string) {
        const result = await this.pool.query(
            `SELECT config FROM public.onboarding_blueprints WHERE name = $1 OR id::text = $1 LIMIT 1`,
            [blueprintId]
        );

        if (result.rows.length === 0) return null;
        return result.rows[0].config;
    }
}

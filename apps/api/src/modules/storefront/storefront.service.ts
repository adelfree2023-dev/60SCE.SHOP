import { Injectable, Logger, ForbiddenException, NotFoundException, Inject } from '@nestjs/common';
import { Pool, QueryResult } from 'pg';
import { CacheService } from '@apex/cache';
import format from 'pg-format';
import { z } from 'zod';
import { UpdateHeroSchema } from './schemas/hero.schema';

@Injectable()
export class StorefrontService {
    private readonly logger = new Logger(StorefrontService.name);

    constructor(
        @Inject('CACHE_SERVICE') private readonly cacheService: CacheService
    ) { }

    /**
     * Update tenant branding (logo, colors, name) - Phase 5 Protected
     */
    async updateBranding(request: any, dto: any) {
        const tenantId = request.tenantId || request.raw?.tenantId;
        if (!tenantId) throw new Error('TENANT_CONTEXT_MISSING');

        const fields: string[] = [];
        const values: any[] = [];
        let idx = 1;

        if (dto.name) {
            fields.push(`name = $${idx++}`);
            values.push(dto.name);
        }
        if (dto.logoUrl !== undefined) {
            fields.push(`logo_url = $${idx++}`);
            values.push(dto.logoUrl || null);
        }
        if (dto.primaryColor) {
            fields.push(`primary_color = $${idx++}`);
            values.push(dto.primaryColor);
        }

        if (fields.length === 0) return { success: true };

        values.push(tenantId);
        await this.query(
            request,
            `UPDATE public.tenants SET ${fields.join(', ')} WHERE id = $${idx}`,
            values
        );

        await this.invalidateCache(request);
        return { success: true };
    }

    /**
     * Update or Create Hero Banner - Phase 5 Protected
     * [SEC] S2: Uses pg-format for safe schema interpolation
     */
    async updateHero(request: any, dto: any) {
        const tenantId = request.tenantId || request.raw?.tenantId;
        const tenantSchema = request.tenantSchema || request.raw?.tenantSchema;
        if (!tenantId || !tenantSchema) throw new Error('TENANT_CONTEXT_MISSING');

        // [SEC] S8: Zod URL Validation for CTA
        const validated = UpdateHeroSchema.parse(dto);

        const existing = await this.query(request, format('SELECT id FROM %I.banners ORDER BY priority ASC LIMIT 1', tenantSchema));

        if (existing.rows.length > 0) {
            const bannerId = existing.rows[0].id;
            await this.query(
                request,
                format('UPDATE %I.banners SET title = $1, subtitle = $2, image_url = $3, cta_text = $4, cta_url = $5, active = true WHERE id = $6', tenantSchema),
                [validated.title, validated.subtitle || null, validated.imageUrl || null, validated.ctaText, validated.ctaUrl, bannerId]
            );
        } else {
            await this.query(
                request,
                format('INSERT INTO %I.banners (title, subtitle, image_url, cta_text, cta_url, active, priority) VALUES ($1, $2, $3, $4, $5, true, 0)', tenantSchema),
                [validated.title, validated.subtitle || null, validated.imageUrl || null, validated.ctaText, validated.ctaUrl]
            );
        }

        await this.invalidateCache(request);
        return { success: true };
    }

    /**
     * Get tenant settings (P0 Load Test Target)
     * [SEC] S2: Uses pg-format for safe schema interpolation
     */
    async getSettings(request: any) {
        const tenantSchema = request.tenantSchema || request.raw?.tenantSchema;
        if (!tenantSchema) throw new Error('TENANT_CONTEXT_MISSING');

        const result = await this.query(request, format('SELECT * FROM %I.settings', tenantSchema));
        return result.rows;
    }

    /**
     * Get all products for storefront
     * [SEC] S2: Uses pg-format for safe schema interpolation
     */
    async getProducts(request: any) {
        // [SEC] S2: Standardized to use middleware-provided tenantSchema (UUID-based)
        const tenantSchema = request.tenantSchema || request.raw?.tenantSchema;
        if (!tenantSchema) throw new ForbiddenException('TENANT_CONTEXT_MISSING');

        try {
            const result = await this.query(
                request,
                format(`SELECT p.id, p.name, p.description, p.price, p.image_url as "imageUrl", 
                        p.category, p.stock, p.sku, p.status, p.created_at
                        FROM %I.products p 
                        WHERE p.status = 'published'
                        ORDER BY p.created_at DESC`, tenantSchema)
            );

            return {
                data: result.rows.map((row: any) => ({
                    ...row,
                    price: parseFloat(row.price) || 0,
                })),
                pagination: {
                    total: result.rows.length,
                    page: 1,
                    limit: result.rows.length,
                    totalPages: 1,
                }
            };
        } catch (error: any) {
            this.logger.warn(`Failed to get products: ${error.message}`);
            return { data: [], pagination: null };
        }
    }

    /**
     * Get single product by ID
     * [SEC] S2: Uses pg-format for safe schema interpolation
     */
    async getProductById(request: any, productId: string) {
        // [SEC] S2: Standardized to use middleware-provided tenantSchema (UUID-based)
        const tenantSchema = request.tenantSchema || request.raw?.tenantSchema;
        if (!tenantSchema) throw new ForbiddenException('TENANT_CONTEXT_MISSING');

        const result = await this.query(
            request,
            format(`SELECT p.id, p.name, p.description, p.price, p.image_url as "imageUrl", 
                    p.category, p.stock, p.sku, p.status, p.created_at
                    FROM %I.products p 
                    WHERE p.id = $1 AND p.status = 'published'`, tenantSchema),
            [productId]
        );

        if (result.rows.length === 0) {
            throw new NotFoundException(`Product ${productId} not found`);
        }

        const product = result.rows[0];
        return {
            ...product,
            price: parseFloat(product.price) || 0,
        };
    }



    private async query<T = any>(request: any, sql: string, params?: any[]): Promise<QueryResult<T>> {
        const client = request.dbClient || request.raw?.dbClient;
        if (!client) {
            throw new Error('Database client not available on request');
        }

        // [CRITICAL-002] Security Shield: Strict Schema & Table Validation
        this.validateTenantSchema(request, sql);

        return client.query(sql, params);
    }

    private validateTenantSchema(request: any, sql: string) {
        const expectedSchema = request.tenantSchema || request.raw?.tenantSchema;
        if (!expectedSchema) throw new Error('TENANT_SCHEMA_MISSING');

        // [SEC] S2: Strict UUID-based Schema Validation
        if (!/^tenant_[0-9a-f]{8}_[0-9a-f]{4}_[0-9a-f]{4}_[0-9a-f]{4}_[0-9a-f]{12}$/.test(expectedSchema)) {
            this.logger.error(`🚨 INVALID SCHEMA FORMAT: ${expectedSchema}`);
            throw new Error('INVALID_TENANT_SCHEMA_FORMAT');
        }

        // [SEC] S2: Strict UUID-based Schema Validation
        // Matches tenant_[uuid_with_underscores]
        const schemaRegex = /tenant_([0-9a-f]{8}_[0-9a-f]{4}_[0-9a-f]{4}_[0-9a-f]{4}_[0-9a-f]{12})/g;
        let match;
        while ((match = schemaRegex.exec(sql)) !== null) {
            if (match[0] !== expectedSchema) {
                this.logger.error(`🚨 CROSS-TENANT ATTEMPT: ${expectedSchema} tried to access ${match[0]}`);
                throw new Error('UNAUTHORIZED_SCHEMA_ACCESS');
            }
        }

        // 2. Table Whitelisting (prevent accessing public.users etc via dynamic SQL)
        const allowedTables = ['banners', 'products', 'categories', 'promotions', 'testimonials', 'orders', 'order_items', 'pages', 'settings'];
        const tableCheckRegex = new RegExp(`${expectedSchema}\\.([a-z0-9_]+)`, 'g');
        while ((match = tableCheckRegex.exec(sql)) !== null) {
            if (!allowedTables.includes(match[1])) {
                this.logger.error(`🚨 UNVETTED TABLE ACCESS: ${match[1]} in ${expectedSchema}`);
                throw new Error('RESTRICTED_TABLE_ACCESS');
            }
        }
    }

    /**
     * Get home page data for tenant
     * @param request - Request object with tenant context from TenantMiddleware
     * @returns Home page data with sections
     */
    async getHomePage(request: any) {
        const tenantId = request.tenantId || request.raw?.tenantId;
        const tenantSchema = request.tenantSchema || request.raw?.tenantSchema;
        const cacheKey = `storefront:home:${tenantId}`;

        if (!tenantId) {
            this.logger.error('Tenant context missing - request not processed by TenantMiddleware');
            throw new Error('TENANT_CONTEXT_MISSING');
        }

        this.logger.log(`Getting home page for tenant: ${tenantId}`);

        const cached = await this.cacheService.get(cacheKey);
        if (cached) {
            this.logger.debug(`Cache hit for tenant: ${tenantId}`);
            return cached;
        }

        this.logger.debug(`Cache miss for tenant: ${tenantId}, fetching from DB`);

        try {
            const tenantResult = await this.query(
                request,
                `SELECT id, name, logo_url, primary_color, subdomain FROM public.tenants WHERE id = $1 AND status = 'active'`,
                [tenantId]
            );

            if (tenantResult.rows.length === 0) {
                throw new NotFoundException(`Tenant ${tenantId} not found`);
            }

            const tenant = tenantResult.rows[0];
            const banners = await this.getHeroBanners(request, tenant.id);
            const bestSellers = await this.getBestSellers(request, tenant.id);
            const categories = await this.getFeaturedCategories(request, tenant.id);
            const promotions = await this.getPromotions(request, tenant.id);
            const testimonials = await this.getTestimonials(request, tenant.id);

            const homeData = {
                tenant: {
                    id: tenant.id,
                    name: tenant.name,
                    subdomain: tenant.subdomain,
                    logoUrl: tenant.logo_url,
                    primaryColor: tenant.primary_color,
                },
                sections: {
                    hero: banners,
                    bestSellers,
                    categories,
                    promotions,
                    testimonials,
                },
                metadata: {
                    lastUpdated: new Date().toISOString(),
                    cacheTTL: 300,
                },
            };

            await this.cacheService.set(cacheKey, homeData, 300);
            return homeData;
        } catch (error: any) {
            this.logger.error(`Failed to get home page for ${tenantId}: ${error.message}`);
            throw error;
        }
    }

    /**
     * Get hero banners from tenant schema
     * [SEC] S2: Uses pg-format for safe schema interpolation
     */
    private async getHeroBanners(request: any, tenantId: string) {
        const tenantSchema = request.tenantSchema || request.raw?.tenantSchema;
        try {
            const result = await this.query(
                request,
                format(`SELECT id, title, subtitle, image_url, cta_text, cta_url, priority
                        FROM %I.banners WHERE active = true ORDER BY priority ASC, created_at DESC LIMIT 5`, tenantSchema)
            );
            return result.rows;
        } catch (error: any) {
            this.logger.warn(`No banners table for tenant ${tenantId}: ${error.message}`);
            return [];
        }
    }

    /**
     * Get best selling products
     * [SEC] S2: Uses pg-format for safe schema interpolation
     */
    private async getBestSellers(request: any, tenantId: string) {
        const tenantSchema = request.tenantSchema || request.raw?.tenantSchema;
        try {
            const result = await this.query(
                request,
                format(`SELECT p.id, p.name, p.description, p.price, p.image_url, p.stock,
                        COALESCE(SUM(oi.quantity), 0) as total_sold
                        FROM %I.products p LEFT JOIN %I.order_items oi ON oi.product_id = p.id
                        WHERE p.status = 'published' AND p.stock > 0
                        GROUP BY p.id ORDER BY total_sold DESC, p.created_at DESC LIMIT 8`, tenantSchema, tenantSchema)
            );
            return result.rows;
        } catch (error: any) {
            this.logger.warn(`No products table for tenant ${tenantId}: ${error.message}`);
            return [];
        }
    }

    /**
     * Get featured categories
     * [SEC] S2: Uses pg-format for safe schema interpolation
     */
    private async getFeaturedCategories(request: any, tenantId: string) {
        const tenantSchema = request.tenantSchema || request.raw?.tenantSchema;
        try {
            const result = await this.query(
                request,
                format(`SELECT id, name, slug, image_url, description, product_count
                        FROM %I.categories WHERE featured = true AND active = true
                        ORDER BY priority ASC, name ASC LIMIT 6`, tenantSchema)
            );
            return result.rows;
        } catch (error: any) {
            this.logger.warn(`No categories table for tenant ${tenantId}: ${error.message}`);
            return [];
        }
    }

    /**
     * Get active promotions
     * [SEC] S2: Uses pg-format for safe schema interpolation
     */
    private async getPromotions(request: any, tenantId: string) {
        const tenantSchema = request.tenantSchema || request.raw?.tenantSchema;
        try {
            const result = await this.query(
                request,
                format(`SELECT id, title, description, discount_percent, banner_url, starts_at, ends_at
                        FROM %I.promotions WHERE active = true
                        AND (starts_at IS NULL OR starts_at <= NOW())
                        AND (ends_at IS NULL OR ends_at >= NOW())
                        ORDER BY priority ASC, created_at DESC LIMIT 3`, tenantSchema)
            );
            return result.rows;
        } catch (error: any) {
            this.logger.warn(`No promotions table for tenant ${tenantId}: ${error.message}`);
            return [];
        }
    }

    /**
     * Get customer testimonials
     * [SEC] S2: Uses pg-format for safe schema interpolation
     */
    private async getTestimonials(request: any, tenantId: string) {
        const tenantSchema = request.tenantSchema || request.raw?.tenantSchema;
        try {
            const result = await this.query(
                request,
                format(`SELECT id, customer_name, rating, review_text, product_name, created_at
                        FROM %I.testimonials WHERE published = true
                        ORDER BY rating DESC, created_at DESC LIMIT 6`, tenantSchema)
            );
            return result.rows;
        } catch (error: any) {
            this.logger.warn(`No testimonials table for tenant ${tenantId}: ${error.message}`);
            return [];
        }
    }

    /**
     * Invalidate cache for tenant home page
     */
    async invalidateCache(request: any): Promise<void> {
        const tenantId = request.tenantId || request.raw?.tenantId;
        const cacheKey = `storefront:home:${tenantId}`;
        await this.cacheService.del(cacheKey);
        this.logger.log(`Cache invalidated for tenant: ${tenantId}`);
    }

    /**
     * Warm up cache for tenant
     */
    async warmCache(request: any): Promise<void> {
        const tenantId = request.tenantId || request.raw?.tenantId;
        await this.getHomePage(request);
        this.logger.log(`Cache warmed for tenant: ${tenantId}`);
    }
}

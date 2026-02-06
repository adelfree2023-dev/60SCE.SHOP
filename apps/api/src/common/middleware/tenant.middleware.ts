import { Injectable, NestMiddleware, ForbiddenException, Logger, Inject } from '@nestjs/common';
import { Pool } from 'pg';
import format from 'pg-format';

@Injectable()
export class TenantMiddleware implements NestMiddleware {
    private readonly logger = new Logger(TenantMiddleware.name);
    private readonly pool: Pool;

    constructor(
        @Inject('DATABASE_POOL') boundPool: Pool,
    ) {
        this.pool = boundPool;
    }

    async use(req: any, res: any, next: () => void) {
        const url = req.url || '';
        const host = (req.headers['host'] || '') as string;
        let client: any = null;
        let released = false;

        const cleanup = () => {
            if (client && !released) {
                released = true;
                client.query('SET search_path TO public')
                    .catch(() => { })
                    .finally(() => client.release());
            }
        };

        try {
            // 1. SYSTEM BYPASS
            if (req.method === 'OPTIONS' || url === '/health' || url.startsWith('/provisioning') || url.startsWith('/super-admin')) {
                return next();
            }

            // 2. EXTRACTION LOGIC
            let subdomain: string | null = (req.headers['x-tenant-subdomain'] || req.headers['X-Tenant-Subdomain']) as string;

            this.logger.log(`🔍 Tenant resolution: Subdomain from header: ${subdomain} | Host: ${host}`);

            if (!subdomain) {
                const origin = req.headers['origin'] as string;
                if (origin) {
                    const match = origin.match(/https?:\/\/([a-z0-9-]+)\.60sec\.shop/);
                    if (match && !['api', 'www', 'super-admin'].includes(match[1])) subdomain = match[1];
                }
            }

            if (!subdomain) {
                const referer = req.headers['referer'] as string;
                if (referer) {
                    const match = referer.match(/https?:\/\/([a-z0-9-]+)\.60sec\.shop/);
                    if (match && !['api', 'www', 'super-admin'].includes(match[1])) subdomain = match[1];
                }
            }

            if (!subdomain) {
                const patterns = [/^([a-z0-9-]+)\.60sec\.shop$/, /^([a-z0-9-]+)\.apex\.localhost$/, /^([a-z0-9-]+)\.localhost$/];
                for (const pattern of patterns) {
                    const match = host.match(pattern);
                    if (match) {
                        subdomain = match[1];
                        if (subdomain === 'api' || subdomain === 'www' || subdomain === 'super-admin') subdomain = null;
                        if (subdomain) break;
                    }
                }
            }

            if (!subdomain) return next();

            if (!/^[a-z0-9][a-z0-9-]{0,62}[a-z0-9]$/.test(subdomain)) {
                throw new ForbiddenException('Invalid subdomain format');
            }

            const tenantInfo = await this.getTenantInfo(subdomain);
            if (!tenantInfo) throw new ForbiddenException('Invalid tenant context');

            // [SEC] S2: Lazy Connection Pattern
            Object.defineProperty(req, 'dbClient', {
                get: async () => {
                    if (!client) {
                        client = await this.pool.connect();
                        // Safe concatenation - STRICTLY using UUID (id) for schema
                        const schemaName = 'tenant_' + tenantInfo.id;
                        await client.query(format('SET search_path TO %I, public', schemaName));
                    }
                    return client;
                },
                configurable: true
            });

            req.tenantId = tenantInfo.id;
            req.tenantSubdomain = tenantInfo.subdomain;
            req.tenantTier = tenantInfo.plan_id || 'basic';
            req.headers['x-apex-tenant-id'] = tenantInfo.id;
            req.headers['x-apex-tenant-subdomain'] = tenantInfo.subdomain;

            res.on('finish', cleanup);
            res.on('close', cleanup);
            res.on('error', cleanup);

            next();
        } catch (error: any) {
            if (client) cleanup();
            if (error instanceof ForbiddenException) throw error;
            this.logger.error(`Tenant resolution error: ${error.message}`);
            throw new ForbiddenException('Invalid tenant context');
        }
    }

    private async getTenantInfo(subdomain: string): Promise<any> {
        const result = await this.pool.query(
            'SELECT id, subdomain, plan_id, status FROM public.tenants WHERE subdomain = $1 AND deleted_at IS NULL',
            [subdomain]
        );
        if (result.rows.length === 0) return null;
        if (result.rows[0].status !== 'active') throw new ForbiddenException('Tenant store is not active');
        return result.rows[0];
    }
}

import { Injectable, NotFoundException, Logger, Inject } from '@nestjs/common';
import { Pool } from 'pg';
import { EncryptionService } from '@apex/encryption';
import { TenantQuery } from './tenant.dto';

@Injectable()
export class TenantsService {
    private readonly logger = new Logger(TenantsService.name);

    constructor(
        @Inject('DATABASE_POOL') private readonly pool: Pool,
        private readonly encryptionService: EncryptionService,
    ) { }

    async findAll(query: TenantQuery) {
        const { page = 1, limit = 10, search, status, plan } = query;
        const offset = (page - 1) * limit;
        const params: any[] = [];
        let sql = 'SELECT * FROM public.tenants WHERE deleted_at IS NULL';

        if (status) {
            params.push(status);
            sql += ` AND status = $${params.length}`;
        }
        if (plan) {
            params.push(plan);
            sql += ` AND plan_id = $${params.length}`;
        }
        if (search) {
            params.push(`%${search}%`);
            sql += ` AND (subdomain ILIKE $${params.length} OR name ILIKE $${params.length})`;
        }

        sql += ` ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
        const countSql = 'SELECT COUNT(*) FROM public.tenants WHERE deleted_at IS NULL';

        const result = await this.pool.query(sql, [...params, limit, offset]);
        const countRes = await this.pool.query(countSql);

        // [SEC] S7: Decrypt owner_email for authorized views
        const data = await Promise.all(result.rows.map(async (tenant: any) => {
            if (tenant.owner_email) {
                try {
                    tenant.owner_email = await this.encryptionService.decryptDbValue(tenant.owner_email);
                } catch (e: any) {
                    this.logger.error(`Failed to decrypt email for tenant ${tenant.id}: ${e.message}`);
                }
            }
            return tenant;
        }));

        return {
            data,
            pagination: {
                total: parseInt(countRes.rows[0].count),
                page,
                limit,
                totalPages: Math.ceil(parseInt(countRes.rows[0].count) / limit)
            }
        };
    }

    async findOne(id: string) {
        // [SEC] S2: Fixed SQL injection by adding $1 placeholder
        const result = await this.pool.query('SELECT * FROM public.tenants WHERE id = $1', [id]);
        if (result.rows.length === 0) throw new NotFoundException('Tenant not found');
        const tenant = result.rows[0];

        // [SEC] S7: Decrypt owner_email
        if (tenant.owner_email) {
            tenant.owner_email = await this.encryptionService.decryptDbValue(tenant.owner_email);
        }

        return tenant;
    }
}

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

        return {
            data: result.rows,
            pagination: {
                total: parseInt(countRes.rows[0].count),
                page,
                limit,
                totalPages: Math.ceil(parseInt(countRes.rows[0].count) / limit)
            }
        };
    }

    async findOne(id: string) {
        const result = await this.pool.query('SELECT * FROM public.tenants WHERE id = ', [id]);
        if (result.rows.length === 0) throw new NotFoundException('Tenant not found');
        return result.rows[0];
    }
}

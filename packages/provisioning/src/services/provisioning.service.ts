import { Injectable, Logger, BadRequestException, Inject, ConflictException } from '@nestjs/common';
import { Pool } from 'pg';
import { SchemaCreatorService } from './schema-creator.service';
import { DataSeederService } from './data-seeder.service';
import { TraefikRouterService } from './traefik-router.service';
import { CreateTenantDto } from '../dto/create-tenant.dto';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { EncryptionService } from '@apex/encryption';
import * as crypto from 'crypto';

@Injectable()
export class ProvisioningService {
    private readonly logger = new Logger(ProvisioningService.name);

    constructor(
        @Inject('DATABASE_POOL') private readonly pool: Pool,
        private readonly schemaCreator: SchemaCreatorService,
        private readonly dataSeeder: DataSeederService,
        private readonly traefikRouter: TraefikRouterService,
        private readonly eventEmitter: EventEmitter2,
        private readonly encryptionService: EncryptionService,
    ) { }

    async provisionTenant(dto: CreateTenantDto) {
        const startTime = Date.now();
        const { subdomain, ownerEmail, blueprintId = 'standard' } = dto;

        this.logger.log(`🚀 Starting provisioning for: ${subdomain}`);

        const client = await this.pool.connect();
        try {
            await client.query('BEGIN');

            // 🛡️ [SEC-L4] FIX-011: Race Condition Protection using Advisory Lock
            const lockId = crypto.createHash('md5').update(subdomain).digest().readInt32BE(0) & 0x7FFFFFFF;
            await client.query('SELECT pg_advisory_xact_lock($1)', [lockId]);

            // Re-check existence under lock
            const check = await client.query(
                'SELECT id FROM public.tenants WHERE subdomain = $1 FOR UPDATE',
                [subdomain]
            );
            if (check.rows.length > 0) {
                throw new ConflictException(`Subdomain "${subdomain}" is already taken`);
            }

            // 1. Register in Public Schema
            const id = crypto.randomUUID();
            const encryptedEmail = await this.encryptionService.encryptDbValue(ownerEmail);
            await client.query(
                `INSERT INTO public.tenants (id, name, subdomain, owner_email, status)
                 VALUES ($1, $2, $3, $4, 'provisioning')`,
                [id, dto.name || subdomain, subdomain, encryptedEmail]
            );
            const tenantId = id;

            // 2. Create Isolated Schema
            await this.schemaCreator.createSchema(tenantId);

            // 3. Seed Initial Data
            await this.dataSeeder.seedData(tenantId, blueprintId);

            // 4. Update Status to Active
            await client.query(
                "UPDATE public.tenants SET status = 'active', updated_at = NOW() WHERE id = $1",
                [tenantId]
            );

            await client.query('COMMIT');

            // 5. Update Traffic Routing
            await this.traefikRouter.addTenantRoute(subdomain);

            const duration = Date.now() - startTime;
            this.logger.log(`✅ Provisioning complete for ${subdomain} in ${duration}ms`);

            return {
                id: tenantId,
                subdomain,
                status: 'active',
                duration,
                adminUrl: `https://${subdomain}.60sec.shop/login`
            };
        } catch (error: any) {
            await client.query('ROLLBACK');
            this.logger.error(`❌ Provisioning failed for ${subdomain}: ${error.message}`);
            throw error;
        } finally {
            client.release();
        }
    }

    async validateSubdomain(subdomain: string): Promise<boolean> {
        const subdomainRegex = /^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?$/;
        if (!subdomainRegex.test(subdomain)) {
            throw new BadRequestException('Invalid subdomain format');
        }

        const reserved = ['api', 'www', 'mail', 'super-admin', 'admin', 'storefront'];
        if (reserved.includes(subdomain)) {
            throw new BadRequestException('Subdomain is reserved');
        }

        const result = await this.pool.query(
            'SELECT id FROM public.tenants WHERE subdomain = $1',
            [subdomain]
        );

        if (result.rows.length > 0) {
            throw new BadRequestException(`Subdomain "${subdomain}" is already taken`);
        }

        return true;
    }

    async validateEmail(email: string): Promise<boolean> {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            throw new BadRequestException('Invalid email format');
        }
        return true;
    }
}

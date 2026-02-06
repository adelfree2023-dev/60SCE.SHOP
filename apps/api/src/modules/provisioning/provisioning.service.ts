import { Injectable, Logger, Inject, ConflictException } from '@nestjs/common';
import { Pool } from 'pg';
import { IdentityService } from '../identity/identity.service';
import { MailService } from '../mail/mail.service';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { EncryptionService } from '@apex/encryption';
import * as crypto from 'crypto';
import format from 'pg-format';

@Injectable()
export class ProvisioningService {
    private readonly logger = new Logger(ProvisioningService.name);

    constructor(
        @Inject('DATABASE_POOL') private readonly pool: Pool,
        private readonly identityService: IdentityService,
        private readonly mailService: MailService,
        private readonly encryptionService: EncryptionService,
    ) { }

    async handleWebhookEvent(payload: any) {
        // Logic to extract data from Stripe event and trigger provisioning
        if (payload.type === 'checkout.session.completed') {
            const data = payload.data.object;
            const tenantData: CreateTenantDto = {
                subdomain: data.metadata.subdomain,
                ownerEmail: data.customer_details.email,
                storeName: data.metadata.storeName,
                planId: data.metadata.planId as any,
                blueprintId: data.metadata.blueprintId,
                password: data.metadata.initialPassword, // Encrypted in metadata?
            };
            return this.provisionTenant(tenantData);
        }
    }

    async provisionTenant(data: CreateTenantDto) {
        const { subdomain, ownerEmail, storeName, planId, blueprintId, password } = data;

        const client = await this.pool.connect();
        try {
            await client.query('BEGIN');

            // [CRITICAL-004] Deterministic Advisory Lock based on subdomain hash
            const lockId = crypto.createHash('sha256').update(subdomain).digest().readInt32BE(0);
            await client.query('SELECT pg_advisory_xact_lock($1)', [lockId]);

            // 1. Check if subdomain exists
            const existing = await client.query('SELECT id FROM public.tenants WHERE subdomain = $1', [subdomain]);
            if (existing.rows.length > 0) {
                throw new ConflictException('Subdomain already taken');
            }

            // [DRIFT-001] PII Encryption for ownerEmail
            const encryptedEmail = await this.encryptionService.encryptDbValue(ownerEmail);
            const emailHash = crypto.createHash('sha256').update(ownerEmail.toLowerCase()).digest('hex');

            // 2. Create Tenant record
            const tenantRes = await client.query(
                `INSERT INTO public.tenants (name, subdomain, status, plan_id, owner_email, owner_email_hash) 
                 VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
                [storeName, subdomain, 'provisioning', planId, encryptedEmail, emailHash]
            );
            const tenantId = tenantRes.rows[0].id;

            // 3. Create Schema - [SEC] S2: Using pg-format for safe identifier escaping
            // [STRICT] Schema name MUST be tenant_{uuid_with_underscores} per NUC-503
            const schemaName = `tenant_${tenantId.replace(/-/g, '_')}`;
            await client.query(format('CREATE SCHEMA %I', schemaName));

            // 4. Register Owner User
            const { user } = await this.identityService.register({
                email: ownerEmail,
                password,
                role: 'owner', // Corrected role to match architecture
                tenantId: tenantId
            }, client);

            // 5. Update Status & Commit
            // [LOGIC] Paid tenants auto-activate via Stripe Webhook (Pillar 3 standard)
            await client.query("UPDATE public.tenants SET status = 'active' WHERE id = $1", [tenantId]);
            await client.query('COMMIT');

            // 6. Send Welcome Email
            try {
                await this.mailService.sendVerificationEmail(ownerEmail, user.verificationToken);
            } catch (mailError: any) {
                this.logger.warn(`📧 Welcome email failed for ${ownerEmail}, but provisioning succeeded: ${mailError.message}`);
            }

            return { success: true, tenantId, userId: user.id };
        } catch (error: any) {
            await client.query('ROLLBACK');
            this.logger.error(`❌ Provisioning failed for ${subdomain}: ${error.message}`);
            throw error;
        } finally {
            client.release();
        }
    }
}

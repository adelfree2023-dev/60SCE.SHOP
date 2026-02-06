import { Injectable, Logger, Inject, ForbiddenException } from '@nestjs/common';
import { Pool } from 'pg';
import { EncryptionService } from '@apex/encryption';

@Injectable()
export class PiiSupportService {
    private readonly logger = new Logger(PiiSupportService.name);

    constructor(
        @Inject('DATABASE_POOL') private readonly pool: Pool,
        private readonly encryptionService: EncryptionService
    ) { }

    /**
     * [DRIFT-008] Audited PII Decryption
     * [SEC] S7: Enforces a Second-Factor gate (pii_authorized flag)
     * Every call is logged with the admin identity.
     */
    async decryptForSupport(request: any, tenantId: string, reason: string): Promise<string> {
        if (!request.pii_authorized) {
            this.logger.error(`🛑 UNAUTHORIZED PII ACCESS ATTEMPT: ${request.user?.id} on Tenant ${tenantId}`);
            throw new ForbiddenException('PII_SECOND_FACTOR_REQUIRED');
        }

        const adminId = request.user?.id || 'system';
        if (!reason || reason.length < 10) {
            throw new ForbiddenException('A valid reason (min 10 chars) is required for PII decryption');
        }

        try {
            // 1. Fetch encrypted data
            const res = await this.pool.query(
                'SELECT owner_email FROM public.tenants WHERE id = $1',
                [tenantId]
            );

            if (res.rows.length === 0) {
                throw new Error('Tenant not found');
            }

            const encryptedEmail = res.rows[0].owner_email;

            // 2. Decrypt
            const decryptedEmail = await this.encryptionService.decryptDbValue(encryptedEmail);

            // 3. FORENSIC AUDIT LOG
            // In a real system, this would go to a dedicated 'pii_access_logs' table
            this.logger.warn(`🔍 [PII-ACCESS] User ${adminId} decrypted PII for Tenant ${tenantId}. Reason: ${reason}`);

            await this.pool.query(
                'INSERT INTO public.audit_logs (action, actor_id, target_id, metadata) VALUES ($1, $2, $3, $4)',
                ['PII_DECRYPTION', adminId, tenantId, JSON.stringify({ reason, field: 'owner_email' })]
            ).catch((err: any) => this.logger.error(`Failed to write audit log: ${err.message}`));

            return decryptedEmail;
        } catch (error: any) {
            this.logger.error(`PII Decryption failed for tenant ${tenantId}: ${error.message}`);
            throw new Error('Could not decrypt PII');
        }
    }
}
